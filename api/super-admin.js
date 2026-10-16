import crypto from "node:crypto";
import fetch from "node-fetch";
import * as adminModule from "./admin.js";

const COOKIE = "suhail_sa_session";
const SESSION_SECONDS = 30 * 60;
const MAX_BODY_BYTES = 8 * 1024;
const attempts = new Map();

const FIREBASE_DB_URL = (
  process.env.FIREBASE_DB_URL ||
  process.env.FIREBASE_DATABASE_URL ||
  "https://ula-alif-default-rtdb.firebaseio.com"
).replace(/\/$/, "");
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Vary", "Cookie");
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function parseCookies(header = "") {
  const out = {};
  for (const item of header.split(";")) {
    const i = item.indexOf("=");
    if (i > 0) {
      try {
        out[item.slice(0, i).trim()] =
          decodeURIComponent(item.slice(i + 1).trim());
      } catch (_) {}
    }
  }
  return out;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verify(token, secret) {
  if (!token || typeof token !== "string" || token.length > 4096) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(parts[0])
    .digest("base64url");

  if (!safeEqual(parts[1], expected)) return null;

  try {
    const p = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8")
    );

    if (
      !p ||
      !["owner", "super_admin"].includes(p.role) ||
      !Number.isFinite(p.exp) ||
      p.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return p;
  } catch {
    return null;
  }
}

function cookieHeader(value, maxAge, secure) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function requestIsSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", chunk => {
      data += chunk;

      if (data.length > MAX_BODY_BYTES) {
        reject(new Error("Body too large"));
      }
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function isRateLimited(key) {
  const now = Date.now();
  const prior = attempts.get(key) || {
    count: 0,
    start: now
  };

  if (now - prior.start > 15 * 60 * 1000) {
    prior.count = 0;
    prior.start = now;
  }

  prior.count += 1;
  attempts.set(key, prior);

  return prior.count > 10;
}

async function dbGet(path) {
  const start = Date.now();

  try {
    const auth = FIREBASE_AUTH
      ? `?auth=${encodeURIComponent(FIREBASE_AUTH)}`
      : "";

    const res = await fetch(
      `${FIREBASE_DB_URL}/${path}.json${auth}`
    );

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        ok: false,
        data: null,
        latencyMs
      };
    }

    return {
      ok: true,
      data: await res.json(),
      latencyMs
    };
  } catch {
    return {
      ok: false,
      data: null,
      latencyMs: Date.now() - start
    };
  }
}

export default async function handler(req, res) {
  const action = String(
    (req.query && req.query.action) ||
    new URL(req.url, "http://local").searchParams.get("action") ||
    ""
  );

  const secure =
    process.env.NODE_ENV === "production" ||
    String(req.headers["x-forwarded-proto"] || "").includes("https");

  const acceptedPasswords = [
    process.env.SUPER_ADMIN_PASSWORD,
    process.env.ADMIN_SECRET
  ].filter(
    v => typeof v === "string" && v.length >= 8
  );

  const sessionSeed =
    process.env.SUPER_ADMIN_SESSION_SECRET || "";

  if (!acceptedPasswords.length || sessionSeed.length < 32) {
    return json(res, 503, {
      ok: false,
      error: "Super Admin Environment Variables configure nahi hain."
    });
  }

  const secret = crypto
    .createHash("sha256")
    .update("SuhailAI:SuperAdmin:Session:v2:")
    .update(sessionSeed)
    .digest();

  if (!requestIsSameOrigin(req)) {
    return json(res, 403, {
      ok: false,
      error: "Cross-origin request denied."
    });
  }

  if (action === "super_admin_auth") {
    if (req.method !== "POST") {
      return json(
        res,
        405,
        {
          ok: false,
          error: "Method not allowed."
        },
        { Allow: "POST" }
      );
    }

    const ip = String(
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown"
    )
      .split(",")[0]
      .trim();

    if (isRateLimited(ip)) {
      return json(res, 429, {
        ok: false,
        error: "Bahut zyada koshishein. Kuch der baad try karein."
      });
    }

    let body;

    try {
      body = await getBody(req);
    } catch {
      return json(res, 400, {
        ok: false,
        error: "Invalid request body."
      });
    }

    const supplied =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !supplied ||
      !acceptedPasswords.some(expected =>
        safeEqual(supplied, expected)
      )
    ) {
      return json(res, 401, {
        ok: false,
        error: "Admin session verify nahi hui."
      });
    }

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      role: "owner",
      permissions: [
        "super_admin:read",
        "super_admin:manage"
      ],
      iat: now,
      exp: now + SESSION_SECONDS,
      nonce: crypto.randomBytes(16).toString("hex")
    };

    const token = sign(payload, secret);

    return json(
      res,
      200,
      {
        ok: true,
        role: payload.role,
        permissions: payload.permissions,
        expiresAt: payload.exp * 1000
      },
      {
        "Set-Cookie": cookieHeader(
          token,
          SESSION_SECONDS,
          secure
        )
      }
    );
  }

  const cookies = parseCookies(
    req.headers.cookie || ""
  );

  const session = verify(
    cookies[COOKIE],
    secret
  );

  if (action === "super_admin_session") {
    if (req.method !== "GET") {
      return json(
        res,
        405,
        {
          ok: false,
          error: "Method not allowed."
        },
        { Allow: "GET" }
      );
    }

    if (!session) {
      return json(res, 401, {
        ok: false,
        error: "Valid Super Admin session required."
      });
    }

    return json(res, 200, {
      ok: true,
      role: session.role,
      permissions: session.permissions,
      expiresAt: session.exp * 1000
    });
  }

  if (action === "super_admin_logout") {
    if (req.method !== "POST") {
      return json(
        res,
        405,
        {
          ok: false,
          error: "Method not allowed."
        },
        { Allow: "POST" }
      );
    }

    return json(
      res,
      200,
      { ok: true },
      {
        "Set-Cookie": cookieHeader("", 0, secure)
      }
    );
  }

  if (!session) {
    return json(res, 401, {
      ok: false,
      error: "Session expire ho gayi hai. Admin verification dobara karein."
    });
  }

  if (action === "super_admin_dashboard") {
    if (req.method !== "GET") {
      return json(
        res,
        405,
        {
          ok: false,
          error: "Method not allowed."
        },
        { Allow: "GET" }
      );
    }

    const [
      usersRes,
      settingsRes,
      paymentsRes
    ] = await Promise.all([
      dbGet("users"),
      dbGet("system_settings"),
      dbGet("paymentRequests")
    ]);

    const allUsers = usersRes.data || {};

    let totalStudents = 0;
    let totalQuestions = 0;
    let blockedStudents = 0;

    const planBreakdown = {
      free: 0,
      plus: 0,
      pro: 0,
      ultra: 0
    };

    const now = Date.now();

    for (const phone in allUsers) {
      const u = allUsers[phone];

      if (!u || u.role === "admin") continue;

      totalStudents++;
      totalQuestions += Number(
        u.totalQuestions || 0
      );

      if (u.status === "blocked") {
        blockedStudents++;
      }

      let plan = String(
        u.plan || "free"
      ).toLowerCase();

      if (
        u.planExpiry &&
        now > Number(u.planExpiry)
      ) {
        plan = "free";
      }

      if (planBreakdown[plan] !== undefined) {
        planBreakdown[plan]++;
      }
    }

    const payments = paymentsRes.data || {};

    const pendingPayments =
      Object.values(payments).filter(
        p => p && p.status === "pending"
      ).length;

    const providerMap = {
      Groq: !!(
        process.env.GROQ_API_KEY ||
        process.env.GROQ_KEY
      ),
      Gemini: !!process.env.GEMINI_API_KEY,
      OpenRouter: !!process.env.OPENROUTER_KEY,
      Mistral: !!process.env.MISTRAL_KEY,
      Cerebras: !!process.env.CEREBRAS_KEY,
      SambaNova: !!process.env.SAMBANOVA_KEY,
      Cohere: !!process.env.COHERE_API_KEY,
      NVIDIA: !!process.env.NVIDIA_API_KEY
    };

    const configuredProviders =
      Object.entries(providerMap)
        .filter(([, v]) => v)
        .map(([name]) => name);

    return json(res, 200, {
      ok: true,
      connected: true,
      checkedAt: new Date().toISOString(),

      metrics: {
        totalStudents,
        blockedStudents,
        totalQuestions,
        pendingPayments,
        planBreakdown,

        dbConnected: usersRes.ok,
        dbLatencyMs: usersRes.latencyMs,

        configuredProvidersCount:
          configuredProviders.length,

        configuredProviders,
        providerMap,

        noticeActive: !!(
          settingsRes.data &&
          settingsRes.data.noticeActive
        )
      }
    });
  }

  if (action === "super_admin_proxy") {
    if (req.method !== "POST") {
      return json(
        res,
        405,
        {
          ok: false,
          error: "Method not allowed."
        },
        { Allow: "POST" }
      );
    }

    let body;

    try {
      body = await getBody(req);
    } catch {
      return json(res, 400, {
        ok: false,
        error: "Invalid request body."
      });
    }

    const allowed = new Set([
      "ai_chat_summary",
      "students_summary",
      "extend_plan",
      "toggle_block",
      "reset_daily_limit",
      "set_notice"
    ]);

    const targetAction =
      String(body.action || "");

    if (!allowed.has(targetAction)) {
      return json(res, 400, {
        ok: false,
        error: "Action allow-listed nahi hai."
      });
    }

    const adminHandler =
      adminModule.default || adminModule;

    if (typeof adminHandler !== "function") {
      return json(res, 503, {
        ok: false,
        error: "api/admin.js handler load nahi ho saka."
      });
    }

    const adminSecret =
      process.env.ADMIN_SECRET || "";

    if (!adminSecret) {
      return json(res, 503, {
        ok: false,
        error: "ADMIN_SECRET environment variable missing hai."
      });
    }

    const proxiedBody = {
      ...(
        body.params &&
        typeof body.params === "object" &&
        !Array.isArray(body.params)
          ? body.params
          : {}
      ),
      pass: adminSecret
    };

    const mockReq = {
      method: "POST",

      url:
        `/api/admin?action=${encodeURIComponent(targetAction)}`,

      query: {
        action: targetAction
      },

      body: proxiedBody,

      headers: {
        host: req.headers.host || "",
        origin: req.headers.origin || "",
        "x-forwarded-proto":
          req.headers["x-forwarded-proto"] || ""
      },

      socket: req.socket
    };

    const mockRes = {
      statusCode: 200,
      headers: {},
      output: "",

      setHeader(k, v) {
        this.headers[k] = v;
      },

      getHeader(k) {
        return this.headers[k];
      },

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(value) {
        this.output = JSON.stringify(value);
        return this;
      },

      send(value) {
        this.output =
          typeof value === "string"
            ? value
            : JSON.stringify(value);

        return this;
      },

      end(value = "") {
        if (value) {
          this.output = String(value);
        }
      }
    };

    try {
      await adminHandler(
        mockReq,
        mockRes
      );

      let result = {};

      try {
        result = JSON.parse(
          mockRes.output || "{}"
        );
      } catch {
        result = {
          success:
            mockRes.statusCode < 400,
          message:
            mockRes.output ||
            "Admin action completed."
        };
      }

      return json(
        res,
        mockRes.statusCode || 200,
        {
          ...result,
          proxied: true
        }
      );
    } catch (err) {
      return json(res, 502, {
        ok: false,
        error:
          "Admin action fail hua: " +
          String(
            err?.message ||
            "Server error"
          )
      });
    }
  }

  return json(res, 501, {
    ok: false,
    error:
      "Yeh action abhi server par configure nahi hai."
  });
}

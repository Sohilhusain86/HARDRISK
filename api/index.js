const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = (process.env.FIREBASE_DB_URL || process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";
const authParam = FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, "http://localhost");
  const action = (req.query && req.query.action) || url.searchParams.get("action") || (req.body && req.body.action) || "";
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) {}
  }

  try {
    // 1. AUTH / LOGIN HANDLER
    if (action === "auth") {
      const phone = (body.phone || "").trim();
      const roll = (body.roll || "").trim();
      const userPass = (body.userPass || "").trim();
      const name = (body.name || "").trim();
      const adminPass = (body.adminPass || "").trim();

      if (!phone || phone.length !== 10) {
        return res.status(400).json({ success: false, error: "10 ankon ka mobile number darj karein." });
      }

      // Admin Login Check
      if (adminPass && adminPass === ADMIN_SECRET) {
        const adminUser = {
          phone,
          name: name || "Master Admin",
          role: "admin",
          plan: "ultra",
          roll: roll || "9999",
          planExpiry: null
        };
        return res.status(200).json({ success: true, user: adminUser });
      }

      // Student Account in Firebase
      let existingUser = null;
      try {
        const r = await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`);
        existingUser = await r.json();
      } catch (_) {}

      if (existingUser) {
        if (existingUser.status === "blocked") {
          return res.status(403).json({ success: false, error: "Aapka account admin ki taraf se block hai." });
        }
        if (existingUser.password && existingUser.password !== userPass) {
          return res.status(401).json({ success: false, error: "Galat password! Dobara koshish karein." });
        }
        return res.status(200).json({ success: true, user: existingUser });
      } else {
        // Naya Registration
        const newUser = {
          phone,
          roll: roll || "4000",
          name: name || "Talib-e-Ilm",
          password: userPass,
          role: "student",
          plan: "free",
          createdAt: Date.now(),
          planExpiry: null,
          status: "active"
        };
        try {
          await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
          });
        } catch (_) {}
        return res.status(200).json({ success: true, user: newUser });
      }
    }

    // 2. GET PROFILE
    if (action === "get_profile") {
      const phone = (body.phone || "").trim();
      if (!phone) return res.status(400).json({ success: false, error: "Phone number zaroori hai." });
      try {
        const r = await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`);
        const user = await r.json();
        return res.status(200).json({ success: true, user });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // 3. NOTICE
    if (action === "get-notice") {
      try {
        const r = await fetch(`${FIREBASE_DB_URL}/global_notice.json${authParam}`);
        const n = await r.json();
        if (n && n.isActive && n.notice) {
          return res.status(200).json({ success: true, notice: n.notice });
        }
      } catch (_) {}
      return res.status(200).json({ success: true, notice: "" });
    }

    // 4. AI CHAT HANDLER
    if (action === "ai") {
      const prompt = body.prompt || "";
      const reply = `Assalamu Alaikum! Aapka sawal mila: "${prompt.slice(0, 80)}..."\n\nAlhamdulillah, Suhail AI system theek taur par muttasil hai.`;
      return res.status(200).json({ success: true, reply, aiName: "SUHAIL AI" });
    }

    return res.status(200).json({ success: true, message: "API active" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

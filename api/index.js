import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Environment Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const SILICONFLOW_KEY = process.env.SILICONFLOW_KEY || "";
const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "";

// Active Production Models
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const GROQ_PRO_MODEL = process.env.GROQ_PRO_MODEL || "openai/gpt-oss-120b";
const ULTRA_MODEL = process.env.ULTRA_MODEL || "deepseek-ai/DeepSeek-V4-Flash";

function hashPassword(pass) {
  return crypto.createHash("sha256").update(String(pass).trim()).digest("hex");
}

async function dbGet(path) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

async function dbPut(path, data) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function dbPatch(path, data) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

function normalizePlan(rawPlan) {
  const p = String(rawPlan || "free").toLowerCase().trim();
  if (p === "plus" || p === "monthly") return "plus";
  if (p === "pro") return "pro";
  if (p === "ultra" || p === "allama" || p === "yearly") return "ultra";
  return "free";
}

// 1. FREE: Gemini
async function callGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) throw { userMsg: "SUHAIL AI FREE ki GEMINI_API_KEY Vercel me nahi mili.", code: 500 };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${systemInstruction}\n\nSawal: ${prompt}` }] }] })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: "SUHAIL AI FREE ki request limit is waqt poori ho gayi hai. 15 second baad dobara koshish karein.", code: 429 };
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// 2. PLUS: Mistral / SiliconFlow Fallback
async function callMistral(prompt, systemInstruction) {
  if (MISTRAL_KEY) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${MISTRAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }
  if (SILICONFLOW_KEY) {
    const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SILICONFLOW_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  }
  throw { userMsg: "SUHAIL AI PLUS is samay uplabdha nahi hai. Kripya thodi der baad prayas karein.", code: 500 };
}

// 3. PRO: Groq
async function callGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) throw { userMsg: "SUHAIL AI PRO ki GROQ_KEY Vercel me nahi mili.", code: 500 };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_PRO_MODEL,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
      temperature: 0.4
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) throw { userMsg: "SUHAIL AI PRO service me takneeki kharabi aayi.", code: 500 };
  return data?.choices?.[0]?.message?.content;
}

// 4. ULTRA: SiliconFlow Flagship (DeepSeek V4) / Cerebras Fallback
async function callUltra(prompt, systemInstruction) {
  if (SILICONFLOW_KEY) {
    try {
      const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${SILICONFLOW_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ULTRA_MODEL,
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.3
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }
  // Groq High-End fallback if SiliconFlow not active
  return await callGroq(prompt, systemInstruction);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query?.action || searchParams.get("action");

  try {
    if (action === "config" || action === "plans") {
      return res.status(200).json({
        success: true,
        plans: {
          free: { id: "free", name: "SUHAIL AI FREE", price: 0, duration: "Free" },
          plus: { id: "plus", name: "SUHAIL AI PLUS", price: 10, duration: "30 Days" },
          pro: { id: "pro", name: "SUHAIL AI PRO", price: 25, duration: "30 Days" },
          ultra: { id: "ultra", name: "SUHAIL AI ULTRA", price: 50, duration: "30 Days" }
        }
      });
    }

    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "10 ankon ka mobile number darj karein." });

      if (adminPass && adminPass === ADMIN_SECRET) {
        let adminUser = await dbGet(`users/${cleanPhone}`);
        if (!adminUser) {
          adminUser = { phone: cleanPhone, name: name || "Master Admin", role: "admin", plan: "ultra", planExpiry: null, status: "active" };
          await dbPut(`users/${cleanPhone}`, adminUser);
        } else {
          adminUser.role = "admin";
          adminUser.plan = "ultra";
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "ultra", planExpiry: null });
        }
        delete adminUser.password;
        delete adminUser.passwordHash;
        return res.status(200).json({ success: true, user: adminUser, isAdmin: true });
      }

      const rollNum = parseInt(roll, 10);
      if (isNaN(rollNum) || rollNum < 4000 || rollNum > 9999) {
        return res.status(400).json({ success: false, error: "Roll number 4000 se 9999 tak hona anivarya hai." });
      }

      if (!userPass || String(userPass).length < 6) {
        return res.status(400).json({ success: false, error: "Password kam se kam 6 characters ka hona anivarya hai." });
      }

      const passHash = hashPassword(userPass);
      let user = await dbGet(`users/${cleanPhone}`);

      if (!user) {
        if (!name || !name.trim()) return res.status(400).json({ success: false, error: "Kripya apna naam darj karein." });
        user = { phone: cleanPhone, name: name.trim(), roll: String(rollNum), passwordHash: passHash, role: "student", plan: "free", planExpiry: null, createdAt: Date.now(), status: "active" };
        await dbPut(`users/${cleanPhone}`, user);
        delete user.passwordHash;
        return res.status(200).json({ success: true, user, isNew: true });
      } else {
        const isMatch = user.passwordHash ? (user.passwordHash === passHash) : (user.password === String(userPass).trim());
        if (!isMatch) return res.status(401).json({ success: false, error: "Galat password!" });
        if (!user.passwordHash) await dbPatch(`users/${cleanPhone}`, { passwordHash: passHash });
        user.plan = normalizePlan(user.plan);
        delete user.passwordHash;
        return res.status(200).json({ success: true, user });
      }
    }

    if (action === "get_profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "User nahi mila." });

      user.plan = normalizePlan(user.plan);
      if (user.role !== "admin" && user.planExpiry && Date.now() > user.planExpiry) {
        user.plan = "free";
        user.planExpiry = null;
        await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
      }
      delete user.passwordHash;
      return res.status(200).json({ success: true, user });
    }

    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt || !String(prompt).trim()) return res.status(400).json({ success: false, error: "Sawal khali nahi ho sakta." });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      let plan = "free";
      if (user?.role === "admin") {
        plan = "ultra";
      } else if (user) {
        plan = normalizePlan(user.plan);
        if (user.planExpiry && Date.now() > user.planExpiry) {
          plan = "free";
          await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
        }
      }

      let aiName = "SUHAIL AI FREE";
      let replyText = "";

      const academicInstruction = `Aapka official naam '{AI_NAME}' hai.
Aap Suhail AI study platform ke sanjeeda ustaad hain.
Niyam:
1. Shuruat hamesha 'अस्सलामु अलैकुम व रहमतुल्लाह' se karein.
2. Kabhi bhi 'Namaste' ya gair-Islami adab istemal na karein.
3. Kisi bahari model/company ka naam na lein. Pehchan puchne par 'Main {AI_NAME} hoon' kahein.
4. Talib ko Nahw, Sarf, Arabic, Urdu, English, Maths, Science aur Dars-e-Nizami me behtareen padhai karwayen.`;

      if (plan === "ultra") {
        aiName = "SUHAIL AI ULTRA";
        replyText = await callUltra(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "pro") {
        aiName = "SUHAIL AI PRO";
        replyText = await callGroq(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "plus") {
        aiName = "SUHAIL AI PLUS";
        replyText = await callMistral(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else {
        aiName = "SUHAIL AI FREE";
        replyText = await callGemini(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const normPlan = normalizePlan(plan);
      if (!cleanPhone || !utr || cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "Details sahi bharein." });

      const amounts = { plus: 10, pro: 25, ultra: 50 };
      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan: normPlan,
        amount: amounts[normPlan] || 0,
        utr: String(utr).trim(),
        status: "pending",
        createdAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "Darkhwast darj ho gayi hai. Admin tasdeeq ke baad unlock ho jayega." });
    }

    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) return res.status(401).json({ success: false, error: "Galat Admin Password." });

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        const canonicalPlan = normalizePlan(targetPlan);
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`payment_requests/${requestId}`, { status: "approved", approvedAt: Date.now() });
        await dbPatch(`users/${targetPhone}`, { plan: canonicalPlan, planExpiry: expiryDate });
        return res.status(200).json({ success: true, message: `${canonicalPlan.toUpperCase()} plan 30 dino ke liye activate ho gaya.` });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, { status: "rejected", rejectedAt: Date.now() });
        return res.status(200).json({ success: true, message: "Darkhwast kharij kar di gayi." });
      }
    }

    return res.status(404).json({ success: false, error: "Amanay action." });
  } catch (err) {
    return res.status(err.code || 500).json({ success: false, error: err.userMsg || err.message || "Server Error", code: err.code || 500 });
  }
}

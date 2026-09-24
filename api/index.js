const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Vercel Environment Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";

async function dbGet(path) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
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

// -------------------------------------------------------------
// 3 TIER AI ENGINES: GEMINI -> MISTRAL -> GROQ
// -------------------------------------------------------------

// Tier 1: Free Plan -> Google Gemini
async function callGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) throw new Error("Gemini API Key उपलब्ध नहीं है।");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\nछात्र का सवाल: ${prompt}` }] }]
    })
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || "Gemini से जवाब नहीं मिला।");
  return text;
}

// Tier 2: Pro Monthly (₹10 Offer) -> Mistral (मध्यम व संतुलित)
async function callMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) return await callGemini(prompt, systemInstruction);
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-medium-latest",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(data?.message || "Mistral से जवाब नहीं मिला।");
  return text;
}

// Tier 3: Aalim Yearly (₹50 Mega Offer) -> Groq (अत्यंत तीव्र गति)
async function callGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) return await callMistral(prompt, systemInstruction);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.6
    })
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(data?.error?.message || "Groq से जवाब नहीं मिला।");
  return text;
}

// -------------------------------------------------------------
// MAIN SERVERLESS HANDLER
// -------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query?.action || searchParams.get("action");

  try {
    // 1. CONFIG & PLANS
    if (action === "config" || action === "plans") {
      return res.status(200).json({
        success: true,
        plans: {
          free: { name: "Free / तालिब", price: 0, originalPrice: 0, dailyLimit: 10, engine: "Google Gemini" },
          monthly: { name: "Pro Monthly", price: 10, originalPrice: 150, dailyLimit: 150, engine: "Mistral AI" },
          yearly: { name: "Aalim Yearly", price: 50, originalPrice: 999, dailyLimit: 1000, engine: "Groq Fast Engine" }
        }
      });
    }

    // 2. AUTHENTICATION & LOGIN / REGISTER
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ error: "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।" });

      // एडमिन लॉगिन (SuhailAiJamia)
      if (adminPass && adminPass === ADMIN_SECRET) {
        let adminUser = await dbGet(`users/${cleanPhone}`);
        if (!adminUser) {
          adminUser = { phone: cleanPhone, name: name || "Master Admin", role: "admin", plan: "yearly", status: "active" };
          await dbPut(`users/${cleanPhone}`, adminUser);
        } else if (adminUser.role !== "admin") {
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "yearly" });
          adminUser.role = "admin";
        }
        return res.status(200).json({ success: true, user: adminUser, isAdmin: true });
      }

      if (!userPass || String(userPass).length < 4) {
        return res.status(400).json({ error: "कम से कम 4 अंकों का पर्सनल पासवर्ड दर्ज करें।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) {
        if (!name) return res.status(400).json({ error: "पहली बार जुड़ने पर अपना नाम दर्ज करें।" });
        user = {
          phone: cleanPhone,
          name: name.trim(),
          roll: roll ? roll.trim() : "",
          password: String(userPass).trim(),
          role: "student",
          plan: "free",
          createdAt: Date.now(),
          status: "active"
        };
        await dbPut(`users/${cleanPhone}`, user);
        delete user.password;
        return res.status(200).json({ success: true, user, isNew: true });
      } else {
        if (user.password && String(user.password).trim() !== String(userPass).trim()) {
          return res.status(401).json({ error: "गलत पासवर्ड! सही पासवर्ड डालें या 'Forgot Password' करें।" });
        }
        if (!user.password) await dbPatch(`users/${cleanPhone}`, { password: String(userPass).trim() });
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
    }

    // 3. FORGOT / RESET PASSWORD
    if (action === "forgot" && req.method === "POST") {
      const { phone, verify, newPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ error: "10 अंकों का मोबाइल नंबर दर्ज करें।" });
      if (!newPass || String(newPass).length < 4) return res.status(400).json({ error: "नया पासवर्ड कम से कम 4 अक्षरों का रखें।" });

      const user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ error: "खाता नहीं मिला।" });

      const checkVal = String(verify || "").trim().toLowerCase();
      const dbRoll = String(user.roll || "").trim().toLowerCase();
      const dbName = String(user.name || "").trim().toLowerCase();

      const match = (checkVal && dbRoll && checkVal === dbRoll) || (checkVal && dbName && (dbName.includes(checkVal) || checkVal.includes(dbName)));
      if (!match) return res.status(403).json({ error: "सत्यापन विफल! सही नाम या रोल नंबर दर्ज करें।" });

      await dbPatch(`users/${cleanPhone}`, { password: String(newPass).trim() });
      return res.status(200).json({ success: true, message: "पासवर्ड बदल दिया गया! अब लॉगिन करें।" });
    }

    // 4. PLAN-BASED ROUTING (Free -> Gemini | Pro -> Mistral | Aalim -> Groq)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone, mode } = req.body || {};
      if (!prompt) return res.status(400).json({ error: "सवाल खाली नहीं हो सकता।" });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;
      const userPlan = user?.plan || "free";

      const systemInstruction = mode === "arabic"
        ? "आप एक माहिर दरसे निज़ामी उस्ताद हैं। नह्व, सर्फ़ और अरबी इबारत का जवाब आसान उर्दू/हिन्दी में दें।"
        : "आप सुहैल AI स्टडी असिस्टेंट हैं। छात्र के सवाल का सटीक, सरल और उपयोगी उत्तर दें।";

      let reply = "";

      // Tier 1: Free Plan -> Google Gemini
      if (userPlan === "free") {
        try {
          reply = await callGemini(prompt, systemInstruction);
        } catch (e) {
          reply = await callGroq(prompt, systemInstruction);
        }
      }
      // Tier 2: Pro Monthly (₹10 Offer) -> Mistral
      else if (userPlan === "monthly") {
        try {
          reply = await callMistral(prompt, systemInstruction);
        } catch (e) {
          reply = await callGroq(prompt, systemInstruction);
        }
      }
      // Tier 3: Aalim Yearly (₹50 Mega Offer) / Admin -> Groq
      else {
        try {
          reply = await callGroq(prompt, systemInstruction);
        } catch (e) {
          reply = await callMistral(prompt, systemInstruction);
        }
      }

      return res.status(200).json({ success: true, reply, engineUsed: userPlan });
    }

    // 5. MANUAL PAYMENT
    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || !plan || !utr) return res.status(400).json({ error: "सभी विवरण अनिवार्य हैं।" });

      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan,
        utr: String(utr).trim(),
        status: "pending",
        submittedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "अनुरोध एडमिन को भेज दिया गया।" });
    }

    // 6. ADMIN CONTROL
    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) return res.status(401).json({ error: "गलत एडमिन पासवर्ड।" });

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        await dbPatch(`payment_requests/${requestId}`, { status: "approved" });
        await dbPatch(`users/${targetPhone}`, { plan: targetPlan });
        return res.status(200).json({ success: true, message: "प्लान एक्टिवेट हो गया!" });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, { status: "rejected" });
        return res.status(200).json({ success: true, message: "अनुरोध खारिज किया गया।" });
      }
    }

    return res.status(404).json({ error: "अमान्य एंडपॉइंट" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}

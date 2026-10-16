const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = (process.env.FIREBASE_DB_URL || process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";
const authParam = FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : "";

// AI API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function callAiService(userPrompt, history = []) {
  // 1. Agar Groq Key maujood ho
  if (GROQ_API_KEY) {
    try {
      const messages = [
        { role: "system", content: "Aap Suhail AI hain - Dars-e-Nizami, Arabic, Urdu, Fiqh aur Taleemi masail ke liye ek ba-adab, sanjeeda aur mufeed AI companion. User ki zaban (Urdu, Roman Urdu, Hindi ya English) me behtareen aur wazeh jawab dein." },
        ...history.slice(-4),
        { role: "user", content: userPrompt }
      ];
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.6
        })
      });
      const d = await r.json();
      if (d.choices && d.choices[0] && d.choices[0].message) {
        return d.choices[0].message.content;
      }
    } catch (_) {}
  }

  // 2. Agar Gemini Key maujood ho
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      });
      const d = await r.json();
      if (d.candidates && d.candidates[0]?.content?.parts?.[0]?.text) {
        return d.candidates[0].content.parts[0].text;
      }
    } catch (_) {}
  }

  // 3. Fallback Clean Response agar key na ho
  return "Assalamu Alaikum wa Rahmatullahi wa Barakatuh! Main aapka Suhail AI Study Partner hoon. Padhai, Dars-e-Nizami ya kisi bhi mas'ale par apna sawal poochein.";
}

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

      if (adminPass && adminPass === ADMIN_SECRET) {
        return res.status(200).json({
          success: true,
          user: { phone, name: name || "Master Admin", role: "admin", plan: "ultra", roll: roll || "9999", planExpiry: null }
        });
      }

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

    // 4. REAL AI CHAT
    if (action === "ai") {
      const prompt = body.prompt || "";
      const history = body.history || [];
      const reply = await callAiService(prompt, history);
      return res.status(200).json({ success: true, reply, aiName: "SUHAIL AI" });
    }

    return res.status(200).json({ success: true, message: "API active" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

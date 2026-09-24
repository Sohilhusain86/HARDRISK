const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Keys from Vercel
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";

// Configured Model IDs
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-2603";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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
// 1. FREE TIER: GOOGLE GEMINI (gemini-3.8-flash)
// -------------------------------------------------------------
async function callGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY सेट नहीं है।");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\nसवाल: ${prompt}` }] }]
    })
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(data?.error?.message || "Suhail AI Free से उत्तर प्राप्त नहीं हुआ।");
  }
  return text;
}

// -------------------------------------------------------------
// 2. PLUS TIER (₹10): MISTRAL AI (mistral-small-2603)
// -------------------------------------------------------------
async function callMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) throw new Error("MISTRAL_KEY सेट नहीं है।");
  
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(data?.message || "Suhail AI Plus से उत्तर प्राप्त नहीं हुआ।");
  }
  return text;
}

// -------------------------------------------------------------
// 3. PRO TIER (₹50) & ADMIN: GROQ (openai/gpt-oss-120b)
// -------------------------------------------------------------
async function callGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) throw new Error("GROQ_KEY सेट नहीं है।");
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.5
    })
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(data?.error?.message || "Suhail AI Pro से उत्तर प्राप्त नहीं हुआ।");
  }
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
    // 1. AUTHENTICATION & LOGIN
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।" });
      }

      // मास्टर एडमिन बाईपास: एडमिन सीधे Pro टियर पर रहेगा
      if (adminPass && adminPass === ADMIN_SECRET) {
        let adminUser = await dbGet(`users/${cleanPhone}`);
        if (!adminUser) {
          adminUser = {
            phone: cleanPhone,
            name: name || "Master Admin",
            role: "admin",
            plan: "pro",
            status: "active"
          };
          await dbPut(`users/${cleanPhone}`, adminUser);
        } else {
          adminUser.role = "admin";
          adminUser.plan = "pro";
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "pro" });
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
          return res.status(401).json({ error: "गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।" });
        }
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
    }

    // 2. LIVE PROFILE SYNC
    if (action === "get_profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = await dbGet(`users/${cleanPhone}`);
      if (user) {
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
    }

    // 3. AI QUERY (IDENTITY + TIER ROUTING)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt) return res.status(400).json({ error: "सवाल खाली नहीं हो सकता।" });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;
      const userPlan = (user?.role === "admin") ? "pro" : (user?.plan || "free");

      let aiName = "Suhail AI Free";
      let systemInstruction = "";
      let reply = "";

      if (userPlan === "pro" || userPlan === "yearly") {
        aiName = "Suhail AI Pro";
        systemInstruction = `Aapka naam '${aiName}' hai. Agar koi aapke bare me puche to kahein ki "Main Suhail AI Pro hoon, jo Groq engine (${GROQ_MODEL}) dwara sanchalit hai." Har sawal ka sarvashreshth aur spasht jawab dein.`;
        reply = await callGroq(prompt, systemInstruction);
      } else if (userPlan === "plus" || userPlan === "monthly") {
        aiName = "Suhail AI Plus";
        systemInstruction = `Aapka naam '${aiName}' hai. Agar koi aapke bare me puche to kahein ki "Main Suhail AI Plus hoon, jo Mistral engine (${MISTRAL_MODEL}) dwara sanchalit hai." Har sawal ka vistrit aur saaf jawab dein.`;
        reply = await callMistral(prompt, systemInstruction);
      } else {
        aiName = "Suhail AI Free";
        systemInstruction = `Aapka naam '${aiName}' hai. Agar koi aapke bare me puche to kahein ki "Main Suhail AI Free hoon, jo Google Gemini engine (${GEMINI_MODEL}) dwara sanchalit hai."`;
        reply = await callGemini(prompt, systemInstruction);
      }

      return res.status(200).json({ success: true, reply, aiName });
    }

    // 4. MANUAL PAYMENT REQUEST
    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || !plan || !utr) return res.status(400).json({ error: "सभी विवरण भरें।" });

      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan,
        utr: String(utr).trim(),
        status: "pending",
        submittedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "अनुरोध दर्ज हो गया है।" });
    }

    // 5. ADMIN CONTROL PANEL
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
        return res.status(200).json({ success: true, message: `प्लान ${targetPlan.toUpperCase()} एक्टिवेट किया गया!` });
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

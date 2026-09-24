const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

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
// SECURE AI CALLERS (Internal Connections)
// -------------------------------------------------------------

async function callInternalGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) throw new Error("इंजन उपलब्ध नहीं है।");
  const models = ["llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"];
  for (const m of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.5
        })
      });
      const data = await res.json();
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }
  throw new Error("इंजन अभी व्यस्त है।");
}

async function callInternalMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) return await callInternalGroq(prompt, systemInstruction);
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${MISTRAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  } catch (e) {}
  return await callInternalGroq(prompt, systemInstruction);
}

async function callInternalGemini(prompt, systemInstruction) {
  if (GEMINI_KEY) {
    const models = ["gemini-1.5-flash", "gemini-2.5-flash"];
    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: `${systemInstruction}\n\nसवाल: ${prompt}` }] }] })
        });
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {}
    }
  }
  // Spikes या High Demand होने पर सुरक्षित फ़ॉलबैक
  return await callInternalGroq(prompt, systemInstruction);
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
    // 1. AUTH & VALIDATION
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।" });
      }

      // मास्टर एडमिन लॉगिन (लाइफटाइम ऑलमा एक्सेस)
      if (adminPass && adminPass === ADMIN_SECRET) {
        let adminUser = await dbGet(`users/${cleanPhone}`);
        if (!adminUser) {
          adminUser = {
            phone: cleanPhone,
            name: name || "Master Admin",
            role: "admin",
            plan: "allama",
            planExpiry: null,
            status: "active"
          };
          await dbPut(`users/${cleanPhone}`, adminUser);
        } else {
          adminUser.role = "admin";
          adminUser.plan = "allama";
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "allama", planExpiry: null });
        }
        return res.status(200).json({ success: true, user: adminUser, isAdmin: true });
      }

      // रोल नंबर सत्यापन (4000 से 9999 अनिवार्य)
      const rollNum = parseInt(roll, 10);
      if (isNaN(rollNum) || rollNum < 4000 || rollNum > 9999) {
        return res.status(400).json({ error: "रोल नंबर 4000 से 9999 के बीच (सटीक 4 अंक) होना अनिवार्य है।" });
      }

      // 6 अंकों का पासवर्ड सत्यापन
      if (!userPass || String(userPass).length < 6) {
        return res.status(400).json({ error: "सुरक्षा के लिए पर्सनल पासवर्ड कम से कम 6 अंकों/अक्षरों का होना चाहिए।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) {
        if (!name) return res.status(400).json({ error: "पहली बार जुड़ने पर अपना नाम दर्ज करें।" });
        user = {
          phone: cleanPhone,
          name: name.trim(),
          roll: String(rollNum),
          password: String(userPass).trim(),
          role: "student",
          plan: "free",
          planExpiry: null,
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

    // 2. LIVE PROFILE SYNC & 30 DAYS EXPIRY ENGINE
    if (action === "get_profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = await dbGet(`users/${cleanPhone}`);
      if (user) {
        // 30 दिन की मुद्दत समाप्त होने की जाँच
        if (user.role !== "admin" && user.planExpiry && Date.now() > user.planExpiry) {
          user.plan = "free";
          user.planExpiry = null;
          await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
        }
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
    }

    // 3. AI QUERY ROUTING (तहज़ीब व इस्लामी पहचान)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt) return res.status(400).json({ error: "सवाल खाली नहीं हो सकता।" });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      // 30 दिन की मुद्दत का चेक
      let userPlan = user?.plan || "free";
      if (user?.role === "admin") {
        userPlan = "allama";
      } else if (user?.planExpiry && Date.now() > user?.planExpiry) {
        userPlan = "free";
        await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
      }

      let aiName = "Suhail AI Basit";
      let systemInstruction = "";
      let reply = "";

      // सामान्य इस्लामी व संजीदा निर्देश
      const baseIslamicPrompt = "आप 'सुहैल AI' एकेडमिक स्टडी पार्टनर हैं। आपकी ज़बान संजीदा, मोअद्दिब (adab-daar) और इस्लामी तहज़ीब के मुताबिक़ होनी चाहिए। बात की शुरुआत हमेशा 'अस्सलामु अलैकुम व रहमतुल्लाह' से करें। कभी भी 'नमस्ते' या ग़ैर-इस्लामी अल्फ़ाज़ इस्तेमाल न करें। बाहरी कंपनियों (Gemini, Mistral, Groq, Meta) का नाम बिल्कुल न लें। हर सवाल का सटीक, बा-अदब और बेहतरीन इल्मी जवाब दें।";

      if (userPlan === "allama") {
        aiName = "Suhail AI Allama";
        systemInstruction = `${baseIslamicPrompt} आप इस सिस्टम के सबसे आला दर्जे के 'Suhail AI Allama' हैं। अगर कोई आपकी पहचान पूछे तो कहें 'मैं Suhail AI Allama हूँ, आपके इल्मी व तहक़ीक़ी मसायल के हल के लिए हाज़िर हूँ।'`;
        reply = await callInternalGroq(prompt, systemInstruction);
      } else if (userPlan === "pro") {
        aiName = "Suhail AI Faaiq";
        systemInstruction = `${baseIslamicPrompt} आप 'Suhail AI Faaiq' हैं। अगर कोई पहचान पूछे तो कहें 'मैं Suhail AI Faaiq हूँ।'`;
        reply = await callInternalGroq(prompt, systemInstruction);
      } else if (userPlan === "plus") {
        aiName = "Suhail AI Mahir";
        systemInstruction = `${baseIslamicPrompt} आप 'Suhail AI Mahir' हैं। अगर कोई पहचान पूछे तो कहें 'मैं Suhail AI Mahir हूँ।'`;
        reply = await callInternalMistral(prompt, systemInstruction);
      } else {
        aiName = "Suhail AI Basit";
        systemInstruction = `${baseIslamicPrompt} आप 'Suhail AI Basit' हैं। अगर कोई पहचान पूछे तो कहें 'मैं Suhail AI Basit (तालिब टियर) हूँ।'`;
        reply = await callInternalGemini(prompt, systemInstruction);
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
        plan, // "plus", "pro", या "allama"
        utr: String(utr).trim(),
        status: "pending",
        submittedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "अनुरोध दर्ज हो गया है।" });
    }

    // 5. ADMIN CONTROL PANEL (30 Days Activation)
    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) return res.status(401).json({ error: "गलत एडमिन पासवर्ड।" });

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        // 30 दिन की मुद्दत (30 दिन = 30 * 24 * 60 * 60 * 1000 मिलीसेकंड)
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);

        await dbPatch(`payment_requests/${requestId}`, { status: "approved" });
        await dbPatch(`users/${targetPhone}`, { plan: targetPlan, planExpiry: expiryDate });
        return res.status(200).json({ success: true, message: `प्लान ${targetPlan.toUpperCase()} 30 दिनों के लिए एक्टिवेट कर दिया गया!` });
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
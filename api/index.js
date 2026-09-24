const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Keys from Vercel
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "";

// Active Production Model IDs
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const ALLAMA_MODEL = process.env.ALLAMA_MODEL || "llama3.1-70b";

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
  if (p === "plus" || p === "mahir" || p === "monthly") return "plus";
  if (p === "pro" || p === "faaiq") return "pro";
  if (p === "allama" || p === "yearly" || p === "master" || p === "super") return "allama";
  return "free";
}

// TIER 1: SUHAIL AI FREE -> Gemini
async function runGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) throw { userMsg: "SUHAIL AI FREE API Key अनुपलब्ध है।", code: 500 };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${systemInstruction}\n\nछात्र का सवाल: ${prompt}` }] }] })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: "SUHAIL AI FREE (Gemini) की दर सीमा (Rate Limit) पूरी हो गई है। कृपया 10 सेकंड बाद पुनः प्रयास करें।", code: res.status };
  }
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw { userMsg: "उत्तर प्राप्त नहीं हुआ।", code: 500 };
  return reply;
}

// TIER 2: SUHAIL AI PLUS -> Mistral
async function runMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) throw { userMsg: "SUHAIL AI PLUS API Key अनुपलब्ध है।", code: 500 };
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${MISTRAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: `SUHAIL AI PLUS (Mistral) सेवा में रुकावट: ${data.message || data.error?.message || res.statusText}`, code: res.status };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "उत्तर प्राप्त नहीं हुआ।", code: 500 };
  return reply;
}

// TIER 3: SUHAIL AI PRO -> Groq (वर्तमान में सक्रिय)
async function runGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) throw { userMsg: "SUHAIL AI PRO API Key अनुपलब्ध है।", code: 500 };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
      temperature: 0.4
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: `SUHAIL AI PRO सेवा में रुकावट: ${data.error?.message || "Service Busy"}`, code: res.status };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "उत्तर प्राप्त नहीं हुआ।", code: 500 };
  return reply;
}

// TIER 4: SUHAIL AI ALLAMA -> Cerebras Fast Engine (SambaNova 402 के स्थान पर)
async function runAllama(prompt, systemInstruction) {
  if (!CEREBRAS_KEY) throw { userMsg: "SUHAIL AI ALLAMA (Cerebras) Key अनुपलब्ध है।", code: 500 };
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ALLAMA_MODEL,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: `SUHAIL AI ALLAMA सेवा में रुकावट (${res.status}): ${data.error?.message || res.statusText}`, code: res.status };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "उत्तर प्राप्त नहीं हुआ।", code: 500 };
  return reply;
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
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "10 अंकों का मोबाइल नंबर दर्ज करें।" });

      if (adminPass && adminPass === ADMIN_SECRET) {
        let adminUser = await dbGet(`users/${cleanPhone}`);
        if (!adminUser) {
          adminUser = { phone: cleanPhone, name: name || "Master Admin", role: "admin", plan: "allama", planExpiry: null, status: "active" };
          await dbPut(`users/${cleanPhone}`, adminUser);
        } else {
          adminUser.role = "admin";
          adminUser.plan = "allama";
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "allama", planExpiry: null });
        }
        return res.status(200).json({ success: true, user: adminUser, isAdmin: true });
      }

      const rollNum = parseInt(roll, 10);
      if (isNaN(rollNum) || rollNum < 4000 || rollNum > 9999) {
        return res.status(400).json({ success: false, error: "रोल नंबर 4000 से 9999 के बीच होना अनिवार्य है।" });
      }

      if (!userPass || String(userPass).length < 6) {
        return res.status(400).json({ success: false, error: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) {
        if (!name || !name.trim()) return res.status(400).json({ success: false, error: "कृपया अपना नाम दर्ज करें।" });
        user = { phone: cleanPhone, name: name.trim(), roll: String(rollNum), password: String(userPass).trim(), role: "student", plan: "free", planExpiry: null, createdAt: Date.now(), status: "active" };
        await dbPut(`users/${cleanPhone}`, user);
        delete user.password;
        return res.status(200).json({ success: true, user, isNew: true });
      } else {
        if (user.password && String(user.password).trim() !== String(userPass).trim()) {
          return res.status(401).json({ success: false, error: "गलत पासवर्ड!" });
        }
        user.plan = normalizePlan(user.plan);
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
    }

    if (action === "get_profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "यूज़र नहीं मिला।" });

      user.plan = normalizePlan(user.plan);
      if (user.role !== "admin" && user.planExpiry && Date.now() > user.planExpiry) {
        user.plan = "free";
        user.planExpiry = null;
        await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
      }
      delete user.password;
      return res.status(200).json({ success: true, user });
    }

    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt || !String(prompt).trim()) return res.status(400).json({ success: false, error: "सवाल खाली नहीं हो सकता।" });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      let plan = "free";
      if (user?.role === "admin") {
        plan = "allama";
      } else if (user) {
        plan = normalizePlan(user.plan);
        if (user.planExpiry && Date.now() > user.planExpiry) {
          plan = "free";
          await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
        }
      }

      let aiName = "SUHAIL AI FREE";
      let replyText = "";

      const academicInstruction = `आप '{AI_NAME}' हैं। सुहैल AI स्टडी प्लेटफ़ॉर्म के उस्ताद हैं।
नियम:
1. बातचीत की शुरुआत 'अस्सलामु अलैकुम व रहमतुल्लाह' से करें।
2. केवल इस्लामी और शैक्षिक तहज़ीब के शब्दों का प्रयोग करें।
3. केवल शिक्षा और पढ़ाई से जुड़े सवालों का उत्तर दें।`;

      if (plan === "allama") {
        aiName = "SUHAIL AI ALLAMA";
        replyText = await runAllama(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "pro") {
        aiName = "SUHAIL AI PRO";
        replyText = await runGroq(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "plus") {
        aiName = "SUHAIL AI PLUS";
        replyText = await runMistral(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else {
        aiName = "SUHAIL AI FREE";
        replyText = await runGemini(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || !utr || cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "विवरण सही भरें।" });

      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan: normalizePlan(plan),
        utr: String(utr).trim(),
        status: "pending",
        submittedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "अनुरोध दर्ज किया गया।" });
    }

    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) return res.status(401).json({ success: false, error: "गलत एडमिन पासवर्ड।" });

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        const canonicalPlan = normalizePlan(targetPlan);
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`payment_requests/${requestId}`, { status: "approved", approvedAt: Date.now() });
        await dbPatch(`users/${targetPhone}`, { plan: canonicalPlan, planExpiry: expiryDate });
        return res.status(200).json({ success: true, message: "प्लान 30 दिनों के लिए चालू किया गया।" });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, { status: "rejected", rejectedAt: Date.now() });
        return res.status(200).json({ success: true, message: "अनुरोध खारिज किया गया।" });
      }
    }

    return res.status(404).json({ success: false, error: "अमान्य एंडपॉइंट" });
  } catch (err) {
    return res.status(err.code || 500).json({ success: false, error: err.userMsg || err.message || "तकनीकी त्रुटि।" });
  }
}

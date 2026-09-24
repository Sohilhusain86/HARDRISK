import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Vercel Environment Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "";

// Verified Official Production Models
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const GROQ_PRO_MODEL = process.env.GROQ_PRO_MODEL || "llama-3.3-70b-versatile";
const ALLAMA_MODEL = process.env.ALLAMA_MODEL || "llama-3.3-70b";

function hashPassword(pass) {
  return crypto.createHash("sha256").update(String(pass).trim()).digest("hex");
}

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

function normalizePlan(rawPlan) {
  const p = String(rawPlan || "free").toLowerCase().trim();
  if (p === "plus" || p === "monthly") return "plus";
  if (p === "pro") return "pro";
  if (p === "allama" || p === "yearly") return "allama";
  return "free";
}

// -------------------------------------------------------------
// 1. SUHAIL AI FREE (Google Gemini)
// -------------------------------------------------------------
async function callGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) {
    throw { userMsg: "SUHAIL AI FREE की API Key (GEMINI_API_KEY) Vercel में सेट नहीं है।", code: 500, provider: "Gemini" };
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\nतालिब का सवाल: ${prompt}` }] }]
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const errMsg = data.error?.message || res.statusText;
    console.error(`[Gemini Error] Status ${res.status}:`, errMsg);
    if (res.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate")) {
      throw { userMsg: "SUHAIL AI FREE की अनुरोध सीमा (Rate Limit) पूरी हो गई है। कृपया 15 सेकंड बाद पुनः प्रयास करें।", code: 429, provider: "Gemini" };
    }
    throw { userMsg: `SUHAIL AI FREE (Gemini) से त्रुटि (${res.status}): ${errMsg}`, code: res.status, provider: "Gemini" };
  }
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw { userMsg: "SUHAIL AI FREE से खाली उत्तर प्राप्त हुआ।", code: 500, provider: "Gemini" };
  return reply;
}

// -------------------------------------------------------------
// 2. SUHAIL AI PLUS (Mistral AI)
// -------------------------------------------------------------
async function callMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) {
    throw { userMsg: "SUHAIL AI PLUS की API Key (MISTRAL_KEY) Vercel में सेट नहीं है।", code: 500, provider: "Mistral" };
  }
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
  if (!res.ok || data.error) {
    const errMsg = data.message || data.error?.message || res.statusText;
    console.error(`[Mistral Error] Status ${res.status}:`, errMsg);
    throw { userMsg: `SUHAIL AI PLUS (Mistral) त्रुटि (${res.status}): ${errMsg}`, code: res.status, provider: "Mistral" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI PLUS से कोई उत्तर नहीं मिला।", code: 500, provider: "Mistral" };
  return reply;
}

// -------------------------------------------------------------
// 3. SUHAIL AI PRO (Groq Cloud)
// -------------------------------------------------------------
async function callGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) {
    throw { userMsg: "SUHAIL AI PRO की API Key (GROQ_KEY) Vercel में सेट नहीं है।", code: 500, provider: "Groq" };
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_PRO_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const errMsg = data.error?.message || res.statusText;
    console.error(`[Groq Error] Status ${res.status}:`, errMsg);
    throw { userMsg: `SUHAIL AI PRO (Groq) त्रुटि (${res.status}): ${errMsg}`, code: res.status, provider: "Groq" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI PRO से कोई उत्तर नहीं मिला।", code: 500, provider: "Groq" };
  return reply;
}

// -------------------------------------------------------------
// 4. SUHAIL AI ALLAMA (Cerebras)
// -------------------------------------------------------------
async function callCerebras(prompt, systemInstruction) {
  if (!CEREBRAS_KEY) {
    throw { userMsg: "SUHAIL AI ALLAMA की API Key (CEREBRAS_KEY) Vercel में सेट नहीं है।", code: 500, provider: "Cerebras" };
  }
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CEREBRAS_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ALLAMA_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const errMsg = data.error?.message || res.statusText;
    console.error(`[Cerebras Error] Status ${res.status}:`, errMsg);
    throw { userMsg: `SUHAIL AI ALLAMA (Cerebras) त्रुटि (${res.status}): ${errMsg}`, code: res.status, provider: "Cerebras" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI ALLAMA से कोई उत्तर नहीं मिला।", code: 500, provider: "Cerebras" };
  return reply;
}

// -------------------------------------------------------------
// MAIN SERVERLESS HANDLER
// -------------------------------------------------------------
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
          free: { id: "free", name: "SUHAIL AI FREE", price: 0, duration: "Free", provider: "Google Gemini", model: GEMINI_MODEL },
          plus: { id: "plus", name: "SUHAIL AI PLUS", price: 10, duration: "30 Days", provider: "Mistral AI", model: MISTRAL_MODEL },
          pro: { id: "pro", name: "SUHAIL AI PRO", price: 25, duration: "30 Days", provider: "Groq", model: GROQ_PRO_MODEL },
          allama: { id: "allama", name: "SUHAIL AI ALLAMA", price: 50, duration: "30 Days", provider: "Cerebras", model: ALLAMA_MODEL }
        }
      });
    }

    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।" });

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
        delete adminUser.password;
        delete adminUser.passwordHash;
        return res.status(200).json({ success: true, user: adminUser, isAdmin: true });
      }

      const rollNum = parseInt(roll, 10);
      if (isNaN(rollNum) || rollNum < 4000 || rollNum > 9999) {
        return res.status(400).json({ success: false, error: "रोल नंबर 4000 से 9999 के बीच (सटीक 4 अंक) होना अनिवार्य है।" });
      }

      if (!userPass || String(userPass).length < 6) {
        return res.status(400).json({ success: false, error: "पासवर्ड कम से कम 6 अक्षरों का होना अनिवार्य है।" });
      }

      const passHash = hashPassword(userPass);
      let user = await dbGet(`users/${cleanPhone}`);

      if (!user) {
        if (!name || !name.trim()) return res.status(400).json({ success: false, error: "कृपया अपना नाम दर्ज करें।" });
        user = {
          phone: cleanPhone,
          name: name.trim(),
          roll: String(rollNum),
          passwordHash: passHash,
          role: "student",
          plan: "free",
          planExpiry: null,
          createdAt: Date.now(),
          status: "active"
        };
        await dbPut(`users/${cleanPhone}`, user);
        delete user.passwordHash;
        delete user.password;
        return res.status(200).json({ success: true, user, isNew: true });
      } else {
        const isMatch = user.passwordHash 
          ? (user.passwordHash === passHash)
          : (user.password === String(userPass).trim());

        if (!isMatch) {
          return res.status(401).json({ success: false, error: "गलत पासवर्ड!" });
        }

        if (!user.passwordHash) {
          await dbPatch(`users/${cleanPhone}`, { passwordHash: passHash });
        }
        user.plan = normalizePlan(user.plan);
        delete user.passwordHash;
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

      delete user.passwordHash;
      delete user.password;
      return res.status(200).json({ success: true, user });
    }

    if (action === "forgot" && req.method === "POST") {
      const { phone, verify, newPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "10 अंकों का मोबाइल नंबर दर्ज करें।" });
      if (!newPass || String(newPass).length < 6) return res.status(400).json({ success: false, error: "नया पासवर्ड कम से कम 6 अक्षरों का रखें।" });

      const user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "इस नंबर से कोई खाता नहीं मिला।" });

      const checkVal = String(verify || "").trim().toLowerCase();
      const match = (checkVal && user.roll && checkVal === String(user.roll).toLowerCase()) ||
                    (checkVal && user.name && String(user.name).toLowerCase().includes(checkVal));

      if (!match) return res.status(403).json({ success: false, error: "सत्यापन विफल! सही नाम या रोल नंबर दर्ज करें।" });

      const newHash = hashPassword(newPass);
      await dbPatch(`users/${cleanPhone}`, { passwordHash: newHash });
      return res.status(200).json({ success: true, message: "पासवर्ड बदल दिया गया! अब लॉगिन करें।" });
    }

    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ success: false, error: "सवाल खाली नहीं हो सकता।" });
      }

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
      let modelUsed = GEMINI_MODEL;
      let replyText = "";

      const academicInstruction = `आप '{AI_NAME}' हैं।
सुहैल AI के तालीमी और स्टडी असिस्टेंट।
उद्देश्य: छात्र की पढ़ाई, परीक्षा तैयारी, अरबी ग्रामर (नह्व, सर्फ़), दरसे निज़ामी, उर्दू, हिन्दी, अंग्रेज़ी, गणित, विज्ञान, इस्लामिक स्टडीज़ और नोट्स में मदद करना।
नियम:
1. बातचीत की शुरुआत हमेशा 'अस्सलामु अलैकुम व रहमतुल्लाह' से करें।
2. कभी भी 'नमस्ते' या गैर-इस्लामी शब्दों का प्रयोग न करें।
3. किसी बाहरी कंपनी या मॉडल (Gemini, Mistral, Groq, Cerebras) का नाम न लें। पूछने पर कहें 'मैं {AI_NAME} हूँ'।
4. केवल तालीम और पढ़ाई से जुड़े सवालों का उत्तर दें।`;

      if (plan === "allama") {
        aiName = "SUHAIL AI ALLAMA";
        modelUsed = ALLAMA_MODEL;
        replyText = await callCerebras(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "pro") {
        aiName = "SUHAIL AI PRO";
        modelUsed = GROQ_PRO_MODEL;
        replyText = await callGroq(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "plus") {
        aiName = "SUHAIL AI PLUS";
        modelUsed = MISTRAL_MODEL;
        replyText = await callMistral(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else {
        aiName = "SUHAIL AI FREE";
        modelUsed = GEMINI_MODEL;
        replyText = await callGemini(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      }

      return res.status(200).json({
        success: true,
        reply: replyText,
        aiName: aiName,
        plan: plan,
        model: modelUsed
      });
    }

    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const normPlan = normalizePlan(plan);

      if (!cleanPhone || !utr || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "10 अंकों का मोबाइल नंबर और 12 अंकों का UTR दर्ज करें।" });
      }
      if (normPlan === "free") {
        return res.status(400).json({ success: false, error: "Free प्लान के लिए पेमेंट आवश्यक नहीं है।" });
      }

      const amounts = { plus: 10, pro: 25, allama: 50 };
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
      return res.status(200).json({ success: true, message: "अनुरोध दर्ज हो गया है।" });
    }

    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, error: "गलत एडमिन पासवर्ड।" });
      }

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        const canonicalPlan = normalizePlan(targetPlan);
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);

        await dbPatch(`payment_requests/${requestId}`, {
          status: "approved",
          approvedAt: Date.now()
        });
        await dbPatch(`users/${targetPhone}`, {
          plan: canonicalPlan,
          planExpiry: expiryDate
        });
        return res.status(200).json({
          success: true,
          message: `${canonicalPlan.toUpperCase()} प्लान 30 दिनों के लिए चालू किया गया।`
        });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, {
          status: "rejected",
          rejectedAt: Date.now()
        });
        return res.status(200).json({ success: true, message: "अनुरोध खारिज किया गया।" });
      }
    }

    return res.status(404).json({ success: false, error: "अमान्य एंडपॉइंट।" });
  } catch (err) {
    return res.status(err.code || 500).json({
      success: false,
      error: err.userMsg || err.message || "सर्वर पर तकनीकी समस्या आई।",
      code: err.code || "SERVER_ERROR",
      provider: err.provider || "Internal"
    });
  }
}

import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const SILICONFLOW_KEY = process.env.SILICONFLOW_KEY || "";

// Active Production Models
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const GROQ_PRO_MODEL = process.env.GROQ_PRO_MODEL || "openai/gpt-oss-120b";
const ULTRA_MODEL = process.env.ULTRA_MODEL || "deepseek-ai/DeepSeek-V4-Flash";

// STRICT DAILY LIMITS
const DAILY_LIMITS = {
  free: 10,
  plus: 150,
  pro: 500,
  ultra: 1000
};

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

// 1. FREE (Gemini)
async function callGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) throw { userMsg: "SUHAIL AI FREE की सेवा उपलब्ध नहीं है।", code: 500 };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${systemInstruction}\n\nतालिब का सवाल: ${prompt}` }] }] })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw { userMsg: "SUHAIL AI FREE की अनुरोध सीमा पूरी हो गई है। कृपया 15 सेकंड बाद पुनः प्रयास करें।", code: 429 };
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// 2. PLUS (Mistral with Verified Groq Failover)
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
    try {
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
    } catch (e) {}
  }
  // Groq Active Production Fallback (llama-3.3-70b-versatile)
  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.4
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }
  throw { userMsg: "SUHAIL AI PLUS सेवा इस समय व्यस्त है। कृपया पुनः प्रयास करें।", code: 500 };
}

// 3. PRO (Groq)
async function callGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) throw { userMsg: "SUHAIL AI PRO सेवा उपलब्ध नहीं है।", code: 500 };
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
  if (!res.ok || data.error) throw { userMsg: "SUHAIL AI PRO सेवा में समस्या आई।", code: 500 };
  return data?.choices?.[0]?.message?.content;
}

// 4. ULTRA (SiliconFlow Flagship DeepSeek / Failover)
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

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।" });

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
        return res.status(400).json({ success: false, error: "रोल नंबर 4000 से 9999 तक होना अनिवार्य है।" });
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
          totalQuestions: 0,
          dailyCount: 0,
          lastQuestionDate: "",
          lastActive: Date.now(),
          createdAt: Date.now(),
          status: "active"
        };
        await dbPut(`users/${cleanPhone}`, user);
        delete user.passwordHash;
        return res.status(200).json({ success: true, user, isNew: true });
      } else {
        const isMatch = user.passwordHash ? (user.passwordHash === passHash) : (user.password === String(userPass).trim());
        if (!isMatch) return res.status(401).json({ success: false, error: "गलत पासवर्ड!" });
        if (!user.passwordHash) await dbPatch(`users/${cleanPhone}`, { passwordHash: passHash });
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
      return res.status(200).json({ success: true, user });
    }

    // AI CHAT WITH STRICT DAILY QUOTA ENFORCEMENT
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt || !String(prompt).trim()) return res.status(400).json({ success: false, error: "सवाल खाली नहीं हो सकता।" });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      if (user && user.status === "blocked") {
        return res.status(403).json({ success: false, error: "आपका खाता निलंबित (Blocked) है। एडमिन से संपर्क करें।" });
      }

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

      // STRICT DAILY LIMIT BLOCKER
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const isNewDay = user?.lastQuestionDate !== todayDateStr;
      const currentDailyCount = isNewDay ? 0 : (user?.dailyCount || 0);
      const userLimit = DAILY_LIMITS[plan] || 10;

      if (user?.role !== "admin" && currentDailyCount >= userLimit) {
        return res.status(429).json({
          success: false,
          error: `आज के लिए आपकी सवाल सीमा समाप्त हो चुकी है (${currentDailyCount}/${userLimit} सवाल पूरे)। कृपया कल पुनः प्रयास करें या उच्च प्लान में अपग्रेड करें।`
        });
      }

      let aiName = "SUHAIL AI FREE";
      let replyText = "";

      const academicInstruction = `आप '{AI_NAME}' हैं।
सुहैल AI स्टडी प्लेटफ़ॉर्म के उस्ताद हैं।
नियम:
1. बातचीत की शुरुआत हमेशा 'अस्सलामु अलैकुम व रहमतुल्लाह' से करें।
2. कभी भी 'नमस्ते' या गैर-इस्लामी शब्दों का प्रयोग न करें।
3. किसी बाहरी कंपनी या मॉडल का नाम न लें। पूछने पर कहें 'मैं {AI_NAME} हूँ'।
4. केवल तालीम, पढ़ाई, दरसे निज़ामी, नह्व, सर्फ़, अरबी, उर्दू, अंग्रेज़ी, हिसाब और साइंस पर सटीक मदद करें।`;

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

      // अपडेट सवाल काउंटर
      if (cleanPhone && user) {
        dbPatch(`users/${cleanPhone}`, {
          totalQuestions: (user.totalQuestions || 0) + 1,
          dailyCount: currentDailyCount + 1,
          lastQuestionDate: todayDateStr,
          lastActive: Date.now()
        }).catch(() => {});
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const cleanUtr = String(utr || "").replace(/\D/g, "");
      const normPlan = normalizePlan(plan);

      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।" });
      }

      if (!cleanUtr || cleanUtr.length !== 12) {
        return res.status(400).json({ success: false, error: "अमान्य UTR! UTR ठीक 12 अंकों का होना अनिवार्य है।" });
      }

      if (normPlan === "free") {
        return res.status(400).json({ success: false, error: "Free प्लान के लिए पेमेंट की आवश्यकता नहीं है।" });
      }

      const amounts = { plus: 10, pro: 25, ultra: 50 };
      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan: normPlan,
        amount: amounts[normPlan] || 0,
        utr: cleanUtr,
        status: "pending",
        createdAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "पेमेंट अनुरोध दर्ज हो गया है। एडमिन मंज़ूरी के बाद 30 दिनों के लिए अनलॉक हो जाएगा।" });
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
        return res.status(200).json({ success: true, message: `${canonicalPlan.toUpperCase()} प्लान 30 दिनों के लिए चालू हो गया।` });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, { status: "rejected", rejectedAt: Date.now() });
        return res.status(200).json({ success: true, message: "अनुरोध खारिज किया गया।" });
      }
    }

    return res.status(404).json({ success: false, error: "अमान्य एक्शन।" });
  } catch (err) {
    return res.status(err.code || 500).json({ success: false, error: err.userMsg || err.message || "सर्वर त्रुटि", code: err.code || 500 });
  }
}

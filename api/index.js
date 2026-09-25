import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Active Production Keys
const GROQ_KEY = (process.env.GROQ_KEY || "").trim();
const OPENROUTER_KEY = (process.env.OPENROUTER_KEY || "").trim();
const POLLINATIONS_KEY = (process.env.POLLINATIONS_KEY || process.env.POLLINATION_KEY || "").trim();

// 1. GENERAL QUESTION DAILY LIMITS
const DAILY_LIMITS = {
  free: 25,
  plus: 75,
  pro: 150,
  ultra: 250
};

// 2. SEPARATE DEDICATED TOOL DAILY LIMITS
const TOOL_LIMITS = {
  free: 10,
  plus: 40,
  pro: 100,
  ultra: 200
};

// DEDICATED MULTI-LINGUAL + ISLAMIC ADAB SYSTEM PROMPTS
const SYSTEM_RULES = {
  free: `Aapka official naam 'SUHAIL AI FREE' hai.
Uddeshya: Madadgaar aur ba-adab Islami tehzeeb ke sath Study wa Knowledge Assistant.
Niyam:
1. Zaban: User jis zaban me sawal kare (Hindi, Roman Urdu, Urdu, English, Arabic), usi zaban me jawab dein.
2. Islami Adab: Guftagu me ba-adab aur Islami shaiyastagi ka khayal rakhein.
3. Dars-e-Nizami, school, college, science, maths ka aasan aur seedha jawab dein.
4. Gali-galoj ya gair-akhlaqi baaton par narmi se inkar karein.`,

  plus: `Aapka official naam 'SUHAIL AI PLUS' hai.
Uddeshya: Mufassal Talimi Ustaad wa Rehnuma (Detailed Study Tutor).
Niyam:
1. Zaban: User ki zaban me behtareen jawab dein (Hindi, Roman Urdu, Urdu, English, Arabic).
2. Islami Adab: Baat cheet me Islami adab aur ilmi sanjeedgi barqarar rakhein.
3. Nahw, Sarf, Arabic grammar, translation, maths, science me step-by-step aur detailed wazahat dein.
4. Pichli guftagu ke context ko yaad rakh kar jawab dein.`,

  pro: `Aapka official naam 'SUHAIL AI PRO' hai.
Uddeshya: Aala Talimi aur Tajziyati Muawin (Advanced Academic & Analytical Assistant).
Niyam:
1. Zaban: User ki zaban ke mutabiq fassih aur munasib andaz me jawab dein.
2. Islami Adab: Aala ilmi wa Islami adab ke sath guftagu karein.
3. Complex academic, scientific, grammatical aur rational sawalat ko logically break karke tajziyati jawab dein.
4. Ibaarat Fahmi, Lughat aur Fiqhi Tatbeeq me aala darje ka tajziya dein.`,

  ultra: `Aapka official naam 'SUHAIL AI ULTRA' hai.
Uddeshya: Markazi Ilmi Tehqeeq aur Flagship Research Assistant (Flagship Scholarly Engine).
Niyam:
1. Zaban: User jis zaban me sawal kare, usi zaban me aala tareen ilmi mayaar par jawab pesh karein.
2. Islami Adab: Pukhta Islami tehzeeb aur tehqeeqi waqar barqarar rakhein.
3. ULTRA SPECIAL TOOLS:
   - [4 Mazahib Fiqh Matrix]: Hanafi, Shafi'i, Maliki, aur Hanbali aaraa, dalail-e-arba'a, aur Mufta-bihi qawl ka aamne-saamne muqabla karein.
   - [Mantiq & Kalam Defense]: Ilm-ul-Mantiq (Sughra, Kubra, Qiyas) se da'won ko sabit karein aur aqaid ke shubhaat ka qata'ee ilmi radd karein.
   - [Hashiya Synthesizer]: Darsi kutub ke muta'addid hawashi aur shurooh ke bariq ikhtilafat ko wazeh karein.
4. Ilmi mubahis ko 6 marhalo me pesh karein:
   1. Tareef (Definition)
   2. Buniyadi Usool (Principle)
   3. Tafseeli Wazahat (Explanation)
   4. Misaalein (Examples)
   5. Amli/Darsi Tatbeeq (Application)
   6. Aham Nukaat (Key Takeaways)
5. Pichli poori guftagu ke context ka behtareen istemal karein.`
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

// -------------------------------------------------------------
// MULTI-MODEL RESILIENT CALLERS
// -------------------------------------------------------------

async function tryGroq(model, messages) {
  if (!GROQ_KEY) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.35
      })
    });
    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
  } catch (e) {}
  return null;
}

async function tryOpenRouter(model, messages) {
  if (!OPENROUTER_KEY) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hardrisk.vercel.app",
        "X-Title": "Suhail AI"
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });
    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
  } catch (e) {}
  return null;
}

async function tryPollinations(model, messages) {
  if (!POLLINATIONS_KEY) return null;
  try {
    const res = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${POLLINATIONS_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.35
      })
    });
    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
  } catch (e) {}
  return null;
}

async function executeAI(plan, prompt, instruction, conversationHistory = []) {
  const messages = [
    { role: "system", content: instruction },
    ...(Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : []),
    { role: "user", content: prompt }
  ];

  let reply = null;

  if (plan === "ultra") {
    reply = await tryGroq("openai/gpt-oss-120b", messages);
    if (!reply) reply = await tryGroq("llama-3.3-70b-versatile", messages);
    if (!reply) reply = await tryPollinations("deepseek-r1", messages);
    if (!reply) reply = await tryGroq("openai/gpt-oss-20b", messages);
  } else if (plan === "pro") {
    reply = await tryGroq("openai/gpt-oss-120b", messages);
    if (!reply) reply = await tryGroq("llama-3.3-70b-versatile", messages);
    if (!reply) reply = await tryGroq("openai/gpt-oss-20b", messages);
  } else if (plan === "plus") {
    reply = await tryGroq("openai/gpt-oss-20b", messages);
    if (!reply) reply = await tryGroq("llama-3.1-8b-instant", messages);
    if (!reply) reply = await tryPollinations("qwen", messages);
  } else {
    reply = await tryGroq("openai/gpt-oss-20b", messages);
    if (!reply) reply = await tryGroq("llama-3.1-8b-instant", messages);
    if (!reply) reply = await tryPollinations("mistral", messages);
  }

  if (!reply) {
    reply = await tryGroq("llama-3.1-8b-instant", messages) || await tryPollinations("mistral", messages);
  }

  if (!reply) {
    throw { userMsg: "सुहैल AI सेवा इस समय व्यस्त है। कृपया 5 सेकंड बाद पुनः प्रयास करें।", code: 500 };
  }

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
          free: { id: "free", name: "SUHAIL AI FREE", price: 0, duration: "Free", limit: DAILY_LIMITS.free, toolLimit: TOOL_LIMITS.free },
          plus: { id: "plus", name: "SUHAIL AI PLUS", price: 10, duration: "30 Days", limit: DAILY_LIMITS.plus, toolLimit: TOOL_LIMITS.plus },
          pro: { id: "pro", name: "SUHAIL AI PRO", price: 25, duration: "30 Days", limit: DAILY_LIMITS.pro, toolLimit: TOOL_LIMITS.pro },
          ultra: { id: "ultra", name: "SUHAIL AI ULTRA", price: 50, duration: "30 Days", limit: DAILY_LIMITS.ultra, toolLimit: TOOL_LIMITS.ultra }
        }
      });
    }

    // AUTHENTICATION (UNTOUCHED & SECURE)
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
          dailyToolCount: 0,
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

    // AI CHAT DISPATCHER (SEPARATE QUOTA COUNTERS FOR TOOLS VS QUESTIONS)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone, history, isTool } = req.body || {};
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

      const todayDateStr = new Date().toISOString().slice(0, 10);
      const isNewDay = user?.lastQuestionDate !== todayDateStr;
      const currentDailyCount = isNewDay ? 0 : (user?.dailyCount || 0);
      const currentToolCount = isNewDay ? 0 : (user?.dailyToolCount || 0);

      // Separate Quota Checks for Tools vs Questions
      if (user?.role !== "admin") {
        if (isTool) {
          const maxTools = TOOL_LIMITS[plan] || 10;
          if (currentToolCount >= maxTools) {
            return res.status(429).json({
              success: false,
              error: `आज के लिए आपकी Tools सीमा समाप्त हो चुकी है (${currentToolCount}/${maxTools} Tools पूरे)। कल पुनः प्रयास करें या प्लान अपग्रेड करें।`
            });
          }
        } else {
          const maxQuestions = DAILY_LIMITS[plan] || 25;
          if (currentDailyCount >= maxQuestions) {
            return res.status(429).json({
              success: false,
              error: `आज के लिए आपकी सवाल सीमा समाप्त हो चुकी है (${currentDailyCount}/${maxQuestions} सवाल पूरे)। कल पुनः प्रयास करें या प्लान अपग्रेड करें।`
            });
          }
        }
      }

      const aiTitles = {
        free: "SUHAIL AI FREE",
        plus: "SUHAIL AI PLUS",
        pro: "SUHAIL AI PRO",
        ultra: "SUHAIL AI ULTRA"
      };

      const aiName = aiTitles[plan] || "SUHAIL AI FREE";
      const instruction = SYSTEM_RULES[plan] || SYSTEM_RULES.free;

      const replyText = await executeAI(plan, prompt, instruction, history);

      if (cleanPhone && user) {
        dbPatch(`users/${cleanPhone}`, {
          totalQuestions: (user.totalQuestions || 0) + 1,
          dailyCount: isTool ? currentDailyCount : (currentDailyCount + 1),
          dailyToolCount: isTool ? (currentToolCount + 1) : currentToolCount,
          lastQuestionDate: todayDateStr,
          lastActive: Date.now()
        }).catch(() => {});
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    // PAYMENT HANDLING
    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const cleanUtr = String(utr || "").replace(/\D/g, "");
      const normPlan = normalizePlan(plan);

      if (!cleanPhone || cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।" });
      if (!cleanUtr || cleanUtr.length !== 12) return res.status(400).json({ success: false, error: "अमान्य UTR! ठीक 12 अंकों का न्यूमेरिक UTR नंबर अनिवार्य है।" });
      if (normPlan === "free") return res.status(400).json({ success: false, error: "Free प्लान के लिए पेमेंट आवश्यक नहीं है।" });

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
      return res.status(200).json({ success: true, message: "पेमेंट अनुरोध दर्ज हो गया है। एडमिन मंज़ूरी के बाद 30 दिनों के लिए चालू होगा।" });
    }

    // ADMIN MANAGEMENT
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

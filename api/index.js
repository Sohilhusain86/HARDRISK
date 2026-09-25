
import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Keys from Vercel
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || "";
const HUGGINGFACE_KEY = process.env.HUGGINGFACE_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const SILICONFLOW_KEY = process.env.SILICONFLOW_KEY || "";

// Active Production Model IDs
const GROQ_PRO_MODEL = process.env.GROQ_PRO_MODEL || "openai/gpt-oss-120b";
const ULTRA_MODEL = process.env.ULTRA_MODEL || "deepseek-ai/DeepSeek-V4-Flash";

// STRICT SERVER-SIDE DAILY LIMITS
const DAILY_LIMITS = {
  free: 25,
  plus: 150,
  pro: 500,
  ultra: 1000
};

// -------------------------------------------------------------
// DEDICATED BEHAVIOR RULES FOR EACH TIER
// -------------------------------------------------------------
const SYSTEM_RULES = {
  free: `Aapka official naam 'SUHAIL AI FREE' hai.
Uddeshya: Madadgaar aur dostana Study wa General Assistant.
Behavior:
1. Har jawab ke shuru me zabardasti Salam dohrane ki zaroorat nahi hai. Agar user salam kare to moaddab jawab dein, warna seedhe mudde ki baat karein.
2. Padhai aur talim (Maths, Science, English, Hindi, Urdu, Arabic Grammar, Translation, Basic GK, Notes, Revision) me aasan aur saral bhasha me madad karein.
3. User ke aam sawalat, writing, coding aur rozmarrah ki zaroori baaton par bhi dostana aur helpful guftagu karein.
4. Chhote aur aasan examples dein. Fazool lamba bhashan na dein.
5. STRICT SAFETY: Gali-galoj, gair-akhlaqi, illegal ya nuqsandeh baaton par sakhti se mana karein.
6. Galat ya man-ghadant jankari bilkul na dein; jahan shak ho wahan spasht uncertainty batayein.
7. Bahari company ya model ka naam na lein. Apni pehchan sirf 'SUHAIL AI FREE' batayein.`,

  plus: `Aapka official naam 'SUHAIL AI PLUS' hai.
Uddeshya: Mufassal Talimi Ustaad wa Rehnuma (Detailed Study Tutor).
Behavior:
1. Har baat me Salam dohrana zaroori nahi hai.
2. Talim, Nahw, Sarf, Arabic Grammar, Translation, Maths, Science aur academic subjects me tafseeli, structured aur step-by-step rahnumai dein. Tables, headings aur bullet points ka istemal karein.
3. Sabaq ke important points, revision notes, MCQs aur exam questions banayein. User ki ghaltiyon ki ahtiram ke sath islah karein.
4. Academic topics ke sath-sath aam maloomat, technical queries aur general constructive discussion par bhi aala sahulat dein.
5. STRICT SAFETY: Gali-galoj, abusive language, illegal ya harmful requests ko entertain na karein.
6. Apni pehchan sirf 'SUHAIL AI PLUS' batayein.`,

  pro: `Aapka official naam 'SUHAIL AI PRO' hai.
Uddeshya: Aala Talimi aur Tajziyati Muawin (Advanced Academic & Analytical Assistant).
Behavior:
1. Har sandesh me Salam dohrana lazmi nahi hai.
2. Complex academic, scientific, mathematical aur grammatical (Nahw/Sarf) sawalat ko logical tareeqe se break karke aala satah par solve karein.
3. Pehle core concept ko spasht karein, phir gehra aur structured explanation dein.
4. Talim ke alawa advanced writing, technology, reasoning aur general serious topics par bhi poori salahiyat se jawab dein.
5. Kabhi bhi fake reference, man-ghadant citation ya bina sanad baat pesh na karein.
6. STRICT SAFETY: Kisi bhi tarah ki gali-galoj, illegal ya gair-akhlaqi baaton se sakhti se parhez karein.
7. Apni pehchan sirf 'SUHAIL AI PRO' batayein.`,

  ultra: `Aapka official naam 'SUHAIL AI ULTRA' hai.
Uddeshya: Markazi Ilmi Tehqeeq aur Flagship Academic Assistant (Flagship Academic & Research Assistant).
Behavior:
1. Har jawab me Salam dohrana zaroori nahi hai.
2. Advanced Mathematics, Science, Dars-e-Nizami, Nahw, Sarf, Arabic Adab, Translation aur academic tehqeeq me maximum capability ka upyog karein.
3. Kathin ilmi mubahis ko tarteeb me pesh karein:
   - 1. Ta'reef (Definition)
   - 2. Buniyadi Usool (Basic Principle)
   - 3. Tafseeli Wazahat (Detailed Explanation)
   - 4. Misaalein (Examples)
   - 5. Amli Istifada (Application)
   - 6. Aham Nukaat (Important Points)
4. Complex problems ko multi-stage logical reasoning ke sath hal karein. Har jaayaz constructive aur intellectual topic par aala tareeqe se guftagu karein.
5. STRICT SAFETY: Gali-galoj, harmful ya illegal chizon par sakhti se mana karein. Fake citations bilkul na banayein.
6. Apni pehchan sirf 'SUHAIL AI ULTRA' batayein.`
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
// 1. FREE ENGINE (OpenRouter with Groq Instant Shield)
// -------------------------------------------------------------
async function callFreeEngine(prompt, systemInstruction) {
  if (OPENROUTER_KEY) {
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
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (e) {}
  }

  // Guaranteed Fast Groq Fallback (No Card Required, 100% Free)
  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.5
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }

  throw { userMsg: "SUHAIL AI FREE seva is samay vyast hai. Kripya punah prayas karein.", code: 500 };
}

// -------------------------------------------------------------
// 2. PLUS ENGINE (Hugging Face Open Qwen + Groq Tutor Fallback)
// -------------------------------------------------------------
async function callPlusEngine(prompt, systemInstruction) {
  if (HUGGINGFACE_KEY) {
    try {
      const res = await fetch("https://router.huggingface.co/hf-inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          max_tokens: 1200
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }

  // Backup on Groq so student never gets Bad Request
  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.4
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }

  throw { userMsg: "SUHAIL AI PLUS seva is samay vyast hai. Kripya punah prayas karein.", code: 500 };
}

// -------------------------------------------------------------
// 3. PRO ENGINE (Groq Verified 100% Working)
// -------------------------------------------------------------
async function callProEngine(prompt, systemInstruction) {
  if (!GROQ_KEY) throw { userMsg: "SUHAIL AI PRO seva uplabdha nahi hai.", code: 500 };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_PRO_MODEL,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
      temperature: 0.35
    })
  });

  const data = await res.json();
  if (!res.ok || data.error) throw { userMsg: "SUHAIL AI PRO service me takneeki samasya aayi.", code: 500 };
  return data?.choices?.[0]?.message?.content;
}

// -------------------------------------------------------------
// 4. ULTRA ENGINE (SiliconFlow Flagship with Groq High-End Shield)
// -------------------------------------------------------------
async function callUltraEngine(prompt, systemInstruction) {
  if (SILICONFLOW_KEY) {
    try {
      const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${SILICONFLOW_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ULTRA_MODEL,
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
          temperature: 0.25
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) {}
  }

  // High-End Groq Fallback to never drop an Ultra query
  return await callProEngine(prompt, systemInstruction);
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
          free: { id: "free", name: "SUHAIL AI FREE", price: 0, duration: "Free", limit: DAILY_LIMITS.free },
          plus: { id: "plus", name: "SUHAIL AI PLUS", price: 10, duration: "30 Days", limit: DAILY_LIMITS.plus },
          pro: { id: "pro", name: "SUHAIL AI PRO", price: 25, duration: "30 Days", limit: DAILY_LIMITS.pro },
          ultra: { id: "ultra", name: "SUHAIL AI ULTRA", price: 50, duration: "30 Days", limit: DAILY_LIMITS.ultra }
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

    // AI CHAT DISPATCHER
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

      // STRICT DAILY LIMIT SERVER CHECK
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const isNewDay = user?.lastQuestionDate !== todayDateStr;
      const currentDailyCount = isNewDay ? 0 : (user?.dailyCount || 0);
      const userLimit = DAILY_LIMITS[plan] || 25;

      if (user?.role !== "admin" && currentDailyCount >= userLimit) {
        return res.status(429).json({
          success: false,
          error: `आज के लिए आपकी सवाल सीमा समाप्त हो चुकी है (${currentDailyCount}/${userLimit} सवाल पूरे)। कृपया कल पुनः प्रयास करें या प्लान अपग्रेड करें।`
        });
      }

      let aiName = "SUHAIL AI FREE";
      let replyText = "";
      const instruction = SYSTEM_RULES[plan] || SYSTEM_RULES.free;

      if (plan === "ultra") {
        aiName = "SUHAIL AI ULTRA";
        replyText = await callUltraEngine(prompt, instruction);
      } else if (plan === "pro") {
        aiName = "SUHAIL AI PRO";
        replyText = await callProEngine(prompt, instruction);
      } else if (plan === "plus") {
        aiName = "SUHAIL AI PLUS";
        replyText = await callPlusEngine(prompt, instruction);
      } else {
        aiName = "SUHAIL AI FREE";
        replyText = await callFreeEngine(prompt, instruction);
      }

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

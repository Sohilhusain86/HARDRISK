const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Keys from Environment Variables
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const SAMBANOVA_KEY = process.env.SAMBANOVA_KEY || "";

// Verified Current Production Model IDs
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-2603";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const ALLAMA_MODEL = process.env.ALLAMA_MODEL || "DeepSeek-V3.1";

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

// Canonical Plan Normalizer (Migration logic for legacy database records)
function normalizePlan(rawPlan) {
  const p = String(rawPlan || "free").toLowerCase().trim();
  if (p === "plus" || p === "mahir" || p === "monthly") return "plus";
  if (p === "pro" || p === "faaiq") return "pro";
  if (p === "allama" || p === "yearly" || p === "master" || p === "super") return "allama";
  return "free";
}

// -------------------------------------------------------------
// STRICT PROVIDER ENGINES (NO SILENT SWITCHING)
// -------------------------------------------------------------

// TIER 1: SUHAIL AI FREE -> Google Gemini
async function runGemini(prompt, systemInstruction) {
  if (!GEMINI_KEY) {
    console.error("[Diagnostics] Provider: Gemini | Error: GEMINI_API_KEY is missing");
    throw { userMsg: "SUHAIL AI FREE ki AI service filhal an-upalabdha hai (API Key missing).", code: "KEY_MISSING", provider: "Gemini" };
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\nTalib ka sawal: ${prompt}` }] }]
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error(`[Diagnostics] Provider: Gemini | Model: ${GEMINI_MODEL} | Status: ${res.status} | Error:`, data.error?.message || res.statusText);
    throw { userMsg: "SUHAIL AI FREE is waqt busy hai ya rate limit reach hua hai. Kripya thodi der baad dobara koshish karein.", code: data.error?.code || res.status, provider: "Gemini" };
  }
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw { userMsg: "SUHAIL AI FREE se koi uttar prapt nahi hua.", code: "EMPTY_RESPONSE", provider: "Gemini" };
  return reply;
}

// TIER 2: SUHAIL AI PLUS -> Mistral AI
async function runMistral(prompt, systemInstruction) {
  if (!MISTRAL_KEY) {
    console.error("[Diagnostics] Provider: Mistral | Error: MISTRAL_KEY is missing");
    throw { userMsg: "SUHAIL AI PLUS ki service filhal uplabdha nahi hai (API Key missing).", code: "KEY_MISSING", provider: "Mistral" };
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
    console.error(`[Diagnostics] Provider: Mistral | Model: ${MISTRAL_MODEL} | Status: ${res.status} | Error:`, data.error?.message || data.message);
    throw { userMsg: "SUHAIL AI PLUS is waqt uplabdha nahi hai. Kripya thodi der baad prayas karein.", code: res.status, provider: "Mistral" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI PLUS se uttar prapt nahi hua.", code: "EMPTY_RESPONSE", provider: "Mistral" };
  return reply;
}

// TIER 3: SUHAIL AI PRO -> Groq Cloud
async function runGroq(prompt, systemInstruction) {
  if (!GROQ_KEY) {
    console.error("[Diagnostics] Provider: Groq | Error: GROQ_KEY is missing");
    throw { userMsg: "SUHAIL AI PRO ki service filhal an-upalabdha hai (API Key missing).", code: "KEY_MISSING", provider: "Groq" };
  }
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
      temperature: 0.4
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error(`[Diagnostics] Provider: Groq | Model: ${GROQ_MODEL} | Status: ${res.status} | Error:`, data.error?.message);
    throw { userMsg: `SUHAIL AI PRO service mein rukawat aayi: ${data.error?.message || "Service Busy"}`, code: res.status, provider: "Groq" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI PRO se uttar prapt nahi hua.", code: "EMPTY_RESPONSE", provider: "Groq" };
  return reply;
}

// TIER 4: SUHAIL AI ALLAMA -> SambaNova Verified RDU Flagship
async function runAllama(prompt, systemInstruction) {
  if (!SAMBANOVA_KEY) {
    console.error("[Diagnostics] Provider: SambaNova | Error: SAMBANOVA_KEY missing for SUHAIL AI ALLAMA");
    throw { userMsg: "SUHAIL AI ALLAMA engine configure nahi hai (SAMBANOVA_KEY missing).", code: "KEY_MISSING", provider: "SambaNova" };
  }
  const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SAMBANOVA_KEY}`,
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
    console.error(`[Diagnostics] Provider: SambaNova | Model: ${ALLAMA_MODEL} | Status: ${res.status} | Error:`, data.error?.message);
    throw { userMsg: `SUHAIL AI ALLAMA service mein takneeki kharabi aayi (${res.status}).`, code: res.status, provider: "SambaNova" };
  }
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw { userMsg: "SUHAIL AI ALLAMA se uttar prapt nahi hua.", code: "EMPTY_RESPONSE", provider: "SambaNova" };
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
    // 1. CONFIG & PLANS
    if (action === "config" || action === "plans") {
      return res.status(200).json({
        success: true,
        plans: {
          free: { id: "free", name: "SUHAIL AI FREE", price: 0, duration: "Free", model: GEMINI_MODEL },
          plus: { id: "plus", name: "SUHAIL AI PLUS", price: 10, duration: "30 Days", model: MISTRAL_MODEL },
          pro: { id: "pro", name: "SUHAIL AI PRO", price: 50, duration: "30 Days", model: GROQ_MODEL },
          allama: { id: "allama", name: "SUHAIL AI ALLAMA", price: 100, duration: "30 Days", model: ALLAMA_MODEL }
        }
      });
    }

    // 2. AUTHENTICATION & LOGIN / REGISTER
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, userPass, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "Kripya 10 ankon ka valid mobile number darj karein." });
      }

      // Master Admin Bypass (Admin Role - Lifetime Full Access)
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

      // Roll Number Validation (Exact 4 digits: 4000 to 9999)
      const rollNum = parseInt(roll, 10);
      if (isNaN(rollNum) || rollNum < 4000 || rollNum > 9999) {
        return res.status(400).json({ success: false, error: "Roll number 4000 se 9999 ke beech (4 ankon ka) hona lazmi hai." });
      }

      // Password Validation (Minimum 6 characters)
      if (!userPass || String(userPass).length < 6) {
        return res.status(400).json({ success: false, error: "Personal password kam se kam 6 ankon/aksharon ka hona chahiye." });
      }

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) {
        if (!name || !name.trim()) {
          return res.status(400).json({ success: false, error: "Pehli dafa jud rahe hain, kripya apna naam darj karein." });
        }
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
          return res.status(401).json({ success: false, error: "Galat password! Kripya apna sahi password darj karein." });
        }
        // Legacy migration
        user.plan = normalizePlan(user.plan);
        delete user.password;
        return res.status(200).json({ success: true, user });
      }
    }

    // 3. PROFILE SYNC & 30-DAYS EXPIRY NORMALIZER
    if (action === "get_profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "User nahi mila." });

      user.plan = normalizePlan(user.plan);

      // Check 30-Days Expiry
      if (user.role !== "admin" && user.planExpiry && Date.now() > user.planExpiry) {
        user.plan = "free";
        user.planExpiry = null;
        await dbPatch(`users/${cleanPhone}`, { plan: "free", planExpiry: null });
      }

      delete user.password;
      return res.status(200).json({ success: true, user });
    }

    // 4. FORGOT PASSWORD
    if (action === "forgot" && req.method === "POST") {
      const { phone, verify, newPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) return res.status(400).json({ success: false, error: "10 ankon ka mobile number darj karein." });
      if (!newPass || String(newPass).length < 6) return res.status(400).json({ success: false, error: "Naya password kam se kam 6 ankon ka hona chahiye." });

      const user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "Is number se koi khata nahi mila." });

      const checkVal = String(verify || "").trim().toLowerCase();
      const match = (checkVal && user.roll && checkVal === String(user.roll).toLowerCase()) ||
                    (checkVal && user.name && String(user.name).toLowerCase().includes(checkVal));

      if (!match) return res.status(403).json({ success: false, error: "Satyaapan vifal! Sahi naam ya roll number darj karein." });

      await dbPatch(`users/${cleanPhone}`, { password: String(newPass).trim() });
      return res.status(200).json({ success: true, message: "Password kamiyabi se badal diya gaya! Ab login karein." });
    }

    // 5. CHAT QUERY ROUTER (STRICT STUDY-FOCUS & ISLAMIC ADAB)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone } = req.body || {};
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ success: false, error: "Sawal khali nahi ho sakta." });
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

      const academicInstruction = `Aapka official naam '{AI_NAME}' hai. 
Aap Suhail AI ke study-only educational platform ke sanjeeda aur moaddib ustaad hain.
Niyam:
1. Shuruat hamesha 'अस्सलामु अलैकुम व रहमतुल्लाह' se karein.
2. Kabhi bhi 'Namaste' ya gair-Islami tahzeeb ke alfaz istemal na karein.
3. Kisi bahari model ya company (Gemini, Mistral, Groq, Meta, OpenAI) ka naam na lein. Agar koi aapki pehchan puche to spasht kahein ki 'Main {AI_NAME} hoon'.
4. Aapka mukhya uddeshya taaleem hai: Dars-e-Nizami, Nahw, Sarf, Arabic, Urdu, English, Maths, Science, Islamiat, exam preparation aur educational summary.
5. Chhote greetings (Hi, Hello, Kaise ho) ka mukhtasar wa ba-adab jawab dein aur talib ko padhai ki taraf maayel karein. Fuzool aur off-topic baaton par narmi se taaleem ki taraf redirect karein.`;

      if (plan === "allama") {
        aiName = "SUHAIL AI ALLAMA";
        modelUsed = ALLAMA_MODEL;
        replyText = await runAllama(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "pro") {
        aiName = "SUHAIL AI PRO";
        modelUsed = GROQ_MODEL;
        replyText = await runGroq(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else if (plan === "plus") {
        aiName = "SUHAIL AI PLUS";
        modelUsed = MISTRAL_MODEL;
        replyText = await runMistral(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      } else {
        aiName = "SUHAIL AI FREE";
        modelUsed = GEMINI_MODEL;
        replyText = await runGemini(prompt, academicInstruction.replace(/{AI_NAME}/g, aiName));
      }

      return res.status(200).json({
        success: true,
        reply: replyText,
        aiName: aiName,
        plan: plan,
        model: modelUsed
      });
    }

    // 6. PAYMENT SUBMISSION
    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const normPlan = normalizePlan(plan);

      if (!cleanPhone || !utr || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "Mobile number aur 12 ankon ka UTR anivarya hai." });
      }
      if (normPlan === "free") {
        return res.status(400).json({ success: false, error: "Free plan ke liye payment ki avashyakta nahi hai." });
      }

      const requestId = `req_${Date.now()}`;
      await dbPut(`payment_requests/${requestId}`, {
        requestId,
        phone: cleanPhone,
        plan: normPlan,
        utr: String(utr).trim(),
        status: "pending",
        submittedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "Payment darkhwast darj ho gayi hai. Admin tasdeeq ke baad unlock ho jayega." });
    }

    // 7. ADMIN DASHBOARD & APPROVAL
    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, error: "Galat Admin Secret." });
      }

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        const canonicalPlan = normalizePlan(targetPlan);
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 Days

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
          message: `${canonicalPlan.toUpperCase()} plan 30 dino ke liye kamiyabi se activate kar diya gaya.`
        });
      }

      if (cmd === "reject_request") {
        await dbPatch(`payment_requests/${requestId}`, {
          status: "rejected",
          rejectedAt: Date.now()
        });
        return res.status(200).json({ success: true, message: "Darkhwast kharij kar di gayi." });
      }
    }

    return res.status(404).json({ success: false, error: "Amanay endpoint action." });
  } catch (err) {
    const status = err.code && typeof err.code === "number" && err.code >= 400 && err.code < 600 ? err.code : 500;
    return res.status(status).json({
      success: false,
      error: err.userMsg || err.message || "Server par takneeki kharabi aayi.",
      code: err.code || "SERVER_ERROR",
      provider: err.provider || "Internal",
      retryable: true
    });
  }
}

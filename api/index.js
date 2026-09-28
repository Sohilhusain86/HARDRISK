import fetch from "node-fetch";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = (process.env.FIREBASE_DB_URL || process.env.FIREBASE_DATABASE_URL || "https://hardrisk-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";

const GROQ_API_KEY = (process.env.GROQ_API_KEY || process.env.GROQ_KEY || "").trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();

// Firebase Helper Functions
async function dbGet(path) {
  try {
    const url = `${FIREBASE_DB_URL}/${path}.json${FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function dbPut(path, data) {
  const url = `${FIREBASE_DB_URL}/${path}.json${FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : ""}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function dbPatch(path, data) {
  const url = `${FIREBASE_DB_URL}/${path}.json${FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : ""}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function dbDelete(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json${FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : ""}`;
  const res = await fetch(url, { method: "DELETE" });
  return await res.json();
}

// Plan Limits & System Rules
const DAILY_LIMITS = { free: 25, plus: 75, pro: 150, ultra: 250 };
const TOOL_LIMITS = { free: 10, plus: 40, pro: 100, ultra: 250 };

function normalizePlan(plan) {
  if (!plan) return "free";
  const p = String(plan).toLowerCase();
  if (p.includes("ultra")) return "ultra";
  if (p.includes("pro")) return "pro";
  if (p.includes("plus")) return "plus";
  return "free";
}

const SYSTEM_RULES = {
  free: "Aap Suhail AI hain. Har jawab me baar-baar salaam mat karein. Sawal ka wazeh, shisht aur mukhtasar jawab dein. Namaste jaise shabdon ka istemal sakhti se mana hai.",
  plus: "Aap Suhail AI Plus hain. Dars-e-Nizami, Arabic Grammar (Nahw-Sarf), aur academic sawalat ko aasan aur tafseeli andaz me samjhayein. Namaste jaise shabdon ka istemal na karein.",
  pro: "Aap Suhail AI Pro hain. Ilmi tehqeeq, ibaarat fahmi, aur Fiqhi tatbeeq ko usoolon ke sath wazeh karein. Table aur points ka khoob istemal karein.",
  ultra: "Aap Suhail AI Ultra hain. Master Academic & Islamic research assistant. Har pehlu ko nihayat gehrai, hawala-jaat aur jamia andaz me pesh karein."
};

// वरीयता क्रम (Preferred Groq Models Hierarchy)
const PREFERRED_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

// Gemini Fallback Models Pool
const GEMINI_MODELS_POOL = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash"
];

// Runtime Dynamic Model Discovery
async function getUsableGroqModels() {
  if (!GROQ_API_KEY) return [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    const liveIds = (data?.data || [])
      .map(m => m.id)
      .filter(id => Boolean(id) && !id.includes("whisper") && !id.includes("guard"));

    // वरीयता क्रम के अनुसार उपलब्ध मॉडल छांटना
    const matched = PREFERRED_GROQ_MODELS.filter(m => liveIds.includes(m));
    if (matched.length > 0) return matched;
    
    // यदि वरीयता वाले न मिलें, तो उपलब्ध अन्य चैट मॉडल रिटर्न करना
    return liveIds;
  } catch (err) {
    console.error("Groq dynamic discovery failed:", err);
    return PREFERRED_GROQ_MODELS;
  }
}

// Multi-Model Auto-Resilient AI Engine
async function executeAI(plan, prompt, instruction, history = []) {
  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    return "AI Service temporarily unavailable (API Key missing).";
  }

  const messages = [{ role: "system", content: instruction }];

  if (Array.isArray(history)) {
    history.slice(-6).forEach(msg => {
      const content = msg.content || msg.text;
      if (msg.role && content) {
        messages.push({ role: msg.role === "user" ? "user" : "assistant", content: content });
      }
    });
  }

  messages.push({ role: "user", content: prompt });

  // 1. Groq Live-Discovered Candidates Execution
  if (GROQ_API_KEY) {
    const candidateModels = await getUsableGroqModels();
    for (const modelName of candidateModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.5,
            max_tokens: 2048
          })
        });

        const resData = await response.json();
        if (resData.choices?.[0]?.message?.content) {
          return resData.choices[0].message.content;
        }
        console.warn(`Groq candidate ${modelName} call failed or rate-limited:`, resData?.error?.message || resData);
      } catch (err) {
        console.error(`Groq network error on ${modelName}:`, err);
      }
    }
  }

  // 2. Google Gemini Fallback Pool
  if (GEMINI_API_KEY) {
    const fullPrompt = `${instruction}\n\nSawal: ${prompt}`;
    for (const gemModel of GEMINI_MODELS_POOL) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });
        const gData = await geminiRes.json();
        if (gData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return gData.candidates[0].content.parts[0].text;
        }
        console.warn(`Gemini candidate ${gemModel} failed:`, gData?.error?.message || gData);
      } catch (gErr) {
        console.error(`Gemini network error on ${gemModel}:`, gErr);
      }
    }
  }

  return "माफ़ कीजिए, AI सर्वर पर अत्यधिक लोड है। कृपया 5 सेकंड रुककर दोबारा सवाल भेजें।";
}

// AI Audit Report for Admin
async function generateAiAuditReport(chatLogsText) {
  const prompt = `Aap 'Suhail AI' platform ke Chief Auditor hain. Neeche tulba (students) ki ahem chats hain:\n---\n${chatLogsText}\n---\nAdmin (Suhail Husain) ke liye Urdu/Hindi me mukhtasar aur behtareen tajziya (Audit Summary) pesh karein:\n1. Tulba ne buniyadi taur par kya sawalat pooche?\n2. AI ne kaisa jawab diya aur kya koi ilmi kami thi?\n3. Poori guftagu ka mukhtasar khulasa aur platform behtar banane ke mashware.`;

  if (GROQ_API_KEY) {
    const usable = await getUsableGroqModels();
    for (const model of usable) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3
          })
        });
        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          return "✨ [AI मुख्य समीक्षा रिपोर्ट]:\n\n" + data.choices[0].message.content;
        }
      } catch (e) {}
    }
  }

  if (GEMINI_API_KEY) {
    for (const gemModel of GEMINI_MODELS_POOL) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return "✨ [AI मुख्य समीक्षा रिपोर्ट (Gemini)]:\n\n" + data.candidates[0].content.parts[0].text;
        }
      } catch (e) {}
    }
  }

  return "📋 [सीधा चैट रिकॉर्ड - लाइव डेटाबेस]:\n\n" + chatLogsText;
}

// MAIN VERCEL HANDLER
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query?.action || searchParams.get("action");

  try {
    // 1. GLOBAL NOTICE (STUDENT VIEW)
    if (action === "get-notice" || action === "get_notice") {
      const settings = (await dbGet("system_settings")) || {};
      let noticeText = "";
      if (settings.noticeActive && settings.notice) {
        noticeText = settings.notice;
      } else {
        const directNotice = await dbGet("globalNotice");
        noticeText = directNotice || "";
      }
      return res.status(200).json({ success: true, notice: noticeText });
    }

    // 2. GLOBAL NOTICE (ADMIN ACTION)
    if (action === "set_notice" || action === "set-notice") {
      const { noticeText, notice, isActive, pass, phone } = req.body || {};
      const activeText = String(noticeText || notice || "").trim();

      let isAuthorized = (pass === ADMIN_SECRET);
      if (!isAuthorized && phone) {
        const cleanPhone = String(phone).replace(/\D/g, "");
        const adminUser = await dbGet(`users/${cleanPhone}`);
        if (adminUser?.role === "admin") isAuthorized = true;
      }

      if (!isAuthorized) {
        return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड या अनुमति!" });
      }

      await dbPut("system_settings", {
        notice: activeText,
        noticeActive: isActive !== undefined ? !!isActive : (activeText.length > 0),
        updatedAt: Date.now()
      });
      await dbPut("globalNotice", activeText);

      return res.status(200).json({
        success: true,
        message: activeText ? "ग्लोबल नोटिस सफलतापूर्वक प्रसारित कर दिया गया।" : "नोटिस हटा दिया गया।"
      });
    }

    // 3. AUTHENTICATION (LOGIN & REGISTER)
    if (action === "auth" && req.method === "POST") {
      const { phone, password, userPass, name, type, adminPass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const passWordInput = password || userPass;

      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "10 अंकों का वैध मोबाइल नंबर दर्ज करें।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);

      if (adminPass && adminPass === ADMIN_SECRET) {
        if (!user) {
          user = {
            name: String(name || "Admin Suhail").trim(),
            phone: cleanPhone,
            role: "admin",
            plan: "ultra",
            status: "active",
            createdAt: Date.now()
          };
          await dbPut(`users/${cleanPhone}`, user);
        } else {
          await dbPatch(`users/${cleanPhone}`, { role: "admin", plan: "ultra" });
          user.role = "admin";
          user.plan = "ultra";
        }
        return res.status(200).json({ success: true, user });
      }

      if (type === "register" || !user) {
        const newUser = {
          name: String(name || "Talib-e-Ilm").trim(),
          phone: cleanPhone,
          passwordHash: passWordInput,
          plan: "free",
          role: "student",
          status: "active",
          dailyCount: 0,
          dailyToolCount: 0,
          totalQuestions: 0,
          createdAt: Date.now(),
          lastActive: Date.now()
        };
        await dbPut(`users/${cleanPhone}`, newUser);
        delete newUser.passwordHash;
        return res.status(200).json({ success: true, user: newUser });
      } else {
        if (user.passwordHash && passWordInput && user.passwordHash !== passWordInput) {
          return res.status(401).json({ success: false, error: "गलत पासवर्ड दर्ज किया गया है।" });
        }
        delete user.passwordHash;
        return res.status(200).json({ success: true, user });
      }
    }

    // 4. AI CHAT DISPATCHER (STUDENT & ADMIN)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone, history, isTool, customPersona } = req.body || {};
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ success: false, error: "सवाल खाली नहीं हो सकता।" });
      }

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      let user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      if (user && user.status === "blocked") {
        return res.status(403).json({ success: false, error: "आपका खाता निलंबित (Blocked) है।" });
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

      if (user?.role !== "admin") {
        if (isTool) {
          const maxTools = TOOL_LIMITS[plan] || 10;
          if (currentToolCount >= maxTools) {
            return res.status(429).json({ success: false, error: `आज की Tools सीमा समाप्त हो चुकी है (${currentToolCount}/${maxTools})। कल पुनः प्रयास करें।` });
          }
        } else {
          const maxQuestions = DAILY_LIMITS[plan] || 25;
          if (currentDailyCount >= maxQuestions) {
            return res.status(429).json({ success: false, error: `आज की सवाल सीमा समाप्त हो चुकी है (${currentDailyCount}/${maxQuestions})। कल पुनः प्रयास करें।` });
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
      let instruction = SYSTEM_RULES[plan] || SYSTEM_RULES.free;

      if (customPersona && String(customPersona).trim()) {
        instruction += `\n\n[USER CUSTOM INSTRUCTIONS]: ${String(customPersona).trim()}`;
      }

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

      if (cleanPhone) {
        const timestamp = Date.now();
        dbPut(`chats/${cleanPhone}/${timestamp}`, {
          question: prompt,
          reply: replyText,
          time: timestamp,
          role: "student",
          plan: plan
        }).catch(() => {});
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    // 5. USER PROFILE SYNC
    if ((action === "profile" || action === "get_profile") && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone) return res.status(400).json({ success: false, error: "Phone required" });

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      delete user.passwordHash;
      return res.status(200).json({ success: true, user });
    }

    // 6. PAYMENT SUBMIT (STUDENT UTR)
    if (action === "payment" && req.method === "POST") {
      const { phone, utr, plan } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || !utr || String(utr).length !== 12) {
        return res.status(400).json({ success: false, error: "12 अंकों का वैध UTR आवश्यक है।" });
      }

      const payId = `${Date.now()}_${cleanPhone}`;
      await dbPut(`paymentRequests/${payId}`, {
        phone: cleanPhone,
        utr: String(utr).trim(),
        plan: plan || "plus",
        status: "pending",
        time: Date.now()
      });

      return res.status(200).json({ success: true, message: "भुगतान सत्यापन के लिए भेज दिया गया है।" });
    }

    // 7. PENDING PAYMENTS AUDIT & APPROVAL (ADMIN)
    if (action === "admin-payments" || action === "pending_payments" || action === "get_payments" || action === "admin") {
      const payments = (await dbGet("paymentRequests")) || {};
      return res.status(200).json({ success: true, payments, requests: payments });
    }

    if (action === "admin-approve-payment" || action === "approve_payment" || action === "reject_payment" || action === "approve_request" || action === "reject_request") {
      const { payId, requestId, status, targetPhone, targetPlan } = req.body || {};
      const finalId = payId || requestId;
      const payReq = await dbGet(`paymentRequests/${finalId}`);
      
      const isReject = action.includes("reject");
      const finalStatus = isReject ? "rejected" : (status || "approved");

      if (payReq && finalStatus === "approved") {
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`users/${payReq.phone}`, {
          plan: payReq.plan || targetPlan || "pro",
          planExpiry: expiryTime
        });
      } else if (targetPhone && finalStatus === "approved") {
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`users/${targetPhone}`, {
          plan: targetPlan || "pro",
          planExpiry: expiryTime
        });
      }

      if (finalId) {
        await dbPatch(`paymentRequests/${finalId}`, { status: finalStatus });
      }
      return res.status(200).json({ success: true, message: `पेमेंट रिक्वेस्ट ${finalStatus} कर दी गई।` });
    }

    // 8. ADMIN CONTROL CENTER (FULL SUITE)
    const { pass } = req.body || {};
    const isAdminPass = (pass === ADMIN_SECRET);

    // 8.1 All Users & Single User AI Chat Audit
    if (action === "ai_chat_summary") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const allChats = (await dbGet("chats")) || {};
      const { targetPhone } = req.body || {};
      let logsText = "";

      if (targetPhone) {
        const cleanTarget = String(targetPhone).replace(/\D/g, "");
        const userChat = allChats[cleanTarget] || {};
        const msgs = Array.isArray(userChat) ? userChat : Object.values(userChat);
        logsText += `--- छात्र (${cleanTarget}) की बातचीत ---\n`;
        msgs.slice(-25).forEach(m => {
          const q = m.question || m.text || m.content || "";
          const a = m.reply || "";
          if (q) logsText += `🔹 छात्र: ${q}\n`;
          if (a) logsText += `🔸 AI: ${a}\n\n`;
        });
      } else {
        for (const ph in allChats) {
          const userChat = allChats[ph] || {};
          const msgs = Array.isArray(userChat) ? userChat : Object.values(userChat);
          if (msgs.length > 0) {
            logsText += `\n👤 [छात्र फ़ोन: ${ph}]\n`;
            msgs.slice(-6).forEach(m => {
              const q = m.question || m.text || m.content || "";
              const a = m.reply || "";
              if (q) logsText += `🔹 छात्र: ${q}\n`;
              if (a) logsText += `🔸 AI: ${a}\n`;
            });
            logsText += "-----------------------------\n";
          }
        }
      }

      if (!logsText.trim()) return res.status(200).json({ success: true, insights: "डेटाबेस में कोई चैट नहीं मिली।" });
      const report = await generateAiAuditReport(logsText);
      return res.status(200).json({ success: true, insights: report });
    }

    // 8.2 Students Platform Summary & Analytics
    if (action === "students_summary") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const allUsers = (await dbGet("users")) || {};
      const userList = [];
      let totalQuestionsAcrossPlatform = 0;
      let planCounts = { free: 0, plus: 0, pro: 0, ultra: 0 };
      const now = Date.now();

      for (const phone in allUsers) {
        const u = allUsers[phone];
        if (u.role === "admin") continue;

        const totalQ = u.totalQuestions || 0;
        const dailyQ = u.dailyCount || 0;
        totalQuestionsAcrossPlatform += totalQ;

        let plan = u.plan || "free";
        let daysLeft = 0;

        if (u.planExpiry) {
          if (now > u.planExpiry) {
            plan = "free";
          } else {
            daysLeft = Math.ceil((u.planExpiry - now) / (1000 * 60 * 60 * 24));
          }
        }

        if (planCounts[plan] !== undefined) planCounts[plan]++;

        userList.push({
          phone: u.phone || phone,
          name: u.name || "अज्ञात",
          plan: plan.toUpperCase(),
          totalQuestions: totalQ,
          dailyQuestions: dailyQ,
          daysLeft: plan === "free" ? "स्थायी" : `${daysLeft} दिन शेष`,
          status: u.status || "active"
        });
      }

      userList.sort((a, b) => b.totalQuestions - a.totalQuestions);

      return res.status(200).json({
        success: true,
        summary: { totalStudents: userList.length, totalQuestions: totalQuestionsAcrossPlatform, planBreakdown: planCounts },
        students: userList
      });
    }

    // 8.3 Extend / Upgrade Plan
    if (action === "extend_plan") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone, targetPlan, days } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      const newExpiry = Date.now() + (parseInt(days, 10) * 24 * 60 * 60 * 1000);
      await dbPatch(`users/${cleanTarget}`, { plan: String(targetPlan || "pro").toLowerCase(), planExpiry: newExpiry, status: "active" });
      return res.status(200).json({ success: true, message: `प्लान सफलतापूर्वक अपडेट कर दिया गया।` });
    }

    // 8.4 Block / Unblock User
    if (action === "toggle_block") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone, newStatus } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      await dbPatch(`users/${cleanTarget}`, { status: newStatus || "blocked" });
      return res.status(200).json({ success: true, message: `यूज़र स्थिति '${newStatus}' कर दी गई।` });
    }

    // 8.5 Reset Daily Limit
    if (action === "reset_daily_limit") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      await dbPatch(`users/${cleanTarget}`, { dailyCount: 0, dailyToolCount: 0 });
      return res.status(200).json({ success: true, message: `दैनिक सीमा रीसेट कर दी गई।` });
    }

    return res.status(404).json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
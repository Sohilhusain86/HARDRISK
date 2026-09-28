import fetch from "node-fetch";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DB_URL || "https://ula-alif-default-rtdb.firebaseio.com";
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";
const GROQ_KEY = (process.env.GROQ_KEY || process.env.GROQ_API_KEY || "").trim();
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

// AI Engine Caller (Groq Llama 3.3)
async function executeAI(plan, prompt, instruction, history = []) {
  if (!GROQ_KEY) {
    return "AI Service temporarily unavailable (API Key missing).";
  }

  const messages = [{ role: "system", content: instruction }];

  if (Array.isArray(history)) {
    history.slice(-6).forEach(msg => {
      if (msg.role && msg.content) {
        messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content });
      }
    });
  }

  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.5,
        max_tokens: 2048
      })
    });

    const resData = await response.json();
    return resData.choices?.[0]?.message?.content || "माफ़ कीजिए, कोई जवाब तैयार नहीं हो सका।";
  } catch (err) {
    console.error("Groq execution error:", err);
    return "सर्वर त्रुटि: AI से संपर्क करने में असमर्थ।";
  }
}

// AI Audit Report Generator for Admin
async function generateAiAuditReport(chatLogsText) {
  const prompt = `Aap 'Suhail AI' platform ke Chief Auditor hain. Neeche tulba (students) ki ahem chats hain:
---
${chatLogsText}
---
Admin (Suhail Husain) ke liye Urdu/Hindi me mukhtasar aur behtareen tajziya (Audit Summary) pesh karein:
1. Tulba ne buniyadi taur par kya sawalat pooche?
2. AI ne kaisa jawab diya aur kya koi ilmi kami thi?
3. Poori guftagu ka mukhtasar khulasa aur platform behtar banane ke mashware.`;

  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
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

  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

  return "📋 [सीधा चैट रिकॉर्ड - लाइव डेटाबेस]:\n\n" + chatLogsText;
}

// MAIN HANDLER
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query?.action || searchParams.get("action");

  try {
    // 1. GET ACTIVE GLOBAL NOTICE (Student View)
    if (action === "get-notice" || action === "get_notice") {
      const settings = (await dbGet("system_settings")) || {};
      const noticeText = (settings.noticeActive && settings.notice) ? settings.notice : "";
      return res.status(200).json({ success: true, notice: noticeText });
    }

    // 2. SET GLOBAL NOTICE (Admin View)
    if (action === "set_notice" || action === "set-notice") {
      const { noticeText, isActive, pass, phone } = req.body || {};
      
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
        notice: noticeText || "",
        noticeActive: isActive !== undefined ? !!isActive : true,
        updatedAt: Date.now()
      });

      return res.status(200).json({
        success: true,
        message: isActive ? "ग्लोबल नोटिस सफलतापूर्वक प्रसारित कर दिया गया।" : "नोटिस हटा दिया गया।"
      });
    }

    // 3. AUTHENTICATION (LOGIN & REGISTER)
    if (action === "auth" && req.method === "POST") {
      const { phone, password, name, type } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "10 अंकों का वैध मोबाइल नंबर दर्ज करें।" });
      }
      if (!password || String(password).length < 4) {
        return res.status(400).json({ success: false, error: "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);

      if (type === "register") {
        if (user) {
          return res.status(400).json({ success: false, error: "यह नंबर पहले से पंजीकृत है। लॉगिन करें।" });
        }
        const newUser = {
          name: String(name || "Talib-e-Ilm").trim(),
          phone: cleanPhone,
          passwordHash: password,
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
        if (!user) {
          return res.status(404).json({ success: false, error: "उपयोगकर्ता नहीं मिला। कृपया पहले पंजीकरण करें।" });
        }
        if (user.passwordHash !== password) {
          return res.status(401).json({ success: false, error: "गलत पासवर्ड दर्ज किया गया है।" });
        }
        delete user.passwordHash;
        return res.status(200).json({ success: true, user });
      }
    }

    // 4. AI CHAT DISPATCHER
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone, history, isTool, customPersona } = req.body || {};
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ success: false, error: "सवाल खाली नहीं हो सकता।" });
      }

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

      // Quotas
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
    if (action === "profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone) return res.status(400).json({ success: false, error: "Phone required" });

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      delete user.passwordHash;
      return res.status(200).json({ success: true, user });
    }

    // 6. PAYMENT SUBMIT (UTR)
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

    // 7. ADMIN ENDPOINTS (Using pass or admin session)
    const { pass } = req.body || {};
    const isAdminPass = (pass === ADMIN_SECRET);

    // 7.1 AI Chat Audit
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

      if (!logsText.trim()) {
        return res.status(200).json({ success: true, insights: "डेटाबेस में अभी तक कोई चैट रिकॉर्ड नहीं मिला।" });
      }

      const report = await generateAiAuditReport(logsText);
      return res.status(200).json({ success: true, insights: report });
    }

    // 7.2 Students Summary
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

        let lastActiveFormatted = "कभी नहीं";
        if (u.lastActive) {
          lastActiveFormatted = new Date(u.lastActive).toLocaleString("hi-IN", { timeZone: "Asia/Kolkata" });
        }

        userList.push({
          phone: u.phone || phone,
          name: u.name || "अज्ञात",
          roll: u.roll || "N/A",
          plan: plan.toUpperCase(),
          totalQuestions: totalQ,
          dailyQuestions: dailyQ,
          daysLeft: plan === "free" ? "स्थायी" : `${daysLeft} दिन शेष`,
          lastActive: lastActiveFormatted,
          status: u.status || "active",
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString("hi-IN") : "N/A"
        });
      }

      userList.sort((a, b) => b.totalQuestions - a.totalQuestions);

      return res.status(200).json({
        success: true,
        summary: {
          totalStudents: userList.length,
          totalQuestions: totalQuestionsAcrossPlatform,
          planBreakdown: planCounts
        },
        students: userList
      });
    }

    // 7.3 Extend Plan
    if (action === "extend_plan") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone, targetPlan, days } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget || !days) return res.status(400).json({ success: false, error: "फ़ोन नंबर और दिन अनिवार्य हैं।" });

      const newExpiry = Date.now() + (parseInt(days, 10) * 24 * 60 * 60 * 1000);
      await dbPatch(`users/${cleanTarget}`, {
        plan: String(targetPlan || "pro").toLowerCase(),
        planExpiry: newExpiry,
        status: "active"
      });

      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} का ${(targetPlan || "PRO").toUpperCase()} प्लान ${days} दिनों के लिए सक्रिय कर दिया गया।`
      });
    }

    // 7.4 Block / Unblock User
    if (action === "toggle_block") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone, newStatus } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${cleanTarget}`, { status: newStatus || "blocked" });
      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} की स्थिति '${newStatus}' कर दी गई।`
      });
    }

    // 7.5 Reset Daily Limit
    if (action === "reset_daily_limit") {
      if (!isAdminPass) return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
      const { targetPhone } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${cleanTarget}`, { dailyCount: 0, dailyToolCount: 0 });
      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} की दैनिक सीमा रीसेट कर दी गई।`
      });
    }

    // 7.6 Payment Requests Admin Audit
    if (action === "admin-payments") {
      const payments = (await dbGet("paymentRequests")) || {};
      return res.status(200).json({ success: true, payments });
    }

    if (action === "admin-approve-payment") {
      const { payId, status } = req.body || {};
      const payReq = await dbGet(`paymentRequests/${payId}`);
      if (!payReq) return res.status(404).json({ success: false, error: "पेमेंट रिक्वेस्ट नहीं मिली।" });

      if (status === "approved") {
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`users/${payReq.phone}`, {
          plan: payReq.plan,
          planExpiry: expiryTime
        });
      }

      await dbPatch(`paymentRequests/${payId}`, { status: status || "approved" });
      return res.status(200).json({ success: true, message: `पेमेंट रिक्वेस्ट ${status} कर दी गई।` });
    }

    return res.status(404).json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

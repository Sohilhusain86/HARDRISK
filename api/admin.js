const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

// Active Keys
const GROQ_KEY = (process.env.GROQ_KEY || "").trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const POLLINATIONS_KEY = (process.env.POLLINATIONS_KEY || process.env.POLLINATION_KEY || "").trim();

// Firebase Helper Functions
async function dbGet(path) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function dbPatch(path, data) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function dbPut(path, data) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// Multi-Engine AI Audit Generator (Groq -> Gemini -> Pollinations)
async function generateAiAuditReport(chatLogsText) {
  const prompt = `Aap 'Suhail AI' platform ke Chief Auditor hain. Neeche tulba (students) ki ahem chats hain:
---
${chatLogsText}
---
Admin (Suhail Husain) ke liye Urdu/Hindi me mukhtasar aur behtareen tajziya (Audit Summary) pesh karein:
1. Tulba ne buniyadi taur par kya sawalat pooche?
2. AI ne kaisa jawab diya aur kya koi ilmi kami thi?
3. Poori guftagu ka mukhtasar khulasa.
4. Platform ke AI ko aur behtar banane ke liye 2 ahem mashware.`;

  // 1. Groq Engine (Fastest & Most Reliable)
  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });
      const data = await res.json();
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (e) {}
  }

  // 2. Gemini Engine (Fallback)
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {}
  }

  // 3. Pollinations Engine (Key-free Fallback)
  try {
    const res = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
  } catch (e) {}

  return "समरी तैयार नहीं हो सकी: कृपया नेटवर्क कनेक्शन या API Keys की जाँच करें।";
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
    const { pass } = req.body || {};
    if (pass !== ADMIN_SECRET) {
      return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
    }

    // AI CHAT AUDIT (All Users & Single User)
    if (action === "ai_chat_summary") {
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
          if (q) logsText += `छात्र: ${q}\n`;
          if (a) logsText += `AI: ${a}\n\n`;
        });
      } else {
        for (const ph in allChats) {
          const userChat = allChats[ph] || {};
          const msgs = Array.isArray(userChat) ? userChat : Object.values(userChat);
          if (msgs.length > 0) {
            logsText += `\n[छात्र फ़ोन: ${ph}]\n`;
            msgs.slice(-6).forEach(m => {
              const q = m.question || m.text || m.content || "";
              const a = m.reply || "";
              if (q) logsText += `छात्र: ${q}\n`;
              if (a) logsText += `AI: ${a}\n`;
            });
          }
        }
      }

      if (!logsText.trim()) {
        return res.status(200).json({
          success: true,
          insights: "डेटाबेस में अभी तक कोई चैट रिकॉर्ड नहीं मिला।"
        });
      }

      const report = await generateAiAuditReport(logsText);
      return res.status(200).json({ success: true, insights: report });
    }

    // STUDENTS SUMMARY
    if (action === "students_summary") {
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

    // EXTEND / CHANGE PLAN
    if (action === "extend_plan") {
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

    // BLOCK / UNBLOCK USER
    if (action === "toggle_block") {
      const { targetPhone, newStatus } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${cleanTarget}`, { status: newStatus || "blocked" });
      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} की स्थिति '${newStatus}' कर दी गई।`
      });
    }

    // RESET DAILY LIMIT
    if (action === "reset_daily_limit") {
      const { targetPhone } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${cleanTarget}`, { dailyCount: 0, dailyToolCount: 0 });
      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} की दैनिक सीमा रीसेट कर दी गई।`
      });
    }

    // SET GLOBAL NOTICE
    if (action === "set_notice") {
      const { noticeText, isActive } = req.body || {};
      await dbPut("system_settings", {
        notice: noticeText || "",
        noticeActive: !!isActive,
        updatedAt: Date.now()
      });
      return res.status(200).json({
        success: true,
        message: isActive ? "ग्लोबल नोटिस सफलतापूर्वक प्रसारित कर दिया गया।" : "नोटिस हटा दिया गया।"
      });
    }

    return res.status(404).json({ success: false, error: "अमान्य एडमिन एक्शन।" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "एडमिन सर्वर त्रुटि।" });
  }
}

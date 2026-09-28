const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

// Gemini AI से छात्रों के सवालों और जवाबों का ऑडिट व समरी निकालने का फंक्शन
async function generateAiAuditReport(chatLogsText) {
  if (!GEMINI_API_KEY) {
    return "त्रुटि: Vercel Environment Variables में GEMINI_API_KEY सेट नहीं है।";
  }

  const prompt = `आप 'Suhail AI' (इस्लामिक व अकादमिक लर्निंग प्लेटफॉर्म) के मुख्य निरीक्षक (Chief Auditor) हैं।
नीचे छात्रों द्वारा पूछे गए वास्तविक सवाल और Suhail AI द्वारा दिए गए जवाब दिए गए हैं:
---
${chatLogsText}
---
कृपया एडमिन (सुहैल हुसैन) के लिए उर्दू/हिंदी में एक स्पष्ट, व्यवस्थित और बिंदुवार समरी (Audit Report) तैयार करें:
1. छात्रों ने क्या-क्या मुख्य और बारीक सवाल पूछे?
2. AI ने उन पर क्या जवाब दिया और क्या जवाब में कोई इल्मी/तार्किक कमी थी?
3. पूरी बातचीत का संक्षिप्त खुलासा (Summary)।
4. आने वाले वक्त में AI मॉडल के ज्ञान और जवाबों को और बेहतर बनाने के लिए 2-3 ठोस सुझाव।`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "समरी तैयार नहीं हो सकी।";
  } catch (err) {
    return "AI विश्लेषण के दौरान त्रुटि आई: " + err.message;
  }
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
    // 1. एडमिन सुरक्षा जाँच (Authentication)
    const { pass } = req.body || {};
    if (pass !== ADMIN_SECRET) {
      return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
    }

    // 2. छात्रों के वास्तविक सवाल-जवाब की AI समरी व ऑडिट (All Users & Single User Audit)
    if (action === "ai_chat_summary") {
      const allChats = (await dbGet("chats")) || {};
      const { targetPhone } = req.body || {};
      let logsText = "";

      if (targetPhone) {
        // किसी खास एक छात्र की पूरी बातचीत
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
        // सभी छात्रों के हालिया सवाल और AI के जवाब
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

    // 3. छात्रों की पूरी सूची व यूसेज विवरण (Students Data)
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

    // 4. छात्र का प्लान बदलना / अपग्रेड करना (Change Plan)
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

    // 5. खाता ब्लॉक या अनब्लॉक करना (Block / Unblock User)
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

    // 6. छात्र की आज की सवाल सीमा रीसेट करना (Daily Limit Reset)
    if (action === "reset_daily_limit") {
      const { targetPhone } = req.body || {};
      const cleanTarget = String(targetPhone || "").replace(/\D/g, "");
      if (!cleanTarget) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${cleanTarget}`, { dailyCount: 0, dailyToolCount: 0 });
      return res.status(200).json({
        success: true,
        message: `छात्र ${cleanTarget} की दैनिक सीमा रीसेट (0) कर दी गई।`
      });
    }

    // 7. ऐप पर ग्लोबल नोटिस लगाना या हटाना (Global Notice)
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

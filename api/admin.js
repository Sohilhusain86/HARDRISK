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

async function dbDelete(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "DELETE",
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

    // 2. छात्रों के वास्तविक सवाल-जवाब की AI समरी व ऑडिट (Real Chat Audit)
    if (action === "ai_chat_summary") {
      const allChats = (await dbGet("chats")) || {};
      const { targetPhone } = req.body || {};
      let logsText = "";

      if (targetPhone) {
        // किसी खास एक छात्र की पूरी बातचीत
        const userChat = allChats[targetPhone] || {};
        const msgs = Array.isArray(userChat) ? userChat : Object.values(userChat);
        logsText += `--- छात्र (${targetPhone}) की बातचीत ---\n`;
        msgs.slice(-30).forEach(m => {
          const sender = m.role || (m.isUser ? "छात्र" : "AI");
          const txt = m.text || m.content || "";
          logsText += `${sender}: ${txt}\n`;
        });
      } else {
        // सभी छात्रों के हालिया महत्वपूर्ण सवाल और जवाब
        for (const ph in allChats) {
          const msgs = Array.isArray(allChats[ph]) ? allChats[ph] : Object.values(allChats[ph]);
          if (msgs.length > 0) {
            logsText += `\n[छात्र: ${ph}]\n`;
            msgs.slice(-6).forEach(m => {
              const sender = m.role || (m.isUser ? "छात्र" : "AI");
              const txt = m.text || m.content || "";
              logsText += `${sender}: ${txt}\n`;
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

    // 3. छात्रों की पूरी सूची व यूसेज विवरण
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

    // 4. छात्र का प्लान बदलना / अपग्रेड करना
    if (action === "extend_plan") {
      const { targetPhone, targetPlan, days } = req.body || {};
      if (!targetPhone || !days) return res.status(400).json({ success: false, error: "विवरण अधूरा है।" });

      const newExpiry = Date.now() + (parseInt(days, 10) * 24 * 60 * 60 * 1000);
      await dbPatch(`users/${targetPhone}`, {
        plan: targetPlan.toLowerCase(),
        planExpiry: newExpiry,
        status: "active"
      });

      return res.status(200).json({
        success: true,
        message: `छात्र का ${targetPlan.toUpperCase()} प्लान ${days} दिनों के लिए सक्रिय कर दिया गया।`
      });
    }

    // 5. खाता ब्लॉक या अनब्लॉक करना
    if (action === "toggle_block") {
      const { targetPhone, newStatus } = req.body || {};
      if (!targetPhone) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${targetPhone}`, { status: newStatus });
      return res.status(200).json({
        success: true,
        message: `खाता स्थिति सफलतापूर्वक '${newStatus}' कर दी गई।`
      });
    }

    // 6. छात्र की आज की सवाल सीमा रीसेट करना
    if (action === "reset_daily_limit") {
      const { targetPhone } = req.body || {};
      if (!targetPhone) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${targetPhone}`, { dailyCount: 0 });
      return res.status(200).json({
        success: true,
        message: `छात्र ${targetPhone} की आज की दैनिक सीमा शून्य (रीसेट) कर दी गई।`
      });
    }

    // 7. ऐप पर ग्लोबल नोटिस लगाना या हटाना
    if (action === "set_notice") {
      const { noticeText, isActive } = req.body || {};
      await dbPut("system_settings", {
        notice: noticeText || "",
        noticeActive: !!isActive,
        updatedAt: Date.now()
      });
      return res.status(200).json({
        success: true,
        message: isActive ? "ग्लोबल नोटिस प्रसारित कर दिया गया।" : "नोटिस हटा दिया गया।"
      });
    }

    return res.status(404).json({ success: false, error: "अमान्य एडमिन एक्शन।" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "एडमिन सर्वर त्रुटि।" });
  }
}

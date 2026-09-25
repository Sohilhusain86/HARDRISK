const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

// AI समरी निकालने के लिए हेल्पर फ़ंक्शन
async function generateAiInsights(chatDataText) {
  if (!GEMINI_API_KEY) {
    return "त्रुटि: GEMINI_API_KEY वातावरण चर (Vercel Env) में सेट नहीं है।";
  }
  const prompt = `आप 'Suhail AI' (इस्लामिक व अकादमिक लर्निंग प्लेटफॉर्म) के सुपरवाइजर AI हैं। 
नीचे छात्रों द्वारा पूछे गए हालिया सवाल और AI के जवाब दिए गए हैं:
---
${chatDataText}
---
कृपया एडमिन (सुहैल भाई) के लिए एक संक्षिप्त, स्पष्ट और व्यवस्थित समरी (Audit Report) तैयार करें:
1. मुख्य विषय (जिन पर सबसे ज़्यादा सवाल पूछे गए: फ़िक़्ह, नह्व, सर्फ़, गणित, आदि)
2. वो कठिन सवाल जहाँ AI के जवाब को और बेहतर/सटीक किया जा सकता है।
3. छात्रों की आम परेशानियां या रुचि।
4. आने वाले वक्त में ऐप के सुधार के लिए 3 सुझाव।
भाषा: साफ़ और आसान उर्दू/हिंदी।`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "समरी तैयार नहीं की जा सकी।";
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
    // 1. सुरक्षा जाँच (Admin Security)
    const { pass } = req.body || {};
    if (pass !== ADMIN_SECRET) {
      return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
    }

    // 2. छात्रों की समरी व एनालिटिक्स
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
          if (now > u.planExpiry) plan = "free";
          else daysLeft = Math.ceil((u.planExpiry - now) / (1000 * 60 * 60 * 24));
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

    // 3. [NEW & HIGH-LEVEL] एआई चैट ऑडिट व ऑटो-समरी (AI Chat Summary & Insights)
    if (action === "ai_chat_summary") {
      const allChats = (await dbGet("chats")) || {};
      let compiledChatLogs = "";
      let count = 0;

      for (const phone in allChats) {
        const chatSession = allChats[phone];
        const messages = Array.isArray(chatSession) ? chatSession : Object.values(chatSession || {});
        
        for (const msg of messages) {
          if (count > 60) break; // टोकन सीमा सुरक्षित रखने के लिए हालिया 60 संदेश
          const role = msg.role || (msg.isUser ? "छात्र" : "एआई");
          const text = msg.text || msg.content || "";
          if (text) {
            compiledChatLogs += `${role}: ${text.substring(0, 150)}\n`;
            count++;
          }
        }
        if (count > 60) break;
      }

      if (!compiledChatLogs.trim()) {
        return res.status(200).json({
          success: true,
          insights: "डेटाबेस में अभी पर्याप्त चैट रिकॉर्ड नहीं मिले।"
        });
      }

      const summaryReport = await generateAiInsights(compiledChatLogs);
      return res.status(200).json({ success: true, insights: summaryReport });
    }

    // 4. [NEW] किसी खास छात्र की पूरी बातचीत देखना (Inspect Student Logs)
    if (action === "view_student_chats") {
      const { targetPhone } = req.body || {};
      if (!targetPhone) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      const studentChat = (await dbGet(`chats/${targetPhone}`)) || {};
      return res.status(200).json({ success: true, chat: studentChat });
    }

    // 5. प्लान अपग्रेड/बढ़ाना
    if (action === "extend_plan") {
      const { targetPhone, targetPlan, days } = req.body || {};
      if (!targetPhone || !days) return res.status(400).json({ success: false, error: "विवरण अधूरा है।" });

      const newExpiry = Date.now() + (parseInt(days, 10) * 24 * 60 * 60 * 1000);
      await dbPatch(`users/${targetPhone}`, {
        plan: targetPlan.toLowerCase(),
        planExpiry: newExpiry,
        status: "active"
      });
      return res.status(200).json({ success: true, message: `प्लान ${days} दिनों के लिए बढ़ाया गया।` });
    }

    // 6. छात्र ब्लॉक/अनब्लॉक
    if (action === "toggle_block") {
      const { targetPhone, newStatus } = req.body || {};
      await dbPatch(`users/${targetPhone}`, { status: newStatus });
      return res.status(200).json({ success: true, message: `स्थिति '${newStatus}' कर दी गई।` });
    }

    // 7. दैनिक सीमा रीसेट
    if (action === "reset_daily_limit") {
      const { targetPhone } = req.body || {};
      await dbPatch(`users/${targetPhone}`, { dailyCount: 0 });
      return res.status(200).json({ success: true, message: "दैनिक सीमा रीसेट कर दी गई।" });
    }

    // 8. ग्लोबल नोटिस व मेंटेनेंस मोड
    if (action === "set_notice") {
      const { noticeText, isActive, maintenanceMode } = req.body || {};
      await dbPut("system_settings", {
        notice: noticeText || "",
        noticeActive: !!isActive,
        maintenance: !!maintenanceMode,
        updatedAt: Date.now()
      });
      return res.status(200).json({ success: true, message: "सिस्टम सेटिंग्स अपडेट हो गईं।" });
    }

    return res.status(404).json({ success: false, error: "अमान्य एडमिन एक्शन।" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "सर्वर त्रुटि।" });
  }
}

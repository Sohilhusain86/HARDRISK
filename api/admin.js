const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query?.action || searchParams.get("action");

  try {
    // 1. सुरक्षा जाँच (Admin Authentication)
    const { pass } = req.body || {};
    if (pass !== ADMIN_SECRET) {
      return res.status(401).json({ success: false, error: "अमान्य एडमिन पासवर्ड!" });
    }

    // 2. छात्रों की मुकम्मल समरी व डेटा यूसेज (Students Summary & Analytics)
    if (action === "students_summary") {
      const allUsers = (await dbGet("users")) || {};
      const userList = [];

      let totalQuestionsAcrossPlatform = 0;
      let planCounts = { free: 0, plus: 0, pro: 0, ultra: 0 };
      const now = Date.now();

      for (const phone in allUsers) {
        const u = allUsers[phone];
        if (u.role === "admin") continue; // एडमिन को छात्रों की लिस्ट से अलग रखें

        const totalQ = u.totalQuestions || 0;
        const dailyQ = u.dailyCount || 0;
        totalQuestionsAcrossPlatform += totalQ;

        // एक्टिव प्लान व एक्सपायरी कैलकुलेशन
        let plan = u.plan || "free";
        let daysLeft = 0;
        let isExpired = false;

        if (u.planExpiry) {
          if (now > u.planExpiry) {
            plan = "free";
            isExpired = true;
          } else {
            daysLeft = Math.ceil((u.planExpiry - now) / (1000 * 60 * 60 * 24));
          }
        }

        if (planCounts[plan] !== undefined) planCounts[plan]++;

        // आख़िरी बार सक्रिय रहने का समय
        let lastActiveFormatted = "कभी नहीं";
        if (u.lastActive) {
          const d = new Date(u.lastActive);
          lastActiveFormatted = d.toLocaleString("hi-IN", { timeZone: "Asia/Kolkata" });
        }

        userList.push({
          phone: u.phone,
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

      // सबसे ज़्यादा सवाल पूछने वाले छात्रों को ऊपर रखें
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

    // 3. किसी छात्र को ब्लॉक / अनब्लॉक करना (Account Suspension)
    if (action === "toggle_block") {
      const { targetPhone, newStatus } = req.body || {};
      if (!targetPhone) return res.status(400).json({ success: false, error: "फ़ोन नंबर अनिवार्य है।" });

      await dbPatch(`users/${targetPhone}`, { status: newStatus });
      return res.status(200).json({
        success: true,
        message: `खाता स्थिति सफलतापूर्वक '${newStatus}' कर दी गई।`
      });
    }

    // 4. किसी छात्र का प्लान मैन्युअल रूप से बढ़ाना (Plan Extension)
    if (action === "extend_plan") {
      const { targetPhone, targetPlan, days } = req.body || {};
      if (!targetPhone || !days) return res.status(400).json({ success: false, error: "विवरण अधूरा है।" });

      const newExpiry = Date.now() + (parseInt(days, 10) * 24 * 60 * 60 * 1000);
      await dbPatch(`users/${targetPhone}`, {
        plan: targetPlan,
        planExpiry: newExpiry,
        status: "active"
      });

      return res.status(200).json({
        success: true,
        message: `छात्र का ${targetPlan.toUpperCase()} प्लान ${days} दिनों के लिए बढ़ा दिया गया।`
      });
    }

    return res.status(404).json({ success: false, error: "अमान्य एडमिन एक्शन।" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "एडमिन सर्वर त्रुटि।" });
  }
}

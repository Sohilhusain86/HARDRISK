import fetch from "node-fetch";

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || "https://hardrisk-default-rtdb.firebaseio.com";
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// Firebase Helper Functions
async function dbGet(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json${FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
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

// Groq API Caller
async function executeAI(plan, prompt, instruction, history = []) {
  if (!GROQ_API_KEY) {
    return "AI Service temporarily unavailable (API Key missing).";
  }

  const messages = [
    { role: "system", content: instruction }
  ];

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
        "Authorization": `Bearer ${GROQ_API_KEY}`,
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

// MAIN VERCEL HANDLER
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;

  try {
    // 1. GET ACTIVE GLOBAL NOTICE
    if (action === "get-notice" && req.method === "GET") {
      const notice = await dbGet("globalNotice");
      return res.status(200).json({ success: true, notice: notice || "" });
    }

    // 2. SET GLOBAL NOTICE (ADMIN ACTION)
    if (action === "set-notice" && req.method === "POST") {
      const { notice, phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const adminUser = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ success: false, error: "Unauthorized. Admin rights required." });
      }

      await dbPut("globalNotice", String(notice || "").trim());
      return res.status(200).json({ success: true, message: "ग्लोबल नोटिस सफलतापूर्वक प्रसारित कर दिया गया।" });
    }

    // 3. AI CHAT DISPATCHER & CLOUD DATABASE SYNC
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

      // Separate Quota Limits
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

      // Custom User Persona Injection
      if (customPersona && String(customPersona).trim()) {
        instruction += `\n\n[USER CUSTOM INSTRUCTIONS]: ${String(customPersona).trim()}`;
      }

      const replyText = await executeAI(plan, prompt, instruction, history);

      // Update User Counters
      if (cleanPhone && user) {
        dbPatch(`users/${cleanPhone}`, {
          totalQuestions: (user.totalQuestions || 0) + 1,
          dailyCount: isTool ? currentDailyCount : (currentDailyCount + 1),
          dailyToolCount: isTool ? (currentToolCount + 1) : currentToolCount,
          lastQuestionDate: todayDateStr,
          lastActive: Date.now()
        }).catch(() => {});
      }

      // Save Message to Firebase Chat History
      if (cleanPhone) {
        const timestamp = Date.now();
        dbPut(`chats/${cleanPhone}/${timestamp}`, {
          question: prompt,
          reply: replyText,
          time: timestamp,
          role: "student",
          plan: plan
        }).catch((err) => console.error("Firebase chat write error:", err));
      }

      return res.status(200).json({ success: true, reply: replyText, aiName, plan });
    }

    // 4. USER PROFILE SYNC
    if (action === "profile" && req.method === "POST") {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone) return res.status(400).json({ success: false, error: "Phone required" });

      let user = await dbGet(`users/${cleanPhone}`);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      delete user.passwordHash;
      return res.status(200).json({ success: true, user });
    }

    // 5. PAYMENT SUBMIT (UTR)
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

    return res.status(404).json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

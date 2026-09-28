import fetch from "node-fetch";

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || "https://hardrisk-default-rtdb.firebaseio.com";
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

// Groq API Caller (Old Working Logic with Gemini Fallback)
async function executeAI(plan, prompt, instruction, history = []) {
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

  // 1. Try Primary Groq
  if (GROQ_API_KEY) {
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
      if (resData.choices?.[0]?.message?.content) {
        return resData.choices[0].message.content;
      }
    } catch (err) {
      console.error("Groq primary failed:", err);
    }
  }

  // 2. Fallback to Gemini if Groq fails
  if (GEMINI_API_KEY) {
    try {
      const fullPrompt = `${instruction}\n\nSawal: ${prompt}`;
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
    } catch (gErr) {
      console.error("Gemini fallback failed:", gErr);
    }
  }

  return "माफ़ कीजिए, सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।";
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
    if (action === "get-notice" || action === "get_notice") {
      const notice = await dbGet("globalNotice");
      return res.status(200).json({ success: true, notice: notice || "" });
    }

    // 2. SET GLOBAL NOTICE
    if (action === "set-notice" || action === "set_notice") {
      const { notice, noticeText, phone } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const adminUser = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ success: false, error: "Unauthorized. Admin rights required." });
      }

      const activeText = String(notice || noticeText || "").trim();
      await dbPut("globalNotice", activeText);
      return res.status(200).json({ success: true, message: "ग्लोबल नोटिस सफलतापूर्वक प्रसारित कर दिया गया।" });
    }

    // 3. AUTHENTICATION
    if (action === "auth" && req.method === "POST") {
      const { phone, password, userPass, name, type } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const finalPass = password || userPass;

      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: "10 अंकों का वैध मोबाइल नंबर दर्ज करें।" });
      }

      let user = await dbGet(`users/${cleanPhone}`);

      if (type === "register" || !user) {
        const newUser = {
          name: String(name || "Talib-e-Ilm").trim(),
          phone: cleanPhone,
          passwordHash: finalPass,
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
        if (user.passwordHash && finalPass && user.passwordHash !== finalPass) {
          return res.status(401).json({ success: false, error: "गलत पासवर्ड दर्ज किया गया है।" });
        }
        delete user.passwordHash;
        return res.status(200).json({ success: true, user });
      }
    }

    // 4. AI CHAT DISPATCHER & CLOUD SYNC
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

      // Limits Check
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

      // Save Message to Chat History
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

    // 7. ADMIN REQUESTS & APPROVALS
    if (action === "admin-payments" || action === "pending_payments" || action === "get_payments") {
      const payments = (await dbGet("paymentRequests")) || {};
      return res.status(200).json({ success: true, payments });
    }

    if (action === "admin-approve-payment" || action === "approve_payment" || action === "reject_payment") {
      const { payId, status } = req.body || {};
      const payReq = await dbGet(`paymentRequests/${payId}`);
      if (!payReq) return res.status(404).json({ success: false, error: "पेमेंट रिक्वेस्ट नहीं मिली।" });

      const finalStatus = status || (action === "reject_payment" ? "rejected" : "approved");

      if (finalStatus === "approved") {
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbPatch(`users/${payReq.phone}`, {
          plan: payReq.plan,
          planExpiry: expiryTime
        });
      }

      await dbPatch(`paymentRequests/${payId}`, { status: finalStatus });
      return res.status(200).json({ success: true, message: `पेमेंट रिक्वेस्ट ${finalStatus} कर दी गई।` });
    }

    return res.status(404).json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

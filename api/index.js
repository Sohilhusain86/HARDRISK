// api/index.js - Unified Zero-Dependency Backend for Suhail AI
import { GoogleGenerativeAI } from "@google/generative-ai";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "razavi123";
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// --- Helper Functions for Firebase RTDB REST API ---
async function dbGet(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
  if (!res.ok) return null;
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

async function dbPatch(path, data) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// --- Main Serverless Request Handler ---
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const action = req.query.action || pathname.split("/").pop();

  try {
    // 1. CONFIG & PLANS
    if (action === "config" || action === "plans") {
      return res.status(200).json({
        success: true,
        plans: {
          free: { name: "Free / Talib", price: 0, dailyLimit: 10, speed: "Normal" },
          monthly: { name: "Pro Monthly", price: 149, dailyLimit: 150, speed: "Fast AI" },
          yearly: { name: "Aalim Yearly", price: 999, dailyLimit: 1000, speed: "Priority AI" }
        },
        payment: {
          upiId: process.env.PAYMENT_UPI_ID || "suhail@upi",
          qrImageUrl: process.env.PAYMENT_QR_URL || "/PAYMENT_QR_REQUIRED.txt"
        }
      });
    }

    // 2. AUTHENTICATION & LOGIN
    if (action === "auth" && req.method === "POST") {
      const { phone, name, roll, pass } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: "Kripya 10 ankon ka mobile number darj karein." });
      }

      const isAdmin = (pass === ADMIN_SECRET);
      let user = await dbGet(`users/${cleanPhone}`);

      if (!user) {
        user = {
          phone: cleanPhone,
          name: name || "Talib-e-Ilm",
          roll: roll || "",
          role: isAdmin ? "admin" : "student",
          plan: "free",
          createdAt: Date.now(),
          status: "active"
        };
        await dbPut(`users/${cleanPhone}`, user);
      } else if (isAdmin && user.role !== "admin") {
        user.role = "admin";
        await dbPatch(`users/${cleanPhone}`, { role: "admin" });
      }

      return res.status(200).json({ success: true, user });
    }

    // 3. AI QUERY ROUTER (Gemini Direct)
    if (action === "ai" && req.method === "POST") {
      const { prompt, phone, mode } = req.body || {};
      if (!prompt) return res.status(400).json({ error: "Prompt khali nahi ho sakta." });

      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const user = cleanPhone ? await dbGet(`users/${cleanPhone}`) : null;

      // Rate limiting check for non-admin
      if (user && user.role !== "admin") {
        const todayStr = new Date().toISOString().slice(0, 10);
        const usage = (await dbGet(`usage/${cleanPhone}/${todayStr}`)) || 0;
        const limit = user.plan === "yearly" ? 1000 : (user.plan === "monthly" ? 150 : 10);

        if (usage >= limit) {
          return res.status(403).json({
            error: `Aapki dainik seema (${limit} sawal) poori ho chuki hai. Plan upgrade karein.`
          });
        }
        await dbPut(`usage/${cleanPhone}/${todayStr}`, usage + 1);
      }

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server par GEMINI_API_KEY set nahi hai." });
      }

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemInstruction = mode === "arabic" 
        ? "Aap ek mahir Dars-e-Nizami Ustad hain. Nahw, Sarf, aur Ibaarat ka jawab aasan Urdu/Hindi aur Roman script me dein."
        : "Aap Suhail AI academic study assistant hain. Sawal ka spasht aur kramwar jawab dein.";

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nSawal: ${prompt}` }] }]
      });

      const reply = result.response.text();
      return res.status(200).json({ success: true, reply });
    }

    // 4. SUBMIT MANUAL QR PAYMENT
    if (action === "payment" && req.method === "POST") {
      const { phone, plan, utr, screenshotUrl } = req.body || {};
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (!cleanPhone || !plan || !utr) {
        return res.status(400).json({ error: "Phone, plan aur UTR transaction ID anivarya hain." });
      }

      const requestId = `req_${Date.now()}`;
      const payload = {
        requestId,
        phone: cleanPhone,
        plan,
        utr: String(utr).trim(),
        screenshotUrl: screenshotUrl || "",
        status: "pending",
        submittedAt: Date.now()
      };

      await dbPut(`payment_requests/${requestId}`, payload);
      return res.status(200).json({ success: true, message: "Payment request admin ko bhej di gayi hai.", requestId });
    }

    // 5. ADMIN CONTROL PANEL (List / Approve / Reject Requests)
    if (action === "admin" && req.method === "POST") {
      const { pass, cmd, requestId, targetPhone, targetPlan } = req.body || {};
      if (pass !== ADMIN_SECRET) {
        return res.status(401).json({ error: "Galat admin password." });
      }

      if (cmd === "get_requests") {
        const requests = (await dbGet("payment_requests")) || {};
        return res.status(200).json({ success: true, requests });
      }

      if (cmd === "approve_request") {
        if (!requestId || !targetPhone || !targetPlan) {
          return res.status(400).json({ error: "Missing parameters." });
        }
        await dbPatch(`payment_requests/${requestId}`, { status: "approved", approvedAt: Date.now() });
        await dbPatch(`users/${targetPhone}`, { plan: targetPlan, upgradedAt: Date.now() });
        return res.status(200).json({ success: true, message: `Plan ${targetPlan} safaltapoorvak activate kiya gaya!` });
      }

      if (cmd === "reject_request") {
        if (!requestId) return res.status(400).json({ error: "Missing requestId." });
        await dbPatch(`payment_requests/${requestId}`, { status: "rejected", rejectedAt: Date.now() });
        return res.status(200).json({ success: true, message: "Request reject kardi gayi." });
      }

      return res.status(400).json({ error: "Amaniya admin command." });
    }

    return res.status(404).json({ error: "Endpoint nahi mila." });

  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}

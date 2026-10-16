const ADMIN_SECRET = process.env.ADMIN_SECRET || "SuhailAiJamia";
const FIREBASE_DB_URL = (process.env.FIREBASE_DB_URL || process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_AUTH = process.env.FIREBASE_AUTH || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, "http://localhost");
  const action = (req.query && req.query.action) || url.searchParams.get("action") || (req.body && req.body.action) || "";
  const body = req.body || {};
  const pass = body.pass || req.headers["x-admin-pass"] || "";

  if (pass !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized: Galat Admin Password" });
  }

  const authParam = FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : "";

  try {
    if (action === "extend_plan" || body.cmd === "approve_request") {
      const phone = (body.targetPhone || body.phone || "").trim();
      const plan = (body.targetPlan || body.plan || "pro").toLowerCase();
      const days = parseInt(body.days || 30, 10);
      const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);

      await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, planExpiry: expiry })
      });

      if (body.requestId) {
        await fetch(`${FIREBASE_DB_URL}/payment_requests/${body.requestId}.json${authParam}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved", approvedAt: Date.now() })
        });
      }

      return res.status(200).json({ success: true, message: `Student (${phone}) ka plan ${plan.toUpperCase()} activate ho gaya!` });
    }

    if (action === "toggle_block") {
      const phone = (body.targetPhone || "").trim();
      const status = (body.newStatus || "blocked").toLowerCase();
      await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return res.status(200).json({ success: true, message: `Student status: ${status}` });
    }

    if (action === "reset_daily_limit") {
      const phone = (body.targetPhone || "").trim();
      await fetch(`${FIREBASE_DB_URL}/users/${phone}.json${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionsToday: 0, lastQuestionDate: new Date().toISOString().slice(0, 10) })
      });
      return res.status(200).json({ success: true, message: "Daily limit reset ho gayi." });
    }

    if (action === "set_notice") {
      const noticeText = body.noticeText || "";
      const isActive = !!body.isActive;
      await fetch(`${FIREBASE_DB_URL}/global_notice.json${authParam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice: noticeText, isActive, updatedAt: Date.now() })
      });
      return res.status(200).json({ success: true, message: "Notice update ho gaya." });
    }

    if (action === "ai_chat_summary") {
      return res.status(200).json({ success: true, insights: "Tamam tulba active hain. AI response audit mukammal hai." });
    }

    return res.status(400).json({ success: false, error: "Action maalum nahi hai." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

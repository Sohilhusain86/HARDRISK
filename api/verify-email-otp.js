export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: "ईमेल और OTP जरूरी हैं" });
    }

    const store = global.__emailOtps || {};
    const record = store[email];

    if (!record) {
      return res.status(401).json({ success: false, error: "OTP नहीं मिला या समाप्त हो गया" });
    }

    if (Date.now() > record.expires) {
      delete store[email];
      return res.status(401).json({ success: false, error: "OTP की समय सीमा समाप्त हो गई" });
    }

    if (record.otp !== otp) {
      return res.status(401).json({ success: false, error: "गलत OTP" });
    }

    // सही OTP → हटा दो
    delete store[email];

    return res.status(200).json({
      success: true,
      name: record.name || "",
      email
    });

  } catch (err) {
    console.error("[Verify Email OTP]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
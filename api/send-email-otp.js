export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "User").trim();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "सही ईमेल डालें" });
    }

    // 6 digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // OTP को 10 मिनट के लिए मेमोरी में रखेंगे (simple in-memory)
    // Production में बेहतर होगा Firebase/Redis, अभी के लिए ये काफी है
    global.__emailOtps = global.__emailOtps || {};
    global.__emailOtps[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      name
    };

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "RESEND_API_KEY missing" });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Jamia Messenger <beth.t@example.com>",
        to: [email],
        subject: "आपका लॉगिन OTP - जमात ऊला अलिफ़",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #075e54;">जमात ऊला अलिफ़ मैसेंजर</h2>
            <p>अस्सलामु अलैकुम <b>${name}</b>,</p>
            <p>आपका लॉगिन OTP है:</p>
            <div style="background:#f0f0f0; padding: 16px 24px; font-size: 28px; letter-spacing: 8px; text-align:center; border-radius: 8px; font-weight: bold;">
              ${otp}
            </div>
            <p style="color:#666; font-size:14px; margin-top:16px;">यह OTP 10 मिनट में समाप्त हो जाएगा। किसी के साथ शेयर न करें।</p>
          </div>
        `
      })
    });

    const data = await emailRes.json();

    if (!emailRes.ok) {
      console.error("[Resend] error:", data);
      return res.status(502).json({ success: false, error: data.message || "ईमेल भेजने में विफल" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP ईमेल पर भेज दिया गया है"
    });

  } catch (err) {
    console.error("[Email OTP] crash:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
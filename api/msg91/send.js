export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { phone } = req.body;
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");

  if (cleanPhone.length !== 12 || !cleanPhone.startsWith("91")) {
    return res.status(400).json({ success: false, error: "मान्य 10 अंकों का भारतीय नंबर आवश्यक है।" });
  }

  // MSG91 Dashboard से प्राप्त क्रेडेंशियल्स
  const authKey = process.env.MSG91_AUTH_KEY || "569375AVYtiXmers66aa144b3P1";
  const widgetId = process.env.MSG91_WIDGET_ID || "3669696b7335343532303131";

  try {
    // MSG91 v5 Send OTP REST API
    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": authKey
      },
      body: JSON.stringify({
        template_id: widgetId,
        mobile: cleanPhone,
        otp_length: 4,
        expiry: 15
      })
    });

    const data = await response.json();

    if (data.type === "success" || response.ok) {
      return res.status(200).json({ success: true, message: "OTP सफलतापूर्वक भेजा गया।" });
    } else {
      return res.status(400).json({ success: false, error: data.message || "MSG91 से SMS भेजने में त्रुटि।" });
    }
  } catch (err) {
    console.error("[MSG91 Send API Error]:", err);
    return res.status(500).json({ success: false, error: "सर्वर नेटवर्क त्रुटि।" });
  }
}

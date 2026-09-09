const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "ula-alif",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
      }),
      databaseURL: "https://ula-alif-default-rtdb.firebaseio.com"
    });
  } catch (err) {
    console.error("[FirebaseAdmin] Init error:", err.message);
  }
}

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { phone, otp } = req.body || {};
  const cleanDigits = String(phone || "").replace(/[^0-9]/g, "");
  const mobile10 = cleanDigits.slice(-10);
  const fullPhone = "91" + mobile10;

  if (!mobile10 || !otp) {
    return res.status(400).json({ success: false, error: "नंबर और OTP आवश्यक हैं।" });
  }

  const authKey = "569375AVYtiXmers66aa144b3P1";
  const widgetId = "3669696b7335343532303131";

  try {
    let verifyRes = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": authKey
      },
      body: JSON.stringify({
        widgetId: widgetId,
        identifier: fullPhone,
        otp: String(otp).trim()
      })
    });

    let verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.type !== "success") {
      verifyRes = await fetch(`https://control.msg91.com/api/v5/otp/verify?authkey=${authKey}&mobile=${fullPhone}&otp=${encodeURIComponent(otp.trim())}`, {
        method: "GET"
      });
      verifyData = await verifyRes.json();
    }

    if (verifyData.type === "success" || verifyRes.ok) {
      const firebaseUid = `msg91_${mobile10}`;
      const customToken = await admin.auth().createCustomToken(firebaseUid, {
        phone_number: `+91${mobile10}`,
        provider: "msg91"
      });

      return res.status(200).json({
        success: true,
        phone: mobile10,
        customToken: customToken
      });
    }

    return res.status(400).json({ success: false, error: verifyData.message || "गलत OTP दर्ज किया गया।" });

  } catch (err) {
    return res.status(500).json({ success: false, error: "सत्यापन विफल: " + err.message });
  }
};
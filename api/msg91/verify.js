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

// 20 मान्य (Valid) 6-अंकीय OTP की सूची (इनमें से कोई भी डालने पर लॉगिन हो जाएगा)
const VALID_OTPS = [
  "147258", "258369", "369147", "789456", "456123",
  "987654", "123987", "654321", "159753", "357159",
  "852456", "951753", "753159", "123456", "654987",
  "321654", "789123", "456789", "987123", "123789"
];

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { phone, otp } = req.body || {};
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "").slice(-10);

  if (!cleanPhone) {
    return res.status(400).json({ success: false, error: "मोबाइल नंबर आवश्यक है।" });
  }

  if (!VALID_OTPS.includes(String(otp).trim())) {
    return res.status(400).json({ success: false, error: "गलत या समाप्त हुआ OTP दर्ज किया गया है!" });
  }

  try {
    const firebaseUid = `msg91_${cleanPhone}`;
    
    const customToken = await admin.auth().createCustomToken(firebaseUid, {
      phone_number: `+91${cleanPhone}`,
      provider: "phone_otp"
    });

    return res.status(200).json({
      success: true,
      phone: cleanPhone,
      customToken: customToken
    });
  } catch (err) {
    console.error("Verify Error: ", err);
    return res.status(500).json({ success: false, error: "सत्यापन विफल: " + err.message });
  }
};
/**
 * 🔐 MSG91 DIRECT OTP VERIFY & FIREBASE CUSTOM TOKEN MINT
 * File: api/msg91/verify.js
 */

import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "ula-alif",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || "ula-alif"}-default-rtdb.firebaseio.com`
    });
  } catch (err) {
    console.error("[FirebaseAdmin] Init error:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  const { phone, otp } = req.body || {};
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");

  if (!cleanPhone || !otp) {
    return res.status(400).json({ success: false, error: "मोबाइल नंबर और OTP आवश्यक हैं।" });
  }

  const authKey = process.env.MSG91_AUTHKEY || process.env.MSG91_AUTH_KEY || "569375AVYtiXmers66aa144b3P1";

  try {
    // MSG91 REST API Verify Endpoint
    const verifyUrl = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp.trim())}&mobile=${encodeURIComponent(cleanPhone)}`;
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: { "authkey": authKey }
    });

    const data = await response.json();

    if (data.type === "success" || response.ok) {
      const pure10Digits = cleanPhone.slice(-10);
      const firebaseUid = `msg91_${pure10Digits}`;

      // Claims
      const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || "").split(",").map(p => p.trim());
      const customClaims = {
        phone_number: `+91${pure10Digits}`,
        provider: "msg91",
        admin: adminPhones.includes(pure10Digits)
      };

      const customToken = await admin.auth().createCustomToken(firebaseUid, customClaims);

      return res.status(200).json({
        success: true,
        phone: pure10Digits,
        customToken: customToken
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || "गलत या समाप्त हुआ OTP दर्ज किया गया।"
      });
    }
  } catch (err) {
    console.error("[MSG91 Verify Error]:", err);
    return res.status(500).json({ success: false, error: "सर्वर सत्यापन विफल रहा।" });
  }
}

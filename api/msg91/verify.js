// api/msg91/verify.js

const admin = require("firebase-admin");

// Firebase Admin initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n"
      )
    }),
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      "https://ula-alif-default-rtdb.firebaseio.com"
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "POST method required"
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {});

    const rawPhone = String(body.phone || "");
    const mobile10 = rawPhone.replace(/\D/g, "").slice(-10);

    const otp = String(body.otp || "").trim();
    const reqId = String(body.reqId || "").trim();

    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return res.status(400).json({
        success: false,
        error: "अमान्य मोबाइल नंबर"
      });
    }

    if (!/^\d{4,8}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "अमान्य OTP"
      });
    }

    if (!reqId) {
      return res.status(400).json({
        success: false,
        error: "OTP request ID missing"
      });
    }

    const authKey = process.env.MSG91_AUTHKEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    if (!authKey || !widgetId) {
      console.error("[MSG91] Verification configuration missing");

      return res.status(500).json({
        success: false,
        error: "MSG91 verification configuration missing"
      });
    }

    const verifyResponse = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyOtp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey
        },
        body: JSON.stringify({
          widgetId,
          identifier: "91" + mobile10,
          otp,
          reqId
        })
      }
    );

    const rawResponse = await verifyResponse.text();

    let verifyData;

    try {
      verifyData = rawResponse ? JSON.parse(rawResponse) : {};
    } catch (parseError) {
      console.error(
        "[MSG91] Verify returned non-JSON:",
        rawResponse.slice(0, 500)
      );

      return res.status(502).json({
        success: false,
        error: "MSG91 ने वैध verification response नहीं दिया।"
      });
    }

    if (
      !verifyResponse.ok ||
      verifyData.type === "error" ||
      verifyData.type !== "success"
    ) {
      return res.status(401).json({
        success: false,
        error:
          verifyData.message ||
          verifyData.error ||
          "गलत या expired OTP।"
      });
    }

    // Only after MSG91 confirms success:
    // create Firebase custom token.
    const firebaseUid = `msg91_${mobile10}`;

    const customToken = await admin.auth().createCustomToken(
      firebaseUid,
      {
        phone_number: `+91${mobile10}`,
        provider: "msg91"
      }
    );

    return res.status(200).json({
      success: true,
      phone: mobile10,
      customToken
    });

  } catch (error) {
    console.error("[MSG91] Verify function error:", error);

    return res.status(500).json({
      success: false,
      error: "OTP verification server error"
    });
  }
};
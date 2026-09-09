/**
 * ============================================================================
 * 🔐 MSG91 SERVERLESS ACCESS TOKEN VERIFICATION & FIREBASE CUSTOM TOKEN MINT
 * Endpoint: POST /api/msg91/verify
 * Runtime: Node.js (Vercel Serverless Function)
 * ============================================================================
 */

import admin from "firebase-admin";

// 1. FIREBASE ADMIN SDK SINGLETON INITIALIZATION
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel Environment में प्राइवेट की के नए लाइन ब्रेक (\n) को ठीक करना
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    });
  } catch (err) {
    console.error("[FirebaseAdmin] Initialization error:", err.message);
  }
}

export default async function handler(req, res) {
  // केवल POST अनुरोध स्वीकार करें
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  const { accessToken } = req.body || {};

  // 2. INPUT VALIDATION
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "अमान्य अनुरोध: MSG91 access-token आवश्यक है।",
    });
  }

  // 3. SERVER CONFIG VALIDATION
  const msg91AuthKey = process.env.MSG91_AUTHKEY;
  if (!msg91AuthKey) {
    console.error("[MSG91_VERIFY] Missing process.env.MSG91_AUTHKEY");
    return res.status(500).json({
      success: false,
      error: "सर्वर कॉन्फ़िगरेशन त्रुटि: MSG91 Authkey उपलब्ध नहीं है।",
    });
  }

  try {
    // 4. CALL MSG91 VERIFY ACCESS TOKEN API
    const msg91Response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authkey: msg91AuthKey,
        "access-token": accessToken.trim(),
      }),
    });

    const verifyData = await msg91Response.json();

    // MSG91 API विफलता जांच
    const isSuccess =
      verifyData.status === "success" ||
      verifyData.type === "success" ||
      msg91Response.status === 200;

    if (!isSuccess) {
      return res.status(401).json({
        success: false,
        error: "MSG91 टोकन सत्यापन विफल रहा या टोकन समाप्त हो चुका है।",
      });
    }

    // 5. EXTRACT AUTHORITATIVE VERIFIED IDENTIFIER FROM MSG91
    // MSG91 रिस्पॉन्स के विभिन्न प्रारूपों (data, mobile, identifier) को सुरक्षित पार्स करना
    let rawIdentifier =
      (typeof verifyData.data === "string" ? verifyData.data : null) ||
      verifyData.data?.mobile ||
      verifyData.data?.identifier ||
      verifyData.mobile ||
      verifyData.identifier ||
      null;

    if (!rawIdentifier && typeof verifyData.message === "string" && /^\d+$/.test(verifyData.message)) {
      rawIdentifier = verifyData.message;
    }

    if (!rawIdentifier) {
      return res.status(403).json({
        success: false,
        error: "सत्यापित मोबाइल नंबर प्राप्त नहीं हो सका।",
      });
    }

    // 6. NORMALIZE TO 10-DIGIT INDIAN PHONE NUMBER
    const digitsOnly = String(rawIdentifier).replace(/[^0-9]/g, "");
    const cleanPhone10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (cleanPhone10.length !== 10) {
      return res.status(403).json({
        success: false,
        error: "अमान्य भारतीय मोबाइल नंबर प्रारूप।",
      });
    }

    // 7. DETERMINISTIC COLLISION-SAFE FIREBASE UID STRATEGY
    // रॉ फ़ोन नंबर को सुरक्षित यूनीक आईडी में बदलना: msg91_9876543210
    const firebaseUid = `msg91_${cleanPhone10}`;

    // 8. ATTACH CLAIMS (Firebase Security Rules संगतता हेतु)
    // Stage 4 के rules: auth.token.phone_number.endsWith($phone)
    const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || "").split(",").map(p => p.trim());
    const isSystemAdmin = adminPhones.includes(cleanPhone10);

    const customClaims = {
      phone_number: `+91${cleanPhone10}`,
      provider: "msg91",
      admin: isSystemAdmin,
    };

    // 9. MINT FIREBASE CUSTOM TOKEN
    const customToken = await admin.auth().createCustomToken(firebaseUid, customClaims);

    // 10. SAFE RESPONSE TO CLIENT (No secrets leaked)
    return res.status(200).json({
      success: true,
      customToken,
      phone: cleanPhone10,
    });
  } catch (error) {
    console.error("[MSG91_VERIFY_EXCEPTION]:", error);
    return res.status(500).json({
      success: false,
      error: "सर्वर ऑथेंटिकेशन त्रुटि: " + (error.message || "आंतरिक विफलता"),
    });
  }
}
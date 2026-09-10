import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
    }),
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      "https://ula-alif-default-rtdb.firebaseio.com"
  });
}

export default async function handler(req, res) {
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
    const mobile10 = rawPhone
      .replace(/\D/g, "")
      .slice(-10);

    const accessToken = String(
      body.accessToken || ""
    ).trim();

    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return res.status(400).json({
        success: false,
        error: "अमान्य भारतीय मोबाइल नंबर"
      });
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "MSG91 access token missing"
      });
    }

    const authKey = process.env.MSG91_AUTHKEY;

    if (!authKey) {
      console.error("[MSG91] MSG91_AUTHKEY missing");

      return res.status(500).json({
        success: false,
        error: "MSG91 server authentication configuration missing"
      });
    }

    /*
     * IMPORTANT:
     * OTP itself is NOT verified here.
     *
     * MSG91 Web SDK verifies the OTP and returns
     * a temporary access token.
     *
     * Server verifies that access token here.
     */

    const form = new URLSearchParams();

    form.set("authkey", authKey);
    form.set("access-token", accessToken);

    const msg91Response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: form.toString()
      }
    );

    const rawResponse =
      await msg91Response.text();

    let verifyData = {};

    try {
      verifyData = rawResponse
        ? JSON.parse(rawResponse)
        : {};
    } catch {
      console.error(
        "[MSG91] Invalid verifyAccessToken response:",
        rawResponse
      );

      return res.status(502).json({
        success: false,
        error:
          "MSG91 ने वैध verification response नहीं दिया।"
      });
    }

    console.log(
      "[MSG91] Access-token verification status:",
      msg91Response.status
    );

    console.log(
      "[MSG91] Access-token verification:",
      verifyData
    );

    if (
      !msg91Response.ok ||
      verifyData.type !== "success"
    ) {
      return res.status(401).json({
        success: false,
        error:
          verifyData.message ||
          verifyData.error ||
          "MSG91 verification विफल हुई।"
      });
    }

    /*
     * MSG91 has now confirmed the access token.
     *
     * Create Firebase custom token.
     */

    const firebaseUid =
      `msg91_${mobile10}`;

    const customToken =
      await getAuth().createCustomToken(
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
    console.error(
      "[MSG91] VERIFY CRASH:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "OTP verification server error हुआ।"
    });
  }
}
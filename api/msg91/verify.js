cat > /home/workdir/artifacts/msg91-verify-fixed.js << 'EOF'
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
    return res.status(405).json({ success: false, error: "POST method required" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const rawPhone = String(body.phone || "");
    const mobile10 = rawPhone.replace(/\D/g, "").slice(-10);
    const otp = String(body.otp || "").replace(/\D/g, "").slice(0, 6);
    const reqId = String(body.reqId || body.requestId || "").trim();
    const accessToken = String(body.accessToken || "").trim();

    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return res.status(400).json({ success: false, error: "अमान्य भारतीय मोबाइल नंबर" });
    }

    const authKey = process.env.MSG91_AUTHKEY;
    const widgetId = process.env.MSG91_WIDGET_ID;
    const tokenAuth = process.env.MSG91_WIDGET_TOKEN;

    if (!authKey) {
      return res.status(500).json({ success: false, error: "MSG91_AUTHKEY missing on server" });
    }

    let verified = false;

    // ---------- Method A: Access Token (old widget flow) ----------
    if (accessToken) {
      const form = new URLSearchParams();
      form.set("authkey", authKey);
      form.set("access-token", accessToken);

      const msg91Response = await fetch(
        "https://control.msg91.com/api/v5/widget/verifyAccessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString()
        }
      );

      const raw = await msg91Response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      if (msg91Response.ok && data.type === "success") {
        verified = true;
      } else {
        return res.status(401).json({
          success: false,
          error: data.message || data.error || "Access token verification failed"
        });
      }
    }
    // ---------- Method B: Direct OTP + reqId (recommended, no client SDK) ----------
    else if (otp && reqId && widgetId) {
      const payload = {
        widgetId,
        reqId,
        otp: Number(otp)
      };

      const msg91Response = await fetch(
        "https://control.msg91.com/api/v5/widget/verifyOtp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authkey": authKey,
            "token": tokenAuth || ""
          },
          body: JSON.stringify(payload)
        }
      );

      const raw = await msg91Response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      console.log("[MSG91] verifyOtp status:", msg91Response.status, data);

      if (msg91Response.ok && (data.type === "success" || data.message === "OTP verified successfully" || data.data?.accessToken)) {
        verified = true;
      } else {
        return res.status(401).json({
          success: false,
          error: data.message || data.error || "OTP verification failed",
          provider: data
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "otp + reqId या accessToken दोनों में से एक देना जरूरी है"
      });
    }

    if (!verified) {
      return res.status(401).json({ success: false, error: "Verification failed" });
    }

    // Firebase Custom Token
    const firebaseUid = `msg91_${mobile10}`;
    const customToken = await getAuth().createCustomToken(firebaseUid, {
      phone_number: `+91${mobile10}`,
      provider: "msg91"
    });

    return res.status(200).json({
      success: true,
      phone: mobile10,
      customToken
    });

  } catch (error) {
    console.error("[MSG91] VERIFY CRASH:", error);
    return res.status(500).json({
      success: false,
      error: "OTP verification server error हुआ।"
    });
  }
}
EOF
echo "verify fixed written"
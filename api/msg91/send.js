export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "POST method required"
    });
  }

  try {
    // Parse request body safely
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {});

    // -----------------------------
    // 1. Validate phone number
    // -----------------------------

    const rawPhone = String(body.phone || "");

    const mobile10 = rawPhone
      .replace(/\D/g, "")
      .slice(-10);

    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return res.status(400).json({
        success: false,
        error: "अमान्य भारतीय मोबाइल नंबर"
      });
    }

    // -----------------------------
    // 2. Read MSG91 configuration
    // -----------------------------

    const widgetId = process.env.MSG91_WIDGET_ID;
    const tokenAuth = process.env.MSG91_WIDGET_TOKEN;

    if (!widgetId || !tokenAuth) {
      console.error("[MSG91] Widget configuration missing");

      return res.status(500).json({
        success: false,
        error: "MSG91 Widget configuration missing on server"
      });
    }

    // -----------------------------
    // 3. Send OTP through MSG91
    // -----------------------------
    //
    // IMPORTANT:
    // Do NOT send MSG91_AUTHKEY here.
    //
    // OTP Widget Token is used as:
    //   token: tokenAuth
    //
    // This avoids using Authkey + Token together.
    // -----------------------------

    const msg91Response = await fetch(
      "https://control.msg91.com/api/v5/widget/sendOtp",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "token": tokenAuth
        },

        body: JSON.stringify({
          widgetId: widgetId,
          identifier: "91" + mobile10
        })
      }
    );

    // -----------------------------
    // 4. Read MSG91 response
    // -----------------------------

    const rawResponse = await msg91Response.text();

    let data = {};

    try {
      data = rawResponse
        ? JSON.parse(rawResponse)
        : {};
    } catch (parseError) {
      console.error(
        "[MSG91] Invalid JSON response:",
        rawResponse
      );

      return res.status(502).json({
        success: false,
        error: "MSG91 ने वैध JSON response नहीं दिया।"
      });
    }

    console.log(
      "[MSG91] Send OTP status:",
      msg91Response.status
    );

    console.log(
      "[MSG91] Send OTP response:",
      data
    );

    // -----------------------------
    // 5. Handle MSG91 errors
    // -----------------------------

    if (
      !msg91Response.ok ||
      data.type === "error"
    ) {
      return res.status(502).json({
        success: false,
        error:
          data.message ||
          data.error ||
          "MSG91 OTP भेजने में विफल रहा।",

        providerStatus: msg91Response.status,

        providerCode:
          data.code || null
      });
    }

    // -----------------------------
    // 6. Get request ID
    // -----------------------------

    const reqId =
      data.reqId ||
      data.request_id ||
      data.req_id ||
      data.data?.reqId ||
      data.data?.request_id ||
      null;

    if (!reqId) {
      console.error(
        "[MSG91] reqId missing:",
        data
      );

      return res.status(502).json({
        success: false,
        error:
          "MSG91 ने OTP request ID नहीं लौटाई।"
      });
    }

    // -----------------------------
    // 7. Success
    // -----------------------------

    return res.status(200).json({
      success: true,

      message:
        data.message ||
        "OTP भेज दिया गया है।",

      reqId: reqId
    });

  } catch (error) {
    // -----------------------------
    // 8. Unexpected server error
    // -----------------------------

    console.error(
      "[MSG91] SEND OTP CRASH:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "OTP भेजने में server error हुआ।"
    });
  }
}
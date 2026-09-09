// api/msg91/send.js

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

    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return res.status(400).json({
        success: false,
        error: "अमान्य भारतीय मोबाइल नंबर"
      });
    }

    const authKey = process.env.MSG91_AUTHKEY;
    const widgetId = process.env.MSG91_WIDGET_ID;
    const tokenAuth = process.env.MSG91_WIDGET_TOKEN;

    if (!authKey || !widgetId || !tokenAuth) {
      return res.status(500).json({
        success: false,
        error: "MSG91 configuration missing on server"
      });
    }

    const msg91Response = await fetch(
      "https://control.msg91.com/api/v5/widget/sendOtp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": authKey
        },
        body: JSON.stringify({
          widgetId,
          tokenAuth,
          identifier: "91" + mobile10
        })
      }
    );

    const rawResponse = await msg91Response.text();

    let data;

    try {
      data = rawResponse ? JSON.parse(rawResponse) : {};
    } catch {
      return res.status(502).json({
        success: false,
        error: "MSG91 ने वैध response नहीं दिया।",
        providerStatus: msg91Response.status
      });
    }

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
        providerStatus: msg91Response.status
      });
    }

    const reqId =
      data.reqId ||
      data.request_id ||
      data.req_id ||
      data.data?.reqId ||
      data.data?.request_id ||
      null;

    if (!reqId) {
      return res.status(502).json({
        success: false,
        error: "MSG91 ने OTP request ID नहीं लौटाई।"
      });
    }

    return res.status(200).json({
      success: true,
      message: data.message || "OTP भेज दिया गया है।",
      reqId
    });

  } catch (error) {
    console.error("[MSG91] Send error:", error);

    return res.status(500).json({
      success: false,
      error: "OTP भेजने में server error हुआ।"
    });
  }
};
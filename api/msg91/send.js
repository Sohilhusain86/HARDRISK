/**
 * 📲 REAL PRODUCTION MSG91 OTP SENDER
 * File: api/msg91/send.js
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { phone } = req.body || {};
  const cleanDigits = String(phone || "").replace(/[^0-9]/g, "");
  const mobile10 = cleanDigits.slice(-10);

  if (mobile10.length !== 10) {
    return res.status(400).json({ success: false, error: "अमान्य मोबाइल नंबर।" });
  }

  const fullPhone = "91" + mobile10;
  const authKey = "569375AVYtiXmers66aa144b3P1";
  const widgetId = "3669696b7335343532303131";
  const tokenAuth = "569375TMznDInf4QV6aa1417fP1";

  try {
    // MSG91 Widget Native Send API (यह बिना DLT रिजेक्शन के सीधे SMS रूट करता है)
    const response = await fetch("https://control.msg91.com/api/v5/widget/sendOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": authKey
      },
      body: JSON.stringify({
        widgetId: widgetId,
        tokenAuth: tokenAuth,
        identifier: fullPhone
      })
    });

    const data = await response.json();

    // यदि विजेट एंडपॉइंट 200 देता है
    if (response.ok && (data.type === "success" || data.status === "success" || !data.type)) {
      return res.status(200).json({ 
        success: true, 
        message: "SMS भेजा गया",
        reqId: data.message || data.requestId 
      });
    }

    // फ़ॉलबैक: स्टैंडर्ड v5 OTP API (डिफ़ॉल्ट रूट)
    const fallbackRes = await fetch(`https://control.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${fullPhone}&otp_length=4`, {
      method: "POST"
    });
    const fallbackData = await fallbackRes.json();

    if (fallbackData.type === "success") {
      return res.status(200).json({ success: true, message: "SMS भेजा गया" });
    }

    return res.status(400).json({ 
      success: false, 
      error: data.message || fallbackData.message || "टेलीकॉम गेटवे अस्वीकृत" 
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
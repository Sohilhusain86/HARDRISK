module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { title, message } = body;
    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_KEY;

    if (!appId || !restKey) {
      return res.status(500).json({ error: "OneSignal क्रेडेंशियल्स गायब हैं" });
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${restKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Total Subscriptions"],
        headings: { en: title || "ऐलान: जमात ऊला अलिफ़" },
        contents: { en: message || "नया पैगाम आया है" }
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

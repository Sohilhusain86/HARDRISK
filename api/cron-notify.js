module.exports = async (req, res) => {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_KEY;

  if (!appId || !restKey) {
    return res.status(500).json({ error: "OneSignal क्रेडेंशियल्स अनुपलब्ध हैं" });
  }

  const slot = req.query.slot || "morning";
  let title = "जमात ऊला अलिफ़";
  let message = "ऐप में नया सबक और क्विज़ उपलब्ध है!";

  if (slot === "morning") {
    title = "📖 सुबह का मुताला (9:15 AM)";
    message = "आज का सबक क्या है? ग्रुप में 'आज का सबक चाहिए' दबाएँ और साथियों से मदद लें!";
  } else if (slot === "afternoon") {
    title = "⚡ इल्मी क्विज़ मुकाबला (2:00 PM)";
    message = "आज का 12-लेवल क्विज़ मुकाबला खेलें और लीडरबोर्ड में नंबर 1 रैंक हासिल करें (+XP)!";
  } else if (slot === "evening") {
    title = "📚 किताब व नोट्स एक्सचेंज (6:00 PM)";
    message = "क्या आपको किसी किताब की ज़रूरत है? नोटिस बोर्ड और किताब एक्सचेंज चेक करें!";
  } else if (slot === "night") {
    title = "🤝 तक़रार रूम का वक्त (9:30 PM)";
    message = "ईशा बाद मुताले का वक्त! साथी के साथ 15 मिनट का 'तक़रार रूम' ऑडियो डिस्कशन शुरू करें।";
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${restKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Total Subscriptions"],
        headings: { en: title, ur: title },
        contents: { en: message, ur: message }
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, slot, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

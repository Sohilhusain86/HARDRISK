const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const file = body?.file;
    const resourceType = body?.resourceType || 'auto';
    if (!file) return res.status(400).json({ error: "फ़ाइल नहीं मिली।" });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "xgkhockl";
    const apiKey = process.env.CLOUDINARY_API_KEY || "698144798262694";
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) return res.status(500).json({ error: "CLOUDINARY_API_SECRET सेट नहीं है।" });

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await uploadRes.json();
    if (data.secure_url) {
      return res.status(200).json({ secure_url: data.secure_url });
    }
    return res.status(500).json({ error: data.error?.message || "अपलोड विफल रहा।" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
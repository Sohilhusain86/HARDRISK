export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { prompt } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY Vercel में मौजूद नहीं है।'
      });
    }

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        error: 'Prompt खाली है।'
      });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `तुम एक बहुत ही इल्मी, शरीफ़ और मददगार 'AI उस्ताद' हो।
उर्दू, हिंदी और इंग्लिश में तालीम से जुड़े सवालों के जवाब दो।

सवाल:
${prompt.trim()}`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini API error'
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: 'AI से कोई जवाब नहीं मिला।'
      });
    }

    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({
      error: 'Server error: ' + err.message
    });
  }
}
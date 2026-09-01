export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY Vercel में मौजूद नहीं है।' });
    }

    // एक्टिव मॉडल gemini-2.5-flash का इस्तेमाल
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `तुम एक बहुत ही इल्मी, शरीफ़ और मददगार 'AI उस्ताद' हो। उर्दू, हिंदी और इंग्लिश में तालीम से जुड़े सवालों के जवाब दो। सवाल: ${prompt}` }]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    } else if (data.error) {
      return res.status(500).json({ error: data.error.message });
    } else {
      return res.status(500).json({ error: 'AI से कोई जवाब नहीं मिला।' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

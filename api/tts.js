export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text lazmi hai.' });
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return res.status(500).json({ error: 'HF_TOKEN Vercel mein nahi mila. Settings check karein.' });
  }

  try {
    // wait_for_model: true se Hugging Face model load hone ka intezar karega, fail nahi hoga
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-urd-script_arabic",
      {
        headers: {
          Authorization: `Bearer ${hfToken.trim()}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: text.substring(0, 350),
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `HuggingFace Error (${response.status}): ${errText}` });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
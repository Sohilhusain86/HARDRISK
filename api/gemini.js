export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, messages } = req.body;
  const userText = prompt || (messages && messages[messages.length - 1]?.content) || "";

  if (!userText.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment variables.' });
  }

  // Target Model: gemini-3.8-flash
  const PRIMARY_MODEL = "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userText }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Gemini API Error]:", data);
      return res.status(response.status).json({ 
        error: data.error?.message || "Gemini API execution failed" 
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "कोई जवाब नहीं मिला।";
    return res.status(200).json({ success: true, text: reply, reply: reply });

  } catch (err) {
    console.error("[Gemini Server Error]:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}

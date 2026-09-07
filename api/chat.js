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
    body = body || {};

    let prompt = body.prompt || body.text || "";
    if (!prompt && Array.isArray(body.messages)) {
      const last = body.messages[body.messages.length - 1];
      prompt = typeof last?.content === 'string' ? last.content : (last?.parts?.[0]?.text || "");
    }

    const GROQ_KEY = (process.env.GROQ_KEY || "").trim().replace(/^["']|["']$/g, '');

    if (!GROQ_KEY) {
      console.log("--> [DIAGNOSTIC] GROQ_KEY environment variable NOT FOUND in Vercel!");
      return res.status(500).json({ error: "GROQ_KEY missing in Vercel" });
    }

    console.log("--> [DIAGNOSTIC] Sending test request to Groq with prompt:", prompt.slice(0, 30));

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "आप एक मददगार उस्ताद हैं। संक्षिप्त जवाब दें।" },
          { role: "user", content: prompt || "अस्सलामू अलैकुम" }
        ],
        temperature: 0.3
      })
    });

    const status = groqResponse.status;
    const rawText = await groqResponse.text();

    // 🔍 Vercel Runtime Logs में सटीक परिणाम दिखेगा:
    console.log("--> [GROQ STATUS CODE]:", status);
    console.log("--> [GROQ RESPONSE BODY]:", rawText);

    if (!groqResponse.ok) {
      return res.status(status).json({
        error: `Groq Failed with HTTP ${status}`,
        details: rawText
      });
    }

    const data = JSON.parse(rawText);
    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply, text: reply });

  } catch (err) {
    console.error("--> [CRITICAL CRASH]:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
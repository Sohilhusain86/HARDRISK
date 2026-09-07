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
      return res.status(200).json({ reply: "Vercel में GROQ_KEY नहीं मिली।" });
    }

    const payload = {
      messages: [
        { role: "system", content: "आप दरसे निज़ामी और स्कूली निसाब के मददगार उस्ताद हैं। साफ़ और संक्षिप्त जवाब दें।" },
        { role: "user", content: prompt || "अस्सलामू अलैकुम" }
      ],
      temperature: 0.3
    };

    // 1. ChatGPT का सुझाया नया मॉडल (Primary)
    // 2. Groq का आधिकारिक स्टेबल मॉडल (Fallback)
    const modelsToTry = ["openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
    let finalReply = null;
    let lastErrorDetails = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`--> [GROQ] Requesting model: ${modelName}`);
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ model: modelName, ...payload })
        });

        const rawText = await groqResponse.text();
        console.log(`--> [GROQ ${modelName} STATUS]:`, groqResponse.status);

        if (groqResponse.ok) {
          const data = JSON.parse(rawText);
          finalReply = data.choices[0].message.content;
          break; // सफलता मिलते ही लूप रोकें
        } else {
          lastErrorDetails = `${modelName} (${groqResponse.status}): ${rawText}`;
        }
      } catch (err) {
        lastErrorDetails = err.message;
      }
    }

    if (finalReply) {
      return res.status(200).json({ reply: finalReply, text: finalReply });
    }

    // 404 के बजाय हमेशा 200 JSON लौटाएँ ताकि ब्राउज़र क्रैश न हो और एरर स्क्रीन पर दिखे
    return res.status(200).json({
      reply: "AI रिस्पॉन्स एरर: " + lastErrorDetails,
      text: "AI रिस्पॉन्स एरर: " + lastErrorDetails
    });

  } catch (err) {
    return res.status(200).json({ reply: "सर्वर त्रुटि: " + err.message });
  }
};

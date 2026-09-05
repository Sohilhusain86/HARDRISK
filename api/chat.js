module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { prompt, isQuiz, level } = body || {};

  // फॉलबैक कीज़ (ताकि Vercel Env खाली होने पर भी क्रैश न हो)
  const GROQ_KEY = process.env.GROQ_KEY || "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";
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "csk-tft6c8d9mf4kp9txpmvkxt8xfxyrwwcddthx3yhkwp2j52mw";

  const systemRules = `आप दरसे निज़ामी और स्कूली निसाब के मुफ़ीद AI उस्ताद (Suhail AI) हैं।
1. जवाब अहले सुन्नत वल जमात अल मारूफ मसलक-ए-आला हजरत, नह्व, सर्फ़, फ़िक़्ह, गणित और अंग्रेज़ी के मुताबिक सीधा और 2-3 जुमलों में दें।
2. कोई जानदार की तस्वीर या ग़ैर-शरई बात न कहें।`;

  let finalPrompt = prompt || "अस्सलामू अलैकुम";
  if (isQuiz) {
    finalPrompt = `दरजा (Level) ${level || 1} (1 आसान से 12 कठिन) के तालिब-ए-इल्म के लिए निसाब (नह्व, सर्फ़, गणित, या इंग्लिश) से 1 नया बहुविकल्पीय सवाल बनाएँ। 
जवाब में केवल वैध JSON दें:
{"q": "सवाल", "o": ["विकल्प1", "विकल्प2", "विकल्प3", "विकल्प4"], "a": 0, "s": "विषय"}`;
  }

  // 1. सुपरफास्ट Groq Instant (0.2s स्पीड)
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemRules }, { role: "user", content: finalPrompt }],
        temperature: 0.3
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {}

  // 2. बैकअप Cerebras
  try {
    const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [{ role: "system", content: systemRules }, { role: "user", content: finalPrompt }]
      })
    });
    if (cRes.ok) {
      const data = await cRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {}

  return res.status(200).json({ reply: "माफ़ कीजिएगा, AI नेटवर्क अभी व्यस्त है। कृपया थोड़ी देर बाद प्रयास करें।" });
};
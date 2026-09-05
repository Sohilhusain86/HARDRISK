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

  // हर तरह के पैरामीटर को एक साथ पकड़ना
  const prompt = body?.prompt || body?.messages?.[body.messages.length - 1]?.parts?.[0]?.text || body?.text || "";
  const isQuiz = body?.isQuiz || body?.type === 'quiz';
  const taskType = body?.type || (isQuiz ? 'quiz' : 'assistant');
  const level = parseInt(body?.level) || 1;

  const GROQ_KEY = process.env.GROQ_KEY || "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";
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "csk-tft6c8d9mf4kp9txpmvkxt8xfxyrwwcddthx3yhkwp2j52mw";

  // 📜 शरई व अकादमिक कानून
  let systemPrompt = `आप दरसे निज़ामी और स्कूली निसाब के मोतबर AI उस्ताद (Suhail AI) हैं।
कानून:
1. हमेशा अहले सुन्नत वल जमात अल मारूफ मसलक-ए-आला हजरत, फ़िक़्ह-ए-हनफ़ी, नह्व, सर्फ़, अदब, रियाज़ी और अंग्रेज़ी के उसूलों पर रहें।
2. जवाब बिल्कुल साफ़, सटीक और 2-3 जुमलों में दें।
3. किसी जानदार की तस्वीर का ज़िक्र न करें।`;

  let userPrompt = prompt || "अस्सलामू अलैकुम";

  if (isQuiz) {
    systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा (Level) ${level}/12 के लिए सिर्फ 1 बिल्कुल नया बहुविकल्पीय सवाल बनाएँ।
बिना किसी अतिरिक्त बात या मार्कडाउन के सिर्फ यह JSON दें:
{"q": "सवाल", "o": ["विकल्प1", "विकल्प2", "विकल्प3", "विकल्प4"], "a": 0, "s": "विषय"}`;
    userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
  }

  const payload = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: isQuiz ? 0.7 : 0.2
  };

  // ⚡ Groq Llama 3.1 Instant (0.2s)
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", ...payload })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      const content = data.choices[0].message.content;
      // दोनों कीज़ (reply और text) वापस भेजना ताकि फ्रंटएंड कभी खाली न रहे
      return res.status(200).json({ reply: content, text: content });
    }
  } catch (err) {}

  // 🛡️ Cerebras Fallback (0.3s)
  try {
    const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1-8b", ...payload })
    });
    if (cRes.ok) {
      const data = await cRes.json();
      const content = data.choices[0].message.content;
      return res.status(200).json({ reply: content, text: content });
    }
  } catch (err) {}

  return res.status(500).json({ error: "AI सर्वर व्यस्त है।" });
};
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

  const prompt = body?.prompt || body?.messages?.[body.messages.length - 1]?.parts?.[0]?.text || body?.text || "";
  const isQuiz = body?.isQuiz || body?.type === 'quiz';
  const level = parseInt(body?.level) || 1;

  const GROQ_KEY = process.env.GROQ_KEY;
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY;
  const SAMBANOVA_KEY = process.env.SAMBANOVA_KEY;

  let systemPrompt = `आप दरसे निज़ामी और स्कूली पाठ्यक्रम के मोतबर AI उस्ताद (Suhail AI) हैं।
हमेशा अहले सुन्नत वल जमात (मसलक-ए-आला हज़रत) और फ़िक़्ह-ए-हनफ़ी के उसूलों पर रहें। किसी जानदार की तस्वीर का ज़िक्र न करें। जवाब साफ़ और 2-3 जुमलों में दें।`;

  let userPrompt = prompt || "अस्सलामू अलैकुम";

  if (isQuiz) {
    systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा (Level) ${level}/12 के लिए 1 नया बहुविकल्पीय सवाल बनाएँ।
बिना किसी अतिरिक्त बात के केवल शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
    userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
  }

  const messagesPayload = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  // 1. Groq Instant
  if (GROQ_KEY) {
    try {
      const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: messagesPayload, temperature: isQuiz ? 0.7 : 0.2 })
      });
      if (gRes.ok) {
        const data = await gRes.json();
        const reply = data.choices[0].message.content;
        return res.status(200).json({ reply, text: reply });
      }
    } catch (e) {}
  }

  // 2. Cerebras Fallback
  if (CEREBRAS_KEY) {
    try {
      const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.1-8b", messages: messagesPayload, temperature: isQuiz ? 0.7 : 0.2 })
      });
      if (cRes.ok) {
        const data = await cRes.json();
        const reply = data.choices[0].message.content;
        return res.status(200).json({ reply, text: reply });
      }
    } catch (e) {}
  }

  return res.status(500).json({ error: "AI सर्वर व्यस्त है। कृपया Vercel Redeploy करें।" });
};
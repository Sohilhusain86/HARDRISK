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
  const { prompt, type, level } = body || {};

  const GROQ_KEY = process.env.GROQ_KEY || "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";
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY || "csk-tft6c8d9mf4kp9txpmvkxt8xfxyrwwcddthx3yhkwp2j52mw";

  // 📜 सख्त शरई व अकादमिक कानून
  const baseSystemPrompt = `आप दरसे निज़ामी और स्कूली निसाब के मोतबर व तेज़-रफ़्तार AI उस्ताद (Suhail AI) हैं।
कानून:
1. हमेशा अहले सुन्नत वल जमात अल मारूफ मसलक-ए-आला हजरत, फ़िक़्ह-ए-हनफ़ी, नह्व, सर्फ़, अदब, रियाज़ी और अंग्रेज़ी के उसूलों पर रहें।
2. किसी भी विवादित मसले में न पड़ें।
3. जवाब बिल्कुल साफ़, सटीक और 2-3 जुमलों में दें ताकि तालिब-ए-इल्म का वक्त बर्बाद न हो।
4. किसी जानदार की तस्वीर का ज़िक्र न करें।`;

  // 🎯 टास्क के मुताबिक सिस्टम हिदायत
  let currentSystem = baseSystemPrompt;
  let finalPrompt = prompt || "";

  if (type === 'corrector') {
    currentSystem = `${baseSystemPrompt}
काम: तालिब-ए-इल्म के लिखे जुमले में उर्दू/अरबी/हिंदी/इंग्लिश की इमला (spelling) और ग्रामर की गलती पकड़ें। 
सीधे 1-2 लाइन में बताएं: "दुरुस्त जुमला यह है: [सही जुमला]" और गलती की वजह बता दें।`;
  } else if (type === 'summary') {
    currentSystem = `${baseSystemPrompt}
काम: दिए गए सबक या इबारत का खुलासा (Summary) सिर्फ 3 अहम बुलेट पॉइंट्स में निकालें।`;
  } else if (type === 'quiz') {
    const lvl = parseInt(level) || 1;
    currentSystem = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा (Level) ${lvl}/12 के लिए सिर्फ 1 बहुविकल्पीय सवाल बनाएँ।
बिना किसी अतिरिक्त बात के केवल यह JSON दें:
{"q": "सवाल", "o": ["विकल्प1", "विकल्प2", "विकल्प3", "विकल्प4"], "a": 0, "s": "विषय"}`;
    finalPrompt = `Level ${lvl} का नया सवाल तैयार करें।`;
  }

  const payload = {
    messages: [
      { role: "system", content: currentSystem },
      { role: "user", content: finalPrompt }
    ],
    temperature: type === 'quiz' ? 0.6 : 0.2
  };

  // ⚡ 1. प्राइमरी इंजन: Groq Instant (0.2s स्पीड)
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", ...payload })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (err) {}

  // 🛡️ 2. वाहिद (Single) बैकअप: Cerebras (0.3s स्पीड)
  try {
    const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1-8b", ...payload })
    });
    if (cRes.ok) {
      const data = await cRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (err) {}

  return res.status(500).json({ error: "AI सर्वर अनुपलब्ध है।" });
};
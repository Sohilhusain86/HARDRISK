module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // बॉडी पार्सिंग (सुरक्षित तरीका)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { prompt, isQuiz, level } = body || {};

  // 📜 सख्त कानूनी हिदायतें (System Instruction)
  const systemRules = `आप एक बेहद मोतबर, संजीदा और तजुर्बेकार इस्लामी व अकादमिक उस्ताद (Suhail AI) हैं।
कानून व कवाइद:
1. आपका जवाब अहले सुन्नत वल जमात, दरसे निज़ामी और स्कूली निसाब (नह्व, सर्फ़, फ़िक़्ह, गणित, अंग्रेज़ी, उर्दू) के मुताबिक होना चाहिए।
2. किसी भी फिर्कावाराना बहस या विवादित मसले में उलझे बिना सीधा, सटीक और आसान अल्फ़ाज़ में जवाब दें।
3. जवाब लंबा-चौड़ा और उबाऊ न हो, 2 से 4 जुमलों में मुकम्मल बात कहें।
4. कोई भी जानदार की तस्वीर या ग़ैर-शरई बात की तरफ रहनुमाई न करें।`;

  // 🎮 अगर क्विज़ का सवाल जनरेट करना हो
  let finalPrompt = prompt;
  if (isQuiz) {
    finalPrompt = `दरजा (Level) ${level || 1} (1 निहायत आसान से 12 आला तरीन) के तालिब-ए-इल्म के लिए निसाब (नह्व, सर्फ़, गणित, या इंग्लिश) से 1 नया बहुविकल्पीय सवाल बनाएँ। 
जवाब में सिर्फ और सिर्फ यह वैध JSON दें, कोई और बात न लिखें:
{"q": "सवाल यहाँ", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
  }

  // 1. सबसे पहले Groq Llama 3.3 (सुपर-फास्ट और सटीक)
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemRules }, { role: "user", content: finalPrompt }],
        temperature: 0.4
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {}

  // 2. दूसरा बैकअप: Cerebras (अल्ट्रा स्पीड)
  try {
    const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CEREBRAS_KEY}`,
        "Content-Type": "application/json"
      },
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

  // 3. तीसरा बैकअप: SambaNova
  try {
    const sRes = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SAMBANOVA_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Meta-Llama-3.1-70B-Instruct",
        messages: [{ role: "system", content: systemRules }, { role: "user", content: finalPrompt }]
      })
    });
    if (sRes.ok) {
      const data = await sRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {}

  return res.status(500).json({ error: "सभी गेटवे व्यस्त हैं।" });
};
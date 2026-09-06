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
  const taskType = body?.type || (isQuiz ? 'quiz' : 'assistant');
  const level = parseInt(body?.level) || 1;

  const GROQ_KEY = process.env.GROQ_KEY;
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY;
  const SAMBANOVA_KEY = process.env.SAMBANOVA_KEY;
  const MISTRAL_KEY = process.env.MISTRAL_KEY;
  const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
  const HUGGINGFACE_KEY = process.env.HUGGINGFACE_KEY;

  let systemPrompt = `आप दरसे निज़ामी और स्कूली निसाब के मोतबर व तेज़ AI उस्ताद (Suhail AI) हैं।
कानून:
1. हमेशा अहले सुन्नत वल जमात (अल मारूफ मसलक-ए-आला हज़रत), फ़िक़्ह-ए-हनफ़ी, नह्व, सर्फ़, अदब, रियाज़ी और अंग्रेज़ी के उसूलों पर रहें।
2. जवाब बिल्कुल साफ़, सटीक और 2-3 जुमलों में दें।
3. किसी जानदार की तस्वीर का ज़िक्र न करें।`;

  let userPrompt = prompt || "अस्सलामू अलैकुम";

  if (taskType === 'quiz') {
    systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा (Level) ${level}/12 के लिए 1 नया बहुविकल्पीय सवाल बनाएँ।
बिना किसी अतिरिक्त बात या मार्कडाउन के सिर्फ यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
    userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
  } else if (taskType === 'corrector') {
    systemPrompt += `\nकाम: छात्र के लिखे जुमले में उर्दू/अरबी/हिंदी/इंग्लिश की इमला और ग्रामर की गलती पकड़ें और 2 लाइन में सही जुमला बताएं।`;
  } else if (taskType === 'summary') {
    systemPrompt += `\nकाम: दिए गए सबक या चैट का खुलासा सिर्फ 3 अहम बुलेट पॉइंट्स में निकालें।`;
  }

  const messagesPayload = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  async function requestModel(url, authKey, modelName, temp = 0.2) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${authKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName, messages: messagesPayload, temperature: temp })
    });
    if (!response.ok) throw new Error("Model failed");
    const json = await response.json();
    return json.choices[0].message.content;
  }

  // 1. प्राथमिक विशिष्ट AI (Task-Specific Execution)
  try {
    let result = null;
    if (taskType === 'quiz' && CEREBRAS_KEY) {
      result = await requestModel("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "llama3.1-8b", 0.7);
    } else if (taskType === 'summary' && SAMBANOVA_KEY) {
      result = await requestModel("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.1-70B-Instruct", 0.2);
    } else if (taskType === 'corrector' && MISTRAL_KEY) {
      result = await requestModel("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-latest", 0.2);
    } else if (GROQ_KEY) {
      result = await requestModel("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "llama-3.1-8b-instant", isQuiz ? 0.7 : 0.2);
    }

    if (result) return res.status(200).json({ reply: result, text: result });
  } catch (err) {}

  // 2. सुरक्षित रिज़र्व बैकअप (OpenRouter)
  if (OPENROUTER_KEY) {
    try {
      const oRes = await requestModel("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.1-8b-instruct:free");
      return res.status(200).json({ reply: oRes, text: oRes });
    } catch (e) {}
  }

  // 3. अंतिम रिज़र्व बैकअप (HuggingFace)
  if (HUGGINGFACE_KEY) {
    try {
      const hRes = await requestModel("https://router.huggingface.co/hf-inference/v1/chat/completions", HUGGINGFACE_KEY, "meta-llama/Llama-3.1-8B-Instruct");
      return res.status(200).json({ reply: hRes, text: hRes });
    } catch (e) {}
  }

  return res.status(500).json({ error: "सभी AI गेटवे व्यस्त हैं।" });
};
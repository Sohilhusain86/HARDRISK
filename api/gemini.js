module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  body = body || {};

  // हर तरह के इनपुट (prompt, text, या messages array) को ऑटो-कैप्चर करना
  let prompt = body.prompt || body.text || "";
  if (!prompt && Array.isArray(body.messages)) {
    const lastMsg = body.messages[body.messages.length - 1];
    if (lastMsg) {
      if (typeof lastMsg.content === 'string') {
        prompt = lastMsg.content;
      } else if (Array.isArray(lastMsg.parts) && lastMsg.parts[0]) {
        prompt = lastMsg.parts[0].text || "";
      }
    }
  }

  const isQuiz = body.isQuiz || body.type === 'quiz';
  const taskType = body.type || (isQuiz ? 'quiz' : 'assistant');
  const level = parseInt(body.level) || 1;

  const GROQ_KEY = process.env.GROQ_KEY;
  const CEREBRAS_KEY = process.env.CEREBRAS_KEY;
  const SAMBANOVA_KEY = process.env.SAMBANOVA_KEY;
  const MISTRAL_KEY = process.env.MISTRAL_KEY;
  const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
  const HUGGINGFACE_KEY = process.env.HUGGINGFACE_KEY;

  let systemPrompt = "आप दरसे निज़ामी और स्कूली निसाब के मोतबर AI उस्ताद (Suhail AI) हैं। जवाब साफ़, सटीक और 2-3 जुमलों में दें।";
  let userPrompt = prompt || "अस्सलामू अलैकुम";

  if (taskType === 'quiz') {
    systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा (Level) ${level}/12 के लिए 1 नया बहुविकल्पीय सवाल बनाएँ। बिना किसी अतिरिक्त बात या मार्कडाउन के सिर्फ यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
    userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
  } else if (taskType === 'corrector') {
    systemPrompt += "\nकाम: छात्र के लिखे जुमले में इमला और ग्रामर की गलती पकड़ें और 2 लाइन में सही जुमला बताएं।";
  } else if (taskType === 'summary') {
    systemPrompt += "\nकाम: दिए गए सबक या चैट का खुलासा सिर्फ 3 अहम बुलेट पॉइंट्स में निकालें।";
  }

  const messagesPayload = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  async function requestModel(url, authKey, modelName, temp = 0.2) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName, messages: messagesPayload, temperature: temp }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error("API status: " + response.status);
      const json = await response.json();
      return json.choices[0].message.content;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  let result = null;

  // 1. सबसे तेज़: Groq Instant (0.2s)
  if (!result && GROQ_KEY) {
    try {
      result = await requestModel("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "llama-3.1-8b-instant", isQuiz ? 0.7 : 0.2);
    } catch (e) {}
  }

  // 2. दूसरा बैकअप: Cerebras (0.3s)
  if (!result && CEREBRAS_KEY) {
    try {
      result = await requestModel("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "llama3.1-8b", isQuiz ? 0.7 : 0.2);
    } catch (e) {}
  }

  // 3. तीसरा बैकअप: SambaNova
  if (!result && SAMBANOVA_KEY) {
    try {
      result = await requestModel("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.1-70B-Instruct", 0.2);
    } catch (e) {}
  }

  // 4. चौथा बैकअप: Mistral
  if (!result && MISTRAL_KEY) {
    try {
      result = await requestModel("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-latest", 0.2);
    } catch (e) {}
  }

  // 5. पाँचवाँ बैकअप: OpenRouter
  if (!result && OPENROUTER_KEY) {
    try {
      result = await requestModel("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.1-8b-instruct:free", 0.3);
    } catch (e) {}
  }

  // 6. छठा बैकअप: HuggingFace
  if (!result && HUGGINGFACE_KEY) {
    try {
      result = await requestModel("https://router.huggingface.co/hf-inference/v1/chat/completions", HUGGINGFACE_KEY, "meta-llama/Llama-3.1-8B-Instruct", 0.3);
    } catch (e) {}
  }

  if (result) {
    return res.status(200).json({ reply: result, text: result });
  }

  return res.status(500).json({ error: "सभी AI गेटवे व्यस्त हैं।" });
};
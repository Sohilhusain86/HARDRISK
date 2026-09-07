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

  let prompt = body.prompt || body.text || "";
  if (!prompt && Array.isArray(body.messages)) {
    const lastMsg = body.messages[body.messages.length - 1];
    if (lastMsg) {
      prompt = typeof lastMsg.content === 'string' ? lastMsg.content : (lastMsg.parts?.[0]?.text || "");
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

  // 🔍 डायग्नोस्टिक चेक: अगर Vercel ने कीज नहीं पढ़ीं तो तुरंत सच बताएगा
  if (!GROQ_KEY && !CEREBRAS_KEY && !SAMBANOVA_KEY && !MISTRAL_KEY && !OPENROUTER_KEY) {
    return res.status(500).json({
      error: "Vercel को Environment Variables नहीं मिले! कृपया Deployments में जाकर Redeploy करें और तीनों Environments (Production, Preview, Dev) टिक करें।"
    });
  }

  let systemPrompt = "आप दरसे निज़ामी और स्कूली पाठ्यक्रम के प्रतिष्ठित AI उस्ताद (Suhail AI) हैं। जवाब साफ़ और 2-3 वाक्यों में दें।";
  let userPrompt = prompt || "अस्सलामू अलैकुम";

  if (taskType === 'quiz') {
    systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा ${level}/12 के लिए 1 नया बहुविकल्पीय सवाल बनाएँ। बिना किसी अतिरिक्त बात के सिर्फ यह JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
    userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
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
    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`${modelName} Error (${response.status}): ${errTxt}`);
    }
    const json = await response.json();
    return json.choices[0].message.content;
  }

  let lastError = "";

  // 1. Groq
  if (GROQ_KEY) {
    try {
      const reply = await requestModel("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "llama-3.1-8b-instant", isQuiz ? 0.7 : 0.2);
      return res.status(200).json({ reply, text: reply, provider: "Groq 0.2s" });
    } catch (e) { lastError = e.message; }
  }

  // 2. Cerebras
  if (CEREBRAS_KEY) {
    try {
      const reply = await requestModel("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "llama3.1-8b", isQuiz ? 0.7 : 0.2);
      return res.status(200).json({ reply, text: reply, provider: "Cerebras 0.3s" });
    } catch (e) { lastError = e.message; }
  }

  // 3. SambaNova
  if (SAMBANOVA_KEY) {
    try {
      const reply = await requestModel("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.1-70B-Instruct", 0.2);
      return res.status(200).json({ reply, text: reply, provider: "SambaNova 70B" });
    } catch (e) { lastError = e.message; }
  }

  // 4. Mistral
  if (MISTRAL_KEY) {
    try {
      const reply = await requestModel("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-latest", 0.2);
      return res.status(200).json({ reply, text: reply, provider: "Mistral" });
    } catch (e) { lastError = e.message; }
  }

  // 5. OpenRouter
  if (OPENROUTER_KEY) {
    try {
      const reply = await requestModel("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.1-8b-instruct:free", 0.3);
      return res.status(200).json({ reply, text: reply, provider: "OpenRouter" });
    } catch (e) { lastError = e.message; }
  }

  return res.status(500).json({ error: lastError || "सभी AI गेटवे विफल रहे।" });
};
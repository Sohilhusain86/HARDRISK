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

    const isQuiz = body.isQuiz || body.type === 'quiz';
    const taskType = body.type || (isQuiz ? 'quiz' : 'assistant');
    const level = parseInt(body.level) || 1;

    const cleanKey = (k) => (k || '').trim().replace(/^["']|["']$/g, '');
    const GROQ_KEY = cleanKey(process.env.GROQ_KEY);
    const CEREBRAS_KEY = cleanKey(process.env.CEREBRAS_KEY);
    const SAMBANOVA_KEY = cleanKey(process.env.SAMBANOVA_KEY);
    const MISTRAL_KEY = cleanKey(process.env.MISTRAL_KEY);
    const OPENROUTER_KEY = cleanKey(process.env.OPENROUTER_KEY);

    // 🎯 सख्त भाषा व लिपि मिररिंग नियम
    let systemPrompt = `आप दरसे निज़ामी और स्कूली पाठ्यक्रम के विश्वसनीय AI उस्ताद (Suhail AI) हैं। जवाब 2-3 वाक्यों में साफ़ दें।
सख्त नियम (Language Mirroring): यूज़र जिस भाषा और लिपि (Script) में लिखे, आपको 100% उसी लिपि में जवाब देना है:
1. अगर यूज़र Roman Urdu / Hinglish (अंग्रेज़ी अक्षरों में, जैसे "Aapka naam kya hai?", "Kya kar rahe ho?") में लिखे, तो आपको केवल और केवल Roman Urdu (English Alphabets) में ही जवाब देना है। इसे कभी भी हिंदी देवनागरी या उर्दू लिपि में न बदलें।
2. अगर यूज़र उर्दू रस्मुल ख़त (اردو) में लिखे, तो उर्दू में ही जवाब दें।
3. अगर यूज़र हिंदी देवनागरी लिपि में लिखे, तो हिंदी में जवाब दें।`;

    let userPrompt = prompt || "Salam";

    if (taskType === 'quiz') {
      systemPrompt = `आप एक सख्त इम्तिहानी परीक्षक हैं। दरजा ${level}/12 के लिए 1 नया बहुविकल्पीय सवाल बनाएँ। अतिरिक्त पाठ के बिना सिर्फ यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
      userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
    } else if (taskType === 'corrector') {
      systemPrompt = `आप भाषा सुधारक हैं। छात्र के वाक्य का व्याकरण और इमला सुधारें। 
सख्त नियम: जिस लिपि में छात्र ने लिखा है (Roman Urdu, Hindi, Urdu), उसी लिपि में सुधरा हुआ वाक्य दें। लिपि परिवर्तित न करें।`;
    }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    async function callAI(providerName, url, apiKey, modelName, temp = 0.3) {
      if (!apiKey) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: messagesPayload,
            temperature: isQuiz ? 0.7 : temp
          }),
          signal: controller.signal
        });

        clearTimeout(timer);
        if (!response.ok) return null;
        const parsed = await response.json();
        return parsed.choices?.[0]?.message?.content || null;
      } catch (err) {
        clearTimeout(timer);
        return null;
      }
    }

    let finalAnswer = null;
    let providerUsed = "";

    if (!finalAnswer && GROQ_KEY) {
      finalAnswer = await callAI("Groq", "https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "openai/gpt-oss-20b");
      if (finalAnswer) providerUsed = "Groq";
    }
    if (!finalAnswer && CEREBRAS_KEY) {
      finalAnswer = await callAI("Cerebras", "https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b");
      if (finalAnswer) providerUsed = "Cerebras";
    }
    if (!finalAnswer && SAMBANOVA_KEY) {
      finalAnswer = await callAI("SambaNova", "https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.3-70B-Instruct");
      if (finalAnswer) providerUsed = "SambaNova";
    }
    if (!finalAnswer && MISTRAL_KEY) {
      finalAnswer = await callAI("Mistral", "https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-2603");
      if (finalAnswer) providerUsed = "Mistral";
    }
    if (!finalAnswer && OPENROUTER_KEY) {
      finalAnswer = await callAI("OpenRouter", "https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.3-70b-instruct");
      if (finalAnswer) providerUsed = "OpenRouter";
    }

    if (finalAnswer) {
      return res.status(200).json({ reply: finalAnswer, text: finalAnswer, provider: providerUsed });
    }

    return res.status(502).json({ error: "सभी AI प्रोवाइडर्स व्यस्त हैं।" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

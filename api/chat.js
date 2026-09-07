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

    // 🎯 लिपि और भाषा मिररिंग का सख्त नियम
    let systemPrompt = `आप दरसे निज़ामी और स्कूली पाठ्यक्रम के मोतबर AI उस्ताद (Suhail AI) हैं।
सख्त नियम: यूज़र जिस भाषा और लिपि में लिखे, उसी लिपि में जवाब दें।
1. अगर यूज़र Roman Urdu / Hinglish (अंग्रेज़ी अक्षरों में) लिखे, तो 100% Roman Urdu में ही जवाब दें। कभी देवनागरी या उर्दू लिपि में न बदलें।
2. अगर उर्दू रस्मुल ख़त में लिखे तो उर्दू में, और हिंदी में लिखे तो हिंदी में जवाब दें।`;

    let userPrompt = prompt || "Salam";

    // 🎲 क्विज़ में हर बार बिल्कुल नया सवाल लाने का रैंडम इंजन
    if (taskType === 'quiz') {
      const subjects = [
        "तारीख़-ए-इस्लाम व खुलाफ़ा-ए-राशिदीन",
        "सीरतुन नबी ﷺ के अहम वाक़ियात",
        "फ़िक़्ह व मसाइल (इबादत व मुआमलात)",
        "अरबी ग्रामर (नह्व व सर्फ़)",
        "क़ुरआनी मालूमात व अंबिया के क़िस्से",
        "अहादीस-ए-मुबारका व अख़लाक़ियात",
        "उमूमी मालूमात (General Science & Geography)",
        "अदब व उर्दू ज़बान-ओ-अदब",
        "मंतिक़ व दीनी उसूल"
      ];
      const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
      const seed = Date.now().toString().slice(-4);

      systemPrompt = `आप एक आला दर्जे के इम्तिहानी परीक्षक हैं।
सख्त हिदायत: सवाल कभी रिपीट न हो। बिल्कुल नया, अनूठा और सोच-समझ वाला सवाल बनाएँ।
विषय: "${randomSub}" | दरजा: ${level}/12 (Seed: ${seed})
बिना किसी अतिरिक्त बात के सिर्फ यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["ऑप्शन 1", "ऑप्शन 2", "ऑप्शन 3", "ऑप्शन 4"], "a": 0, "s": "${randomSub}"}`;

      userPrompt = `दर्जा ${level} के लिए "${randomSub}" पर बिल्कुल नया और अनोखा सवाल बनाएँ।`;
    } else if (taskType === 'corrector') {
      systemPrompt = "आप भाषा सुधारक हैं। छात्र के वाक्य का व्याकरण और इमला सुधारें। जिस लिपि में इनपुट हो, उसी लिपि में उत्तर दें।";
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
            temperature: isQuiz ? 0.85 : temp
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

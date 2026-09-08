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
    let systemPrompt = `आप दरसे निज़ामी (जमात ऊला) के नह्व व सर्फ़ और बुनियादी तालीमी उस्ताद (Suhail AI) हैं।
सख्त नियम: यूज़र जिस भाषा और लिपि में लिखे, उसी लिपि में जवाब दें।
1. अगर यूज़र Roman Urdu / Hinglish (अंग्रेज़ी अक्षरों में) लिखे, तो 100% Roman Urdu में ही जवाब दें। कभी देवनागरी या उर्दू लिपि में न बदलें।
2. अगर उर्दू रस्मुल ख़त में लिखे तो उर्दू में, और हिंदी में लिखे तो हिंदी में जवाब दें।`;

    let userPrompt = prompt || "Salam";

    // 📚 क्विज़ इंजन: सिर्फ़ नह्व, सर्फ़ और भाषा के क़वायद (क़ुरआन/हदीस/फ़िक़्ह पर पूर्ण पाबंदी)
    if (taskType === 'quiz') {
      const grammarSubjects = [
        "इल्मुन नह्व: कलिमा और उसकी अक़्साम (इस्म, फ़े'ल, हर्फ़)",
        "इल्मुन नह्व: मुफ़्रद व मुरक्कब (मुरक्कब-ए-ताम, जुमला इस्मीया व फे़'लिया)",
        "इल्मुन नह्व: अवामिल व ए'राब (मरफ़ूआत, मन्सूबात, मज्रूरआत)",
        "इल्मुन नह्व: फ़ाइल, मफ़ऊल और मुज़ाफ़-मुज़ाफ़ इलैह के क़वायद",
        "इल्मुस सर्फ़: अबवाब-ए-सलासी मुजर्रद व मज़ीद फ़ीह",
        "इल्मुस सर्फ़: गर्दान व सेग़े (माज़ी, मुज़ारे, अम्र, नहीं)",
        "इल्मुस सर्फ़: हफ़्त अक़्साम (सहीह, महमूज़, मिसाल, अजवफ़, नाक़िस, लफ़ीफ़)",
        "अरबी मुफ़्रदात: वाहिद, तस्निया और जमा मुकस्सर / सालिम",
        "अरबी अल्फ़ाज़ के मुतज़ाद (विपरीतार्थक) व मआनी",
        "बुनियादी क़वायद: ज़मायर, अस्मा-ए-इशारा व अस्मा-ए-मौसूला"
      ];

      const randomSub = grammarSubjects[Math.floor(Math.random() * grammarSubjects.length)];
      const seed = Date.now().toString().slice(-4);

      systemPrompt = `आप एक सख्त नह्व-ओ-सर्फ़ और अरबी क़वायद के इम्तिहानी परीक्षक हैं।
⚠️ सख्त पाबंदी (Zero Tolerance):
1. क़ुरआन की आयात, अहादीस के मतन, फ़िक़ही मसाइल, फ़तवे या धार्मिक अक़ाइद पर कोई भी सवाल बिल्कुल नहीं बनाना है।
2. सवाल केवल और केवल अरबी व्याकरण (इल्मुन नह्व), सेग़ों की पहचान (इल्मुस सर्फ़), गर्दान, वाहिद-जमा और लुग़त के नियमों पर आधारित होना चाहिए।
3. गैर-इस्लामी धार्मिक शब्दावली (जैसे पुण्य, पाप, दया, कृपा आदि) का प्रयोग वर्जित है। खालिस तालीमी व नह्वी ज़बान इस्तेमाल करें।

विषय: "${randomSub}" | दरजा: ${level}/12 (Seed: ${seed})
बिना किसी अतिरिक्त पाठ के केवल यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "${randomSub}"}`;

      userPrompt = `दर्जा ${level} के तालिब-ए-इल्म के लिए "${randomSub}" पर 1 मुकम्मल व्याकरण संबंधी वस्तुनिष्ठ (MCQ) सवाल बनाएँ।`;
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
            temperature: isQuiz ? 0.4 : temp // कम टेम्परेचर ताकि सटीक क़वायद ही पूछे
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

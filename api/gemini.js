module.exports = async (req, res) => {
  // CORS Headers
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

    // इनपुट एक्सट्रैक्टर (Prompt, Text और Gemini Messages Array दोनों सपोर्टेड)
    let prompt = body.prompt || body.text || "";
    if (!prompt && Array.isArray(body.messages)) {
      const last = body.messages[body.messages.length - 1];
      prompt = typeof last?.content === 'string' ? last.content : (last?.parts?.[0]?.text || "");
    }

    const isQuiz = body.isQuiz || body.type === 'quiz';
    const taskType = body.type || (isQuiz ? 'quiz' : 'assistant');
    const level = parseInt(body.level) || 1;

    // Keys को ऑटो-ट्रिम करना (स्पेस व कोट्स क्लीनर)
    const cleanKey = (k) => (k || '').trim().replace(/^["']|["']$/g, '');

    const GROQ_KEY = cleanKey(process.env.GROQ_KEY);
    const CEREBRAS_KEY = cleanKey(process.env.CEREBRAS_KEY);
    const SAMBANOVA_KEY = cleanKey(process.env.SAMBANOVA_KEY);
    const MISTRAL_KEY = cleanKey(process.env.MISTRAL_KEY);
    const OPENROUTER_KEY = cleanKey(process.env.OPENROUTER_KEY);
    const HUGGINGFACE_KEY = cleanKey(process.env.HUGGINGFACE_KEY);

    // टास्क के अनुसार सिस्टम प्रॉम्प्ट
    let systemPrompt = "आप दरसे निज़ामी और स्कूली पाठ्यक्रम के मोतबर AI उस्ताद (Suhail AI) हैं। जवाब साफ़ और 2-3 जुमलों में दें।";
    let userPrompt = prompt || "अस्सलामू अलैकुम";

    if (taskType === 'quiz') {
      systemPrompt = `आप एक सख्त परीक्षक हैं। दरजा ${level}/12 के लिए सिर्फ 1 बहुविकल्पीय सवाल बनाएँ। बिना किसी अतिरिक्त टेक्स्ट के सिर्फ यह शुद्ध JSON दें:
{"q": "सवाल", "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "a": 0, "s": "विषय"}`;
      userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
    } else if (taskType === 'corrector') {
      systemPrompt = "आप एक भाषा विशेषज्ञ हैं। छात्र के वाक्य में इमला (Spelling) और व्याकरण की गलती सुधारें और 2 पंक्तियों में सही वाक्य बताएं।";
    } else if (taskType === 'summary') {
      systemPrompt = "आप एक कुशल शिक्षक हैं। दिए गए पाठ या बातचीत का सार सिर्फ 3 मुख्य बुलेट पॉइंट्स में निकालें।";
    }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // टाइमआउट प्रोटेक्टेड API कॉलर (5 सेकंड में रिस्पॉन्स न मिलने पर अगले प्रोवाइडर पर स्विच)
    async function executeCall(providerName, url, apiKey, modelName, temp = 0.3) {
      if (!apiKey) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);

      try {
        console.log(`--> [AI RUNNER] Calling ${providerName} (${modelName})...`);
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
        const status = response.status;
        const textData = await response.text();

        console.log(`--> [${providerName} STATUS]:`, status);

        if (!response.ok) {
          console.warn(`[${providerName} FAILED]`, textData.slice(0, 150));
          return null;
        }

        const parsed = JSON.parse(textData);
        return parsed.choices?.[0]?.message?.content || null;
      } catch (err) {
        clearTimeout(timer);
        console.warn(`[${providerName} TIMEOUT/ERROR]:`, err.message);
        return null;
      }
    }

    let finalAnswer = null;
    let successfulProvider = "";

    // 1. Groq (Primary 0.2s - ChatGPT 2026 Model)
    if (!finalAnswer && GROQ_KEY) {
      finalAnswer = await executeCall("Groq", "https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "openai/gpt-oss-20b");
      if (finalAnswer) successfulProvider = "Groq (gpt-oss-20b)";
    }

    // 2. Cerebras (Secondary Fallback - 120B Model)
    if (!finalAnswer && CEREBRAS_KEY) {
      finalAnswer = await executeCall("Cerebras", "https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b");
      if (finalAnswer) successfulProvider = "Cerebras (gpt-oss-120b)";
    }

    // 3. SambaNova (Reasoning / Summary Fallback - Llama 3.3 70B)
    if (!finalAnswer && SAMBANOVA_KEY) {
      finalAnswer = await executeCall("SambaNova", "https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.3-70B-Instruct");
      if (finalAnswer) successfulProvider = "SambaNova (Llama 3.3 70B)";
    }

    // 4. Mistral (Grammar & Language Specialist - Mistral Small 4)
    if (!finalAnswer && MISTRAL_KEY) {
      finalAnswer = await executeCall("Mistral", "https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-2603");
      if (finalAnswer) successfulProvider = "Mistral (mistral-small-2603)";
    }

    // 5. OpenRouter (Multi-Model Cloud Router)
    if (!finalAnswer && OPENROUTER_KEY) {
      finalAnswer = await executeCall("OpenRouter", "https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.3-70b-instruct");
      if (finalAnswer) successfulProvider = "OpenRouter";
    }

    // 6. HuggingFace (Last Resort Inference Router)
    if (!finalAnswer && HUGGINGFACE_KEY) {
      finalAnswer = await executeCall("HuggingFace", "https://router.huggingface.co/v1/chat/completions", HUGGINGFACE_KEY, "meta-llama/Llama-3.3-70B-Instruct");
      if (finalAnswer) successfulProvider = "HuggingFace";
    }

    // सफलता मिलने पर 200 OK
    if (finalAnswer) {
      return res.status(200).json({
        reply: finalAnswer,
        text: finalAnswer,
        provider: successfulProvider
      });
    }

    // यदि सभी प्रोवाइडर्स किसी कारणवश विफल हों तो 502 Bad Gateway
    return res.status(502).json({
      error: "सभी AI प्रोवाइडर्स अस्थायी रूप से व्यस्त हैं। कृपया 10 सेकंड बाद पुनः प्रयास करें।"
    });

  } catch (err) {
    return res.status(500).json({ error: "आंतरिक सर्वर त्रुटि: " + err.message });
  }
};

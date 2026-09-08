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

    // टास्क आईडी (30 में से कोई एक, डिफ़ॉल्ट: 'groq_nahw_sarf_quick')
    const task = body.task || (body.isQuiz || body.type === 'quiz' ? 'cerebras_quiz_architect' : (body.type === 'corrector' ? 'mistral_magic_correct' : 'groq_nahw_sarf_quick'));
    const level = parseInt(body.level) || 1;

    // Keys सफ़ाई
    const cleanKey = (k) => (k || '').trim().replace(/^["']|["']$/g, '');
    const GROQ_KEY = cleanKey(process.env.GROQ_KEY);
    const CEREBRAS_KEY = cleanKey(process.env.CEREBRAS_KEY);
    const SAMBANOVA_KEY = cleanKey(process.env.SAMBANOVA_KEY);
    const MISTRAL_KEY = cleanKey(process.env.MISTRAL_KEY);
    const OPENROUTER_KEY = cleanKey(process.env.OPENROUTER_KEY);
    const HUGGINGFACE_KEY = cleanKey(process.env.HUGGINGFACE_KEY || process.env.HF_TOKEN);

    // 🎯 सख्त भाषा व सुरक्षा नियम
    const baseSafetyRule = `
सख्त नियम (Language Mirroring): यूज़र जिस लिपि में लिखे, उसी लिपि में जवाब दें।
1. Roman Urdu / Hinglish में इनपुट हो तो 100% Roman Urdu (English Alphabets) में ही जवाब दें। कभी देवनागरी या अरबी लिपि में न बदलें।
2. देवनागरी में हो तो शुद्ध हिंदी/देवनागरी में, और उर्दू रस्मुल ख़त में हो तो उर्दू में जवाब दें।
⚠️ सख्त पाबंदी: क़ुरआन की मनगढ़ंत आयतें, अहादीस के फर्जी मतन या गैर-प्रामाणिक फ़िक़ही फ़तवे नहीं गढ़ने हैं। सिर्फ़ ठोस नह्व, सर्फ़, अरबी भाषा और स्कूली नियमों पर केंद्रित रहें।`;

    let systemPrompt = "";
    let userPrompt = prompt;
    let preferredProvider = "Groq";
    let temperature = 0.3;

    // ================= 30 तालीमी मिक्रो-टास्क्स की मैपिंग =================

    // --- 1. GROQ (अल्ट्रा-फास्ट 0.2s स्पीड - 5 काम) ---
    if (task === 'groq_nahw_sarf_quick') {
      preferredProvider = "Groq";
      systemPrompt = `आप सुपरफास्ट नह्व-सर्फ़ परीक्षक हैं। कलिमा (इस्म, फे़'ल, हर्फ़) की तुरंत 1 जुमले में पहचान बताएँ। ${baseSafetyRule}`;
    } else if (task === 'groq_rapid_quiz') {
      preferredProvider = "Groq";
      temperature = 0.4;
      systemPrompt = `15 सेकंड के रैपिड-फायर के लिए सेग़ा/गर्दान का 1 बहुत छोटा सवाल शुद्ध JSON में दें: {"q":"सवाल","o":["A","B","C","D"],"a":0,"s":"Sarf"}`;
    } else if (task === 'groq_autocomplete') {
      preferredProvider = "Groq";
      systemPrompt = `छात्र के अरबी/उर्दू वाक्य को पूरा करने के लिए अगले 2-3 सही नह्वी शब्दों का सीधा सुझाव दें। बिना फालतू बात के सिर्फ़ वाक्य पूरा करें।`;
    } else if (task === 'groq_profile_summary') {
      preferredProvider = "Groq";
      systemPrompt = `छात्र के रोल नंबर व हाज़िरी का 1 पंक्ति में त्वरित अकादमिक स्नैपशॉट दें।`;
    } else if (task === 'groq_voice_keywords') {
      preferredProvider = "Groq";
      systemPrompt = `छात्र के संदेश से केवल मुख्य नह्वी व तालीमी कीवर्ड्स (अल्फ़ाज़) कॉमा लगाकर निकालें।`;

    // --- 2. CEREBRAS (120B मॉडल - मुश्किल क्विज़ व उच्च दर्जात - 5 काम) ---
    } else if (task === 'cerebras_quiz_architect') {
      preferredProvider = "Cerebras";
      temperature = 0.4;
      const seed = Date.now().toString().slice(-4);
      systemPrompt = `आप नह्व-ओ-सर्फ़ के आला इम्तिहान परीक्षक हैं। दरजा ${level}/12 (Seed: ${seed}) के लिए केवल शुद्ध व्याकरण (इस्म/फ़ेल, गर्दान, ए'राब) का बिना दोहराव वाला 1 नया MCQ सवाल बनाएँ।
बिना किसी अतिरिक्त पाठ के केवल यह शुद्ध JSON दें:
{"q":"सवाल","o":["विकल्प 1","विकल्प 2","विकल्प 3","विकल्प 4"],"a":0,"s":"नह्व-सर्फ़"}`;
      userPrompt = `Level ${level} का नया सवाल बनाएँ।`;
    } else if (task === 'cerebras_tarkib') {
      preferredProvider = "Cerebras";
      systemPrompt = `आप नह्वमीर और हिदायतुन नह्व के उस्ताद हैं। दी गई अरबी इबारत की मुकम्मल नह्वी तरकीब (मुब्तदा, ख़बर, फ़ाइल, मफ़ऊल) अलग-अलग समझाएँ। ${baseSafetyRule}`;
    } else if (task === 'cerebras_quiz_explain') {
      preferredProvider = "Cerebras";
      systemPrompt = `क्विज़ में छात्र ने गलत जवाब दिया। व्याकरणिक नियम (कायदे) के तहत संक्षेप में समझाएँ कि सही विकल्प क्यों सही है। ${baseSafetyRule}`;
    } else if (task === 'cerebras_haft_aqsam') {
      preferredProvider = "Cerebras";
      systemPrompt = `इल्मुस सर्फ़ के तहत दिए गए कलिमे की हफ़्त अक़्साम (सहीह, महमूज़, मिसाल, अज्वफ़, नाक़िस, लफ़ीफ़) और तालील (हुरूफ़े इल्लत का नियम) स्पष्ट करें। ${baseSafetyRule}`;
    } else if (task === 'cerebras_student_audit') {
      preferredProvider = "Cerebras";
      systemPrompt = `छात्र के टेस्ट रिकॉर्ड का विश्लेषण करके बताएं कि वह नह्व में कमज़ोर है या सर्फ़ की गर्दानों में, और 2 सुधार सुझाव दें।`;

    // --- 3. SAMBANOVA (70B डीप रीज़निंग व क्लास समरी - 5 काम) ---
    } else if (task === 'sambanova_class_summary') {
      preferredProvider = "SambaNova";
      systemPrompt = `आज की क्लास व ग्रुप बातचीत का ठीक 3 मुख्य बिंदुओं में सार (Summary) निकालें। ${baseSafetyRule}`;
    } else if (task === 'sambanova_syllabus_plan') {
      preferredProvider = "SambaNova";
      systemPrompt = `दी गई किताब व सफ़हा रेंज के लिए 7 दिन का संतुलित मुताला और सबक याद करने का शेड्यूल (पीर से सनीचर) बनाएँ।`;
    } else if (task === 'sambanova_assignment_grade') {
      preferredProvider = "SambaNova";
      systemPrompt = `परीक्षक के रूप में छात्र के असाइनमेंट का मूल्यांकन करें। 10 में से अंक दें और कमियों पर टिप्पणी करें। ${baseSafetyRule}`;
    } else if (task === 'sambanova_vocab_notes') {
      preferredProvider = "SambaNova";
      systemPrompt = `पाठ के कठिन अरबी शब्दों के मआनी, वाहिद, जमा और मुतज़ाद की एक साफ़ टेबल/सूची तैयार करें।`;
    } else if (task === 'sambanova_speech_draft') {
      preferredProvider = "SambaNova";
      systemPrompt = `छात्रों की अंजुमन के लिए दिए गए तालीमी विषय पर 2 मिनट की सारगर्भित, संतुलित और प्रभावशाली तक़रीर का ड्राफ्ट बनाएँ। ${baseSafetyRule}`;

    // --- 4. MISTRAL AI (भाषा, लिपि व इमला स्पेशलिस्ट - 5 काम) ---
    } else if (task === 'mistral_magic_correct') {
      preferredProvider = "Mistral";
      systemPrompt = `आप इमला और व्याकरण सुधारक हैं। छात्र के वाक्य में स्पेलिंग व ग्रामर की गलती ठीक करें।
सख्त नियम: जिस लिपि में इनपुट हो (Roman Urdu, Hindi, Urdu), उसी लिपि में सुधरा हुआ वाक्य दें। लिपि परिवर्तित न करें।`;
    } else if (task === 'mistral_tashkeel') {
      preferredProvider = "Mistral";
      systemPrompt = `दी गई अरबी इबारत पर नह्वी नियमों के अनुसार सटीक ए'राब (ज़ेर, ज़बर, पेश, तनवीन) लगाएँ। कोई अतिरिक्त व्याख्या न दें, सिर्फ़ ए'राब लगी इबारत दें।`;
    } else if (task === 'mistral_formal_letter') {
      preferredProvider = "Mistral";
      systemPrompt = `मदरसे के नाज़िम/उस्ताद के नाम छुट्टी या इजाज़त के लिए एक औपचारिक, अदबी और साफ़-सुथरी दरख़्वास्त (Application) ड्राफ्ट करें। ${baseSafetyRule}`;
    } else if (task === 'mistral_dictionary') {
      preferredProvider = "Mistral";
      systemPrompt = `लफ़्ज़ का माद्दा (Root Letters), बाब, मूल अर्थ और मुस्तक़ सेग़े की संक्षिप्त लुग़त रिपोर्ट दें।`;
    } else if (task === 'mistral_grammar_feedback') {
      preferredProvider = "Mistral";
      systemPrompt = `छात्र को बताएँ कि उसने वाक्य में ज़माने (Tense), मुज़क्कर-मुअन्नस या सेग़े में क्या व्याकरणिक त्रुटि की है। ${baseSafetyRule}`;

    // --- 5. OPENROUTER (रिसर्च, ट्रांसलेटर व इमरजेंसी बैकअप - 5 काम) ---
    } else if (task === 'openrouter_cross_verify') {
      preferredProvider = "OpenRouter";
      systemPrompt = `दी गई नह्वी तरकीब या गर्दान को गहराई से क्रॉस-वेरिफ़ाई करें और बताएं कि इसमें कोई व्याकरणिक त्रुटि है या नहीं।`;
    } else if (task === 'openrouter_translation') {
      preferredProvider = "OpenRouter";
      systemPrompt = `दी गई अरबी इबारत का शुद्ध, सटीक और मुहावरेदार अनुवाद (उर्दू व हिंदी में) प्रस्तुत करें।`;
    } else if (task === 'openrouter_school_solver') {
      preferredProvider = "OpenRouter";
      systemPrompt = `स्कूली निसाब के गणित, विज्ञान या भूगोल के सवाल को चरणबद्ध तरीके से हल करें। ${baseSafetyRule}`;
    } else if (task === 'openrouter_author_history') {
      preferredProvider = "OpenRouter";
      systemPrompt = `नह्व व सर्फ़ के मुसन्निफ़ीन (रचनाकारों), किताबों के दौर और उनकी तालीमी अहमियत का संक्षिप्त ऐतिहासिक संदर्भ दें।`;
    } else if (task === 'openrouter_universal_fallback') {
      preferredProvider = "OpenRouter";
      systemPrompt = `आप तालीमी उस्ताद हैं। छात्र के सवाल का संक्षिप्त व सटीक जवाब दें। ${baseSafetyRule}`;

    // --- 6. HUGGINGFACE (क्लासिफ़ायर, मॉडरेशन व सुरक्षा - 5 काम) ---
    } else if (task === 'hf_content_filter') {
      preferredProvider = "HuggingFace";
      systemPrompt = `संदेश का विश्लेषण करें। यदि इसमें गाली, अमर्यादित भाषा या विवादित बात है तो केवल "FLAGGED" लिखें, अन्यथा "SAFE" लिखें।`;
    } else if (task === 'hf_auto_tagging') {
      preferredProvider = "HuggingFace";
      systemPrompt = `छात्र के संदेश को इन 4 में से किसी 1 वर्ग में टैग करें: [नह्व, सर्फ़, असाइनमेंट, आम सवाल]। केवल वर्ग का नाम लिखें।`;
    } else if (task === 'hf_book_matcher') {
      preferredProvider = "HuggingFace";
      systemPrompt = `किताब की माँग और उपलब्ध किताबों की सूची की तुलना करें और सबसे सटीक मैच का सुझाव दें।`;
    } else if (task === 'hf_inactive_audit') {
      preferredProvider = "HuggingFace";
      systemPrompt = `छात्रों की निष्क्रियता डेटा का विश्लेषण कर पुनः सक्रिय (Re-engagement) करने हेतु 1 संक्षिप्त संदेश सुझाव दें।`;
    } else if (task === 'hf_speech_transcribe') {
      preferredProvider = "HuggingFace";
      systemPrompt = `ऑडियो/वॉइस नोट के संदर्भ का भाषाई प्रारूप तैयार करें।`;
    }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // --- AI प्रोवाइडर कॉलिंग फ़ंक्शन्स ---
    async function callOpenAICompatible(url, apiKey, model, temp = 0.3) {
      if (!apiKey) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: messagesPayload, temperature: temp }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      } catch (e) {
        clearTimeout(timer);
        return null;
      }
    }

    async function callHuggingFace(model, temp = 0.3) {
      if (!HUGGINGFACE_KEY) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      try {
        const r = await fetch(`https://router.huggingface.co/hf-inference/v1/chat/completions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${HUGGINGFACE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: model || "Qwen/Qwen2.5-72B-Instruct", messages: messagesPayload, temperature: temp }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      } catch (e) {
        clearTimeout(timer);
        return null;
      }
    }

    // प्रोवाइडर डिस्पैचर मैप
    const providers = {
      Groq: () => callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "openai/gpt-oss-20b", temperature),
      Cerebras: () => callOpenAICompatible("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b", temperature),
      SambaNova: () => callOpenAICompatible("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.3-70B-Instruct", temperature),
      Mistral: () => callOpenAICompatible("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-2603", temperature),
      OpenRouter: () => callOpenAICompatible("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.3-70b-instruct", temperature),
      HuggingFace: () => callHuggingFace("Qwen/Qwen2.5-72B-Instruct", temperature)
    };

    // 1. प्राथमिक चुने हुए प्रोवाइडर को कॉल करें
    let answer = await providers[preferredProvider]?.();
    let usedProvider = preferredProvider;

    // 2. अगर मुख्य व्यस्त हो, तो अन्य 5 प्रोवाइडर्स पर फ़ॉलबैक (Failover) करें
    if (!answer) {
      const fallbackList = Object.keys(providers).filter(p => p !== preferredProvider);
      for (const p of fallbackList) {
        answer = await providers[p]();
        if (answer) {
          usedProvider = `${p} (Fallback from ${preferredProvider})`;
          break;
        }
      }
    }

    if (answer) {
      return res.status(200).json({ reply: answer, text: answer, provider: usedProvider, task: task });
    }

    return res.status(502).json({ error: "सभी 6 AI प्रोवाइडर्स व्यस्त हैं।" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

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

    const task = body.task || 'general_chat'; // डिफ़ॉल्ट अब सामान्य बातचीत रहेगा

    const cleanKey = (k) => (k || '').trim().replace(/^["']|["']$/g, '');
    const GROQ_KEY = cleanKey(process.env.GROQ_KEY);
    const CEREBRAS_KEY = cleanKey(process.env.CEREBRAS_KEY);
    const SAMBANOVA_KEY = cleanKey(process.env.SAMBANOVA_KEY);
    const MISTRAL_KEY = cleanKey(process.env.MISTRAL_KEY);
    const OPENROUTER_KEY = cleanKey(process.env.OPENROUTER_KEY);
    const HUGGINGFACE_KEY = cleanKey(process.env.HUGGINGFACE_KEY || process.env.HF_TOKEN);
    const NVIDIA_KEY = cleanKey(process.env.NVIDIA_API_KEY);
    const CF_TOKEN = cleanKey(process.env.CLOUDFLARE_API_TOKEN);
    const CF_ACCOUNT = cleanKey(process.env.CLOUDFLARE_ACCOUNT_ID);
    const GEMINI_KEY = cleanKey(process.env.GEMINI_API_KEY);
    const COHERE_KEY = cleanKey(process.env.COHERE_API_KEY);

    const baseRule = `
आप "सोहेल एआई" (Suhail AI) हैं — जामिया ऊला के विशेष डिजिटल उस्ताद व असिस्टेंट।
सख्त नियम:
1. किसी भी बाहरी कंपनी (OpenAI, Google, Groq, Meta आदि) का नाम न लें। आपकी पहचान सिर्फ़ 'सोहेल एआई' है।
2. यूज़र जिस भाषा/लिपि में लिखे (Roman Urdu, हिंदी, या उर्दू), उसी में उत्तर दें।
3. कोई मनगढ़ंत हदीस, आयत या फ़र्ज़ी हवाला नहीं देना है।`;

    let systemPrompt = "";
    let userPrompt = prompt;
    let preferredProvider = "Groq";
    let temperature = 0.3;

    // --- सामान्य चैट (AI उस्ताद के लिए) ---
    if (task === 'general_chat') {
      preferredProvider = "Groq";
      systemPrompt = `आप सोहेल एआई हैं, जामिया ऊला के छात्रों के दोस्ताना और इल्मी उस्ताद। छात्र के सवाल का सीधा, सरल और मददगार जवाब दें। ${baseRule}`;
    }

    // --- एडमिन टास्क (जो मिस हो गए थे) ---
    else if (task === 'cerebras_quiz_architect') {
      preferredProvider = "Cerebras";
      systemPrompt = `आप सोहेल एआई हैं। जमात ऊला (दरजा 12 स्तर) के लिए नह्व व सर्फ़ के 5 उच्च स्तरीय बहुविकल्पीय (MCQ) सवालात मय 4 विकल्प और सही जवाब का मुकम्मल पर्चा तैयार करें। ${baseRule}`;
    }
    else if (task === 'mistral_formal_letter') {
      preferredProvider = "Mistral";
      systemPrompt = `मदरसा प्रशासन हेतु एक अत्यंत औपचारिक, आदरयुक्त और शुद्ध उर्दू/अरबी में नोटिस या पत्र का ड्राफ्ट तैयार करें। ${baseRule}`;
    }
    else if (task === 'sambanova_class_summary') {
      preferredProvider = "SambaNova";
      systemPrompt = `क्लासरूम बातचीत का 3 मुख्य बुलेट बिंदुओं में सार (Summary) निकालें। ${baseRule}`;
    }

    // --- 30 तालीमी टूल्स ---
    // Groq (1-5)
    else if (task === 'suhail_nahw_irab') { preferredProvider = "Groq"; systemPrompt = `इबारत के आख़िरी हर्फ़ पर ए'राब की ठोस नह्वी वजह समझाएँ। ${baseRule}`; }
    else if (task === 'suhail_bab_gardan') { preferredProvider = "Groq"; systemPrompt = `फे़'ल का बाब और माजी, मुज़ारे व अम्र की सही गर्दान दें। ${baseRule}`; }
    else if (task === 'suhail_root_detector') { preferredProvider = "Groq"; systemPrompt = `कलिमे का असली माद्दा (फ़ा, ऐन, लाम कलिमा) निकालें। ${baseRule}`; }
    else if (task === 'suhail_murakkab_izafi') { preferredProvider = "Groq"; systemPrompt = `मुज़ाफ़ और मुज़ाफ़-इलैह के नियमों की शुद्धता जाँचें। ${baseRule}`; }
    else if (task === 'groq_autocomplete') { preferredProvider = "Groq"; systemPrompt = `वाक्य को पूरा करने के लिए सिर्फ़ अगला सही व्याकरणिक शब्द दें।`; }

    // Cerebras (6-10)
    else if (task === 'suhail_munazara_guide') { preferredProvider = "Cerebras"; systemPrompt = `इल्मी मसले पर दोनों पक्षों की तार्किक दलीलें तैयार करें। ${baseRule}`; }
    else if (task === 'suhail_sharh_mushkil') { preferredProvider = "Cerebras"; systemPrompt = `कठिन इबारत की आसान और स्पष्ट इल्मी शर्ह (व्याख्या) करें। ${baseRule}`; }
    else if (task === 'suhail_arbi_urooz') { preferredProvider = "Cerebras"; systemPrompt = `शे'र का वज़न, बहर और तक़्तीअ के उसूल पहचानें। ${baseRule}`; }
    else if (task === 'suhail_ikhtilaf_nahw') { preferredProvider = "Cerebras"; systemPrompt = `बसरिय्यीन और कूफ़िय्यीन नहवियों के मतभेद का तुलनात्मक नोट दें। ${baseRule}`; }
    else if (task === 'cerebras_quiz_explain') { preferredProvider = "Cerebras"; systemPrompt = `क्विज़ में सही विकल्प की ठोस नह्वी वजह सरल शब्दों में समझाएँ। ${baseRule}`; }

    // SambaNova (11-15)
    else if (task === 'suhail_mantiq_qaziya') { preferredProvider = "SambaNova"; systemPrompt = `मंतिक़ के काज़िया (सुग़रा-कुबरा) और नतीजे की समीक्षा करें। ${baseRule}`; }
    else if (task === 'suhail_usul_fiqh') { preferredProvider = "SambaNova"; systemPrompt = `उसूल-ए-फ़िक़्ह के क़ायदों (आम, ख़ास, मुश्तरक, मुअव्वल) का विश्लेषण करें। ${baseRule}`; }
    else if (task === 'suhail_mutala_prep') { preferredProvider = "SambaNova"; systemPrompt = `कल के सबक के मुताला के लिए 5 मुख्य बिंदु तैयार करें। ${baseRule}`; }
    else if (task === 'suhail_balaghat_maani') { preferredProvider = "SambaNova"; systemPrompt = `कलाम में बलाग़त (इस्तिआरा, किनाया, तशबीह) स्पष्ट करें। ${baseRule}`; }
    else if (task === 'suhail_maqala_outline') { preferredProvider = "SambaNova"; systemPrompt = `इल्मी मक़ाला या शोध निबंध की रूपरेखा तैयार करें। ${baseRule}`; }

    // Mistral (16-20)
    else if (task === 'suhail_full_tashkeel') { preferredProvider = "Mistral"; systemPrompt = `बिना ए'राब की इबारत पर 100% सही मुकम्मल ए'राब लगाएँ।`; }
    else if (task === 'suhail_fasih_dialogue') { preferredProvider = "Mistral"; systemPrompt = `बोलचाल को शुद्ध फ़सीह और अदबी अरबी संवाद में बदलें। ${baseRule}`; }
    else if (task === 'suhail_mutaradifat') { preferredProvider = "Mistral"; systemPrompt = `लफ़्ज़ के 4-5 सूक्ष्म अंतर वाले पर्यायवाची (मुतरादिफ़ात) बताएँ। ${baseRule}`; }
    else if (task === 'suhail_maktoob_writing') { preferredProvider = "Mistral"; systemPrompt = `अरबी में औपचारिक पत्र (मकतूब) का ड्राफ्ट बनाएँ। ${baseRule}`; }
    else if (task === 'suhail_tazkir_tanis') { preferredProvider = "Mistral"; systemPrompt = `मुज़क्कर या मुअनस होने का सटीक नह्वी नियम समझाएँ। ${baseRule}`; }

    // OpenRouter (21-25)
    else if (task === 'suhail_kitabi_tarjuma') { preferredProvider = "OpenRouter"; systemPrompt = `दरसी किताब की इबारत का शुद्ध किताबी तर्जुमा करें। ${baseRule}`; }
    else if (task === 'suhail_islamic_english') { preferredProvider = "OpenRouter"; systemPrompt = `इस्लामिक टर्मिनोलॉजी के साथ सटीक अंग्रेज़ी अनुवाद करें।`; }
    else if (task === 'suhail_author_history') { preferredProvider = "OpenRouter"; systemPrompt = `किताब और मुसन्निफ़ की वफ़ात, सदी और अहमियत का संदर्भ दें। ${baseRule}`; }
    else if (task === 'suhail_gharib_alfaz') { preferredProvider = "OpenRouter"; systemPrompt = `क़ुरआन व हदीस के दुर्लभ शब्दों (ग़रीब-उल-अलफ़ाज़) का अर्थ स्पष्ट करें। ${baseRule}`; }
    else if (task === 'suhail_modern_terms') { preferredProvider = "OpenRouter"; systemPrompt = `आधुनिक स्कूली/तकनीकी शब्दों का अरबी विकल्प बताएँ। ${baseRule}`; }

    // HuggingFace (26-30)
    else if (task === 'suhail_book_indexer') { preferredProvider = "HuggingFace"; systemPrompt = `अरबी किताब के अध्यायों की साफ़ इंडेक्स सूची बनाएँ।`; }
    else if (task === 'suhail_audio_to_notes') { preferredProvider = "HuggingFace"; systemPrompt = `ऑडियो पाठ को साफ़-सुथरे बुलेट पॉइंट्स नोट्स में बदलें। ${baseRule}`; }
    else if (task === 'suhail_aqwal_sorter') { preferredProvider = "HuggingFace"; systemPrompt = `बुज़ुर्गों के अक़्वाल को विषय अनुसार वर्गीकृत करें। ${baseRule}`; }
    else if (task === 'suhail_weekly_report') { preferredProvider = "HuggingFace"; systemPrompt = `छात्र की हफ़्तेभर की पढ़ाई का प्रगति नोट लिखें। ${baseRule}`; }
    else if (task === 'suhail_book_compare') { preferredProvider = "HuggingFace"; systemPrompt = `नह्वमीर और हिदाया के संबंधित पाठों का तुलनात्मक खाका दें। ${baseRule}`; }

    // --- 40 आवामी टूल्स (31-70) ---
    // NVIDIA (31-40)
    else if (task === 'nv_govt_scheme') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी योजनाओं की पात्रता और आवेदन के नियम समझाएँ। ${baseRule}`; }
    else if (task === 'nv_complaint_letter') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी दफ़्तर हेतु औपचारिक शिकायती दरख़्वास्त पत्र ड्राफ्ट करें। ${baseRule}`; }
    else if (task === 'nv_rti_draft') { preferredProvider = "NVIDIA"; systemPrompt = `सटीक आरटीआई आवेदन पत्र तैयार करें। ${baseRule}`; }
    else if (task === 'nv_land_docs') { preferredProvider = "NVIDIA"; systemPrompt = `खतौनी, बैनामा व ज़मीनी काग़ज़ात के शब्दों को सरल भाषा में समझाएँ। ${baseRule}`; }
    else if (task === 'nv_govt_form_guide') { preferredProvider = "NVIDIA"; systemPrompt = `आधार, पैन या वोटर आईडी में सुधार की प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'nv_utility_bill_calc') { preferredProvider = "NVIDIA"; systemPrompt = `बिजली बिल गड़बड़ी पर आपत्ति पत्र तैयार करें। ${baseRule}`; }
    else if (task === 'nv_pension_scholarship') { preferredProvider = "NVIDIA"; systemPrompt = `पेंशन या छात्रवृत्ति के नियम व प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'nv_consumer_court') { preferredProvider = "NVIDIA"; systemPrompt = `उपभोक्ता फ़ोरम हेतु शिकायत का ड्राफ्ट बनाएँ। ${baseRule}`; }
    else if (task === 'nv_police_complaint') { preferredProvider = "NVIDIA"; systemPrompt = `थाना चौकी के लिए लिखित तहरीर तैयार करें। ${baseRule}`; }
    else if (task === 'nv_tenant_legal') { preferredProvider = "NVIDIA"; systemPrompt = `मकान मालिक व किरायेदार के कानूनी अधिकार व एग्रीमेंट समझाएँ। ${baseRule}`; }

    // Cloudflare (41-50)
    else if (task === 'cf_ledger_khata') { preferredProvider = "Cloudflare"; systemPrompt = `उधारी, जमा और नक़द बिक्री का खाता-बही हिसाब बनाएँ। ${baseRule}`; }
    else if (task === 'cf_profit_loss') { preferredProvider = "Cloudflare"; systemPrompt = `शुद्ध मुनाफ़ा व मार्जिन प्रतिशत निकालें। ${baseRule}`; }
    else if (task === 'cf_digital_invoice') { preferredProvider = "Cloudflare"; systemPrompt = `व्हाट्सएप पर भेजने योग्य डिजिटल बिल व रसीद बनाएँ।`; }
    else if (task === 'cf_inventory_alert') { preferredProvider = "Cloudflare"; systemPrompt = `दुकान के स्टॉक की खपत देखकर री-ऑर्डर की सलाह दें। ${baseRule}`; }
    else if (task === 'cf_retail_margin') { preferredProvider = "Cloudflare"; systemPrompt = `थोक माल को फुटकर में बेचने पर सुरक्षित मार्जिन तय करें। ${baseRule}`; }
    else if (task === 'cf_local_ad_maker') { preferredProvider = "Cloudflare"; systemPrompt = `दुकान के ऑफ़र के लिए आकर्षक व्हाट्सएप विज्ञापन लिखें। ${baseRule}`; }
    else if (task === 'cf_small_biz_plan') { preferredProvider = "Cloudflare"; systemPrompt = `कम लागत में नया काम शुरू करने की रूपरेखा दें। ${baseRule}`; }
    else if (task === 'cf_gst_guide') { preferredProvider = "Cloudflare"; systemPrompt = `जीएसटी व कम्पोज़ीशन छूट के सामान्य नियम समझाएँ। ${baseRule}`; }
    else if (task === 'cf_refund_dispute') { preferredProvider = "Cloudflare"; systemPrompt = `सामान वापसी पर ग्राहक विवाद समाधान संदेश लिखें। ${baseRule}`; }
    else if (task === 'cf_monthly_budget') { preferredProvider = "Cloudflare"; systemPrompt = `घरेलू आमदनी और राशन ख़र्चों का मासिक बचत बजट बनाएँ। ${baseRule}`; }

    // Gemini (51-60)
    else if (task === 'gem_first_aid') { preferredProvider = "Gemini"; systemPrompt = `अस्पताल पहुँचने से पहले के तात्कालिक प्राथमिक उपचार (First Aid) बताएँ। ${baseRule}`; }
    else if (task === 'gem_unani_remedy') { preferredProvider = "Gemini"; systemPrompt = `सर्दी, खाँसी, बदहज़मी पर सुरक्षित घरेलू व यूनानी नुस्खे बताएँ। ${baseRule}`; }
    else if (task === 'gem_rx_terms') { preferredProvider = "Gemini"; systemPrompt = `डॉक्टर के पर्चे पर लिखे संकेतों (OD, BD, SOS) का सही अर्थ समझाएँ। ${baseRule}`; }
    else if (task === 'gem_lab_report_terms') { preferredProvider = "Gemini"; systemPrompt = `ब्लड टेस्ट रिपोर्ट के शब्दों व सामान्य रेंज का अर्थ बताएँ। ${baseRule}`; }
    else if (task === 'gem_seasonal_diet') { preferredProvider = "Gemini"; systemPrompt = `मौसम के अनुकूल खान-पान और गिज़ा चार्ट बनाएँ। ${baseRule}`; }
    else if (task === 'gem_bp_sugar_routine') { preferredProvider = "Gemini"; systemPrompt = `बीपी व शुगर के मरीज़ों के लिए खान-पान व जीवनशैली सलाह दें। ${baseRule}`; }
    else if (task === 'gem_elder_child_care') { preferredProvider = "Gemini"; systemPrompt = `बुज़ुर्गों और बच्चों की मौसमी देखरेख का मार्गदर्शन करें। ${baseRule}`; }
    else if (task === 'gem_symptom_guide') { preferredProvider = "Gemini"; systemPrompt = `लक्षणों के आधार पर उपयुक्त विशेषज्ञ डॉक्टर के पास जाने की सलाह दें। ${baseRule}`; }
    else if (task === 'gem_mental_calm') { preferredProvider = "Gemini"; systemPrompt = `तनाव और अनिद्रा से राहत हेतु सुकूनदेह उपाय बताएँ। ${baseRule}`; }
    else if (task === 'gem_hospital_emergency') { preferredProvider = "Gemini"; systemPrompt = `इमरजेंसी में अस्पताल भर्ती कराने की प्राथमिक हिदायतें दें। ${baseRule}`; }

    // Cohere (61-70)
    else if (task === 'co_mobile_troubleshoot') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल हैंग होने या मेमोरी फुल का चरणबद्ध समाधान दें। ${baseRule}`; }
    else if (task === 'co_travel_ticket_guide') { preferredProvider = "Cohere"; systemPrompt = `ट्रेन (IRCTC) व तत्काल टिकट बुकिंग के नियम समझाएँ। ${baseRule}`; }
    else if (task === 'co_upi_fraud_safety') { preferredProvider = "Cohere"; systemPrompt = `फ़र्ज़ी कॉल और यूपीआई फ्रॉड से बचने के उपाय बताएँ। ${baseRule}`; }
    else if (task === 'co_lost_phone_ceir') { preferredProvider = "Cohere"; systemPrompt = `गुम मोबाइल को सरकारी CEIR पोर्टल पर ब्लॉक करने की प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'co_appliance_repair') { preferredProvider = "Cohere"; systemPrompt = `घरेलू उपकरणों की बुनियादी देखभाल के टिप्स दें। ${baseRule}`; }
    else if (task === 'co_daily_translator') { preferredProvider = "Cohere"; systemPrompt = `रोज़मर्रा के वाक्यों का हिंदी, अंग्रेज़ी व उर्दू में अनुवाद करें।`; }
    else if (task === 'co_online_bill_pay') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल से बिजली बिल या सिलेंडर बुकिंग की गाइड दें। ${baseRule}`; }
    else if (task === 'co_resume_builder') { preferredProvider = "Cohere"; systemPrompt = `काम या नौकरी के लिए साफ़-सुथरा बायो-डेटा तैयार करें। ${baseRule}`; }
    else if (task === 'co_social_media_helper') { preferredProvider = "Cohere"; systemPrompt = `सोशल मीडिया पोस्ट के लिए शीर्षक व विवरण तैयार करें। ${baseRule}`; }
    else if (task === 'co_market_price_check') { preferredProvider = "Cohere"; systemPrompt = `ऑनलाइन सामान ख़रीदते समय सही दाम और रेटिंग जाँचने के टिप्स दें। ${baseRule}`; }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    async function callOpenAI(url, key, model, temp = 0.3) {
      if (!key) return null;
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 6500);
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: messagesPayload, temperature: temp }),
          signal: c.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      } catch (e) { clearTimeout(t); return null; }
    }

    async function callCloudflare() {
      if (!CF_TOKEN || !CF_ACCOUNT) return null;
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 6500);
      try {
        const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesPayload }),
          signal: c.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const d = await r.json();
        return d.result?.response || null;
      } catch (e) { clearTimeout(t); return null; }
    }

    async function callGemini() {
      if (!GEMINI_KEY) return null;
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 6500);
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }]
          }),
          signal: c.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const d = await r.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e) { clearTimeout(t); return null; }
    }

    async function callCohere() {
      if (!COHERE_KEY) return null;
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 6500);
      try {
        const r = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: { "Authorization": `Bearer ${COHERE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "command-r",
            messages: [{ role: "user", content: `${systemPrompt}\n\nयूज़र: ${userPrompt}` }]
          }),
          signal: c.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const d = await r.json();
        return d.message?.content?.[0]?.text || null;
      } catch (e) { clearTimeout(t); return null; }
    }

    async function callHF() {
      if (!HUGGINGFACE_KEY) return null;
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 6500);
      try {
        const r = await fetch(`https://router.huggingface.co/hf-inference/v1/chat/completions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${HUGGINGFACE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "Qwen/Qwen2.5-72B-Instruct", messages: messagesPayload, temperature }),
          signal: c.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      } catch (e) { clearTimeout(t); return null; }
    }

    const providerMap = {
      Groq: () => callOpenAI("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "openai/gpt-oss-20b", temperature),
      Cerebras: () => callOpenAI("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b", temperature),
      SambaNova: () => callOpenAI("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.3-70B-Instruct", temperature),
      Mistral: () => callOpenAI("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-2603", temperature),
      OpenRouter: () => callOpenAI("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.3-70b-instruct", temperature),
      HuggingFace: () => callHF(),
      NVIDIA: () => callOpenAI("https://integrate.api.nvidia.com/v1/chat/completions", NVIDIA_KEY, "meta/llama-3.1-70b-instruct", temperature),
      Cloudflare: () => callCloudflare(),
      Gemini: () => callGemini(),
      Cohere: () => callCohere()
    };

    let answer = await providerMap[preferredProvider]?.();
    if (!answer) {
      for (const p of Object.keys(providerMap).filter(k => k !== preferredProvider)) {
        answer = await providerMap[p]();
        if (answer) break;
      }
    }

    if (answer) {
      return res.status(200).json({ reply: answer, text: answer, assistant: "Suhail AI" });
    }

    return res.status(502).json({ error: "सोहेल एआई सर्वर व्यस्त है, कृपया कुछ देर बाद कोशिश करें।" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

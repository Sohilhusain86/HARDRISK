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

    const task = body.task || (body.isQuiz || body.type === 'quiz' ? 'cerebras_quiz_architect' : (body.type === 'corrector' ? 'mistral_magic_correct' : 'groq_nahw_sarf_quick'));
    const level = parseInt(body.level) || 1;

    // 10 AI APIs की कीज़ (Environment Variables)
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

    // 🎯 सख्त भाषा व मर्यादा नियम (Language Mirroring)
    const baseRule = `
सख्त नियम: यूज़र जिस लिपि में लिखे, उसी लिपि में जवाब दें।
1. Roman Urdu / Hinglish (अंग्रेज़ी अक्षरों) में इनपुट हो तो 100% Roman Urdu में ही जवाब दें।
2. देवनागरी में हो तो हिंदी में और उर्दू में हो तो उर्दू में।
⚠️ सख्त पाबंदी: मनगढ़ंत हदीस, कुरआनी आयतें या फर्जी मजहबी हवाले नहीं गढ़ने हैं। व्यावहारिक, कानूनी और तार्किक जवाब दें।`;

    let systemPrompt = "";
    let userPrompt = prompt;
    let preferredProvider = "Groq";
    let temperature = 0.3;

    // ==========================================
    // भाग 1: तालीमी विंग (30 मिक्रो-टास्क्स)
    // ==========================================
    // 1. Groq (5 काम)
    if (task === 'groq_nahw_sarf_quick') { preferredProvider = "Groq"; systemPrompt = `कलिमे की बुनियादी पहचान (इस्म, फे़'ल, हर्फ़) तुरंत 1 जुमले में बताएँ। ${baseRule}`; }
    else if (task === 'groq_rapid_quiz') { preferredProvider = "Groq"; temperature = 0.4; systemPrompt = `रैपिड सेग़ा क्विज़ का 1 सवाल शुद्ध JSON में दें: {"q":"सवाल","o":["A","B","C","D"],"a":0,"s":"Sarf"}`; }
    else if (task === 'groq_autocomplete') { preferredProvider = "Groq"; systemPrompt = `अरबी/उर्दू वाक्य पूरा करने के लिए अगले सही व्याकरणिक शब्द सुझाएँ।`; }
    else if (task === 'groq_profile_summary') { preferredProvider = "Groq"; systemPrompt = `छात्र के रोल नंबर व तालीमी दर्जे का संक्षिप्त स्नैपशॉट दें।`; }
    else if (task === 'groq_voice_keywords') { preferredProvider = "Groq"; systemPrompt = `संदेश से केवल मुख्य तालीमी कीवर्ड्स कॉमा लगाकर निकालें।`; }

    // 2. Cerebras (5 काम)
    else if (task === 'cerebras_quiz_architect') {
      preferredProvider = "Cerebras"; temperature = 0.4;
      const seed = Date.now().toString().slice(-4);
      systemPrompt = `दरजा ${level}/12 (Seed: ${seed}) के लिए केवल शुद्ध नह्व-सर्फ़ व्याकरण का 1 MCQ सवाल बनाएँ। बिना अतिरिक्त पाठ के केवल JSON दें: {"q":"सवाल","o":["A","B","C","D"],"a":0,"s":"नह्व"}`;
    }
    else if (task === 'cerebras_tarkib') { preferredProvider = "Cerebras"; systemPrompt = `अरबी इबारत की मुकम्मल नह्वी तरकीब (मुब्तदा, ख़बर, मुज़ाफ़-इलैह) समझाएँ। ${baseRule}`; }
    else if (task === 'cerebras_quiz_explain') { preferredProvider = "Cerebras"; systemPrompt = `क्विज़ में सही विकल्प के व्याकरणिक नियम की तफ़सीली वजह बताएँ। ${baseRule}`; }
    else if (task === 'cerebras_haft_aqsam') { preferredProvider = "Cerebras"; systemPrompt = `कलिमे की हफ़्त अक़्साम (सहीह, मिसाल, अज्वफ़, नाक़िस आदि) व तालील स्पष्ट करें। ${baseRule}`; }
    else if (task === 'cerebras_student_audit') { preferredProvider = "Cerebras"; systemPrompt = `छात्र की नह्व-सर्फ़ कमज़ोरी और 2 सुधार सुझाव दें।`; }

    // 3. SambaNova (5 काम)
    else if (task === 'sambanova_class_summary') { preferredProvider = "SambaNova"; systemPrompt = `क्लास व बातचीत का 3 मुख्य बिंदुओं में सार (Summary) निकालें। ${baseRule}`; }
    else if (task === 'sambanova_syllabus_plan') { preferredProvider = "SambaNova"; systemPrompt = `किताब के लिए 7 दिन का मुताला और सबक याद करने का टाइम-टेबल बनाएँ।`; }
    else if (task === 'sambanova_assignment_grade') { preferredProvider = "SambaNova"; systemPrompt = `असाइनमेंट का मूल्यांकन कर 10 में से नंबर और सुधार बताएँ। ${baseRule}`; }
    else if (task === 'sambanova_vocab_notes') { preferredProvider = "SambaNova"; systemPrompt = `कठिन शब्दों के अर्थ, वाहिद-जमा और मुतज़ाद की सूची बनाएँ।`; }
    else if (task === 'sambanova_speech_draft') { preferredProvider = "SambaNova"; systemPrompt = `अंजुमन के लिए 2 मिनट की संतुलित और प्रभावी तक़रीर का ड्राफ्ट बनाएँ। ${baseRule}`; }

    // 4. Mistral (5 काम)
    else if (task === 'mistral_magic_correct') { preferredProvider = "Mistral"; systemPrompt = `वाक्य का इमला और व्याकरण सुधारें। इनपुट की मूल लिपि में ही उत्तर दें।`; }
    else if (task === 'mistral_tashkeel') { preferredProvider = "Mistral"; systemPrompt = `अरबी इबारत पर नह्वी नियमों के अनुसार सटीक ए'राब (ज़ेर-ज़बर-पेश) लगाएँ।`; }
    else if (task === 'mistral_formal_letter') { preferredProvider = "Mistral"; systemPrompt = `मदरसे या दफ़्तर के लिए औपचारिक दरख़्वास्त (Application) ड्राफ्ट करें। ${baseRule}`; }
    else if (task === 'mistral_dictionary') { preferredProvider = "Mistral"; systemPrompt = `लफ़्ज़ का माद्दा (Root), बाब और अर्थ की संक्षिप्त रिपोर्ट दें।`; }
    else if (task === 'mistral_grammar_feedback') { preferredProvider = "Mistral"; systemPrompt = `वाक्य में टेंस या जेंडर की व्याकरणिक त्रुटि विस्तार से समझाएँ। ${baseRule}`; }

    // 5. OpenRouter (5 काम)
    else if (task === 'openrouter_translation') { preferredProvider = "OpenRouter"; systemPrompt = `अरबी इबारत का शुद्ध बा-मुहावरा उर्दू व हिंदी में तालीमी अनुवाद करें।`; }
    else if (task === 'openrouter_cross_verify') { preferredProvider = "OpenRouter"; systemPrompt = `दी गई नह्वी तरकीब या गर्दान को क्रॉस-चेक करके त्रुटिहीनता जाँचे।`; }
    else if (task === 'openrouter_school_solver') { preferredProvider = "OpenRouter"; systemPrompt = `स्कूली गणित, विज्ञान या भूगोल के सवाल का चरणबद्ध समाधान दें। ${baseRule}`; }
    else if (task === 'openrouter_author_history') { preferredProvider = "OpenRouter"; systemPrompt = `नह्व-सर्फ़ के मुसन्निफ़ीन और किताबों का संक्षिप्त ऐतिहासिक संदर्भ दें।`; }
    else if (task === 'openrouter_universal_fallback') { preferredProvider = "OpenRouter"; systemPrompt = `तालीमी सवाल का संक्षिप्त व सटीक जवाब दें। ${baseRule}`; }

    // 6. HuggingFace (5 काम)
    else if (task === 'hf_content_filter') { preferredProvider = "HuggingFace"; systemPrompt = `संदेश मर्यादा जाँचे। यदि आपत्तिजनक हो तो 'FLAGGED' लिखें, अन्यथा 'SAFE'।`; }
    else if (task === 'hf_auto_tagging') { preferredProvider = "HuggingFace"; systemPrompt = `संदेश को [नह्व, सर्फ़, असाइनमेंट, आम सवाल] में से किसी 1 में टैग करें।`; }
    else if (task === 'hf_book_matcher') { preferredProvider = "HuggingFace"; systemPrompt = `किताब की माँग और उपलब्ध सूची की तुलना कर मैच बताएं।`; }
    else if (task === 'hf_inactive_audit') { preferredProvider = "HuggingFace"; systemPrompt = `निष्क्रिय छात्रों को पढ़ाई में वापस लाने हेतु 1 संक्षिप्त प्रेरक संदेश दें।`; }
    else if (task === 'hf_speech_transcribe') { preferredProvider = "HuggingFace"; systemPrompt = `ऑडियो/वॉइस नोट का भाषाई ड्राफ्ट तैयार करें।`; }

    // ==========================================
    // भाग 2: आवामी विंग (40 सार्वजनिक खिदमात)
    // ==========================================

    // 7. NVIDIA NIM: सरकारी व कानूनी मुआविज़ (10 काम)
    else if (task === 'nv_govt_scheme') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी योजनाओं (राशन, आवास, पेंशन आदि) की पात्रता और आवेदन नियम स्पष्ट समझाएँ। ${baseRule}`; }
    else if (task === 'nv_complaint_letter') { preferredProvider = "NVIDIA"; systemPrompt = `बिजली विभाग, नगर निगम या संबंधित दफ़्तर के लिए औपचारिक शिकायती पत्र ड्राफ्ट करें। ${baseRule}`; }
    else if (task === 'nv_rti_draft') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी कार्य या दस्तावेज़ की प्रगति जानने हेतु सटीक आरटीआई (RTI) आवेदन तैयार करें। ${baseRule}`; }
    else if (task === 'nv_land_docs') { preferredProvider = "NVIDIA"; systemPrompt = `खतौनी, बैनामा, वरासत व ज़मीनी दस्तावेज़ों के कानूनी शब्दों को सरल बोलचाल में समझाएँ। ${baseRule}`; }
    else if (task === 'nv_govt_form_guide') { preferredProvider = "NVIDIA"; systemPrompt = `आधार, पैन, वोटर आईडी या पासपोर्ट में सुधार व आवेदन की चरणबद्ध प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'nv_utility_bill_calc') { preferredProvider = "NVIDIA"; systemPrompt = `बिजली या पानी के मीटर यूनिट व बिल में गड़बड़ी का विश्लेषण कर आपत्ति पत्र बनाएँ। ${baseRule}`; }
    else if (task === 'nv_pension_scholarship') { preferredProvider = "NVIDIA"; systemPrompt = `वृद्धा, विधवा पेंशन या छात्रवृत्ति के नियम, कागज़ात व प्रक्रिया का मार्गदर्शन करें। ${baseRule}`; }
    else if (task === 'nv_consumer_court') { preferredProvider = "NVIDIA"; systemPrompt = `ख़राब सामान या ऑनलाइन धोखाधड़ी पर उपभोक्ता फ़ोरम हेतु शिकायत का कानूनी प्रारूप बनाएँ। ${baseRule}`; }
    else if (task === 'nv_police_complaint') { preferredProvider = "NVIDIA"; systemPrompt = `थाना चौकी के लिए निष्पक्ष व कानूनी लहज़े में लिखित तहरीर (Complaint Draft) तैयार करें। ${baseRule}`; }
    else if (task === 'nv_tenant_legal') { preferredProvider = "NVIDIA"; systemPrompt = `मकान मालिक-किरायेदार समझौते (Rent Agreement) व सामान्य कानूनी नियमों को सरल बताएँ। ${baseRule}`; }

    // 8. Cloudflare Workers AI: दुकानदारी व हिसाब-किताब (10 काम)
    else if (task === 'cf_ledger_khata') { preferredProvider = "Cloudflare"; systemPrompt = `दुकानदार की उधारी, जमा और नक़द बिक्री का साफ़ खाता-बही हिसाब तैयार करें। ${baseRule}`; }
    else if (task === 'cf_profit_loss') { preferredProvider = "Cloudflare"; systemPrompt = `लागत, भाड़ा और बिक्री मूल्य जोड़कर शुद्ध मुनाफ़ा व मार्जिन प्रतिशत निकालें। ${baseRule}`; }
    else if (task === 'cf_digital_invoice') { preferredProvider = "Cloudflare"; systemPrompt = `व्हाट्सएप पर भेजने योग्य डिजिटल बिल और पेमेंट रसीद का साफ़ टेक्स्ट ड्राफ्ट बनाएँ।`; }
    else if (task === 'cf_inventory_alert') { preferredProvider = "Cloudflare"; systemPrompt = `सामान की खपत देखकर स्टॉक दोबारा मँगाने का व्यावहारिक सुझाव दें। ${baseRule}`; }
    else if (task === 'cf_local_ad_maker') { preferredProvider = "Cloudflare"; systemPrompt = `दुकान के प्रचार व ऑफ़र के लिए आकर्षक व्हाट्सएप और सोशल मीडिया विज्ञापन लिखें। ${baseRule}`; }
    else if (task === 'cf_monthly_budget') { preferredProvider = "Cloudflare"; systemPrompt = `घरेलू आमदनी और ख़र्चों (राशन, बिल) का संतुलित मासिक बचत बजट बनाएँ। ${baseRule}`; }
    else if (task === 'cf_small_biz_plan') { preferredProvider = "Cloudflare"; systemPrompt = `कम लागत में नई दुकान या काम शुरू करने की शुरुआती लागत व सामान की रूपरेखा दें। ${baseRule}`; }
    else if (task === 'cf_gst_guide') { preferredProvider = "Cloudflare"; systemPrompt = `छोटे व्यापारियों के लिए टर्नओवर सीमा, कम्पोज़ीशन स्कीम व बुनियादी टैक्स नियम समझाएँ। ${baseRule}`; }
    else if (task === 'cf_refund_dispute') { preferredProvider = "Cloudflare"; systemPrompt = `सामान वापसी पर ग्राहक के साथ विवाद सुलझाने हेतु विनम्र समाधान संदेश लिखें। ${baseRule}`; }
    else if (task === 'cf_loan_emi_calc') { preferredProvider = "Cloudflare"; systemPrompt = `लोन, ब्याज दर, ईएमआई (EMI) और सुरक्षित मासिक बचत की योजना सरल समझाएँ। ${baseRule}`; }

    // 9. Google Gemini: सेहत, यूनानी व तिब्बी रहनुमाई (10 काम)
    else if (task === 'gem_first_aid') { preferredProvider = "Gemini"; systemPrompt = `अस्पताल पहुँचने से पहले के तात्कालिक और सुरक्षित प्राथमिक उपचार (First Aid) चरण बताएँ। ${baseRule}`; }
    else if (task === 'gem_seasonal_diet') { preferredProvider = "Gemini"; systemPrompt = `मौसम के अनुकूल खान-पान, पानी और मौसमी बीमारियों से बचाव की दिनचर्या बनाएँ। ${baseRule}`; }
    else if (task === 'gem_unani_remedy') { preferredProvider = "Gemini"; systemPrompt = `हल्की खाँसी, ज़ुकाम, बदहज़मी में रसोई के सुरक्षित घरेलू व यूनानी नुस्खों की सलाह दें। ${baseRule}`; }
    else if (task === 'gem_rx_terms') { preferredProvider = "Gemini"; systemPrompt = `डॉक्टर के पर्चे पर लिखे संकेतों (OD, BD, SOS) और दवा के सही समय का अर्थ समझाएँ। ${baseRule}`; }
    else if (task === 'gem_symptom_guide') { preferredProvider = "Gemini"; systemPrompt = `लक्षणों के आधार पर उपयुक्त विशेषज्ञ डॉक्टर (फ़िज़िशियन, ईएनटी आदि) के पास जाने की सलाह दें। ${baseRule}`; }
    else if (task === 'gem_elder_child_care') { preferredProvider = "Gemini"; systemPrompt = `बुज़ुर्गों और बच्चों की मौसमी देखरेख, पोषण और सावधानियों का मार्गदर्शन करें। ${baseRule}`; }
    else if (task === 'gem_lab_report_terms') { preferredProvider = "Gemini"; systemPrompt = `सीबीसी, शुगर व यूरिन टेस्ट रिपोर्ट के मेडिकल शब्दों व सामान्य रेंज का अर्थ सरल बताएँ। ${baseRule}`; }
    else if (task === 'gem_bp_sugar_routine') { preferredProvider = "Gemini"; systemPrompt = `बीपी व शुगर के मरीज़ों के लिए व्यावहारिक खान-पान, परहेज़ और जीवनशैली चार्ट बनाएँ। ${baseRule}`; }
    else if (task === 'gem_mental_calm') { preferredProvider = "Gemini"; systemPrompt = `तनाव और अनिद्रा से राहत हेतु सुकूनदेह श्वास क्रियाएँ व दिनचर्या सुधार के उपाय बताएँ। ${baseRule}`; }
    else if (task === 'gem_hospital_emergency') { preferredProvider = "Gemini"; systemPrompt = `गंभीर इमरजेंसी में एम्बुलेंस बुलाने और अस्पताल पहुँचने तक मरीज़ को स्थिर रखने की हिदायतें दें। ${baseRule}`; }

    // 10. Cohere: रोज़मर्रा की टेक व घरेलू मदद (10 काम)
    else if (task === 'co_mobile_troubleshoot') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल हैंग होने, मेमोरी फुल या ऐप क्रैश की समस्या का चरणबद्ध तकनीकी हल दें। ${baseRule}`; }
    else if (task === 'co_travel_ticket_guide') { preferredProvider = "Cohere"; systemPrompt = `ट्रेन (IRCTC) व बस टिकट बुकिंग, पीएनआर और तत्काल के नियम व समय सरल समझाएँ। ${baseRule}`; }
    else if (task === 'co_upi_fraud_safety') { preferredProvider = "Cohere"; systemPrompt = `संदिग्ध लिंक, फर्जी कॉल, यूपीआई फ्रॉड से बचने और खाता सुरक्षित रखने के नियम बताएँ। ${baseRule}`; }
    else if (task === 'co_recharge_wifi_plan') { preferredProvider = "Cohere"; systemPrompt = `कॉलिंग, डेटा और लंबी वैलिडिटी वाले सबसे किफ़ायती रिचार्ज प्लान्स की तुलना बताएँ। ${baseRule}`; }
    else if (task === 'co_appliance_repair') { preferredProvider = "Cohere"; systemPrompt = `कूलर, पंखा, इन्वर्टर पानी या नल टपकने जैसी घरेलू मरम्मत के बुनियादी उपाय बताएँ। ${baseRule}`; }
    else if (task === 'co_daily_translator') { preferredProvider = "Cohere"; systemPrompt = `सफ़र या बातचीत हेतु रोज़मर्रा के संवादों का हिंदी, अंग्रेज़ी व उर्दू में व्यावहारिक अनुवाद करें।`; }
    else if (task === 'co_social_media_helper') { preferredProvider = "Cohere"; systemPrompt = `फेसबुक, यूट्यूब या इंस्टाग्राम के लिए विवरण, कैप्शन और बायो तैयार करें। ${baseRule}`; }
    else if (task === 'co_lost_phone_ceir') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल चोरी या गुम होने पर सरकारी CEIR पोर्टल पर फ़ोन व सिम ब्लॉक करने की प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'co_online_bill_pay') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल से बिजली, पानी बिल भुगतान या गैस सिलेंडर बुकिंग की स्टेप-बाय-स्टेप गाइड दें। ${baseRule}`; }
    else if (task === 'co_market_price_check') { preferredProvider = "Cohere"; systemPrompt = `ऑनलाइन सामान ख़रीदते समय सही प्लेटफ़ॉर्म, क़ीमत और वारंटी जाँचने के टिप्स दें। ${baseRule}`; }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // ==========================================
    // API कॉलर्स (OpenAI, Cloudflare, Gemini, Cohere)
    // ==========================================
    async function callOpenAICompatible(url, apiKey, model, temp = 0.3) {
      if (!apiKey) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
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
      } catch (e) { clearTimeout(timer); return null; }
    }

    async function callCloudflare() {
      if (!CF_TOKEN || !CF_ACCOUNT) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesPayload }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.result?.response || null;
      } catch (e) { clearTimeout(timer); return null; }
    }

    async function callGemini() {
      if (!GEMINI_KEY) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }]
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e) { clearTimeout(timer); return null; }
    }

    async function callCohere() {
      if (!COHERE_KEY) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const r = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: { "Authorization": `Bearer ${COHERE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "command-r",
            messages: [{ role: "user", content: `${systemPrompt}\n\nयूज़र का सवाल: ${userPrompt}` }]
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.message?.content?.[0]?.text || null;
      } catch (e) { clearTimeout(timer); return null; }
    }

    async function callHuggingFace() {
      if (!HUGGINGFACE_KEY) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const r = await fetch(`https://router.huggingface.co/hf-inference/v1/chat/completions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${HUGGINGFACE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "Qwen/Qwen2.5-72B-Instruct", messages: messagesPayload, temperature }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      } catch (e) { clearTimeout(timer); return null; }
    }

    // 10 प्रोवाइडर्स का नक्शा (Map)
    const providerMap = {
      Groq: () => callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "openai/gpt-oss-20b", temperature),
      Cerebras: () => callOpenAICompatible("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b", temperature),
      SambaNova: () => callOpenAICompatible("https://api.sambanova.ai/v1/chat/completions", SAMBANOVA_KEY, "Meta-Llama-3.3-70B-Instruct", temperature),
      Mistral: () => callOpenAICompatible("https://api.mistral.ai/v1/chat/completions", MISTRAL_KEY, "mistral-small-2603", temperature),
      OpenRouter: () => callOpenAICompatible("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY, "meta-llama/llama-3.3-70b-instruct", temperature),
      HuggingFace: () => callHuggingFace(),
      NVIDIA: () => callOpenAICompatible("https://integrate.api.nvidia.com/v1/chat/completions", NVIDIA_KEY, "meta/llama-3.1-70b-instruct", temperature),
      Cloudflare: () => callCloudflare(),
      Gemini: () => callGemini(),
      Cohere: () => callCohere()
    };

    // 1. प्राथमिक चुने हुए प्रोवाइडर को चलाएँ
    let answer = await providerMap[preferredProvider]?.();
    let usedProvider = preferredProvider;

    // 2. फ़ॉलबैक (अगर पसंदीदा व्यस्त हो)
    if (!answer) {
      const fallbacks = Object.keys(providerMap).filter(k => k !== preferredProvider);
      for (const p of fallbacks) {
        answer = await providerMap[p]();
        if (answer) {
          usedProvider = `${p} (Fallback from ${preferredProvider})`;
          break;
        }
      }
    }

    if (answer) {
      return res.status(200).json({ reply: answer, text: answer, provider: usedProvider, task: task });
    }

    return res.status(502).json({ error: "सभी 10 AI प्रोवाइडर्स व्यस्त हैं।" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

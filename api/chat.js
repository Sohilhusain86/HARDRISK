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

    const task = body.task || 'suhail_nahw_irab';

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

    // 🎯 सोहेल एआई की सख्त पहचान व भाषा नियम (Zero External Branding)
    const baseRule = `
आप "सोहेल एआई" (Suhail AI) हैं — जामिया ऊला के विशेष डिजिटल व इल्मी असिस्टेंट।
सख्त नियम:
1. कभी भी किसी बाहरी कंपनी (OpenAI, Google, Meta, Mistral आदि) का नाम न लें। अगर कोई पूछे तो कहें कि आप 'सोहेल एआई' हैं।
2. यूज़र जिस लिपि में लिखे, उसी में उत्तर दें:
   - Roman Urdu (अंग्रेज़ी अक्षरों में उर्दू/हिंदी) हो तो 100% Roman Urdu में ही जवाब दें।
   - देवनागरी हो तो हिंदी में, अरबी/उर्दू लिपि हो तो उसी में।
3. कोई मनगढ़ंत हदीस, कुरआनी आयत या फ़र्ज़ी हवाला नहीं गढ़ना है। तथ्यात्मक और प्रामाणिक रहें।`;

    let systemPrompt = "";
    let userPrompt = prompt;
    let preferredProvider = "Groq";
    let temperature = 0.3;

    // ==========================================
    // भाग 1: तालीमी विंग (30 नए अनोखे टूल्स)
    // ==========================================
    // 1. Groq (5 टूल्स - व्याकरण व नह्व इंजन)
    if (task === 'suhail_nahw_irab') { preferredProvider = "Groq"; systemPrompt = `इबारत के आख़िरी हर्फ़ पर ज़बर/ज़ेर/पेश आने की ठोस नह्वी वजह स्पष्ट समझाएँ। ${baseRule}`; }
    else if (task === 'suhail_bab_gardan') { preferredProvider = "Groq"; systemPrompt = `अरबी फे़'ल का बाब पहचानें और उसकी माजी, मुज़ारे व अम्र की संक्षिप्त सही गर्दान दें। ${baseRule}`; }
    else if (task === 'suhail_root_detector') { preferredProvider = "Groq"; systemPrompt = `कलिमे का असली माद्दा (फ़ा, ऐन, लाम कलिमा) निकाल कर सिर्फ़ मूल अक्षर बताएँ। ${baseRule}`; }
    else if (task === 'suhail_murakkab_izafi') { preferredProvider = "Groq"; systemPrompt = `मुज़ाफ़ और मुज़ाफ़-इलैह के नियमों (तनवीन, नून-ए-एराबी का गिरना) की शुद्धता जाँचें। ${baseRule}`; }
    else if (task === 'groq_autocomplete') { preferredProvider = "Groq"; systemPrompt = `अरबी या उर्दू वाक्य को पूरा करने के लिए केवल अगला सही व्याकरणिक शब्द दें (अधिकतम 2-3 शब्द)।`; }

    // 2. Cerebras (5 टूल्स - गंभीर बहस व इल्मी तहक़ीक़)
    else if (task === 'suhail_munazara_guide') { preferredProvider = "Cerebras"; systemPrompt = `दिए गए इल्मी मसले पर तार्किक दलीलें (मुवाफ़िक़ व मुख़ालिफ़) संतुलित रूप में तैयार करें। ${baseRule}`; }
    else if (task === 'suhail_sharh_mushkil') { preferredProvider = "Cerebras"; systemPrompt = `नह्व या फ़िक़्ह की कठिन इबारत की आसान और स्पष्ट इल्मी शर्ह (व्याख्या) करें। ${baseRule}`; }
    else if (task === 'suhail_arbi_urooz') { preferredProvider = "Cerebras"; systemPrompt = `अरबी शे'र का वज़न, बहर और तक़्तीअ के बुनियादी उसूल पहचानें। ${baseRule}`; }
    else if (task === 'suhail_ikhtilaf_nahw') { preferredProvider = "Cerebras"; systemPrompt = `इस मसले पर बसरिय्यीन और कूफ़िय्यीन नहवियों के इख़्तिलाफ़ का संक्षिप्त तुलनात्मक नोट दें। ${baseRule}`; }
    else if (task === 'cerebras_quiz_explain') { preferredProvider = "Cerebras"; systemPrompt = `क्विज़ में सही विकल्प की ठोस नह्वी व सर्फ़ी वजह सरल शब्दों में समझाएँ। ${baseRule}`; }

    // 3. SambaNova (5 टूल्स - मंतिक़ व उसूल-ए-फ़िक़्ह)
    else if (task === 'suhail_mantiq_qaziya') { preferredProvider = "SambaNova"; systemPrompt = `मंतिक़ (तर्कशास्त्र) के काज़िया (सुग़रा-कुबरा) और नतीजे की सत्यता की तार्किक समीक्षा करें। ${baseRule}`; }
    else if (task === 'suhail_usul_fiqh') { preferredProvider = "SambaNova"; systemPrompt = `उसूल-ए-फ़िक़्ह के क़ायदों (आम, ख़ास, मुश्तरक, मुअव्वल, हक़ीक़त, मजाज़) का विश्लेषण करें। ${baseRule}`; }
    else if (task === 'suhail_mutala_prep') { preferredProvider = "SambaNova"; systemPrompt = `कल के सबक के मुताला के लिए 5 मुख्य वैचारिक बिंदु तैयार करें। ${baseRule}`; }
    else if (task === 'suhail_balaghat_maani') { preferredProvider = "SambaNova"; systemPrompt = `कलाम में बलाग़त के पहलू (इस्तिआरा, किनाया, तशबीह) स्पष्ट करें। ${baseRule}`; }
    else if (task === 'sambanova_class_summary') { preferredProvider = "SambaNova"; systemPrompt = `आज की क्लासरूम बातचीत व असबाक़ का केवल 3 मुख्य बिंदुओं में सार (Summary) निकालें। ${baseRule}`; }

    // 4. Mistral (5 टूल्स - अरबी अदब व तश्कील)
    else if (task === 'suhail_full_tashkeel') { preferredProvider = "Mistral"; systemPrompt = `बिना ए'राब की अरबी इबारत पर नह्वी नियमों के अनुसार 100% सही मुकम्मल ए'राब लगाएँ।`; }
    else if (task === 'suhail_fasih_dialogue') { preferredProvider = "Mistral"; systemPrompt = `आम बोलचाल को शुद्ध फ़सीह और अदबी अरबी संवाद में रूपांतरित करें। ${baseRule}`; }
    else if (task === 'suhail_mutaradifat') { preferredProvider = "Mistral"; systemPrompt = `लफ़्ज़ के 4-5 सूक्ष्म अंतर वाले समानार्थी (मुतरादिफ़ात) और उनका सही प्रयोग बताएँ। ${baseRule}`; }
    else if (task === 'suhail_maktoob_writing') { preferredProvider = "Mistral"; systemPrompt = `मदरसे या उलमा को अरबी में औपचारिक पत्र (मकतूब) लिखने का ड्राफ्ट बनाएँ। ${baseRule}`; }
    else if (task === 'suhail_tazkir_tanis') { preferredProvider = "Mistral"; systemPrompt = `शब्द के मुज़क्कर या मुअनस (समाई/हक़ीक़ी) होने का नियम साफ़ समझाएँ। ${baseRule}`; }

    // 5. OpenRouter (5 टूल्स - किताबी अनुवाद व दुर्लभ शब्द)
    else if (task === 'suhail_kitabi_tarjuma') { preferredProvider = "OpenRouter"; systemPrompt = `दरसी किताब की इबारत का बा-मुहावरा और शुद्ध किताबी तर्जुमा करें। ${baseRule}`; }
    else if (task === 'suhail_islamic_english') { preferredProvider = "OpenRouter"; systemPrompt = `इस्लामिक तालीमी इबारत का शुद्ध और सटीक अंग्रेज़ी अनुवाद करें।`; }
    else if (task === 'suhail_author_history') { preferredProvider = "OpenRouter"; systemPrompt = `किताब और मुसन्निफ़ की वफ़ात, सदी और इल्मी हैसियत का संक्षिप्त संदर्भ दें। ${baseRule}`; }
    else if (task === 'suhail_gharib_alfaz') { preferredProvider = "OpenRouter"; systemPrompt = `क़ुरआन व हदीस के दुर्लभ शब्दों (ग़रीब-उल-अलफ़ाज़) का प्रामाणिक लुग़वी अर्थ स्पष्ट करें। ${baseRule}`; }
    else if (task === 'suhail_modern_terms') { preferredProvider = "OpenRouter"; systemPrompt = `आधुनिक तकनीकी या स्कूली शब्दों का अरबी विकल्प बताएँ। ${baseRule}`; }

    // 6. HuggingFace (5 टूल्स - इंडेक्सिंग व वर्गीकरण)
    else if (task === 'suhail_book_indexer') { preferredProvider = "HuggingFace"; systemPrompt = `अरबी किताब के अध्यायों की विषयवार साफ़ इंडेक्स सूची बनाएँ।`; }
    else if (task === 'suhail_audio_to_notes') { preferredProvider = "HuggingFace"; systemPrompt = `ऑडियो/भाषण के पाठ को साफ़-सुथरे बुलेट पॉइंट्स नोट्स में बदलें। ${baseRule}`; }
    else if (task === 'suhail_aqwal_sorter') { preferredProvider = "HuggingFace"; systemPrompt = `अक़्वाल-ए-सल्फ़ और हिकमत की बातों को विषय अनुसार वर्गीकृत करें। ${baseRule}`; }
    else if (task === 'suhail_weekly_report') { preferredProvider = "HuggingFace"; systemPrompt = `छात्र की हफ़्तेभर की पढ़ाई का उत्साहवर्धक प्रगति नोट लिखें। ${baseRule}`; }
    else if (task === 'suhail_book_compare') { preferredProvider = "HuggingFace"; systemPrompt = `नह्वमीर और हिदायतुन्नह्व के संबंधित पाठों का संक्षिप्त तुलनात्मक खाका दें। ${baseRule}`; }

    // ==========================================
    // भाग 2: आवामी विंग (40 नए पब्लिक टूल्स)
    // ==========================================
    // 7. NVIDIA (10 टूल्स - क़ानूनी व सरकारी)
    else if (task === 'nv_govt_scheme') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी योजनाओं की पात्रता और आवेदन के नियम स्पष्ट समझाएँ। ${baseRule}`; }
    else if (task === 'nv_complaint_letter') { preferredProvider = "NVIDIA"; systemPrompt = `संबंधित सरकारी दफ़्तर हेतु औपचारिक शिकायती दरख़्वास्त पत्र ड्राफ्ट करें। ${baseRule}`; }
    else if (task === 'nv_rti_draft') { preferredProvider = "NVIDIA"; systemPrompt = `सरकारी कार्य की जानकारी माँगने हेतु सटीक आरटीआई आवेदन तैयार करें। ${baseRule}`; }
    else if (task === 'nv_land_docs') { preferredProvider = "NVIDIA"; systemPrompt = `खतौनी, बैनामा व ज़मीनी काग़ज़ात के कानूनी शब्दों को सरल बोलचाल में समझाएँ। ${baseRule}`; }
    else if (task === 'nv_govt_form_guide') { preferredProvider = "NVIDIA"; systemPrompt = `आधार, पैन या वोटर आईडी में सुधार की चरणबद्ध प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'nv_utility_bill_calc') { preferredProvider = "NVIDIA"; systemPrompt = `बिजली बिल की गड़बड़ी पर बिजली विभाग को आपत्ति पत्र तैयार करें। ${baseRule}`; }
    else if (task === 'nv_pension_scholarship') { preferredProvider = "NVIDIA"; systemPrompt = `पेंशन या छात्रवृत्ति के नियम, ज़रूरी दस्तावेज़ व प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'nv_consumer_court') { preferredProvider = "NVIDIA"; systemPrompt = `ख़राब सामान या ठगी पर उपभोक्ता फ़ोरम हेतु शिकायत का ड्राफ्ट बनाएँ। ${baseRule}`; }
    else if (task === 'nv_police_complaint') { preferredProvider = "NVIDIA"; systemPrompt = `थाना चौकी के लिए निष्पक्ष और कानूनी लहज़े में लिखित तहरीर तैयार करें। ${baseRule}`; }
    else if (task === 'nv_tenant_legal') { preferredProvider = "NVIDIA"; systemPrompt = `मकान मालिक व किरायेदार के कानूनी अधिकार व एग्रीमेंट के नियम समझाएँ। ${baseRule}`; }

    // 8. Cloudflare (10 टूल्स - दुकान व हिसाब)
    else if (task === 'cf_ledger_khata') { preferredProvider = "Cloudflare"; systemPrompt = `उधारी, जमा और नक़द बिक्री का साफ़-सुथरा खाता-बही हिसाब तैयार करें। ${baseRule}`; }
    else if (task === 'cf_profit_loss') { preferredProvider = "Cloudflare"; systemPrompt = `ख़रीद मूल्य, भाड़ा और बिक्री मूल्य से शुद्ध मुनाफ़ा व मार्जिन प्रतिशत निकालें। ${baseRule}`; }
    else if (task === 'cf_digital_invoice') { preferredProvider = "Cloudflare"; systemPrompt = `व्हाट्सएप पर ग्राहक को भेजने योग्य डिजिटल बिल और पेमेंट रसीद बनाएँ।`; }
    else if (task === 'cf_inventory_alert') { preferredProvider = "Cloudflare"; systemPrompt = `दुकान के स्टॉक की खपत देखकर सामान मँगाने का सुझाव दें। ${baseRule}`; }
    else if (task === 'cf_retail_margin') { preferredProvider = "Cloudflare"; systemPrompt = `थोक माल को फुटकर में बेचने पर सुरक्षित मार्जिन तय करने की सलाह दें। ${baseRule}`; }
    else if (task === 'cf_local_ad_maker') { preferredProvider = "Cloudflare"; systemPrompt = `दुकान के प्रचार व ऑफ़र के लिए आकर्षक व्हाट्सएप विज्ञापन लिखें। ${baseRule}`; }
    else if (task === 'cf_small_biz_plan') { preferredProvider = "Cloudflare"; systemPrompt = `कम लागत में नया काम शुरू करने की शुरुआती रूपरेखा दें। ${baseRule}`; }
    else if (task === 'cf_gst_guide') { preferredProvider = "Cloudflare"; systemPrompt = `छोटे दुकानदारों के लिए जीएसटी व कम्पोज़ीशन स्कीम के सामान्य नियम समझाएँ। ${baseRule}`; }
    else if (task === 'cf_refund_dispute') { preferredProvider = "Cloudflare"; systemPrompt = `सामान वापसी पर ग्राहक के साथ विवाद सुलझाने हेतु सौम्य संदेश लिखें। ${baseRule}`; }
    else if (task === 'cf_monthly_budget') { preferredProvider = "Cloudflare"; systemPrompt = `घरेलू आमदनी और राशन-बिल ख़र्चों का संतुलित मासिक बचत बजट बनाएँ। ${baseRule}`; }

    // 9. Gemini (10 टूल्स - सेहत व यूनानी)
    else if (task === 'gem_first_aid') { preferredProvider = "Gemini"; systemPrompt = `अस्पताल पहुँचने से पहले के तात्कालिक और सुरक्षित प्राथमिक उपचार (First Aid) चरण बताएँ। ${baseRule}`; }
    else if (task === 'gem_unani_remedy') { preferredProvider = "Gemini"; systemPrompt = `सर्दी, खाँसी, बदहज़मी पर रसोई के सुरक्षित घरेलू व यूनानी नुस्खे बताएँ। ${baseRule}`; }
    else if (task === 'gem_rx_terms') { preferredProvider = "Gemini"; systemPrompt = `डॉक्टर के पर्चे पर लिखे संकेतों (OD, BD, SOS) का सही अर्थ समझाएँ। ${baseRule}`; }
    else if (task === 'gem_lab_report_terms') { preferredProvider = "Gemini"; systemPrompt = `ब्लड टेस्ट (CBC, शुगर) रिपोर्ट के शब्दों व सामान्य रेंज का सरल अर्थ बताएँ। ${baseRule}`; }
    else if (task === 'gem_seasonal_diet') { preferredProvider = "Gemini"; systemPrompt = `मौसम के अनुकूल खान-पान और बीमारियों से बचाव का गिज़ा चार्ट बनाएँ। ${baseRule}`; }
    else if (task === 'gem_bp_sugar_routine') { preferredProvider = "Gemini"; systemPrompt = `बीपी व शुगर के मरीज़ों के लिए खान-पान, परहेज़ और जीवनशैली सलाह दें। ${baseRule}`; }
    else if (task === 'gem_elder_child_care') { preferredProvider = "Gemini"; systemPrompt = `बुज़ुर्गों और बच्चों की मौसमी देखरेख और सावधानियों का मार्गदर्शन करें। ${baseRule}`; }
    else if (task === 'gem_symptom_guide') { preferredProvider = "Gemini"; systemPrompt = `लक्षणों के आधार पर उपयुक्त विशेषज्ञ डॉक्टर के पास जाने की सलाह दें। ${baseRule}`; }
    else if (task === 'gem_mental_calm') { preferredProvider = "Gemini"; systemPrompt = `तनाव और अनिद्रा से राहत हेतु सुकूनदेह श्वास क्रियाएँ व उपाय बताएँ। ${baseRule}`; }
    else if (task === 'gem_hospital_emergency') { preferredProvider = "Gemini"; systemPrompt = `इमरजेंसी में अस्पताल पहुँचने और मरीज़ को सँभालने की प्राथमिक हिदायतें दें। ${baseRule}`; }

    // 10. Cohere (10 टूल्स - टेक व डिजिटल)
    else if (task === 'co_mobile_troubleshoot') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल हैंग होने या मेमोरी फुल की समस्या का चरणबद्ध तकनीकी समाधान दें। ${baseRule}`; }
    else if (task === 'co_travel_ticket_guide') { preferredProvider = "Cohere"; systemPrompt = `ट्रेन (IRCTC) व तत्काल टिकट बुकिंग के नियम व समय सरल समझाएँ। ${baseRule}`; }
    else if (task === 'co_upi_fraud_safety') { preferredProvider = "Cohere"; systemPrompt = `फ़र्ज़ी कॉल, संदिग्ध लिंक और यूपीआई फ्रॉड से बचने के उपाय बताएँ। ${baseRule}`; }
    else if (task === 'co_lost_phone_ceir') { preferredProvider = "Cohere"; systemPrompt = `गुम मोबाइल को सरकारी CEIR पोर्टल पर ब्लॉक करने की प्रक्रिया बताएँ। ${baseRule}`; }
    else if (task === 'co_appliance_repair') { preferredProvider = "Cohere"; systemPrompt = `कूलर, पंखा या इन्वर्टर की बुनियादी घरेलू देखभाल के टिप्स दें। ${baseRule}`; }
    else if (task === 'co_daily_translator') { preferredProvider = "Cohere"; systemPrompt = `सफ़र या बातचीत हेतु रोज़मर्रा के वाक्यों का हिंदी, अंग्रेज़ी व उर्दू में व्यावहारिक अनुवाद करें।`; }
    else if (task === 'co_online_bill_pay') { preferredProvider = "Cohere"; systemPrompt = `मोबाइल से बिजली बिल भुगतान या गैस सिलेंडर बुकिंग की स्टेप गाइड दें। ${baseRule}`; }
    else if (task === 'co_resume_builder') { preferredProvider = "Cohere"; systemPrompt = `काम या नौकरी के लिए साफ़-सुथरा बायो-डेटा टेक्स्ट ड्राफ्ट तैयार करें। ${baseRule}`; }
    else if (task === 'co_social_media_helper') { preferredProvider = "Cohere"; systemPrompt = `सोशल मीडिया पोस्ट के लिए शीर्षक, विवरण और टैग्स तैयार करें। ${baseRule}`; }
    else if (task === 'co_market_price_check') { preferredProvider = "Cohere"; systemPrompt = `ऑनलाइन सामान ख़रीदते समय सही दाम और रेटिंग जाँचने के टिप्स दें। ${baseRule}`; }

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // API Callers
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

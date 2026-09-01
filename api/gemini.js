export default async function handler(req, res) {
  // =========================================================
  // CORS
  // =========================================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // केवल POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Only POST requests are allowed.'
    });
  }

  try {
    // =======================================================
    // API KEY
    // =======================================================
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY Vercel Environment Variables में मौजूद नहीं है।'
      });
    }

    // =======================================================
    // REQUEST DATA
    // =======================================================
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages की सूची खाली है।'
      });
    }

    // =======================================================
    // BASIC LIMITS
    // =======================================================

    // बहुत ज्यादा messages भेजने से रोकना
    if (messages.length > 12) {
      return res.status(400).json({
        error: 'Chat history बहुत लंबी है। अधिकतम 12 messages की अनुमति है।'
      });
    }

    // हर message की जाँच
    for (const message of messages) {
      if (!message || typeof message !== 'object') {
        return res.status(400).json({
          error: 'Chat history का format सही नहीं है।'
        });
      }

      if (!['user', 'model'].includes(message.role)) {
        return res.status(400).json({
          error: 'Invalid message role.'
        });
      }

      if (!Array.isArray(message.parts) || message.parts.length === 0) {
        return res.status(400).json({
          error: 'Message parts मौजूद नहीं हैं।'
        });
      }

      for (const part of message.parts) {
        if (!part || typeof part.text !== 'string') {
          return res.status(400).json({
            error: 'Message text सही format में नहीं है।'
          });
        }

        // एक message बहुत बड़ा न हो
        if (part.text.length > 6000) {
          return res.status(400).json({
            error: 'एक message बहुत लंबा है। कृपया छोटा message भेजें।'
          });
        }
      }
    }

    // =======================================================
    // SESSION HISTORY
    // =======================================================
    // केवल हाल की बातचीत Gemini को भेजी जाएगी।
    // इससे app बंद होने के बाद server पर कोई स्थायी AI-memory
    // अपने-आप नहीं बनेगी।
    const recentMessages = messages.slice(-12);

    // =======================================================
    // AI SYSTEM INSTRUCTION
    // =======================================================
    const systemInstruction = `
तुम इस ऐप के "AI उस्ताद" हो।

यह ऐप विशेष रूप से मदरसे के विद्यार्थियों और तालीम हासिल करने वालों
की मदद के लिए बनाया गया है।

तुम्हारा काम:
1. उर्दू, हिंदी और English में साफ़ और समझने योग्य जवाब देना।
2. विद्यार्थी के सवाल का सीधा जवाब देना।
3. जरूरत के अनुसार आसान उदाहरण देना।
4. बेवजह लंबी भूमिका या इधर-उधर की बातें न करना।
5. विद्यार्थी अगर केवल एक शब्द या छोटा सवाल पूछे तो उसी संदर्भ में
   उसका अर्थ समझकर जवाब देना।
6. पिछली बातचीत के messages को ध्यान में रखकर follow-up सवालों का
   जवाब देना।
7. बातचीत के दौरान जिस विषय पर बात हो रही हो, उसे अचानक बदलना नहीं।
8. अगर सवाल अस्पष्ट हो तो अनुमान लगाकर गलत जवाब देने के बजाय
   छोटी-सी clarification माँगना।
9. जिस बात का भरोसेमंद ज्ञान न हो, उसे निश्चित तथ्य के रूप में न बताना।
10. दीन से संबंधित सवालों में विशेष सावधानी रखना। गलत या मनगढ़ंत
    हदीस, आयत, किताब, लेखक, पृष्ठ या फतवे का हवाला न बनाना।
11. कुरआन की आयत, हदीस या किसी किताब का शब्दशः हवाला तभी देना जब
    उसके शब्दों के बारे में पर्याप्त भरोसा हो।
12. धार्मिक मसले में जरूरत हो तो स्पष्ट करना कि यह सामान्य इल्मी
    जानकारी है और अंतिम फतवे के लिए योग्य مفتی/आलिम से رجوع किया जाए।
13. विद्यार्थी को गाली, अपमान, धमकी या अश्लील भाषा से जवाब न देना।
14. हिंसा, आत्म-हानि, अपराध, हथियार, नशीली चीजों या अन्य खतरनाक
    कामों के लिए निर्देश न देना।
15. नाबालिगों के लिए अनुपयुक्त सामग्री न देना।
16. किसी व्यक्ति की निजी जानकारी, password, API key या secret माँगना
    या दिखाना नहीं।
17. API key, server secret या environment variable की असली value
    कभी भी जवाब में प्रकट न करना।
18. अगर विद्यार्थी code पूछे तो सुरक्षित और काम करने योग्य code देना,
    लेकिन secret/API key को frontend code में रखने की सलाह न देना।

जवाब का अंदाज़:
- इल्मी
- शरीफ़
- मददगार
- विद्यार्थी के स्तर के मुताबिक
- अनावश्यक अंग्रेज़ी कम
- जहाँ उचित हो वहाँ उर्दू/हिंदी में आसान व्याख्या

सबसे महत्वपूर्ण:
बातचीत के मौजूदा context को ध्यान में रखो और follow-up सवाल को
अलग नया विषय समझकर जवाब मत दो।
`;

    // =======================================================
    // GEMINI API REQUEST
    // =======================================================
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },

          contents: recentMessages,

          generationConfig: {
            maxOutputTokens: 2500
          }
        })
      }
    );

    // =======================================================
    // GEMINI RESPONSE
    // =======================================================
    const data = await response.json();

    // API error
    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'Gemini API ने error वापस किया।'
      });
    }

    // AI text निकालना
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();

    if (!text) {
      return res.status(500).json({
        error: 'AI से कोई जवाब नहीं मिला।'
      });
    }

    // =======================================================
    // SUCCESS
    // =======================================================
    return res.status(200).json({
      text
    });

  } catch (error) {

    console.error('Gemini Server Error:', error);

    return res.status(500).json({
      error: 'Server error: ' + (error?.message || 'Unknown error')
    });
  }
}
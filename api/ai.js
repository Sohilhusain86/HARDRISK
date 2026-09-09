export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, messages, provider = "gemini" } = req.body;
  const userContent = prompt || (messages && messages[messages.length - 1]?.content) || "";

  if (!userContent.trim()) {
    return res.status(400).json({ error: "Input prompt is required" });
  }

  // 7 Modern Target Models Configuration
  const AI_PROVIDERS = {
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY || process.env.API_KEY}`,
      type: "gemini",
      model: "gemini-3.8-flash"
    },
    groq: {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      type: "openai_compat"
    },
    cerebras: {
      url: "https://api.cerebras.ai/v1/chat/completions",
      key: process.env.CEREBRAS_API_KEY,
      model: "gpt-oss-120b",
      type: "openai_compat"
    },
    sambanova: {
      url: "https://api.sambanova.ai/v1/chat/completions",
      key: process.env.SAMBANOVA_API_KEY,
      model: "MiniMax-M2.7",
      type: "openai_compat"
    },
    mistral: {
      url: "https://api.mistral.ai/v1/chat/completions",
      key: process.env.MISTRAL_API_KEY,
      model: "mistral-medium-3-5",
      type: "openai_compat"
    },
    openrouter: {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: process.env.OPENROUTER_API_KEY,
      model: "openrouter/free",
      type: "openai_compat"
    },
    huggingface: {
      url: "https://api-inference.huggingface.co/models/Qwen/Qwen3.8-27B/v1/chat/completions",
      key: process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY,
      model: "Qwen/Qwen3.8-27B",
      type: "openai_compat"
    }
  };

  async function callProvider(name) {
    const config = AI_PROVIDERS[name];
    if (!config) throw new Error(`Unknown provider: ${name}`);

    if (config.type === "gemini") {
      const response = await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userContent }] }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini Error");
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (config.type === "openai_compat") {
      if (!config.key) throw new Error(`Missing API Key for ${name}`);
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: userContent }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `${name} Error`);
      return data.choices?.[0]?.message?.content;
    }
  }

  // Waterfall Fallback: Selected -> Gemini -> Groq -> OpenRouter
  const fallbackChain = [provider, "gemini", "groq", "openrouter"].filter(
    (val, idx, self) => self.indexOf(val) === idx
  );

  let lastError = null;
  for (const prov of fallbackChain) {
    try {
      const resultText = await callProvider(prov);
      if (resultText) {
        return res.status(200).json({
          success: true,
          provider: prov,
          model: AI_PROVIDERS[prov].model,
          text: resultText,
          reply: resultText
        });
      }
    } catch (e) {
      console.warn(`[AI Failover] ${prov} failed:`, e.message);
      lastError = e;
    }
  }

  return res.status(500).json({
    success: false,
    error: lastError?.message || "All AI providers failed to respond"
  });
}

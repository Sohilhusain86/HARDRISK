export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { prompt, systemInstruction } = req.body || {};
  const sysPrompt = systemInstruction || "You are an expert Islamic and academic teacher helper. Reply concisely in simple Urdu/Hindi.";

  // 1. Cerebras (1800+ tok/s Ultra-fast)
  try {
    const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CEREBRAS_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }]
      })
    });
    if (cRes.ok) {
      const data = await cRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {
    console.log("Cerebras busy, switching to Groq...");
  }

  // 2. Groq Cloud (Low Latency)
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }]
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {
    console.log("Groq busy, switching to SambaNova...");
  }

  // 3. SambaNova (Heavy 70B Reasoning)
  try {
    const sRes = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SAMBANOVA_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Meta-Llama-3.1-70B-Instruct",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }]
      })
    });
    if (sRes.ok) {
      const data = await sRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {
    console.log("SambaNova busy, switching to Mistral...");
  }

  // 4. Mistral AI (Multilingual)
  try {
    const mRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }]
      })
    });
    if (mRes.ok) {
      const data = await mRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {
    console.log("Mistral busy, switching to OpenRouter...");
  }

  // 5. OpenRouter (Final Hub Fallback)
  try {
    const oRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }]
      })
    });
    if (oRes.ok) {
      const data = await oRes.json();
      return res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (e) {
    console.log("All gateways exhausted");
  }

  return res.status(500).json({ error: "सभी AI सर्वर व्यस्त हैं।" });
}

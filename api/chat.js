const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
};

function getBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function normalizeMessages(body) {
  if (Array.isArray(body.messages)) {
    return body.messages.map(m => {
      if (m && m.parts) return { role: m.role === 'model' ? 'assistant' : 'user', content: m.parts.map(p => p.text || '').join('') };
      return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') };
    }).filter(m => m.content);
  }
  const prompt = String(body.prompt || '').trim();
  const systemInstruction = String(body.systemInstruction || '').trim();
  const type = String(body.type || body.task || 'assistant');
  let effective = prompt;
  if (!effective && type === 'quiz') {
    const level = Number(body.level || 1);
    effective = `Generate one Islamic/academic multiple-choice quiz question for level ${level}. Return ONLY JSON: {"q":"question","o":["option 1","option 2","option 3","option 4"],"a":0}`;
  }
  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  if (type === 'corrector') messages.unshift({ role: 'system', content: 'You are a careful language corrector. Return only the corrected text, preserving the intended meaning.' });
  if (type === 'summary') messages.unshift({ role: 'system', content: 'Summarize clearly and accurately in simple language.' });
  if (effective) messages.push({ role: 'user', content: effective });
  return messages;
}

async function openAICompatible(url, key, model, messages, extraHeaders = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ model, messages, temperature: 0.3 })
  });
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(data?.error?.message || data?.message || `Provider HTTP ${r.status}`);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Provider returned no text');
  return String(content).trim();
}

async function gemini(key, model, messages) {
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const body = { contents, generationConfig: { temperature: 0.3 } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const text = await r.text(); let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(data?.error?.message || `Gemini HTTP ${r.status}`);
  const out = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
  if (!out) throw new Error('Gemini returned no text');
  return out.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST method required' });
  try {
    const body = await getBody(req);
    const messages = normalizeMessages(body);
    if (!messages.length) return json(res, 400, { error: 'Prompt is required' });

    const providers = [];
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      providers.push(() => gemini(geminiKey, process.env.GEMINI_MODEL || 'gemini-2.5-flash', messages));
      providers.push(() => gemini(geminiKey, 'gemini-3.8-flash', messages));
    }
    if (process.env.CEREBRAS_KEY) providers.push(() => openAICompatible('https://api.cerebras.ai/v1/chat/completions', process.env.CEREBRAS_KEY, 'llama3.1-8b', messages));
    if (process.env.GROQ_KEY) providers.push(() => openAICompatible('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'llama-3.1-8b-instant', messages));
    if (process.env.SAMBANOVA_KEY) providers.push(() => openAICompatible('https://api.sambanova.ai/v1/chat/completions', process.env.SAMBANOVA_KEY, 'Meta-Llama-3.1-70B-Instruct', messages));
    if (process.env.OPENROUTER_KEY) providers.push(() => openAICompatible('https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_KEY, 'meta-llama/llama-3.1-8b-instruct:free', messages, { 'HTTP-Referer': 'https://hardrisk.vercel.app', 'X-Title': 'Jamia Students Messenger' }));
    if (process.env.MISTRAL_KEY) providers.push(() => openAICompatible('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_KEY, 'mistral-small-latest', messages));
    if (process.env.HF_TOKEN) providers.push(() => openAICompatible('https://router.huggingface.co/v1/chat/completions', process.env.HF_TOKEN, 'meta-llama/Llama-3.1-8B-Instruct', messages));

    if (!providers.length) return json(res, 500, { error: 'No AI provider key configured on Vercel.' });

    let lastError = 'AI providers unavailable';
    for (const call of providers) {
      try {
        const reply = await call();
        return json(res, 200, { reply, text: reply });
      } catch (e) {
        lastError = e?.message || lastError;
      }
    }
    return json(res, 502, { error: lastError });
  } catch (e) {
    return json(res, 400, { error: e?.message || 'Request failed' });
  }
}

const chatHandler = require('./chat.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST method required' });
  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find(m => m && (m.role === 'user' || !m.role));
    const prompt = lastUser?.parts?.map(p => p?.text || '').join('') || lastUser?.content || '';
    if (!String(prompt).trim()) return res.status(400).json({ error: 'Prompt required' });
    const prior = messages.slice(0, -1).map(m => `${m.role || 'user'}: ${(m.parts || []).map(p => p?.text || '').join('') || m.content || ''}`).join('\n');
    const combined = prior ? `${prior}\n\nuser: ${prompt}` : String(prompt);

    const proxyReq = { ...req, body: {
      task: 'gemini_compatibility',
      prompt: combined,
      systemInstruction: 'You are Suhail AI, an educational assistant. Answer accurately in simple Hindi/Urdu/English as appropriate.'
    }};
    const originalJson = res.json.bind(res);
    res.json = (payload) => originalJson({ ...payload, text: payload?.text || payload?.reply || '' });
    return chatHandler(proxyReq, res);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'AI compatibility route failed.' });
  }
};

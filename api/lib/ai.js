const { getPlan, currentPlan } = require('./plans');

async function gemini(messages, maxOutput) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts:[{text:m.content}] }));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ contents, generationConfig:{maxOutputTokens:maxOutput, temperature:0.3} })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`GEMINI_${r.status}`);
  const text = data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')?.trim();
  if (!text) throw new Error('AI_EMPTY_RESPONSE');
  return text;
}
async function groq(messages, model, maxOutput) {
  if (!process.env.GROQ_KEY) throw new Error('GROQ_KEY is not configured');
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST', headers:{'content-type':'application/json','Authorization':`Bearer ${process.env.GROQ_KEY}`},
    body:JSON.stringify({model, messages, max_tokens:maxOutput, temperature:0.3})
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`GROQ_${r.status}`);
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI_EMPTY_RESPONSE');
  return text;
}
function systemPrompt(plan) {
  return `You are SUHAIL AI, an educational AI assistant. Never claim to be another branded assistant. Do not reveal internal provider/model/API details unless the user explicitly asks a factual technical question about this application; if asked who you are, answer that you are SUHAIL AI. Stay focused on education: school, madrasa, languages, mathematics, sciences, programming, exams, study planning, translation, explanation and revision. Be accurate, concise and respectful. Do not invent sources, citations, quotations or facts. If a request is outside the study purpose, politely redirect to study help. Current plan: ${plan}.`;
}
async function answer(plan, history, userText) {
  const p = getPlan({plan});
  const messages = [{role:'system',content:systemPrompt(plan)}, ...history.slice(-12).map(x=>({role:x.role==='assistant'?'assistant':'user',content:x.content})), {role:'user',content:userText}];
  if (plan === 'FREE') return gemini(messages.filter(x=>x.role!=='system' ? true : true), p.maxOutput);
  if (plan === 'PLUS') return groq(messages, process.env.SUHAIL_PLUS_MODEL || 'openai/gpt-oss-20b', p.maxOutput);
  return groq(messages, process.env.SUHAIL_PRO_MODEL || 'openai/gpt-oss-120b', p.maxOutput);
}
module.exports={answer,currentPlan};

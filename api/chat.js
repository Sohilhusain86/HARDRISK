const PROVIDERS = [
  { name:'groq', key:'GROQ_API_KEY', url:'https://api.groq.com/openai/v1/chat/completions', model:process.env.GROQ_MODEL || 'llama-3.1-8b-instant' },
  { name:'cerebras', key:'CEREBRAS_API_KEY', url:'https://api.cerebras.ai/v1/chat/completions', model:process.env.CEREBRAS_MODEL || 'llama-3.3-70b' },
  { name:'sambanova', key:'SAMBANOVA_API_KEY', url:'https://api.sambanova.ai/v1/chat/completions', model:process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct' },
  { name:'mistral', key:'MISTRAL_API_KEY', url:'https://api.mistral.ai/v1/chat/completions', model:process.env.MISTRAL_MODEL || 'mistral-small-latest' },
  { name:'openrouter', key:'OPENROUTER_API_KEY', url:'https://openrouter.ai/api/v1/chat/completions', model:process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free' },
];
const GEMINI_KEY = process.env.GEMINI_API_KEY;

function promptFor(body){
  const p = String(body.prompt || '').slice(0, 12000);
  const task = String(body.task || body.type || 'assistant');
  const level = Number(body.level || 1);
  const sys = String(body.systemInstruction || 'आप एक योग्य शैक्षणिक सहायक हैं। सरल हिंदी/उर्दू/अंग्रेज़ी में सटीक और उपयोगी उत्तर दें।').slice(0,4000);
  return `${sys}\n\nTask: ${task}\nLevel: ${level}\n\nUser: ${p}`;
}
async function callProvider(p, messages, signal){
  const key=process.env[p.key]; if(!key) throw new Error('not configured');
  const headers={'Content-Type':'application/json','Authorization':`Bearer ${key}`};
  if(p.name==='openrouter'){headers['HTTP-Referer']='https://hardrisk.vercel.app';headers['X-Title']='Jamat Ula Alif';}
  const r=await fetch(p.url,{method:'POST',headers,body:JSON.stringify({model:p.model,messages,temperature:0.2,max_tokens:900}),signal});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error?.message || `${p.name} ${r.status}`);
  const text=d.choices?.[0]?.message?.content || d.choices?.[0]?.text || '';
  if(!text) throw new Error(`${p.name} empty response`);
  return text;
}
async function callGemini(messages){
  if(!GEMINI_KEY) throw new Error('Gemini not configured');
  const contents=messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents, generationConfig:{temperature:0.2,maxOutputTokens:900}})});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error?.message || `Gemini ${r.status}`);
  const text=d.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('') || ''; if(!text) throw new Error('Gemini empty response'); return text;
}
module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST method required'});
  const body=req.body||{}; const userPrompt=String(body.prompt||body.promptText||'').trim();
  if(!userPrompt) return res.status(400).json({error:'Prompt required'});
  const task=String(body.task||body.type||'assistant').toLowerCase();
  const baseSystem=String(body.systemInstruction||'आप एक योग्य उस्ताद हैं। सरल, सटीक और संक्षिप्त उत्तर दें।').slice(0,4000);
  const fastTerms=['quick','rapid','quiz','autocomplete','keyword','profile','spelling','translation','flashcard','part1_0','part1_1'];
  const deepTerms=['summary','logic','philosophy','usul','fiqh','hadith','balaghat','mantiq','reference','analysis','report'];
  const mode=fastTerms.some(x=>task.includes(x))?'fast':deepTerms.some(x=>task.includes(x))?'deep':'balanced';
  const system=baseSystem+'\n\nExecution mode: '+mode+'. Tool: '+task+'. Use the requested educational function directly; do not invent unavailable facts.';
  const messages=[{role:'system',content:system},{role:'user',content:userPrompt.slice(0,12000)}];
  const configured=PROVIDERS.filter(p=>process.env[p.key]);
  const priority=mode==='fast'?['groq','cerebras','mistral','sambanova','openrouter']:mode==='deep'?['sambanova','cerebras','mistral','openrouter','groq']:['cerebras','groq','sambanova','mistral','openrouter'];
  const race=priority.map(n=>configured.find(p=>p.name===n)).filter(Boolean).slice(0,3);
  if(!race.length && !GEMINI_KEY) return res.status(503).json({error:'कोई AI provider configured नहीं है।'});
  const timeout=ms=>AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  const attempts=race.map(p=>callProvider(p,messages,timeout(5000)));
  if(GEMINI_KEY) attempts.push(callGemini(messages));
  try { const reply=await Promise.any(attempts); return res.status(200).json({reply,text:reply}); }
  catch(e){
    const rest=configured.slice(3);
    for(const p of rest){try{const reply=await callProvider(p,messages,timeout(6500));return res.status(200).json({reply,text:reply});}catch(_){}}
    return res.status(502).json({error:'AI providers अभी उपलब्ध नहीं हैं।'});
  }
};

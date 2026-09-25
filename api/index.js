import crypto from "crypto";

const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || "https://ula-alif-default-rtdb.firebaseio.com";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_KEY || "";
const GROQ_KEY = process.env.GROQ_KEY || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || "";
const PAYMENT_QR_URL = process.env.PAYMENT_QR_URL || "/payment-qr.png";

const DAILY_LIMITS = { free: 25, plus: 150, pro: 500, ultra: 1000 };
const PLANS = {
  free:  { id:"free",  key:"FREE",  name:"SUHAIL AI FREE",  price:0,  duration:"Free",    dailyMessages:25,   provider:"Google Gemini", model:"gemini-2.5-flash" },
  plus:  { id:"plus",  key:"PLUS",  name:"SUHAIL AI PLUS",  price:10, duration:"30 Days", dailyMessages:150,  provider:"Mistral",       model:"mistral-small-latest" },
  pro:   { id:"pro",   key:"PRO",   name:"SUHAIL AI PRO",   price:25, duration:"30 Days", dailyMessages:500,  provider:"Groq",          model:"openai/gpt-oss-20b" },
  ultra: { id:"ultra", key:"ULTRA", name:"SUHAIL AI ULTRA", price:50, duration:"30 Days", dailyMessages:1000, provider:"Groq",          model:"openai/gpt-oss-120b" }
};

const SYSTEM_RULES = {
  free: `Aapka official naam "SUHAIL AI FREE" hai.
Uddeshya: Madadgaar aur dostana Study wa General Assistant.
Behavior:
1. Har jawab ke shuru me zabardasti Salam dohrane ki zaroorat nahi. Agar user salam kare to moaddab jawab dein, warna seedhe mudde ki baat karein.
2. Maths, Science, English, Hindi, Urdu, Arabic Grammar, Translation, Basic GK, Notes aur Revision me aasan bhasha me madad karein.
3. Aam sawalat, writing, coding aur rozmarrah ki zaroori baaton par bhi helpful rahen.
4. Chhote aur aasan examples dein; fazool lamba bhashan na dein.
5. Ghalat ya man-ghadant jankari na dein; shak ho to uncertainty batayein.
6. Illegal, harmful ya unsafe requests me madad na dein.
7. Apni pehchan sirf "SUHAIL AI FREE" batayein.`,
  plus: `Aapka official naam "SUHAIL AI PLUS" hai.
Uddeshya: Mufassal Talimi Ustaad wa Rehnuma.
Behavior:
1. Har baat me Salam dohrana zaroori nahi.
2. Talim, Nahw, Sarf, Arabic Grammar, Translation, Maths, Science aur academic subjects me tafseeli, structured aur step-by-step rahnumai dein.
3. Headings, bullets, tables, revision notes, MCQs aur exam questions zarurat ke mutabiq banayein.
4. User ki ghaltiyon ki ahtiram ke sath islah karein.
5. Academic ke sath aam maloomat, technical queries aur constructive discussion me bhi madad karein.
6. Fake references ya man-ghadant citations na banayein.
7. Illegal, harmful ya unsafe requests me madad na dein.
8. Apni pehchan sirf "SUHAIL AI PLUS" batayein.`,
  pro: `Aapka official naam "SUHAIL AI PRO" hai.
Uddeshya: Aala Talimi aur Tajziyati Muawin.
Behavior:
1. Har sandesh me Salam dohrana lazmi nahi.
2. Complex academic, scientific, mathematical aur Nahw/Sarf sawalat ko logical tareeqe se break karke solve karein.
3. Pehle core concept spasht karein, phir gehri structured explanation dein.
4. Advanced writing, technology, reasoning aur serious constructive topics par bhi madad karein.
5. Fake reference, man-ghadant citation ya bina sanad baat ko fact ke taur par pesh na karein.
6. Illegal, harmful ya unsafe requests me madad na dein.
7. Apni pehchan sirf "SUHAIL AI PRO" batayein.`,
  ultra: `Aapka official naam "SUHAIL AI ULTRA" hai.
Uddeshya: Markazi Ilmi Tehqeeq aur Flagship Academic Assistant.
Behavior:
1. Har jawab me Salam dohrana zaroori nahi.
2. Advanced Mathematics, Science, Dars-e-Nizami, Nahw, Sarf, Arabic Adab, Translation aur academic research me maximum available capability ka istemal karein.
3. Kathin mubahis ko: 1. Ta'reef 2. Buniyadi Usool 3. Tafseeli Wazahat 4. Misaalein 5. Amli Istifada 6. Aham Nukaat ke tartib se pesh karein.
4. Complex problems ko multi-stage logical reasoning ke sath hal karein.
5. Fake citations bilkul na banayein.
6. Illegal, harmful ya unsafe requests me madad na dein.
7. Apni pehchan sirf "SUHAIL AI ULTRA" batayein.`
};

const cleanPhone = v => String(v || "").replace(/\D/g, "").slice(-10);
const normalizePlan = v => { const p=String(v||"free").toLowerCase().trim(); return p==="plus"||p==="monthly"?"plus":p==="pro"?"pro":p==="ultra"||p==="allama"||p==="yearly"?"ultra":"free"; };
const hashPassword = p => crypto.createHash("sha256").update(String(p).trim()).digest("hex");
const safeUser = u => { if(!u)return null; const x={...u}; delete x.password; delete x.passwordHash; return x; };
const publicPlan = id => { const p=PLANS[normalizePlan(id)]||PLANS.free; return {...p}; };
const today = () => new Date().toISOString().slice(0,10);
const conversationId = () => `chat_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
const requestId = () => `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
const titleFrom = s => { const x=String(s||"").replace(/\s+/g," ").trim(); return x ? (x.length>55?x.slice(0,55)+"…":x) : "New chat"; };

function b64(v){return Buffer.from(v).toString("base64url");}
function tokenFor(phone){
  if(!SESSION_SECRET)return null;
  const body=b64(JSON.stringify({phone,iat:Date.now()}));
  const sig=crypto.createHmac("sha256",SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token){
  if(!SESSION_SECRET||!token)return null;
  const [body,sig]=String(token).split("."); if(!body||!sig)return null;
  const expected=crypto.createHmac("sha256",SESSION_SECRET).update(body).digest("base64url");
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
  try{const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8")); if(!p.phone||Date.now()-Number(p.iat||0)>30*86400000)return null; return p;}catch{return null;}
}
function bearer(req){const h=req.headers?.authorization||"";return h.startsWith("Bearer ")?h.slice(7).trim():"";}

async function dbGet(path){try{const r=await fetch(`${FIREBASE_DB_URL}/${path}.json`);if(!r.ok)return null;return await r.json();}catch{return null;}}
async function dbPut(path,data){const r=await fetch(`${FIREBASE_DB_URL}/${path}.json`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok)throw new Error(`Firebase PUT failed: ${r.status}`);return r.json();}
async function dbPatch(path,data){const r=await fetch(`${FIREBASE_DB_URL}/${path}.json`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok)throw new Error(`Firebase PATCH failed: ${r.status}`);return r.json();}

async function requireUser(req){
  const session=verifyToken(bearer(req));
  if(!session?.phone){const e=new Error("आपका session समाप्त हो गया है। दोबारा login करें।");e.code=401;throw e;}
  const user=await dbGet(`users/${session.phone}`);
  if(!user){const e=new Error("यूज़र नहीं मिला। दोबारा login करें।");e.code=401;throw e;}
  if(user.status==="blocked"){const e=new Error("आपका account Blocked है। Admin से संपर्क करें।");e.code=403;throw e;}
  return {phone:session.phone,user};
}
function buildPrompt(message,history){
  const h=Array.isArray(history)?history.filter(m=>m&&(m.role==="user"||m.role==="assistant")&&typeof m.content==="string").slice(-20).map(m=>`${m.role==="user"?"User":"Assistant"}: ${m.content}`).join("\n"):"";
  return h?`Conversation context:\n${h}\n\nLatest user message:\n${message}\n\nAnswer the latest user message while using relevant context.`:String(message);
}

async function callGemini(prompt,system){
  if(!GEMINI_KEY)return null;
  try{
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.35}})});
    const d=await r.json();
    const text=d?.candidates?.[0]?.content?.parts?.map(x=>x?.text||"").join("").trim();
    if(r.ok&&text)return text;
    console.error("Gemini error:",d);
  }catch(e){console.error("Gemini request failed:",e);}
  return null;
}
async function callMistral(prompt,system){
  if(!MISTRAL_KEY)return null;
  try{
    const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${MISTRAL_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"mistral-small-latest",messages:[{role:"system",content:system},{role:"user",content:prompt}],temperature:.35})});
    const d=await r.json(); if(r.ok&&d?.choices?.[0]?.message?.content)return d.choices[0].message.content; console.error("Mistral error:",d);
  }catch(e){console.error("Mistral request failed:",e);} return null;
}
async function callGroq(model,prompt,system){
  if(!GROQ_KEY)return null;
  try{
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${GROQ_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:prompt}],temperature:.35})});
    const d=await r.json(); if(r.ok&&d?.choices?.[0]?.message?.content)return d.choices[0].message.content; console.error(`Groq ${model} error:`,d);
  }catch(e){console.error(`Groq ${model} failed:`,e);} return null;
}
async function dispatch(plan,prompt){
  const p=normalizePlan(plan),system=SYSTEM_RULES[p]||SYSTEM_RULES.free;
  let reply=null,name="SUHAIL AI FREE";
  if(p==="ultra"){name="SUHAIL AI ULTRA";reply=await callGroq("openai/gpt-oss-120b",prompt,system);}
  else if(p==="pro"){name="SUHAIL AI PRO";reply=await callGroq("openai/gpt-oss-20b",prompt,system);}
  else if(p==="plus"){name="SUHAIL AI PLUS";reply=await callMistral(prompt,system);}
  else {name="SUHAIL AI FREE";reply=await callGemini(prompt,system);}
  if(reply)return {name,reply};
  const e=new Error(`${name} service is samay vyast hai. Kripya kuch der baad punah prayas karein.`);e.code=500;throw e;
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
  res.setHeader("Content-Type","application/json; charset=utf-8");
  if(req.method==="OPTIONS")return res.status(200).end();
  const {searchParams}=new URL(req.url,`http://${req.headers.host||"localhost"}`);
  const raw=req.query?.action||searchParams.get("action")||"";
  const action=raw||String(req.url||"").split("/api/")[1]?.split("?")[0]||"";
  try{
    if(action==="config")return res.status(200).json({success:true,payment:{qrUrl:PAYMENT_QR_URL},plans:Object.values(PLANS).map(publicPlan)});
    if(action==="plans")return res.status(200).json({success:true,plans:Object.values(PLANS).map(publicPlan)});

    if(action==="auth"&&req.method==="POST"){
      const b=req.body||{},name=String(b.name||"").trim(),roll=String(b.roll||"").replace(/\D/g,""),phone=cleanPhone(b.phone),password=String(b.password||"");
      if(!/^\d{4}$/.test(roll))return res.status(400).json({success:false,error:"INVALID_ROLL"});
      if(!/^[6-9]\d{9}$/.test(phone))return res.status(400).json({success:false,error:"INVALID_PHONE"});
      if(!name||name.length<2)return res.status(400).json({success:false,error:"INVALID_NAME"});
      if(password.length<6||password.length>128)return res.status(400).json({success:false,error:"INVALID_PASSWORD"});
      if(!SESSION_SECRET)return res.status(500).json({success:false,error:"SESSION_SECRET Vercel Environment Variable set nahi hai."});
      const existing=await dbGet(`users/${phone}`);
      if(!existing){
        const user={phone,name,roll,passwordHash:hashPassword(password),role:"student",plan:"free",planExpiry:null,totalQuestions:0,dailyCount:0,lastQuestionDate:"",lastActive:Date.now(),createdAt:Date.now(),status:"active"};
        await dbPut(`users/${phone}`,user);
        return res.status(200).json({success:true,isNew:true,token:tokenFor(phone),user:safeUser(user),plan:publicPlan("free")});
      }
      if(String(existing.roll||"")!==roll)return res.status(409).json({success:false,error:"IDENTITY_MISMATCH"});
      const match=existing.passwordHash?existing.passwordHash===hashPassword(password):String(existing.password||"").trim()===password.trim();
      if(!match)return res.status(401).json({success:false,error:"INVALID_CREDENTIALS"});
      let plan=normalizePlan(existing.plan),updates={lastActive:Date.now(),plan};
      if(!existing.passwordHash)updates.passwordHash=hashPassword(password);
      if(existing.role!=="admin"&&existing.planExpiry&&Date.now()>Number(existing.planExpiry)){plan="free";updates.plan="free";updates.planExpiry=null;}
      await dbPatch(`users/${phone}`,updates); const user={...existing,...updates};
      return res.status(200).json({success:true,token:tokenFor(phone),user:safeUser(user),plan:publicPlan(plan)});
    }

    if(action==="me"||action==="get_profile"){
      const {phone,user}=await requireUser(req);let plan=normalizePlan(user.plan);
      if(user.role!=="admin"&&user.planExpiry&&Date.now()>Number(user.planExpiry)){plan="free";await dbPatch(`users/${phone}`,{plan:"free",planExpiry:null});user.plan="free";user.planExpiry=null;}
      return res.status(200).json({success:true,user:safeUser({...user,id:phone}),plan:publicPlan(plan)});
    }

    if(action==="conversations"){
      const {phone}=await requireUser(req);
      if(req.method==="GET"){
        const root=await dbGet(`conversations/${phone}`)||{};
        const conversations=Object.entries(root).map(([id,d])=>({id,title:d?.title||"New chat",updatedAt:d?.updatedAt||d?.createdAt||0})).sort((a,b)=>b.updatedAt-a.updatedAt);
        return res.status(200).json({success:true,conversations});
      }
      if(req.method==="POST"){
        const id=String(req.body?.id||"").trim(); if(!id)return res.status(400).json({success:false,error:"Conversation ID required."});
        const c=await dbGet(`conversations/${phone}/${id}`); if(!c)return res.status(404).json({success:false,error:"Conversation not found."});
        return res.status(200).json({success:true,conversationId:id,messages:Array.isArray(c.messages)?c.messages:[]});
      }
    }

    if(action==="ai"&&req.method==="POST"){
      const {phone,user}=await requireUser(req); const message=String(req.body?.message??req.body?.prompt??"").trim();
      if(!message)return res.status(400).json({success:false,error:"सवाल खाली नहीं हो सकता।"});
      let plan=normalizePlan(user.plan);
      if(user.role!=="admin"&&user.planExpiry&&Date.now()>Number(user.planExpiry)){plan="free";await dbPatch(`users/${phone}`,{plan:"free",planExpiry:null});}
      const day=today(),count=user.lastQuestionDate===day?Number(user.dailyCount||0):0,limit=user.role==="admin"?Number.MAX_SAFE_INTEGER:DAILY_LIMITS[plan];
      if(count>=limit)return res.status(429).json({success:false,error:`आज की message limit समाप्त हो गई है (${count}/${limit}). कल दोबारा प्रयास करें या plan upgrade करें।`});
      const id=String(req.body?.conversationId||"").trim()||conversationId(),history=Array.isArray(req.body?.history)?req.body.history:[];
      const result=await dispatch(plan,buildPrompt(message,history)); const old=await dbGet(`conversations/${phone}/${id}`)||{},messages=Array.isArray(old.messages)?[...old.messages]:[];
      const last=messages[messages.length-1]; if(!last||last.role!=="user"||last.content!==message)messages.push({role:"user",content:message,createdAt:Date.now()});
      messages.push({role:"assistant",content:result.reply,createdAt:Date.now(),aiName:result.name}); const now=Date.now();
      await dbPut(`conversations/${phone}/${id}`,{id,title:old.title||titleFrom(message),createdAt:old.createdAt||now,updatedAt:now,messages});
      await dbPatch(`users/${phone}`,user.role==="admin"?{totalQuestions:Number(user.totalQuestions||0)+1,lastActive:now,plan:"ultra"}:{totalQuestions:Number(user.totalQuestions||0)+1,dailyCount:count+1,lastQuestionDate:day,lastActive:now,plan});
      return res.status(200).json({success:true,reply:result.reply,aiName:result.name,plan:publicPlan(plan),conversationId:id});
    }

    if(action==="payment"&&req.method==="POST"){
      const {phone}=await requireUser(req); const plan=normalizePlan(req.body?.plan),utr=String(req.body?.utr||"").trim();
      if(plan==="free")return res.status(400).json({success:false,error:"Free plan ke liye payment required nahi hai."});
      if(utr.length<6||utr.length>100)return res.status(400).json({success:false,error:"Valid UTR / Transaction Reference दर्ज करें।"});
      const amounts={plus:10,pro:25,ultra:50},id=requestId();
      await dbPut(`payment_requests/${id}`,{requestId:id,phone,plan,amount:amounts[plan],utr,status:"pending",createdAt:Date.now()});
      return res.status(200).json({success:true,requestId:id,message:"Payment request दर्ज हो गई है। Admin verification के बाद plan activate होगा।"});
    }

    if(action==="admin"&&req.method==="POST"){
      if(!ADMIN_SECRET)return res.status(500).json({success:false,error:"ADMIN_SECRET configured नहीं है।"});
      const b=req.body||{}; if(b.pass!==ADMIN_SECRET)return res.status(401).json({success:false,error:"गलत एडमिन पासवर्ड।"});
      if(b.cmd==="get_requests")return res.status(200).json({success:true,requests:await dbGet("payment_requests")||{}});
      if(b.cmd==="approve_request"){
        const id=String(b.requestId||""),request=await dbGet(`payment_requests/${id}`); if(!request)return res.status(404).json({success:false,error:"Payment request नहीं मिली।"});
        const plan=normalizePlan(request.plan),phone=cleanPhone(request.phone),expiry=Date.now()+30*86400000;
        await dbPatch(`payment_requests/${id}`,{status:"approved",approvedAt:Date.now()}); await dbPatch(`users/${phone}`,{plan,planExpiry:expiry,lastActive:Date.now()});
        return res.status(200).json({success:true,message:`${plan.toUpperCase()} plan 30 दिनों के लिए activate हो गया।`});
      }
      if(b.cmd==="reject_request"){const id=String(b.requestId||"");await dbPatch(`payment_requests/${id}`,{status:"rejected",rejectedAt:Date.now()});return res.status(200).json({success:true,message:"Payment request reject कर दी गई।"});}
      return res.status(400).json({success:false,error:"Invalid admin command."});
    }
    return res.status(404).json({success:false,error:"अमान्य API action."});
  }catch(err){
    console.error("SUHAIL AI API error:",err);
    const status=Number(err?.code)>=400&&Number(err?.code)<600?Number(err.code):500;
    return res.status(status).json({success:false,error:err?.userMsg||err?.message||"सर्वर त्रुटि",code:status});
  }
}

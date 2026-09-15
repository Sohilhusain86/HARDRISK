module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST method required'});
  try{
    const {title='जमात ऊला अलिफ़',message=''}=req.body||{};
    if(!message) return res.status(400).json({error:'message required'});
    const appId=process.env.ONESIGNAL_APP_ID, key=process.env.ONESIGNAL_REST_API_KEY;
    if(!appId||!key) return res.status(503).json({error:'OneSignal configuration missing'});
    const r=await fetch('https://api.onesignal.com/notifications',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Key ${key}`},body:JSON.stringify({app_id:appId,included_segments:['Subscribed Users'],headings:{en:title},contents:{en:message}})});
    const d=await r.json().catch(()=>({})); return res.status(r.status).json(d);
  }catch(e){return res.status(500).json({error:e.message});}
};

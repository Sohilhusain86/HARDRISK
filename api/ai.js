const { verify, getUser } = require('./lib/auth');
const { firebase } = require('./lib/firebase');
const { currentPlan, getPlan } = require('./lib/plans');
const { allowed, refusal } = require('./lib/policy');
const { answer } = require('./lib/ai');
const { json, method, body, error } = require('./lib/http');

module.exports = async (req,res)=>{
  try {
    method(req,'POST');
    const claims=verify(req); const user=await getUser(claims.sub); const planKey=currentPlan(user); const plan=getPlan(user);
    const {message,conversationId,history=[]}=body(req);
    if (typeof message!=='string' || message.trim().length>plan.maxInput) throw new Error('INVALID_INPUT');
    const policy=allowed(message); if (!policy.ok) return json(res,200,{ok:true,blocked:true,reply:refusal});
    const day=new Date().toISOString().slice(0,10);
    const usageRef=firebase().ref(`usage/${user.id}/${day}/messages`);
    const tx=await usageRef.transaction(v=>(Number(v)||0)+1);
    if (!tx.committed) throw new Error('USAGE_UPDATE_FAILED');
    const count=Number(tx.snapshot.val());
    if (count>plan.dailyMessages) { await usageRef.set(count-1); return json(res,429,{ok:false,error:'DAILY_LIMIT',limit:plan.dailyMessages}); }
    const cleanHistory=Array.isArray(history)?history.filter(x=>x&&typeof x.content==='string').slice(-12):[];
    const reply=await answer(planKey,cleanHistory,message.trim());
    const cid=conversationId || firebase().ref(`conversations/${user.id}`).push().key;
    const base=`conversations/${user.id}/${cid}/messages`;
    const ref=firebase().ref(base);
    await ref.push({role:'user',content:message.trim(),createdAt:Date.now()});
    await ref.push({role:'assistant',content:reply,createdAt:Date.now(),plan:planKey});
    await firebase().ref(`conversations/${user.id}/${cid}/meta`).update({title:message.trim().slice(0,60),updatedAt:Date.now()});
    return json(res,200,{ok:true,reply,conversationId:cid,plan:planKey,usage:{count,limit:plan.dailyMessages}});
  } catch(e) { return error(res,e); }
};

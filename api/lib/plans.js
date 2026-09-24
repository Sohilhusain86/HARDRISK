const PLANS = {
  FREE: { key:'FREE', name:'SUHAIL AI FREE', price:0, days:0, dailyMessages:25, maxInput:5000, maxOutput:1800 },
  PLUS: { key:'PLUS', name:'SUHAIL AI PLUS', price:10, days:30, dailyMessages:150, maxInput:12000, maxOutput:3500 },
  PRO: { key:'PRO', name:'SUHAIL AI PRO', price:50, days:30, dailyMessages:300, maxInput:20000, maxOutput:6000 }
};
function currentPlan(user) {
  if (user.plan && user.plan !== 'FREE' && user.activeUntil && Number(user.activeUntil) > Date.now()) return user.plan;
  return 'FREE';
}
function getPlan(user) { return PLANS[currentPlan(user)]; }
module.exports={PLANS,currentPlan,getPlan};

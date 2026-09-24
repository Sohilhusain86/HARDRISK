const {PLANS}=require('./lib/plans'); const {json,method,error}=require('./lib/http');
module.exports=async(req,res)=>{try{method(req,'GET');return json(res,200,{ok:true,plans:Object.values(PLANS).map(p=>({...p}))})}catch(e){return error(res,e)}};

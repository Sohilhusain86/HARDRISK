module.exports = async function(req,res){
  if(req.method !== 'GET') return res.status(405).json({error:'GET method required'});
  return res.status(200).json({ok:true,status:'healthy',service:'jamat-ula-alif',time:new Date().toISOString(),node:process.version});
};

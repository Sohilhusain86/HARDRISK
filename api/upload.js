module.exports = async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST method required'});
  try{
    const {file,resourceType='auto'}=req.body||{};
    if(!file || typeof file!=='string') return res.status(400).json({error:'file required'});
    const cloud=process.env.CLOUDINARY_CLOUD_NAME; const preset=process.env.CLOUDINARY_UPLOAD_PRESET;
    if(!cloud||!preset) return res.status(503).json({error:'Cloudinary server configuration missing'});
    const form=new FormData(); form.append('file',file); form.append('upload_preset',preset);
    const type=['image','video','raw','auto'].includes(resourceType)?resourceType:'auto';
    const r=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${type}/upload`,{method:'POST',body:form});
    const d=await r.json(); if(!r.ok) return res.status(r.status).json({error:d.error?.message||'Cloudinary upload failed'});
    return res.status(200).json({secure_url:d.secure_url,public_id:d.public_id,resource_type:d.resource_type});
  }catch(e){return res.status(500).json({error:e.message});} 
};

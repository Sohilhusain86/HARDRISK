const {json,method,error}=require('./lib/http');
module.exports=async(req,res)=>{try{method(req,'GET');return json(res,200,{ok:true,appName:process.env.APP_NAME||'SUHAIL AI',payment:{upiId:process.env.PAYMENT_UPI_ID||'',qrUrl:process.env.PAYMENT_QR_URL||'/payment-qr.png',name:process.env.PAYMENT_NAME||'SUHAIL AI'},support:process.env.ADMIN_EMAIL_PUBLIC||''})}catch(e){return error(res,e)}};

'use strict';
const crypto = require('node:crypto');

// Server-side only. Do not move this password into index.html or client JavaScript.
const OWNER_PASSWORD = 'RfWC_N8moF%@M6pq$_2B7H';
// Derive the session signing key server-side so a separate Vercel env var is not required.
const SESSION_SECRET = crypto.createHash('sha256').update('SuhailAI Super Admin session:' + OWNER_PASSWORD).digest('hex');
const COOKIE = 'suhail_sa_session';
const SESSION_SECONDS = 10 * 60;
const attempts = new Map();

function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}
function safeEqual(a,b) { const x=Buffer.from(String(a)); const y=Buffer.from(String(b)); return x.length===y.length && crypto.timingSafeEqual(x,y); }
function parseCookies(h='') { const out={}; for (const part of h.split(';')) { const i=part.indexOf('='); if(i>0) { try { out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim()); } catch {} } } return out; }
function sign(payload) { const body=Buffer.from(JSON.stringify(payload)).toString('base64url'); const sig=crypto.createHmac('sha256',SESSION_SECRET).update(body).digest('base64url'); return body+'.'+sig; }
function verify(token) {
  if(!token || typeof token!=='string' || token.length>4096) return null;
  const parts=token.split('.'); if(parts.length!==2) return null;
  const sig=crypto.createHmac('sha256',SESSION_SECRET).update(parts[0]).digest('base64url');
  if(!safeEqual(parts[1],sig)) return null;
  try { const p=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8')); return p && p.role==='owner' && Number.isFinite(p.exp) && p.exp>Math.floor(Date.now()/1000) ? p : null; } catch { return null; }
}
function cookie(value,maxAge,secure) { return `${COOKIE}=${encodeURIComponent(value)}; Path=/api/super-admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`; }
function sameOrigin(req) {
  const origin=req.headers.origin; if(!origin) return true;
  const host=req.headers['x-forwarded-host']||req.headers.host; if(!host) return false;
  try { return new URL(origin).host.toLowerCase()===String(host).toLowerCase(); } catch { return false; }
}
function body(req) {
  if(req.body && typeof req.body==='object') return Promise.resolve(req.body);
  return new Promise((resolve,reject)=>{ let raw=''; req.on('data',chunk=>{ raw+=chunk; if(raw.length>8192) reject(new Error('large')); }); req.on('end',()=>{ try { resolve(raw?JSON.parse(raw):{}); } catch { reject(new Error('json')); } }); req.on('error',reject); });
}
function limited(key) { const now=Date.now(); let a=attempts.get(key)||{n:0,t:now}; if(now-a.t>15*60*1000) a={n:0,t:now}; a.n++; attempts.set(key,a); return a.n>8; }

module.exports = async function handler(req,res) {
  const url = new URL(req.url,'http://local');
  const action = String((req.query&&req.query.action)||url.searchParams.get('action')||'');
  const secure = process.env.NODE_ENV==='production' || String(req.headers['x-forwarded-proto']||'').includes('https');
  if(!sameOrigin(req)) return send(res,403,{ok:false,error:'Cross-origin request denied.'});

  if(action==='super_admin_auth') {
    if(req.method!=='POST') return send(res,405,{ok:false,error:'Method not allowed.'},{Allow:'POST'});
    const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
    if(limited(ip)) return send(res,429,{ok:false,error:'Too many attempts. Try again later.'});
    let data; try { data=await body(req); } catch { return send(res,400,{ok:false,error:'Invalid request body.'}); }
    const supplied=typeof data.password==='string'?data.password:'';
    if(!supplied || !safeEqual(supplied,OWNER_PASSWORD)) return send(res,401,{ok:false,error:'Owner verification failed.'});
    const now=Math.floor(Date.now()/1000);
    const payload={role:'owner',permissions:['super_admin:read','super_admin:manage'],iat:now,exp:now+SESSION_SECONDS,nonce:crypto.randomBytes(16).toString('hex')};
    return send(res,200,{ok:true,role:'owner',permissions:payload.permissions,expiresAt:payload.exp*1000},{'Set-Cookie':cookie(sign(payload),SESSION_SECONDS,secure)});
  }
  const session=verify(parseCookies(req.headers.cookie||'')[COOKIE]);
  if(action==='super_admin_session') {
    if(req.method!=='GET') return send(res,405,{ok:false,error:'Method not allowed.'},{Allow:'GET'});
    if(!session) return send(res,401,{ok:false,error:'Valid Super Admin session required.'});
    return send(res,200,{ok:true,role:session.role,permissions:session.permissions,expiresAt:session.exp*1000});
  }
  if(action==='super_admin_logout') {
    if(req.method!=='POST') return send(res,405,{ok:false,error:'Method not allowed.'},{Allow:'POST'});
    return send(res,200,{ok:true},{'Set-Cookie':cookie('',0,secure)});
  }
  if(!session) return send(res,401,{ok:false,error:'Valid Super Admin session required.'});
  if(action==='super_admin_dashboard' && req.method==='GET') return send(res,503,{ok:false,connected:false,error:'Dashboard data provider is not configured; no live metrics are available.'});
  return send(res,501,{ok:false,error:'This administrative action is not implemented on the server yet.'});
};
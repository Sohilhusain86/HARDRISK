const crypto = require('crypto');

const COOKIE = 'suhail_sa_session';
const TTL_SECONDS = 10 * 60;
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function sign(value, secret) { return crypto.createHmac('sha256', secret).update(value).digest('base64url'); }
function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach(part => { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); });
  return out;
}
function makeCookie(token, maxAge) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
function readSession(req, secret) {
  const token = parseCookies(req.headers.cookie || '')[COOKIE];
  if (!token) return null;
  const parts = token.split('.'); if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!safeEqual(signature, sign(payload, secret))) return null;
  let data; try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (_) { return null; }
  if (!data || data.role !== 'owner' || !Number.isFinite(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return null;
  return data;
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const secret = process.env.SUPER_ADMIN_SESSION_SECRET;
  if (!password || password.length < 16 || !secret || secret.length < 32) return res.status(503).json({ ok: false, error: 'Vercel mein SUPER_ADMIN_PASSWORD (16+ chars) aur SUPER_ADMIN_SESSION_SECRET (32+ chars) set karke redeploy karein.' });
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action') || '';
  if (req.method === 'POST' && action === 'super_admin_auth') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!safeEqual(body.password, password)) return res.status(401).json({ ok: false, error: 'Password ghalat hai.' });
    const now = Math.floor(Date.now() / 1000);
    const payload = b64url(JSON.stringify({ role: 'owner', iat: now, exp: now + TTL_SECONDS, nonce: crypto.randomBytes(16).toString('hex') }));
    const token = `${payload}.${sign(payload, secret)}`;
    res.setHeader('Set-Cookie', makeCookie(token, TTL_SECONDS));
    return res.status(200).json({ ok: true, role: 'owner', expiresAt: (now + TTL_SECONDS) * 1000 });
  }
  if (req.method === 'GET' && action === 'super_admin_session') {
    const session = readSession(req, secret);
    if (!session) return res.status(401).json({ ok: false, error: 'Session expired or not verified.' });
    return res.status(200).json({ ok: true, role: 'owner', expiresAt: session.exp * 1000 });
  }
  if (req.method === 'POST' && action === 'super_admin_logout') {
    res.setHeader('Set-Cookie', makeCookie('', 0));
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ ok: false, error: 'Unknown action.' });
};
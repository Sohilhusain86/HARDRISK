const crypto = require('node:crypto');

const COOKIE = 'suhail_sa_session';
const SESSION_SECONDS = 10 * 60;
const MAX_BODY_BYTES = 8 * 1024;
const attempts = new Map(); // Best-effort per-instance limiter only; use Redis/KV for production.

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Vary', 'Cookie');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}
function parseCookies(header = '') {
  const out = {};
  for (const item of header.split(';')) {
    const i = item.indexOf('=');
    if (i > 0) out[item.slice(0, i).trim()] = decodeURIComponent(item.slice(i + 1).trim());
  }
  return out;
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(token, secret) {
  if (!token || typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.'); if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  if (!safeEqual(parts[1], expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!p || p.role !== 'owner' || !Number.isFinite(p.exp) || p.exp <= Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch { return null; }
}
function cookieHeader(value, maxAge, secure) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
function requestIsSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // Native same-origin form/fetch clients may omit Origin.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;
  try { return new URL(origin).host.toLowerCase() === String(host).toLowerCase(); } catch { return false; }
}
function getBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', chunk => { data += chunk; if (data.length > MAX_BODY_BYTES) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function isRateLimited(key) {
  const now = Date.now(); const prior = attempts.get(key) || { count: 0, start: now };
  if (now - prior.start > 15 * 60 * 1000) { prior.count = 0; prior.start = now; }
  prior.count += 1; attempts.set(key, prior);
  return prior.count > 8;
}

module.exports = async function handler(req, res) {
  const action = String((req.query && req.query.action) || new URL(req.url, 'http://local').searchParams.get('action') || '');
  const secure = process.env.NODE_ENV === 'production' || String(req.headers['x-forwarded-proto'] || '').includes('https');
  const secret = process.env.SUPER_ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return json(res, 503, { ok: false, error: 'Super Admin backend is not configured.' });
  if (!requestIsSameOrigin(req)) return json(res, 403, { ok: false, error: 'Cross-origin request denied.' });

  if (action === 'super_admin_auth') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) return json(res, 429, { ok: false, error: 'Too many attempts. Try again later.' });
    let body;
    try { body = await getBody(req); } catch { return json(res, 400, { ok: false, error: 'Invalid request body.' }); }
    const supplied = typeof body.password === 'string' ? body.password : '';
    const expected = process.env.SUPER_ADMIN_PASSWORD;
    if (!expected || expected.length < 16 || !supplied || !safeEqual(supplied, expected)) {
      return json(res, 401, { ok: false, error: 'Owner verification failed.' });
    }
    const now = Math.floor(Date.now() / 1000);
    const payload = { role: 'owner', permissions: ['super_admin:read', 'super_admin:manage'], iat: now, exp: now + SESSION_SECONDS, nonce: crypto.randomBytes(16).toString('hex') };
    const token = sign(payload, secret);
    return json(res, 200, { ok: true, role: 'owner', permissions: payload.permissions, expiresAt: payload.exp * 1000 }, { 'Set-Cookie': cookieHeader(token, SESSION_SECONDS, secure) });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const session = verify(cookies[COOKIE], secret);
  if (action === 'super_admin_session') {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET' });
    if (!session) return json(res, 401, { ok: false, error: 'Valid Super Admin session required.' });
    return json(res, 200, { ok: true, role: session.role, permissions: session.permissions, expiresAt: session.exp * 1000 });
  }
  if (action === 'super_admin_logout') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0, secure) });
  }
  if (!session) return json(res, 401, { ok: false, error: 'Valid Super Admin session required.' });

  // Fail closed until real data providers are explicitly wired in. Never return fabricated metrics.
  if (action === 'super_admin_dashboard') {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET' });
    return json(res, 503, { ok: false, connected: false, error: 'Dashboard data provider is not configured; no live metrics are available.' });
  }
  return json(res, 501, { ok: false, error: 'This administrative action is not implemented on the server yet.' });
};
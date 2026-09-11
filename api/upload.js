import crypto from 'node:crypto';

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 12_000_000) reject(new Error('Upload request too large')); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST method required' });
  try {
    const body = await readBody(req);
    const file = String(body.file || '');
    const resourceType = ['image', 'video', 'raw', 'auto'].includes(body.resourceType) ? body.resourceType : 'auto';
    if (!file.startsWith('data:')) return send(res, 400, { error: 'Valid data URL required' });

    const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'xgkhockl';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const preset = String(body.preset || process.env.CLOUDINARY_UPLOAD_PRESET || 'jamia_dp');
    const timestamp = Math.floor(Date.now() / 1000);

    const form = new FormData();
    form.append('file', file);

    if (apiKey && apiSecret) {
      const signature = crypto.createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
    } else {
      form.append('upload_preset', preset);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`;
    const r = await fetch(endpoint, { method: 'POST', body: form });
    const text = await r.text(); let data = {};
    try { data = JSON.parse(text); } catch {}
    if (!r.ok || !data.secure_url) {
      return send(res, 502, { error: data?.error?.message || `Cloudinary HTTP ${r.status}` });
    }
    return send(res, 200, { secure_url: data.secure_url, public_id: data.public_id || null, resource_type: data.resource_type || resourceType });
  } catch (e) {
    return send(res, 400, { error: e?.message || 'Upload failed' });
  }
}

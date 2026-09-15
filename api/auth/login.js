const admin = require('firebase-admin');

function init() {
  if (admin.apps.length) return admin.app();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) throw new Error('Firebase Admin environment variables missing');
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ula-alif',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://ula-alif-default-rtdb.firebaseio.com'
  });
}

function mobileOf(phone) { return String(phone || '').replace(/[^0-9]/g, '').slice(-10); }
function cleanName(name) { return String(name || '').trim().slice(0, 80); }
function adminPass() { return process.env.ADMIN_PASSKEY || 'razavi123'; }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST method required' });
  try {
    const { action = 'verify_otp', name = '', phone = '', roll = '', pass = '', otp = '' } = req.body || {};
    const mobile = mobileOf(phone);
    const clean = cleanName(name);
    if (!clean || mobile.length !== 10) return res.status(400).json({ error: 'नाम और 10 अंकों का मोबाइल नंबर आवश्यक है।' });

    const app = init();
    const db = app.database();
    const userRef = db.ref(`users/${mobile}`);
    const existingSnap = await userRef.once('value');
    const existing = existingSnap.val() || {};
    if (existing.banned === true) return res.status(403).json({ error: 'यह खाता एडमिन द्वारा ब्लॉक किया गया है।' });

    const existingRole = existing.role === 'admin' ? 'admin' : 'student';
    if (existingRole === 'admin' && String(pass) !== adminPass()) {
      return res.status(403).json({ error: 'यह एडमिन अकाउंट है। एडमिन पासवर्ड दर्ज करना आवश्यक है।' });
    }
    if (pass && String(pass) !== adminPass()) {
      return res.status(403).json({ error: 'पासवर्ड गलत है। सामान्य छात्र लॉगिन के लिए पासवर्ड खाली छोड़ें।' });
    }

    if (action === 'restore_session') {
      const role = existingRole;
      const uid = `phone_${mobile}`;
      const token = await admin.auth().createCustomToken(uid, { phone: mobile, role });
      return res.status(200).json({ customToken: token, role, user: existing });
    }

    if (action === 'send_otp') {
      const generated = String(Math.floor(100000 + Math.random() * 900000));
      await db.ref(`otps/${mobile}`).set({ otp: generated, time: Date.now() });
      return res.status(200).json({ ok:true, otp: generated, expiresIn: 600 });
    }

    if (action !== 'verify_otp') return res.status(400).json({ error: 'अमान्य login action.' });
    const otpSnap = await db.ref(`otps/${mobile}`).once('value');
    const otpData = otpSnap.val() || {};
    if (!otpData.otp || String(otpData.otp) !== String(otp) || Date.now() - Number(otpData.time || 0) > 10 * 60 * 1000) {
      return res.status(401).json({ error: 'गलत OTP या समाप्त OTP! कृपया नया OTP प्राप्त करें।' });
    }

    const finalRole = String(pass) === adminPass() ? 'admin' : 'student';
    const finalName = existing.name || clean;
    const finalRoll = existing.roll || String(roll || '').trim().slice(0, 30);
    const user = {
      ...existing,
      name: finalName,
      phone: mobile,
      roll: finalRoll,
      displayName: existing.displayName || (finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName),
      role: finalRole,
      status: 'online',
      lastSeen: Date.now()
    };
    await userRef.set(user);
    await db.ref(`otps/${mobile}`).remove();
    const uid = `phone_${mobile}`;
    const token = await admin.auth().createCustomToken(uid, { phone: mobile, role: finalRole });
    return res.status(200).json({ customToken: token, role: finalRole, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'सर्वर लॉगिन कॉन्फ़िगरेशन में समस्या है।' });
  }
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { firebase } = require('./firebase');

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return process.env.JWT_SECRET;
}
async function hashPassword(password) { return bcrypt.hash(password, 12); }
async function verifyPassword(password, hash) { return bcrypt.compare(password, hash); }

function sign(user) {
  return jwt.sign({ sub: user.id, roll: user.roll, role: user.role || 'student' }, secret(), { expiresIn: '30d' });
}
function verify(req) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) throw new Error('AUTH_REQUIRED');
  return jwt.verify(token, secret());
}
async function getUser(id) {
  const snap = await firebase().ref(`users/${id}`).get();
  if (!snap.exists()) throw new Error('USER_NOT_FOUND');
  return { id, ...snap.val() };
}
function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    roll: user.roll,
    phone: user.phone,
    role: user.role || 'student',
    plan: user.plan || 'FREE',
    activeUntil: user.activeUntil || null
  };
}
function normalizeName(v) { return String(v || '').trim().replace(/\s+/g, ' '); }
function normalizeRoll(v) { return String(v || '').trim(); }
function normalizePhone(v) { return String(v || '').replace(/\D/g, ''); }
function validateIdentity({name, roll, phone, password}) {
  name = normalizeName(name); roll = normalizeRoll(roll); phone = normalizePhone(phone); password = String(password || '');
  if (name.length < 2 || name.length > 60) throw new Error('INVALID_NAME');
  if (!/^\d{4}$/.test(roll)) throw new Error('INVALID_ROLL');
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('INVALID_PHONE');
  if (password.length < 6 || password.length > 128) throw new Error('INVALID_PASSWORD');
  return {name, roll, phone, password};
}
async function findByRoll(roll) {
  const idx = await firebase().ref(`rollIndex/${normalizeRoll(roll)}`).get();
  if (!idx.exists()) return null;
  return getUser(idx.val());
}
async function createStudent({name, roll, phone, password}) {
  const identity = validateIdentity({name, roll, phone, password});
  const db = firebase();
  const idx = db.ref(`rollIndex/${identity.roll}`);
  if ((await idx.get()).exists()) throw new Error('ROLL_EXISTS');
  const id = db.ref('users').push().key;
  const user = {
    name: identity.name,
    roll: identity.roll,
    phone: identity.phone,
    passwordHash: await hashPassword(identity.password),
    role: 'student',
    plan: 'FREE',
    activeUntil: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.ref(`users/${id}`).set(user);
  await idx.set(id);
  return { id, ...user };
}
module.exports = { sign, verify, getUser, safeUser, createStudent, findByRoll, validateIdentity, verifyPassword };

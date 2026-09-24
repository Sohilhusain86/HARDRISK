const { createStudent, findByRoll, sign, safeUser, validateIdentity, verifyPassword } = require('./lib/auth');
const { json, method, body, error } = require('./lib/http');

module.exports = async (req, res) => {
  try {
    method(req, 'POST');
    const b = body(req);
    const identity = validateIdentity({ name: b.name, roll: b.roll, phone: b.phone, password: b.password });
    let user = await findByRoll(identity.roll);
    let created = false;

    if (!user) {
      user = await createStudent(identity);
      created = true;
    } else {
      if (user.name.toLowerCase() !== identity.name.toLowerCase() || user.phone !== identity.phone) {
        throw new Error('IDENTITY_MISMATCH');
      }
      if (!user.passwordHash) throw new Error('PASSWORD_NOT_SET');
      const ok = await verifyPassword(identity.password, user.passwordHash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      user.updatedAt = Date.now();
    }

    return json(res, 200, { ok: true, token: sign(user), user: safeUser(user), created });
  } catch (e) {
    return error(res, e);
  }
};

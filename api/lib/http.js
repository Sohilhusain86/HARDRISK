function json(res, status, data) { res.status(status).setHeader('Content-Type','application/json'); return res.end(JSON.stringify(data)); }
function method(req, expected) { if (req.method !== expected) { const e = new Error('METHOD_NOT_ALLOWED'); e.status=405; throw e; } }
function body(req) { return typeof req.body === 'object' && req.body ? req.body : {}; }
function error(res, err) {
  const map = { AUTH_REQUIRED:401, USER_NOT_FOUND:404, EMAIL_EXISTS:409, INVALID_LOGIN:401, INVALID_INPUT:400, FORBIDDEN:403, NOT_FOUND:404, ALREADY_PENDING:409 };
  const status = err.status || map[err.message] || 500;
  return json(res,status,{ok:false,error:status===500?'SERVER_ERROR':err.message});
}
module.exports={json,method,body,error};

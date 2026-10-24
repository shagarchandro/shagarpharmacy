'use strict';
/* সেশন, লক-আউট, রোল-অ্যাক্সেস, কোন কী কে লিখতে পারবে */
const crypto = require('crypto');
const D = require('./db');
const { db, kvJson, nowIso } = D;

const COOKIE = { staff: 'mc_s', ops: 'mc_o' };
const ABS_DEFAULT_H = 12, IDLE_MIN = 120;

function parseCookies(req) { const o = {}; String(req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
function settings() { return kvJson('pharmacy_settings', {}) || {}; }

function createSession(user, req) {
  const tok = crypto.randomBytes(32).toString('hex'), t = Date.now(), h = Math.min(Math.max(+settings().sessionHours || ABS_DEFAULT_H, 1), 72);
  db.prepare('INSERT INTO sessions(sid_hash,user_id,scope,created,last,expires,ip,ua) VALUES(?,?,?,?,?,?,?,?)').run(sha(tok), user.id, user.scope, t, t, t + h * 3600e3, ip(req), String(req.headers['user-agent'] || '').slice(0, 120));
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(t);
  return { tok, maxAge: Math.floor(h * 3600) };
}
const SEC = { on: false };
function cookieHeader(scope, tok, maxAge) { return `${COOKIE[scope]}=${tok}; HttpOnly; SameSite=Strict; Path=/${maxAge ? `; Max-Age=${maxAge}` : ''}${SEC.on ? '; Secure' : ''}`; }
function clearCookie(scope) { return `${COOKIE[scope]}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${SEC.on ? '; Secure' : ''}`; }
function ip(req) { return String(req.socket.remoteAddress || '').replace('::ffff:', ''); }

/* বর্তমান লগইন-করা ইউজার (staff / ops দুটোই থাকতে পারে) */
function who(req) {
  const c = parseCookies(req), out = { staff: null, ops: null }, t = Date.now();
  for (const scope of ['staff', 'ops']) {
    const tok = c[COOKIE[scope]]; if (!tok) continue;
    const s = db.prepare('SELECT s.*, u.ext_id, u.email, u.name, u.role, u.active, u.must_change, u.pin_hash FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.sid_hash=? AND s.scope=?').get(sha(tok), scope);
    if (!s || !s.active || s.expires < t || t - s.last > IDLE_MIN * 60e3) { if (s) db.prepare('DELETE FROM sessions WHERE sid_hash=?').run(s.sid_hash); continue; }
    if (t - s.last > 30e3) db.prepare('UPDATE sessions SET last=? WHERE sid_hash=?').run(t, s.sid_hash);
    out[scope] = { id: s.user_id, ext: s.ext_id, scope, email: s.email, name: s.name, role: s.role, mustChange: !!s.must_change, hasPin: !!s.pin_hash, sid: s.sid_hash };
  }
  return out;
}
function destroy(req, scope) { const tok = parseCookies(req)[COOKIE[scope]]; if (tok) db.prepare('DELETE FROM sessions WHERE sid_hash=?').run(sha(tok)); }
const isOwner = u => u && (u.role === 'admin' || u.role === 'Owner');
const anyOwner = w => isOwner(w.staff) || isOwner(w.ops);
const anyUser = w => w.staff || w.ops;

/* লক-আউট (ইউজার/ইমেইল ও IP ভিত্তিক, সময় দ্বিগুণ হয়) */
function lockState(key) { const r = db.prepare('SELECT * FROM attempts WHERE k=?').get(key); return r && r.until > Date.now() ? Math.ceil((r.until - Date.now()) / 1000) : 0; }
function fail(key, max) {
  const s = settings(), lim = max || Math.min(Math.max(+s.lockMax || 5, 3), 10), base = Math.min(Math.max(+s.lockBase || 30, 10), 600);
  const r = db.prepare('SELECT * FROM attempts WHERE k=?').get(key) || { n: 0 }, n = (r.n || 0) + 1;
  let until = 0; if (n >= lim) { const round = Math.floor(n / lim); until = Date.now() + Math.min(base * Math.pow(2, round - 1), 600) * 1000; }
  db.prepare('INSERT INTO attempts(k,n,until,last) VALUES(?,?,?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n, until=excluded.until, last=excluded.last').run(key, n, until, Date.now());
  return { left: Math.max(lim - (n % lim === 0 ? lim : n % lim), 0), locked: until ? Math.ceil((until - Date.now()) / 1000) : 0 };
}
function clearFail(key) { db.prepare('DELETE FROM attempts WHERE k=?').run(key); }

/* লগইন লগ (সার্ভার-মালিকানাধীন কী) */
function logLogin(entry) { const L = kvJson('pharmacy_loginlog', []); L.push(Object.assign({ at: nowIso() }, entry)); return D.kvSet('pharmacy_loginlog', JSON.stringify(L.slice(-300)), 'server'); }

/* রোল অনুযায়ী পেজ-অ্যাক্সেস (login.html-এর টেবিলের সমান) */
function accessFor(role) {
  if (role === 'admin') return { dashboard: true, medicines: true, customers: true, sales: true, purchases: true, suppliers: true, prescriptions: true, reports: true, settings: true };
  if (role === 'pharmacist') return { dashboard: true, medicines: true, customers: true, sales: true, purchases: false, suppliers: false, prescriptions: true, reports: true, settings: false };
  if (role === 'staff') return { dashboard: true, medicines: { view: true, edit: false, delete: false }, customers: { view: true, edit: false, delete: false }, sales: true, purchases: false, suppliers: false, prescriptions: { view: true, create: false }, reports: false, settings: false };
  const RL = ((kvJson('pharmacy_roles', {}) || {})[role] || {}).level || {}, acc = {};
  ['dashboard', 'medicines', 'customers', 'sales', 'purchases', 'suppliers', 'prescriptions', 'reports', 'settings'].forEach(k => { const lv = RL[k]; acc[k] = lv === 'full' ? true : lv === 'edit' ? { view: true, edit: true, delete: false, create: true } : lv === 'view' ? { view: true, edit: false, delete: false, create: false } : false; });
  acc.dashboard = true; return acc;
}
function publicUser(u) { return u && { id: u.id, ext: u.ext, scope: u.scope, name: u.name, email: u.email, role: u.role, mustChange: u.mustChange, hasPin: u.hasPin, access: u.scope === 'staff' ? accessFor(u.role) : undefined }; }

/* কী-সিঙ্ক নিয়ম */
const NOSYNC = new Set(['pharmacy_creds', 'pharmacy_accounts', 'pharmacy_held', 'pharmacy_alert_snooze']);
const SERVER_OWNED = new Set(['pharmacy_loginlog']);
const ADMIN_ONLY = new Set(['pharmacy_settings', 'pharmacy_roles', 'pharmacy_audit_admin']);
const PURCHASING = new Set(['pharmacy_purchases', 'pharmacy_suppliers', 'pharmacy_supplier_base', 'pharmacy_med_supplier']);
const PURCH_ROLES = new Set(['admin', 'Owner', 'Inventory Manager']);
const isSyncKey = k => /^(pharmacy_[a-z0-9_]{1,60}|mc_db|mc_acc)$/.test(k) && !NOSYNC.has(k);
function canWrite(w, key) {
  if (!isSyncKey(key) || SERVER_OWNED.has(key)) return false;
  if (!anyUser(w)) return false;
  if (anyOwner(w)) return true;
  if (ADMIN_ONLY.has(key) || key === 'mc_acc') return false;
  if (PURCHASING.has(key)) return [w.staff, w.ops].some(u => u && PURCH_ROLES.has(u.role));
  return true;
}
/* মোট ডেটার পাবলিক রূপ — শপ-ভিজিটর যা দেখতে পারে */
function publicDb(full) {
  const f = full || {}, st = Object.assign({}, f.settings || {});
  Object.keys(st).forEach(k => { if (/pin|pass|secret|token|apikey|code$/i.test(k)) delete st[k]; });
  st._nextNo = (f.orders || []).reduce((m, x) => { const n = parseInt(String(x.no).split('-').pop(), 10); return n > m ? n : m; }, 1000) + 1;
  return { v: f.v, products: (f.products || []).map(p => { const c = Object.assign({}, p); delete c.cost; return c; }), batches: (f.batches || []).map(b => ({ id: b.id, pid: b.pid, no: b.no, exp: b.exp, qty: b.qty })),
    orders: [], sales: [], suppliers: [], log: [], users: [], notes: [], expenses: [], purchases: [], coupons: (f.coupons || []).map(c => ({ code: c.code, pct: c.pct, min: c.min, max: c.max, limit: c.limit, expires: c.expires, off: c.off, used: c.used })), settings: st };
}
module.exports = { SEC, COOKIE, parseCookies, createSession, cookieHeader, clearCookie, ip, who, destroy, isOwner, anyOwner, anyUser, lockState, fail, clearFail, logLogin, accessFor, publicUser, isSyncKey, canWrite, publicDb, SERVER_OWNED, NOSYNC, settings, sha };

'use strict';
/* SQLite স্টোর (Node ≥ 22.5 এর বিল্ট-ইন node:sqlite — কোনো npm প্যাকেজ লাগে না) */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const DATA = process.env.PMS_DATA ? path.resolve(process.env.PMS_DATA) : path.join(ROOT, 'data');
fs.mkdirSync(path.join(DATA, 'backups'), { recursive: true });
const FILE = path.join(DATA, 'pharmacy.db');
const db = new DatabaseSync(FILE);
db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ext_id TEXT UNIQUE, scope TEXT NOT NULL, email TEXT, name TEXT NOT NULL, role TEXT NOT NULL,
  pass_hash TEXT NOT NULL, pin_hash TEXT, active INTEGER NOT NULL DEFAULT 1, must_change INTEGER NOT NULL DEFAULT 0, created TEXT, last_login TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(scope, lower(email)) WHERE email IS NOT NULL;
CREATE TABLE IF NOT EXISTS sessions(sid_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, scope TEXT NOT NULL, created INTEGER, last INTEGER, expires INTEGER, ip TEXT, ua TEXT);
CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value TEXT NOT NULL, ver INTEGER NOT NULL, updated TEXT, by TEXT);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, who TEXT, action TEXT, detail TEXT);
CREATE TABLE IF NOT EXISTS attempts(k TEXT PRIMARY KEY, n INTEGER, until INTEGER, last INTEGER);
`);

const q = {
  kvGet: db.prepare('SELECT key,value,ver,updated,by FROM kv WHERE key=?'),
  kvAll: db.prepare('SELECT key,value,ver FROM kv'),
  kvPut: db.prepare('INSERT INTO kv(key,value,ver,updated,by) VALUES(?,?,1,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, ver=kv.ver+1, updated=excluded.updated, by=excluded.by'),
  kvDel: db.prepare('DELETE FROM kv WHERE key=?'),
  audit: db.prepare('INSERT INTO audit(at,who,action,detail) VALUES(?,?,?,?)'),
};
const nowIso = () => new Date().toISOString();
function kvGet(key) { return q.kvGet.get(key) || null; }
function kvSet(key, value, by) { const s = typeof value === 'string' ? value : JSON.stringify(value); q.kvPut.run(key, s, nowIso(), by || ''); return q.kvGet.get(key).ver; }
function kvJson(key, d) { const r = kvGet(key); if (!r) return d; try { return JSON.parse(r.value); } catch (e) { return d; } }
function audit(who, action, detail) { try { q.audit.run(nowIso(), who || '-', action, detail ? String(detail).slice(0, 300) : ''); db.exec("DELETE FROM audit WHERE id < (SELECT MAX(id) FROM audit) - 5000"); } catch (e) { } }
function tx(fn) { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch (x) { } throw e; } }

/* পাসওয়ার্ড: scrypt */
function hashPw(pw) { const salt = crypto.randomBytes(16); const h = crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 }); return 's1$' + salt.toString('hex') + '$' + h.toString('hex'); }
function verifyPw(pw, stored) {
  try { const [t, s, h] = String(stored).split('$'); if (t !== 's1') return false; const x = crypto.scryptSync(String(pw), Buffer.from(s, 'hex'), 32, { N: 16384, r: 8, p: 1 }); const y = Buffer.from(h, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y); } catch (e) { return false; }
}
const COMMON = new Set(['password', 'password1', '12345678', 'admin123', 'admin1234', 'pharm123', 'staff123', 'qwerty123', 'medicare1', 'demo1234', 'iloveyou1', 'abc12345', '123456789', '11111111']);
function pwProblem(pw, ...avoid) {
  pw = String(pw || '');
  if (pw.length < 8) return 'কমপক্ষে ৮ অক্ষর দিন';
  if (pw.length > 100) return 'পাসওয়ার্ড অতিরিক্ত বড়';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'অক্ষর ও সংখ্যা দুটোই দিন';
  if (COMMON.has(pw.toLowerCase())) return 'এটি খুব সাধারণ পাসওয়ার্ড — অন্যটি বেছে নিন';
  for (const a of avoid) if (a && pw.toLowerCase().includes(String(a).toLowerCase().split('@')[0]) && String(a).length >= 4) return 'পাসওয়ার্ডে নাম/ইমেইল রাখবেন না';
  return '';
}

/* প্রথমবার চালালে ডিফল্ট অ্যাকাউন্ট (প্রথম লগইনে পাসওয়ার্ড বদলাতে বাধ্য করা হয়) */
function seedUsers() {
  if (db.prepare('SELECT COUNT(*) c FROM users').get().c) return false;
  const must = process.env.PMS_NO_FORCE_CHANGE ? 0 : 1, t = nowIso();
  const ins = db.prepare('INSERT INTO users(ext_id,scope,email,name,role,pass_hash,must_change,created) VALUES(?,?,?,?,?,?,?,?)');
  [['S1', 'staff', 'admin@medicare.com', 'Admin User', 'admin', 'admin123'], ['S2', 'staff', 'pharmacist@medicare.com', 'John Pharmacist', 'pharmacist', 'pharm123'], ['S3', 'staff', 'staff@medicare.com', 'Staff Member', 'staff', 'staff123'],
   ['U1', 'ops', null, 'Owner Demo', 'Owner', 'demo'], ['U2', 'ops', null, 'Pharmacist Demo', 'Pharmacist', 'demo'], ['U3', 'ops', null, 'Cashier Demo', 'Cashier', 'demo'], ['U4', 'ops', null, 'Inventory Demo', 'Inventory Manager', 'demo'], ['U5', 'ops', null, 'Delivery Demo', 'Delivery Staff', 'demo']]
    .forEach(u => ins.run(u[0], u[1], u[2], u[3], u[4], hashPw(u[5]), must, t));
  audit('system', 'seed', 'default accounts created');
  return true;
}
seedUsers();

module.exports = { db, q, ROOT, DATA, FILE, nowIso, kvGet, kvSet, kvJson, audit, tx, hashPw, verifyPw, pwProblem };

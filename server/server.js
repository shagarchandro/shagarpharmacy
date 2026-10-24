'use strict';
/* MediCare Pharmacy — লোকাল সার্ভার (Node ≥ 22.5, কোনো বাইরের প্যাকেজ নেই)
   চালান:  npm start   →  http://localhost:3000 */
{ const [ma, mi] = process.versions.node.split('.').map(Number); if (ma < 22 || (ma === 22 && mi < 5)) { console.error('\n  ❌ Node.js ' + process.versions.node + ' পুরনো। Node 22.5 বা তার পরের ভার্সন লাগবে (https://nodejs.org থেকে LTS নামান)।\n'); process.exit(1); } }
const http = require('http'), fs = require('fs'), path = require('path');
const D = require('./db'), A = require('./auth'), SHOP = require('./shop');
const { db, kvGet, kvSet, kvJson, audit, nowIso } = D;
const STARTED = Date.now();
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || '127.0.0.1';
const OPS_ROLES = ['Owner', 'Pharmacist', 'Cashier', 'Inventory Manager', 'Delivery Staff'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };

const send = (res, code, obj, extra) => { const b = Buffer.from(JSON.stringify(obj)); res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {})); res.end(b); };
function body(req, max) { return new Promise((ok, no) => { let n = 0; const c = []; req.on('data', d => { n += d.length; if (n > max) { no(Object.assign(new Error('Payload too large'), { code: 413 })); req.destroy(); } else c.push(d); }); req.on('end', () => { try { ok(c.length ? JSON.parse(Buffer.concat(c).toString('utf8')) : {}); } catch (e) { no(Object.assign(new Error('Invalid JSON'), { code: 400 })); } }); req.on('error', no); }); }

/* ---------- SSE ---------- */
const clients = new Set();
function broadcast(key, ver, cid, extra) {
  const msg = 'data: ' + JSON.stringify(Object.assign({ key, ver, cid }, extra || {})) + '\n\n';
  for (const c of clients) { if (c.cid === cid) continue; if (!c.authed && key !== 'mc_db') continue; try { c.res.write(msg); } catch (e) { clients.delete(c); } }
}
setInterval(() => { for (const c of clients) { try { c.res.write(': ping\n\n'); } catch (e) { clients.delete(c); } } }, 25000).unref();

/* ---------- ইউটিলিটি ---------- */
const opsUsers = () => db.prepare("SELECT ext_id id,name,role,active FROM users WHERE scope='ops' ORDER BY id").all().map(u => ({ id: u.id, name: u.name, role: u.role, active: !!u.active }));
function kvOut(key, row, w) {
  let v = row.value;
  if (key === 'mc_db') { try { const d = JSON.parse(v); d.users = opsUsers(); v = JSON.stringify(d); } catch (e) { } }
  return { v, ver: row.ver };
}
function sanitizeDb(valStr, cur, w) {
  let d; try { d = JSON.parse(valStr); } catch (e) { return null; } if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  delete d.users;
  if (cur && !A.anyOwner(w)) { d.settings = cur.settings; d.coupons = cur.coupons; }
  return JSON.stringify(d);
}
const sessionUsers = w => ({ staff: A.publicUser(w.staff), ops: A.publicUser(w.ops) });
const needAdmin = (w, res) => { if (!A.anyOwner(w)) { send(res, 403, { error: 'শুধু Admin/Owner করতে পারবেন' }); return false; } return true; };
const needLogin = (w, res) => { if (!A.anyUser(w)) { send(res, 401, { error: 'লগইন করুন' }); return false; } if ((w.staff && w.staff.mustChange) || (w.ops && w.ops.mustChange && !w.staff)) { send(res, 403, { error: 'আগে পাসওয়ার্ড বদলান', mustChange: true }); return false; } return true; };

/* ---------- ব্যাকআপ ---------- */
function makeBackup(tag) {
  const d = new Date(), p = n => String(n).padStart(2, '0'), name = `pharmacy-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${tag ? '-' + tag : ''}.db`;
  const f = path.join(D.DATA, 'backups', name); db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
  const all = fs.readdirSync(path.join(D.DATA, 'backups')).filter(x => x.endsWith('.db')).sort(); const auto = all.filter(x => !/-(pre|manual)/.test(x));
  auto.slice(0, Math.max(auto.length - 14, 0)).forEach(x => { try { fs.unlinkSync(path.join(D.DATA, 'backups', x)); } catch (e) { } });
  const v = kvSet('pharmacy_lastbackup', new Date().toISOString(), 'server'); broadcast('pharmacy_lastbackup', v, '');
  return name;
}
function autoBackup() { try { const fs2 = fs.readdirSync(path.join(D.DATA, 'backups')).filter(x => x.endsWith('.db')).map(x => fs.statSync(path.join(D.DATA, 'backups', x)).mtimeMs); if (!fs2.length || Date.now() - Math.max(...fs2) > 24 * 3600e3) makeBackup(''); } catch (e) { console.error('backup:', e.message); } }

/* ---------- API ---------- */
async function api(req, res, url) {
  const m = req.method, p = url.pathname, ipa = A.ip(req);
  if (m !== 'GET' && m !== 'HEAD') {
    if (req.headers['x-pms'] !== '1') return send(res, 403, { error: 'Bad request origin' });
    const o = req.headers.origin; if (o) { try { if (new URL(o).host !== req.headers.host) return send(res, 403, { error: 'Cross-origin blocked' }); } catch (e) { return send(res, 403, { error: 'Bad origin' }); } }
  }
  if (p === '/api/ping') return send(res, 200, { ok: true, server: true, name: 'MediCare Pharmacy', time: nowIso() });
  if (p === '/api/health') return send(res, 200, { ok: true, db: db.prepare('SELECT COUNT(*) c FROM kv').get().c + ' keys' });
  const w = A.who(req);

  if (p === '/api/boot' && m === 'GET') {
    const out = {}; let n = 0;
    if (!A.anyUser(w)) { const r = kvGet('mc_db'); if (r) { try { out.mc_db = { v: JSON.stringify(A.publicDb(JSON.parse(r.value))), ver: r.ver }; } catch (e) { } } return send(res, 200, { server: true, me: { staff: null, ops: null }, kv: out, public: true }); }
    const must = (w.staff && w.staff.mustChange) || (!w.staff && w.ops && w.ops.mustChange);
    if (!must) for (const r of D.q.kvAll.all()) { if (A.isSyncKey(r.key)) { out[r.key] = kvOut(r.key, r, w); n++; } }
    return send(res, 200, { server: true, me: sessionUsers(w), kv: out, public: false, n, must: !!must });
  }
  if (p === '/api/me' && m === 'GET') return send(res, 200, { me: sessionUsers(w) });
  if (p === '/api/public/ops-users' && m === 'GET') return send(res, 200, { users: opsUsers().filter(u => u.active) });

  if (p === '/api/login' && m === 'POST') {
    const b = await body(req, 8192), scope = b.scope === 'ops' ? 'ops' : 'staff', ident = scope === 'ops' ? String(b.userId || '') : String(b.email || '').trim().toLowerCase();
    const key = scope + ':' + ident, ik = 'ip:' + ipa;
    const L = Math.max(A.lockState(key), A.lockState(ik)); if (L) return send(res, 429, { error: 'অনেকবার ভুল — ' + L + ' সেকেন্ড পরে চেষ্টা করুন', locked: L });
    const u = scope === 'ops' ? db.prepare("SELECT * FROM users WHERE scope='ops' AND ext_id=?").get(ident) : db.prepare("SELECT * FROM users WHERE scope='staff' AND lower(email)=?").get(ident);
    const okPw = u ? D.verifyPw(b.password, u.pass_hash) : (D.verifyPw(b.password, 's1$00000000000000000000000000000000$' + '0'.repeat(64)), false);
    const bad = (why) => { const f = A.fail(key); A.fail(ik, 30); A.logLogin({ email: scope === 'ops' ? (u ? u.name + ' (Ops)' : ident) : ident, ok: false, scope, role: u && u.role, ip: ipa, why }); audit(ident, 'login-fail', why); return send(res, f.locked ? 429 : 401, { error: f.locked ? 'অনেকবার ভুল — ' + f.locked + ' সেকেন্ড পরে চেষ্টা করুন' : 'ভুল তথ্য — আর ' + f.left + ' বার চেষ্টা করা যাবে', left: f.left, locked: f.locked }); };
    if (!u || !okPw) return bad('bad credentials');
    if (!u.active) return bad('disabled');
    if (scope === 'staff' && b.role && String(b.role).toLowerCase() !== u.role.toLowerCase()) return send(res, 403, { error: `Role মেলেনি! এই অ্যাকাউন্ট "${u.role}"-এর, আপনি "${b.role}" বেছেছেন।`, roleMismatch: u.role });
    if (u.pin_hash) { if (!b.pin) return send(res, 401, { error: 'Admin PIN দিন', needPin: true }); if (!D.verifyPw(String(b.pin), u.pin_hash)) return bad('bad pin'); }
    A.clearFail(key); A.destroy(req, scope);
    const s = A.createSession({ id: u.id, scope }, req); db.prepare('UPDATE users SET last_login=? WHERE id=?').run(nowIso(), u.id);
    A.logLogin({ email: scope === 'ops' ? u.name + ' (Ops)' : u.email, ok: true, scope, role: u.role, ip: ipa }); audit(u.email || u.name, 'login', scope);
    const pu = A.publicUser({ id: u.id, ext: u.ext_id, scope, email: u.email, name: u.name, role: u.role, mustChange: !!u.must_change, hasPin: !!u.pin_hash });
    return send(res, 200, { ok: true, user: pu }, { 'Set-Cookie': A.cookieHeader(scope, s.tok, b.remember === false ? 0 : s.maxAge) });
  }
  if (p === '/api/logout' && m === 'POST') {
    const b = await body(req, 1024), sc = b.scope === 'all' ? ['staff', 'ops'] : [b.scope === 'ops' ? 'ops' : 'staff']; const ck = [];
    sc.forEach(s => { A.destroy(req, s); ck.push(A.clearCookie(s)); }); return send(res, 200, { ok: true }, { 'Set-Cookie': ck });
  }

  /* ---- এখান থেকে লগইন লাগবে (পাসওয়ার্ড বদলের পথ ছাড়া) ---- */
  if (p === '/api/me/password' && m === 'POST') {
    if (!A.anyUser(w)) return send(res, 401, { error: 'লগইন করুন' });
    const b = await body(req, 2048), u = w.staff && (b.scope !== 'ops') ? w.staff : (w.ops || w.staff); const row = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
    if (!D.verifyPw(b.current, row.pass_hash)) { A.fail('pw:' + u.id, 5); return send(res, 403, { error: 'বর্তমান পাসওয়ার্ড ভুল' }); }
    const pr = D.pwProblem(b.next, row.email, row.name); if (pr) return send(res, 400, { error: pr });
    if (D.verifyPw(b.next, row.pass_hash)) return send(res, 400, { error: 'নতুন পাসওয়ার্ড আগেরটির চেয়ে আলাদা হতে হবে' });
    db.prepare('UPDATE users SET pass_hash=?, must_change=0 WHERE id=?').run(D.hashPw(b.next), u.id);
    db.prepare('DELETE FROM sessions WHERE user_id=? AND sid_hash<>?').run(u.id, u.sid); audit(row.email || row.name, 'password-change', ''); return send(res, 200, { ok: true });
  }
  if (p === '/api/events' && m === 'GET') {
    const cid = url.searchParams.get('cid') || ''; res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n'); const c = { res, cid, authed: !!A.anyUser(w) }; clients.add(c); req.on('close', () => clients.delete(c)); return;
  }

  if (p.startsWith('/api/shop/')) {
    const sub = p.slice(10);
    if (sub === 'catalog' && m === 'GET') { const r = kvGet('mc_db'); return send(res, 200, r ? { v: JSON.stringify(A.publicDb(JSON.parse(r.value))), ver: r.ver } : { v: null, ver: 0 }); }
    if (sub === 'order' && m === 'POST') { try { const r = SHOP.placeOrder(await body(req, 65536), ipa); broadcast('mc_db', r.ver, ''); return send(res, 200, { ok: true, order: r.order, catalog: { v: JSON.stringify(r.catalog), ver: r.ver } }); } catch (e) { return send(res, e.code || 500, { error: e.message }); } }
    if (sub === 'track' && m === 'GET') { const o = SHOP.track(url.searchParams.get('no'), url.searchParams.get('phone')); return o ? send(res, 200, { order: o }) : send(res, 404, { error: 'অর্ডার পাওয়া যায়নি' }); }
    if (sub === 'act' && m === 'POST') { try { const r = SHOP.customerAct(await body(req, 4096), ipa); broadcast('mc_db', r.ver, ''); return send(res, 200, { ok: true, order: r.order, catalog: { v: JSON.stringify(r.catalog), ver: r.ver } }); } catch (e) { return send(res, e.code || 500, { error: e.message }); } }
    if (sub === 'note' && m === 'POST') { try { const v = SHOP.addNote(await body(req, 4096), ipa); broadcast('mc_db', v, ''); return send(res, 200, { ok: true }); } catch (e) { return send(res, e.code || 500, { error: e.message }); } }
    return send(res, 404, { error: 'Not found' });
  }

  if (p === '/api/kv/mc_db' && m === 'PUT' && !A.anyUser(w) && !kvGet('mc_db')) {
    const b = await body(req, 8 * 1048576), val = sanitizeDb(typeof b.value === 'string' ? b.value : JSON.stringify(b.value), null, w); if (!val) return send(res, 400, { error: 'Bad shop data' });
    const ver = kvSet('mc_db', val, 'bootstrap'); audit('system', 'bootstrap', 'mc_db'); return send(res, 200, { ok: true, ver });
  }
  if (!needLogin(w, res)) return;

  let mm;
  if ((mm = p.match(/^\/api\/kv\/([A-Za-z0-9_]+)$/))) {
    const key = mm[1];
    if (m === 'GET') { const r = kvGet(key); return r && A.isSyncKey(key) ? send(res, 200, kvOut(key, r, w)) : send(res, 404, { error: 'No such key' }); }
    if (m === 'PUT' || m === 'DELETE') {
      if (!A.canWrite(w, key)) return send(res, 403, { error: 'এই ডেটা বদলানোর অনুমতি নেই' });
      const r = kvGet(key), b = m === 'PUT' ? await body(req, 25 * 1048576) : { base: +url.searchParams.get('base') || 0, cid: url.searchParams.get('cid') || '' };
      if (r && +b.base !== r.ver) return send(res, 409, Object.assign({ conflict: true }, kvOut(key, r, w)));
      const by = (w.staff || w.ops).name;
      if (m === 'DELETE') { D.q.kvDel.run(key); audit(by, 'kv-delete', key); broadcast(key, 0, b.cid, { deleted: true }); return send(res, 200, { ok: true, ver: 0 }); }
      let val = typeof b.value === 'string' ? b.value : JSON.stringify(b.value); if (val == null || val.length > 25 * 1048576) return send(res, 400, { error: 'Invalid value' });
      try { JSON.parse(val); } catch (e) { return send(res, 400, { error: 'Value must be JSON' }); }
      if (key === 'mc_db') { const s = sanitizeDb(val, r && JSON.parse(r.value), w); if (!s) return send(res, 400, { error: 'Bad shop data' }); val = s; }
      const ver = kvSet(key, val, by); if (/settings|roles/.test(key)) audit(by, 'kv-write', key);
      broadcast(key, ver, b.cid); return send(res, 200, { ok: true, ver });
    }
  }
  if (p === '/api/me/pin' && m === 'POST') {
    const u = w.staff; if (!u || u.role !== 'admin') return send(res, 403, { error: 'PIN শুধু Admin-এর জন্য' }); const b = await body(req, 1024), row = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
    if (!D.verifyPw(b.password, row.pass_hash)) return send(res, 403, { error: 'পাসওয়ার্ড ভুল' });
    if (b.pin == null || b.pin === '') { db.prepare('UPDATE users SET pin_hash=NULL WHERE id=?').run(u.id); audit(row.email, 'pin-remove', ''); return send(res, 200, { ok: true, hasPin: false }); }
    const pin = String(b.pin); if (!/^\d{4,8}$/.test(pin) || /^(\d)\1+$/.test(pin) || '0123456789012345678901'.includes(pin) || '9876543210987654321'.includes(pin)) return send(res, 400, { error: 'সহজ PIN (১২৩৪, ১১১১) চলবে না — ৪–৮ সংখ্যা দিন' });
    db.prepare('UPDATE users SET pin_hash=? WHERE id=?').run(D.hashPw(pin), u.id); audit(row.email, 'pin-set', ''); return send(res, 200, { ok: true, hasPin: true });
  }

  /* ---- ইউজার ম্যানেজমেন্ট (Admin/Owner) ---- */
  if (p === '/api/users' && m === 'GET') { if (!needAdmin(w, res)) return; return send(res, 200, { users: db.prepare('SELECT id,ext_id,scope,email,name,role,active,must_change,last_login,created,(pin_hash IS NOT NULL) hasPin FROM users ORDER BY scope,id').all().map(u => ({ id: u.id, ext: u.ext_id, scope: u.scope, email: u.email, name: u.name, role: u.role, active: !!u.active, mustChange: !!u.must_change, lastLogin: u.last_login, hasPin: !!u.hasPin })) }); }
  if (p === '/api/users' && m === 'POST') {
    if (!needAdmin(w, res)) return; const b = await body(req, 4096), scope = b.scope === 'ops' ? 'ops' : 'staff', name = String(b.name || '').trim().slice(0, 60), role = String(b.role || '').trim();
    if (name.length < 2) return send(res, 400, { error: 'নাম দিন' });
    if (scope === 'ops' && !OPS_ROLES.includes(role)) return send(res, 400, { error: 'Ops role: ' + OPS_ROLES.join(', ') });
    if (scope === 'staff' && !/^[A-Za-z][A-Za-z0-9 _-]{1,29}$/.test(role)) return send(res, 400, { error: 'Role নাম ইংরেজিতে (২–৩০ অক্ষর) দিন' });
    let email = null; if (scope === 'staff') { email = String(b.email || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: 'সঠিক ইমেইল দিন' }); if (db.prepare("SELECT 1 FROM users WHERE scope='staff' AND lower(email)=?").get(email)) return send(res, 409, { error: 'এই ইমেইল আগেই আছে' }); }
    const pr = D.pwProblem(b.password, email, name); if (pr) return send(res, 400, { error: pr });
    const ext = scope === 'ops' ? 'U' + (1 + db.prepare("SELECT COUNT(*) c FROM users WHERE scope='ops'").get().c + Math.floor(Math.random() * 90)) : 'S' + Date.now().toString(36);
    const r = db.prepare('INSERT INTO users(ext_id,scope,email,name,role,pass_hash,must_change,created) VALUES(?,?,?,?,?,?,1,?)').run(ext, scope, email, name, role, D.hashPw(b.password), nowIso());
    audit((w.staff || w.ops).name, 'user-create', `${scope}:${email || name}`); return send(res, 200, { ok: true, id: Number(r.lastInsertRowid) });
  }
  if ((mm = p.match(/^\/api\/users\/(\d+)(\/reset)?$/))) {
    if (!needAdmin(w, res)) return; const id = +mm[1], u = db.prepare('SELECT * FROM users WHERE id=?').get(id); if (!u) return send(res, 404, { error: 'ইউজার নেই' }); const b = await body(req, 4096), by = (w.staff || w.ops).name;
    const owners = () => db.prepare("SELECT COUNT(*) c FROM users WHERE active=1 AND role IN ('admin','Owner')").get().c;
    if (mm[2] && m === 'POST') { const pr = D.pwProblem(b.password, u.email, u.name); if (pr) return send(res, 400, { error: pr }); db.prepare('UPDATE users SET pass_hash=?, must_change=1 WHERE id=?').run(D.hashPw(b.password), id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); A.clearFail(u.scope + ':' + (u.scope === 'ops' ? u.ext_id : String(u.email).toLowerCase())); audit(by, 'password-reset', u.email || u.name); return send(res, 200, { ok: true }); }
    if (m === 'PATCH') {
      const name = b.name != null ? String(b.name).trim().slice(0, 60) : u.name, role = b.role != null ? String(b.role).trim() : u.role, active = b.active != null ? (b.active ? 1 : 0) : u.active;
      if (name.length < 2) return send(res, 400, { error: 'নাম দিন' }); if (u.scope === 'ops' && !OPS_ROLES.includes(role)) return send(res, 400, { error: 'ভুল Ops role' });
      if ((u.role === 'admin' || u.role === 'Owner') && u.active && (!active || (role !== u.role)) && owners() <= 1) return send(res, 400, { error: 'শেষ Admin/Owner-কে বন্ধ বা পরিবর্তন করা যাবে না' });
      db.prepare('UPDATE users SET name=?, role=?, active=? WHERE id=?').run(name, role, active, id); if (!active) db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      audit(by, 'user-update', `${u.email || u.name} role=${role} active=${active}`); const v = kvGet('mc_db'); if (v) broadcast('mc_db', v.ver, ''); return send(res, 200, { ok: true });
    }
  }
  if (p === '/api/sessions' && m === 'GET') {
    const mine = w.staff || w.ops, adm = A.anyOwner(w), cur = new Set([w.staff && w.staff.sid, w.ops && w.ops.sid]);
    const rows = db.prepare('SELECT s.sid_hash,s.scope,s.created,s.last,s.expires,s.ip,s.ua,u.name,u.role,u.id uid FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.expires>? ORDER BY s.last DESC').all(Date.now());
    return send(res, 200, { sessions: rows.filter(r => adm || r.uid === mine.id).map(r => ({ id: r.sid_hash.slice(0, 12), name: r.name, role: r.role, scope: r.scope, ip: r.ip, ua: r.ua, created: r.created, last: r.last, current: cur.has(r.sid_hash) })) });
  }
  if (p === '/api/sessions/revoke' && m === 'POST') {
    const b = await body(req, 1024), mine = w.staff || w.ops, adm = A.anyOwner(w); let n = 0;
    const rows = db.prepare('SELECT s.sid_hash,s.user_id FROM sessions s').all();
    rows.forEach(r => { const hit = b.all ? (r.user_id === mine.id && r.sid_hash !== (w.staff && w.staff.sid) && r.sid_hash !== (w.ops && w.ops.sid)) : r.sid_hash.slice(0, 12) === b.id; if (hit && (adm || r.user_id === mine.id)) { db.prepare('DELETE FROM sessions WHERE sid_hash=?').run(r.sid_hash); n++; } });
    audit(mine.name, 'session-revoke', n + ''); return send(res, 200, { ok: true, revoked: n });
  }
  if (p === '/api/backups/restore' && m === 'POST') {
    if (!needAdmin(w, res)) return; const b = await body(req, 1024), n = String(b.name || ''); if (!/^pharmacy-[\d_-]+(-pre|-manual)?\.db$/.test(n)) return send(res, 400, { error: 'Bad name' });
    const f = path.join(D.DATA, 'backups', n); if (!fs.existsSync(f)) return send(res, 404, { error: 'ব্যাকআপ পাওয়া যায়নি' });
    const pre = makeBackup('pre'); let cnt = 0;
    try {
      db.exec(`ATTACH DATABASE '${f.replace(/'/g, "''")}' AS bk`);
      D.tx(() => { const old = db.prepare('SELECT key FROM main.kv').all().map(r => r.key).filter(k => A.isSyncKey(k) && !A.SERVER_OWNED.has(k)); const nw = db.prepare('SELECT key,value FROM bk.kv').all().filter(r => A.isSyncKey(r.key) && !A.SERVER_OWNED.has(r.key)), keep = new Set(nw.map(r => r.key));
        old.forEach(k => { if (!keep.has(k)) { D.q.kvDel.run(k); broadcast(k, 0, '', { deleted: true }); } }); nw.forEach(r => { const v = kvSet(r.key, r.value, 'restore'); broadcast(r.key, v, ''); cnt++; }); });
    } catch (e) { try { db.exec('DETACH DATABASE bk'); } catch (x) { } return send(res, 500, { error: 'রিস্টোর হয়নি: ' + e.message }); }
    try { db.exec('DETACH DATABASE bk'); } catch (e) { }
    audit((w.staff || w.ops).name, 'restore', n + ' (safety ' + pre + ')'); return send(res, 200, { ok: true, restored: cnt, safetyBackup: pre });
  }
  if (p === '/api/status' && m === 'GET') {
    if (!needAdmin(w, res)) return; let bk = []; try { bk = fs.readdirSync(path.join(D.DATA, 'backups')).filter(x => x.endsWith('.db')).map(x => ({ n: x, t: fs.statSync(path.join(D.DATA, 'backups', x)).mtimeMs })).sort((a, b) => b.t - a.t); } catch (e) { }
    let dbSize = 0; try { dbSize = fs.statSync(D.FILE).size; } catch (e) { }
    return send(res, 200, { startedAt: STARTED, uptimeSec: Math.round((Date.now() - STARTED) / 1000), node: process.versions.node, https: !!TLS, host: HOST, port: PORT, dbSize, backups: bk.length, lastBackup: bk[0] ? bk[0].t : 0, clients: clients.size, sessions: db.prepare('SELECT COUNT(*) c FROM sessions WHERE expires>?').get(Date.now()).c,
      users: db.prepare('SELECT COUNT(*) c FROM users WHERE active=1').get().c, pendingChange: db.prepare('SELECT COUNT(*) c FROM users WHERE must_change=1 AND active=1').get().c, adminsNoPin: db.prepare("SELECT COUNT(*) c FROM users WHERE active=1 AND role='admin' AND pin_hash IS NULL").get().c,
      keys: db.prepare('SELECT key,length(value) bytes,ver,updated,by FROM kv ORDER BY bytes DESC').all() });
  }
  if (p === '/api/audit' && m === 'GET') { if (!needAdmin(w, res)) return; return send(res, 200, { audit: db.prepare('SELECT at,who,action,detail FROM audit ORDER BY id DESC LIMIT 300').all() }); }

  /* ---- ব্যাকআপ / এক্সপোর্ট / ইম্পোর্ট / রিসেট (Admin/Owner) ---- */
  if (p === '/api/backups' && m === 'GET') { if (!needAdmin(w, res)) return; return send(res, 200, { backups: fs.readdirSync(path.join(D.DATA, 'backups')).filter(x => x.endsWith('.db')).sort().reverse().map(n => { const s = fs.statSync(path.join(D.DATA, 'backups', n)); return { name: n, size: s.size, at: s.mtime.toISOString() }; }) }); }
  if (p === '/api/backups' && m === 'POST') { if (!needAdmin(w, res)) return; const n = makeBackup('manual'); audit((w.staff || w.ops).name, 'backup', n); return send(res, 200, { ok: true, name: n }); }
  if (p === '/api/backups/download' && m === 'GET') { if (!needAdmin(w, res)) return; const n = url.searchParams.get('name') || ''; if (!/^pharmacy-[\d_-]+(-pre|-manual)?\.db$/.test(n)) return send(res, 400, { error: 'Bad name' }); const f = path.join(D.DATA, 'backups', n); if (!fs.existsSync(f)) return send(res, 404, { error: 'Not found' }); res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${n}"` }); return fs.createReadStream(f).pipe(res); }
  if (p === '/api/export' && m === 'GET') { if (!needAdmin(w, res)) return; const kv = {}; for (const r of D.q.kvAll.all()) if (A.isSyncKey(r.key)) kv[r.key] = r.value; return send(res, 200, { app: 'medicare-pharmacy', version: 1, at: nowIso(), kv }, { 'Content-Disposition': 'attachment; filename="pharmacy-export.json"' }); }
  if (p === '/api/import' && m === 'POST') {
    if (!needAdmin(w, res)) return; const b = await body(req, 60 * 1048576), kv = b.kv; if (!kv || typeof kv !== 'object') return send(res, 400, { error: 'ভুল ফাইল' });
    const pre = makeBackup('pre'); let n = 0; D.tx(() => { for (const k of Object.keys(kv)) { if (!A.isSyncKey(k) || A.SERVER_OWNED.has(k)) continue; const v = typeof kv[k] === 'string' ? kv[k] : JSON.stringify(kv[k]); try { JSON.parse(v); } catch (e) { continue; } const ver = kvSet(k, k === 'mc_db' ? (sanitizeDb(v, null, w) || v) : v, 'import'); broadcast(k, ver, ''); n++; } });
    audit((w.staff || w.ops).name, 'import', n + ' keys (backup ' + pre + ')'); return send(res, 200, { ok: true, imported: n, safetyBackup: pre });
  }
  if (p === '/api/reset' && m === 'POST') {
    if (!needAdmin(w, res)) return; const b = await body(req, 1024); if (b.confirm !== 'RESET') return send(res, 400, { error: 'RESET লিখে নিশ্চিত করুন' });
    const pre = makeBackup('pre'); let n = 0; D.tx(() => { for (const r of D.q.kvAll.all()) if (A.isSyncKey(r.key) && !A.SERVER_OWNED.has(r.key) && r.key !== 'pharmacy_lastbackup') { D.q.kvDel.run(r.key); broadcast(r.key, 0, '', { deleted: true }); n++; } });
    audit((w.staff || w.ops).name, 'reset', n + ' keys (backup ' + pre + ')'); return send(res, 200, { ok: true, removed: n, safetyBackup: pre });
  }
  return send(res, 404, { error: 'Not found' });
}

/* ---------- স্ট্যাটিক ফাইল ---------- */
const BLOCK = new Set(['server', 'data', 'node_modules', '.git']);
function serve(req, res, url) {
  let rel; try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html'; if (rel === '') rel = '/index.html';
  const parts = rel.split('/').filter(Boolean); if (parts.some(x => x === '..' || x.startsWith('.')) || BLOCK.has(parts[0]) || /\.(db|sqlite|db-wal|db-shm)$/i.test(rel) || parts[0] === 'package.json') { res.writeHead(404); return res.end('Not found'); }
  const f = path.join(D.ROOT, ...parts); if (!f.startsWith(D.ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    const ext = path.extname(f).toLowerCase(); res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': /\.(html|js|css)$/.test(ext) ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'no-referrer' });
    if (req.method === 'HEAD') return res.end(); fs.createReadStream(f).pipe(res);
  });
}

const TLS = process.env.PMS_CERT && process.env.PMS_KEY; A.SEC.on = !!TLS;
const handler = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serve(req, res, url);
  } catch (e) { if (!res.headersSent) send(res, e.code && e.code < 600 ? e.code : 500, { error: e.code ? e.message : 'Server error' }); else res.end(); if (!e.code) console.error(e); }
};
const server = TLS ? require('https').createServer({ cert: fs.readFileSync(process.env.PMS_CERT), key: fs.readFileSync(process.env.PMS_KEY) }, handler) : http.createServer(handler);
server.listen(PORT, HOST, () => {
  const sch = TLS ? 'https' : 'http';
  console.log(`\n  MediCare Pharmacy সার্ভার চলছে →  ${sch}://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n  ডেটাবেস: ${D.FILE}`);
  if (HOST === '0.0.0.0') { const ips = []; Object.values(require('os').networkInterfaces()).forEach(a => a.forEach(i => { if (i.family === 'IPv4' && !i.internal) ips.push(i.address); })); console.log('  একই Wi-Fi/LAN-এর অন্য ফোন/কম্পিউটার থেকে: ' + ips.map(x => `${sch}://${x}:${PORT}`).join('  ') + (TLS ? '' : '\n  ⚠ HTTPS নেই — পাসওয়ার্ড সাধারণ HTTP-তে যাবে; শুধু নিজের বিশ্বস্ত নেটওয়ার্কে চালান (HTTPS: README দেখুন)')); }
  console.log('');
  if (db.prepare("SELECT 1 FROM users WHERE must_change=1 LIMIT 1").get()) console.log('  ⚠ ডিফল্ট অ্যাকাউন্ট আছে — প্রথম লগইনে পাসওয়ার্ড বদলাতে বলা হবে (দেখুন README)।\n');
  autoBackup(); setInterval(autoBackup, 30 * 60e3).unref();
});
process.on('SIGINT', () => { try { db.close(); } catch (e) { } process.exit(0); });
process.on('SIGTERM', () => { try { db.close(); } catch (e) { } process.exit(0); });

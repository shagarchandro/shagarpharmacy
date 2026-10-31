/* v69 — আসল সার্ভার মোড (npm start)।
   সার্ভার না থাকলে (শুধু ফাইল/স্ট্যাটিক হোস্ট) কিছুই করে না — আগের মতো ডেমো মোডে চলে।
   সার্ভার থাকলে:
   • সব ডেটা (pharmacy_*, mc_db, mc_acc) SQLite ডাটাবেসে থাকে; localStorage শুধু ক্যাশ।
   • লগইন সার্ভারের HttpOnly কুকিতে; পাসওয়ার্ড/PIN সার্ভারে যাচাই হয়।
   • লিখলেই সার্ভারে যায় (version + 3-way merge); অন্য ডিভাইসের বদল লাইভ (SSE) আসে।
   • গ্রাহকের অর্ডার সার্ভারে যাচাই হয় (দাম, স্টক, কুপন, ডেলিভারি ফি) — ব্রাউজারের কথা বিশ্বাস করা হয় না। */
(function () {
  'use strict';
  if (window.MCSRV || location.protocol === 'file:') return;
  var NLS, NSS; try { NLS = window.localStorage; NSS = window.sessionStorage; } catch (e) { return; }
  var P = Storage.prototype, nGet = P.getItem, nSet = P.setItem, nRem = P.removeItem;
  var CID = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var NOSYNC = { pharmacy_creds: 1, pharmacy_accounts: 1, pharmacy_held: 1, pharmacy_alert_snooze: 1 };
  var NOSEND = { pharmacy_loginlog: 1 };
  var SYNC_RE = /^(pharmacy_[a-z0-9_]{1,60}|mc_db|mc_acc)$/;
  var AUTHK = { user: 1, auth_token: 1, user_role: 1, user_access: 1 };
  var DELTA = { qty: 1, stock: 1, due: 1, balance: 1, points: 1 };
  function isSync(k) { return SYNC_RE.test(k) && !NOSYNC[k]; }
  function J(s) { try { return JSON.parse(s); } catch (e) { return undefined; } }
  function lget(k) { try { return nGet.call(NLS, k); } catch (e) { return null; } }
  function lset(k, v) { try { nSet.call(NLS, k, v); } catch (e) { } }
  function lrem(k) { try { nRem.call(NLS, k); } catch (e) { } }

  /* ---------- সিঙ্ক্রোনাস / অ্যাসিঙ্ক HTTP ---------- */
  function req(method, url, body) {
    var x = new XMLHttpRequest();
    try { x.open(method, url, false); x.setRequestHeader('x-pms', '1'); if (body !== undefined) x.setRequestHeader('Content-Type', 'application/json'); x.send(body === undefined ? null : JSON.stringify(body)); }
    catch (e) { return { status: 0, json: null }; }
    var j = null; try { j = JSON.parse(x.responseText); } catch (e) { }
    return { status: x.status, json: j };
  }
  function areq(method, url, body) {
    return fetch(url, { method: method, credentials: 'same-origin', headers: Object.assign({ 'x-pms': '1' }, body !== undefined ? { 'Content-Type': 'application/json' } : {}), body: body === undefined ? undefined : JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); }, function () { return { status: 0, json: null }; });
  }

  var B = req('GET', '/api/boot');
  if (B.status !== 200 || !B.json || B.json.server !== true) return;         // সার্ভার নেই → ডেমো মোড

  var S = { active: true, cid: CID, me: B.json.me || { staff: null, ops: null }, must: !!B.json.must, vers: {}, base: {}, dirty: {}, flags: {}, noDb: false };
  S.authed = !!(S.me.staff || S.me.ops);
  window.MCSRV = S;

  /* ---------- 3-way merge ---------- */
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function idKey(a) { var ks = ['id', 'no', 'code', 'pid']; for (var i = 0; i < ks.length; i++) { var k = ks[i]; if (a.length && a.every(function (x) { return isObj(x) && x[k] != null; })) return k; } return null; }
  function mapBy(a, k) { var m = {}; a.forEach(function (x) { m['$' + x[k]] = x; }); return m; }
  function mArr(b, m, t) {
    if (m.length >= b.length && t.length >= b.length && eq(m.slice(0, b.length), b) && eq(t.slice(0, b.length), b)) return t.concat(m.slice(b.length)); // শুধু যোগ হয়েছে
    var k = idKey(m.concat(t)); if (!k) return m;
    var bm = mapBy(b, k), mm = mapBy(m, k), tm = mapBy(t, k), out = [];
    t.forEach(function (x) {
      var id = '$' + x[k];
      if (!(id in mm)) { if (id in bm) { if (!eq(bm[id], x)) out.push(x); } else out.push(x); }
      else out.push(m3(bm[id], mm[id], x, k));
    });
    m.forEach(function (x) { var id = '$' + x[k]; if (!(id in tm)) { if (id in bm) { if (!eq(bm[id], x)) out.push(x); } else out.push(x); } });
    return out;
  }
  function m3(b, m, t, fieldName) {
    if (eq(m, b)) return t; if (eq(t, b) || eq(m, t)) return m;
    if (typeof m === 'number' && typeof t === 'number' && typeof b === 'number' && DELTA[fieldName]) return t + (m - b);
    if (Array.isArray(m) && Array.isArray(t)) return mArr(Array.isArray(b) ? b : [], m, t);
    if (isObj(m) && isObj(t)) {
      var bb = isObj(b) ? b : {}, out = {}, ks = {}; Object.keys(t).concat(Object.keys(m)).forEach(function (k) { ks[k] = 1; });
      Object.keys(ks).forEach(function (k) {
        var inB = k in bb, inM = k in m, inT = k in t;
        if (inM && inT) out[k] = m3(bb[k], m[k], t[k], k);
        else if (inM) { if (!(inB && eq(bb[k], m[k]))) out[k] = m[k]; }
        else if (inT) { if (!(inB && eq(bb[k], t[k]))) out[k] = t[k]; }
      });
      return out;
    }
    return m;
  }
  function merge3(bs, ms, ts) { var b = J(bs), m = J(ms), t = J(ts); if (m === undefined) return ts; if (t === undefined) return ms; return JSON.stringify(m3(b === undefined ? null : b, m, t)); }
  S.merge3 = merge3;

  /* ---------- অর্ডার/ফোন দিয়ে নিজের অর্ডার (গ্রাহক) ---------- */
  function mine() { var a = J(lget('mc_myorders') || '[]'); return Array.isArray(a) ? a : []; }
  function injectMine(d) {
    var list = mine(); if (!list.length) return d; d.orders = d.orders || [];
    list.slice(0, 20).forEach(function (m) {
      var r = req('GET', '/api/shop/track?no=' + encodeURIComponent(m.no) + '&phone=' + encodeURIComponent(m.phone)), o = null;
      if (r.status === 200 && r.json && r.json.order) o = r.json.order; else if ((r.status === 0 || r.status >= 500) && m.order) o = m.order;
      if (o) { m.order = o; d.orders = d.orders.filter(function (x) { return x.no !== o.no; }); d.orders.push(o); }
    });
    lset('mc_myorders', JSON.stringify(list)); return d;
  }
  S.trackSync = function (no, ph) { var r = req('GET', '/api/shop/track?no=' + encodeURIComponent(no) + '&phone=' + encodeURIComponent(ph)); return r.status === 200 && r.json ? r.json.order : null; };
  function rememberOrder(o) { var l = mine().filter(function (x) { return x.no !== o.no; }); l.unshift({ no: o.no, phone: o.phone, order: o }); lset('mc_myorders', JSON.stringify(l.slice(0, 30))); }
  function setCatalog(cat) { var d = J(cat.v); if (!d) return null; S.vers.mc_db = cat.ver; d = injectMine(d); var s = JSON.stringify(d); lset('mc_db', s); return s; }

  /* ---------- হাইড্রেশন ---------- */
  var kv = B.json.kv || {}, migrate = null;
  (function hydrate() {
    var i, k, keys = []; for (i = 0; i < NLS.length; i++) keys.push(NLS.key(i));
    if (S.authed && !S.must) {
      Object.keys(kv).forEach(function (key) { lset(key, kv[key].v); S.vers[key] = kv[key].ver; S.base[key] = kv[key].v; });
      var old = {}; keys.forEach(function (key) { if (isSync(key) && !(key in kv)) { old[key] = lget(key); if (key !== 'mc_db') lrem(key); } });
      var has = function (key) { var a = J(old[key]); return Array.isArray(a) && a.length > 0; };
      var serverEmpty = !kv.pharmacy_medicines && !kv.pharmacy_sales && !kv.pharmacy_customers;
      var me = S.me.staff || S.me.ops, owner = me && (me.role === 'admin' || me.role === 'Owner');
      if (owner && serverEmpty && (has('pharmacy_medicines') || has('pharmacy_sales') || has('pharmacy_customers')) && lget('mc_srv_mig') !== 'no') migrate = old;
      if (!kv.mc_db && old.mc_db && !migrate) S.noDb = true; else if (!kv.mc_db && old.mc_db) S.noDb = false;
      if (!kv.mc_db && !old.mc_db) S.noDb = true;
    } else if (!S.authed) {
      keys.forEach(function (key) { if (isSync(key) && key !== 'mc_db') lrem(key); });
      if (kv.mc_db) { setCatalog(kv.mc_db); S.base.mc_db = null; } else S.noDb = true;
    } else {
      keys.forEach(function (key) { if (isSync(key) && key !== 'mc_db') lrem(key); });
    }
  })();

  /* ---------- লগইন-সেশন ↔ ব্রাউজার স্টোরেজ মেলানো ---------- */
  function reconcile() {
    var st = S.me.staff, op = S.me.ops, k;
    if (!st) { for (k in AUTHK) { lrem(k); try { nRem.call(NSS, k); } catch (e) { } } }
    else {
      var inL = lget('user') != null, store = inL ? NLS : NSS, ud = { id: st.id, name: st.name, email: st.email, role: st.role, access: st.access, avatar: mcAvatar(st.name, '667eea') };
      var cur = J(nGet.call(store, 'user') || 'null'); if (cur && cur.avatar) ud.avatar = cur.avatar;
      nSet.call(store, 'user', JSON.stringify(ud)); nSet.call(store, 'auth_token', 'server-session'); nSet.call(store, 'user_role', st.role); nSet.call(store, 'user_access', JSON.stringify(st.access));
    }
    try {
      if (!op) { ['mc_role', 'mc_ops_name', 'mc_ops_start', 'mc_ops_last'].forEach(function (x) { nRem.call(NSS, x); }); }
      else { nSet.call(NSS, 'mc_role', op.role); nSet.call(NSS, 'mc_ops_name', op.name); if (!nGet.call(NSS, 'mc_ops_start')) nSet.call(NSS, 'mc_ops_start', String(Date.now())); if (!nGet.call(NSS, 'mc_ops_last')) nSet.call(NSS, 'mc_ops_last', String(Date.now())); }
    } catch (e) { }
  }
  reconcile();
  S.adopt = function (me) { S.me = me; S.authed = !!(me.staff || me.ops); reconcile(); };

  /* ---------- সার্ভারে লেখা ---------- */
  function setDirty(on) { S.flags.dirty = on; pill(); }
  function put(k, v) {
    var base = S.vers[k] || 0, r = req('PUT', '/api/kv/' + k, { value: v, base: base, cid: CID }), tries = 0;
    while (r.status === 409 && tries < 3 && r.json) {
      tries++; var merged = merge3(S.base[k] == null ? 'null' : S.base[k], v, r.json.v); v = merged; S.base[k] = r.json.v; S.vers[k] = r.json.ver;
      r = req('PUT', '/api/kv/' + k, { value: v, base: r.json.ver, cid: CID });
    }
    if (r.status === 200 && r.json) { S.vers[k] = r.json.ver; S.base[k] = v; delete S.dirty[k]; if (!Object.keys(S.dirty).length) setDirty(false); return v; }
    if (r.status === 401 || (r.status === 403 && r.json && r.json.mustChange)) { expired(r.json && r.json.mustChange); return v; }
    if (r.status === 403) { toast((r.json && r.json.error) || 'অনুমতি নেই'); return S.base[k] != null ? S.base[k] : v; }
    if (r.status === 0 || r.status >= 500) { S.dirty[k] = v; setDirty(true); schedRetry(); return v; }
    toast((r.json && r.json.error) || 'সার্ভারে সেভ হয়নি'); return v;
  }
  var retryT = null;
  function schedRetry() { if (retryT) return; retryT = setTimeout(function () { retryT = null; Object.keys(S.dirty).forEach(function (k) { var cur = lget(k); if (cur != null) { var v = put(k, cur); if (v !== cur) lset(k, v); } }); if (Object.keys(S.dirty).length) schedRetry(); }, 5000); }
  window.addEventListener('online', schedRetry);

  /* গ্রাহক (লগইন ছাড়া): দোকানের পরিবর্তন সার্ভারের নিয়মে পাঠানো */
  function anonSave(val) {
    var nd = J(val), od = J(lget('mc_db') || '{}') || {};
    if (!nd || typeof nd !== 'object') return val;
    if (S.noDb && !S.flags.boot) { var r0 = req('PUT', '/api/kv/mc_db', { value: val, cid: CID }); if (r0.status === 200) { S.noDb = false; S.vers.mc_db = r0.json.ver; } S.flags.boot = 1; return val; }
    var oldIds = {}, mineNos = {}; (od.orders || []).forEach(function (o) { oldIds[o.id] = o; }); mine().forEach(function (m) { mineNos[m.no] = 1; });
    var last = null;
    (nd.orders || []).forEach(function (o) {
      if (!oldIds[o.id] && !mineNos[o.no]) {                                   // নতুন অর্ডার
        var f = document.querySelector('form [name=area]'), area = f ? f.value : 'dhaka';
        var r = req('POST', '/api/shop/order', { order: o, area: area || 'dhaka' });
        if (r.status !== 200 || !r.json || !r.json.order) throw new Error((r.json && r.json.error) || 'সার্ভারের সাথে যোগাযোগ করা যায়নি — আবার চেষ্টা করুন');
        var real = r.json.order; if (real.no !== o.no) { S.flags.noMap = S.flags.noMap || {}; S.flags.noMap[o.no] = real.no; }
        rememberOrder(real); last = r.json.catalog;
      } else if (oldIds[o.id] && mineNos[o.no] && oldIds[o.id].status !== o.status && (o.status === 'Cancelled' || o.status === 'Return Requested')) {
        var r2 = req('POST', '/api/shop/act', { no: o.no, phone: o.phone, act: o.status === 'Cancelled' ? 'cancel' : 'return', reason: o.reason });
        if (r2.status !== 200 || !r2.json || !r2.json.order) throw new Error((r2.json && r2.json.error) || 'সার্ভারে হয়নি');
        rememberOrder(r2.json.order); last = r2.json.catalog;
      }
    });
    var oldN = {}; (od.notes || []).forEach(function (n) { oldN[n.id] = 1; });
    (nd.notes || []).forEach(function (n) {
      if (oldN[n.id] || /^(New order |Return requested for |Customer cancelled )/.test(n.msg || '')) return;
      req('POST', '/api/shop/note', { note: { kind: n.kind, msg: n.msg } });
    });
    if (last) { var s = setCatalog(last); if (s) return s; }
    return val;
  }

  function syncWrite(k, v) {
    if (NOSEND[k]) return v;
    if (S.authed && !S.must) { var out = put(k, v); return out; }
    if (k === 'mc_db' && !S.authed) return anonSave(v);
    return v;
  }
  function loggingOut(scope) {
    if (S.flags['lo' + scope]) return; S.flags['lo' + scope] = 1; setTimeout(function () { S.flags['lo' + scope] = 0; }, 800);
    req('POST', '/api/logout', { scope: scope });
    if (scope === 'staff') S.me.staff = null; else S.me.ops = null; S.authed = !!(S.me.staff || S.me.ops);
  }
  function hookSet(t, isLocal, k, v) {
    if (isLocal && isSync(k)) v = syncWrite(k, v);
    nSet.call(t, k, v);
  }
  function hookRem(t, isLocal, k) {
    if (AUTHK[k] && S.me.staff) loggingOut('staff');
    if (!isLocal && k === 'mc_role' && S.me.ops) loggingOut('ops');
    if (isLocal && isSync(k) && S.authed && !S.must && !NOSEND[k]) { var r = req('DELETE', '/api/kv/' + k + '?base=' + (S.vers[k] || 0) + '&cid=' + CID); if (r.status === 409 && r.json) { req('DELETE', '/api/kv/' + k + '?base=' + r.json.ver + '&cid=' + CID); } if (r.status === 403) { toast((r.json && r.json.error) || 'অনুমতি নেই'); return; } delete S.vers[k]; delete S.base[k]; }
    nRem.call(t, k);
  }
  function wrap(store, isLocal) {
    return new Proxy(store, {
      get: function (t, p) {
        if (p === 'setItem') return function (k, v) { return hookSet(t, isLocal, String(k), String(v)); };
        if (p === 'removeItem') return function (k) { return hookRem(t, isLocal, String(k)); };
        if (p === 'getItem') return function (k) { return nGet.call(t, String(k)); };
        var v = t[p]; return typeof v === 'function' ? v.bind(t) : v;
      },
      set: function (t, p, v) { if (typeof p === 'string') hookSet(t, isLocal, p, String(v)); return true; },
      deleteProperty: function (t, p) { if (typeof p === 'string') hookRem(t, isLocal, p); return true; }
    });
  }
  try {
    var PL = wrap(NLS, true), PS = wrap(NSS, false);
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return PL; } });
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: function () { return PS; } });
  } catch (e) { console.warn('storage proxy failed', e); }

  /* ---------- UI: স্ট্যাটাস, টোস্ট, ওভারলে ---------- */
  var pillEl = null, pillMsg = null;
  function css() {
    if (document.getElementById('mcsrvCss')) return; var s = document.createElement('style'); s.id = 'mcsrvCss';
    s.textContent = '#mcsrvPill{position:fixed;left:8px;bottom:8px;z-index:2147483000;font:600 11px/1 system-ui,sans-serif;padding:6px 10px;border-radius:99px;background:rgba(17,24,39,.82);color:#fff;display:flex;gap:6px;align-items:center;cursor:default;max-width:70vw;box-shadow:0 2px 8px rgba(0,0,0,.25)}#mcsrvPill i{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block}#mcsrvPill.off i{background:#ef4444}#mcsrvPill.new{cursor:pointer;background:#1d4ed8}#mcsrvPill.new i{background:#fde047}'
      + '#mcsrvOv{position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif}#mcsrvOv .bx{background:#fff;color:#111827;border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.4)}#mcsrvOv h2{margin:0 0 6px;font-size:18px}#mcsrvOv p{margin:0 0 12px;font-size:13px;color:#4b5563}#mcsrvOv input{width:100%;box-sizing:border-box;padding:10px 12px;margin:0 0 8px;border:1px solid #d1d5db;border-radius:10px;font-size:15px}#mcsrvOv button{width:100%;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;font-size:15px;cursor:pointer}#mcsrvOv .er{color:#b91c1c;font-size:13px;min-height:18px;margin-bottom:6px}#mcsrvToast{position:fixed;left:50%;transform:translateX(-50%);bottom:48px;z-index:2147483100;background:#111827;color:#fff;padding:9px 14px;border-radius:10px;font:600 13px system-ui,sans-serif;max-width:90vw}';
    (document.head || document.documentElement).appendChild(s);
  }
  function pill() {
    if (!document.body) return; css();
    if (!pillEl) { pillEl = document.createElement('div'); pillEl.id = 'mcsrvPill'; pillEl.innerHTML = '<i></i><span></span>'; pillEl.addEventListener('click', function () { if (pillEl.classList.contains('new')) location.reload(); }); document.body.appendChild(pillEl); }
    var off = S.flags.dirty || S.flags.sseDown, who = S.me.staff || S.me.ops;
    pillEl.className = pillMsg ? 'new' : (off ? 'off' : '');
    pillEl.firstChild.nextSibling.textContent = pillMsg || (S.flags.dirty ? 'অফলাইন — সেভ বাকি, আবার চেষ্টা চলছে' : S.flags.sseDown ? 'সংযোগ নেই…' : 'সার্ভার সংযুক্ত' + (who ? ' · ' + who.name : ''));
  }
  function toast(m) { if (!document.body) return; css(); var t = document.getElementById('mcsrvToast') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'mcsrvToast' })); t.textContent = m; t.hidden = false; clearTimeout(S._tt); S._tt = setTimeout(function () { t.hidden = true; }, 3500); }
  S.toast = toast;
  function overlay(html) { css(); var o = document.getElementById('mcsrvOv'); if (!o) { o = document.createElement('div'); o.id = 'mcsrvOv'; document.body.appendChild(o); } o.innerHTML = '<div class="bx">' + html + '</div>'; return o; }
  function expired(must) {
    if (S.flags.expiredShown) return; S.flags.expiredShown = 1;
    if (must) { showMust(); return; }
    var go = function () {
      ['user', 'auth_token', 'user_role', 'user_access'].forEach(function (k) { try { nRem.call(NLS, k); nRem.call(NSS, k); } catch (e) { } }); try { nRem.call(NSS, 'mc_role'); } catch (e) { }
      var o = overlay('<h2>🔒 সেশন শেষ</h2><p>নিরাপত্তার জন্য আপনি লগআউট হয়েছেন (অনেকক্ষণ নিষ্ক্রিয় ছিলেন বা সেশনের সময় শেষ)। আবার লগইন করুন। যা সেভ হয়নি তা সার্ভারে যায়নি।</p><button id="mcsrvGo">লগইন পেজে যান</button>');
      o.querySelector('#mcsrvGo').onclick = function () { location.href = (/\/admin\//.test(location.pathname) ? '../' : '') + 'login.html'; };
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }
  function showMust() {
    var o = overlay('<h2>🔑 নতুন পাসওয়ার্ড দিন</h2><p>নিরাপত্তার জন্য প্রথমবার (বা অ্যাডমিন রিসেটের পর) পাসওয়ার্ড বদলাতে হবে। কমপক্ষে ৮ অক্ষর, ইমেইল/নাম ছাড়া, সহজ পাসওয়ার্ড (12345678, password) চলবে না।</p><input id="mpCur" type="password" placeholder="বর্তমান পাসওয়ার্ড" autocomplete="current-password"><input id="mpNew" type="password" placeholder="নতুন পাসওয়ার্ড" autocomplete="new-password"><input id="mpNew2" type="password" placeholder="নতুন পাসওয়ার্ড আবার" autocomplete="new-password"><div class="er" id="mpEr"></div><button id="mpGo">পাসওয়ার্ড বদলান</button>');
    var q = function (s) { return o.querySelector(s); };
    q('#mpGo').onclick = function () {
      var a = q('#mpCur').value, b = q('#mpNew').value; if (b !== q('#mpNew2').value) { q('#mpEr').textContent = 'দুইবার একই পাসওয়ার্ড দিন'; return; }
      areq('POST', '/api/me/password', { current: a, next: b, scope: S.me.staff ? 'staff' : 'ops' }).then(function (r) { if (r.status === 200) location.reload(); else q('#mpEr').textContent = (r.json && r.json.error) || 'হয়নি'; });
    };
    [q('#mpCur'), q('#mpNew'), q('#mpNew2')].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') q('#mpGo').click(); }); });
  }
  S.requirePasswordChange = showMust;

  /* ---------- লাইভ আপডেট (SSE) ---------- */
  function applyRemote(k, v, ver) {
    var old = lget(k); S.vers[k] = ver; S.base[k] = v; lset(k, v);
    try { window.dispatchEvent(new StorageEvent('storage', { key: k, oldValue: old, newValue: v, storageArea: NLS, url: location.href })); } catch (e) { }
    try { window.dispatchEvent(new CustomEvent('mcsrv:update', { detail: { key: k } })); } catch (e) { }
  }
  function onEvent(m) {
    if (!m || !m.key || !isSync(m.key)) return;
    if (S.authed && !S.must) {
      if (m.deleted) { lrem(m.key); delete S.vers[m.key]; delete S.base[m.key]; notifyNew(m.key); return; }
      if (m.ver <= (S.vers[m.key] || 0)) return;
      areq('GET', '/api/kv/' + m.key).then(function (r) { if (r.status === 200 && r.json && r.json.ver > (S.vers[m.key] || 0)) { applyRemote(m.key, r.json.v, r.json.ver); notifyNew(m.key); } });
    } else if (!S.authed && m.key === 'mc_db') {
      areq('GET', '/api/shop/catalog').then(function (r) {
        if (r.status !== 200 || !r.json || !r.json.v) return;
        var before = {}; mine().forEach(function (m) { if (m.order) before[m.no] = m.order.status; });
        var s = setCatalog(r.json); if (!s) return;
        mine().forEach(function (m) { if (m.order && before[m.no] && before[m.no] !== m.order.status) toast('📦 আপনার অর্ডার ' + m.no + ' এখন: ' + m.order.status); });
        var a = document.activeElement; if (typeof window.render === 'function' && !(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { try { window.render(); } catch (e) { } }
      });
    }
  }
  function notifyNew(key) { if (S.flags.dirty || (window.__mcLive && window.__mcLive[key])) return; pillMsg = '🔄 নতুন ডেটা এসেছে — ট্যাপ করে রিফ্রেশ'; pill(); }
  function startSSE() {
    if (!window.EventSource) return; var es = new EventSource('/api/events?cid=' + CID);
    es.onmessage = function (e) { var m = J(e.data); onEvent(m); };
    es.onopen = function () { if (S.flags.sseDown) { S.flags.sseDown = 0; pill(); } };
    es.onerror = function () { S.flags.sseDown = 1; pill(); };
  }
  function pollMe() {
    areq('GET', '/api/me').then(function (r) {
      if (r.status !== 200 || !r.json) return; var me = r.json.me || {};
      if ((S.me.staff && !me.staff) || (S.me.ops && !me.ops)) { expired(); }
    });
  }

  /* ---------- পেজ লোডের পর ---------- */
  function offerMigrate() {
    var n = Object.keys(migrate).filter(function (k) { return k !== 'pharmacy_loginlog'; });
    var ask = function (cb) {
      var msg = 'এই ব্রাউজারে আগের ডেমো-মোডের ডেটা আছে (' + n.length + 'টি তালিকা — ওষুধ, বিক্রি, কাস্টমার ইত্যাদি)। সেগুলো এখন সার্ভারের ডাটাবেসে তুলবেন?';
      if (window.MCD && MCD.choose) MCD.choose(msg, { title: '📦 পুরনো ডেটা সার্ভারে তুলুন', items: [{ label: 'হ্যাঁ, সার্ভারে তুলুন', value: 'yes' }, { label: 'না, ফেলে দিন (সার্ভার খালি থেকে শুরু)', value: 'no', danger: true }] }).then(cb);
      else cb(confirm(msg) ? 'yes' : 'no');
    };
    ask(function (ans) {
      if (ans === 'yes') {
        var okN = 0; n.forEach(function (k) { var v = migrate[k]; if (v == null) return; if (k === 'mc_db' && kv.mc_db) return; var r = req('PUT', '/api/kv/' + k, { value: v, base: S.vers[k] || 0, cid: CID }); if (r.status === 200) okN++; });
        toast(okN + 'টি তালিকা সার্ভারে উঠেছে'); setTimeout(function () { location.reload(); }, 900);
      } else if (ans === 'no') { lset('mc_srv_mig', 'no'); location.reload(); }
    });
  }
  function ready() {
    css(); pill();
    if (S.must && S.authed) showMust();
    if (migrate && !S.must) setTimeout(offerMigrate, 400);
    startSSE(); setInterval(pollMe, 60000);
    // শপ খালি থাকলে (প্রথমবার) ডেটা সার্ভারে বসানো
    if (S.authed && !S.must && S.noDb && lget('mc_db')) { var r = req('PUT', '/api/kv/mc_db', { value: lget('mc_db'), cid: CID }); if (r.status === 200) { S.vers.mc_db = r.json.ver; S.noDb = false; } }
    if (S.flags.noMap) fixHash();
    if (S.authed && !S.must && !/login\.html$/.test(location.pathname)) { var sc = document.createElement('script'); sc.src = '/assets/js/users-server.js'; document.body.appendChild(sc); }
  }
  function fixHash() { var h = location.hash.match(/^#\/success\/(.+)$/); if (h && S.flags.noMap && S.flags.noMap[decodeURIComponent(h[1])]) location.replace('#/success/' + S.flags.noMap[decodeURIComponent(h[1])]); }
  window.addEventListener('hashchange', function () { if (S.flags.noMap) fixHash(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

  /* ---------- অন্য স্ক্রিপ্টের জন্য ছোট API ---------- */
  S.post = function (path, body) { return req('POST', path, body); };
  S.get = function (path) { return req('GET', path); };
  S.apost = function (path, body) { return areq('POST', path, body); };
  S.aget = function (path) { return areq('GET', path); };
  S.areq = areq;
  S.logout = function (scope) { loggingOut(scope || 'staff'); };
  S.setStaffSession = function (user, remember) {
    ['user', 'auth_token', 'user_role', 'user_access'].forEach(function (k) { lrem(k); try { nRem.call(NSS, k); } catch (e) { } });
    var st = remember ? NLS : NSS; nSet.call(st, 'user', JSON.stringify(user)); nSet.call(st, 'auth_token', 'server-session'); nSet.call(st, 'user_role', user.role); nSet.call(st, 'user_access', JSON.stringify(user.access));
  };
  S.setOpsSession = function (u) { ['mc_role', 'mc_ops_name', 'mc_ops_start', 'mc_ops_last', 'mc_ops_lastuser'].forEach(function (k) { }); nSet.call(NSS, 'mc_role', u.role); nSet.call(NSS, 'mc_ops_name', u.name); nSet.call(NSS, 'mc_ops_start', String(Date.now())); nSet.call(NSS, 'mc_ops_last', String(Date.now())); };
})();

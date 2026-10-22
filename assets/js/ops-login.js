/* Operations Panel sign-in v60: user cards with what each role can do, optional personal PIN (set by the owner/admin in
   Control Center → 🔑 Sign-in; otherwise the shared demo code), failed-attempt lock-out with growing cool-down, sign-in log,
   login notice, show/hide, remembered user, "signed out because…" notices. Demo security only — everything is in this browser. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var WHAT = { Owner: 'সব ট্যাব: Dashboard, Products, Inventory, POS, Orders, Reports, Data (+Users, Settings)', Pharmacist: 'Dashboard, Orders — প্রেসক্রিপশন অনুমোদন/প্রত্যাখ্যান', Cashier: 'POS (বিক্রি) ও Orders', 'Inventory Manager': 'Dashboard, Products, Inventory — স্টক, ব্যাচ, মেয়াদ', 'Delivery Staff': 'শুধু Orders — ডেলিভারি আপডেট' };
  var ICON = { Owner: '👑', Pharmacist: '💊', Cashier: '🧾', 'Inventory Manager': '📦', 'Delivery Staff': '🛵' };
  var S = rj('pharmacy_settings', {}), MAX = Math.min(Math.max(+S.lockMax || 5, 3), 10), BASE = Math.min(Math.max(+S.lockBase || 30, 10), 600), PINS = S.opsPins || {};
  var users = db().users.filter(function (u) { return u.active; }), sel = null, timer = null;
  var ul = $('ul'), c = $('c');
  function lockKey(u) { return 'ops:' + u.id; }
  function lockOf(k) { return (rj('mc_lock', {})[k]) || { n: 0, until: 0, rounds: 0 }; }
  function setLock(k, v) { var m = rj('mc_lock', {}); if (v) m[k] = v; else delete m[k]; try { localStorage.setItem('mc_lock', JSON.stringify(m)); } catch (e) { } }
  function logEv(u, ok) { try { var L = rj('pharmacy_loginlog', []); L.push({ at: new Date().toISOString(), email: u.name + ' (Ops)', ok: ok, role: u.role, scope: 'ops' }); localStorage.setItem('pharmacy_loginlog', JSON.stringify(L.slice(-100))); } catch (e) { } }
  function pick(u) {
    sel = u; ul.querySelectorAll('.uc').forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-id') === u.id); n.querySelector('input').checked = n.getAttribute('data-id') === u.id; });
    var has = !!PINS[u.id]; $('cl').textContent = has ? 'PIN / আপনার পিন' : 'Demo code / ডেমো কোড'; c.value = ''; c.setAttribute('inputmode', has ? 'numeric' : 'text');
    $('ch').textContent = has ? 'আপনার ব্যক্তিগত PIN দিন।' : 'Demo code: demo — শুধু ডেমো, আসল নিরাপত্তা নয়। (Control Center → 🔑 Sign-in থেকে ব্যক্তিগত PIN দেওয়া যায়)';
    $('acc').textContent = u.role + ': ' + (WHAT[u.role] || '');
    var last = rj('pharmacy_loginlog', []).filter(function (e) { return e.scope === 'ops' && e.ok && e.email === u.name + ' (Ops)'; }).slice(-1)[0];
    $('last').textContent = last ? 'শেষ সফল লগইন: ' + new Date(last.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) : 'এই ব্রাউজারে এখনো লগইন নেই।';
    showLock();
  }
  function showLock() {
    clearInterval(timer); var box = $('lock'), btn = $('go'); if (!sel) return;
    function tick() { var l = lockOf(lockKey(sel)), left = Math.ceil((l.until - Date.now()) / 1000); if (left <= 0) { box.hidden = true; btn.disabled = false; clearInterval(timer); return; } box.hidden = false; box.textContent = '🔒 অনেকবার ভুল চেষ্টা হয়েছে। ' + left + ' সেকেন্ড পর আবার চেষ্টা করুন।'; btn.disabled = true; }
    tick(); timer = setInterval(tick, 1000);
  }
  users.forEach(function (u) {
    var lab = h('label', { class: 'uc', 'data-id': u.id }, h('input', { type: 'radio', name: 'u', value: u.id }), h('span', {}, h('b', {}, (ICON[u.role] || '👤') + ' ' + u.name), h('small', {}, u.role)), PINS[u.id] ? h('span', { class: 'pin', title: 'Personal PIN' }, '🔑 PIN') : null);
    lab.addEventListener('click', function () { pick(u); }); ul.append(lab);
  });
  $('eye').onclick = function () { c.type = c.type === 'password' ? 'text' : 'password'; };
  $('f').onsubmit = function (e) {
    e.preventDefault(); if (!sel) return toast('একজন ইউজার বেছে নিন', 1);
    var k = lockKey(sel), l = lockOf(k); if (l.until > Date.now()) { showLock(); return; }
    var u = sel, val = c.value.trim();
    var check = PINS[u.id] ? (window.MCPW ? MCPW.verify(val, PINS[u.id]) : Promise.resolve(false)) : Promise.resolve(val.toLowerCase() === 'demo');
    check.then(function (ok) {
      var fresh = db().users.find(function (x) { return x.id === u.id; }); if (ok && (!fresh || !fresh.active)) { toast('ইউজারটি নিষ্ক্রিয়', 1); return; }
      if (!ok) {
        l.n = (l.n || 0) + 1; logEv(u, false);
        if (l.n >= MAX) { l.rounds = (l.rounds || 0) + 1; l.until = Date.now() + Math.min(BASE * Math.pow(2, l.rounds - 1), 600) * 1000; l.n = 0; setLock(k, l); showLock(); return; }
        setLock(k, l); toast((PINS[u.id] ? 'ভুল PIN' : 'ভুল ডেমো কোড') + ' (' + (MAX - l.n) + ' বার চেষ্টা বাকি)', 1); c.select(); return;
      }
      setLock(k, null); logEv(u, true); sessionStorage.setItem('mc_role', u.role); sessionStorage.setItem('mc_ops_name', u.name); sessionStorage.setItem('mc_ops_start', String(Date.now())); sessionStorage.setItem('mc_ops_last', String(Date.now()));
      try { localStorage.setItem('mc_ops_lastuser', u.id); } catch (e) { } location.href = 'index.html';
    });
  };
  // notice + flash (idle sign-out etc.)
  var fl = null; try { fl = sessionStorage.getItem('mc_flash'); sessionStorage.removeItem('mc_flash'); } catch (e) { }
  var msg = fl || S.loginNotice; if (msg) { var n = $('notice'); n.hidden = false; n.textContent = (fl ? '⏱ ' : '📢 ') + msg; if (fl) n.className = 'alert warn'; }
  var lastId = localStorage.getItem('mc_ops_lastuser'), first = users.find(function (u) { return u.id === lastId; }) || users[0]; if (first) pick(first);
  c.focus();
})();

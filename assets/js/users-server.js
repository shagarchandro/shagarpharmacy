/* v69 — সার্ভার প্যানেল (শুধু সার্ভার মোডে, লগইন করা অবস্থায়): আমার অ্যাকাউন্ট (পাসওয়ার্ড/Admin PIN),
   ইউজার ম্যানেজমেন্ট, ব্যাকআপ/এক্সপোর্ট/ইম্পোর্ট/রিসেট, অডিট লগ। Admin/Owner ছাড়া শুধু "আমার অ্যাকাউন্ট" দেখা যায়। */
(function () {
  'use strict';
  var M = window.MCSRV; if (!M || !M.active || !(M.me.staff || M.me.ops) || M.must) return;
  var me = M.me.staff || M.me.ops, isAdm = me.role === 'admin' || me.role === 'Owner';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var css = '#mcsBtn{position:fixed;right:8px;bottom:8px;z-index:2147482900;border:0;border-radius:99px;padding:7px 11px;font:700 11px system-ui;background:#111827;color:#fff;opacity:.75;cursor:pointer}#mcsBtn:hover{opacity:1}'
    + '#mcsOv{position:fixed;inset:0;z-index:2147483300;background:rgba(15,23,42,.6);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}#mcsOv .bx{background:#fff;color:#111827;width:100%;max-width:640px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px}@media(min-width:700px){#mcsOv{align-items:center}#mcsOv .bx{border-radius:18px}}'
    + '#mcsOv h3{margin:0;font-size:17px}#mcsOv .tabs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}#mcsOv .tabs button{border:1px solid #d1d5db;background:#f9fafb;border-radius:99px;padding:6px 12px;font-size:13px;cursor:pointer}#mcsOv .tabs button.on{background:#2563eb;color:#fff;border-color:#2563eb}'
    + '#mcsOv input,#mcsOv select{padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;margin:2px 0;max-width:100%;box-sizing:border-box}#mcsOv .b{border:0;border-radius:8px;padding:7px 12px;background:#2563eb;color:#fff;font-weight:600;font-size:13px;cursor:pointer;margin:2px}#mcsOv .b.g{background:#e5e7eb;color:#111827}#mcsOv .b.d{background:#dc2626}'
    + '#mcsOv table{width:100%;border-collapse:collapse;font-size:13px}#mcsOv td,#mcsOv th{padding:6px 4px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}#mcsOv .m{color:#6b7280;font-size:12px}#mcsOv .ok{color:#15803d;font-size:13px}#mcsOv .er{color:#b91c1c;font-size:13px}#mcsOv .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var btn = document.createElement('button'); btn.id = 'mcsBtn'; btn.textContent = '🛡 সার্ভার'; btn.title = 'অ্যাকাউন্ট, ইউজার, ব্যাকআপ'; btn.onclick = open;
  function mount() { if (!document.body.contains(btn)) document.body.appendChild(btn); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  var ov, tab = 'acc', msg = '';
  function open() { ov = document.getElementById('mcsOv') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'mcsOv' })); ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; draw(); }
  function say(t, bad) { msg = '<div class="' + (bad ? 'er' : 'ok') + '">' + esc(t) + '</div>'; }
  function draw(body) {
    var T = [['acc', '👤 আমার অ্যাকাউন্ট'], ['ses', '🔐 সেশন']]; if (isAdm) T.push(['users', '👥 ইউজার'], ['bak', '💾 ব্যাকআপ'], ['aud', '📜 অডিট লগ']);
    ov.innerHTML = '<div class="bx"><div class="row" style="justify-content:space-between"><h3>🛡 সার্ভার প্যানেল</h3><button class="b g" data-x="close">✕</button></div><div class="m">লগইন: ' + esc(me.name) + ' · ' + esc(me.role) + '</div><div class="tabs">' + T.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="mcsBody">' + (body || '') + '</div>' + msg + '</div>';
    ov.querySelector('[data-x=close]').onclick = function () { ov.remove(); };
    ov.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tab = b.dataset.t; msg = ''; draw(); }; });
    if (!body) render();
  }
  function render() { ({ acc: accTab, ses: sesTab, users: usersTab, bak: bakTab, aud: audTab })[tab](); }
  function put(html) { ov.querySelector('#mcsBody').innerHTML = html; return ov.querySelector('#mcsBody'); }
  function pr(m, o) { return window.MCD && MCD.prompt ? MCD.prompt(m, o || {}) : Promise.resolve(window.prompt(m)); }
  function cf(m, o) { return window.MCD && MCD.confirm ? MCD.confirm(m, o || {}) : Promise.resolve(window.confirm(m)); }
  function $(s) { return ov.querySelector(s); }
  function accTab() {
    var b = put('<p class="m">পাসওয়ার্ড বদলান (৮+ অক্ষর, সহজ পাসওয়ার্ড চলবে না)।</p><div class="row"><input id="p0" type="password" placeholder="বর্তমান পাসওয়ার্ড"><input id="p1" type="password" placeholder="নতুন পাসওয়ার্ড"><button class="b" id="pgo">বদলান</button></div>'
      + (M.me.staff && M.me.staff.role === 'admin' ? '<hr><p class="m">Admin PIN (লগইনে দ্বিতীয় ধাপ, ৪–৮ সংখ্যা) — ' + (M.me.staff.hasPin ? '<b>চালু আছে</b>' : 'বন্ধ') + '</p><div class="row"><input id="q0" type="password" placeholder="পাসওয়ার্ড (নিশ্চিত করতে)"><input id="q1" type="password" inputmode="numeric" maxlength="8" placeholder="নতুন PIN (খালি = বন্ধ)"><button class="b" id="qgo">সেট করুন</button></div>' : ''));
    $('#pgo').onclick = function () { M.apost('/api/me/password', { current: $('#p0').value, next: $('#p1').value, scope: M.me.staff ? 'staff' : 'ops' }).then(function (r) { say(r.status === 200 ? 'পাসওয়ার্ড বদলেছে ✔ (অন্য ডিভাইস থেকে লগআউট হয়েছে)' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); }); };
    if ($('#qgo')) $('#qgo').onclick = function () { M.apost('/api/me/pin', { password: $('#q0').value, pin: $('#q1').value }).then(function (r) { if (r.status === 200) { M.me.staff.hasPin = r.json.hasPin; } say(r.status === 200 ? (r.json.hasPin ? 'PIN চালু ✔' : 'PIN বন্ধ ✔') : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); }); };
  }
  function usersTab() {
    put('<p class="m">লোড হচ্ছে…</p>'); M.aget('/api/users').then(function (r) {
      var us = (r.json && r.json.users) || [], rows = us.map(function (u) { return '<tr><td><b>' + esc(u.name) + '</b><div class="m">' + esc(u.email || ('Ops · ' + u.ext)) + '</div></td><td>' + esc(u.role) + (u.hasPin ? ' 🔑' : '') + '</td><td>' + (u.active ? '✅' : '⛔') + (u.mustChange ? ' <span class="m">পাসওয়ার্ড বদল বাকি</span>' : '') + '</td><td><button class="b g" data-a="tg" data-id="' + u.id + '">' + (u.active ? 'বন্ধ' : 'চালু') + '</button><button class="b g" data-a="rs" data-id="' + u.id + '">পাসওয়ার্ড রিসেট</button></td></tr>'; }).join('');
      var b = put('<table><tr><th>নাম</th><th>Role</th><th>অবস্থা</th><th></th></tr>' + rows + '</table><hr><b>নতুন ইউজার</b><div class="row"><select id="nu_s"><option value="staff">স্টাফ (Dashboard)</option><option value="ops">Ops Panel</option></select><input id="nu_n" placeholder="নাম"><input id="nu_e" placeholder="ইমেইল (স্টাফ)" type="email"><select id="nu_r"></select><input id="nu_p" type="password" placeholder="শুরুর পাসওয়ার্ড"><button class="b" id="nu_go">যোগ করুন</button></div><p class="m">নতুন ইউজার প্রথম লগইনে নিজের পাসওয়ার্ড বদলাতে বাধ্য হবে।</p>');
      var roles = { staff: ['pharmacist', 'staff', 'admin'], ops: ['Owner', 'Pharmacist', 'Cashier', 'Inventory Manager', 'Delivery Staff'] };
      function fillR() { $('#nu_r').innerHTML = roles[$('#nu_s').value].map(function (x) { return '<option>' + x + '</option>'; }).join(''); $('#nu_e').style.display = $('#nu_s').value === 'staff' ? '' : 'none'; } $('#nu_s').onchange = fillR; fillR();
      $('#nu_go').onclick = function () { M.apost('/api/users', { scope: $('#nu_s').value, name: $('#nu_n').value, email: $('#nu_e').value, role: $('#nu_r').value, password: $('#nu_p').value }).then(function (r) { say(r.status === 200 ? 'ইউজার যোগ হয়েছে ✔' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); }); };
      b.querySelectorAll('[data-a]').forEach(function (x) {
        x.onclick = function () {
          var u = us.filter(function (y) { return String(y.id) === x.dataset.id; })[0];
          if (x.dataset.a === 'tg') M.areq('PATCH', '/api/users/' + u.id, { active: !u.active }).then(function (r) { say(r.status === 200 ? 'হয়েছে ✔' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); });
          else pr(u.name + '-এর জন্য নতুন (সাময়িক) পাসওয়ার্ড দিন:', { title: 'পাসওয়ার্ড রিসেট', type: 'password' }).then(function (p) { if (!p) return; M.apost('/api/users/' + u.id + '/reset', { password: p }).then(function (r) { say(r.status === 200 ? 'রিসেট হয়েছে — পরের লগইনে বদলাতে হবে ✔' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); }); });
        };
      });
    });
  }
  function ago(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'এইমাত্র' : m < 60 ? m + ' মি. আগে' : m < 1440 ? Math.round(m / 60) + ' ঘণ্টা আগে' : Math.round(m / 1440) + ' দিন আগে'; }
  function devOf(ua) { ua = ua || ''; return (/Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'ডিভাইস') + ' · ' + (/Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'ব্রাউজার'); }
  function sesTab() {
    put('<p class="m">লোড হচ্ছে…</p>'); M.aget('/api/sessions').then(function (r) {
      var l = (r.json && r.json.sessions) || [];
      var b = put('<p class="m">যেসব ডিভাইসে লগইন আছে। অচেনা কিছু দেখলে "বের করুন" চাপুন, তারপর পাসওয়ার্ড বদলান।</p><table>' + l.map(function (x) { return '<tr><td><b>' + esc(x.name) + '</b> <span class="m">' + esc(x.role) + (x.scope === 'ops' ? ' · Ops' : '') + '</span><div class="m">' + esc(devOf(x.ua)) + ' · ' + esc(x.ip) + '</div></td><td class="m">' + ago(x.last) + '</td><td>' + (x.current ? '<span class="ok">এই ডিভাইস</span>' : '<button class="b d" data-id="' + x.id + '">বের করুন</button>') + '</td></tr>'; }).join('') + '</table><div class="row"><button class="b g" id="ses_all">আমার অন্য সব ডিভাইস থেকে লগআউট</button></div>');
      b.querySelectorAll('button[data-id]').forEach(function (x) { x.onclick = function () { M.apost('/api/sessions/revoke', { id: x.dataset.id }).then(function () { say('বের করে দেওয়া হয়েছে ✔'); draw(); }); }; });
      $('#ses_all').onclick = function () { M.apost('/api/sessions/revoke', { all: true }).then(function (r) { say((r.json && r.json.revoked || 0) + 'টি ডিভাইস লগআউট ✔'); draw(); }); };
    });
  }
  function fmtB(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.ceil(n / 1024) + ' KB'; }
  function bakTab() {
    put('<p class="m">লোড হচ্ছে…</p>'); M.aget('/api/backups').then(function (r) {
      var l = (r.json && r.json.backups) || [];
      var b = put('<div class="row"><button class="b" id="bk_new">এখনই ব্যাকআপ নিন</button><a class="b g" style="text-decoration:none" href="/api/export" download>⬇ JSON এক্সপোর্ট</a><label class="b g">⬆ JSON ইম্পোর্ট<input id="bk_imp" type="file" accept=".json" hidden></label><button class="b d" id="bk_rs">⚠ সব ডেটা রিসেট</button></div><p class="m">প্রতিদিন নিজে থেকে ব্যাকআপ হয় (data/backups, শেষ ১৪টি)। ইম্পোর্ট/রিসেটের আগে নিজে থেকে সেফটি ব্যাকআপ হয়।</p><table>' + l.slice(0, 20).map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + fmtB(x.size) + '</td><td><a href="/api/backups/download?name=' + encodeURIComponent(x.name) + '">⬇</a> <button class="b g" data-rs="' + esc(x.name) + '">রিস্টোর</button></td></tr>'; }).join('') + '</table>');
      b.querySelectorAll('[data-rs]').forEach(function (x) { x.onclick = function () { cf(x.dataset.rs + ' থেকে ডেটা ফিরিয়ে আনবেন? এখনকার ডেটা এর সাথে বদলে যাবে (আগে নিজে থেকে সেফটি ব্যাকআপ হবে)।', { title: 'ব্যাকআপ রিস্টোর', danger: true }).then(function (yes) { if (!yes) return; M.apost('/api/backups/restore', { name: x.dataset.rs }).then(function (r) { say(r.status === 200 ? r.json.restored + 'টি তালিকা ফিরেছে ✔ — রিলোড হচ্ছে' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); if (r.status === 200) setTimeout(function () { location.reload(); }, 1200); }); }); }; });
      $('#bk_new').onclick = function () { M.apost('/api/backups', {}).then(function (r) { say(r.status === 200 ? 'ব্যাকআপ হয়েছে ✔ ' + r.json.name : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); }); };
      $('#bk_imp').onchange = function (e) { var f = e.target.files[0]; if (!f) return; cf('এই ফাইলের ডেটা সার্ভারের বর্তমান ডেটার উপর বসবে। (আগে নিজে থেকে ব্যাকআপ হবে) এগিয়ে যাবেন?', { title: 'ইম্পোর্ট', danger: true }).then(function (yes) { if (!yes) return; f.text().then(function (t) { var j; try { j = JSON.parse(t); } catch (x) { say('ফাইলটি JSON নয়', 1); draw(); return; } M.apost('/api/import', j).then(function (r) { say(r.status === 200 ? r.json.imported + 'টি তালিকা ইম্পোর্ট হয়েছে ✔ — পেজ রিলোড হচ্ছে' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); if (r.status === 200) setTimeout(function () { location.reload(); }, 1200); }); }); }); };
      $('#bk_rs').onclick = function () { pr('সব ডেটা মুছে যাবে (আগে সেফটি ব্যাকআপ হবে)। নিশ্চিত করতে RESET লিখুন:', { title: '⚠ সব ডেটা রিসেট' }).then(function (c) { if (c !== 'RESET') return; M.apost('/api/reset', { confirm: 'RESET' }).then(function (r) { say(r.status === 200 ? 'রিসেট হয়েছে ✔ — পেজ রিলোড হচ্ছে' : (r.json && r.json.error) || 'হয়নি', r.status !== 200); draw(); if (r.status === 200) setTimeout(function () { location.reload(); }, 1200); }); }); };
    });
  }
  function audTab() {
    put('<p class="m">লোড হচ্ছে…</p>'); M.aget('/api/audit').then(function (r) {
      put('<table>' + ((r.json && r.json.audit) || []).slice(0, 120).map(function (a) { return '<tr><td class="m">' + esc(new Date(a.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })) + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.action) + '<div class="m">' + esc(a.detail) + '</div></td></tr>'; }).join('') + '</table>');
    });
  }
  M.openPanel = open;
  /* পুরনো ডেমো-ইউজার UI সার্ভার মোডে অকার্যকর — সার্ভার প্যানেলের দিকে দেখিয়ে দিই */
  function notice(extra) { var d = document.createElement('div'); d.style.cssText = 'margin:8px;padding:10px 12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font:13px system-ui'; d.innerHTML = '🛡 <b>সার্ভার মোড চালু।</b> ' + extra + ' <button class="b" style="margin-left:6px">সার্ভার প্যানেল খুলুন</button>'; d.querySelector('button').onclick = open; return d; }
  window.addEventListener('load', function () {
    try { if (typeof V !== 'undefined' && V && V.users && typeof h === 'function') V.users = function () { return h('div', {}, h('h2', {}, 'ইউজার ও পাসওয়ার্ড'), notice('ইউজার যোগ/বন্ধ, পাসওয়ার্ড রিসেট ও PIN এখন সার্ভারে — এখান থেকে ম্যানেজ করুন।')); }; } catch (e) { }
    if (/admin-center\.html$/.test(location.pathname)) { var m = document.querySelector('main') || document.body; m.insertBefore(notice('Accounts / Sign-in ট্যাবের ডেমো-সেটিং এখন কাজ করে না; ইউজার, পাসওয়ার্ড ও Admin PIN সার্ভার প্যানেলে।'), m.firstChild); }
  });
})();

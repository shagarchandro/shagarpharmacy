/* v71 — Control Center: "🖥 Server" ট্যাব (শুধু সার্ভার মোডে): সার্ভারের অবস্থা, নিরাপত্তা চেকলিস্ট, ডেটার আকার,
   লাইভ সেশন, ইউজার। সার্ভার মোডে পুরনো ডেমো "Accounts / Sign-in" ট্যাব সার্ভার প্যানেলের দিকে নির্দেশ করে। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  window.CCX = function (c) {
    var x = prev(c), M = window.MCSRV; if (!M || !M.active || !(M.me.staff || M.me.ops)) return x;
    var h = c.h, tbl = c.tbl, btn = c.btn;
    function sz(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n > 1024 ? Math.round(n / 1024) + ' KB' : n + ' B'; }
    function up(s) { var d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + ' দিন ' : '') + (hh ? hh + ' ঘণ্টা ' : '') + m + ' মিনিট'; }
    function when(t) { return t ? new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour12: false }) : '—'; }
    function open() { if (M.openPanel) M.openPanel(); }
    function note(extra) { return h('div', { class: 'cc-card' }, h('h2', {}, '🛡 সার্ভার মোড চালু'), h('p', {}, extra), h('div', { class: 'row' }, btn('সার্ভার প্যানেল খুলুন', open, 'btn'), btn('🖥 Server ট্যাব', function () { c.show('server'); }))); }
    x.panels.server = function () {
      var box = h('div', {}, h('h2', {}, '🖥 Server'), h('p', { class: 'muted' }, 'লোড হচ্ছে…'));
      Promise.all([M.aget('/api/status'), M.aget('/api/users'), M.aget('/api/sessions')]).then(function (r) {
        var st = r[0].json, us = (r[1].json || {}).users || [], ss = (r[2].json || {}).sessions || [];
        if (r[0].status !== 200 || !st) { box.replaceChildren(h('h2', {}, '🖥 Server'), h('p', { class: 'bad' }, 'শুধু Admin/Owner দেখতে পারেন।')); return; }
        var age = st.lastBackup ? (Date.now() - st.lastBackup) / 3600e3 : 1e9, defaults = us.filter(function (u) { return u.active && u.mustChange; });
        var chk = [
          [age < 48, 'ব্যাকআপ সাম্প্রতিক (' + (st.lastBackup ? when(st.lastBackup) : 'কোনো ব্যাকআপ নেই') + ')', 'প্যানেল → ব্যাকআপ → "এখনই ব্যাকআপ নিন"'],
          [!defaults.length, defaults.length ? defaults.length + 'টি অ্যাকাউন্টে পাসওয়ার্ড বদল বাকি (ডিফল্ট/রিসেট): ' + defaults.slice(0, 4).map(function (u) { return u.name; }).join(', ') : 'সব অ্যাকাউন্টে নিজস্ব পাসওয়ার্ড', 'ওই ইউজাররা পরের লগইনে বদলাতে বাধ্য'],
          [!st.adminsNoPin, st.adminsNoPin ? st.adminsNoPin + 'জন Admin-এর PIN নেই' : 'সব Admin-এর PIN আছে', 'প্যানেল → আমার অ্যাকাউন্ট → PIN'],
          [st.https || st.host === '127.0.0.1', st.https ? 'HTTPS চালু' : st.host === '127.0.0.1' ? 'শুধু এই কম্পিউটার থেকে খোলা (নিরাপদ)' : 'নেটওয়ার্কে খোলা কিন্তু HTTPS নেই', 'README → HTTPS'],
          [st.dbSize < 200 * 1048576, 'ডাটাবেস আকার ' + sz(st.dbSize), 'খুব বড় হলে পুরনো ডেটা এক্সপোর্ট করে আর্কাইভ করুন']
        ];
        var total = st.keys.reduce(function (a, k) { return a + k.bytes; }, 0);
        box.replaceChildren(h('h2', {}, '🖥 Server'),
          h('div', { class: 'cc-two' },
            h('div', { class: 'cc-card' }, h('h3', {}, 'অবস্থা'), h('table', {}, h('tbody', {}, [['চালু আছে', up(st.uptimeSec)], ['Node', st.node], ['ঠিকানা', (st.https ? 'https' : 'http') + '://' + st.host + ':' + st.port], ['ডাটাবেস ফাইল', sz(st.dbSize)], ['সক্রিয় ইউজার', st.users], ['লগইন সেশন', st.sessions], ['লাইভ সংযুক্ত ব্রাউজার', st.clients], ['ব্যাকআপ', st.backups + 'টি · শেষ ' + when(st.lastBackup)]].map(function (r) { return h('tr', {}, h('td', {}, r[0]), h('td', {}, String(r[1]))); }))), h('div', { class: 'row' }, btn('↻ রিফ্রেশ', function () { c.show('server'); }), btn('🛡 সার্ভার প্যানেল', open, 'btn'))),
            h('div', { class: 'cc-card' }, h('h3', {}, 'নিরাপত্তা চেকলিস্ট'), h('ul', {}, chk.map(function (k) { return h('li', { class: k[0] ? 'ok' : 'bad' }, (k[0] ? '✔ ' : '⚠ ') + k[1], k[0] ? null : h('div', { class: 'muted' }, k[2])); })))),
          h('div', { class: 'cc-card' }, h('h3', {}, 'ডেটা কোথায় কতটা (মোট ' + sz(total) + ')'), tbl(['ডেটা', 'আকার', 'ভার্সন', 'শেষ বদল', 'কে'], st.keys.slice(0, 12).map(function (k) { return h('tr', {}, h('td', {}, k.key), h('td', {}, sz(k.bytes)), h('td', {}, String(k.ver)), h('td', {}, when(k.updated)), h('td', {}, k.by || '')); }), 'কিছু নেই')),
          h('div', { class: 'cc-card' }, h('h3', {}, 'এখন লগইন আছে (' + ss.length + ')'), tbl(['কে', 'Role', 'IP', 'শেষ সক্রিয়'], ss.map(function (s) { return h('tr', {}, h('td', {}, s.name + (s.current ? ' (আপনি)' : '')), h('td', {}, s.role + (s.scope === 'ops' ? ' · Ops' : '')), h('td', {}, s.ip || ''), h('td', {}, when(s.last))); }), 'কেউ নেই')),
          h('div', { class: 'cc-card' }, h('h3', {}, 'ইউজার (' + us.length + ')'), tbl(['নাম', 'Role', 'অবস্থা', 'শেষ লগইন', 'PIN'], us.map(function (u) { return h('tr', {}, h('td', {}, u.name + (u.email ? ' · ' + u.email : '')), h('td', {}, u.role + (u.scope === 'ops' ? ' · Ops' : '')), h('td', { class: u.active ? 'ok' : 'bad' }, u.active ? 'সক্রিয়' : 'বন্ধ'), h('td', {}, when(u.lastLogin)), h('td', {}, u.hasPin ? '🔑' : '')); }), 'কেউ নেই'), h('p', { class: 'muted' }, 'যোগ/বন্ধ/পাসওয়ার্ড রিসেট করতে "সার্ভার প্যানেল" খুলুন।')));
      });
      return box;
    };
    x.panels.accounts = function () { return note('সার্ভার মোডে লগইন-অ্যাকাউন্ট সার্ভারের ডাটাবেসে — যোগ/বন্ধ/পাসওয়ার্ড রিসেট সার্ভার প্যানেল থেকে। (এখানকার পুরনো ডেমো-তালিকা কাজ করে না।)'); };
    x.panels.signin = function () {
      var L = (c.rj('pharmacy_loginlog', []) || []).slice().reverse(), fails = L.filter(function (e) { return !e.ok; }).length;
      return h('div', {}, note('Admin PIN ও পাসওয়ার্ড এখন সার্ভারে যাচাই হয় — সার্ভার প্যানেল → আমার অ্যাকাউন্ট থেকে বদলান। লগইন-লক (সংখ্যা/সময়) Security ট্যাবে।'),
        h('div', { class: 'cc-card' }, h('h3', {}, 'সাম্প্রতিক লগইন (সার্ভারের রেকর্ড · ' + L.length + ' · ব্যর্থ ' + fails + ')'), tbl(['কখন', 'কে', 'কোথায়', 'ফল'], L.slice(0, 50).map(function (e) { return h('tr', {}, h('td', {}, when(e.at)), h('td', {}, e.email || '—'), h('td', {}, (e.scope === 'ops' ? 'Ops Panel' : 'Staff') + (e.role ? ' · ' + e.role : '') + (e.ip ? ' · ' + e.ip : '')), h('td', { class: e.ok ? 'ok' : 'bad' }, e.ok ? '✔ সফল' : '✖ ব্যর্থ')); }), 'এখনো কিছু নেই')));
    };
    x.tabs.unshift(['server', '🖥 Server']);
    return x;
  };
})();

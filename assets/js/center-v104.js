/* v104 — Control Center → ☢️ সব ডাটা রিসেট: এক ক্লিকে (কিন্তু বহু-স্তরের সুরক্ষায়) সব ডাটা মোছা।
   • কী কী মুছবে তার গণনাসহ লাল সতর্কতা  • বাধ্যতামূলক পূর্ণ ব্যাকআপ ডাউনলোড (backup.html দিয়ে ফেরত-নেওয়া যায়)
   • দুটি টিক + "RESET ALL DATA" লেখা + Admin পাসওয়ার্ড (+PIN থাকলে PIN)  • ৫ সেকেন্ড কাউন্টডাউন (মাঝপথে বাতিল)
   • রিসেটের আগে ব্রাউজারে "রিস্টোর পয়েন্ট" (জায়গা থাকলে) — প্যানেল থেকে "রিসেট বাতিল"
   • মোড: ব্যবসার ডাটা (ডিফল্ট) / সাথে অ্যাকাউন্ট-পাসওয়ার্ড / সেটিংস-রোল-ডিজাইন / অডিট ট্রেইল — আলাদা বেছে নেওয়া যায়
   • রিসেটের পর: একদম খালি শুরু, অথবা ডেমো ডেটা ফিরিয়ে আনা  • সার্ভার মোডে সার্ভারের ডাটাবেসও (আগে সেফটি ব্যাকআপ সার্ভার নিজেই নেয়) */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var PHRASE = 'RESET ALL DATA';
  var KEEP = /^(mc_session_start|mc_started|mc_restorepoint|mc_resetpoint|pharmacy_lastbackup|mc_lastbackup|pharmacy_resetlog)$/;
  var G_ACC = /^(pharmacy_creds|pharmacy_accounts|pharmacy_loginlog|mc_lock|pharmacy_pins|pharmacy_pwat|mc_pw_warn)$/;
  var G_SET = /^(pharmacy_settings|pharmacy_roles|mc_acc|pharmacy_theme|pharmacy_site|pharmacy_site_hist|pharmacy_v98prefs|mc_inv_paper|pharmacy_.*prefs.*)$/;
  var G_AUD = /^pharmacy_audit$/;
  var LBL = { mc_db: 'শপ ও Ops Panel (পণ্য, ব্যাচ, অর্ডার, কুপন…)', pharmacy_medicines: 'ওষুধ (ড্যাশবোর্ড)', pharmacy_customers: 'কাস্টমার', pharmacy_suppliers: 'সাপ্লায়ার', pharmacy_purchases: 'ক্রয়', pharmacy_purchase_returns: 'ক্রয় ফেরত', pharmacy_prescriptions: 'প্রেসক্রিপশন', pharmacy_sales: 'POS বিক্রি', pharmacy_shifts: 'ক্লোজ করা শিফট', pharmacy_held: 'হোল্ড বিল', pharmacy_customer_ledger: 'কাস্টমার বাকি-খাতা', pharmacy_riders: 'রাইডার' };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function allKeys() { var k = []; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (/^(pharmacy_|mc_)/.test(n) && !KEEP.test(n)) k.push(n); } return k.sort(); }
  function grp(k) { return G_ACC.test(k) ? 'acc' : G_SET.test(k) ? 'set' : G_AUD.test(k) ? 'aud' : 'biz'; }
  function cnt(k) { var v = rj(k, null); if (Array.isArray(v)) return v.length; if (k === 'mc_db' && v) { return ['products', 'orders', 'batches'].map(function (x) { return (v[x] || []).length + ' ' + x; }).join(' · '); } if (v && typeof v === 'object') return Object.keys(v).length + ' টি এন্ট্রি'; return v == null ? 0 : 1; }
  function sz(k) { return ((k.length + (localStorage.getItem(k) || '').length) * 2); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function css() {
    if (document.getElementById('v104css')) return; var s = document.createElement('style'); s.id = 'v104css';
    s.textContent = '.v104w{border:3px solid #c0261c;border-radius:16px;background:linear-gradient(180deg,rgba(192,38,28,.10),transparent 60%);padding:1.1rem 1.2rem;margin-bottom:1rem}' +
      '.v104w h2{margin:.1rem 0 .4rem;color:#c0261c;font-size:1.35rem}.v104w ul{margin:.4rem 0 .4rem 1.1rem;padding:0}.v104w li{margin:.18rem 0}' +
      '.v104g{display:grid;gap:.45rem;margin:.6rem 0}.v104g .it{display:flex;gap:.5rem;align-items:center;padding:.4rem .6rem;border:1px solid var(--br);border-radius:10px;background:var(--card)}' +
      '.v104g .it.ok{border-color:#2e9e5b}.v104g .it .ic{font-weight:800;width:1.4rem;text-align:center}.v104g .it.ok .ic{color:#2e9e5b}.v104g .it:not(.ok) .ic{color:#c0261c}' +
      '.v104go{background:#c0261c!important;color:#fff!important;border-color:#c0261c!important;font-weight:800;padding:.75rem 1.2rem!important;font-size:1.05rem}.v104go[disabled]{opacity:.35;cursor:not-allowed}' +
      '.v104bar{height:10px;border-radius:99px;background:rgba(192,38,28,.2);overflow:hidden;margin:.5rem 0}.v104bar i{display:block;height:100%;width:0;background:#c0261c;transition:width 1s linear}';
    document.head.appendChild(s);
  }
  function el(tag, p, kids) {
    var e = document.createElement(tag); p = p || {};
    Object.keys(p).forEach(function (k) { if (k === 'style') e.style.cssText = p[k]; else if (k === 'class') e.className = p[k]; else if (/^on/.test(k)) e.addEventListener(k.slice(2), p[k]); else if (k in e) e[k] = p[k]; else e.setAttribute(k, p[k]); });
    [].concat(kids == null ? [] : kids).forEach(function (k) { if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k))); }); return e;
  }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function isAdmin() { var u = user(); return u.role === 'admin' && !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')); }
  function verifyAdmin(pw) {
    var u = user(), em = String(u.email || '').toLowerCase(), DEF = { 'admin@medicare.com': 'admin123' };
    var cu = rj('pharmacy_accounts', []).filter(function (a) { return String(a.email).toLowerCase() === em; })[0], creds = rj('pharmacy_creds', {});
    if (!window.MCPW) return Promise.resolve(DEF[em] != null && pw === DEF[em]);
    if (cu && cu.hash) return MCPW.verify(pw, cu.hash);
    if (creds[em]) return MCPW.verify(pw, creds[em]);
    return Promise.resolve(DEF[em] != null && pw === DEF[em]);
  }

  window.CCX = function (c) {
    var x = prev(c), rjc = c.rj;
    x.panels.reset = function () {
      css();
      var root = el('div', {}), srv = !!(window.MCSRV && MCSRV.active), keys = allKeys(), last = rjc('pharmacy_resetlog', null), pt = rj('mc_resetpoint', null);
      var by = isAdmin() ? (user().name || 'Admin') : 'Owner';
      var st = { backup: false, a1: false, a2: false, phrase: false, pw: !isAdmin(), pin: true };   // Owner: পাসওয়ার্ড-ধাপ নেই
      var S = rjc('pharmacy_settings', {}), needPin = isAdmin() && !!S.adminPin; st.pin = !needPin;
      var biz = keys.filter(function (k) { return grp(k) === 'biz'; });
      if (last) root.append(el('p', { class: 'muted' }, '🕘 শেষ রিসেট: ' + new Date(last.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }) + ' · ' + last.by + ' · ' + last.mode));
      if (pt && pt.data) root.append(el('div', { class: 'cc-card', style: 'border-color:#e8a317;margin-bottom:1rem' }, [el('b', {}, '↩ রিসেট বাতিল করা যাবে'), el('p', { class: 'muted' }, 'রিসেটের আগের কপি এই ব্রাউজারে রাখা আছে (' + new Date(pt.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }) + ')। পরের রিসেটে এটি বদলে যাবে।'),
        el('button', { type: 'button', class: 'btn2', onclick: function () {
          if (!confirm('রিসেটের আগের সব ডাটা ফিরিয়ে আনবেন? এখনকার ডাটা বদলে যাবে।')) return;
          Object.keys(pt.data).forEach(function (k) { try { localStorage.setItem(k, pt.data[k]); } catch (e) { } }); localStorage.removeItem('mc_resetpoint');
          try { c.audit('Reset undone (restored ' + Object.keys(pt.data).length + ' keys)'); } catch (e) { } c.ok('ডাটা ফিরে এসেছে'); c.show('reset');
        } }, '↩ রিসেট বাতিল করুন')]));
      /* ---- সতর্কতা ---- */
      var tot = biz.reduce(function (a, k) { return a + sz(k); }, 0);
      var warn = el('div', { class: 'v104w', role: 'alert' }, [
        el('h2', {}, '☢️ চরম সতর্কতা — সব ডাটা মুছে যাবে'),
        el('p', { style: 'margin:.2rem 0;font-weight:700' }, 'এটি ফেরানো যায় না (ডাউনলোড-করা ব্যাকআপ ফাইল ছাড়া)। বিক্রি, স্টক, কাস্টমার, অর্ডার, হিসাব — সব শূন্য হয়ে যাবে।'),
        el('ul', {}, [
          el('li', {}, 'মুছবে: ' + biz.length + ' ধরনের ব্যবসায়িক ডাটা (প্রায় ' + kb(tot) + ') — নিচের তালিকায় সব দেখুন।'),
          el('li', {}, 'আজকের বিক্রি, ক্যাশ ক্লোজিং, বাকি-খাতা, ক্রয়, প্রেসক্রিপশন ও রিপোর্টের সব ইতিহাস হারাবে।'),
          el('li', {}, 'অনলাইন শপের পণ্য-ব্যাচ-অর্ডার মুছলে গ্রাহকের চলমান অর্ডারও হারাবে — আগে সব অর্ডার ডেলিভারি/বাতিল করে নিন।'),
          el('li', {}, 'এই ব্রাউজারের ডাটাই মুছবে; অন্য ডিভাইস/ব্রাউজারের আলাদা কপি থাকলে সেগুলো আলাদা থাকবে।'),
          srv ? el('li', { style: 'color:#c0261c;font-weight:700' }, '🖥 সার্ভার মোড: সার্ভারের ডাটাবেসের সব সিঙ্ক-ডাটাও মুছবে (সার্ভার আগে নিজে একটি সেফটি ব্যাকআপ নেবে)। নিচের নির্বাচন এখানে কাজ করবে না — সব সিঙ্ক-ডাটা যাবে।') : null])]);
      root.append(warn);
      /* ---- কী মুছবে ---- */
      var opt = {}, optBox = el('div', { class: 'cc-card', style: 'margin-bottom:1rem' });
      function chk(id, label, hint, on, dis) { var i = el('input', { type: 'checkbox', checked: on, disabled: !!dis }); opt[id] = i; return el('label', { style: 'display:flex;gap:.5rem;align-items:flex-start;margin:.35rem 0' }, [i, el('span', {}, [el('b', {}, label), ' — ', el('span', { class: 'muted' }, hint)])]); }
      var nAcc = keys.filter(function (k) { return grp(k) === 'acc'; }).length, nSet = keys.filter(function (k) { return grp(k) === 'set'; }).length, au = rjc('pharmacy_audit', []).length;
      optBox.append(el('h3', {}, '১) কী কী মুছবেন'),
        chk('biz', '🗂 ব্যবসার সব ডাটা', 'পণ্য, ওষুধ, কাস্টমার, সাপ্লায়ার, বিক্রি, ক্রয়, অর্ডার, প্রেসক্রিপশন… (' + biz.length + ' ধরন)', true, true),
        chk('acc', '👥 অ্যাকাউন্ট ও পাসওয়ার্ড', 'তৈরি-করা অ্যাকাউন্ট, বদলানো পাসওয়ার্ড, লগইন লগ (' + nAcc + ') — মুছলে ডিফল্ট লগইন (admin123…) ফিরবে', false, srv),
        chk('set', '⚙️ সেটিংস, রোল ও ডিজাইন', 'রোল-অনুমতি, ছাড়ের সীমা, Branding, Site Studio, Store ও Invoice সেটিংস (' + nSet + ')', false, srv),
        chk('aud', '📜 অডিট ট্রেইল', 'কে কী বদলেছে তার লগ (' + au + ' টি) — সাধারণত রেখে দেওয়াই ভালো', false, srv));
      var modeSel = el('select', {}, [el('option', { value: 'empty' }, 'একদম খালি থেকে শুরু (নিজের ডাটা বসাব)'), el('option', { value: 'demo' }, 'ডেমো ডাটা ফিরিয়ে আনুন (ফ্যাক্টরি অবস্থা)')]);
      optBox.append(el('label', { style: 'display:flex;flex-direction:column;gap:.25rem;margin-top:.6rem' }, ['রিসেটের পর অবস্থা', modeSel]),
        el('button', { type: 'button', class: 'btn2', style: 'margin-top:.6rem', onclick: function () { ['acc', 'set', 'aud'].forEach(function (k) { if (!opt[k].disabled) opt[k].checked = true; }); modeSel.value = 'demo'; refresh(); } }, '🏭 সম্পূর্ণ ফ্যাক্টরি রিসেট বেছে নিন (সব কিছু)'));
      var det = el('details', { style: 'margin-top:.8rem' }, [el('summary', { style: 'cursor:pointer' }, 'মুছতে যাওয়া সব ডাটার তালিকা দেখুন (' + keys.length + ')'),
        el('div', { class: 'scroll' }, el('table', {}, [el('thead', {}, el('tr', {}, ['ডাটা', 'ধরন', 'রেকর্ড', 'সাইজ'].map(function (t) { return el('th', {}, t); }))),
          el('tbody', {}, keys.map(function (k) { var g = grp(k); return el('tr', {}, [el('td', {}, LBL[k] ? LBL[k] + ' (' + k + ')' : k), el('td', {}, { biz: '🗂 ব্যবসা', acc: '👥 অ্যাকাউন্ট', set: '⚙️ সেটিংস', aud: '📜 অডিট' }[g]), el('td', {}, String(cnt(k))), el('td', {}, kb(sz(k)))]); }))]))]);
      optBox.append(det); root.append(optBox);
      /* ---- গেট ---- */
      var gate = el('div', { class: 'cc-card', style: 'margin-bottom:1rem' }), list = el('div', { class: 'v104g' });
      var bkBtn = el('button', { type: 'button', class: 'btn', onclick: function () {
        var d = {}; allKeys().forEach(function (k) { d[k] = localStorage.getItem(k); });
        var blob = new Blob([JSON.stringify({ app: 'medicare', at: new Date().toISOString(), by: by, note: 'pre-reset full backup', data: d }, null, 2)], { type: 'application/json' }), a = el('a', { href: URL.createObjectURL(blob), download: 'medicare-FULL-backup-before-reset-' + new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json' });
        document.body.append(a); a.click(); a.remove(); st.backup = true; try { localStorage.setItem('pharmacy_lastbackup', new Date().toISOString()); } catch (e) { } refresh(); c.ok('ব্যাকআপ ডাউনলোড শুরু হয়েছে — ফাইলটি নিরাপদ জায়গায় রাখুন');
      } }, '⬇ পূর্ণ ব্যাকআপ ডাউনলোড করুন');
      var ack1 = el('input', { type: 'checkbox', onchange: function () { st.a1 = ack1.checked; refresh(); } }), ack2 = el('input', { type: 'checkbox', onchange: function () { st.a2 = ack2.checked; refresh(); } });
      var ph = el('input', { type: 'text', placeholder: PHRASE, autocomplete: 'off', spellcheck: false, style: 'width:100%;font-family:monospace', oninput: function () { st.phrase = ph.value.trim() === PHRASE; refresh(); } });
      var pw = el('input', { type: 'password', placeholder: 'আপনার Admin পাসওয়ার্ড', autocomplete: 'off', style: 'width:100%', oninput: function () { clearTimeout(pw._t); pw._t = setTimeout(function () { verifyAdmin(pw.value).then(function (ok) { st.pw = ok; refresh(); }); }, 300); } });
      var pin = el('input', { type: 'password', placeholder: 'Admin PIN', inputMode: 'numeric', autocomplete: 'off', style: 'width:100%', oninput: function () { clearTimeout(pin._t); pin._t = setTimeout(function () { MCPW.verify(pin.value, S.adminPin).then(function (ok) { st.pin = ok; refresh(); }); }, 300); } });
      var go = el('button', { type: 'button', class: 'btn2 v104go', disabled: true, onclick: start }, '☢️ এখনই সব মুছে ফেলুন'), cd = el('div', { hidden: true }), msg = el('p', { class: 'muted' });
      gate.append(el('h3', {}, '২) নিশ্চিত করুন — সবকটি ধাপ পূরণ হলে তবেই বোতাম চালু হবে'), list,
        el('div', { style: 'display:grid;gap:.5rem;margin:.6rem 0' }, [bkBtn,
          el('label', { style: 'display:flex;gap:.5rem' }, [ack1, 'আমি বুঝেছি — রিসেট করলে নির্বাচিত সব ডাটা চিরতরে মুছে যাবে।']),
          el('label', { style: 'display:flex;gap:.5rem' }, [ack2, 'ব্যাকআপ ফাইলটি আমি নিরাপদ জায়গায় রেখেছি এবং খুলে দেখেছি।']),
          el('label', { style: 'display:flex;flex-direction:column;gap:.2rem' }, ['নিশ্চিত করতে ঠিক এই লেখাটি লিখুন: ' + PHRASE, ph]),
          isAdmin() ? el('label', { style: 'display:flex;flex-direction:column;gap:.2rem' }, ['Admin পাসওয়ার্ড দিন', pw]) : el('p', { class: 'muted' }, 'Ops Owner হিসেবে আছেন — পাসওয়ার্ড-ধাপ নেই; বাকি সব ধাপ বাধ্যতামূলক।'),
          needPin ? el('label', { style: 'display:flex;flex-direction:column;gap:.2rem' }, ['Admin PIN দিন', pin]) : null]), go, cd, msg);
      root.append(gate);
      function refresh() {
        var items = [[st.backup, 'পূর্ণ ব্যাকআপ ডাউনলোড করা হয়েছে'], [st.a1, 'ফেরানো যাবে না — বুঝেছি'], [st.a2, 'ব্যাকআপ নিরাপদে রেখেছি'], [st.phrase, '"' + PHRASE + '" লেখা হয়েছে']];
        if (isAdmin()) items.push([st.pw, 'Admin পাসওয়ার্ড সঠিক']); if (needPin) items.push([st.pin, 'Admin PIN সঠিক']);
        list.replaceChildren.apply(list, items.map(function (i) { return el('div', { class: 'it' + (i[0] ? ' ok' : '') }, [el('span', { class: 'ic' }, i[0] ? '✔' : '✖'), i[1]]); }));
        go.disabled = !items.every(function (i) { return i[0]; }) || !!timer;
      }
      var timer = null;
      function start() {
        if (timer) return; var n = 5, bar = el('i', {}), cancel = el('button', { type: 'button', class: 'btn', onclick: function () { clearInterval(timer); timer = null; cd.hidden = true; refresh(); msg.textContent = 'বাতিল করা হয়েছে — কিছুই মোছা হয়নি।'; } }, '✋ থামুন — বাতিল করুন');
        var txt = el('b', { style: 'color:#c0261c;font-size:1.1rem' }, ''); cd.hidden = false; cd.replaceChildren(txt, el('div', { class: 'v104bar' }, bar), cancel); go.disabled = true;
        function tick() { txt.textContent = '⏳ ' + n + ' সেকেন্ডে মোছা শুরু হবে…'; bar.style.width = ((5 - n + 1) * 20) + '%'; }
        tick(); timer = setInterval(function () { n--; if (n <= 0) { clearInterval(timer); timer = null; cd.hidden = true; run(); } else tick(); }, 1000);
      }
      function run() {
        var sel = { acc: opt.acc.checked || srv, set: opt.set.checked || srv, aud: opt.aud.checked || srv }, empty = modeSel.value === 'empty';
        var targets = allKeys().filter(function (k) { var g = grp(k); return g === 'biz' || sel[g]; });
        /* রিস্টোর পয়েন্ট */
        var data = {}, saved = false; targets.forEach(function (k) { data[k] = localStorage.getItem(k); });
        try { localStorage.setItem('mc_resetpoint', JSON.stringify({ at: new Date().toISOString(), by: by, data: data })); saved = true; } catch (e) { try { localStorage.removeItem('mc_resetpoint'); } catch (x) { } }
        function wipe() {
          var n = 0;
          targets.forEach(function (k) {
            var v = rj(k, null);
            if (empty && grp(k) === 'biz') {
              if (k === 'mc_db' && v && typeof v === 'object') { var o = { v: v.v }; if (v.users) o.users = v.users; if (v.settings) o.settings = v.settings; Object.keys(v).forEach(function (p) { if (Array.isArray(v[p]) && p !== 'users') o[p] = []; }); localStorage.setItem(k, JSON.stringify(o)); n++; return; }
              if (Array.isArray(v)) { localStorage.setItem(k, '[]'); n++; return; }
            }
            localStorage.removeItem(k); n++;
          });
          try { localStorage.removeItem('mc_sync'); sessionStorage.removeItem('mc_ops_last'); } catch (e) { }
          var log = { at: new Date().toISOString(), by: by, mode: (empty ? 'খালি শুরু' : 'ডেমো ডাটা') + ' · ' + (sel.acc ? 'অ্যাকাউন্ট+' : '') + (sel.set ? 'সেটিংস+' : '') + (sel.aud ? 'অডিট+' : '') + 'ব্যবসা', n: n, server: srv };
          localStorage.setItem('pharmacy_resetlog', JSON.stringify(log));
          if (!sel.aud) { try { c.audit('☢️ FULL DATA RESET (' + log.mode + ', ' + n + ' keys, server=' + srv + ')'); } catch (e) { } }
          var f = el('div', { class: 'cc-card', style: 'border-color:#2e9e5b' }, [el('h3', {}, '✅ রিসেট সম্পন্ন'), el('p', {}, n + ' টি ডাটা-সেট মোছা হয়েছে' + (saved ? '। এই ব্রাউজারে রিস্টোর পয়েন্ট রাখা আছে — ইচ্ছে হলে উপরের "রিসেট বাতিল করুন" দিয়ে ফেরানো যাবে।' : '। ⚠ ব্রাউজারে জায়গা কম বলে রিস্টোর পয়েন্ট রাখা যায়নি — ফেরাতে ডাউনলোড-করা ব্যাকআপ ব্যবহার করুন (Backup পেজ → রিস্টোর)।')), el('div', { class: 'row', style: 'display:flex;gap:.5rem;flex-wrap:wrap' }, [el('a', { class: 'btn', href: 'dashboard.html' }, 'ড্যাশবোর্ডে যান'), el('a', { class: 'btn2', href: 'shop.html' }, 'শপ দেখুন'), el('button', { type: 'button', class: 'btn2', onclick: function () { c.show('reset'); } }, 'এই পেজ রিফ্রেশ')])]);
          root.replaceChildren(f); window.scrollTo(0, 0); c.ok('সব ডাটা রিসেট হয়েছে');
        }
        if (srv && window.MCSRV && MCSRV.apost) {
          msg.textContent = 'সার্ভারে রিসেট চলছে…';
          MCSRV.apost('/api/reset', { confirm: 'RESET' }).then(function (r) {
            if (r && r.status === 200) wipe(); else { c.bad((r && r.json && r.json.error) || 'সার্ভার রিসেট হয়নি — কিছু মোছা হয়নি'); try { localStorage.removeItem('mc_resetpoint'); } catch (e) { } refresh(); }
          });
        } else wipe();
      }
      refresh(); return root;
    };
    var di = -1; x.tabs.forEach(function (t, i) { if (/data/i.test(t[0]) || t[0] === 'maint') di = i; });
    x.tabs.push(['reset', '☢️ সব ডাটা রিসেট']);
    return x;
  };
})();

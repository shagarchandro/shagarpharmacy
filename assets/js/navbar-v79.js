/* v79 — Navbar + Sidebar আপডেট (সব স্টাফ পেজে):
   • ডashboard টপ-নবারে: ঢাকার ঘড়ি, ＋ Quick-add মেনু, ফুলস্ক্রিন, ⌨ shortcut গাইড (?), ইউজার মেনুতে নাম/ইমেইল/ভূমিকা + Home/Shop/অ্যাকাউন্ট লিংক
   • অন্য পেজে (যেখানে টপ-নবার নেই) একটি পাতলা টপ-বার: পেজের নাম, ঘড়ি, Quick-add, ⌨
   • Sidebar: মেনু খোঁজার বক্স, সক্রিয় পেজ দৃশ্যমান রাখা, স্ক্রল-পজিশন মনে রাখা, লাল সংখ্যা-ব্যাজ (কম স্টক, অপেক্ষমাণ Rx, অনলাইন অর্ডার, বাকি, ব্যাকআপ)
   • কীবোর্ড: g তারপর d/s/m/c/p/u/x/r/t/l/o/b/h = পেজে যান; ? = সাহায্য (Ctrl+K আগের মতোই)
   • লগইনের পর যে পেজ থেকে ফেরত পাঠানো হয়েছিল সেখানে ফেরা (guard.js রেখে যাওয়া mc_next) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function sj(k) { try { return JSON.parse(localStorage.getItem(k) || sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var page = (location.pathname.split('/').pop() || 'index.html');
  var user = sj('user'), access = sj('user_access') || {};
  var SRV = !!(window.MCSRV && window.MCSRV.active);

  /* ---------- লগইনের পর আগের পেজে ফেরা ---------- */
  try {
    if (page === 'dashboard.html') {
      var nx = sessionStorage.getItem('mc_next');
      if (nx) { sessionStorage.removeItem('mc_next'); if (/^[a-z][a-z-]*\.html(\?[^#]*)?(#.*)?$/i.test(nx) && !/^(login|index|dashboard)\.html/i.test(nx)) { location.replace(nx); return; } }
    }
  } catch (e) { }

  var css = '' +
    '.mcn-bar{position:sticky;top:0;z-index:900;display:flex;align-items:center;gap:.6rem;padding:.45rem .8rem;margin:-.2rem 0 1rem;border-radius:14px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);box-shadow:0 2px 12px rgba(40,50,110,.1);font-size:.9rem}' +
    'body.dark-mode .mcn-bar{background:rgba(23,30,54,.92);color:#e8ecfa}.mcn-bar b{font-weight:700}.mcn-sp{flex:1}' +
    '.mcn-btn{border:1px solid rgba(100,110,160,.3);background:transparent;color:inherit;border-radius:10px;padding:.3rem .65rem;cursor:pointer;font:inherit;line-height:1.2;white-space:nowrap}.mcn-btn:hover{background:rgba(102,126,234,.14)}' +
    '.mcn-clk{color:#6b7280;font-size:.82rem;white-space:nowrap}body.dark-mode .mcn-clk{color:#a3adcb}' +
    '.mcn-dd{position:relative}.mcn-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:220px;background:#fff;color:#16213a;border-radius:12px;box-shadow:0 12px 34px rgba(30,40,100,.25);padding:.35rem;display:none;z-index:950}' +
    '.mcn-menu.on{display:block}body.dark-mode .mcn-menu{background:#171e36;color:#e8ecfa}.mcn-menu a{display:block;padding:.5rem .7rem;border-radius:8px;text-decoration:none;color:inherit;white-space:nowrap}.mcn-menu a:hover{background:rgba(102,126,234,.15)}' +
    '.mcn-filter{width:calc(100% - 16px);margin:6px 8px 8px;padding:.4rem .7rem;border-radius:10px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:inherit;font-size:.85rem}.mcn-filter::placeholder{color:rgba(255,255,255,.7)}' +
    '.mcn-bdg{margin-left:auto;background:#ef4444;color:#fff;border-radius:999px;font-size:.68rem;font-weight:700;min-width:20px;height:20px;line-height:20px;text-align:center;padding:0 6px}.nav-link{position:relative}' +
    '.mcn-help{position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.6);display:none;align-items:center;justify-content:center;padding:16px}.mcn-help.on{display:flex}' +
    '.mcn-help>div{background:#fff;color:#16213a;border-radius:16px;max-width:460px;width:100%;padding:1.2rem 1.4rem;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:88vh;overflow:auto}body.dark-mode .mcn-help>div{background:#171e36;color:#e8ecfa}' +
    '.mcn-help kbd{background:#eef0ff;color:#3b3f8f;border-radius:6px;padding:.05rem .45rem;font-size:.82rem;border:1px solid #d6dbff}.mcn-help td{padding:.25rem .5rem;vertical-align:top}' +
    '@media(max-width:768px){.mcn-clk,.mcn-fs{display:none}.mcn-bar{padding:.35rem .5rem}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NAV = [
    ['g d', 'dashboard.html', '🏠 Dashboard'], ['g s', 'sales.html', '🧾 Sales / POS'], ['g m', 'medicines.html', '💊 Medicines'], ['g c', 'customers.html', '👥 Customers'],
    ['g p', 'purchases.html', '📥 Purchases'], ['g u', 'suppliers.html', '🏭 Suppliers'], ['g x', 'prescriptions.html', '📋 Prescriptions'], ['g r', 'reports.html', '📊 Reports'],
    ['g t', 'team.html', '📌 Team Board'], ['g l', 'closing.html', '🧮 Daily Closing'], ['g o', 'reorder.html', '🛒 Reorder List'], ['g b', 'backup.html', '💾 Backup'], ['g h', 'shop.html', '🏪 Online Shop']
  ];
  var KEYOF = { 'dashboard.html': 'dashboard', 'sales.html': 'sales', 'medicines.html': 'medicines', 'customers.html': 'customers', 'purchases.html': 'purchases', 'suppliers.html': 'suppliers', 'prescriptions.html': 'prescriptions', 'reports.html': 'reports' };
  function can(href) { var k = KEYOF[href]; return !k || !user || access[k] !== false && access[k] !== undefined && access[k] !== null ? true : false; }
  function allowed(href) { var k = KEYOF[href]; if (!k) return true; var a = access[k]; return !!a; }

  var QUICK = [['sales.html', '🧾 নতুন বিক্রি (POS)'], ['medicines.html', '💊 ওষুধ যোগ / স্টক'], ['customers.html', '👤 কাস্টমার'], ['purchases.html', '📥 নতুন ক্রয়'], ['prescriptions.html', '📋 প্রেসক্রিপশন'], ['closing.html', '🧮 ডে-ক্লোজিং'], ['reorder.html', '🛒 রিঅর্ডার লিস্ট'], ['shop.html', '🏪 অনলাইন শপ']];

  function clockText() { var d = new Date(); return d.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }); }

  function quickMenu() {
    var items = QUICK.filter(function (q) { return allowed(q[0]); });
    var w = document.createElement('div'); w.className = 'mcn-dd';
    w.innerHTML = '<button type="button" class="mcn-btn" aria-haspopup="true" aria-expanded="false">＋ Quick</button><div class="mcn-menu" role="menu">' + items.map(function (q) { return '<a role="menuitem" href="' + q[0] + '">' + q[1] + '</a>'; }).join('') + '</div>';
    var b = $('button', w), m = $('.mcn-menu', w);
    b.onclick = function (e) { e.stopPropagation(); var o = m.classList.toggle('on'); b.setAttribute('aria-expanded', o); };
    document.addEventListener('click', function () { m.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.classList.remove('on'); });
    return w;
  }
  function tools(withClock) {
    var f = document.createDocumentFragment(), c = document.createElement('span');
    if (withClock) { c.className = 'mcn-clk'; c.textContent = '🕒 ' + clockText(); setInterval(function () { c.textContent = '🕒 ' + clockText(); }, 30000); f.appendChild(c); }
    f.appendChild(quickMenu());
    var fs = document.createElement('button'); fs.type = 'button'; fs.className = 'mcn-btn mcn-fs'; fs.title = 'ফুলস্ক্রিন'; fs.setAttribute('aria-label', 'Fullscreen'); fs.textContent = '⛶';
    fs.onclick = function () { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { } };
    var hp = document.createElement('button'); hp.type = 'button'; hp.className = 'mcn-btn'; hp.title = 'কীবোর্ড শর্টকাট (?)'; hp.setAttribute('aria-label', 'Keyboard shortcuts'); hp.textContent = '⌨'; hp.onclick = help;
    f.appendChild(fs); f.appendChild(hp); return f;
  }

  /* ---------- সাহায্য মডাল ---------- */
  var helpEl = null;
  function help() {
    if (!helpEl) {
      helpEl = document.createElement('div'); helpEl.className = 'mcn-help'; helpEl.setAttribute('role', 'dialog'); helpEl.setAttribute('aria-label', 'Keyboard shortcuts');
      helpEl.innerHTML = '<div><h5 style="margin:0 0 .6rem">⌨ কীবোর্ড শর্টকাট</h5><table><tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd> বা <kbd>/</kbd></td><td>দ্রুত জাম্প / সার্চ</td></tr><tr><td><kbd>?</kbd></td><td>এই সাহায্য</td></tr><tr><td><kbd>Esc</kbd></td><td>বন্ধ করুন</td></tr>' +
        NAV.filter(function (n) { return allowed(n[1]); }).map(function (n) { var k = n[0].split(' '); return '<tr><td><kbd>' + k[0] + '</kbd> তারপর <kbd>' + k[1] + '</kbd></td><td>' + n[2] + '</td></tr>'; }).join('') +
        '</table><div style="text-align:right;margin-top:.8rem"><button type="button" class="mcn-btn" id="mcnX">বন্ধ করুন</button></div></div>';
      document.body.appendChild(helpEl);
      helpEl.addEventListener('click', function (e) { if (e.target === helpEl || e.target.id === 'mcnX') helpEl.classList.remove('on'); });
    }
    helpEl.classList.add('on');
  }
  var gAt = 0;
  document.addEventListener('keydown', function (e) {
    var t = (e.target.tagName || '').toLowerCase(); if (/input|textarea|select/.test(t) || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && helpEl) helpEl.classList.remove('on');
    if (e.key === '?') { e.preventDefault(); help(); return; }
    if (e.key === 'g') { gAt = Date.now(); return; }
    if (gAt && Date.now() - gAt < 1200) {
      var hit = NAV.filter(function (n) { return n[0] === 'g ' + e.key.toLowerCase(); })[0]; gAt = 0;
      if (hit && allowed(hit[1])) { e.preventDefault(); location.href = hit[1]; }
    }
  });

  /* ---------- Dashboard টপ-নবার ---------- */
  function topNavbar() {
    var nb = $('nav.navbar .ms-auto'); if (!nb) return false;
    var anchor = $('#darkModeToggle', nb) || nb.firstChild; var f = tools(true);
    nb.insertBefore(f, nb.firstChild);
    /* ইউজার মেনু */
    var ul = $('.dropdown-menu.dropdown-menu-end', $('#navUserName') ? $('#navUserName').closest('.dropdown') : document);
    if (ul && !$('.mcn-uh', ul)) {
      var li = document.createElement('li'); li.className = 'mcn-uh px-3 py-2'; li.innerHTML = '<div class="fw-bold">' + esc((user && user.name) || 'User') + '</div><div class="small text-muted">' + esc((user && user.email) || '') + '</div><span class="badge bg-primary mt-1">' + esc((user && user.role) || '') + '</span>';
      ul.insertBefore(li, ul.firstChild); var dv = document.createElement('li'); dv.innerHTML = '<hr class="dropdown-divider">'; ul.insertBefore(dv, li.nextSibling);
      var last = $('hr.dropdown-divider', ul.lastElementChild ? ul : ul);
      var extra = [['<i class="fas fa-keyboard me-2"></i>Keyboard shortcuts (?)', function () { help(); }], ['<i class="fas fa-house me-2"></i>Home page', 'index.html'], ['<i class="fas fa-store me-2"></i>Online Shop', 'shop.html']];
      if (SRV) extra.unshift(['<i class="fas fa-shield-halved me-2"></i>Account &amp; sessions', function () { var b = document.getElementById('mcsBtn'); if (b) b.click(); }]);
      var out = ul.querySelector('#logoutDropdownBtn'), ref = out ? out.closest('li').previousElementSibling : null;
      extra.forEach(function (x) {
        var l = document.createElement('li'), a = document.createElement('a'); a.className = 'dropdown-item'; a.innerHTML = x[0];
        if (typeof x[1] === 'function') { a.href = '#'; a.onclick = function (e) { e.preventDefault(); x[1](); }; } else a.href = x[1];
        l.appendChild(a); ul.insertBefore(l, ref || ul.lastElementChild);
      });
    }
    return true;
  }
  function slimBar() {
    var mc = document.getElementById('mainContent') || $('.main-content'); if (!mc || $('.mcn-bar', mc)) return;
    var bar = document.createElement('div'); bar.className = 'mcn-bar';
    var ttl = (document.title || '').split(/[–—|-]/)[0].trim() || page.replace('.html', '');
    var h = document.createElement('b'); h.textContent = ttl; bar.appendChild(h);
    var sp = document.createElement('span'); sp.className = 'mcn-sp'; bar.appendChild(sp);
    bar.appendChild(tools(true)); mc.insertBefore(bar, mc.firstChild);
  }

  /* ---------- Sidebar ---------- */
  function sidebar() {
    var nav = document.getElementById('mainNav') || $('#sidebar nav.nav'), sb = document.getElementById('sidebar'); if (!nav) return;
    var links = $$('.nav-link', nav);
    if (links.length > 8 && !$('.mcn-filter', nav)) {
      var inp = document.createElement('input'); inp.type = 'search'; inp.className = 'mcn-filter'; inp.placeholder = '🔎 মেনু খুঁজুন…'; inp.setAttribute('aria-label', 'Filter menu');
      nav.insertBefore(inp, nav.firstChild);
      inp.addEventListener('input', function () { var v = inp.value.trim().toLowerCase(); links.forEach(function (a) { a.style.display = !v || a.textContent.toLowerCase().indexOf(v) > -1 ? '' : 'none'; }); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = links.filter(function (a) { return a.style.display !== 'none' && a.getAttribute('href') && a.getAttribute('href') !== '#'; })[0]; if (f) location.href = f.getAttribute('href'); } });
    }
    var cur = links.filter(function (a) { return (a.getAttribute('href') || '') === page; })[0];
    try { if (sb) { var sc = +sessionStorage.getItem('mcn_sb'); if (sc) sb.scrollTop = sc; addEventListener('pagehide', function () { sessionStorage.setItem('mcn_sb', sb.scrollTop); }); } } catch (e) { }
    if (cur && cur.scrollIntoView) setTimeout(function () { try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) { } }, 60);
    badges(); addEventListener('storage', badges); addEventListener('mcsrv:update', badges); setInterval(badges, 60000);
  }
  function badge(id, n, title) {
    var H = { menuReorder: 'reorder.html', menuMedicines: 'medicines.html', menuPrescriptions: 'prescriptions.html', menuShop: 'shop.html', menuOps: 'admin/login.html', menuCustomers: 'customers.html', menuBackup: 'backup.html' }; var a = $('#sidebar a.nav-link[href="' + H[id] + '"]'); if (!a) return; var b = $('.mcn-bdg', a);
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'mcn-bdg'; a.appendChild(b); }
    b.textContent = n > 99 ? '99+' : String(n); b.title = title || '';
  }
  function pr80() { try { return (rj('pharmacy_prefs_v80', {})[String((user && user.email) || '').toLowerCase()]) || {}; } catch (e) { return {}; } }
  function badges() {
    try {
      var P = pr80();
      var meds = rj('pharmacy_medicines', []), low = P.noStock ? 0 : meds.filter(function (m) { var s = +m.stock || 0, mn = +m.minStock || 0; return s <= mn; }).length;
      badge('menuReorder', low, 'কম / শেষ স্টক'); badge('menuMedicines', low, 'কম / শেষ স্টক');
      badge('menuPrescriptions', P.noOps ? 0 : rj('pharmacy_prescriptions', []).filter(function (p) { return p && p.status === 'pending'; }).length, 'অপেক্ষমাণ প্রেসক্রিপশন');
      var shop = rj('mc_db', {}), po = P.noOps ? [] : (shop.orders || []).filter(function (o) { return o && /^(Ordered|Pending|Prescription Review|Return Requested)$/.test(o.status || ''); }).length;
      badge('menuShop', po, 'অনলাইন অর্ডার — মনোযোগ দরকার'); badge('menuOps', po, 'অনলাইন অর্ডার — মনোযোগ দরকার');
      badge('menuCustomers', P.noMoney ? 0 : rj('pharmacy_customers', []).filter(function (c) { return (+c.due || 0) > 0; }).length, 'বাকি আছে এমন গ্রাহক');
      var lb = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), old = !lb || (Date.now() - new Date(lb)) / 864e5 >= 7;
      badge('menuBackup', old && !P.noOps ? '!' : 0, lb ? '৭ দিনের বেশি আগে ব্যাকআপ' : 'কখনো ব্যাকআপ নেওয়া হয়নি');
    } catch (e) { }
  }


  /* ---------- অলস থাকলে অটো-লগআউট (Settings → Alerts & Session) ---------- */
  (function idle() {
    var mins = +(pr80().idle || 0); if (!mins || !user) return;
    var limit = mins * 60e3, warn = null, last = Date.now(), lastW = 0;
    function bump() { var n = Date.now(); last = n; if (warn) { warn.remove(); warn = null; } if (n - lastW > 10000) { lastW = n; try { localStorage.setItem('mc_activity', String(n)); } catch (e) { } } }
    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(function (ev) { addEventListener(ev, bump, { passive: true, capture: true }); });
    setInterval(function () {
      var o = +localStorage.getItem('mc_activity') || 0; if (o > last) last = o;
      var idleFor = Date.now() - last;
      if (idleFor >= limit) {
        try { sessionStorage.setItem('mc_flash', 'অলস থাকায় নিরাপত্তার জন্য লগআউট হয়েছে।'); } catch (e) { }
        if (SRV && window.MCSRV.logout) { try { window.MCSRV.logout('staff'); return; } catch (e) { } }
        if (window.authClear) window.authClear(); location.replace('login.html');
      } else if (idleFor >= limit - 60e3 && !warn) {
        warn = document.createElement('div'); warn.setAttribute('role', 'alert'); warn.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:100001;background:#b45309;color:#fff;padding:.7rem 1.1rem;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-weight:600';
        warn.textContent = '⏳ ১ মিনিটের মধ্যে অটো-লগআউট হবে — চালিয়ে যেতে মাউস নাড়ান বা কী চাপুন'; document.body.appendChild(warn);
      }
    }, 5000);
    window.__mcIdleTest = function (v) { limit = v; };
  })();

  function init() { if (!topNavbar()) slimBar(); sidebar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

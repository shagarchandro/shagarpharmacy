/* Work-faster layer for Admin / Pharmacist / Staff panels:
   - Quick actions + greeting on the dashboard (only what the role may use)
   - Command palette: Ctrl/Cmd+K or "/" (or the 🔍 button) to jump anywhere
   - Mobile bottom navigation bar
   Reads the same role/access data as guard.js; never grants anything - guard.js still enforces. */
(function () {
  'use strict';
  function get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  var user = null, acc = {}; try { user = JSON.parse(get('user')); acc = JSON.parse(get('user_access')) || {}; } catch (e) {}
  if (!user) return;
  var role = user.role || 'staff', isAdmin = role === 'admin', isPh = role === 'pharmacist';
  var can = function (k) { var a = acc[k]; return isAdmin || (a && (a === true || a.view)); };
  var ITEMS = [
    { k: 'dashboard', t: 'Dashboard', b: 'ড্যাশবোর্ড', i: '🏠', u: 'dashboard.html' },
    { k: 'sales', t: 'POS Sales', b: 'নতুন বিক্রি / বিল', i: '🧾', u: 'sales.html' },
    { k: 'medicines', t: 'Medicines', b: 'ওষুধ ও স্টক', i: '💊', u: 'medicines.html' },
    { k: 'customers', t: 'Customers', b: 'কাস্টমার ও বাকি', i: '👥', u: 'customers.html' },
    { k: 'prescriptions', t: 'Prescriptions', b: 'প্রেসক্রিপশন', i: '📋', u: 'prescriptions.html' },
    { k: 'purchases', t: 'Purchases', b: 'ক্রয় / ইনভয়েস', i: '📦', u: 'purchases.html' },
    { k: 'suppliers', t: 'Suppliers', b: 'সাপ্লায়ার', i: '🚚', u: 'suppliers.html' },
    { k: 'reports', t: 'Reports', b: 'রিপোর্ট', i: '📊', u: 'reports.html' },
    { k: '_ph', t: 'Daily Closing', b: 'দৈনিক ক্যাশ মিলান', i: '🧮', u: 'closing.html' },
    { k: '_ph', t: 'Reorder List', b: 'কী কিনতে হবে', i: '🛒', u: 'reorder.html' },
    { k: '_ph', t: 'Refunds', b: 'বিক্রি ফেরত', i: '↩️', u: 'refunds.html' },
    { k: '_ph', t: 'Rx Register', b: 'Rx রেজিস্টার', i: '📒', u: 'register.html' },
    { k: '_ph', t: 'Write-off', b: 'মেয়াদোত্তীর্ণ বাদ', i: '🗑️', u: 'writeoff.html' },
    { k: '_ph', t: 'Backup', b: 'ব্যাকআপ', i: '💾', u: 'backup.html' },
    { k: '_ad', t: 'Control Center', b: 'সব নিয়ন্ত্রণ', i: '🎛', u: 'admin-center.html' },
    { k: '*', t: 'Team Board', b: 'নোটিশ ও কাজ', i: '📌', u: 'team.html' },
    { k: '*', t: 'Online Shop', b: 'অনলাইন শপ', i: '🛒', u: 'shop.html' },
    { k: '*', t: 'Ops Panel', b: 'অর্ডার/ডেলিভারি', i: '⚙️', u: 'admin/login.html' }
  ].filter(function (x) { return x.k === '*' || (x.k === '_ph' ? (isAdmin || isPh) : x.k === '_ad' ? isAdmin : can(x.k)); });

  var SETG = {}; try { SETG = JSON.parse(localStorage.getItem('pharmacy_settings') || '{}'); } catch (e) {}
  var OFF = SETG.features || {}, FMAP = { 'team.html': 'team', 'refunds.html': 'refunds', 'writeoff.html': 'writeoff', 'register.html': 'register', 'closing.html': 'closing', 'reorder.html': 'reorder' };
  ITEMS = ITEMS.filter(function (x) { return OFF[FMAP[x.u]] !== false; });
  var css = '' +
  '.mcp-o{position:fixed;inset:0;background:rgba(10,15,35,.55);backdrop-filter:blur(3px);z-index:3000;display:none;align-items:flex-start;justify-content:center;padding:10vh 12px 0}.mcp-o.on{display:flex}' +
  '.mcp{width:min(560px,100%);background:#fff;color:#16213a;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden;font-family:system-ui,sans-serif}' +
  '.mcp input{width:100%;border:0;border-bottom:1px solid #e3e7f5;padding:1rem 1.1rem;font-size:1.05rem;outline:none;background:transparent;color:inherit;box-sizing:border-box}' +
  '.mcp ul{list-style:none;margin:0;padding:.4rem;max-height:50vh;overflow:auto}.mcp li a{display:flex;gap:.7rem;align-items:center;padding:.6rem .8rem;border-radius:10px;text-decoration:none;color:inherit}' +
  '.mcp li a small{color:#6b7794;margin-left:auto}.mcp li.sel a,.mcp li a:hover{background:#eef0ff}.mcp-h{padding:.4rem 1rem .7rem;font-size:.75rem;color:#6b7794}' +
  '.mcp-fab{position:fixed;right:14px;bottom:78px;z-index:2500;width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:1.2rem;box-shadow:0 8px 20px rgba(102,126,234,.5);cursor:pointer}' +
  '@media(min-width:992px){.mcp-fab{bottom:20px}}' +
  '.mcq{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:20px;padding:1.2rem;margin:0 0 1.2rem;box-shadow:0 12px 30px rgba(102,126,234,.3)}' +
  '.mcq h2{margin:0;font-size:1.35rem;font-weight:800}.mcq p{margin:.2rem 0 .9rem;opacity:.9}.mcq .rb{display:inline-block;background:rgba(255,255,255,.2);border-radius:999px;padding:.1rem .7rem;font-size:.8rem;font-weight:700;text-transform:capitalize}' +
  '.mcq-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.6rem}.mcq-g a{display:flex;flex-direction:column;align-items:center;gap:.2rem;text-align:center;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:.8rem .4rem;color:#fff;text-decoration:none;font-weight:600;font-size:.9rem;transition:transform .15s,background .15s}.mcq-g a:hover{transform:translateY(-3px);background:rgba(255,255,255,.28);color:#fff}.mcq-g a span{font-size:1.5rem}.mcq-g a small{opacity:.85;font-weight:400;font-size:.72rem}' +
  '.mcb{display:none;position:fixed;left:0;right:0;bottom:0;z-index:2400;background:#fff;border-top:1px solid #e3e7f5;box-shadow:0 -6px 20px rgba(0,0,0,.08);padding:.25rem .3rem calc(.25rem + env(safe-area-inset-bottom));justify-content:space-around}' +
  '.mcb a,.mcb button{flex:1;display:flex;flex-direction:column;align-items:center;gap:0;border:0;background:none;text-decoration:none;color:#5c6783;font:600 .68rem system-ui;padding:.3rem 0;border-radius:10px}.mcb a span,.mcb button span{font-size:1.25rem}.mcb a.on{color:#667eea;background:#eef0ff}' +
  '@media(max-width:991px){.mcb{display:flex}body{padding-bottom:62px!important}}@media print{.mcb,.mcp-fab,.mcp-o,.mcq{display:none!important}}' +
  '@media(prefers-color-scheme:dark){.mcp{background:#171e36;color:#e8ecfa}.mcp input{border-color:#27304f}.mcp li.sel a,.mcp li a:hover{background:#26305a}.mcb{background:#171e36;border-color:#27304f}.mcb a.on{background:#26305a;color:#aab4ff}.mcb a,.mcb button{color:#a3adcb}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);


  function lastLine() {
    try {
      var L = JSON.parse(localStorage.getItem('pharmacy_loginlog') || '[]'), em = String(user.email || '').toLowerCase();
      var mine = L.filter(function (x) { return String(x.email).toLowerCase() === em; }), oks = mine.filter(function (x) { return x.ok; });
      var prev = oks.length > 1 ? oks[oks.length - 2] : null, idx = prev ? mine.indexOf(prev) : -1;
      var fails = mine.slice(idx + 1).filter(function (x) { return !x.ok; }).length;
      var t = prev ? new Date(prev.at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }) : '';
      if (!t && !fails) return '';
      return '<p style="font-size:.8rem;opacity:.85;margin:-.5rem 0 .8rem">' + (t ? '🕒 শেষ লগইন: ' + t : '') + (fails ? ' · <b>⚠️ ' + fails + 'টি ব্যর্থ চেষ্টা</b>' : '') + '</p>';
    } catch (e) { return ''; }
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var page = (location.pathname.split('/').pop() || '');
    if (FMAP[page] && OFF[FMAP[page]] === false) {
      var dv = document.createElement('div'); dv.setAttribute('role', 'alert');
      dv.style.cssText = 'position:fixed;inset:0;z-index:5000;background:#10171f;color:#fff;display:grid;place-items:center;text-align:center;padding:1rem;font-family:system-ui';
      dv.innerHTML = '<div><h2>🔒 এই ফিচারটি Admin বন্ধ করে রেখেছেন</h2><p>Control Center → Features থেকে চালু করা যায়।</p><a href="dashboard.html" style="color:#aab4ff">← Dashboard</a></div>'; document.body.appendChild(dv);
    }
    if (OFF) { var hide = []; for (var fu in FMAP) if (OFF[FMAP[fu]] === false) hide.push('a[href="' + fu + '"]'); if (hide.length) { var hs = document.createElement('style'); hs.textContent = hide.join(',') + '{display:none!important}'; document.head.appendChild(hs); } }
    // ---- command palette ----
    var ov = document.createElement('div'); ov.className = 'mcp-o'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Quick jump');
    ov.innerHTML = '<div class="mcp"><input id="mcpq" placeholder="কোথায় যাবেন? লিখুন… (Pharmacy, POS, Medicines…)" autocomplete="off" aria-label="Search pages"><ul id="mcpl"></ul><div class="mcp-h">↑ ↓ বেছে নিন · Enter খুলুন · Esc বন্ধ</div></div>';
    document.body.appendChild(ov);
    var q = ov.querySelector('#mcpq'), ul = ov.querySelector('#mcpl'), sel = 0, cur = [];
    function draw() {
      var s = q.value.trim().toLowerCase();
      cur = ITEMS.filter(function (x) { return !s || (x.t + ' ' + x.b).toLowerCase().indexOf(s) > -1; });
      sel = Math.min(sel, Math.max(cur.length - 1, 0));
      ul.innerHTML = cur.map(function (x, n) { return '<li class="' + (n === sel ? 'sel' : '') + '"><a href="' + x.u + '"><span>' + x.i + '</span><b>' + x.t + '</b><small>' + x.b + '</small></a></li>'; }).join('') || '<li class="mcp-h">কিছু পাওয়া যায়নি</li>';
    }
    function open() { ov.classList.add('on'); q.value = ''; sel = 0; draw(); setTimeout(function () { q.focus(); }, 30); }
    function close() { ov.classList.remove('on'); }
    q.addEventListener('input', function () { sel = 0; draw(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, cur.length - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter' && cur[sel]) location.href = cur[sel].u;
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      var t = (e.target.tagName || '').toLowerCase(), typing = /input|textarea|select/.test(t) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); open(); }
      else if (e.key === 'Escape') close();
    });
    var fab = document.createElement('button'); fab.className = 'mcp-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Quick jump (Ctrl+K)'); fab.title = 'Quick jump (Ctrl+K)'; fab.textContent = '🔍'; fab.onclick = open; document.body.appendChild(fab);

    // ---- mobile bottom bar ----
    var bar = document.createElement('nav'); bar.className = 'mcb'; bar.setAttribute('aria-label', 'Quick navigation');
    var core = ['dashboard.html', 'sales.html', 'medicines.html', 'customers.html'];
    bar.innerHTML = ITEMS.filter(function (x) { return core.indexOf(x.u) > -1; }).map(function (x) { return '<a href="' + x.u + '" class="' + (page === x.u ? 'on' : '') + '"><span>' + x.i + '</span>' + x.t.replace('POS Sales', 'POS') + '</a>'; }).join('') + '<button type="button" id="mcbMore"><span>☰</span>More</button>';
    document.body.appendChild(bar); bar.querySelector('#mcbMore').onclick = open;


    // ---- idle auto sign-out (minutes set in Control Center → Rules; 0 = off) ----
    (function () {
      var set = {}; try { set = JSON.parse(localStorage.getItem('pharmacy_settings') || '{}'); } catch (e) {}
      var mins = set.idleMin == null ? 30 : +set.idleMin; if (!(mins > 0)) return;
      var last = Date.now(), warned = false, wb = null;
      ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(function (ev) { document.addEventListener(ev, function () { last = Date.now(); if (warned) { warned = false; if (wb) { wb.remove(); wb = null; } } }, { passive: true }); });
      setInterval(function () {
        var idle = (Date.now() - last) / 60000;
        if (idle >= mins) { if (window.authClear) window.authClear(); try { sessionStorage.setItem('mc_flash', 'নিষ্ক্রিয় থাকায় স্বয়ংক্রিয়ভাবে সাইন-আউট হয়েছে।'); } catch (e) {} location.replace('login.html'); }
        else if (idle >= mins - 1 && !warned) {
          warned = true; wb = document.createElement('div'); wb.setAttribute('role', 'alert');
          wb.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:3500;background:#1f2a4d;color:#fff;border-radius:14px;padding:.7rem 1rem;box-shadow:0 10px 30px rgba(0,0,0,.4);font:600 .9rem system-ui;max-width:92vw';
          wb.innerHTML = '⏳ ১ মিনিটের মধ্যে স্বয়ংক্রিয় সাইন-আউট হবে। <button style="margin-left:.6rem;border:0;border-radius:8px;padding:.3rem .7rem;background:#667eea;color:#fff;cursor:pointer">থাকুন</button>';
          wb.querySelector('button').onclick = function () { last = Date.now(); warned = false; wb.remove(); wb = null; };
          document.body.appendChild(wb);
        }
      }, 15000);
    })();

    // ---- dashboard quick actions ----
    if (page === 'dashboard.html') {
      var host = document.querySelector('#mainContent') || document.querySelector('.main-content'); if (!host) return;
      var hr = parseInt(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', hour12: false }), 10);
      var g = hr < 5 ? 'শুভ রাত্রি' : hr < 12 ? 'শুভ সকাল' : hr < 17 ? 'শুভ দুপুর' : hr < 20 ? 'শুভ সন্ধ্যা' : 'শুভ রাত্রি';
      var act = {
        admin: ['sales.html', 'medicines.html', 'customers.html', 'purchases.html', 'reports.html', 'admin-center.html', 'refunds.html', 'closing.html'],
        pharmacist: ['sales.html', 'prescriptions.html', 'medicines.html', 'register.html', 'closing.html', 'reorder.html', 'refunds.html', 'customers.html'],
        staff: ['sales.html', 'medicines.html', 'customers.html', 'prescriptions.html']
      }[isAdmin ? 'admin' : isPh ? 'pharmacist' : 'staff'] || [];
      var sub = { 'sales.html': 'নতুন বিল', 'medicines.html': 'স্টক দেখুন/যোগ', 'customers.html': 'বাকি ও ইতিহাস', 'purchases.html': 'ক্রয় এন্ট্রি', 'reports.html': 'বিক্রি ও লাভ', 'admin-center.html': 'রোল, ব্র্যান্ড, ইউজার', 'refunds.html': 'ফেরত নিন', 'backup.html': 'ডেটা সুরক্ষা', 'prescriptions.html': 'Rx যাচাই', 'register.html': 'Rx রেকর্ড', 'writeoff.html': 'মেয়াদ শেষ', 'closing.html': 'ক্যাশ মিলান', 'reorder.html': 'কী কিনতে হবে' };
      var tiles = act.map(function (u) { return ITEMS.filter(function (x) { return x.u === u; })[0]; }).filter(Boolean);
      var box = document.createElement('div'); box.className = 'mcq'; box.id = 'mcQuick';
      var av = window.MCAvatar ? MCAvatar.get(user) : ''; box.innerHTML = (av ? '<img class="mc-avatar" alt="" src="' + av + '" style="float:right;width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.6);margin-left:.6rem">' : '') + '<h2>' + g + ', ' + String(user.name || 'User').replace(/[<>&"]/g, '') + ' 👋</h2><p><span class="rb">' + role + '</span> · দ্রুত কাজ বেছে নিন, বা <b>Ctrl+K</b> / <b>/</b> চেপে যেকোনো পেজে যান</p>' + lastLine() + '<div class="mcq-g">' +
        tiles.map(function (x) { return '<a href="' + x.u + '"><span>' + x.i + '</span>' + x.t + '<small>' + (sub[x.u] || x.b) + '</small></a>'; }).join('') + '</div>';
      var first = host.firstElementChild; host.insertBefore(box, first && first.id === 'mcTools' ? first : host.firstChild);
      // default-password warning
      try {
        var DEFPW = { 'admin@medicare.com': 1, 'pharmacist@medicare.com': 1, 'staff@medicare.com': 1 }, cr = JSON.parse(localStorage.getItem('pharmacy_creds') || '{}'), em0 = String(user.email || '').toLowerCase();
        var stillDef = Object.keys(DEFPW).filter(function (k) { return !cr[k]; });
        var mineDef = DEFPW[em0] && !cr[em0];
        if (mineDef || (isAdmin && stillDef.length)) {
          var wn = document.createElement('div'); wn.setAttribute('role', 'alert'); wn.id = 'mcPwWarn';
          wn.style.cssText = 'background:#fff3d6;color:#6b4300;border:1px solid #f0cf85;border-radius:14px;padding:.7rem 1rem;margin:0 0 1rem;font-size:.9rem';
          wn.innerHTML = '🔑 <b>' + (mineDef ? 'আপনি ডিফল্ট পাসওয়ার্ড ব্যবহার করছেন।' : 'কিছু ডিফল্ট অ্যাকাউন্টের পাসওয়ার্ড এখনও বদলানো হয়নি (' + stillDef.length + 'টি)।') + '</b> ' + (mineDef ? 'Settings → Security থেকে এখনই বদলান।' : 'Control Center → Accounts থেকে রিসেট করুন।');
          host.insertBefore(wn, box.nextSibling);
        }
      } catch (e) {}

    }
  });
})();

/* v85 — Control Center: ২০টি ট্যাব এখন ৫টি গ্রুপে (সহজ নেভিগেশন), উপরে লাইভ স্ট্যাটাস স্ট্রিপ
   (শপ খোলা/বন্ধ এক ক্লিকে, ব্যাকআপ কতদিন আগে, আজকের বিক্রি, অপেক্ষমাণ অর্ডার, Admin PIN, মোড),
   Overview-তে "মনোযোগ দরকার" কার্ড (Checkup থেকে), Alt+১–৫ গ্রুপ-শর্টকাট।
   আগের ট্যাব/ফাংশন অপরিবর্তিত — শুধু তাদের ওপর নতুন স্তর। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var dh6 = function (t) { return new Date((t == null ? Date.now() : t) + 6 * 3600e3).toISOString().slice(0, 10); };
  var GROUPS = [
    ['home', '🏠 হোম', /overview|checkup/i],
    ['store', '🏪 দোকান ও শপ', /branding|rules|features|customer shop|coupons|payments|delivery|shop sync/i],
    ['people', '👥 মানুষ ও নিরাপত্তা', /roles|accounts|security|sign-in/i],
    ['reports', '📊 রিপোর্ট ও লগ', /sales & audit|insights|audit/i],
    ['tools', '🧰 টুলস ও ডেটা', /.*/]
  ];
  function groupOf(label) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i][2].test(label)) return GROUPS[i][0]; return 'tools'; }
  function css() {
    if (document.getElementById('v85css')) return; var s = document.createElement('style'); s.id = 'v85css';
    s.textContent = '.v85st{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;padding:.55rem 1rem;max-width:1150px;margin:0 auto}' +
      '.v85c{display:inline-flex;align-items:center;gap:.35rem;border:1px solid var(--br);background:var(--card);color:var(--fg);border-radius:999px;padding:.28rem .8rem;font-size:.86rem;cursor:pointer;font-family:inherit}' +
      '.v85c:hover{border-color:var(--pri)}.v85c.g{border-color:#7fd1a0}.v85c.r{border-color:#f0a19a}.v85c.y{border-color:#e8c36a}' +
      '.v85c b{font-weight:700}.v85nav{position:sticky;top:0;z-index:4;background:var(--card);border-bottom:1px solid var(--br)}' +
      '.v85nav .cc-tabs{position:static;border-bottom:0;padding-top:.3rem}' +
      '.v85g{display:flex;gap:.3rem;overflow-x:auto;padding:.5rem 1rem 0;scrollbar-width:none}.v85g::-webkit-scrollbar{display:none}' +
      '.v85g button{white-space:nowrap;border:0;border-bottom:3px solid transparent;border-radius:8px 8px 0 0;background:none;color:var(--fg);padding:.45rem .9rem;font-weight:600;cursor:pointer;font-family:inherit}' +
      '.v85g button.on{border-bottom-color:var(--pri);color:var(--pri);background:rgba(11,122,107,.08)}' +
      '.v85att{border:1px solid var(--br);background:var(--card);border-radius:14px;padding:1rem;margin:.8rem 0}.v85att h3{margin:0 0 .5rem}' +
      '.v85att .cc-grid{margin-top:.6rem}.v85sc{font-size:1.6rem;font-weight:800}' +
      '@media(max-width:640px){.v85st{padding:.45rem .6rem}.v85g{padding:.4rem .6rem 0}}';
    document.head.appendChild(s);
  }
  window.CCX = function (c) {
    var x = prev(c), h = c.h, rj = c.rj;
    /* ---- Overview: মনোযোগ দরকার কার্ড ---- */
    var ov = x.panels.overview;
    if (ov && x.panels.checkup) x.panels.overview = function () {
      var el = ov.apply(this, arguments);
      try {
        var ck = x.panels.checkup(), sc = ck.querySelector('b'), cards = [].slice.call(ck.querySelectorAll('.cc-card')).slice(0, 3);
        var n = ck.querySelectorAll('.cc-card').length, score = sc ? sc.textContent : '';
        var card = h('div', { class: 'v85att' }, h('h3', {}, '🩺 মনোযোগ দরকার'),
          h('div', {}, h('span', { class: 'v85sc' }, score), ' ', h('span', { class: 'muted' }, n ? n + 'টি বিষয় দেখার আছে' : '✅ সব ঠিক আছে')),
          cards.length ? h('div', { class: 'cc-grid' }, cards) : null,
          n > 3 ? c.btn('সবগুলো দেখুন (' + n + ') →', function () { c.show('checkup'); }) : null);
        el.insertBefore(card, el.children[1] || null);
      } catch (e) { console.warn('v85 overview', e); }
      return el;
    };
    /* ---- স্ট্যাটাস স্ট্রিপ + গ্রুপ-নেভ (DOM) ---- */
    function mount() {
      var tabs = document.getElementById('tabs'), app = document.getElementById('app'); if (!tabs || !app || document.getElementById('v85st')) return;
      css();
      var st = document.createElement('div'); st.id = 'v85st'; st.className = 'v85st'; st.setAttribute('aria-label', 'Live status');
      var nav = document.createElement('div'); nav.className = 'v85nav';
      var gb = document.createElement('div'); gb.id = 'v85g'; gb.className = 'v85g'; gb.setAttribute('role', 'tablist'); gb.setAttribute('aria-label', 'Sections');
      tabs.parentNode.insertBefore(st, tabs); tabs.parentNode.insertBefore(nav, tabs); nav.appendChild(gb); nav.appendChild(tabs);
      var lastIn = {}, curG = 'home';
      function btns() { return [].slice.call(tabs.querySelectorAll('button')); }
      function decorate() {
        var bs = btns(); if (!bs.length) return;
        var on = bs.filter(function (b) { return b.classList.contains('on'); })[0];
        if (on) { curG = groupOf(on.textContent); lastIn[curG] = on.textContent; }
        bs.forEach(function (b) { b.style.display = groupOf(b.textContent) === curG ? '' : 'none'; });
        gb.replaceChildren.apply(gb, GROUPS.map(function (g, i) {
          var cnt = bs.filter(function (b) { return groupOf(b.textContent) === g[0]; }).length; if (!cnt) return document.createTextNode('');
          var b = document.createElement('button'); b.type = 'button'; b.textContent = g[1]; b.className = g[0] === curG ? 'on' : ''; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', g[0] === curG ? 'true' : 'false'); b.title = 'Alt+' + (i + 1);
          b.addEventListener('click', function () { go(g[0]); }); return b;
        }));
        var onb = gb.querySelector('.on'); if (onb && onb.scrollIntoView) { try { onb.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { } }
      }
      function go(g) {
        var bs = btns().filter(function (b) { return groupOf(b.textContent) === g; }); if (!bs.length) return;
        var t = bs.filter(function (b) { return b.textContent === lastIn[g]; })[0] || bs[0]; t.click();
      }
      new MutationObserver(function () { decorate(); }).observe(tabs, { childList: true });
      decorate();
      document.addEventListener('keydown', function (e) {
        if (!e.altKey || e.ctrlKey || e.metaKey) return; var i = parseInt(e.key, 10); if (!(i >= 1 && i <= GROUPS.length)) return;
        var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && false) return; e.preventDefault(); go(GROUPS[i - 1][0]);
      });
      /* স্ট্যাটাস */
      function chip(cls, html, fn, title) { var b = document.createElement('button'); b.type = 'button'; b.className = 'v85c ' + cls; b.innerHTML = html; if (title) b.title = title; if (fn) b.addEventListener('click', fn); return b; }
      function ago(iso) {
        if (!iso) return null; var t = +iso > 1e11 ? +iso : Date.parse(iso); if (!t) return null; var d = Math.floor((Date.now() - t) / 864e5);
        return d <= 0 ? 'আজ' : d + ' দিন আগে';
      }
      function paint() {
        try {
          var D = c.db(), s = D.settings || {}, S = rj('pharmacy_settings', {}), open = s.shopOpen !== false;
          var today = dh6(), sales = rj('pharmacy_sales', []).filter(function (r) { return r.real && r.status !== 'Voided' && (r.date || (r.at ? dh6(new Date(r.at).getTime()) : '')) === today; });
          var tot = sales.reduce(function (a, r) { return a + (+r.total || 0); }, 0);
          var pend = (D.orders || []).filter(function (o) { return o.status === 'Pending' || o.status === 'Prescription Review'; }).length;
          var lb = ago(localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'));
          var old = lb && lb !== 'আজ' && parseInt(lb, 10) > 7;
          var srv = !!(window.MCSRV && MCSRV.active);
          var els = [
            chip(open ? 'g' : 'r', (open ? '🟢 শপ খোলা' : '🔴 শপ বন্ধ') + ' <b>· ' + (open ? 'বন্ধ করুন' : 'খুলুন') + '</b>', function () { toggleShop(open); }, 'অনলাইন অর্ডার চালু/বন্ধ'),
            chip(lb ? (old ? 'y' : 'g') : 'r', '💾 ব্যাকআপ: <b>' + (lb || 'নেওয়া হয়নি') + '</b>', function () { c.show('data'); }, 'ব্যাকআপ নিতে Data ট্যাবে যান'),
            chip('', '🧾 আজ <b>' + c.tk(Math.round(tot)) + '</b> (' + sales.length + ')', function () { c.show('logs'); }),
            chip(pend ? 'y' : '', '📦 অপেক্ষমাণ অর্ডার <b>' + pend + '</b>', function () { location.href = 'admin/orders.html'; }),
            chip(S.adminPin ? 'g' : 'y', '🔐 Admin PIN <b>' + (S.adminPin ? 'ON' : 'OFF') + '</b>', function () { c.show('signin'); }),
            chip('', srv ? '🖥 সার্ভার মোড' : '💻 ডেমো (ব্রাউজার)', null, srv ? 'ডেটা সার্ভারে সিঙ্ক হচ্ছে' : 'ডেটা শুধু এই ব্রাউজারে')
          ];
          st.replaceChildren.apply(st, els);
        } catch (e) { console.warn('v85 status', e); }
      }
      function toggleShop(open) {
        var run = function () {
          var D = c.db(); D.settings = D.settings || {}; D.settings.shopOpen = !open; c.save(D);
          var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: 'Control Center', msg: (open ? 'Closed' : 'Opened') + ' online shop (quick toggle)' }); c.wj('pharmacy_audit', a.slice(-300));
          c.ok(open ? 'শপ বন্ধ — অনলাইন অর্ডার নেওয়া হবে না' : 'শপ খোলা — অনলাইন অর্ডার চলবে'); paint();
        };
        if (open) { if (window.MCD && MCD.confirm) MCD.confirm('অনলাইন শপ বন্ধ করবেন? গ্রাহকেরা নতুন অর্ডার দিতে পারবেন না।').then(function (v) { if (v) run(); }); else if (confirm('অনলাইন শপ বন্ধ করবেন?')) run(); } else run();
      }
      paint(); setInterval(paint, 30000); addEventListener('storage', paint);
      new MutationObserver(function () { paint(); }).observe(app, { childList: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); }); else setTimeout(mount, 0);
    return x;
  };
})();

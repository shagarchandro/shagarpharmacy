/* v79 — Home page (index.html) আপডেট:
   • স্ক্রল-প্রগ্রেস বার, স্ক্রল-স্পাই নেভ (যে সেকশনে আছেন সেটা হাইলাইট), ☀/🌙 থিম বাটন (মনে রাখে), ↑ উপরে যান বাটন
   • স্ট্যাটাস স্ট্রিপ: আসল সার্ভার / ডেমো মোড, ঢাকার সময়, অনলাইন/অফলাইন
   • হিরোতে ওষুধ খোঁজার বক্স (শপের আসল তালিকা থেকে; "/" চাপলে ফোকাস)
   • 📦 অর্ডার ট্র্যাক (অর্ডার নম্বর + ফোন), 🎁 চলমান অফার (সক্রিয় কুপন থেকে), 📍 যোগাযোগ কার্ড
   • সার্ভার মোডে ডেমো পাসওয়ার্ড টেবিল লুকানো (আসল পাসওয়ার্ড ফাঁস না করতে)
   ডেটা না থাকলে সংশ্লিষ্ট অংশ নিজে লুকিয়ে যায়; কিছু ভেঙে পড়ে না। */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function dhakaDate() { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function money(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  var SRV = !!(window.MCSRV && window.MCSRV.active);
  var DB = rj('mc_db', {}), ST = Object.assign({}, DB.settings || {}, rj('pharmacy_settings', {}));

  /* ---------- CSS ---------- */
  var css = '' +
    'html[data-mc=dark]{--bg:#0f1426;--fg:#e8ecfa;--mut:#a3adcb;--card:#171e36;--br:#27304f;--sh:0 10px 30px rgba(0,0,0,.4)}' +
    'html[data-mc=light]{--bg:#f6f7fd;--fg:#16213a;--mut:#5c6783;--card:#fff;--br:#e3e7f5;--sh:0 10px 30px rgba(60,70,140,.12)}' +
    '#mcProg{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--pri),var(--pri2));z-index:60;transition:width .1s}' +
    'header.mcs{box-shadow:0 6px 24px rgba(40,50,110,.12)}header .nav{transition:height .2s}header.mcs .nav{height:54px}' +
    '.nav nav a.on:not(.btn){color:var(--fg);background:var(--card);box-shadow:inset 0 -2px 0 var(--pri)}' +
    '.mcth{border:1px solid var(--br);background:var(--card);color:var(--fg);border-radius:10px;padding:.35rem .6rem;cursor:pointer;font-size:1rem;line-height:1}' +
    '.mcstrip{background:color-mix(in srgb,var(--pri) 8%,var(--bg));border-bottom:1px solid var(--br);font-size:.82rem;color:var(--mut)}' +
    '.mcstrip .wrap{display:flex;flex-wrap:wrap;gap:.3rem 1.2rem;align-items:center;justify-content:center;padding-top:.35rem;padding-bottom:.35rem}' +
    '.mcdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:.35rem;background:#22c55e}.mcdot.off{background:#ef4444}.mcdot.demo{background:#f59e0b}' +
    '.mcsrch{position:relative;max-width:34rem;margin-top:1.2rem}' +
    '.mcsrch input{width:100%;padding:.85rem 1rem .85rem 2.6rem;border-radius:14px;border:0;font:inherit;color:#16213a;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.2)}' +
    '.mcsrch:before{content:"🔍";position:absolute;left:.9rem;top:50%;transform:translateY(-50%)}' +
    '.mcsrch kbd{position:absolute;right:.8rem;top:50%;transform:translateY(-50%);font-size:.75rem;background:#eef0ff;color:#555;border-radius:6px;padding:.1rem .4rem}' +
    '.mcsug{position:absolute;left:0;right:0;top:calc(100% + 6px);background:var(--card);color:var(--fg);border:1px solid var(--br);border-radius:14px;box-shadow:var(--sh);overflow:hidden;z-index:30;display:none}.mcsug.on{display:block}' +
    '.mcsug a{display:flex;justify-content:space-between;gap:.6rem;padding:.6rem .9rem;text-decoration:none;border-bottom:1px solid var(--br)}.mcsug a:last-child{border:0}.mcsug a:hover,.mcsug a.sel{background:color-mix(in srgb,var(--pri) 12%,transparent)}.mcsug small{color:var(--mut)}' +
    '.mctrk{display:grid;grid-template-columns:1fr 1fr auto;gap:.6rem}.mctrk input{padding:.7rem .9rem;border-radius:12px;border:1px solid var(--br);background:var(--bg);color:var(--fg);font:inherit;min-width:0}' +
    '@media(max-width:600px){.mctrk{grid-template-columns:1fr}}' +
    '.mcres{margin-top:1rem;padding:1rem;border-radius:14px;border:1px solid var(--br);background:color-mix(in srgb,var(--pri) 6%,var(--card))}.mcres.bad{border-color:#ef4444}' +
    '.mcst{display:inline-block;padding:.15rem .7rem;border-radius:999px;font-weight:700;font-size:.85rem;color:#fff;background:linear-gradient(135deg,var(--pri),var(--pri2))}.mcst.c{background:#ef4444}.mcst.d{background:#16a34a}' +
    '.mcoff{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap}.mcoff code{font-size:1.1rem;font-weight:800;letter-spacing:.06em}' +
    '#mcTop{position:fixed;right:16px;bottom:78px;z-index:40;width:42px;height:42px;border-radius:50%;border:0;color:#fff;font-size:1.2rem;cursor:pointer;background:linear-gradient(135deg,var(--pri),var(--pri2));box-shadow:var(--sh);opacity:0;pointer-events:none;transition:opacity .25s}#mcTop.on{opacity:1;pointer-events:auto}' +
    '.mcc a.btn{justify-content:center}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- থিম (☀/🌙) ---------- */
  var root = document.documentElement;
  function curTheme() { var t = null; try { t = localStorage.getItem('mc_home_theme'); } catch (e) { } if (t === 'dark' || t === 'light') return t; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function applyTheme(t) { root.setAttribute('data-mc', t); var b = $('#mcTh'); if (b) { b.textContent = t === 'dark' ? '☀️' : '🌙'; b.title = t === 'dark' ? 'Light mode' : 'Dark mode'; b.setAttribute('aria-label', b.title); } }
  applyTheme(curTheme());

  function build() {
    /* নেভ */
    var nav = $('#nav'), hdr = $('header');
    if (nav) {
      var cta = $('a.btn.p', nav);
      var th = document.createElement('button'); th.type = 'button'; th.className = 'mcth'; th.id = 'mcTh';
      th.onclick = function () { var n = (root.getAttribute('data-mc') === 'dark') ? 'light' : 'dark'; try { localStorage.setItem('mc_home_theme', n); } catch (e) { } applyTheme(n); };
      nav.insertBefore(th, cta); applyTheme(curTheme());
      function addLink(href, txt, before) { if ($('a[href="' + href + '"]', nav)) return; var a = document.createElement('a'); a.href = href; a.textContent = txt; nav.insertBefore(a, before || th); }
      addLink('#track', 'ট্র্যাক'); addLink('#contact', 'যোগাযোগ');
      try {
        var u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        if (u && u.name && cta) { cta.textContent = '👤 ' + String(u.name).split(' ')[0] + ' · Dashboard'; cta.href = 'dashboard.html'; }
      } catch (e) { }
    }
    var prog = document.createElement('div'); prog.id = 'mcProg'; document.body.appendChild(prog);
    var top = document.createElement('button'); top.id = 'mcTop'; top.type = 'button'; top.textContent = '↑'; top.title = 'উপরে যান'; top.setAttribute('aria-label', 'Back to top'); top.onclick = function () { scrollTo({ top: 0, behavior: 'smooth' }); }; document.body.appendChild(top);
    function onScroll() {
      var h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      prog.style.width = Math.min(100, p * 100) + '%'; if (hdr) hdr.classList.toggle('mcs', h.scrollTop > 8); top.classList.toggle('on', h.scrollTop > 500);
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* স্ট্যাটাস স্ট্রিপ */
    var strip = document.createElement('div'); strip.className = 'mcstrip'; strip.innerHTML = '<div class="wrap"><span id="mcMode"></span><span id="mcClock"></span><span id="mcNet"></span></div>';
    if (hdr) hdr.after(strip);
    function tick() {
      var d = new Date(), t = d.toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }), dt = d.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long' });
      $('#mcClock').textContent = '🕒 ' + dt + ' · ' + t;
      var on = navigator.onLine !== false; $('#mcNet').innerHTML = '<i class="mcdot' + (on ? '' : ' off') + '"></i>' + (on ? 'অনলাইন' : 'অফলাইন — সংরক্ষিত ডেটা দেখাচ্ছে');
    }
    $('#mcMode').innerHTML = SRV ? '<i class="mcdot"></i>আসল সার্ভার মোড — ডেটা ডাটাবেসে সুরক্ষিত' : '<i class="mcdot demo"></i>ডেমো মোড — ডেটা এই ব্রাউজারে থাকে';
    tick(); setInterval(tick, 30000); addEventListener('online', tick); addEventListener('offline', tick);

    /* স্ক্রল-স্পাই */
    if ('IntersectionObserver' in window && nav) {
      var links = {}; $$('a[href^="#"]', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === e.target.id); }); } });
      }, { rootMargin: '-40% 0px -55% 0px' });
      $$('section[id]').forEach(function (s) { if (links[s.id]) spy.observe(s); });
      setTimeout(function () { $$('section[id]').forEach(function (s) { if (links[s.id]) spy.observe(s); }); }, 500);
    }

    products(); tracker(); offers(); contact(); serverTweaks();
  }

  /* ---------- ওষুধ খোঁজা ---------- */
  function products() {
    var cta = $('.hero .cta'); if (!cta) return;
    var list = (DB.products || []).filter(function (p) { return p && !p.hide && p.name; });
    var box = document.createElement('div'); box.className = 'mcsrch';
    box.innerHTML = '<input id="mcQ" type="search" placeholder="ওষুধের নাম লিখুন — যেমন Napa, Seclo…" autocomplete="off" aria-label="ওষুধ খুঁজুন"><kbd>/</kbd><div class="mcsug" id="mcSug" role="listbox"></div>';
    cta.before(box);
    var q = $('#mcQ', box), sug = $('#mcSug', box), sel = -1, cur = [];
    function draw() {
      var v = q.value.trim().toLowerCase();
      if (!v) { sug.classList.remove('on'); return; }
      cur = list.filter(function (p) { return String(p.name).toLowerCase().indexOf(v) > -1 || String(p.generic || p.cat || '').toLowerCase().indexOf(v) > -1; }).slice(0, 6);
      var h = cur.map(function (p, i) { return '<a href="shop.html#/product/' + encodeURIComponent(p.id) + '" class="' + (i === sel ? 'sel' : '') + '"><span>' + esc(p.name) + (p.rx ? ' <small>℞ Rx</small>' : '') + '</span><small>' + (p.price != null ? money(p.price) : '') + '</small></a>'; }).join('');
      if (!cur.length) h = '<a href="shop.html"><span>' + (list.length ? '“' + esc(q.value) + '” পাওয়া যায়নি — শপে সব ওষুধ দেখুন' : 'শপ খুলে সব ওষুধ দেখুন') + '</span><small>→</small></a>';
      sug.innerHTML = h; sug.classList.add('on');
    }
    q.addEventListener('input', function () { sel = -1; draw(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, cur.length - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); var p = cur[sel < 0 ? 0 : sel]; location.href = p ? 'shop.html#/product/' + encodeURIComponent(p.id) : 'shop.html'; }
      else if (e.key === 'Escape') { sug.classList.remove('on'); q.blur(); }
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) sug.classList.remove('on'); });
    document.addEventListener('keydown', function (e) { if (e.key === '/' && !/input|textarea|select/i.test((e.target.tagName || ''))) { e.preventDefault(); q.focus(); scrollTo({ top: 0, behavior: 'smooth' }); } });

    /* হিরো কার্ডে আসল সংখ্যা (থাকলে) */
    var kp = $$('.mock .kp div'); if (kp.length === 3 && list.length) {
      var td = dhakaDate(), batches = DB.batches || [], inStock = list.filter(function (p) { return batches.some(function (b) { return b.pid === p.id && b.qty > 0 && (!b.exp || b.exp >= td); }); }).length;
      kp[1].innerHTML = '<b>' + bn(inStock || list.length) + '</b><small>শপে ওষুধ (স্টকে)</small>';
      var cps = activeCoupons().length; kp[2].innerHTML = '<b>' + bn(cps) + '</b><small>চলমান অফার</small>';
      var mk = $('.mock'); if (mk && !$('.mcreal', mk)) { var n = document.createElement('div'); n.className = 'mcreal'; n.style.cssText = 'font-size:.72rem;opacity:.8;text-align:right'; n.textContent = 'উপরের সংখ্যা: লাইভ · নিচের তালিকা: নমুনা'; mk.appendChild(n); }
    }
  }

  /* ---------- অফার ---------- */
  function activeCoupons() { var td = dhakaDate(); return (DB.coupons || []).filter(function (c) { return c && c.code && !c.off && (!c.expires || c.expires >= td); }); }
  function offers() {
    var cs = activeCoupons(), po = $('#portals'); if (!cs.length || !po) return;
    var s = document.createElement('section'); s.id = 'offers';
    s.innerHTML = '<div class="wrap"><div class="hd rev on"><h2>🎁 চলমান <span class="gt">অফার</span></h2><p>অনলাইন শপে চেকআউটের সময় কোড বসান</p></div><div class="grid g3" id="mcOff"></div></div>';
    po.after(s);
    $('#mcOff', s).innerHTML = cs.slice(0, 6).map(function (c) {
      return '<div class="card"><div class="mcoff"><div><code>' + esc(c.code) + '</code><div style="color:var(--mut)">' + esc(c.pct) + '% ছাড়' + (c.min ? ' · ন্যূনতম ' + money(c.min) : '') + (c.max ? ' · সর্বোচ্চ ' + money(c.max) : '') + '</div>' + (c.expires ? '<small style="color:var(--mut)">মেয়াদ: ' + esc(c.expires) + ' পর্যন্ত</small>' : '') + '</div><button class="cp" data-code="' + esc(c.code) + '">copy</button></div></div>';
    }).join('');
    $$('#mcOff .cp').forEach(function (b) { b.onclick = function () { try { navigator.clipboard.writeText(b.dataset.code); b.textContent = '✔'; setTimeout(function () { b.textContent = 'copy'; }, 1200); } catch (e) { } }; });
    var nav = $('#nav'); if (nav && !$('a[href="#offers"]', nav)) { var a = document.createElement('a'); a.href = '#offers'; a.textContent = 'অফার'; nav.insertBefore(a, $('a[href="#features"]', nav)); }
  }

  /* ---------- অর্ডার ট্র্যাক ---------- */
  function norm(p) { return String(p || '').replace(/\D/g, '').slice(-10); }
  function findOrder(no, phone) {
    no = String(no).trim().toUpperCase(); var ph = norm(phone);
    if (SRV && MCSRV.trackSync) { try { var o = MCSRV.trackSync(no, ph); if (o) return o; } catch (e) { } }
    var mine = rj('mc_myorders', []); if (Array.isArray(mine)) for (var i = 0; i < mine.length; i++) { var m = mine[i], o2 = m && (m.order || m); if (o2 && String(o2.no).toUpperCase() === no && norm(o2.phone || m.phone) === ph) return o2; }
    var all = rj('mc_db', {}).orders || []; for (var j = 0; j < all.length; j++) { var x = all[j]; if (x && String(x.no).toUpperCase() === no && norm(x.phone) === ph) return x; }
    return null;
  }
  function tracker() {
    var po = $('#offers') || $('#portals'); if (!po) return;
    var s = document.createElement('section'); s.id = 'track'; s.className = 'alt';
    s.innerHTML = '<div class="wrap" style="max-width:780px"><div class="hd rev on"><h2>📦 অর্ডার <span class="gt">ট্র্যাক করুন</span></h2><p>অর্ডার নম্বর ও যে ফোন নম্বরে অর্ডার করেছেন তা দিন</p></div>' +
      '<form class="card" id="mcTrk" autocomplete="off"><div class="mctrk"><input id="mcNo" placeholder="অর্ডার নম্বর (যেমন ORD-1042)" required aria-label="অর্ডার নম্বর"><input id="mcPh" type="tel" inputmode="tel" placeholder="ফোন নম্বর (01XXXXXXXXX)" required aria-label="ফোন নম্বর"><button class="btn p" type="submit">খুঁজুন</button></div><div id="mcTr"></div>' +
      '<small style="display:block;color:var(--mut);margin-top:.7rem">' + (SRV ? 'নম্বর ও ফোন সার্ভারে মিলিয়ে দেখা হয়।' : 'ডেমো মোডে শুধু এই ব্রাউজারে করা অর্ডারই পাওয়া যায়।') + '</small></form></div>';
    po.after(s);
    $('#mcTrk').addEventListener('submit', function (e) {
      e.preventDefault(); var no = $('#mcNo').value, ph = $('#mcPh').value, out = $('#mcTr');
      var o = findOrder(no, ph);
      if (!o) { out.innerHTML = '<div class="mcres bad">❌ এই নম্বর ও ফোনে কোনো অর্ডার পাওয়া যায়নি। নম্বর ও ফোন আবার দেখুন।</div>'; return; }
      var cls = /cancel|reject|return/i.test(o.status) ? 'c' : /deliver|complete/i.test(o.status) ? 'd' : '';
      var items = (o.items || []).map(function (i) { return esc(i.name) + ' ×' + esc(i.qty); }).join(', ');
      out.innerHTML = '<div class="mcres"><div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><b>' + esc(o.no) + '</b><span class="mcst ' + cls + '">' + esc(o.status) + '</span></div>' +
        (items ? '<div style="margin-top:.5rem;color:var(--mut)">' + items + '</div>' : '') +
        '<div style="margin-top:.5rem">মোট: <b>' + money(o.total) + '</b>' + (o.rider ? ' · 🛵 রাইডার: ' + esc(o.rider) : '') + (o.at ? ' · ' + esc(String(o.at).slice(0, 10)) : '') + '</div>' +
        '<div style="margin-top:.6rem"><a class="btn" href="shop.html#/orders">শপে বিস্তারিত দেখুন →</a></div></div>';
    });
  }

  /* ---------- যোগাযোগ ---------- */
  function contact() {
    var ft = $('footer'); if (!ft) return;
    var name = ST.store || 'MediCare Pharmacy', phone = ST.phone || '01700-000000', addr = ST.address || 'Dhanmondi, Dhaka', mail = ST.email || '';
    var digits = String(phone).replace(/\D/g, ''); if (/^0/.test(digits)) digits = '88' + digits;
    var hrs = '';
    if (ST.hoursOpen && ST.hoursClose) {
      var dn = new Date(Date.now() + 216e5), mm = dn.getUTCHours() * 60 + dn.getUTCMinutes(), tm = function (t) { var x = String(t).split(':'); return (+x[0]) * 60 + (+x[1] || 0); }, o = tm(ST.hoursOpen), cl = tm(ST.hoursClose);
      var offDay = ST.weeklyOff != null && ST.weeklyOff !== '' && +ST.weeklyOff === dn.getUTCDay(), isOpen = !offDay && (o <= cl ? (mm >= o && mm < cl) : (mm >= o || mm < cl));
      hrs = '<p style="margin:.2rem 0">' + (isOpen ? '🟢 <b>এখন খোলা</b>' : '🔴 <b>এখন বন্ধ</b>' + (offDay ? ' (আজ সাপ্তাহিক ছুটি)' : '')) + ' · সময়: ' + esc(ST.hoursOpen) + ' – ' + esc(ST.hoursClose) + '</p>';
    }
    var s = document.createElement('section'); s.id = 'contact';
    s.innerHTML = '<div class="wrap" style="max-width:780px"><div class="hd rev on"><h2>📍 <span class="gt">যোগাযোগ</span></h2><p>প্রশ্ন বা অর্ডারে সাহায্য লাগলে সরাসরি জানান</p></div>' +
      '<div class="card mcc"><h3 style="margin-top:0">' + esc(name) + '</h3><p style="margin:.2rem 0">📍 ' + esc(addr) + '</p><p style="margin:.2rem 0">📞 ' + esc(phone) + (mail ? ' · ✉ ' + esc(mail) : '') + '</p>' + hrs +
      '<div class="cta" style="margin-top:.9rem"><a class="btn p" href="tel:' + esc(phone.replace(/[^\d+]/g, '')) + '">📞 কল করুন</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + digits + '">💬 WhatsApp</a><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ' ' + addr) + '">🗺 ম্যাপ</a><a class="btn" href="contact.html">✉ মেসেজ পাঠান</a></div></div></div>';
    var secs = $$('section'), last = secs[secs.length - 1]; if (last) last.before(s); else ft.before(s);
  }

  /* ---------- সার্ভার মোডে ডেমো তথ্য লুকানো ---------- */
  function serverTweaks() {
    if (!SRV) return;
    var tb = $('#roles table tbody');
    if (tb) tb.innerHTML = '<tr><td colspan="4">🔒 <b>আসল সার্ভার মোড:</b> ডেমো পাসওয়ার্ড দেখানো হয় না। প্রথমবার অ্যাডমিনের দেওয়া অ্যাকাউন্টে ঢুকে নতুন পাসওয়ার্ড বসাতে হয়। ভুলে গেলে অ্যাডমিনকে বলুন — তিনি 🛡 Users থেকে রিসেট করে দেবেন।</td></tr>';
    var sub = $('#roles .hd p'); if (sub) sub.textContent = 'আপনার ভূমিকা অনুযায়ী অ্যাকাউন্ট অ্যাডমিন তৈরি করে দেন';
    $$('#faq details').forEach(function (d) {
      var t = $('summary', d).textContent;
      if (/ডেটা কোথায়/.test(t)) $('p', d).textContent = 'আসল সার্ভার মোডে সব ডেটা আপনার কম্পিউটারের SQLite ডাটাবেসে থাকে; ব্রাউজারে শুধু ক্যাশ। তবুও নিয়মিত Backup নিন।';
      if (/আসল নিরাপত্তা/.test(t)) $('p', d).textContent = 'সার্ভার মোডে লগইন, পাসওয়ার্ড যাচাই, সেশন ও অনুমতি সার্ভারেই হয় (HttpOnly কুকি, লগইন লক)। ইন্টারনেটে খুলতে চাইলে অবশ্যই HTTPS ব্যবহার করুন।';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

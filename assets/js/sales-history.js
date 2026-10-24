/* v65 – POS বিক্রির ইতিহাস: খোঁজা, ফিল্টার, রিপ্রিন্ট, রিফান্ডে যাওয়া, Void (কারণসহ, স্টক ফেরত, audit) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tk(n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN'); }
  function dhaka(d) { return (d || new Date()).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); }
  function user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || {}; } catch (e) { return {}; } }
  function role() { return String(user().role || '').toLowerCase(); }
  var f = { q: '', range: 'today', pay: '' }, ov = null;

  function css() {
    if (document.getElementById('sh65css')) return; var s = document.createElement('style'); s.id = 'sh65css';
    s.textContent = '.sh65{--b:#fff;--f:#16213a;--m:#5c6783;--br:#e3e7f5;position:fixed;inset:0;z-index:2147482000;background:rgba(15,20,40,.55);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;padding:16px;font-family:Inter,system-ui,"Noto Sans Bengali",sans-serif}@media(prefers-color-scheme:dark){.sh65{--b:#171e36;--f:#e8ecfa;--m:#a3adcb;--br:#2d3659}}' +
      '.sh65 .bx{background:var(--b);color:var(--f);border:1px solid var(--br);border-radius:20px;width:100%;max-width:640px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 25px 70px rgba(0,0,0,.35);overflow:hidden}.sh65 .hd{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.1rem .4rem}.sh65 .hd h3{margin:0;font-size:1.15rem}.sh65 .x{border:0;background:transparent;color:inherit;font-size:1.4rem;cursor:pointer;min-width:44px;min-height:44px}' +
      '.sh65 .tl{padding:0 1.1rem .6rem;display:flex;flex-direction:column;gap:.5rem}.sh65 input,.sh65 select{padding:.6rem .8rem;border:2px solid var(--br);border-radius:12px;background:transparent;color:var(--f);font:inherit}.sh65 .ch{display:flex;flex-wrap:wrap;gap:.4rem}.sh65 .c{border:1px solid var(--br);background:transparent;color:inherit;border-radius:99px;padding:.3rem .8rem;cursor:pointer;font:inherit;font-size:.85rem}.sh65 .c.on{background:#667eea;color:#fff;border-color:#667eea}' +
      '.sh65 .sm{padding:.3rem 1.1rem;color:var(--m);font-size:.9rem}.sh65 .ls{overflow:auto;padding:0 1.1rem 1rem}.sh65 .it{border:1px solid var(--br);border-radius:14px;padding:.7rem .85rem;margin:.5rem 0}.sh65 .it.vd{opacity:.6}.sh65 .it.vd .tt{text-decoration:line-through}.sh65 .r1{display:flex;justify-content:space-between;gap:.5rem;font-weight:700}.sh65 .r2{color:var(--m);font-size:.85rem;margin:.2rem 0 .5rem;overflow-wrap:anywhere}.sh65 .pl{display:inline-block;border-radius:99px;padding:0 .5rem;font-size:.72rem;font-weight:700;background:rgba(102,126,234,.18);margin-left:.3rem}.sh65 .pl.v{background:rgba(217,48,37,.18);color:#d93025}' +
      '.sh65 .ac{display:flex;flex-wrap:wrap;gap:.4rem}.sh65 .ac button,.sh65 .ac a{border:1px solid var(--br);background:transparent;color:inherit;border-radius:10px;padding:.35rem .7rem;font:inherit;font-size:.85rem;cursor:pointer;text-decoration:none;min-height:36px;display:inline-flex;align-items:center}.sh65 .ac .dg{color:#d93025;border-color:rgba(217,48,37,.5)}@media(max-width:560px){.sh65{align-items:flex-end;padding:0}.sh65 .bx{border-radius:22px 22px 0 0;max-height:94vh}}' +
      '#mcTools .sh65b{background:linear-gradient(135deg,#667eea,#764ba2)!important;color:#fff!important}';
    document.head.appendChild(s);
  }
  function all() { return rj('pharmacy_sales', []).filter(function (s) { return s && s.real; }); }
  function pick() {
    var td = dhaka(), yd = dhaka(new Date(Date.now() - 864e5)), wk = dhaka(new Date(Date.now() - 6 * 864e5)), q = f.q.toLowerCase(), staff = role() === 'staff', me = user().name || user().role || '';
    return all().filter(function (s) {
      var d = s.date || String(s.at || '').slice(0, 10);
      if (staff && s.cashier !== me) return false;
      if (f.range === 'today' && d !== td) return false; if (f.range === 'yday' && d !== yd) return false; if (f.range === 'week' && d < wk) return false;
      if (f.pay && s.paymentMethod !== f.pay) return false;
      var hay = [s.invoiceNo, s.customer, s.cashier, s.rx && s.rx.no].concat((s.items || []).map(function (i) { return i.name; })).join(' ').toLowerCase();
      return !q || hay.indexOf(q) > -1;
    }).sort(function (a, b) { return String(b.at || '') > String(a.at || '') ? 1 : -1; });
  }
  function draw() {
    if (!ov) return; var L = pick(), live = L.filter(function (s) { return s.status !== 'Voided'; }), tot = live.reduce(function (a, s) { return a + (+s.total || 0); }, 0), pays = {};
    all().forEach(function (s) { if (s.paymentMethod) pays[s.paymentMethod] = 1; });
    ov.querySelector('#shp').innerHTML = '<option value="">সব পেমেন্ট</option>' + Object.keys(pays).map(function (p) { return '<option' + (f.pay === p ? ' selected' : '') + ' value="' + esc(p) + '">' + esc(p) + '</option>'; }).join('');
    [].forEach.call(ov.querySelectorAll('[data-r]'), function (c) { c.classList.toggle('on', c.dataset.r === f.range); });
    ov.querySelector('.sm').innerHTML = '<b>' + live.length + '</b> ইনভয়েস · মোট <b>' + tk(tot) + '</b>' + (L.length > live.length ? ' · ' + (L.length - live.length) + 'টি void' : '');
    var canVoid = role() !== 'staff';
    ov.querySelector('.ls').innerHTML = L.slice(0, 80).map(function (s) {
      var v = s.status === 'Voided', t = s.at ? new Date(s.at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }) : '';
      return '<div class="it' + (v ? ' vd' : '') + '"><div class="r1"><span class="tt">' + esc(s.invoiceNo) + (v ? '<span class="pl v">VOID</span>' : '<span class="pl">' + esc(s.paymentMethod || '') + '</span>') + (s.rx ? '<span class="pl">Rx</span>' : '') + '</span><span class="tt">' + tk(s.total) + '</span></div>' +
        '<div class="r2">' + esc(s.date) + ' ' + t + ' · ' + esc(s.customer || 'Walk-in') + ' · ' + esc(s.cashier || '—') + '<br>' + (s.items || []).map(function (i) { return esc(i.name) + ' ×' + esc(i.quantity); }).join(', ') + (v && s.voidReason ? '<br>কারণ: ' + esc(s.voidReason) : '') + '</div>' +
        '<div class="ac"><button data-pr="' + esc(s.id) + '">🖨 রিসিট</button>' + (v ? '' : '<a href="refunds.html">↩ রিফান্ড</a>') + (canVoid && !v ? '<button class="dg" data-vd="' + esc(s.id) + '">🗑 Void</button>' : '') + '</div></div>';
    }).join('') || '<div class="r2" style="text-align:center;padding:1.5rem">কোনো বিক্রি পাওয়া যায়নি</div>';
    if (L.length > 80) ov.querySelector('.ls').insertAdjacentHTML('beforeend', '<div class="r2" style="text-align:center">প্রথম ৮০টি দেখানো হলো — সার্চ/ফিল্টার করুন</div>');
  }
  function receipt(s) {
    var S = rj('pharmacy_settings', {}), w = window.open('', '_blank'); if (!w) return (window.MCD ? MCD.alert('পপ-আপ অনুমতি দিন, তারপর আবার চেষ্টা করুন') : alert('Allow pop-ups'));
    w.document.write('<html><head><meta charset="utf-8"><title>' + esc(s.invoiceNo) + '</title><style>body{font:14px system-ui;padding:20px;max-width:380px;margin:auto}td{padding:3px 6px}table{width:100%;border-collapse:collapse}.r{text-align:right}hr{border:0;border-top:1px dashed #999}</style></head><body><h3 style="text-align:center;margin:0">' + esc(S.store || 'MediCare Pharmacy') + '</h3><p style="text-align:center;margin:.2rem 0 .6rem">' + esc(S.phone || '') + '</p><hr><p>Invoice: <b>' + esc(s.invoiceNo) + '</b>' + (s.status === 'Voided' ? ' <b style="color:#c00">(VOID)</b>' : '') + '<br>' + esc(s.date) + ' · ' + esc(s.customer || 'Walk-in') + (s.rx ? '<br>Rx: ' + esc(s.rx.no) : '') + '</p><table>' +
      (s.items || []).map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td>' + esc(i.quantity) + ' × ' + tk(i.price) + '</td><td class="r">' + tk(i.quantity * i.price) + '</td></tr>'; }).join('') + '</table><hr><table><tr><td>Subtotal</td><td class="r">' + tk(s.subtotal) + '</td></tr><tr><td>Discount</td><td class="r">-' + tk(s.discount) + '</td></tr><tr><td>Tax</td><td class="r">' + tk(s.tax) + '</td></tr><tr><td><b>Total</b></td><td class="r"><b>' + tk(s.total) + '</b></td></tr></table><p style="text-align:center">' + esc(S.receiptNote || 'ধন্যবাদ!') + '<br><small>(পুনর্মুদ্রণ)</small></p></body></html>');
    w.document.close(); setTimeout(function () { try { w.print(); } catch (e) {} }, 300);
  }
  function doVoid(id) {
    var s = all().filter(function (x) { return String(x.id) === String(id); })[0]; if (!s) return;
    var go = function (why) {
      if (why == null) return;
      var r = window.mcVoid(s, why, user().name || role());
      if (!r.ok) return (window.MCD ? MCD.alert(r.msg) : alert(r.msg));
      draw(); if (window.MCD && r.dueBack) MCD.alert(r.msg);
    };
    if (window.MCD) MCD.prompt('ইনভয়েস ' + s.invoiceNo + ' (' + tk(s.total) + ') void করবেন?\nস্টক ফেরত যাবে। কারণ লিখুন:', { title: 'Void ইনভয়েস', icon: '🗑️', danger: true, type: 'text', ok: 'Void করুন' }).then(go); else go(prompt('Reason:'));
  }
  function open() {
    css(); if (ov) ov.remove(); f = { q: '', range: 'today', pay: '' };
    ov = document.createElement('div'); ov.className = 'sh65'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="bx"><div class="hd"><h3>📜 বিক্রির ইতিহাস</h3><button class="x" aria-label="বন্ধ">✕</button></div><div class="tl"><input id="shq" type="search" placeholder="🔎 ইনভয়েস / গ্রাহক / ওষুধ / ক্যাশিয়ার" autocomplete="off"><div class="ch"><button class="c" data-r="today">আজ</button><button class="c" data-r="yday">গতকাল</button><button class="c" data-r="week">৭ দিন</button><button class="c" data-r="all">সব</button><select id="shp" style="margin-left:auto"></select></div></div><div class="sm"></div><div class="ls"></div></div>';
    document.body.appendChild(ov); draw();
    var close = function () { if (ov) { ov.remove(); ov = null; document.removeEventListener('keydown', esc2, true); } };
    function esc2(e) { if (e.key === 'Escape' && ov && !document.querySelector('.mcd-ov')) { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', esc2, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.classList.contains('x')) close(); else if (b.dataset.r) { f.range = b.dataset.r; draw(); } else if (b.dataset.pr) { var s = all().filter(function (x) { return String(x.id) === b.dataset.pr; })[0]; if (s) receipt(s); } else if (b.dataset.vd) doVoid(b.dataset.vd); });
    ov.querySelector('#shq').addEventListener('input', function (e) { f.q = e.target.value; draw(); });
    ov.querySelector('#shp').addEventListener('change', function (e) { f.pay = e.target.value; draw(); });
    setTimeout(function () { ov && ov.querySelector('#shq').focus(); }, 50);
  }
  function addBtn() {
    var t = document.getElementById('mcTools'); if (!t || t.querySelector('.sh65b')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sh65b'; b.textContent = '📜 Sales history'; b.onclick = open; t.insertBefore(b, t.firstChild); css();
  }
  setInterval(addBtn, 700); addBtn();
  window.mcSalesHistory = open;
})();

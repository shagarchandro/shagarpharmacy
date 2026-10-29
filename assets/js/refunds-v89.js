/* v89 Refunds: KPI (আজ/মাস/রিফান্ড-হার), সাম্প্রতিক ইনভয়েস কুইক-পিক, কারণ-চিপ, ফিল্টারযোগ্য ইতিহাস (তারিখ/মেথড/খোঁজ) + পদ্ধতি/শীর্ষ আইটেম সারাংশ */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  if (!$('box') || $('box').hidden) return;
  var dayOf = function (t) { return new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var today = dayOf(Date.now()), ym = today.slice(0, 7);
  var st = document.createElement('style');
  st.textContent = '.r89k{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}.r89k div{border:1px solid var(--br);border-radius:12px;padding:.7rem;text-align:center}.r89k b{display:block;font-size:1.3rem}.r89c{display:flex;flex-wrap:wrap;gap:.35rem;margin:.4rem 0}.r89c button{border:1px solid var(--br);background:var(--card);color:var(--fg);border-radius:99px;padding:.2rem .7rem;cursor:pointer;font:inherit;font-size:.85rem}.r89c button.on{background:var(--pri);color:#fff;border-color:var(--pri)}';
  document.head.appendChild(st);
  var kc = document.createElement('div'); kc.className = 'card'; kc.id = 'r89K';
  var rc = document.createElement('div'); rc.className = 'card'; rc.id = 'r89Recent';
  var hc = document.createElement('div'); hc.className = 'card'; hc.id = 'r89H';
  var box = $('box'); box.insertBefore(kc, box.firstChild); $('res').parentNode.insertBefore(rc, $('res'));
  var old = $('hs').closest('.card'); old.hidden = true; old.parentNode.insertBefore(hc, old);
  hc.innerHTML = '<h3>রিফান্ড ইতিহাস <span class="muted" id="r89T"></span></h3><div class="row"><label>From <input type="date" id="r89f"></label><label>To <input type="date" id="r89t"></label><select id="r89m" aria-label="Method"><option value="">সব মেথড</option></select><input id="r89q" placeholder="ইনভয়েস / আইটেম / কারণ" style="flex:1;min-width:150px"><button class="btn2" id="r89csv">⬇️ CSV (ফিল্টার)</button></div><div id="r89S" class="muted" style="margin:.5rem 0"></div><div class="scroll"><table><thead><tr><th>তারিখ</th><th>ইনভয়েস</th><th>আইটেম</th><th>মেথড</th><th>রিফান্ড</th><th>কারণ</th><th>কে</th></tr></thead><tbody id="r89B"></tbody></table></div>';
  function F() { var f = $('r89f').value, t = $('r89t').value, m = $('r89m').value, q = $('r89q').value.trim().toLowerCase(); return rj('pharmacy_refunds', []).filter(function (x) { var d = x.date || ''; return (!f || d >= f) && (!t || d <= t) && (!m || (x.method || 'cash') === m) && (!q || [x.invoice, x.items, x.reason, x.by].join(' ').toLowerCase().indexOf(q) >= 0); }); }
  var sig = '';
  function draw() {
    var H = rj('pharmacy_refunds', []), S = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status !== 'Voided'; });
    var sg = H.length + '|' + S.length + '|' + (H.length ? H[H.length - 1].at : ''); var ms = {}; H.forEach(function (x) { ms[x.method || 'cash'] = 1; });
    var cur = $('r89m').value; $('r89m').innerHTML = '<option value="">সব মেথড</option>' + Object.keys(ms).map(function (m) { return '<option' + (m === cur ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join(''); $('r89m').value = cur;
    var sum = function (L) { return L.reduce(function (a, x) { return a + (+x.amount || 0); }, 0); };
    var td = H.filter(function (x) { return x.date === today; }), mo = H.filter(function (x) { return (x.date || '').slice(0, 7) === ym; });
    var moS = S.filter(function (s) { return dayOf(s.at || s.date).slice(0, 7) === ym; }).reduce(function (a, s) { return a + (+s.total || 0); }, 0), rate = moS ? sum(mo) / moS * 100 : 0;
    kc.innerHTML = '<div class="r89k"><div><b>' + td.length + '</b>আজকের রিফান্ড</div><div><b class="bad">' + tk(sum(td)) + '</b>আজকের টাকা</div><div><b>' + tk(sum(mo)) + '</b>এই মাস (' + mo.length + 'টি)</div><div><b class="' + (rate > 5 ? 'bad' : '') + '">' + rate.toFixed(1) + '%</b>মাসের বিক্রির তুলনায়</div></div>' + (rate > 5 ? '<p class="bad" style="margin:.5rem 0 0">⚠ রিফান্ড-হার ৫% এর বেশি — কারণগুলো দেখুন।</p>' : '');
    /* সাম্প্রতিক ইনভয়েস */
    var rec = S.slice().sort(function (a, b) { return (b.at || b.date || '') > (a.at || a.date || '') ? 1 : -1; }).slice(0, 8);
    rc.innerHTML = '<h3>⏱ সাম্প্রতিক ইনভয়েস <span class="muted" style="font-size:.85rem;font-weight:400">(চাপলে খুঁজে দেখায়)</span></h3><div class="r89c">' + (rec.map(function (s) { return '<button data-inv="' + esc(s.invoiceNo) + '">' + esc(s.invoiceNo) + ' · ' + esc(s.customer || 'Walk-in') + ' · ' + tk(s.total) + '</button>'; }).join('') || '<span class="muted">বিক্রি নেই</span>') + '</div>';
    /* ইতিহাস */
    var L = F().slice().reverse(); $('r89T').textContent = '— ' + L.length + 'টি · ' + tk(sum(L));
    $('r89B').innerHTML = L.map(function (x) { return '<tr><td>' + esc(x.date) + '</td><td>' + esc(x.invoice) + '</td><td>' + esc(x.items) + '</td><td>' + esc(x.method || 'cash') + '</td><td class="bad">' + tk(x.amount) + '</td><td>' + esc(x.reason) + '</td><td>' + esc(x.by) + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="muted">কিছু নেই</td></tr>';
    var by = {}, rs = {}, it = {}; L.forEach(function (x) { var m = x.method || 'cash'; by[m] = (by[m] || 0) + (+x.amount || 0); var r = (x.reason || '—').toLowerCase(); rs[r] = (rs[r] || 0) + 1; String(x.items || '').split(';').forEach(function (p) { var n = p.replace(/×\d+\s*$/, '').trim(); if (n) it[n] = (it[n] || 0) + (+(p.match(/×(\d+)/) || [0, 1])[1]); }); });
    var top = function (o, n) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, n); };
    $('r89S').innerHTML = L.length ? 'মেথড: ' + Object.keys(by).map(function (m) { return esc(m) + ' ' + tk(by[m]); }).join(' · ') + '<br>বেশি কারণ: ' + top(rs, 3).map(function (r) { return esc(r) + ' (' + rs[r] + ')'; }).join(', ') + '<br>বেশি ফেরত আইটেম: ' + (top(it, 3).map(function (n) { return esc(n) + ' (' + it[n] + ')'; }).join(', ') || '—') : '';
  }
  rc.addEventListener('click', function (e) { var b = e.target.closest('[data-inv]'); if (!b) return; $('q').value = b.getAttribute('data-inv'); $('go').click(); decorate(); $('res').scrollIntoView({ behavior: 'smooth' }); });
  hc.addEventListener('input', draw); hc.addEventListener('change', draw);
  $('r89csv').onclick = function () { var L = [['Date', 'Invoice', 'Items', 'Method', 'Amount', 'Reason', 'By']].concat(F().map(function (x) { return [x.date, x.invoice, x.items, x.method || 'cash', x.amount, x.reason, x.by]; }));
    var c = L.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })); a.download = 'refunds-filtered.csv'; a.click(); };
  /* কারণ-চিপ: প্রতিটি ইনভয়েস কার্ডের কারণ-ইনপুটের নিচে */
  var REAS = ['ভুল ওষুধ', 'ক্ষতিগ্রস্ত/ড্যামেজ', 'মেয়াদ সমস্যা', 'ডাক্তার বদলেছেন', 'কাস্টমার মত বদল', 'অতিরিক্ত দেওয়া হয়েছে'];
  function decorate() {
    Array.prototype.forEach.call($('res').querySelectorAll('input[data-r]'), function (inp) {
      if (inp.parentNode.querySelector('.r89c')) return; var d = document.createElement('div'); d.className = 'r89c';
      d.innerHTML = REAS.map(function (r) { return '<button type="button">' + r + '</button>'; }).join(''); inp.insertAdjacentElement('afterend', d);
      d.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; inp.value = b.textContent; Array.prototype.forEach.call(d.children, function (x) { x.classList.toggle('on', x === b); }); });
    });
  }
  new MutationObserver(decorate).observe($('res'), { childList: true, subtree: true });
  draw(); setInterval(function () { var g = (localStorage.getItem('pharmacy_refunds') || '').length + '|' + (localStorage.getItem('pharmacy_sales') || '').length; if (g !== sig) { sig = g; draw(); } }, 900);
})();

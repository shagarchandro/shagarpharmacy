/* v89 Write-off: কারণ-ভিত্তিক ক্ষতি, ৬ মাসের ট্রেন্ড, মেয়াদের ঝুঁকি (৩০/৬০/৯০ দিন), ফিল্টারযোগ্য ইতিহাস, ২৪ ঘণ্টার মধ্যে "↩ বাতিল" (স্টক ফেরত, শুধু Admin) */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString(); };
  if (!$('box') || $('box').hidden) return;
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var isAdmin = (u && u.role === 'admin') || sessionStorage.getItem('mc_role') === 'Owner', who = (u && (u.name || u.role)) || sessionStorage.getItem('mc_role') || '';
  var today = new Date(Date.now() + 216e5).toISOString().slice(0, 10);
  var st = document.createElement('style');
  st.textContent = '.w89k{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}.w89k div{border:1px solid var(--br);border-radius:12px;padding:.7rem;text-align:center}.w89k b{display:block;font-size:1.25rem}.w89bar{display:flex;align-items:flex-end;gap:.5rem;height:90px;margin:.5rem 0}.w89bar div{flex:1;text-align:center;font-size:.72rem}.w89bar i{display:block;background:var(--bad);border-radius:4px 4px 0 0;min-height:2px}';
  document.head.appendChild(st);
  var ins = document.createElement('div'); ins.className = 'card'; ins.id = 'w89I';
  var hc = document.createElement('div'); hc.className = 'card'; hc.id = 'w89H';
  var old = $('hs').closest('.card'); old.hidden = true; $('box').insertBefore(ins, $('k').nextSibling); old.parentNode.insertBefore(hc, old);
  hc.innerHTML = '<h3>Write-off ইতিহাস <span class="muted" id="w89T"></span></h3><div class="row"><label>From <input type="date" id="w89f"></label><label>To <input type="date" id="w89t"></label><select id="w89r" aria-label="Reason"><option value="">সব কারণ</option></select><input id="w89q" placeholder="ওষুধ খুঁজুন" style="flex:1;min-width:140px"><button class="btn2" id="w89csv">⬇️ CSV (ফিল্টার)</button></div><div class="scroll"><table><thead><tr><th>তারিখ</th><th>ওষুধ</th><th>পরিমাণ</th><th>ক্ষতি</th><th>কারণ</th><th>কে</th><th></th></tr></thead><tbody id="w89B"></tbody></table></div>';
  function F() { var f = $('w89f').value, t = $('w89t').value, r = $('w89r').value, q = $('w89q').value.trim().toLowerCase(); return rj('pharmacy_writeoffs', []).filter(function (x) { var d = x.date || ''; return (!f || d >= f) && (!t || d <= t) && (!r || x.reason === r) && (!q || String(x.name).toLowerCase().indexOf(q) >= 0); }); }
  var sum = function (L) { return L.reduce(function (a, x) { return a + (+x.loss || 0); }, 0); };
  function draw() {
    var H = rj('pharmacy_writeoffs', []), meds = rj('pharmacy_medicines', []);
    /* ইনসাইট */
    var mo = today.slice(0, 7), by = {}; H.filter(function (x) { return (x.date || '').slice(0, 7) === mo; }).forEach(function (x) { by[x.reason || '—'] = (by[x.reason || '—'] || 0) + (+x.loss || 0); });
    var months = []; for (var i = 5; i >= 0; i--) { var d = new Date(today + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i); months.push(d.toISOString().slice(0, 7)); }
    var mv = months.map(function (m) { return sum(H.filter(function (x) { return (x.date || '').slice(0, 7) === m; })); }), mx = Math.max.apply(null, mv.concat([1]));
    function risk(n) { var l = new Date(Date.now() + 216e5 + n * 864e5).toISOString().slice(0, 10), t = 0, c = 0; meds.forEach(function (m) { var e = m.expiryDate && String(m.expiryDate).slice(0, 10); if (e && e >= today && e <= l && (+m.stock || 0) > 0) { t += (+m.stock) * (+m.purchasePrice || 0); c++; } }); return { t: t, c: c }; }
    var r30 = risk(30), r60 = risk(60), r90 = risk(90);
    var top = meds.filter(function (m) { return m.expiryDate && String(m.expiryDate).slice(0, 10) >= today && String(m.expiryDate).slice(0, 10) <= new Date(Date.now() + 216e5 + 90 * 864e5).toISOString().slice(0, 10) && (+m.stock || 0) > 0; }).sort(function (a, b) { return (b.stock * (b.purchasePrice || 0)) - (a.stock * (a.purchasePrice || 0)); }).slice(0, 5);
    ins.innerHTML = '<h3>🔎 ক্ষতির বিশ্লেষণ</h3><div class="w89k"><div><b class="bad">' + tk(r30.t) + '</b>৩০ দিনে শেষ (' + r30.c + 'টি)</div><div><b>' + tk(r60.t) + '</b>৬০ দিনে (' + r60.c + 'টি)</div><div><b>' + tk(r90.t) + '</b>৯০ দিনে (' + r90.c + 'টি)</div><div><b>' + tk(sum(H.filter(function (x) { return (x.date || '').slice(0, 7) === mo; }))) + '</b>এই মাসের write-off</div></div>' +
      '<p style="margin:.6rem 0 0">কারণ (এই মাস): ' + (Object.keys(by).map(function (r) { return esc(r) + ' ' + tk(by[r]); }).join(' · ') || '<span class="muted">নেই</span>') + '</p>' +
      '<div class="w89bar" aria-label="৬ মাসের ক্ষতি">' + mv.map(function (v, i) { return '<div title="' + tk(v) + '"><i style="height:' + Math.round(v / mx * 70) + 'px"></i>' + months[i].slice(5) + '</div>'; }).join('') + '</div>' +
      (top.length ? '<p class="muted" style="margin:.3rem 0">⏳ ৯০ দিনের ঝুঁকি (বড় ক্ষতি আগে): ' + top.map(function (m) { return esc(m.name) + ' ' + tk(m.stock * (m.purchasePrice || 0)) + ' (' + esc(String(m.expiryDate).slice(0, 10)) + ')'; }).join(' · ') + '<br>💡 আগে বিক্রি/সাপ্লায়ারকে ফেরতের চেষ্টা করুন।</p>' : '');
    /* ইতিহাস */
    var rs = {}; H.forEach(function (x) { rs[x.reason || '—'] = 1; }); var cur = $('w89r').value;
    $('w89r').innerHTML = '<option value="">সব কারণ</option>' + Object.keys(rs).map(function (r) { return '<option' + (r === cur ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join(''); $('w89r').value = cur;
    var L = F().slice().reverse(); $('w89T').textContent = '— ' + L.length + 'টি · ' + tk(sum(L));
    $('w89B').innerHTML = L.map(function (x) {
      var rec = x.at && Date.now() - new Date(x.at).getTime() < 864e5 && !x.undone;
      return '<tr><td>' + esc(x.date) + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.qty) + '</td><td>' + tk(x.loss) + '</td><td>' + esc(x.reason) + '</td><td>' + esc(x.by) + '</td><td>' + (rec && isAdmin ? '<button class="btn2" data-undo="' + esc(x.at) + '|' + esc(x.id) + '">↩ বাতিল</button>' : '') + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="muted">কিছু নেই</td></tr>';
  }
  hc.addEventListener('input', draw); hc.addEventListener('change', draw);
  hc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-undo]'); if (!b) return; var p = b.getAttribute('data-undo').split('|'), log = rj('pharmacy_writeoffs', []), ix = -1;
    log.forEach(function (x, i) { if (x.at === p[0] && String(x.id) === p[1]) ix = i; }); if (ix < 0) return; var x = log[ix];
    Promise.resolve(window.MCD ? MCD.confirm(x.name + ' ×' + x.qty + ' — write-off বাতিল করে স্টক ফেরত দেবেন?') : confirm('বাতিল করবেন?')).then(function (ok) {
      if (!ok) return; var meds = rj('pharmacy_medicines', []), m = meds.find(function (y) { return String(y.id) === String(x.id); });
      if (m) m.stock = (+m.stock || 0) + (+x.qty || 0); log.splice(ix, 1);
      localStorage.setItem('pharmacy_medicines', JSON.stringify(meds)); localStorage.setItem('pharmacy_writeoffs', JSON.stringify(log));
      try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who, msg: 'Write-off undone: ' + x.name + ' x' + x.qty }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { }
      location.reload();
    });
  });
  $('w89csv').onclick = function () { var L = [['Date', 'Medicine', 'Qty', 'Loss', 'Reason', 'By']].concat(F().map(function (x) { return [x.date, x.name, x.qty, x.loss, x.reason, x.by]; }));
    var c = L.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })); a.download = 'writeoffs-filtered.csv'; a.click(); };
  var sig = ''; draw();
  setInterval(function () { var g = (localStorage.getItem('pharmacy_writeoffs') || '').length + '|' + (localStorage.getItem('pharmacy_medicines') || '').length; if (g !== sig) { sig = g; draw(); } }, 900);
})();

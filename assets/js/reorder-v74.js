/* v74 — Reorder: 📬 "অর্ডার দেওয়া হয়েছে / পথে আছে" ট্র্যাকিং।
   সাপ্লায়ার-অর্ডার কার্ডে "✔ অর্ডার দেওয়া হয়েছে" → তালিকায় সেভ; তালিকার ওষুধের পাশে "পথে আছে N" ব্যাজ ও লুকানোর টিক;
   "📥 পেয়েছি" দিলে বন্ধ। ডেটা: pharmacy_reorder_log */
(function () {
  'use strict';
  var box = document.getElementById('box'); if (!box || box.hidden) return;
  var $ = function (i) { return document.getElementById(i); }, KEY = 'pharmacy_reorder_log';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var me = (u && (u.name || u.role)) || sessionStorage.getItem('mc_ops_name') || '';
  function load() { var a = rj(KEY, []); return Array.isArray(a) ? a : []; }
  function save(a) { localStorage.setItem(KEY, JSON.stringify(a.slice(-150))); }
  var ago = function (t) { var d = Math.floor((Date.now() - new Date(t)) / 864e5); return d < 1 ? 'আজ' : d + ' দিন আগে'; };
  var panel = document.createElement('div'); panel.className = 'card noprint'; var pos = $('pos'); pos.parentNode.insertBefore(panel, pos);
  var hide = true;
  function onOrder() { var m = {}; load().filter(function (o) { return o.status === 'ordered'; }).forEach(function (o) { o.items.forEach(function (i) { m[i.n] = (m[i.n] || 0) + i.q; }); }); return m; }
  function draw() {
    var L = load().filter(function (o) { return o.status === 'ordered'; }).reverse(), done = load().filter(function (o) { return o.status === 'received'; }).length;
    panel.innerHTML = '<h3 style="margin:.1rem 0">📬 অর্ডার করা — পথে আছে (' + L.length + ') <span class="muted" style="font-weight:400;font-size:.85rem">· পাওয়া গেছে ' + done + 'টি</span></h3>'
      + (L.length ? '<label class="muted"><input type="checkbox" id="roHide" ' + (hide ? 'checked' : '') + '> পথে-থাকা ওষুধ নিচের তালিকায় লুকান</label>' : '<p class="muted" style="margin:.3rem 0">এখনো কিছু নেই। নিচে "সাপ্লায়ার অনুযায়ী অর্ডার তৈরি" করে "✔ অর্ডার দেওয়া হয়েছে" চাপুন — পরে একই ওষুধ আবার রিঅর্ডার তালিকায় আসবে না।</p>')
      + L.map(function (o) { return '<div class="it" style="border-top:1px solid var(--br);padding:.5rem 0"><b>' + esc(o.sup) + '</b> <span class="muted">· ' + ago(o.at) + ' · ' + esc(o.by || '') + '</span><div class="muted" style="font-size:.88rem">' + o.items.map(function (i) { return esc(i.n) + ' × ' + i.q; }).join(' · ') + '</div><div class="row" style="margin-top:.3rem"><button class="btn2" data-rec="' + o.id + '">📥 পেয়েছি</button><button class="btn2" data-del="' + o.id + '">✖ বাতিল</button></div></div>'; }).join('');
    mark();
  }
  function mark() {
    var m = onOrder(), rows = $('tb').querySelectorAll('tr');
    [].forEach.call(rows, function (tr) {
      var td = tr.children[1]; if (!td) return; var old = td.querySelector('.ro'); if (old) old.remove(); tr.style.display = '';
      var txt = td.textContent.trim(), key = Object.keys(m).filter(function (n) { return txt.indexOf(n) === 0; }).sort(function (a, b) { return b.length - a.length; })[0];
      if (key) { var b = document.createElement('span'); b.className = 'ro'; b.textContent = ' 📬 পথে ' + m[key]; b.style.cssText = 'font-size:.75rem;background:#e0f2fe;color:#075985;border-radius:99px;padding:1px 7px;white-space:nowrap'; td.appendChild(b); if (hide) tr.style.display = 'none'; }
    });
  }
  panel.addEventListener('change', function (e) { if (e.target.id === 'roHide') { hide = e.target.checked; mark(); } });
  panel.addEventListener('click', function (e) {
    var t = e.target, a = load(), id;
    if ((id = t.getAttribute('data-rec'))) { a.forEach(function (o) { if (String(o.id) === id) { o.status = 'received'; o.rcv = new Date().toISOString(); } }); save(a); draw(); }
    else if ((id = t.getAttribute('data-del'))) { a = a.filter(function (o) { return String(o.id) !== id; }); save(a); draw(); }
  });
  // সাপ্লায়ার PO কার্ডে বাটন যোগ
  function decorate() {
    [].forEach.call(pos.querySelectorAll('.card.po'), function (c) {
      if (c.querySelector('.roBtn')) return; var row = c.querySelector('.row'); if (!row) return;
      var b = document.createElement('button'); b.className = 'btn roBtn'; b.type = 'button'; b.textContent = '✔ অর্ডার দেওয়া হয়েছে'; row.appendChild(b);
      b.addEventListener('click', function () {
        var sup = (c.querySelector('h3').childNodes[0].textContent || '').trim(), items = [].map.call(c.querySelectorAll('tbody tr'), function (tr) { return { n: tr.children[1].textContent.trim(), q: +tr.children[2].textContent || 0 }; }).filter(function (i) { return i.n && i.q > 0; });
        if (!items.length) return; var a = load(); a.push({ id: Date.now(), at: new Date().toISOString(), sup: sup, by: me, items: items, status: 'ordered' }); save(a);
        b.textContent = '✔ সেভ হয়েছে'; b.disabled = true; draw();
      });
    });
  }
  new MutationObserver(decorate).observe(pos, { childList: true });
  new MutationObserver(function () { mark(); }).observe($('tb'), { childList: true });
  window.addEventListener('storage', function (e) { if (e.key === KEY) draw(); });
  draw(); decorate();
})();

/* v88 Reorder: সাপ্লায়ার অনুযায়ী "🛒 Purchase বানান" (ড্রাফট → purchases.html), ক্যাটাগরি ফিল্টার, এক্সপায়ার-কাছে ফ্ল্যাগ */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  if (!$('po') || $('box').hidden) return;
  var meds = rj('pharmacy_medicines', []), sups = rj('pharmacy_suppliers', []);
  var byName = {}; meds.forEach(function (m) { byName[String(m.name).toLowerCase()] = m; });
  /* ক্যাটাগরি ফিল্টার: সারি লুকিয়ে */
  var cats = {}; meds.forEach(function (m) { if (m.category) cats[m.category] = 1; });
  var host = $('q').parentNode, sel = document.createElement('select'); sel.id = 'v88Cat'; sel.setAttribute('aria-label', 'Category');
  sel.innerHTML = '<option value="">সব ক্যাটাগরি</option>' + Object.keys(cats).sort().map(function (c) { return '<option>' + c.replace(/[&<>"]/g, '') + '</option>'; }).join('');
  host.insertBefore(sel, $('q'));
  function nameOf(tr) { var td = tr.children[1]; return td ? td.firstChild.textContent.trim() : ''; }
  function decorate() {
    var lim = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10), c = sel.value;
    Array.prototype.forEach.call($('tb').querySelectorAll('tr'), function (tr) {
      var m = byName[nameOf(tr).toLowerCase()]; if (!m) return;
      tr.style.display = c && m.category !== c ? 'none' : '';
      var td = tr.children[1];
      if (m.expiryDate && String(m.expiryDate).slice(0, 10) <= lim && !td.querySelector('.v88x')) { var s = document.createElement('span'); s.className = 'tag bad v88x'; s.textContent = '⏳ এক্সপায়ার কাছে'; s.title = 'পুরনো ব্যাচ আগে বিক্রি/ফেরত দিন, অর্ডার কমাতে পারেন'; td.appendChild(document.createTextNode(' ')); td.appendChild(s); }
    });
  }
  sel.onchange = decorate;
  new MutationObserver(function () { if (!decorate.busy) { decorate.busy = 1; decorate(); decorate.busy = 0; } }).observe($('tb'), { childList: true });
  decorate();
  /* Purchase ড্রাফট */
  var bt = document.createElement('button'); bt.className = 'btn2'; bt.id = 'v88Pur'; bt.textContent = '🛒 Purchase বানান (নির্বাচিত)';
  $('po').parentNode.insertBefore(bt, $('csv'));
  bt.onclick = function () {
    var rows = Array.prototype.filter.call($('tb').querySelectorAll('tr'), function (tr) { var c = tr.querySelector('[data-c]'); return c && c.checked && tr.style.display !== 'none'; });
    var items = [], sname = '';
    rows.forEach(function (tr) {
      var m = byName[nameOf(tr).toLowerCase()], q = tr.querySelector('[data-q]'), s = tr.querySelector('[data-s]');
      if (!m || !q || !(+q.value > 0)) return; if (s && s.value && !sname) sname = s.value;
      items.push({ medicineId: m.id, medicineName: m.name, qty: +q.value, unitPrice: +m.purchasePrice || 0 });
    });
    if (!items.length) { (window.MCD ? MCD.alert('কিছু নির্বাচিত নেই বা সংখ্যা ০।') : alert('কিছু নির্বাচিত নেই')); return; }
    var sp = sups.filter(function (x) { return (x.companyName || x.name) === sname; })[0];
    try { localStorage.setItem('mc_po_draft', JSON.stringify({ at: Date.now(), supplierId: sp ? sp.id : '', items: items })); } catch (e) { }
    location.href = 'purchases.html?draft=1' + (sp ? '&supplier=' + encodeURIComponent(sp.id) : '');
  };
})();

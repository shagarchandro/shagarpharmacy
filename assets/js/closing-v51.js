/* Daily closing v51: full cash-drawer reconciliation. Cash sales − refunds + due collected − cash expenses − other cash-out,
   denomination counter, bank deposit → next day's opening, difference needs a reason, revisions, CSV, print header. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tk = function (n) { n = +n || 0; return (n < 0 ? '−' : '') + '৳' + (Math.round(Math.abs(n) * 100) / 100).toLocaleString(); };
  var dayOf = function (iso) { return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); };
  var u = null; try { u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { }
  var rl = u && u.role || '', mr = sessionStorage.getItem('mc_role');
  var ok = rl === 'admin' || rl === 'pharmacist' || mr === 'Owner' || mr === 'Pharmacist';
  var who = (u && (u.name || u.role)) || mr || '';
  if (!ok) { $('deny').hidden = false; return; } $('box').hidden = false;
  var S = rj('pharmacy_settings', {}); $('phName').textContent = (S.storeName || S.name || S.store || 'MediCare Pharmacy') + ' — Daily closing';
  var DEN = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1], today = function () { return dayOf(Date.now()); };
  var cash = 0, net = 0, sales = 0, other = [], denoms = {}, manualCnt = false, expCash = 0, dueCash = 0, saleCash = 0;
  $('d').value = today(); $('d').max = today();
  $('den').append.apply($('den'), DEN.map(function (v) { var l = document.createElement('label'); l.innerHTML = '৳' + v + ' ×'; var i = document.createElement('input'); i.type = 'number'; i.min = 0; i.step = 1; i.setAttribute('data-v', v); i.setAttribute('aria-label', '৳' + v + ' count'); l.append(i); return l; }));

  function closings() { return rj('pharmacy_closings', []); }
  function prevClosing(d) { return closings().filter(function (x) { return x.date < d; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0]; }
  function calc() {
    var d = $('d').value; if (!d) return;
    var S0 = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && dayOf(s.at || s.date) === d; });
    var S = S0.filter(function (s) { return s.status !== 'Voided'; }), voids = S0.length - S.length;
    var R = rj('pharmacy_refunds', []).filter(function (r) { return dayOf(r.at || r.date) === d; });
    var by = {}, cs = {}, tot = 0, disc = 0, due = 0;
    S.forEach(function (s) {
      tot += +s.total || 0; disc += +s.discount || 0; due += +s.due || 0;
      var c = s.cashier || '—'; cs[c] = cs[c] || { n: 0, t: 0 }; cs[c].n++; cs[c].t += +s.total || 0;
      if (s.parts && s.parts.length) { s.parts.forEach(function (q) { by[q.m] = by[q.m] || { n: 0, t: 0 }; by[q.m].n++; by[q.m].t += +q.amt || 0; }); return; }
      var m = (s.paymentMethod || 'cash').toLowerCase(); by[m] = by[m] || { n: 0, t: 0 }; by[m].n++; by[m].t += +s.total || 0;
    });
    var ref = R.reduce(function (a, r) { return a + (+r.amount || 0); }, 0), refCash = R.reduce(function (a, r) { return a + ((r.method || 'cash') === 'cash' ? (+r.amount || 0) : 0); }, 0); sales = tot; net = tot - ref;
    saleCash = (by.cash ? by.cash.t : 0) - refCash;
    var P = rj('pharmacy_customer_payments', {}); dueCash = 0; Object.keys(P).forEach(function (k) { (P[k] || []).forEach(function (p) { if (p && p.date === d && /cash/i.test(p.method || '')) dueCash += +p.amount || 0; }); });
    var db = rj('mc_db', { expenses: [] }); expCash = (db.expenses || []).filter(function (e) { return e && e.cash && e.at && dayOf(e.at) === d; }).reduce(function (a, e) { return a + (+e.amt || 0); }, 0);
    cash = saleCash;
    $('k').innerHTML = '<div><b>' + S.length + '</b>ইনভয়েস' + (voids ? ' <span class="muted">(' + voids + ' বাতিল)</span>' : '') + '</div><div><b>' + tk(tot) + '</b>মোট বিক্রি</div><div><b class="bad">' + tk(ref) + '</b>রিফান্ড</div><div><b>' + tk(net) + '</b>নিট বিক্রি</div><div><b>' + tk(saleCash) + '</b>ক্যাশ বিক্রি (রিফান্ড বাদে)</div><div><b class="sm">' + tk(disc) + '</b>ডিসকাউন্ট</div><div><b class="sm' + (due ? ' bad' : '') + '">' + tk(due) + '</b>বাকি (নতুন)</div>';
    $('m').innerHTML = Object.keys(by).map(function (m) { return '<tr><td>' + esc(m) + '</td><td>' + by[m].n + '</td><td>' + tk(by[m].t) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="muted">বিক্রি নেই</td></tr>';
    $('cs').innerHTML = Object.keys(cs).map(function (m) { return '<tr><td>' + esc(m) + '</td><td>' + cs[m].n + '</td><td>' + tk(cs[m].t) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="muted">—</td></tr>';
    // load saved closing for this date (or defaults)
    var sv = closings().filter(function (x) { return x.date === d; })[0], pv = prevClosing(d);
    other = sv && sv.out ? sv.out.slice() : []; denoms = sv && sv.den ? sv.den : {}; manualCnt = false;
    var left = pv ? Math.max(0, (+pv.counted || 0) - (+pv.deposit || 0)) : 0;
    $('open').value = sv ? sv.open : left; $('openHint').textContent = pv ? '(আগের ক্লোজিং: ' + tk(left) + ')' : '';
    $('cnt').value = sv ? sv.counted : ''; $('dep').value = sv ? (sv.deposit || 0) : 0; $('note').value = sv ? (sv.note || '') : '';
    $('den').querySelectorAll('input').forEach(function (i) { i.value = denoms[i.getAttribute('data-v')] || ''; });
    $('st').className = 'pill ' + (sv ? 'ok' : ''); $('st').textContent = sv ? '✔ ক্লোজড · ' + esc(sv.by || '') + (sv.rev > 1 ? ' · সংশোধন ' + sv.rev : '') : (d === today() ? '● চলমান' : '○ ক্লোজ হয়নি');
    $('save').textContent = sv ? '✔ সংশোধন করে সংরক্ষণ' : '✔ ক্লোজ করে সংরক্ষণ';
    outs(); diff();
  }
  function outAmt() { return other.reduce(function (a, o) { return a + (+o.amt || 0); }, 0); }
  function expected() { return (+$('open').value || 0) + saleCash + dueCash - expCash - outAmt(); }
  function outs() { $('oList').innerHTML = other.map(function (o, i) { return '<li>' + esc(o.why) + ' — ' + tk(o.amt) + ' <button class="btn2 noprint" data-i="' + i + '" style="padding:0 .4rem" aria-label="Remove">✕</button></li>'; }).join(''); }
  function diff() {
    var exp = expected(), c = $('cnt').value;
    $('eSales').textContent = tk(saleCash); $('eDue').textContent = tk(dueCash); $('eExp').textContent = '−' + tk(expCash).replace('−', ''); $('eOut').textContent = '−' + tk(outAmt()).replace('−', ''); $('eTot').textContent = tk(exp);
    var df = c === '' ? null : (+c - exp);
    $('diff').innerHTML = 'প্রত্যাশিত ক্যাশ: <b>' + tk(exp) + '</b>' + (df === null ? '' : ' · পার্থক্য: <b class="' + (Math.abs(df) < 0.01 ? 'ok' : 'bad') + '">' + tk(df) + (Math.abs(df) < 0.01 ? ' ✔ মিলেছে' : df > 0 ? ' (বেশি)' : ' (কম)') + '</b>');
    var dep = +$('dep').value || 0; $('left').textContent = c === '' ? '' : 'ড্রয়ারে থাকবে (পরের দিনের শুরুর ক্যাশ): ' + tk(Math.max(0, +c - dep)) + (dep > +c ? ' — জমা গণনার চেয়ে বেশি!' : '');
  }
  function fromDen() { var s = 0, any = false; $('den').querySelectorAll('input').forEach(function (i) { var n = Math.floor(+i.value || 0); if (n > 0) { s += n * +i.getAttribute('data-v'); any = true; denoms[i.getAttribute('data-v')] = n; } else delete denoms[i.getAttribute('data-v')]; }); if (any) $('cnt').value = s; diff(); }
  $('den').addEventListener('input', fromDen);
  ['open', 'cnt', 'dep'].forEach(function (i) { $(i).addEventListener('input', diff); });
  $('cnt').addEventListener('input', function () { manualCnt = true; });
  $('d').addEventListener('change', calc); $('td').onclick = function () { $('d').value = today(); calc(); };
  function shift(n) { var x = new Date($('d').value + 'T00:00:00'); x.setDate(x.getDate() + n); var v = x.toLocaleDateString('en-CA'); if (v > today()) return; $('d').value = v; calc(); }
  $('prev').onclick = function () { shift(-1); }; $('next').onclick = function () { shift(1); };
  $('oAdd').onclick = function () { var w = $('oWhy').value.trim(), a = +$('oAmt').value; if (!w || !(a > 0)) { alert('কারণ ও ধনাত্মক টাকার অঙ্ক দিন'); return; } other.push({ why: w.slice(0, 60), amt: Math.round(a * 100) / 100 }); $('oWhy').value = $('oAmt').value = ''; outs(); diff(); };
  $('oList').addEventListener('click', function (e) { var i = e.target.getAttribute && e.target.getAttribute('data-i'); if (i != null) { other.splice(+i, 1); outs(); diff(); } });
  $('pr').onclick = function () { $('phSub').textContent = $('d').value + ' · ' + who; print(); };
  $('save').onclick = function () {
    var c = $('cnt').value; if (c === '') { alert('গণনা করা ক্যাশ দিন'); return; }
    var open = +$('open').value || 0, dep = +$('dep').value || 0; if (open < 0 || +c < 0 || dep < 0) { alert('অঙ্ক ঋণাত্মক হতে পারবে না'); return; }
    if (dep > +c) { alert('জমার অঙ্ক গণনা করা ক্যাশের চেয়ে বেশি হতে পারে না'); return; }
    var exp = expected(), df = +c - exp, note = $('note').value.trim();
    if (Math.abs(df) >= 1 && note.length < 3) { alert('ক্যাশে পার্থক্য আছে (' + tk(df) + ') — নোটে কারণ লিখুন'); $('note').focus(); return; }
    var L = closings(), old = L.filter(function (x) { return x.date === $('d').value; })[0];
    if (old && !confirm($('d').value + ' এর ক্লোজিং আগেই হয়েছে। সংশোধন করবেন?')) return;
    L = L.filter(function (x) { return x.date !== $('d').value; });
    L.push({ date: $('d').value, net: net, sales: sales, expected: exp, counted: +c, diff: df, open: open, deposit: dep, cashSales: saleCash, dueCash: dueCash, expCash: expCash, out: other, den: denoms, note: note.slice(0, 200), by: who, at: new Date().toISOString(), rev: (old && old.rev || 1) + (old ? 1 : 0) });
    L.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); localStorage.setItem('pharmacy_closings', JSON.stringify(L.slice(-400)));
    try { var a = rj('pharmacy_audit', []); a.push({ at: new Date().toISOString(), by: who, msg: (old ? 'Day re-closed ' : 'Day closed ') + $('d').value + (Math.abs(df) >= 1 ? ' (diff ' + tk(df) + ')' : '') }); localStorage.setItem('pharmacy_audit', JSON.stringify(a.slice(-300))); } catch (e) { }
    calc(); hist();
  };
  function hist() {
    var L = closings().slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    $('h').innerHTML = L.map(function (x) { return '<tr class="click" data-d="' + esc(x.date) + '"><td>' + esc(x.date) + '</td><td>' + tk(x.net) + '</td><td>' + tk(x.expected) + '</td><td>' + tk(x.counted) + '</td><td class="' + (Math.abs(x.diff) < 0.01 ? 'ok' : 'bad') + '">' + tk(x.diff) + '</td><td>' + tk(x.deposit || 0) + '</td><td>' + esc(x.by) + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="muted">এখনো কোনো ক্লোজিং নেই</td></tr>';
    var last = L.slice(0, 30), short = last.reduce(function (a, x) { return a + (x.diff < 0 ? x.diff : 0); }, 0), over = last.reduce(function (a, x) { return a + (x.diff > 0 ? x.diff : 0); }, 0);
    $('hsum').textContent = last.length ? '— শেষ ' + last.length + ' দিন: কম ' + tk(short) + ', বেশি ' + tk(over) : '';
  }
  $('h').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-d]'); if (tr) { $('d').value = tr.getAttribute('data-d'); calc(); scrollTo({ top: 0, behavior: 'smooth' }); } });
  $('csv').onclick = function () {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }, rows = [['Date', 'Net sales', 'Opening', 'Cash sales', 'Due collected', 'Cash expenses', 'Other out', 'Expected', 'Counted', 'Difference', 'Deposit', 'By', 'Note']];
    closings().forEach(function (x) { rows.push([x.date, x.net, x.open, x.cashSales, x.dueCash, x.expCash, (x.out || []).reduce(function (a, o) { return a + o.amt; }, 0), x.expected, x.counted, x.diff, x.deposit || 0, x.by, x.note]); });
    var a = document.createElement('a'); a.download = 'closings-' + today() + '.csv'; a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' })); document.body.append(a); a.click(); a.remove();
  };
  calc(); hist();
})();

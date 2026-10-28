/* v87 — Reports & Analytics: নতুন ট্যাব "🆚 তুলনা ও বিশ্লেষণ"
   • আগের সমান সময়ের সাথে তুলনা (বিক্রি, বিল, গড় বিল, আনুমানিক লাভ, ছাড়) ▲▼%
   • পণ্য-ভিত্তিক পারফরম্যান্স: বিক্রি, ইউনিট, মার্জিন %, আগের সময়ের তুলনায় বদল (সর্ট করা যায়)
   • 💤 ডেড স্টক: স্টক আছে কিন্তু ৩০/৬০/৯০ দিনে বিক্রি হয়নি — আটকে থাকা টাকা (কেনা-দামে)
   • সপ্তাহের কোন বারে কত বিক্রি; Void হওয়া বিক্রি; CSV এক্সপোর্ট
   ডেটা: POS + অনলাইন অর্ডার (mcBizCollect), void বাদ। */
(function () {
  'use strict';
  var nav = document.querySelector('ul.nav-tabs'), anchor = document.getElementById('salesReport'); if (!nav || !anchor || typeof window.mcBizCollect !== 'function') return;
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var tk = function (n) { return '৳' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var dayOf = function (t) { return new Date(t + 6 * 3600e3).toISOString().slice(0, 10); };
  var addDays = function (d, n) { var t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  var diff = function (a, b) { return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); };

  var link = el('a', { class: 'nav-link', href: '#cmpReport', text: '🆚 তুলনা ও বিশ্লেষণ' }), li = el('li', { class: 'nav-item' }, [link]); nav.append(li);
  var pane = el('div', { class: 'tab-pane fade', id: 'cmpReport' }); anchor.parentNode.append(pane);
  link.addEventListener('click', function (e) {
    e.preventDefault(); nav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); }); link.classList.add('active');
    anchor.parentNode.querySelectorAll(':scope > .tab-pane').forEach(function (p) { p.classList.remove('show', 'active'); }); pane.classList.add('show', 'active'); draw();
  });
  var range = '30', sort = 'rev', dead = 60;
  function bounds() {
    var t = dayOf(Date.now()), f, e = t, pf, pe;
    if (range === 'month') { f = t.slice(0, 8) + '01'; var pm = new Date(f + 'T00:00:00Z'); pm.setUTCMonth(pm.getUTCMonth() - 1); pf = pm.toISOString().slice(0, 10); var n = diff(t, f); pe = addDays(pf, n); }
    else { var n2 = +range; f = addDays(t, -(n2 - 1)); pe = addDays(f, -1); pf = addDays(pe, -(n2 - 1)); }
    return { f: f, e: e, pf: pf, pe: pe };
  }
  function inR(r, a, b) { return r.day >= a && r.day <= b; }
  function agg(rows) {
    var o = { rev: 0, n: rows.length, disc: 0, profit: 0, known: 0, pos: 0, online: 0, prod: {} };
    rows.forEach(function (r) {
      o.rev += r.total; o.disc += r.disc || 0; if (r.src === 'POS') o.pos += r.total; else o.online += r.total;
      (r.lines || []).forEach(function (l) { var k = norm(l.name), p = o.prod[k] || (o.prod[k] = { name: l.name, qty: 0, rev: 0, cost: 0, cn: 0, rn: 0 }); p.qty += l.qty || 0; p.rev += l.rev || 0; p.rn += l.rev || 0; if (l.cost != null) { p.cost += l.cost; p.cn += l.rev || 0; o.profit += (l.rev || 0) - l.cost; o.known += l.rev || 0; } });
    });
    o.avg = o.n ? o.rev / o.n : 0; return o;
  }
  function delta(a, b, inv) {
    if (!(b > 0)) return a > 0 ? '<span class="text-muted small">নতুন</span>' : '<span class="text-muted small">—</span>';
    var p = Math.round((a - b) / b * 100), up = p >= 0, good = inv ? !up : up, c = p === 0 ? 'text-muted' : good ? 'text-success' : 'text-danger';
    return '<span class="small fw-semibold ' + c + '">' + (p === 0 ? '＝ 0%' : (up ? '▲ ' : '▼ ') + Math.abs(p) + '%') + '</span>';
  }
  function csv(name, rows) { var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }, a = el('a', { download: name, href: URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' })) }); document.body.append(a); a.click(); a.remove(); }
  function say(m) { try { showToast(m, 'success'); } catch (e) { } }

  function draw() {
    var B = bounds(), all = mcBizCollect().rows, cur = agg(all.filter(function (r) { return inR(r, B.f, B.e); })), prv = agg(all.filter(function (r) { return inR(r, B.pf, B.pe); }));
    var voids = rj('pharmacy_sales', []).filter(function (s) { return s && s.real && s.status === 'Voided' && (s.date || (s.at && dayOf(new Date(s.at).getTime()))) >= B.f; });
    pane.textContent = '';
    var sel = el('select', { class: 'form-select form-select-sm', style: 'max-width:230px', 'aria-label': 'সময়' }, [['7', 'গত ৭ দিন (বনাম আগের ৭ দিন)'], ['30', 'গত ৩০ দিন (বনাম আগের ৩০ দিন)'], ['90', 'গত ৯০ দিন (বনাম আগের ৯০ দিন)'], ['month', 'এই মাস (বনাম গত মাসের একই সময়)']].map(function (o) { var op = el('option', { value: o[0], text: o[1] }); if (o[0] === range) op.selected = true; return op; }));
    sel.addEventListener('change', function () { range = sel.value; draw(); });
    pane.append(el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-3' }, [el('h5', { class: 'fw-bold mb-0 me-auto', text: '🆚 তুলনা ও বিশ্লেষণ' }), sel, el('span', { class: 'small text-muted', text: B.f + ' → ' + B.e + ' · আগের: ' + B.pf + ' → ' + B.pe })]));
    var kp = function (label, a, b, fmt, inv) { var c = el('div', { class: 'col-6 col-md-3 mb-3' }, [el('div', { class: 'card h-100', style: 'padding:.8rem;border-radius:12px' })]); c.firstChild.innerHTML = '<div class="text-muted small">' + label + '</div><div class="fw-bold fs-5">' + fmt(a) + '</div><div class="small text-muted">আগে ' + fmt(b) + ' ' + delta(a, b, inv) + '</div>'; return c; };
    var row = el('div', { class: 'row' });
    row.append(kp('মোট বিক্রি', cur.rev, prv.rev, tk), kp('বিল / অর্ডার', cur.n, prv.n, function (x) { return x; }), kp('গড় বিল', cur.avg, prv.avg, tk), kp('আনুমানিক লাভ' + (cur.known < cur.rev * 0.6 && cur.rev ? ' *' : ''), cur.profit, prv.profit, tk), kp('POS', cur.pos, prv.pos, tk), kp('অনলাইন', cur.online, prv.online, tk), kp('ছাড় দেওয়া', cur.disc, prv.disc, tk, true), (function () { var c = el('div', { class: 'col-6 col-md-3 mb-3' }, [el('div', { class: 'card h-100', style: 'padding:.8rem;border-radius:12px' })]); c.firstChild.innerHTML = '<div class="text-muted small">Void হওয়া বিক্রি</div><div class="fw-bold fs-5">' + tk(voids.reduce(function (a, s) { return a + (+s.total || 0); }, 0)) + '</div><div class="small text-muted">' + voids.length + 'টি বিল (এই সময়ে)</div>'; return c; })());
    pane.append(row);
    if (cur.known < cur.rev * 0.6 && cur.rev) pane.append(el('p', { class: 'small text-muted', text: '* কিছু পণ্যের কেনা-দাম জানা নেই (ওষুধে purchasePrice দিন), তাই লাভ কম দেখাতে পারে।' }));

    /* পণ্য */
    var keys = Object.keys(cur.prod), rows = keys.map(function (k) { var p = cur.prod[k], q = prv.prod[k]; return { name: p.name, qty: p.qty, rev: p.rev, mg: p.cn > 0 ? (p.cn - p.cost) / p.cn * 100 : null, pr: q ? q.rev : 0 }; });
    rows.sort(function (a, b) { return sort === 'mg' ? (b.mg == null ? -1e9 : b.mg) - (a.mg == null ? -1e9 : a.mg) : sort === 'qty' ? b.qty - a.qty : sort === 'chg' ? ((b.rev - b.pr) - (a.rev - a.pr)) : b.rev - a.rev; });
    var sorter = el('div', { class: 'btn-group btn-group-sm' }, [['rev', 'বিক্রি'], ['qty', 'ইউনিট'], ['mg', 'মার্জিন'], ['chg', 'বদল']].map(function (s) { return el('button', { type: 'button', class: 'btn ' + (sort === s[0] ? 'btn-primary' : 'btn-outline-secondary'), text: s[1], onclick: function () { sort = s[0]; draw(); } }); }));
    var t = el('table', { class: 'table table-sm align-middle mb-0' }), tb = el('tbody'); t.append(el('thead', {}, [el('tr', {}, ['পণ্য', 'ইউনিট', 'বিক্রি', 'মার্জিন', 'আগের তুলনায়'].map(function (x) { return el('th', { text: x }); }))]), tb);
    rows.slice(0, 20).forEach(function (r) { var tr = el('tr', {}, [el('td', { text: r.name }), el('td', { text: r.qty }), el('td', { text: tk(r.rev) }), el('td', { text: r.mg == null ? '—' : Math.round(r.mg) + '%', class: r.mg != null && r.mg < 10 ? 'text-danger' : '' }), el('td')]); tr.lastChild.innerHTML = delta(r.rev, r.pr); tb.append(tr); });
    if (!rows.length) tb.append(el('tr', {}, [el('td', { colspan: 5, class: 'text-muted', text: 'এই সময়ে কোনো বিক্রি নেই' })]));
    pane.append(el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px' }, [el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '💊 পণ্য-ভিত্তিক পারফরম্যান্স (শীর্ষ ২০)' }), sorter, el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ CSV', onclick: function () { csv('product-performance.csv', [['Product', 'Units', 'Sales', 'Margin %', 'Prev sales']].concat(rows.map(function (r) { return [r.name, r.qty, Math.round(r.rev), r.mg == null ? '' : Math.round(r.mg), Math.round(r.pr)]; }))); say('CSV নামানো হয়েছে'); } })]), el('div', { class: 'table-responsive' }, [t]), rows.filter(function (r) { return r.mg != null && r.mg < 10; }).length ? el('div', { class: 'small text-danger mt-2', text: '⚠ ' + rows.filter(function (r) { return r.mg != null && r.mg < 10; }).length + 'টি পণ্যে মার্জিন ১০%-এর নিচে — দাম/কেনা-দাম দেখুন।' }) : null]));

    /* সপ্তাহের বার */
    var wd = [0, 0, 0, 0, 0, 0, 0], wn = [0, 0, 0, 0, 0, 0, 0], names = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    all.filter(function (r) { return inR(r, B.f, B.e); }).forEach(function (r) { var d = new Date(r.day + 'T00:00:00Z').getUTCDay(); wd[d] += r.total; wn[d]++; });
    var mx = Math.max.apply(null, wd.concat([1])), best = wd.indexOf(Math.max.apply(null, wd));
    var bars = el('div', { class: 'd-flex align-items-end gap-2', style: 'height:120px' }, wd.map(function (v, i) { return el('div', { class: 'text-center flex-fill', title: names[i] + ': ' + tk(v) + ' (' + wn[i] + 'টি)' }, [el('div', { class: 'small', text: v ? tk(v) : '' }), el('div', { style: 'height:' + Math.max(3, Math.round(v / mx * 80)) + 'px;border-radius:6px 6px 0 0;background:' + (i === best && v ? '#0b7a6b' : 'rgba(102,126,234,.55)') }), el('div', { class: 'small text-muted', text: names[i] })]); }));
    pane.append(el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px' }, [el('h6', { class: 'fw-bold mb-2', text: '📅 সপ্তাহের কোন বারে বেশি বিক্রি' }), bars, el('div', { class: 'small text-muted mt-2', text: cur.rev ? 'সবচেয়ে ভালো দিন: ' + names[best] + ' (' + tk(wd[best]) + ')' : 'ডেটা নেই' })]));

    /* ডেড স্টক */
    var meds = rj('pharmacy_medicines', []), last = {}; all.forEach(function (r) { (r.lines || []).forEach(function (l) { var k = norm(l.name); if (!last[k] || r.day > last[k]) last[k] = r.day; }); });
    var t0 = dayOf(Date.now()), dl = meds.filter(function (m) { return (+m.stock || 0) > 0; }).map(function (m) { var l = last[norm(m.name)], days = l ? diff(t0, l) : null; return { m: m, days: days, val: (+m.stock || 0) * (+m.purchasePrice || 0) }; }).filter(function (x) { return x.days == null || x.days >= dead; }).sort(function (a, b) { return b.val - a.val; });
    var dsel = el('select', { class: 'form-select form-select-sm', style: 'max-width:200px', 'aria-label': 'ডেড-স্টক দিন' }, [30, 60, 90].map(function (n) { var op = el('option', { value: n, text: n + '+ দিন বিক্রি হয়নি' }); if (n === dead) op.selected = true; return op; }));
    dsel.addEventListener('change', function () { dead = +dsel.value; draw(); });
    var dt = el('table', { class: 'table table-sm align-middle mb-0' }), db = el('tbody'); dt.append(el('thead', {}, [el('tr', {}, ['ওষুধ', 'স্টক', 'কেনা-দামে মূল্য', 'শেষ বিক্রি', 'মেয়াদ'].map(function (x) { return el('th', { text: x }); }))]), db);
    dl.slice(0, 25).forEach(function (x) { var exp = x.m.expiryDate || ''; var soon = exp && diff(exp, t0) <= 90; db.append(el('tr', {}, [el('td', { text: x.m.name }), el('td', { text: x.m.stock }), el('td', { text: x.val ? tk(x.val) : '—' }), el('td', { text: x.days == null ? 'কখনো না' : x.days + ' দিন আগে' }), el('td', { text: exp || '—', class: soon ? 'text-danger fw-semibold' : '' })])); });
    if (!dl.length) db.append(el('tr', {}, [el('td', { colspan: 5, class: 'text-success', text: '✅ ' + dead + '+ দিন বিক্রি-হীন কোনো স্টক নেই' })]));
    var tot = dl.reduce(function (a, x) { return a + x.val; }, 0);
    pane.append(el('div', { class: 'card mb-3', style: 'padding:.9rem;border-radius:12px' }, [el('div', { class: 'd-flex flex-wrap gap-2 align-items-center mb-2' }, [el('h6', { class: 'fw-bold mb-0 me-auto', text: '💤 ডেড স্টক — আটকে থাকা টাকা ' + tk(tot) + ' (' + dl.length + 'টি ওষুধ)' }), dsel, el('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', text: '⬇ CSV', onclick: function () { csv('dead-stock.csv', [['Medicine', 'Stock', 'Cost value', 'Days since last sale', 'Expiry']].concat(dl.map(function (x) { return [x.m.name, x.m.stock, Math.round(x.val), x.days == null ? 'never' : x.days, x.m.expiryDate || '']; }))); say('CSV নামানো হয়েছে'); } })]), el('div', { class: 'table-responsive' }, [dt]), el('div', { class: 'small text-muted mt-2', text: 'টিপ: আটকে থাকা ওষুধে ছাড় দিন বা সাপ্লায়ারকে ফেরত দিন; মেয়াদ কাছাকাছি হলে আগে বিক্রির চেষ্টা করুন। বিক্রি-ইতিহাস শুধু এই সফটওয়্যারে করা বিক্রি থেকে।' })]));
  }
})();

/* Backup & Restore v49: pick what to back up, safe restore with preview + checksum, undo for restore/reset,
   storage meter and backup-age badge. Runs after the page's own script and takes over its three buttons. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var box = $('box'); if (!box || box.hidden) return;
  var exportOnly = $('rst').hidden;
  var SEC = { pharmacy_creds: 1, pharmacy_accounts: 1, pharmacy_roles: 1, mc_acc: 1, pharmacy_loginlog: 1, mc_lock: 1 };
  var SKIP = { pharmacy_lastbackup: 1, mc_lastbackup: 1, mc_restorepoint: 1 };
  var LBL = { mc_db: 'শপ ও Ops Panel (পণ্য, ব্যাচ, অর্ডার, ইউজার)', pharmacy_medicines: 'ওষুধ (ড্যাশবোর্ড)', pharmacy_customers: 'কাস্টমার', pharmacy_customer_ledger: 'কাস্টমার বাকি-খাতা', pharmacy_suppliers: 'সরবরাহকারী', pharmacy_purchases: 'ক্রয়', pharmacy_purchase_returns: 'ক্রয় ফেরত', pharmacy_sales: 'POS বিক্রি', pharmacy_prescriptions: 'প্রেসক্রিপশন', pharmacy_settings: 'স্টোর সেটিংস', pharmacy_profile: 'প্রোফাইল', pharmacy_audit: 'অ্যাডমিন অডিট লগ', pharmacy_creds: '🔒 পরিবর্তিত পাসওয়ার্ড (হ্যাশ)', pharmacy_accounts: '🔒 অ্যাকাউন্ট', pharmacy_roles: '🔒 রোল ও অনুমতি', pharmacy_loginlog: '🔒 লগইন লগ', mc_acc: '🔒 Ops অ্যাকাউন্ট', mc_lock: '🔒 লগইন লক', mc_prof: 'শপ: ক্রেতার তথ্য', mc_cart: 'শপ: কার্ট', mc_wish: 'শপ: উইশলিস্ট', mc_reviews: 'শপ: রিভিউ', pharmacy_held: 'POS: হোল্ড বিল', pharmacy_pos_draft: 'POS: খসড়া' };
  var KEEP = /^(pharmacy_|mc_)/;
  function el(t, a, kids) { var e = document.createElement(t); a = a || {}; for (var k in a) { if (k === 'text') e.textContent = a[k]; else if (k.slice(0, 2) === 'on') e[k] = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c) e.append(c); }); return e; }
  function say(m, bad) { var s = $('msg'); s.textContent = m; s.style.color = bad ? 'var(--bad)' : ''; }
  function keys() { var k = []; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (KEEP.test(n) && !SKIP[n]) k.push(n); } return k.sort(); }
  function cnt(s) { try { var v = JSON.parse(s); return Array.isArray(v) ? v.length + ' টি' : (v && typeof v === 'object' ? Object.keys(v).length + ' ফিল্ড' : '1'); } catch (e) { return '—'; } }
  function kb(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB'; }
  function hash(o) { var h = 2166136261, s = Object.keys(o).sort().map(function (k) { return k + '\u0000' + o[k]; }).join('\u0001'); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); }
  function stamp(iso) { localStorage.setItem('pharmacy_lastbackup', iso); localStorage.setItem('mc_lastbackup', iso); badge(); }
  function ymd() { return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Dhaka' }).replace(/[: ]/g, '-').slice(0, 16); }
  function dl(name, text) { var a = el('a', { download: name, href: URL.createObjectURL(new Blob([text], { type: 'application/json' })) }); document.body.append(a); a.click(); a.remove(); }

  // hide the page's original table/buttons, keep #last and #msg
  var oldRow = $('exp').parentNode; oldRow.hidden = true; var oldCard = $('t').closest('.card'); if (oldCard) oldCard.hidden = true;

  // ---- backup age badge + storage meter
  var lastCard = $('last').parentNode, meter = el('div', { 'aria-label': 'Storage used' });
  lastCard.append(meter);
  function badge() {
    var l = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), e = $('last'); e.textContent = '';
    if (!l) { e.append(el('b', { text: '⛔ এখনো কোনো ব্যাকআপ নেওয়া হয়নি।', style: 'color:var(--bad)' })); return; }
    var d = Math.floor((Date.now() - new Date(l)) / 864e5), c = d <= 2 ? '#15803d' : d <= 7 ? '#b45309' : 'var(--bad)';
    e.append(el('b', { text: (d <= 2 ? '✅ ' : d <= 7 ? '🟡 ' : '⛔ ') + (d === 0 ? 'আজ' : d + ' দিন আগে'), style: 'color:' + c }), document.createTextNode(' — ' + new Date(l).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) + (d > 7 ? ' · নতুন ব্যাকআপ নিন' : '')));
  }
  function storage() {
    var tot = 0, all = 0; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i), v = localStorage.getItem(n) || ''; all += n.length + v.length; if (KEEP.test(n)) tot += n.length + v.length; }
    var cap = 5 * 1048576, pct = Math.min(100, Math.round(all * 2 / cap * 100)); // UTF-16: ~2 bytes per char
    meter.textContent = ''; meter.append(el('div', { text: 'ব্রাউজার স্টোরেজ: ~' + kb(all * 2) + ' / ~5 MB (' + pct + '%)', class: 'muted' }),
      el('div', { style: 'height:8px;border-radius:6px;background:rgba(0,0,0,.12);overflow:hidden;margin-top:4px' }, [el('div', { style: 'height:100%;width:' + pct + '%;background:' + (pct > 80 ? 'var(--bad)' : pct > 50 ? '#b45309' : '#15803d') })]));
  }

  // ---- export panel
  var tb = el('table'), selAll, secBox, selected = {};
  function drawTable() {
    tb.textContent = ''; var ks = keys(); tb.append(el('tr', {}, [el('th', {}, [selAll = el('input', { type: 'checkbox', 'aria-label': 'Select all', onchange: function () { tb.querySelectorAll('input[data-k]').forEach(function (c) { c.checked = selAll.checked; }); } })]), el('th', { text: 'ডেটা' }), el('th', { text: 'পরিমাণ' }), el('th', { text: 'সাইজ' })]));
    ks.forEach(function (k) { var v = localStorage.getItem(k) || '', r = el('tr'); var c = el('input', { type: 'checkbox', 'data-k': k, 'aria-label': k }); c.checked = !SEC[k]; r.append(el('td', {}, [c]), el('td', { text: LBL[k] || k }), el('td', { text: cnt(v) }), el('td', { text: kb(v.length * 2) })); tb.append(r); });
    selAll.checked = false; storage();
  }
  function chosen() { return [].slice.call(tb.querySelectorAll('input[data-k]:checked')).map(function (c) { return c.getAttribute('data-k'); }); }
  function build(ks) { var d = {}; ks.forEach(function (k) { d[k] = localStorage.getItem(k); }); return { app: 'medicare', v: 8, at: new Date().toISOString(), sum: hash(d), keys: ks.length, data: d }; }
  var exBtn = el('button', { class: 'btn', text: '⬇️ বাছাই করা ডেটার ব্যাকআপ (JSON)', onclick: function () {
    var ks = chosen(); if (!ks.length) return say('অন্তত একটি ডেটা বাছাই করুন।', 1);
    var hasSec = ks.some(function (k) { return SEC[k]; }); if (hasSec && !confirm('⚠️ বাছাইয়ে পাসওয়ার্ড/রোল/অ্যাকাউন্ট তথ্য আছে। ফাইলটি নিরাপদ জায়গায় রাখবেন। চালিয়ে যাবেন?')) return;
    var o = build(ks); dl('medicare-backup-' + ymd() + '.json', JSON.stringify(o)); stamp(o.at);
    say('✅ ' + ks.length + ' টি ডেটা ব্যাকআপ হয়েছে (চেকসাম ' + o.sum + ')।');
  } });
  var quick = el('button', { class: 'btn2', text: '⚡ দ্রুত ব্যাকআপ (পাসওয়ার্ড ছাড়া সব)', onclick: function () {
    tb.querySelectorAll('input[data-k]').forEach(function (c) { c.checked = !SEC[c.getAttribute('data-k')]; }); exBtn.click(); } });
  var exCard = el('div', { class: 'card' }, [el('h3', { text: '⬇️ ব্যাকআপ — কী কী নেবেন?' }), el('div', { class: 'scroll' }, [tb]), el('p', { class: 'muted', text: '🔒 চিহ্নিত ডেটায় পাসওয়ার্ড/রোল থাকে, তাই ডিফল্টে বাদ।' }), el('div', { class: 'row' }, [exBtn, quick])]);

  // ---- restore panel
  var prev = el('div'), fileInput = el('input', { type: 'file', accept: '.json,application/json', hidden: 'hidden' });
  var pick = el('label', { class: 'btn2' }, [document.createTextNode('📂 ব্যাকআপ ফাইল বাছুন (আগে প্রিভিউ)'), fileInput]);
  var rsCard = el('div', { class: 'card' }, [el('h3', { text: '⬆️ রিস্টোর' }), el('p', { class: 'muted', text: 'ফাইল বাছাই করলে আগে দেখাবে ভেতরে কী আছে ও বর্তমান ডেটার সাথে তুলনা। কিছুই নিজে থেকে বদলাবে না।' }), el('div', { class: 'row' }, [pick]), prev]);
  var undoBtn = el('button', { class: 'btn2', text: '', onclick: undo }), undoRow = el('div', { class: 'row' }, [undoBtn]);
  function snapshot(why) {
    var d = {}; keys().forEach(function (k) { d[k] = localStorage.getItem(k); });
    try { localStorage.setItem('mc_restorepoint', JSON.stringify({ at: new Date().toISOString(), why: why, data: d })); return true; } catch (e) { return false; }
  }
  function undoLabel() { var r; try { r = JSON.parse(localStorage.getItem('mc_restorepoint')); } catch (e) { } undoRow.hidden = !r || exportOnly; if (r) undoBtn.textContent = '↩️ শেষ ' + r.why + ' বাতিল (' + new Date(r.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }).slice(0, 17) + ' এর অবস্থায় ফেরা)'; }
  function undo() {
    var r; try { r = JSON.parse(localStorage.getItem('mc_restorepoint')); } catch (e) { } if (!r || !r.data) return say('ফেরার মতো কিছু নেই।', 1);
    if (!confirm('বর্তমান ডেটা বদলে ' + new Date(r.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) + ' এর অবস্থায় ফিরবেন?')) return;
    keys().forEach(function (k) { localStorage.removeItem(k); }); Object.keys(r.data).forEach(function (k) { if (KEEP.test(k) && typeof r.data[k] === 'string') localStorage.setItem(k, r.data[k]); });
    localStorage.removeItem('mc_restorepoint'); drawTable(); undoLabel(); say('↩️ আগের অবস্থায় ফেরা হয়েছে।');
  }
  fileInput.onchange = function (e) {
    var f = e.target.files[0]; fileInput.value = ''; prev.textContent = ''; if (!f) return;
    if (f.size > 2e7) return say('ফাইল খুব বড় (২০ MB এর বেশি)।', 1);
    var r = new FileReader(); r.onerror = function () { say('ফাইল পড়া যায়নি।', 1); };
    r.onload = function () {
      var o; try { o = JSON.parse(r.result); } catch (x) { return say('এটি সঠিক JSON ফাইল নয়।', 1); }
      if (!o || o.app !== 'medicare' || !o.data || typeof o.data !== 'object') return say('এটি MediCare ব্যাকআপ ফাইল নয়।', 1);
      var fk = Object.keys(o.data).filter(function (k) { return KEEP.test(k) && !SKIP[k] && typeof o.data[k] === 'string' && o.data[k].length < 8e6; });
      if (!fk.length) return say('ফাইলে রিস্টোর করার মতো ডেটা নেই।', 1);
      var sub = {}; fk.forEach(function (k) { sub[k] = o.data[k]; });
      var okSum = o.sum ? (o.sum === hash(sub) || o.keys !== fk.length ? (o.sum === hash(sub)) : false) : null;
      var st = okSum === null ? el('p', { class: 'muted', text: 'ℹ️ পুরোনো ফরম্যাট — চেকসাম নেই, যাচাই করা যায়নি।' }) : okSum ? el('p', { text: '✅ চেকসাম মিলেছে — ফাইল অক্ষত।', style: 'color:#15803d' }) : el('p', { text: '⚠️ চেকসাম মেলেনি — ফাইলটি বদলে গেছে বা নষ্ট হতে পারে।', style: 'color:var(--bad);font-weight:600' });
      var t = el('table'), cur = {}; t.append(el('tr', {}, [el('th'), el('th', { text: 'ডেটা' }), el('th', { text: 'ফাইলে' }), el('th', { text: 'এখন' })]));
      fk.forEach(function (k) { var bad = false; var v = o.data[k]; if (/^\s*[\[{]/.test(v)) { try { JSON.parse(v); } catch (x) { bad = true; } } var c = el('input', { type: 'checkbox', 'data-r': k, 'aria-label': k }); c.checked = !SEC[k] && !bad; if (bad) c.disabled = true;
        t.append(el('tr', {}, [el('td', {}, [c]), el('td', { text: (LBL[k] || k) + (bad ? ' (নষ্ট)' : '') }), el('td', { text: cnt(v) }), el('td', { text: localStorage.getItem(k) == null ? '— (নেই)' : cnt(localStorage.getItem(k)) })])); });
      var go = el('button', { class: 'btn', text: '✅ বাছাই করা ডেটা রিস্টোর করুন', onclick: function () {
        var ks = [].slice.call(t.querySelectorAll('input[data-r]:checked')).map(function (c) { return c.getAttribute('data-r'); }); if (!ks.length) return say('কিছু বাছাই করা হয়নি।', 1);
        if (okSum === false && !confirm('চেকসাম মেলেনি। তবুও রিস্টোর করবেন?')) return;
        if (ks.some(function (k) { return SEC[k]; }) && !confirm('⚠️ পাসওয়ার্ড/রোল/অ্যাকাউন্ট তথ্য রিস্টোর হবে। শুধু নিজের তৈরি ফাইল হলে OK দিন।')) return;
        if (!confirm(ks.length + ' টি ডেটা রিস্টোর হবে এবং সেগুলোর বর্তমান ডেটা বদলে যাবে। (পরে "বাতিল" বাটনে ফেরা যাবে) চালিয়ে যাবেন?')) return;
        var saved = snapshot('রিস্টোর'); if (!saved && !confirm('ফেরার কপি রাখার জায়গা নেই (স্টোরেজ ভরা)। তবুও এগোবেন?')) return;
        try { ks.forEach(function (k) { localStorage.setItem(k, o.data[k]); }); } catch (x) { return say('স্টোরেজ ভরে গেছে — রিস্টোর অসম্পূর্ণ হতে পারে।', 1); }
        prev.textContent = ''; drawTable(); undoLabel(); say('✅ ' + ks.length + ' টি ডেটা রিস্টোর হয়েছে। পেজগুলো রিলোড করলে নতুন ডেটা দেখাবে।');
      } });
      prev.append(el('p', { text: '📄 ' + f.name + ' · ' + (o.at ? new Date(o.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) : 'তারিখ অজানা') + ' · ' + fk.length + ' টি ডেটা' }), st, el('div', { class: 'scroll' }, [t]), el('div', { class: 'row' }, [go]));
    };
    r.readAsText(f);
  };

  // ---- reset (with undo)
  var rstBtn = el('button', { class: 'btn2', style: 'color:var(--bad)', text: '🗑️ সব ডেটা মুছুন (বাতিলযোগ্য)', onclick: function () {
    if (prompt('সব ব্যবসায়িক ডেটা মুছতে RESET লিখুন') !== 'RESET') return;
    if (!snapshot('ডেটা মোছা')) { if (!confirm('ফেরার কপি রাখা গেল না — মুছলে আর ফেরা যাবে না। চালিয়ে যাবেন?')) return; }
    keys().forEach(function (k) { localStorage.removeItem(k); }); drawTable(); undoLabel(); say('ডেটা মোছা হয়েছে। "বাতিল" বাটনে ফিরে পাবেন। (পরের লোডে ডেমো ডেটা ফিরে আসতে পারে)');
  } });

  var top = $('last').closest('.card');
  if (exportOnly) { rsCard.hidden = true; rstBtn.hidden = true; }
  top.after(exCard, rsCard, undoRow, el('div', { class: 'row' }, [rstBtn]));
  drawTable(); badge(); undoLabel();
})();

/* v94 — Dashboard Settings (৭টি ট্যাব):
   • Profile: ভূমিকা-ব্যাজ + আগের লগইন, পদবি ও রেজিস্ট্রেশন নং (pharmacy_profile)
   • Store & Invoice: ড্রাগ-লাইসেন্স নং ও BIN → ইনভয়েস/Rx-স্লিপে ছাপা হয় + লাইভ প্রিভিউ
   • My Preferences: বড় টাচ-এলাকা, হাই-কনট্রাস্ট, কীবোর্ড শর্টকাট তালিকা
   • Security: 🔒 স্ক্রিন-লক PIN (Ctrl+L), পাসওয়ার্ড দেখান, ব্যর্থ-লগইন সতর্কতা
   • Alerts & Session: অলস থাকলে স্ক্রিন-লক
   • Backup: লাইভ ব্যাকআপ-তথ্য (বয়স/সাইজ/লগ)
   • Data & Tools: ডেটা-ইন্টেগ্রিটি চেক + লগ ছাঁটাই */
(function () {
  'use strict';
  function run() {
    var $ = function (i) { return document.getElementById(i); };
    function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
    function wj(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
    var u = who(); if (!u || !$('settingsModal')) return;
    var em = String(u.email || '').toLowerCase(), admin = u.role === 'admin';
    function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'success'); }
    var dt = function (x) { return new Date(x).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }); };

    /* ---------- Profile ---------- */
    var pn = $('profilePhone');
    if (pn) {
      var P = (rj('pharmacy_profile', {}))[u.role] || {};
      var logins = rj('pharmacy_loginlog', []).filter(function (x) { return x && x.ok && String(x.email || '').toLowerCase() === em; }), prevL = logins.length > 1 ? logins[logins.length - 2] : null;
      var hd = document.createElement('div'); hd.className = 'alert alert-light border small py-2';
      hd.innerHTML = '<span class="badge bg-primary me-2">' + esc(u.role === 'admin' ? 'Admin' : u.role === 'pharmacist' ? 'Pharmacist' : 'Staff') + '</span>' + (prevL ? 'আগের লগইন: ' + esc(dt(prevL.at)) : 'এই ডিভাইসে এটাই প্রথম রেকর্ডকৃত লগইন');
      var host = pn.closest('.mb-3') || pn.parentNode; host.parentNode.insertBefore(hd, host.parentNode.firstChild);
      var ex = document.createElement('div'); ex.innerHTML = '<div class="mb-3"><label class="form-label">পদবি / ডিগ্রি</label><input class="form-control" id="v94Desig" maxlength="60" placeholder="যেমন: B.Pharm, Pharmacist-in-charge"></div><div class="mb-3"><label class="form-label">ফার্মাসিস্ট রেজিস্ট্রেশন নং <small class="text-muted">(ঐচ্ছিক)</small></label><input class="form-control" id="v94Reg" maxlength="40" placeholder="PCB / BPC নং"></div>';
      host.after(ex); $('v94Desig').value = P.desig || ''; $('v94Reg').value = P.reg || '';
      var up0 = window.updateProfile;
      if (typeof up0 === 'function') window.updateProfile = function () {
        var reg = $('v94Reg').value.trim(), ds = $('v94Desig').value.trim();
        if (reg && !/^[A-Za-z0-9\-\/\. ]{3,40}$/.test(reg)) { $('v94Reg').classList.add('is-invalid'); return toast('রেজিস্ট্রেশন নং-এ শুধু অক্ষর/সংখ্যা/-/ ব্যবহার করুন (৩–৪০)', 'danger'); }
        $('v94Reg').classList.remove('is-invalid');
        var r = up0.apply(this, arguments);
        if (!$('profilePhone').classList.contains('is-invalid')) { var all = rj('pharmacy_profile', {}); all[u.role] = Object.assign(all[u.role] || {}, { desig: ds, reg: reg }); wj('pharmacy_profile', all); }
        return r;
      };
    }

    /* ---------- Store & Invoice ---------- */
    var ti = setInterval(function () { tries++; if ($('stOpen') || tries > 25) { clearInterval(ti); if ($('stOpen')) addStore(); } }, 150), tries = 0;
    function addStore() {
      if (!admin || $('v94Lic')) return; var S = rj('pharmacy_settings', {}), row = $('stLow').closest('.row'); if (!row) return;
      var c = document.createElement('div'); c.className = 'col-12';
      c.innerHTML = '<hr class="my-1"><label class="form-label fw-semibold">🧾 ইনভয়েসে ছাপা হবে</label><div class="row g-2"><div class="col-md-6"><input class="form-control" id="v94Lic" maxlength="40" placeholder="ড্রাগ লাইসেন্স নং" aria-label="Drug licence"></div><div class="col-md-6"><input class="form-control" id="v94Bin" maxlength="13" inputmode="numeric" placeholder="BIN (৯–১৩ অঙ্ক)" aria-label="BIN"></div></div><pre id="v94Prev" class="small border rounded p-2 mt-2 mb-0" style="white-space:pre-wrap;background:transparent;color:inherit"></pre>';
      row.insertBefore(c, row.lastElementChild); $('v94Lic').value = S.licenseNo || ''; $('v94Bin').value = S.binNo || '';
      var pv = function () { $('v94Prev').textContent = ($('stName').value || 'MediCare Pharmacy') + '\n' + ($('stAddr').value || '') + '\n📞 ' + ($('stPhone').value || '') + ' | ✉️ ' + ($('stEmail').value || '') + (($('v94Lic').value || $('v94Bin').value) ? '\n' + ($('v94Lic').value ? 'Drug Licence: ' + $('v94Lic').value : '') + ($('v94Lic').value && $('v94Bin').value ? ' | ' : '') + ($('v94Bin').value ? 'BIN: ' + $('v94Bin').value : '') : ''); };
      ['stName', 'stAddr', 'stPhone', 'stEmail', 'v94Lic', 'v94Bin'].forEach(function (i) { $(i).addEventListener('input', pv); }); pv();
      var sv0 = window.saveStoreSettings;
      window.saveStoreSettings = function () {
        var l = $('v94Lic').value.trim(), b = $('v94Bin').value.trim();
        if (l && !/^[A-Za-z0-9\-\/\. ]{3,40}$/.test(l)) return toast('লাইসেন্স নং ঠিক নয়', 'danger');
        if (b && !/^\d{9,13}$/.test(b)) return toast('BIN ৯–১৩ অঙ্কের সংখ্যা হতে হবে', 'danger');
        var r = sv0.apply(this, arguments), S2 = rj('pharmacy_settings', {}); S2.licenseNo = l; S2.binNo = b; wj('pharmacy_settings', S2); return r;
      };
    }

    /* ---------- My Preferences ---------- */
    var mp = $('myprefs');
    if (mp && window.MCPrefs) {
      var pr = MCPrefs.get(), blk = document.createElement('div'); blk.className = 'mt-3 border-top pt-3';
      blk.innerHTML = '<h6>♿ অ্যাক্সেসিবিলিটি</h6><div class="form-check"><input class="form-check-input" type="checkbox" id="v94Big"><label class="form-check-label" for="v94Big">বড় টাচ-এলাকা (বাটন/ইনপুট ৪৪px+, ট্যাবলেটে সুবিধা)</label></div><div class="form-check"><input class="form-check-input" type="checkbox" id="v94Con"><label class="form-check-label" for="v94Con">হাই-কনট্রাস্ট (গাঢ় লেখা, লিংকে আন্ডারলাইন, স্পষ্ট ফোকাস)</label></div>' +
        '<details class="mt-3"><summary class="fw-semibold">⌨ কীবোর্ড শর্টকাট</summary><table class="table table-sm small mt-2 mb-0"><tbody><tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>দ্রুত খোঁজা/জাম্প (যেসব পেজে আছে)</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>L</kbd></td><td>স্ক্রিন লক (PIN সেট থাকলে)</td></tr><tr><td><kbd>/</kbd></td><td>Home পেজে ওষুধ খোঁজা</td></tr><tr><td><kbd>F2</kbd>, <kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>Ops POS: খোঁজা / বিক্রি সম্পন্ন</td></tr><tr><td><kbd>1</kbd>–<kbd>9</kbd>, <kbd>↑</kbd><kbd>↓</kbd></td><td>Ops লগইনে ইউজার বাছাই</td></tr></tbody></table></details>';
      mp.appendChild(blk); $('v94Big').checked = !!pr.big; $('v94Con').checked = !!pr.contrast;
      [['v94Big', 'big'], ['v94Con', 'contrast']].forEach(function (x) { $(x[0]).onchange = function () { var p = MCPrefs.get(); p[x[1]] = this.checked; MCPrefs.put(p); toast('✔ সেভ হয়েছে'); }; });
      var rs = $('pfReset'); if (rs) rs.addEventListener('click', function () { setTimeout(function () { var p = MCPrefs.get(); $('v94Big').checked = !!p.big; $('v94Con').checked = !!p.contrast; }, 50); });
    }

    /* ---------- Security ---------- */
    var sec = $('security');
    if (sec && window.MCLock) {
      var np = $('newPassword');
      if (np && !$('v94Show')) { var sw = document.createElement('div'); sw.className = 'form-check mb-3'; sw.innerHTML = '<input type="checkbox" class="form-check-input" id="v94Show"><label class="form-check-label" for="v94Show">পাসওয়ার্ড দেখান</label>'; $('confirmPassword').parentNode.after(sw); $('v94Show').onchange = function () { ['currentPassword', 'newPassword', 'confirmPassword'].forEach(function (i) { if ($(i)) $(i).type = $('v94Show').checked ? 'text' : 'password'; }); }; }
      var lk = document.createElement('div'); lk.className = 'mt-4 border-top pt-3'; lk.id = 'v94Lock'; sec.appendChild(lk);
      var drawL = function () {
        var has = MCLock.has();
        lk.innerHTML = '<h6>🔒 স্ক্রিন-লক PIN</h6><p class="small text-muted mb-2">কাউন্টার ছেড়ে গেলে <kbd>Ctrl</kbd>+<kbd>L</kbd> চাপুন — PIN ছাড়া স্ক্রিন খোলে না। ৫ বার ভুল হলে লগআউট। এটি এই ডিভাইসের ডেমো-মানের সুরক্ষা।</p>' +
          (has ? '<div class="mb-2"><span class="badge bg-success">PIN সেট আছে</span> <button class="btn btn-sm btn-outline-primary ms-2" id="v94Now" type="button">এখনই লক করুন</button> <button class="btn btn-sm btn-outline-danger" id="v94Del" type="button">PIN মুছুন</button></div>' : '') +
          '<div class="row g-2" style="max-width:420px"><div class="col-6"><input type="password" inputmode="numeric" maxlength="8" class="form-control" id="v94P1" placeholder="নতুন PIN (৪–৮ অঙ্ক)" aria-label="New PIN" autocomplete="off"></div><div class="col-6"><input type="password" inputmode="numeric" maxlength="8" class="form-control" id="v94P2" placeholder="আবার লিখুন" aria-label="Confirm PIN" autocomplete="off"></div><div class="col-12"><button class="btn btn-primary btn-sm" id="v94Set" type="button">' + (has ? 'PIN বদলান' : 'PIN সেট করুন') + '</button> <small id="v94LM" class="ms-2"></small></div></div>';
        lk.querySelector('#v94Set').onclick = function () {
          var a = $('v94P1').value.trim(), b = $('v94P2').value.trim(), m = $('v94LM');
          if (!/^\d{4,8}$/.test(a)) { m.textContent = 'PIN ৪–৮ অঙ্কের সংখ্যা হতে হবে'; m.className = 'ms-2 text-danger'; return; }
          if (/^(\d)\1+$/.test(a) || a === '1234' || a === '123456') { m.textContent = 'খুব সহজ PIN — অন্য একটি দিন'; m.className = 'ms-2 text-danger'; return; }
          if (a !== b) { m.textContent = 'দুটি PIN মেলেনি'; m.className = 'ms-2 text-danger'; return; }
          MCLock.set(a).then(function () { toast('🔒 PIN সেট হয়েছে'); drawL(); drawIdle(); });
        };
        if (has) { lk.querySelector('#v94Now').onclick = function () { MCLock.lock(); }; lk.querySelector('#v94Del').onclick = function () { Promise.resolve(window.MCD ? MCD.confirm('স্ক্রিন-লক PIN মুছে ফেলবেন?') : confirm('মুছবেন?')).then(function (ok) { if (!ok) return; MCLock.clear(); MCLock.setIdle(0); toast('PIN মুছে ফেলা হয়েছে'); drawL(); drawIdle(); }); }; }
      };
      drawL();
      var f = Array.prototype.filter.call(sec.querySelectorAll('h6'), function (x) { return /সাম্প্রতিক লগইন/.test(x.textContent); })[0];
      if (f) { var fl = rj('pharmacy_loginlog', []).filter(function (x) { return x && !x.ok && String(x.email || '').toLowerCase() === em && Date.now() - new Date(x.at) < 864e5; }).length; if (fl) { var w = document.createElement('div'); w.className = 'alert alert-warning py-1 small'; w.textContent = '⚠ গত ২৪ ঘণ্টায় ' + fl + 'টি ব্যর্থ লগইন চেষ্টা — আপনি না করে থাকলে পাসওয়ার্ড বদলান।'; f.after(w); } }
    }

    /* ---------- Alerts & Session: স্ক্রিন-লক ---------- */
    var nt = $('notifications'), drawIdle = function () { };
    if (nt && window.MCLock) {
      var ib = document.createElement('div'); ib.className = 'mt-3 border-top pt-3'; nt.appendChild(ib);
      drawIdle = function () {
        var has = MCLock.has(), v = MCLock.idle();
        ib.innerHTML = '<label class="form-label fw-semibold" for="v94Idle">🔒 অলস থাকলে স্ক্রিন-লক (লগআউট নয়)</label><select class="form-select" id="v94Idle" style="max-width:260px"' + (has ? '' : ' disabled') + '>' + [[0, 'বন্ধ'], [1, '১ মিনিট'], [2, '২ মিনিট'], [5, '৫ মিনিট'], [10, '১০ মিনিট']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select><div class="form-text">' + (has ? 'PIN দিলে আগের কাজেই ফেরা যায়।' : 'আগে Security ট্যাবে PIN সেট করুন।') + '</div>';
        $('v94Idle').onchange = function () { MCLock.setIdle(+this.value); toast('✔ সেভ হয়েছে'); };
      };
      drawIdle();
    }

    /* ---------- Backup ---------- */
    var bk = $('backup');
    if (bk) {
      var bi = document.createElement('div'); bi.id = 'v94Bk'; bi.className = 'mt-3 small'; bk.appendChild(bi);
      var drawB = function () {
        var l = localStorage.getItem('pharmacy_lastbackup') || localStorage.getItem('mc_lastbackup'), tot = 0, n = 0;
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^(pharmacy_|mc_)/.test(k) && !/lastbackup/.test(k)) { n++; tot += (localStorage.getItem(k) || '').length; } }
        var d = l ? Math.floor((Date.now() - new Date(l)) / 864e5) : null, lg = rj('pharmacy_backup_log', []).slice(-5).reverse();
        bi.innerHTML = '<div class="border rounded p-2"><div class="' + (d == null || d > 7 ? 'text-danger fw-semibold' : 'text-success fw-semibold') + '">' + (l ? (d === 0 ? 'আজই ব্যাকআপ নেওয়া হয়েছে' : d + ' দিন আগে ব্যাকআপ') + ' · ' + esc(dt(l)) : 'কখনো ব্যাকআপ নেওয়া হয়নি') + '</div><div class="text-muted">ডেটা: ' + n + ' টি কী · ≈ ' + (tot / 1024).toFixed(0) + ' KB (ব্রাউজার-স্টোরেজে)</div>' + (lg.length ? '<ul class="mb-0 mt-1 ps-3">' + lg.map(function (x) { return '<li>' + esc(dt(x.at)) + ' — ' + esc(x.kind) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
        var old = bk.querySelector('p.text-muted'); if (old && /No backup yet|Last backup/.test(old.textContent)) old.style.display = 'none';
      };
      drawB(); document.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#backup') drawB(); });
      var ob = window.backupDatabase; if (typeof ob === 'function') window.backupDatabase = function () { var r = ob.apply(this, arguments); setTimeout(drawB, 400); return r; };
    }

    /* ---------- Data & Tools ---------- */
    var dp = $('v80data');
    if (dp) {
      var box = document.createElement('div'); box.className = 'mt-3 border-top pt-3';
      box.innerHTML = '<h6>🩺 ডেটা-ইন্টেগ্রিটি চেক</h6><p class="small text-muted mb-2">নষ্ট JSON, ডুপ্লিকেট আইডি/ফোন, ঋণাত্মক স্টক, দামের গোলমাল ও অজানা ওষুধের রেফারেন্স খুঁজে দেখায় (কিছু বদলায় না)।</p><button class="btn btn-sm btn-outline-primary" id="v94Chk" type="button">চেক চালান</button> <button class="btn btn-sm btn-outline-secondary d-none" id="v94Csv" type="button">⬇ CSV</button><div id="v94Res" class="small mt-2"></div>' +
        '<h6 class="mt-4">🧹 লগ ছাঁটাই</h6><p class="small text-muted mb-2">অডিট (শেষ ১০০), লগইন-ইতিহাস (৫০), ব্যাকআপ-লগ (১০) রেখে বাকি পুরনো রেকর্ড মুছবে; snooze সাফ হবে। ব্যবসার ডেটা (বিক্রি/ওষুধ) ছোঁয়া হয় না।</p><button class="btn btn-sm btn-outline-danger" id="v94Trim" type="button">এখনই ছাঁটাই করুন</button> <span class="small ms-2" id="v94TM"></span>';
      dp.appendChild(box); var rows = [];
      $('v94Chk').onclick = function () {
        rows = []; var add = function (sev, area, msg) { rows.push([sev, area, msg]); };
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i), v = localStorage.getItem(k); if (/^(pharmacy_|mc_)/.test(k) && /^\s*[\[{]/.test(v || '')) { try { JSON.parse(v); } catch (e) { add('❌', k, 'নষ্ট JSON — রিস্টোর/মুছে ফেলা দরকার'); } } }
        var M = rj('pharmacy_medicines', []), seen = {}, nm = {}, byId = {}, byName = {};
        M.forEach(function (m) { if (!m) return; if (seen[m.id]) add('⚠', 'ওষুধ', 'ডুপ্লিকেট আইডি ' + m.id + ' (' + esc(m.name) + ')'); seen[m.id] = 1; var n = String(m.name || '').trim().toLowerCase(); if (n) { if (nm[n] && nm[n] !== 1) { } if (nm[n]) add('⚠', 'ওষুধ', 'একই নামে একাধিক: ' + esc(m.name)); nm[n] = 1; byName[n] = 1; } byId[m.id] = 1;
          if (!(+m.stock >= 0)) add('❌', 'ওষুধ', esc(m.name) + ' — স্টক ঋণাত্মক/অবৈধ (' + esc(m.stock) + ')');
          var sp = +(m.sellingPrice != null ? m.sellingPrice : m.price), pp = +m.purchasePrice; if (!(sp > 0)) add('❌', 'ওষুধ', esc(m.name) + ' — বিক্রয়মূল্য নেই'); else if (pp > sp) add('⚠', 'ওষুধ', esc(m.name) + ' — ক্রয়মূল্য (' + pp + ') বিক্রয়মূল্যের (' + sp + ') বেশি → লোকসান');
          if (m.expiryDate && isNaN(Date.parse(m.expiryDate))) add('⚠', 'ওষুধ', esc(m.name) + ' — মেয়াদের তারিখ অবৈধ'); });
        var C = rj('pharmacy_customers', []), ph = {}; C.forEach(function (c) { if (!c) return; var p = String(c.phone || '').replace(/\D/g, '').slice(-10); if (p) { if (ph[p]) add('⚠', 'কাস্টমার', 'একই ফোনে একাধিক: ' + esc(c.name) + ' / ' + esc(ph[p])); ph[p] = c.name; } if (+c.due < 0) add('⚠', 'কাস্টমার', esc(c.name) + ' — বাকি ঋণাত্মক'); });
        var miss = {}; rj('pharmacy_sales', []).forEach(function (s) { (s && s.items || []).forEach(function (it) { if (it && it.id != null && !byId[it.id] && !byName[String(it.name || '').toLowerCase()]) miss[it.name || it.id] = 1; }); });
        Object.keys(miss).slice(0, 10).forEach(function (n) { add('⚠', 'বিক্রি', 'বিক্রির আইটেম "' + esc(n) + '" এখন ওষুধ-তালিকায় নেই (মুছে ফেলা/নাম বদল?)'); });
        var S = {}; rj('pharmacy_suppliers', []).forEach(function (s) { if (s) S[s.id] = 1; }); rj('pharmacy_purchases', []).forEach(function (p) { if (p && p.supplierId != null && !S[p.supplierId]) add('⚠', 'ক্রয়', (p.invoiceNo || p.id) + ' — সরবরাহকারী নেই'); });
        $('v94Res').innerHTML = rows.length ? '<div class="text-warning-emphasis mb-1"><b>' + rows.length + 'টি সমস্যা পাওয়া গেছে</b></div><ul class="ps-3 mb-0">' + rows.slice(0, 40).map(function (r) { return '<li>' + r[0] + ' <b>' + r[1] + ':</b> ' + r[2] + '</li>'; }).join('') + (rows.length > 40 ? '<li>… আরও ' + (rows.length - 40) + 'টি (CSV-তে সব)</li>' : '') + '</ul>' : '<div class="text-success fw-semibold">✅ কোনো সমস্যা পাওয়া যায়নি</div>';
        $('v94Csv').classList.toggle('d-none', !rows.length);
      };
      $('v94Csv').onclick = function () { var q = function (v) { v = String(v == null ? '' : v).replace(/<[^>]*>/g, ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }; var c = [['Severity', 'Area', 'Issue']].concat(rows).map(function (r) { return r.map(q).join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })); a.download = 'integrity-report.csv'; a.click(); };
      $('v94Trim').onclick = function () {
        Promise.resolve(window.MCD ? MCD.confirm('পুরনো অডিট/লগইন/ব্যাকআপ-লগ ছাঁটাই করবেন?') : confirm('ছাঁটাই করবেন?')).then(function (ok) {
          if (!ok) return; var before = 0, after = 0; [['pharmacy_audit', 100], ['pharmacy_loginlog', 50], ['pharmacy_backup_log', 10]].forEach(function (x) { var s = localStorage.getItem(x[0]); if (!s) return; before += s.length; try { var a = JSON.parse(s); if (Array.isArray(a)) { a = a.slice(-x[1]); localStorage.setItem(x[0], JSON.stringify(a)); after += JSON.stringify(a).length; } } catch (e) { after += s.length; } });
          ['mc_snooze', 'pharmacy_alert_snooze'].forEach(function (k) { localStorage.removeItem(k); }); $('v94TM').textContent = '✔ ≈ ' + Math.max(0, (before - after) / 1024).toFixed(1) + ' KB খালি হয়েছে'; toast('✔ ছাঁটাই সম্পন্ন');
        });
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

/* v98 — Dashboard Settings (৭টি ট্যাব), settings-v94 এর পরে:
   • Profile: প্রোফাইল সম্পূর্ণতার মিটার (কী বাকি আছে দেখায়)
   • Store & Invoice (Admin): দোকানের লোগো আপলোড (ছোট করে সেভ হয়) → ইনভয়েসের মাথায় ছাপা হয়
   • My Preferences: Quick মেনুতে ৪টি পছন্দের পেজ পিন (📌)
   • Security: পাসওয়ার্ড কতদিন আগে বদলানো + Admin-এর "N দিন পর বদলান" নীতি ও রিমাইন্ডার
   • Alerts & Session: ট্যাব ছেড়ে গেলে স্ক্রিন-লক · লগইনের পর আজকের সারাংশ
   • Backup (Admin): লগআউটের সময় অটো ব্যাকআপ ডাউনলোড · এনক্রিপ্টেড ব্যাকআপের শর্টকাট
   • Data & Tools (Admin): অডিট লগ ভিউয়ার (খোঁজা + CSV) */
(function () {
  'use strict';
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(i) { return document.getElementById(i); }
  function who() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } }
  var u = who(); if (!u) return;
  var em = String(u.email || '').toLowerCase(), admin = u.role === 'admin';
  function toast(m, t) { try { if (typeof showToast === 'function') showToast(m, t || 'success'); } catch (e) { } }
  function PS() { return rj('pharmacy_settings', {}); }
  function P98() { return rj('pharmacy_v98prefs', {})[em] || {}; }
  function setP98(k, v) { var m = rj('pharmacy_v98prefs', {}); m[em] = m[em] || {}; m[em][k] = v; wj('pharmacy_v98prefs', m); }
  function pr80() { return rj('pharmacy_prefs_v80', {})[em] || {}; }
  function dt(x) { return new Date(x).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }); }
  var PAGES = [['dashboard.html', '🏠 Dashboard'], ['sales.html', '🧾 Sales / POS'], ['medicines.html', '💊 Medicines'], ['customers.html', '👥 Customers'], ['purchases.html', '📥 Purchases'], ['suppliers.html', '🏭 Suppliers'], ['prescriptions.html', '📋 Prescriptions'], ['reports.html', '📊 Reports'], ['team.html', '📌 Team Board'], ['closing.html', '🧮 Daily Closing'], ['reorder.html', '🛒 Reorder List'], ['backup.html', '💾 Backup'], ['refunds.html', '↩️ Refunds'], ['writeoff.html', '🗑 Write-off'], ['register.html', '📒 Rx Register']];

  function run() {
    if (!$('settingsModal')) return;

    /* ---------- Profile: সম্পূর্ণতা ---------- */
    var pf = $('profile');
    if (pf && !$('v98Comp')) {
      var cb = document.createElement('div'); cb.id = 'v98Comp'; cb.className = 'mb-3 small'; pf.insertBefore(cb, pf.firstChild);
      var drawC = function () {
        var v = function (i) { return $(i) ? $(i).value.trim() : ''; }, phoneOk = v('profilePhone').replace(/\D/g, '').length >= 10;
        var items = [['নাম', v('profileName').length >= 2], ['ইমেইল', /^\S+@\S+\.\S+$/.test(v('profileEmail'))], ['ফোন', phoneOk], ['ছবি', !!(who() || {}).avatar], ['পদবি/ডিগ্রি', !!v('v94Desig')], ['রেজিস্ট্রেশন নং', !!v('v94Reg')]];
        var n = items.filter(function (x) { return x[1]; }).length, pc = Math.round(n / items.length * 100), miss = items.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; });
        cb.innerHTML = '<div class="d-flex justify-content-between"><b>প্রোফাইল সম্পূর্ণ ' + pc + '%</b><span class="text-muted">' + (miss.length ? 'বাকি: ' + esc(miss.join(', ')) : '✔ সব তথ্য দেওয়া আছে') + '</span></div><div class="progress mt-1" style="height:8px" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar ' + (pc === 100 ? 'bg-success' : 'bg-primary') + '" style="width:' + pc + '%"></div></div>';
      };
      ['profileName', 'profileEmail', 'profilePhone', 'v94Desig', 'v94Reg'].forEach(function (i) { if ($(i)) $(i).addEventListener('input', drawC); }); drawC();
      document.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#profile') drawC(); });
    }

    /* ---------- My Preferences: পিন করা পেজ ---------- */
    var mp = $('myprefs');
    if (mp && !$('v98Pins')) {
      var pw = document.createElement('div'); pw.id = 'v98Pins'; pw.className = 'mt-3 border-top pt-3';
      var pins = rj('pharmacy_pins', {})[em] || [];
      pw.innerHTML = '<h6>📌 Quick মেনুতে পিন করা পেজ <small class="text-muted">(সর্বোচ্চ ৪টি)</small></h6><div class="row g-1">' + PAGES.map(function (p) { return '<div class="col-6 col-md-4"><div class="form-check"><input class="form-check-input v98pin" type="checkbox" id="v98p_' + p[0].replace('.html', '') + '" value="' + p[0] + '"' + (pins.indexOf(p[0]) > -1 ? ' checked' : '') + '><label class="form-check-label" for="v98p_' + p[0].replace('.html', '') + '">' + p[1] + '</label></div></div>'; }).join('') + '</div><div class="small text-muted mt-1" id="v98PinM"></div>';
      mp.appendChild(pw);
      pw.addEventListener('change', function (e) {
        if (!e.target.classList.contains('v98pin')) return;
        var sel = [].filter.call(pw.querySelectorAll('.v98pin'), function (c) { return c.checked; }).map(function (c) { return c.value; });
        if (sel.length > 4) { e.target.checked = false; $('v98PinM').textContent = 'সর্বোচ্চ ৪টি পিন করা যায়।'; return; }
        var m = rj('pharmacy_pins', {}); m[em] = sel; wj('pharmacy_pins', m); $('v98PinM').textContent = '✔ সেভ হয়েছে — পরের পেজ-লোডে Quick মেনুতে দেখাবে।';
      });
    }

    /* ---------- Security: পাসওয়ার্ডের বয়স ---------- */
    var sc = $('security');
    if (sc && !$('v98Pw')) {
      var pb = document.createElement('div'); pb.id = 'v98Pw'; pb.className = 'small border rounded p-2 mt-3';
      var anchor = [].filter.call(sc.querySelectorAll('button'), function (b) { return /Change Password/.test(b.textContent); })[0];
      if (anchor) anchor.insertAdjacentElement('afterend', pb); else sc.appendChild(pb);
      var maxD = function () { return +PS().pwMaxDays || 0; };
      var drawP = function () {
        var at = (rj('pharmacy_pwat', {}))[em], age = at ? Math.floor((Date.now() - new Date(at)) / 864e5) : null, md = maxD();
        var line = age == null ? 'পাসওয়ার্ড কবে বদলানো হয়েছে তার রেকর্ড নেই — একবার বদলালে রেকর্ড শুরু হবে।' : '🔑 পাসওয়ার্ড বদলানো হয়েছে ' + (age === 0 ? 'আজ' : age + ' দিন আগে') + ' (' + dt(at) + ')';
        var warn = age != null && md && age > md ? ' <span class="text-danger fw-semibold">⚠ এখন বদলানো উচিত</span>' : '';
        pb.innerHTML = '<div>' + line + warn + '</div>' + (admin ? '<label class="mt-2 d-block" for="v98PwMax">Admin নীতি: সবার জন্য কত দিন পর পাসওয়ার্ড বদলানোর রিমাইন্ডার</label><select id="v98PwMax" class="form-select form-select-sm" style="max-width:220px"><option value="0">বন্ধ</option><option value="30">৩০ দিন</option><option value="60">৬০ দিন</option><option value="90">৯০ দিন</option><option value="180">১৮০ দিন</option></select>' : (md ? '<div class="text-muted">নীতি: ' + md + ' দিন পর বদলানো উচিত।</div>' : ''));
        if (admin) { $('v98PwMax').value = String(md); $('v98PwMax').onchange = function () { var S = PS(); S.pwMaxDays = +this.value; wj('pharmacy_settings', S); toast('✔ নীতি সেভ হয়েছে'); drawP(); }; }
      };
      drawP();
      var up = window.updatePassword;
      if (typeof up === 'function') window.updatePassword = function () {
        var n0 = rj('pharmacy_audit', []).length, r = up.apply(this, arguments);
        setTimeout(function () { var A = rj('pharmacy_audit', []), l = A[A.length - 1]; if (A.length > n0 || (l && /Password changed/.test(l.msg || '') && Date.now() - new Date(l.at) < 5000)) { var m = rj('pharmacy_pwat', {}); m[em] = new Date().toISOString(); wj('pharmacy_pwat', m); drawP(); } }, 700);
        return r;
      };
      var at0 = (rj('pharmacy_pwat', {}))[em], md0 = maxD();
      try { if (at0 && md0 && (Date.now() - new Date(at0)) / 864e5 > md0 && !sessionStorage.getItem('mc_pw_warn')) { sessionStorage.setItem('mc_pw_warn', '1'); setTimeout(function () { toast('🔑 পাসওয়ার্ড ' + md0 + ' দিনের বেশি পুরনো — Settings → Security থেকে বদলান', 'warning'); }, 1500); } } catch (e) { }
    }

    /* ---------- Alerts & Session ---------- */
    var nt = $('notifications');
    if (nt && !$('v98Sess')) {
      var sb = document.createElement('div'); sb.id = 'v98Sess'; sb.className = 'mt-3 border-top pt-3'; nt.appendChild(sb);
      var drawS = function () {
        var has = window.MCLock && MCLock.has(), hid = has && MCLock.hide && MCLock.hide();
        sb.innerHTML = '<div class="form-check"><input class="form-check-input" type="checkbox" id="v98Hide"' + (hid ? ' checked' : '') + (has ? '' : ' disabled') + '><label class="form-check-label" for="v98Hide">👁 ট্যাব/উইন্ডো ছেড়ে ৩০ সেকেন্ডের বেশি অন্য জায়গায় থাকলে স্ক্রিন-লক</label></div>' + (has ? '' : '<div class="small text-muted ms-4">আগে Security ট্যাবে PIN সেট করুন।</div>') +
          '<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="v98Sum"' + (P98().sum !== false ? ' checked' : '') + '><label class="form-check-label" for="v98Sum">📋 লগইনের পর Dashboard-এ আজকের সারাংশ দেখান (কম স্টক, মেয়াদ, বাকি, অপেক্ষমাণ Rx)</label></div>';
        if ($('v98Hide')) $('v98Hide').onchange = function () { if (MCLock.setHide) MCLock.setHide(this.checked); toast('✔ সেভ হয়েছে'); };
        $('v98Sum').onchange = function () { setP98('sum', this.checked); toast('✔ সেভ হয়েছে'); };
      };
      drawS(); document.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#notifications') drawS(); });
    }

    /* ---------- Store: লোগো (Admin) ---------- */
    var ss = $('storeset');
    if (ss && admin && !$('v98Logo')) {
      var S0 = PS(), logo = S0.logo || '';
      var lb = document.createElement('div'); lb.id = 'v98Logo'; lb.className = 'mt-3';
      lb.innerHTML = '<label class="form-label fw-semibold" for="v98File">🖼 ইনভয়েসের লোগো</label><div class="d-flex align-items-center gap-3 flex-wrap"><div style="min-width:120px;min-height:48px;border:1px dashed rgba(120,130,170,.5);border-radius:10px;padding:6px;display:flex;align-items:center;justify-content:center" id="v98Pv"></div><div><input type="file" class="form-control form-control-sm" id="v98File" accept="image/png,image/jpeg,image/webp"><button type="button" class="btn btn-sm btn-outline-danger mt-1" id="v98Rm">লোগো মুছুন</button> <span class="small text-muted" id="v98LM"></span></div></div>';
      var host = $('v96Box') || $('v94Prev') || ss; host.insertAdjacentElement(host === ss ? 'beforeend' : 'afterend', lb);
      var drawL = function () { var pv = $('v98Pv'); pv.textContent = ''; if (/^data:image\//.test(logo)) { var im = document.createElement('img'); im.src = logo; im.alt = 'Logo'; im.style.cssText = 'max-width:200px;max-height:60px'; pv.appendChild(im); } else pv.textContent = 'লোগো নেই'; };
      drawL();
      $('v98File').onchange = function () {
        var f = this.files && this.files[0]; if (!f) return; var msg = $('v98LM');
        if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { msg.textContent = 'শুধু PNG/JPG/WebP'; return; }
        if (f.size > 4e6) { msg.textContent = 'ফাইল ৪MB-এর বেশি'; return; }
        var rd = new FileReader(); rd.onload = function () {
          var im = new Image(); im.onload = function () {
            var sc = Math.min(1, 260 / im.width, 100 / im.height), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            var out = c.toDataURL('image/png'); if (out.length > 90000) out = c.toDataURL('image/jpeg', .8);
            if (out.length > 90000) { msg.textContent = 'ছবিটি খুব জটিল — সরল/ছোট লোগো দিন'; return; }
            logo = out; drawL(); msg.textContent = '✔ প্রস্তুত — নিচে "Save store settings" চাপুন';
          }; im.onerror = function () { msg.textContent = 'ছবি পড়া যায়নি'; }; im.src = rd.result;
        }; rd.readAsDataURL(f);
      };
      $('v98Rm').onclick = function () { logo = ''; drawL(); $('v98LM').textContent = 'মুছতে "Save store settings" চাপুন'; };
      var sv = window.saveStoreSettings;
      window.saveStoreSettings = function () { var r = sv.apply(this, arguments), S2 = PS(); if (logo) S2.logo = logo; else delete S2.logo; wj('pharmacy_settings', S2); return r; };
    }

    /* ---------- Backup (Admin) ---------- */
    var bk = $('backup');
    if (bk && admin && !$('v98Bk')) {
      var bb = document.createElement('div'); bb.id = 'v98Bk'; bb.className = 'mt-3 border-top pt-3';
      bb.innerHTML = '<div class="form-check"><input class="form-check-input" type="checkbox" id="v98Out"' + (P98().bkOut ? ' checked' : '') + '><label class="form-check-label" for="v98Out">🚪 লগআউটের সময় ব্যাকআপ ডাউনলোড (শেষ ব্যাকআপ ১২ ঘণ্টার বেশি পুরনো হলে)</label></div><div class="small text-muted ms-4">ডাউনলোডের জন্য ব্রাউজার অনুমতি চাইতে পারে।</div><a class="btn btn-sm btn-outline-primary mt-2" href="backup.html">🔐 এনক্রিপ্টেড ব্যাকআপ / রিস্টোর পেজ</a>';
      bk.appendChild(bb); $('v98Out').onchange = function () { setP98('bkOut', this.checked); toast('✔ সেভ হয়েছে'); };
    }
    if (!window.__v98out) { window.__v98out = 1; document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#logoutBtn,#logoutDropdownBtn'); if (!b || b.__v98go || !admin || !P98().bkOut) return;
      var l = localStorage.getItem('pharmacy_lastbackup'); if (l && Date.now() - new Date(l) < 432e5) return;
      e.preventDefault(); e.stopImmediatePropagation();
      try { backupDatabase(); toast('💾 লগআউটের আগে ব্যাকআপ নামানো হচ্ছে…', 'info'); } catch (x) { }
      setTimeout(function () { b.__v98go = 1; b.click(); }, 900);
    }, true); }

    /* ---------- Data & Tools: অডিট লগ ভিউয়ার (Admin) ---------- */
    var dp = $('v80data');
    if (dp && admin && !$('v98Aud')) {
      var ab = document.createElement('div'); ab.id = 'v98Aud'; ab.className = 'mt-3 border-top pt-3';
      ab.innerHTML = '<h6>📜 অডিট লগ</h6><div class="d-flex gap-2 flex-wrap mb-2"><input class="form-control form-control-sm" id="v98Aq" style="max-width:260px" placeholder="খুঁজুন (যেমন Void, Password, কার্ট)" aria-label="Search audit"><button type="button" class="btn btn-sm btn-outline-secondary" id="v98Acsv">⬇ CSV</button><span class="small text-muted align-self-center" id="v98An"></span></div><div id="v98Al" class="small border rounded" style="max-height:220px;overflow:auto"></div>';
      dp.appendChild(ab);
      var all = function () { return rj('pharmacy_audit', []).slice().reverse(); };
      var filt = function () { var q = $('v98Aq').value.trim().toLowerCase(); return all().filter(function (a) { return !q || ((a.msg || '') + ' ' + (a.by || '')).toLowerCase().indexOf(q) > -1; }); };
      var drawA = function () { var L = filt(); $('v98An').textContent = L.length + ' টি এন্ট্রি'; $('v98Al').innerHTML = L.slice(0, 60).map(function (a) { return '<div class="px-2 py-1 border-bottom"><span class="text-muted">' + esc(dt(a.at)) + '</span> · <b>' + esc(a.by || '?') + '</b> — ' + esc(a.msg) + '</div>'; }).join('') || '<div class="p-2 text-muted">কিছু নেই</div>'; };
      $('v98Aq').oninput = drawA; drawA(); document.addEventListener('shown.bs.tab', function (e) { if (e.target && e.target.getAttribute('href') === '#v80data') drawA(); });
      $('v98Acsv').onclick = function () {
        var q = function (s) { s = String(s == null ? '' : s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
        var csv = '﻿সময়,ব্যবহারকারী,ঘটনা\n' + filt().map(function (a) { return [q(a.at), q(a.by), q(a.msg)].join(','); }).join('\n');
        var l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); l.download = 'audit-log.csv'; l.click(); setTimeout(function () { URL.revokeObjectURL(l.href); }, 2000);
      };
    }

    /* ---------- লগইনের পর সারাংশ ---------- */
    try {
      if (P98().sum !== false && !sessionStorage.getItem('mc_sum') && $('mainContent')) {
        sessionStorage.setItem('mc_sum', '1');
        var P = pr80(), meds = rj('pharmacy_medicines', []), bits = [];
        var low = P.noStock ? 0 : meds.filter(function (m) { return (+m.stock || 0) <= (+m.minStock || 0); }).length;
        var td = new Date(Date.now() + 216e5).toISOString().slice(0, 10), lim = new Date(Date.now() + 216e5 + 30 * 864e5).toISOString().slice(0, 10);
        var ex = P.noExp ? 0 : meds.filter(function (m) { return m.expiryDate && m.expiryDate >= td && m.expiryDate <= lim && (+m.stock || 0) > 0; }).length;
        var due = P.noMoney ? 0 : rj('pharmacy_customers', []).filter(function (c) { return (+c.due || 0) > 0; }).length;
        var rx = P.noOps ? 0 : rj('pharmacy_prescriptions', []).filter(function (p) { return p && p.status === 'pending'; }).length;
        if (low) bits.push('📦 কম/শেষ স্টক ' + low); if (ex) bits.push('⏳ ৩০ দিনে মেয়াদ শেষ ' + ex); if (due) bits.push('💰 বাকি আছে ' + due + ' জন'); if (rx) bits.push('📋 অপেক্ষমাণ Rx ' + rx);
        if (bits.length) {
          var bn = document.createElement('div'); bn.className = 'alert alert-info d-flex justify-content-between align-items-start mb-3'; bn.setAttribute('role', 'status');
          bn.innerHTML = '<div><b>আজকের সারাংশ:</b> ' + esc(bits.join(' · ')) + '</div><button type="button" class="btn-close" aria-label="বন্ধ"></button>';
          bn.querySelector('button').onclick = function () { bn.remove(); };
          var tgt = document.querySelector('#mainContent > .container-fluid') || $('mainContent'); tgt.insertBefore(bn, tgt.firstChild);
        }
      }
    } catch (e) { }
  }
  function boot() { run(); var n = 0, t = setInterval(function () { if ($('v98Logo') || !admin || ++n > 16) { clearInterval(t); return; } run(); }, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); }); else setTimeout(boot, 80);
})();

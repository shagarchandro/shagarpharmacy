/* v90 Backup: 🔐 পাসওয়ার্ড-সুরক্ষিত (AES-256-GCM) ব্যাকআপ ও রিস্টোর, 🔍 ফাইল বনাম বর্তমান ডেটার তুলনা (রিস্টোর ছাড়া), 📑 টেবিল-ভিত্তিক CSV, 📜 ব্যাকআপ লগ, ⏰ রিমাইন্ডার (pharmacy_backup_cfg) */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (!$('box') || $('box').hidden) return;
  var exportOnly = $('rst').hidden, KEEP = /^(pharmacy_|mc_)/;
  var SEC = { pharmacy_creds: 1, pharmacy_accounts: 1, pharmacy_roles: 1, mc_acc: 1, pharmacy_loginlog: 1, mc_lock: 1 };
  var SKIP = { pharmacy_lastbackup: 1, mc_lastbackup: 1, mc_restorepoint: 1 };
  function keys(sec) { var k = []; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (KEEP.test(n) && !SKIP[n] && (sec || !SEC[n])) k.push(n); } return k.sort(); }
  function say(m, bad) { var e = $('msg'); e.textContent = m; e.style.color = bad ? 'var(--bad)' : ''; }
  var day = function () { return new Date(Date.now() + 216e5).toISOString().slice(0, 10); };
  function dl(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }
  /* ---------- ব্যাকআপ লগ ---------- */
  function log(kind, n) { var L = rj('pharmacy_backup_log', []); L.push({ at: new Date().toISOString(), kind: kind, keys: n || 0 }); localStorage.setItem('pharmacy_backup_log', JSON.stringify(L.slice(-30))); }
  var lastSeen = localStorage.getItem('pharmacy_lastbackup') || '';
  setInterval(function () { var l = localStorage.getItem('pharmacy_lastbackup') || ''; if (l && l !== lastSeen) { lastSeen = l; if (!window.__b90own) log('JSON ব্যাকআপ', keys(false).length); window.__b90own = 0; drawLog(); } }, 700);
  /* ---------- UI ---------- */
  var st = document.createElement('style');
  st.textContent = '.b90 input[type=password],.b90 input[type=text],.b90 select{max-width:100%}.b90 table{min-width:0}.b90ban{border-left:4px solid var(--bad);padding:.6rem .8rem}';
  document.head.appendChild(st);
  var cfg = rj('pharmacy_backup_cfg', { every: 7 });
  var w = document.createElement('div'); w.className = 'b90';
  w.innerHTML = '<div class="card" id="b90Rem"></div>' +
    '<div class="card"><h3>🔐 পাসওয়ার্ড-সুরক্ষিত ব্যাকআপ</h3><p class="muted">ফাইলটি AES-256 দিয়ে লক হয় — পাসওয়ার্ড ছাড়া খোলা যায় না। <b>পাসওয়ার্ড ভুলে গেলে ফাইল উদ্ধার সম্ভব নয়।</b></p><div class="row"><input type="password" id="b90pw" placeholder="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" autocomplete="new-password" style="flex:1;min-width:160px"><button class="btn" id="b90enc">🔐 এনক্রিপ্টেড ডাউনলোড</button>' + (exportOnly ? '' : '<label class="btn2">🔓 এনক্রিপ্টেড রিস্টোর <input id="b90impf" type="file" accept=".mcbak,application/json" hidden></label>') + '</div>' + (exportOnly ? '' : '<label style="display:block;margin-top:.5rem"><input type="checkbox" id="b90sec"> লগইন/অ্যাকাউন্ট তথ্যও (হ্যাশসহ) অন্তর্ভুক্ত করুন</label>') + '</div>' +
    '<div class="card"><h3>📑 টেবিল-ভিত্তিক CSV</h3><div class="row"><select id="b90ds" aria-label="Dataset"></select><button class="btn2" id="b90csv">⬇️ CSV</button></div></div>' +
    (exportOnly ? '' : '<div class="card"><h3>🔍 ব্যাকআপ ফাইল তুলনা <span class="muted" style="font-weight:400;font-size:.9rem">(রিস্টোর হয় না)</span></h3><label class="btn2">📂 JSON ফাইল বাছুন <input id="b90cmpf" type="file" accept=".json,application/json" hidden></label><div id="b90cmp" class="scroll" style="margin-top:.6rem"></div></div>') +
    '<div class="card"><h3>📜 ব্যাকআপ লগ</h3><div class="scroll"><table><thead><tr><th>সময়</th><th>ধরন</th><th>ডেটা-কী</th></tr></thead><tbody id="b90log"></tbody></table></div></div>';
  $('box').appendChild(w);
  var DS = { pharmacy_sales: 'POS বিক্রি', pharmacy_customers: 'কাস্টমার', pharmacy_medicines: 'ওষুধ', pharmacy_purchases: 'ক্রয়', pharmacy_suppliers: 'সরবরাহকারী', pharmacy_prescriptions: 'প্রেসক্রিপশন', pharmacy_refunds: 'রিফান্ড', pharmacy_writeoffs: 'Write-off', pharmacy_closings: 'ডে-ক্লোজিং' };
  $('b90ds').innerHTML = Object.keys(DS).map(function (k) { return '<option value="' + k + '">' + DS[k] + '</option>'; }).join('');
  function drawLog() { var L = rj('pharmacy_backup_log', []).slice().reverse(); $('b90log').innerHTML = L.map(function (x) { return '<tr><td>' + esc(new Date(x.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })) + '</td><td>' + esc(x.kind) + '</td><td>' + esc(x.keys) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="muted">এখনও নেই</td></tr>'; drawRem(); }
  function drawRem() {
    var l = localStorage.getItem('pharmacy_lastbackup') || '', ageD = l ? Math.floor((Date.now() - new Date(l)) / 864e5) : null, ev = +cfg.every || 0, due = ev && (ageD == null || ageD >= ev);
    $('b90Rem').className = 'card' + (due ? ' b90ban' : ''); $('b90Rem').innerHTML = '<h3 style="margin-top:0">⏰ ব্যাকআপ রিমাইন্ডার</h3>' + (due ? '<p class="bad"><b>' + (ageD == null ? 'কখনো ব্যাকআপ নেওয়া হয়নি।' : ageD + ' দিন আগে শেষ ব্যাকআপ — এখন নিন।') + '</b></p>' : '<p class="muted">' + (ev ? 'সব ঠিক আছে' : 'বন্ধ') + '</p>') + '<label>কত দিন পরপর মনে করাবে <select id="b90ev"><option value="0">বন্ধ</option><option value="1">প্রতিদিন</option><option value="3">৩ দিন</option><option value="7">সাপ্তাহিক</option><option value="30">মাসিক</option></select></label>';
    $('b90ev').value = String(ev); $('b90ev').onchange = function () { cfg.every = +this.value; localStorage.setItem('pharmacy_backup_cfg', JSON.stringify(cfg)); drawRem(); };
  }
  /* ---------- crypto ---------- */
  var b64 = function (u) { var s = ''; u.forEach(function (c) { s += String.fromCharCode(c); }); return btoa(s); }, unb = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  function kdf(pw, salt) { return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (k) { return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 250000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  $('b90enc').onclick = function () {
    var pw = $('b90pw').value; if (pw.length < 8) return say('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর দিন।', 1);
    if (!window.crypto || !crypto.subtle) return say('এই ব্রাউজারে এনক্রিপশন সমর্থিত নয় (HTTPS/localhost দরকার)।', 1);
    var ks = keys(!!($('b90sec') && $('b90sec').checked)), d = {}; ks.forEach(function (k) { d[k] = localStorage.getItem(k); });
    var plain = JSON.stringify({ app: 'medicare', v: 8, at: new Date().toISOString(), keys: ks.length, data: d }), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    say('এনক্রিপ্ট হচ্ছে…'); kdf(pw, salt).then(function (key) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plain)); }).then(function (ct) {
      var o = { app: 'medicare-enc', v: 1, kdf: 'PBKDF2-SHA256-250000', salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
      dl('medicare-backup-' + day() + '.mcbak', new Blob([JSON.stringify(o)], { type: 'application/json' }));
      window.__b90own = 1; var iso = new Date().toISOString(); localStorage.setItem('pharmacy_lastbackup', iso); localStorage.setItem('mc_lastbackup', iso); lastSeen = iso; log('🔐 এনক্রিপ্টেড', ks.length); $('b90pw').value = ''; drawLog(); say('✅ এনক্রিপ্টেড ব্যাকআপ ডাউনলোড হয়েছে (' + ks.length + ' টি কী)।');
      try { if (typeof last === 'function') last(); } catch (e) { }
    }).catch(function () { say('এনক্রিপশন ব্যর্থ।', 1); });
  };
  function decryptFile(f) {
    return f.text().then(function (t) { var o = JSON.parse(t); if (o.app !== 'medicare-enc') throw new Error('fmt'); return Promise.resolve(window.MCD ? MCD.prompt('ব্যাকআপের পাসওয়ার্ড দিন', { def: '', type: 'text' }) : prompt('পাসওয়ার্ড')).then(function (pw) { if (!pw) throw new Error('cancel'); return kdf(pw, unb(o.salt)).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb(o.iv) }, k, unb(o.ct)); }); }); }).then(function (b) { return new TextDecoder().decode(b); });
  }
  if ($('b90impf')) $('b90impf').onchange = function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f) return;
    decryptFile(f).then(function (plain) { var dt = new DataTransfer(); dt.items.add(new File([plain], 'decrypted.json', { type: 'application/json' })); var tgt = Array.prototype.filter.call(document.querySelectorAll('label.btn2'), function (l) { return /আগে প্রিভিউ/.test(l.textContent); }).map(function (l) { return l.querySelector('input[type=file]'); })[0] || $('imp'); tgt.files = dt.files; tgt.dispatchEvent(new Event('change', { bubbles: true })); log('🔓 এনক্রিপ্টেড ফাইল খোলা', 0); drawLog(); say('🔓 ডিক্রিপ্ট হয়েছে — প্রিভিউ দেখে রিস্টোর করুন।'); })
      .catch(function (x) { say(x && x.message === 'cancel' ? 'বাতিল।' : x && x.message === 'fmt' ? 'এটি এনক্রিপ্টেড MediCare ব্যাকআপ নয়।' : '❌ পাসওয়ার্ড ভুল বা ফাইল নষ্ট।', 1); });
  };
  /* ---------- CSV ---------- */
  $('b90csv').onclick = function () {
    var k = $('b90ds').value, A = rj(k, []); if (!Array.isArray(A) || !A.length) return say('এই টেবিলে ডেটা নেই।', 1);
    var cols = []; A.forEach(function (r) { if (r && typeof r === 'object') Object.keys(r).forEach(function (c) { if (cols.indexOf(c) < 0) cols.push(c); }); });
    var cell = function (v) { if (v == null) v = ''; else if (typeof v === 'object') v = JSON.stringify(v); v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var c = [cols.map(cell).join(',')].concat(A.map(function (r) { return cols.map(function (x) { return cell(r && r[x]); }).join(','); })).join('\n');
    dl(k.replace('pharmacy_', '') + '-' + day() + '.csv', new Blob(['﻿' + c], { type: 'text/csv' })); say('✅ ' + A.length + ' সারি CSV হয়েছে।');
  };
  /* ---------- তুলনা ---------- */
  function cnt(s) { try { var v = JSON.parse(s); return Array.isArray(v) ? v.length : (v && typeof v === 'object' ? Object.keys(v).length : 1); } catch (e) { return '?'; } }
  if ($('b90cmpf')) $('b90cmpf').onchange = function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f) return;
    f.text().then(function (t) {
      var o = JSON.parse(t); if (o.app !== 'medicare' || !o.data) throw 0;
      var all = {}; Object.keys(o.data).forEach(function (k) { if (KEEP.test(k) && !SKIP[k]) all[k] = 1; }); keys(true).forEach(function (k) { all[k] = 1; });
      var rows = Object.keys(all).sort().map(function (k) {
        var a = localStorage.getItem(k), b = typeof o.data[k] === 'string' ? o.data[k] : null, s, cl = '';
        if (a == null) { s = 'শুধু ফাইলে'; cl = 'ok'; } else if (b == null) { s = 'শুধু বর্তমানে'; cl = 'muted'; } else if (a === b) { s = '✔ এক'; cl = 'muted'; } else { s = '≠ ভিন্ন'; cl = 'bad'; }
        return '<tr><td>' + esc(k) + '</td><td>' + (a == null ? '—' : cnt(a)) + '</td><td>' + (b == null ? '—' : cnt(b)) + '</td><td class="' + cl + '">' + s + '</td></tr>';
      });
      $('b90cmp').innerHTML = '<p class="muted">ফাইলের তারিখ: ' + esc(new Date(o.at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })) + '</p><table><thead><tr><th>ডেটা-কী</th><th>বর্তমান</th><th>ফাইলে</th><th>অবস্থা</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
    }).catch(function () { $('b90cmp').innerHTML = '<p class="bad">এটি সাধারণ (প্লেইন) MediCare ব্যাকআপ নয় — এনক্রিপ্টেড ফাইল আগে "এনক্রিপ্টেড রিস্টোর" দিয়ে খুলুন।</p>'; });
  };
  drawLog();
})();

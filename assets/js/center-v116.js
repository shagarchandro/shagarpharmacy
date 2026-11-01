/* v116 — Control Center → 🔑 Reset Requests
   লগইন পেজ থেকে আসা পাসওয়ার্ড-রিসেট অনুরোধ: Admin অস্থায়ী পাসওয়ার্ড বানিয়ে দেন (এক বারই দেখানো হয়), লক-আউট খুলে যায়,
   ব্যবহারকারী প্রথম লগইনে নতুন পাসওয়ার্ড দিতে বাধ্য (guard.js)। অনুরোধ ছাড়াও সরাসরি রিসেট করা যায়। সব কাজ audit লগে। */
(function () {
  'use strict';
  var prev = window.CCX; if (!prev) return;
  var DEF = ['admin@medicare.com', 'pharmacist@medicare.com', 'staff@medicare.com'];
  var tm = function (t) { return new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }); };
  function temp() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', N = '23456789', out; do { var b = crypto.getRandomValues(new Uint8Array(10)); out = [].map.call(b, function (x, i) { var S = i % 4 === 3 ? N : A + N; return S[x % S.length]; }).join(''); } while (!/[A-Za-z]/.test(out) || !/\d/.test(out)); return out; }
  window.CCX = function (c) {
    var x = prev(c), h = c.h, SHOW = null;
    x.panels.pwreq = function () {
      var R = c.rj('pharmacy_pwreq', []), accts = c.rj('pharmacy_accounts', []), sets = c.rj('pharmacy_settings', {}), dis = (sets.disabled || []).map(function (e) { return String(e).toLowerCase(); });
      var open = R.filter(function (r) { return r.status === 'open'; }), hist = R.filter(function (r) { return r.status !== 'open'; }).slice().reverse();
      var info = function (em) { em = String(em).toLowerCase(); var cu = accts.filter(function (a) { return String(a.email).toLowerCase() === em; })[0]; if (cu) return { ok: cu.active !== false, kind: 'acct', cu: cu, why: cu.active === false ? 'অ্যাকাউন্টটি বন্ধ — আগে Accounts থেকে চালু করুন' : '' }; if (DEF.indexOf(em) > -1) return { ok: dis.indexOf(em) < 0 || em === 'admin@medicare.com', kind: 'def', why: dis.indexOf(em) > -1 && em !== 'admin@medicare.com' ? 'ডিফল্ট অ্যাকাউন্টটি বন্ধ করা আছে' : '' }; return { ok: false, kind: null, why: 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই' }; };
      function apply(em, reqId) {
        var inf = info(em); if (!inf.ok) return c.bad(inf.why);
        if (!window.MCPW) return c.bad('পাসওয়ার্ড-মডিউল লোড হয়নি — পেজ রিলোড করুন');
        if (!confirm(em + ' এর জন্য অস্থায়ী পাসওয়ার্ড বানাবেন? পুরনো পাসওয়ার্ড আর কাজ করবে না।')) return;
        var pw = temp();
        MCPW.hash(pw).then(function (hh) {
          if (inf.kind === 'acct') { var A = c.rj('pharmacy_accounts', []); A.forEach(function (a) { if (String(a.email).toLowerCase() === em.toLowerCase()) a.hash = hh; }); c.wj('pharmacy_accounts', A); }
          else { var cr = c.rj('pharmacy_creds', {}); cr[em.toLowerCase()] = hh; c.wj('pharmacy_creds', cr); }
          var MC = c.rj('pharmacy_mustchange', {}); MC[em.toLowerCase()] = new Date().toISOString(); c.wj('pharmacy_mustchange', MC);
          var lk = c.rj('mc_lock', {}); delete lk[em.toLowerCase()]; c.wj('mc_lock', lk);
          if (reqId) { var L = c.rj('pharmacy_pwreq', []); L.forEach(function (r) { if (r.id === reqId) { r.status = 'done'; r.doneAt = new Date().toISOString(); } }); c.wj('pharmacy_pwreq', L); }
          c.audit('Password reset (temporary) issued for ' + em); SHOW = { em: em, pw: pw }; c.show('pwreq');
        });
      }
      var kp = h('div', { class: 'cc-grid' }, [['অপেক্ষমাণ অনুরোধ', open.length], ['সম্পন্ন (মোট)', R.filter(function (r) { return r.status === 'done'; }).length], ['পাসওয়ার্ড বদলাতে বাকি', Object.keys(c.rj('pharmacy_mustchange', {})).length]].map(function (k) { return h('div', { class: 'cc-card' }, h('b', { style: 'font-size:1.3rem' }, k[1]), h('br'), h('small', { class: 'muted' }, k[0])); }));
      var reveal = SHOW ? h('div', { class: 'cc-card', style: 'border:2px solid #2e9e5b;background:#effaf3', role: 'status' }, h('h3', {}, '✅ অস্থায়ী পাসওয়ার্ড তৈরি — ' + SHOW.em), h('p', {}, h('code', { style: 'font-size:1.3rem;letter-spacing:.06em' }, SHOW.pw)),
        h('p', { class: 'muted' }, 'এটি শুধু এখনই দেখানো হচ্ছে, সেভ করা হয়নি। ব্যবহারকারীকে সরাসরি (ফোনে/সামনে) জানান; প্রথম লগইনে তিনি নতুন পাসওয়ার্ড দেবেন।'), c.btn('📋 কপি', function () { var t = SHOW.pw; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { c.ok('কপি হয়েছে'); }, function () { prompt('কপি করুন:', t); }); }, 'btn'), ' ', c.btn('বন্ধ করুন', function () { SHOW = null; c.show('pwreq'); })) : '';
      var rows = open.slice().reverse().map(function (r) { var inf = info(r.email);
        return h('tr', {}, h('td', {}, r.id), h('td', {}, tm(r.at)), h('td', {}, r.name), h('td', {}, r.email + (inf.kind ? '' : ' ⚠')), h('td', {}, r.note || '—'),
          h('td', {}, inf.ok ? c.btn('🔑 অস্থায়ী পাসওয়ার্ড দিন', function () { apply(r.email, r.id); }, 'btn') : h('small', { class: 'muted' }, inf.why), ' ', c.btn('🚫 বাতিল', function () { if (!confirm('অনুরোধ বাতিল করবেন?')) return; var L = c.rj('pharmacy_pwreq', []); L.forEach(function (q) { if (q.id === r.id) { q.status = 'rejected'; q.doneAt = new Date().toISOString(); } }); c.wj('pharmacy_pwreq', L); c.audit('Reset request ' + r.id + ' rejected'); c.show('pwreq'); })));
      });
      var emails = DEF.concat(accts.map(function (a) { return String(a.email).toLowerCase(); }).filter(function (e) { return DEF.indexOf(e) < 0; }));
      var sel = h('select', { 'aria-label': 'Account' }, emails.map(function (e) { return h('option', { value: e }, e); }));
      return h('div', {}, h('h2', {}, '🔑 Reset Requests'), h('p', { class: 'muted' }, 'লগইন পেজের "Forgot Password?" থেকে আসা অনুরোধ। অনুমোদন দিলে অস্থায়ী পাসওয়ার্ড তৈরি হয়, লগইন-লক খুলে যায় এবং ব্যবহারকারীকে প্রথম লগইনে নতুন পাসওয়ার্ড দিতে হয়।'), kp, reveal,
        h('h3', {}, 'অপেক্ষমাণ'), c.tbl(['রেফ', 'কখন', 'নাম', 'ইমেইল', 'নোট', ''], rows, 'কোনো অনুরোধ নেই 👍'),
        h('h3', {}, 'অনুরোধ ছাড়াই রিসেট (Admin নিজে)'), h('p', {}, sel, ' ', c.btn('🔑 অস্থায়ী পাসওয়ার্ড বানান', function () { apply(sel.value, null); }, 'btn')),
        h('h3', {}, 'আগের অনুরোধ'), c.tbl(['রেফ', 'কখন', 'নাম', 'ইমেইল', 'ফলাফল'], hist.slice(0, 20).map(function (r) { return h('tr', {}, h('td', {}, r.id), h('td', {}, tm(r.at)), h('td', {}, r.name), h('td', {}, r.email), h('td', {}, r.status === 'done' ? '✅ অস্থায়ী পাসওয়ার্ড দেওয়া হয়েছে' : '🚫 বাতিল')); }), 'এখনো কিছু নেই'));
    };
    x.tabs.push(['pwreq', '🔑 Reset Requests']);
    return x;
  };
})();

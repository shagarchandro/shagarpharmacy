/* v91 Home: 🧭 "আপনি কে?" রোল-ফাইন্ডার (সঠিক লগইনে পাঠায়), 💡 আজকের স্বাস্থ্য-টিপ (দিন ধরে বদলায়), ☎ জরুরি নম্বর, 🔎 FAQ খোঁজা, নেভে Operations লিংক */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var portals = $('#portals'); if (!portals) return;
  var st = document.createElement('style');
  st.textContent = '.h91c{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin:.8rem 0}.h91c button{border:1.5px solid var(--br,#d5dde8);background:var(--card,#fff);color:inherit;border-radius:99px;padding:.45rem 1rem;cursor:pointer;font:inherit;transition:.15s}.h91c button:hover{transform:translateY(-1px)}.h91c button.on{background:var(--pri,#0b7a6b);color:#fff;border-color:var(--pri,#0b7a6b)}#h91r{max-width:620px;margin:.4rem auto 0;text-align:center}#h91r .card{padding:1.1rem}.h91g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}.h91g .card{padding:1.1rem}.h91n{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.5rem}.h91n a{border:1px solid var(--br,#d5dde8);border-radius:10px;padding:.4rem .8rem;text-decoration:none;color:inherit;font-weight:600}#h91q{display:block;width:100%;max-width:780px;margin:0 auto .8rem;padding:.6rem .9rem;border-radius:10px;border:1.5px solid var(--br,#d5dde8);background:var(--card,#fff);color:inherit;font:inherit}.h91no{text-align:center;opacity:.7}';
  document.head.appendChild(st);
  /* রোল-ফাইন্ডার */
  var R = {
    owner: ['👑 মালিক / Owner', 'রিপোর্ট, ব্যবহারকারী, সেটিংস ও পুরো ব্যবসার নিয়ন্ত্রণ — Operations Panel (Owner) অথবা Management Dashboard (Admin)।', [['admin/login.html', '⚙️ Operations Login'], ['login.html', '🧑‍⚕️ Admin Login']]],
    pharm: ['💊 ফার্মাসিস্ট', 'প্রেসক্রিপশন যাচাই, ওষুধ ও মেয়াদ, Rx রেজিস্টার, রিফান্ড ও ক্রয়।', [['login.html', '🧑‍⚕️ Staff Login'], ['admin/login.html', '⚙️ Operations Login']]],
    cash: ['🧾 ক্যাশিয়ার', 'POS-এ দ্রুত বিল, পেমেন্ট ও ইনভয়েস।', [['admin/login.html', '⚙️ Operations Login (POS)'], ['login.html', '🧑‍⚕️ Staff Login']]],
    inv: ['📦 ইনভেন্টরি', 'স্টক, ব্যাচ, মেয়াদ, ক্রয় ও রিঅর্ডার।', [['admin/login.html', '⚙️ Operations Login']]],
    del: ['🛵 ডেলিভারি স্টাফ', 'অ্যাসাইন করা অনলাইন অর্ডার ও ডেলিভারি স্ট্যাটাস।', [['admin/login.html', '⚙️ Operations Login']]],
    cust: ['🛒 কাস্টমার', 'ওষুধ খুঁজুন, কার্টে দিন, অর্ডার করুন ও ট্র্যাক করুন — লগইন লাগে না।', [['shop.html', '🛒 শপ খুলুন'], ['#track', '📦 অর্ডার ট্র্যাক']]]
  };
  var sec = document.createElement('section'); sec.id = 'h91find';
  sec.innerHTML = '<div class="wrap"><div class="hd"><h2>আপনি <span class="gt">কে?</span></h2><p>বেছে নিন — কোথা থেকে ঢুকবেন বলে দিচ্ছি</p></div><div class="h91c" role="group" aria-label="Role">' + Object.keys(R).map(function (k) { return '<button data-k="' + k + '">' + esc(R[k][0]) + '</button>'; }).join('') + '</div><div id="h91r" role="status" aria-live="polite"></div></div>';
  portals.parentNode.insertBefore(sec, portals);
  sec.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return; var r = R[b.getAttribute('data-k')];
    Array.prototype.forEach.call(sec.querySelectorAll('.h91c button'), function (x) { x.classList.toggle('on', x === b); });
    $('#h91r').innerHTML = '<div class="card"><h3 style="margin-top:0">' + esc(r[0]) + '</h3><p>' + esc(r[1]) + '</p><p style="display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-bottom:0">' + r[2].map(function (l, i) { return '<a class="btn ' + (i ? '' : 'p') + '" href="' + esc(l[0]) + '">' + esc(l[1]) + '</a>'; }).join('') + '</p></div>';
  });
  /* টিপ + জরুরি */
  var TIPS = ['ওষুধ কেনার সময় প্যাকেটের মেয়াদ (Exp.) ও সিল দেখে নিন।', 'ওষুধ ঠান্ডা, শুকনো ও সরাসরি রোদ থেকে দূরে রাখুন; বাচ্চাদের নাগালের বাইরে।', 'অ্যান্টিবায়োটিক ডাক্তারের পরামর্শ ছাড়া শুরু বা মাঝপথে বন্ধ করবেন না।', 'প্রেসক্রিপশনের ওষুধ নিজে নিজে বদলাবেন না; বদলাতে চাইলে ফার্মাসিস্ট বা ডাক্তারকে জিজ্ঞেস করুন।', 'একসাথে একাধিক ওষুধ খেলে পরস্পরের প্রতিক্রিয়া হতে পারে — ফার্মাসিস্টকে সব ওষুধের কথা জানান।', 'খোলা সিরাপ/ড্রপের ব্যবহারের সময়সীমা লেবেলে দেখে নিন; পুরনো হলে ফেলে দিন।', 'গর্ভাবস্থা বা বুকের দুধ খাওয়ানোর সময় যেকোনো ওষুধের আগে ডাক্তারের পরামর্শ নিন।', 'ওষুধ খাওয়ার নিয়ম (খাওয়ার আগে/পরে) লেবেলে বা ডাক্তারের কথায় মেনে চলুন।', 'ব্যথার ওষুধ লম্বা সময় নিজে নিজে খেতে থাকবেন না।', 'মেয়াদোত্তীর্ণ ওষুধ ঘরে জমিয়ে রাখবেন না — নিরাপদে ফেলে দিন।'];
  var di = Math.floor((Date.now() + 216e5) / 864e5), tip = TIPS[di % TIPS.length];
  var s2 = document.createElement('section'); s2.id = 'h91info'; s2.className = 'alt';
  s2.innerHTML = '<div class="wrap"><div class="h91g"><div class="card"><h3 style="margin-top:0">💡 আজকের স্বাস্থ্য-টিপ</h3><p style="margin:.3rem 0">' + esc(tip) + '</p><small style="opacity:.7">সাধারণ তথ্য — ডাক্তারের পরামর্শের বিকল্প নয়।</small></div><div class="card"><h3 style="margin-top:0">☎ জরুরি নম্বর (বাংলাদেশ)</h3><div class="h91n"><a href="tel:999">🚨 ৯৯৯ জাতীয় জরুরি</a><a href="tel:16263">🏥 ১৬২৬৩ স্বাস্থ্য বাতায়ন</a></div><small style="opacity:.7;display:block;margin-top:.5rem">গুরুতর অসুস্থতায় অপেক্ষা না করে হাসপাতালে যান।</small></div></div></div>';
  var faq = $('#faq'); if (faq) faq.parentNode.insertBefore(s2, faq);
  /* FAQ খোঁজা */
  if (faq) {
    var ds = Array.prototype.slice.call(faq.querySelectorAll('details')); if (ds.length > 3) {
      var q = document.createElement('input'); q.id = 'h91q'; q.type = 'search'; q.placeholder = '🔎 প্রশ্ন খুঁজুন…'; q.setAttribute('aria-label', 'Search FAQ');
      var nf = document.createElement('p'); nf.className = 'h91no'; nf.hidden = true; nf.textContent = 'কিছু পাওয়া যায়নি — Contact পেজে জিজ্ঞেস করুন।';
      ds[0].parentNode.insertBefore(q, ds[0]); ds[ds.length - 1].after(nf);
      q.oninput = function () { var v = q.value.trim().toLowerCase(), n = 0; ds.forEach(function (d) { var m = !v || d.textContent.toLowerCase().indexOf(v) >= 0; d.style.display = m ? '' : 'none'; if (m) n++; if (v && m) d.open = true; else if (!v) d.open = false; }); nf.hidden = n > 0; };
    }
  }
  /* নেভে Operations */
  var nav = $('#nav'); if (nav && !nav.querySelector('a[href="admin/login.html"]')) { var a = document.createElement('a'); a.href = 'admin/login.html'; a.textContent = 'Operations'; var bt = nav.querySelector('a.btn'); nav.insertBefore(a, bt || null); }
  /* .rev নতুন সেকশনে থাকলে দৃশ্যমান */
  Array.prototype.forEach.call(document.querySelectorAll('#h91find .rev,#h91info .rev'), function (e) { e.classList.add('on'); });
})();

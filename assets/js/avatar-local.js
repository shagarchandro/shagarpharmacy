/* v101 — লোকাল অ্যাভাটার: নামের আদ্যক্ষর দিয়ে SVG (ইন্টারনেট/তৃতীয় পক্ষের সাইট লাগে না; গ্রাহকের নাম বাইরে যায় না)।
   window.mcAvatar(name, bgHex) → data: URI। pages-এর <head>-এ সবার আগে লোড হয়। */
(function () {
  'use strict';
  window.mcAvatar = function (name, bg) {
    var n = String(name == null ? '' : name).replace(/[\u0000-\u001f<>&"']/g, ' ').trim(), parts = n.split(/\s+/).filter(Boolean), ini = '?';
    if (parts.length) { var a = Array.from(parts[0])[0] || ''; var b = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] || '') : ''; ini = (a + b).toUpperCase(); }
    var c = /^[0-9a-fA-F]{6}$/.test(bg || '') ? bg : '3b82f6';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#' + c + '"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="system-ui,Segoe UI,Noto Sans Bengali,sans-serif" font-size="' + (Array.from(ini).length > 1 ? 26 : 30) + '" font-weight="600" fill="#fff">' + ini + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };
})();

/* v109: PWA register + offline banner + install button */
(function(){
  var s=document.currentScript, base=s?s.src.replace(/assets\/js\/pwa-v109\.js.*$/,''):'';
  try{ if(!document.querySelector('link[rel=manifest]')){var l=document.createElement('link');l.rel='manifest';l.href=base+'manifest.webmanifest';document.head.appendChild(l);} }catch(e){}
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw=1/.test(location.search)){
    window.addEventListener('load',function(){ navigator.serviceWorker.register(base+'sw.js').catch(function(){}); });
  }
  var bar;
  function off(){ if(bar||!document.body)return; bar=document.createElement('div'); bar.textContent='আপনি অফলাইনে আছেন — সেভ করা ডাটা দেখা যাচ্ছে';
    bar.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#b45309;color:#fff;text-align:center;padding:6px 10px;font:13px sans-serif';
    document.body.appendChild(bar); }
  function on(){ if(bar){bar.remove();bar=null;} }
  window.addEventListener('offline',off); window.addEventListener('online',on);
  document.addEventListener('DOMContentLoaded',function(){ if(!navigator.onLine)off(); });
  var dp; window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault(); dp=e; if(!document.body||document.getElementById('mc-install'))return;
    var b=document.createElement('button'); b.id='mc-install'; b.textContent='📲 অ্যাপ ইনস্টল';
    b.style.cssText='position:fixed;right:12px;bottom:60px;z-index:99998;background:#0b7a6b;color:#fff;border:0;border-radius:20px;padding:8px 14px;font:13px sans-serif;box-shadow:0 2px 8px #0004;cursor:pointer';
    b.onclick=function(){ dp.prompt(); dp.userChoice.finally(function(){b.remove();dp=null;}); };
    document.body.appendChild(b);
  });
})();

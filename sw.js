/* v109 service worker: offline cache. Never touches /api/, non-GET or cross-origin. */
var V='mc-v109', CORE=['shop.html','login.html','assets/icon-192.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.indexOf('/api/')>=0||u.searchParams.has('nosw'))return;
  var stat=/\/assets\//.test(u.pathname);
  if(stat){ /* cache-first for static assets */
    e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(x){if(x.ok){var c=x.clone();caches.open(V).then(function(h){h.put(r,c)})}return x})}));
  }else{ /* network-first for pages/data, fall back to cache */
    e.respondWith(fetch(r).then(function(x){if(x.ok){var c=x.clone();caches.open(V).then(function(h){h.put(r,c)})}return x}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('shop.html')})}));
  }
});

/* v61 – Team board: সারাংশ, অপঠিত/জরুরি ফিল্টার, নোটিশ সার্চ, সব পড়েছি, কাজের ফিল্টার */
(function(){
 var box=document.getElementById('box');if(!box||box.hidden)return;
 var $=function(i){return document.getElementById(i)};
 function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
 var u=null;try{u=JSON.parse(localStorage.getItem('user')||sessionStorage.getItem('user'))}catch(e){}
 var em=String(u&&u.email||'').toLowerCase(),role=u&&u.role;
 var st=document.createElement('style');
 st.textContent='.tx{grid-column:1/-1}.tx .kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem}.tx .kp div{border:1px solid var(--br);border-radius:12px;padding:.6rem;text-align:center}.tx .kp b{display:block;font-size:1.35rem}.tx .chips{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0}.chip{border:1px solid var(--br);background:var(--card);color:var(--fg);border-radius:99px;padding:.25rem .7rem;cursor:pointer;font:inherit;font-size:.85rem}.chip.on{background:var(--pri);color:#fff;border-color:var(--pri)}.tx2{width:100%}';
 document.head.appendChild(st);
 var bar=document.createElement('div');bar.className='tx card';
 bar.innerHTML='<div class="kp" id="tk"></div>';
 box.insertBefore(bar,box.firstChild);
 var nl=$('nl'),tl=$('tl');
 var nc=document.createElement('div');nc.innerHTML='<input id="ns" class="tx2" placeholder="🔎 নোটিশ খুঁজুন…"><div class="chips" id="nfc"><button class="chip on" data-f="all">সব</button><button class="chip" data-f="unread">অপঠিত</button><button class="chip" data-f="high">জরুরি</button><button class="chip" id="allread">সব পড়েছি ✔</button></div>';
 nl.parentNode.insertBefore(nc,nl);
 var tc=document.createElement('div');tc.innerHTML='<div class="chips" id="tfc"><button class="chip on" data-f="all">সব</button><button class="chip" data-f="late">⏰ দেরি</button><button class="chip" data-f="today">আজ</button></div>';
 tl.parentNode.insertBefore(tc,tl);
 var nf='all',tf='all',busy=false;
 function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'})}
 function stats(){var d=rj('pharmacy_team',{notices:[],tasks:[]}),td=today(),N=d.notices||[],T=d.tasks||[];
  var un=N.filter(function(n){return !(n.ack&&n.ack[em])}).length,hi=N.filter(function(n){return n.pri==='high'}).length;
  var open=T.filter(function(t){return !t.done&&(t.to==='all'||t.to===role||t.to===em||role==='admin'||role==='pharmacist')}),late=open.filter(function(t){return t.due&&t.due<td}).length;
  $('tk').innerHTML='<div><b>'+un+'</b>অপঠিত নোটিশ</div><div><b style="color:'+(hi?'var(--bad)':'inherit')+'">'+hi+'</b>জরুরি</div><div><b>'+open.length+'</b>খোলা কাজ</div><div><b style="color:'+(late?'var(--bad)':'inherit')+'">'+late+'</b>দেরি</div><div><b>'+T.filter(function(t){return t.done&&(t.doneAt||'').slice(0,10)===td}).length+'</b>আজ সম্পন্ন</div>'}
 function filt(){if(busy)return;busy=true;
  var q=($('ns').value||'').toLowerCase(),td=today();
  [].forEach.call(nl.querySelectorAll('.it'),function(e){var t=e.textContent.toLowerCase(),ok=!q||t.indexOf(q)>-1;
   if(nf==='unread'&&!e.querySelector('[data-ack]'))ok=false;if(nf==='high'&&!e.querySelector('.tag.hi'))ok=false;e.style.display=ok?'':'none'});
  var d=rj('pharmacy_team',{tasks:[]}),byId={};(d.tasks||[]).forEach(function(t){byId[t.id]=t});
  [].forEach.call(tl.querySelectorAll('.it'),function(e){var c=e.querySelector('[data-tk]'),t=c&&byId[c.dataset.tk],ok=true;
   if(t&&tf==='late')ok=!t.done&&t.due&&t.due<td;if(t&&tf==='today')ok=t.due===td;e.style.display=ok?'':'none'});
  stats();busy=false}
 var mo=new MutationObserver(filt);mo.observe(nl,{childList:true});mo.observe(tl,{childList:true});
 function chips(root,set){root.addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(!b)return;set(b.dataset.f);[].forEach.call(root.querySelectorAll('[data-f]'),function(c){c.classList.toggle('on',c===b)});filt()})}
 chips($('nfc'),function(v){nf=v});chips($('tfc'),function(v){tf=v});
 $('ns').addEventListener('input',filt);
 $('allread').onclick=function(){var d=rj('pharmacy_team',{notices:[],tasks:[]});(d.notices||[]).forEach(function(n){n.ack=n.ack||{};n.ack[em]=1});
  localStorage.setItem('pharmacy_team',JSON.stringify(d));$('mine').dispatchEvent(new Event('change',{bubbles:true}));filt()};
 window.addEventListener('storage',function(){$('mine').dispatchEvent(new Event('change',{bubbles:true}))});
 filt();
})();

/* v61 – Rx Register: দ্রুত সময়সীমা, KPI, শীর্ষ ওষুধ, verifier সারাংশ, Rx ref ছাড়া ফিল্টার/হাইলাইট */
(function(){
 var box=document.getElementById('box');if(!box||box.hidden)return;
 var $=function(i){return document.getElementById(i)};
 function rj(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
 function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 var meds=rj('pharmacy_medicines',[]),rxIds={};meds.forEach(function(m){if(m.rxRequired)rxIds[String(m.id)]=1});
 var all=rj('pharmacy_sales',[]).filter(function(s){return s&&s.real&&s.status!=='Voided'&&(s.rx||(s.items||[]).some(function(i){return rxIds[String(i.id)]}))});
 var st=document.createElement('style');
 st.textContent='.rx2 .chips{display:flex;flex-wrap:wrap;gap:.4rem}.rx2 .chip{border:1px solid var(--br);background:var(--card);color:var(--fg);border-radius:99px;padding:.3rem .8rem;cursor:pointer;font:inherit}.rx2 .chip.on{background:var(--pri);color:#fff;border-color:var(--pri)}.rx2 .kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}.rx2 .kp div{border:1px solid var(--br);border-radius:12px;padding:.7rem;text-align:center}.rx2 .kp b{display:block;font-size:1.4rem}.rx2 .two{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}@media(max-width:700px){.rx2 .two{grid-template-columns:1fr}}.rx2 tr.nr td{background:color-mix(in srgb,var(--bad) 10%,transparent)}.rx2 .bd{display:inline-block;border-radius:99px;padding:0 .5rem;font-size:.75rem;font-weight:700;background:color-mix(in srgb,var(--bad) 15%,transparent);color:var(--bad)}';
 document.head.appendChild(st);
 var old=[$('sum'),$('tb').closest('.card')];old.forEach(function(e){if(e)e.style.display='none'});
 var w=document.createElement('div');w.className='rx2';
 w.innerHTML='<div class="card noprint"><div class="chips" id="rq"><button class="chip" data-r="today">আজ</button><button class="chip" data-r="7">৭ দিন</button><button class="chip" data-r="month">এই মাস</button><button class="chip on" data-r="all">সব</button><button class="chip" data-r="noref">⚠️ Rx ref ছাড়া</button></div></div><div class="card"><div class="kp" id="rk"></div></div><div class="two"><div class="card scroll"><h3 style="margin-top:0">🏆 শীর্ষ ওষুধ</h3><table style="min-width:0"><tbody id="rtop"></tbody></table></div><div class="card scroll"><h3 style="margin-top:0">🩺 Verifier অনুযায়ী</h3><table style="min-width:0"><tbody id="rver"></tbody></table></div></div><div class="card scroll"><table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>Rx no</th><th>Medicines (qty)</th><th>Verified by</th><th>Cashier</th></tr></thead><tbody id="rtb"></tbody></table></div>';
 box.appendChild(w);
 var range='all';
 function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'})}
 function addDays(d,n){var x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
 function rows(){var f=$('f').value,t=$('t').value,q=$('q').value.toLowerCase(),td=today();
  return all.filter(function(s){var d=s.date||'';if(f&&d<f)return false;if(t&&d>t)return false;
   if(range==='today'&&d!==td)return false;if(range==='7'&&d<addDays(td,-6))return false;if(range==='month'&&d.slice(0,7)!==td.slice(0,7))return false;
   if(range==='noref'&&s.rx)return false;
   var hay=[s.invoiceNo,s.customer,s.rx&&s.rx.no,s.rx&&s.rx.by].concat((s.items||[]).map(function(i){return i.name})).join(' ').toLowerCase();return !q||hay.indexOf(q)>-1}).sort(function(a,b){return (b.at||'')>(a.at||'')?1:-1})}
 function draw(){var R=rows(),noRef=R.filter(function(s){return !s.rx}).length,cu={},mc={},vb={},units=0;
  R.forEach(function(s){cu[s.customer||'-']=1;var v=s.rx?(s.rx.by||'—'):'Rx ref নেই';vb[v]=(vb[v]||0)+1;
   (s.items||[]).forEach(function(i){if(!rxIds[String(i.id)]&&!s.rx)return;var q=+i.quantity||0;units+=q;mc[i.name]=(mc[i.name]||0)+q})});
  $('rk').innerHTML='<div><b>'+R.length+'</b>Rx বিক্রি</div><div><b>'+Object.keys(cu).length+'</b>গ্রাহক</div><div><b>'+units+'</b>ইউনিট</div><div><b style="color:'+(noRef?'var(--bad)':'inherit')+'">'+noRef+'</b>Rx ref ছাড়া</div>';
  var top=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a]}).slice(0,5);
  $('rtop').innerHTML=top.map(function(n,i){return '<tr><td>'+(i+1)+'. '+esc(n)+'</td><td><b>'+mc[n]+'</b></td></tr>'}).join('')||'<tr><td class="muted">—</td></tr>';
  $('rver').innerHTML=Object.keys(vb).sort(function(a,b){return vb[b]-vb[a]}).map(function(n){return '<tr><td>'+esc(n)+'</td><td><b>'+vb[n]+'</b></td></tr>'}).join('')||'<tr><td class="muted">—</td></tr>';
  $('rtb').innerHTML=R.map(function(s){return '<tr class="'+(s.rx?'':'nr')+'"><td>'+esc(s.date)+'</td><td>'+esc(s.invoiceNo)+'</td><td>'+esc(s.customer)+'</td><td>'+(s.rx?esc(s.rx.no):'<span class="bd">Rx ref নেই</span>')+'</td><td>'+(s.items||[]).map(function(i){return esc(i.name)+' ×'+esc(i.quantity)}).join('<br>')+'</td><td>'+esc(s.rx?s.rx.by:'—')+'</td><td>'+esc(s.cashier)+'</td></tr>'}).join('')||'<tr><td colspan="7" class="muted">কোনো রেকর্ড নেই</td></tr>'}
 $('rq').addEventListener('click',function(e){var b=e.target.closest('[data-r]');if(!b)return;range=b.dataset.r;[].forEach.call($('rq').children,function(c){c.classList.toggle('on',c===b)});draw()});
 ['f','t','q'].forEach(function(i){$(i).addEventListener('input',draw)});
 $('csv').onclick=function(){var L=[['Date','Invoice','Customer','Rx no','Medicines','Verified by','Cashier']];
  rows().forEach(function(s){L.push([s.date,s.invoiceNo,s.customer,s.rx?s.rx.no:'',(s.items||[]).map(function(i){return i.name+' x'+i.quantity}).join('; '),s.rx?s.rx.by:'',s.cashier])});
  var c=L.map(function(r){return r.map(function(x){x=String(x==null?'':x);if(/^[=+\-@]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+c],{type:'text/csv'}));a.download='rx-register.csv';a.click()};
 draw();
})();

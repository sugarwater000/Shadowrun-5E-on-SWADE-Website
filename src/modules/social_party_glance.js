// ---- Hover cards on handles, link and picture previews, Party at a glance (GM)
/* ===== Hover cards: point at a handle to see who they are ===== */
let hcEl=null,hcT=0,hcHide=0,hcFor='';
const hcCan=()=>{try{return matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){return false}};
const hcAgo=ts=>{const s=Math.max(0,(Date.now()-ts)/1000);if(s<90)return 'just now';const m=s/60;if(m<90)return Math.round(m)+' min ago';const h=m/60;if(h<36)return Math.round(h)+' hours ago';const d=h/24;if(d<45)return Math.round(d)+' days ago';return Math.round(d/30)+' months ago'};
function hcData(h){const k=lc(String(h).trim());if(!k||String(h).startsWith('▓'))return null;
 const ps=posts.filter(p=>lc(p.handle)===k),last=ps.reduce((a,p)=>(!a||p.ts>a.ts)?p:a,null),pr=profs[pid(h)]||null,nq=npcOf(h),sheet=portraitSheet(h);
 if(!ps.length&&!pr&&!nq&&!sheet)return null;
 return{name:last?last.handle:(nq?nq.name:(sheet&&(sheet.handle||sheet.name))||h),n:ps.length,last,pr,nq,sheet,col:(last&&last.col)||(nq&&nq.col)||'',aff:(last&&last.aff)||(pr&&pr.aff)||(nq&&nq.aff)||'',sig:(last&&last.sig)||(nq&&nq.sig)||'',img:portraitOf(h)}}
function hcClose(){clearTimeout(hcT);clearTimeout(hcHide);if(hcEl){hcEl.remove();hcEl=null}hcFor=''}
function hcShow(el,h){const d=hcData(h);if(!d||!document.body.contains(el))return;hcClose();hcFor=lc(h);
 const bio=(d.pr&&d.pr.bio)||(d.nq&&d.nq.desc)||'',role=[d.pr&&d.pr.role,d.pr&&d.pr.meta].filter(Boolean).join(' · ');
 const bt=bmPlain?String(bio).replace(/\s+/g,' ').slice(0,150):'';
 const p=document.createElement('div');p.id='hcard';p.className='hcard';
 p.innerHTML=`<div class="hcr">${d.img?`<img src="/_blob/${esc(d.img)}" alt="">`:''}<div style="min-width:0"><b style="color:${cl(d.col)}">${esc(d.name)}</b>${d.nq?' <span class="tag" style="color:#000;background:var(--am)">NPC</span>':''}${role?`<div class="meta">${esc(role)}</div>`:''}${d.aff?`<div><span class="tag aff">${esc(d.aff)}</span></div>`:''}${d.sig?`<div class="meta">~ ${esc(d.sig)}</div>`:''}</div></div>
 <div class="meta" style="margin-top:6px">${d.n?d.n+' post'+(d.n==1?'':'s')+(d.last?' · last posted '+esc(hcAgo(d.last.ts)):''):'No posts yet'}</div>${bt?`<div class="hcb">${esc(bt)}${String(bio).length>150?'…':''}</div>`:''}
 <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-hcd="${esc(d.name)}">Directory page</button>${d.sheet?`<button class="btn sm" data-hcs="${esc(d.sheet.id)}">🧾 Character sheet</button>`:''}</div>`;
 document.body.appendChild(p);hcEl=p;
 const r=el.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight;
 p.style.left=Math.max(8,Math.min(innerWidth-pw-8,r.left))+'px';p.style.top=(r.bottom+ph+10>innerHeight?Math.max(8,r.top-ph-6):r.bottom+6)+'px'}
const hcTarget=t=>{const el=t&&t.closest&&t.closest('.handle[data-ph],.scby[data-ph],.mention');if(!el||el.closest('.ed,#modal'))return null;const h=el.classList.contains('mention')?el.textContent.replace(/^@/,'').trim():(el.dataset.ph||'');return h?{el,h}:null};
document.addEventListener('mouseover',e=>{if(!hcCan())return;
 const x=hcTarget(e.target);
 if(x){clearTimeout(hcHide);if(hcFor===lc(x.h)&&hcEl)return;clearTimeout(hcT);hcT=setTimeout(()=>hcShow(x.el,x.h),380);return}
 if(e.target.closest&&e.target.closest('#hcard')){clearTimeout(hcHide);return}
 clearTimeout(hcT);if(hcEl){clearTimeout(hcHide);hcHide=setTimeout(hcClose,200)}});
document.addEventListener('mouseout',e=>{if(!e.relatedTarget){clearTimeout(hcT);if(hcEl){clearTimeout(hcHide);hcHide=setTimeout(hcClose,200)}}});
document.addEventListener('click',e=>{const d=e.target.closest&&e.target.closest('[data-hcd],[data-hcs]');
 if(d){const nm=d.dataset.hcd,sid=d.dataset.hcs;hcClose();document.body.classList.remove('menu');
  if(sid){portraitGoSheet(sid)}else{if(typeof shDirty!=='undefined'&&shDirty.size)try{shSave()}catch(x){}dirH=nm;board='__dir';thread=null;query='';sh=null;if($('#sheetroot'))$('#view').innerHTML='';render()}return}
 hcClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hcClose()});
window.addEventListener('scroll',()=>{if(hcEl)hcClose()},true);

/* ===== Previews for links, pictures and videos under a post ===== */
const pvOn=()=>prefs.prev!==false;
const pvYt=x=>{const h=x.hostname.replace(/^www\.|^m\./,'');let id='';if(h==='youtu.be')id=x.pathname.slice(1).split('/')[0];else if(h==='youtube.com'||h==='youtube-nocookie.com'){if(x.pathname==='/watch')id=x.searchParams.get('v')||'';else{const m=x.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);if(m)id=m[1]}}return /^[\w-]{11}$/.test(id)?id:''};
function pvKind(u){let x;try{x=new URL(u)}catch(e){return null}
 if(!/^https?:$/.test(x.protocol))return null;
 if(x.origin===location.origin){const p=x.searchParams.get('p');return p&&allPosts.some(y=>y.id===p&&!y.deleted)?{t:'post',id:p}:null}
 const https=x.protocol==='https:';
 if(https&&/\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(x.pathname))return{t:'img',u:x.href};
 if(https&&/\.(mp4|webm|mov)$/i.test(x.pathname))return{t:'vid',u:x.href};
 const y=pvYt(x);if(y)return{t:'yt',id:y,u:x.href};
 const v=x.hostname.replace(/^www\./,'')==='vimeo.com'&&x.pathname.match(/^\/(\d{5,12})(?:\/|$)/);if(v)return{t:'vim',id:v[1],u:x.href};
 return{t:'link',u:x.href}}
let pvC={};try{pvC=JSON.parse(localStorage.getItem('sr_unf')||'{}')}catch(e){}
const pvPend=new Map();
function pvSave(){try{const k=Object.keys(pvC);if(k.length>80)k.sort((a,b)=>(pvC[a].ts||0)-(pvC[b].ts||0)).slice(0,k.length-60).forEach(x=>delete pvC[x]);localStorage.setItem('sr_unf',JSON.stringify(pvC))}catch(e){}}
function pvUnfurl(u){const c=pvC[u];if(c&&Date.now()-(c.ts||0)<(c.bad?36e5:6048e5))return Promise.resolve(c.bad?null:c);
 if(pvPend.has(u))return pvPend.get(u);
 const p=fetch('/api/unfurl',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:u})}).then(r=>r.ok?r.json():null).then(j=>{
   if(j&&j.ok&&(j.title||j.desc)){pvC[u]={t:j.title||'',d:j.desc||'',s:j.site||'',ts:Date.now()};pvSave();return pvC[u]}
   pvC[u]={bad:1,ts:Date.now()};pvSave();return null}).catch(()=>null).finally(()=>pvPend.delete(u));
 pvPend.set(u,p);return p}
const pvHost=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}};
function pvCard(u,c,extra){const a=document.createElement('a');a.className='pvc';a.href=u;a.target='_blank';a.rel='noopener noreferrer nofollow';
 a.innerHTML=`<div class="pvs1">${extra||''}${esc(c.s||pvHost(u))}</div><div class="pvt">${esc(c.t||pvHost(u))}</div>${c.d?`<div class="pvd">${esc(c.d)}</div>`:''}`;return a}
function pvAdd(host,item){const box=host._pv||(host._pv=(()=>{const d=document.createElement('div');d.className='pvs';host.appendChild(d);return d})());box.appendChild(item)}
function pvBuild(host,u){const k=pvKind(u);if(!k)return;
 if(k.t==='img'){const d=document.createElement('div');d.className='pvimg';const im=document.createElement('img');im.loading='lazy';im.referrerPolicy='no-referrer';im.alt='';im.src=k.u;im.onerror=()=>d.remove();im.title='Click to enlarge';d.appendChild(im);pvAdd(host,d);return}
 if(k.t==='vid'){const d=document.createElement('div');d.className='pvimg';d.innerHTML=`<video controls preload="none" playsinline referrerpolicy="no-referrer" src="${esc(k.u)}" style="max-width:100%;max-height:380px"></video>`;const v=d.firstChild;v.onerror=()=>d.remove();pvAdd(host,d);return}
 if(k.t==='post'){const p=allPosts.find(y=>y.id===k.id);if(!p)return;const o=posts.find(y=>y.thread===p.thread&&y.op)||p,B=allBoards().find(b=>b.id===p.board)||{};
  const a=document.createElement('div');a.className='pvc pvp';a.dataset.pvo=p.id;a.innerHTML=`<div class="pvs1">💬 ${esc(o.to?'Private message':(B.name||'This site'))} · ${esc(p.handle)}</div><div class="pvt">${esc(o.title||'(post)')}</div><div class="pvd">${esc(bmPlain(p.body).slice(0,160))}</div>`;pvAdd(host,a);return}
 if(k.t==='yt'||k.t==='vim'){const a=document.createElement('div');a.className='pvc pvv';a.dataset.pvp=k.t+'|'+k.id;a.setAttribute('role','button');a.tabIndex=0;
  a.innerHTML=`<div class="pvs1">▶ ${k.t==='yt'?'YouTube':'Vimeo'} video · click to play (nothing loads until you do)</div><div class="pvt">${esc(pvHost(k.u))}</div>`;pvAdd(host,a);
  if(k.t==='yt')pvUnfurl(k.u).then(c=>{if(c&&c.t&&a.isConnected)a.querySelector('.pvt').textContent=c.t});return}
 if(k.t==='link')pvUnfurl(k.u).then(c=>{if(c&&host.isConnected)pvAdd(host,pvCard(k.u,c))})}
function pvMarkAll(){try{const v=$('#view');if(!v||!pvOn())return;pvObs&&pvObs.disconnect();
  const by=new Map();v.querySelectorAll('a.ext').forEach(a=>{if(a.closest('.red,.pvs,.ed'))return;const h=a.closest('.bd,.cmb,.gbd,.cm,.post');if(!h)return;(by.get(h)||by.set(h,[]).get(h)).push(a.href)});
  by.forEach((urls,h)=>{if(h.dataset.pv)return;h.dataset.pv='1';[...new Set(urls)].slice(0,3).forEach(u=>pvBuild(h,u))})}
 finally{pvWatch()}}
let pvObs=null,pvT=0;
function pvWatch(){const v=$('#view');if(!v||typeof MutationObserver==='undefined')return;if(!pvObs)pvObs=new MutationObserver(()=>{clearTimeout(pvT);pvT=setTimeout(pvMarkAll,150)});pvObs.observe(v,{childList:true,subtree:true})}
document.addEventListener('click',e=>{
 const im=e.target.closest&&e.target.closest('.pvimg img');if(im){e.preventDefault();$('#modal').innerHTML=`<div class="modal" id="lb"><img src="${esc(im.src)}" referrerpolicy="no-referrer" style="max-width:100%;max-height:92vh;margin:auto;cursor:zoom-out"></div>`;$('#lb').onclick=closeM;return}
 const pl=e.target.closest&&e.target.closest('[data-pvp]');if(pl){const [t,id]=pl.dataset.pvp.split('|'),f=document.createElement('iframe');
  f.src=t==='yt'?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0':'https://player.vimeo.com/video/'+encodeURIComponent(id)+'?autoplay=1';
  f.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');f.setAttribute('allowfullscreen','');f.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');f.referrerPolicy='strict-origin-when-cross-origin';f.className='pvf';pl.replaceWith(f);return}
 const po=e.target.closest&&e.target.closest('[data-pvo]');if(po){const p=allPosts.find(y=>y.id===po.dataset.pvo);if(p){focusPost=p.id;openThread(p.thread)}}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-pvp]')){e.preventDefault();e.target.click()}});

/* ===== Party at a glance (GM) ===== */
let pgAll=false;
function pgStats(d){const kS=sh,kI=shId;try{sh=shFix(JSON.parse(JSON.stringify(d)));shId=d.id;
  const fi=swSkVal(sh,'Fighting',(sh.sk.agility.find(x=>x.n==='Fighting')||{}).d||0);
  const parry=2+shHalf(drParryDie(fi))+(+sh.parryMod||0)+fxSum('parry');
  const ar=armorLoc(sh.handle||sh.name).r,arm=ar.Torso+(+sh.armor||0),tough=shTB()+fxSum('tough')+arm;
  let sn=null;try{sn=snCalc()}catch(e){}
  let pen=0;try{pen=shPen()}catch(e){}
  return{parry,tough,arm,sn,pen}}catch(e){return null}finally{sh=kS;shId=kI}}
function pgRows(){return (pm.sheets||[]).filter(x=>!x.deleted&&!x.drone&&(pgAll||(x.uid&&x.uid!==uid))).sort((a,b)=>String(a.name).localeCompare(String(b.name)))}
function partyView(){const R=pgRows(),hasAny=(pm.sheets||[]).some(x=>!x.deleted&&!x.drone);
 const row=d=>{const s=pgStats(d)||{parry:'?',tough:'?',arm:0,sn:null,pen:0},wm=shWM(d),w=Math.min(wm,+d.wounds||0),fat=+d.fatigue||0,bn=parseInt(d.bn)||0,bm=parseInt(d.bennies)||0,ht=(typeof htVal==='function')?htVal(d.id,'heat'):0,stt=d.status||[];
  const sn=s.sn?`<span style="color:${s.sn.tot>s.sn.vs*2?'var(--mg)':s.sn.tot>s.sn.vs?'var(--am)':'var(--cy)'}" title="Strain ${s.sn.tot}. Physical limit is Vigor d${s.sn.vs}.">${s.sn.tot} / d${s.sn.vs}</span>`:'<span class="meta">—</span>';
  return `<tr data-pgr="${esc(d.id)}"><td><a class="pgn" data-pgo="${esc(d.id)}" title="Open this character sheet">${portraitOf(d.handle||d.name)?`<img src="/_blob/${esc(portraitOf(d.handle||d.name))}" alt="">`:'<span class="pgi">🧾</span>'}<span><b>${esc(d.name||'(unnamed)')}</b>${d.player?`<br><span class="meta">${esc(d.player)}</span>`:''}</span></a></td>
  <td><span class="pgw">${Array.from({length:wm},(_,i)=>`<i class="wd ${w>=i+1?'on':''}"></i>`).join('')}</span>${d.inc?' <b style="color:var(--red)">INC</b>':''}${fat?' <b>F'+fat+'</b>':''}${s.pen?` <span class="meta">(−${s.pen})</span>`:''}<br><button class="btn sm" data-pgw="${esc(d.id)}|-1" title="Heal one wound">−</button> <button class="btn sm" data-pgw="${esc(d.id)}|1" title="Add one wound">+</button></td>
  <td><b>${s.tough}</b>${s.arm?` <span class="meta">(${s.arm} armor)</span>`:''}</td><td><b>${s.parry}</b></td>
  <td><button class="btn sm" data-pgb="${esc(d.id)}|-1" title="Spend a benny">−</button> <b>${bn}</b>${bm?'<span class="meta"> / '+bm+'</span>':''} <button class="btn sm" data-pgb="${esc(d.id)}|1" title="Add a benny">+</button></td>
  <td>${sn}</td><td>${ht?`<b style="color:${ht>=7?'var(--mg)':ht>=4?'var(--am)':'var(--cy)'}">${ht}</b>`:'<span class="meta">0</span>'}</td><td>${stt.length?cndBadges(stt):'<span class="meta">—</span>'}</td></tr>`};
 const wounded=R.filter(d=>(+d.wounds||0)>0||d.inc).length,bsum=R.reduce((a,d)=>a+(parseInt(d.bn)||0),0);
 $('#view').innerHTML=`<div id="pgroot"><div class="bar"><h2>🧭 PARTY AT A GLANCE</h2><label class="meta" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="pgall" style="width:auto" ${pgAll?'checked':''}> Include my own sheets (NPCs)</label></div>
 <div class="hint" style="margin-bottom:10px">Every runner's key numbers in one place, updating live. Use − and + to change wounds or bennies without opening the sheet. Click a name to open that sheet. Toughness includes worn armor; Parry skips combat toggles; Strain is shown only for characters with cyberware.</div>
 ${R.length?`<div class="meta" style="margin-bottom:6px">${R.length} runner${R.length==1?'':'s'} · ${wounded} hurt · ${bsum} bennies in hand</div><div style="overflow-x:auto"><table class="pgt"><thead><tr><th>Runner</th><th>Wounds</th><th>Toughness</th><th>Parry</th><th>Bennies</th><th>Strain</th><th>Heat</th><th>Conditions</th></tr></thead><tbody>${R.map(row).join('')}</tbody></table></div>`:`<div class="empty">// ${hasAny?'NO PLAYER SHEETS YET. TICK "INCLUDE MY OWN SHEETS" TO SEE EVERY SHEET.':'NO CHARACTER SHEETS YET.'}</div>`}</div>`;
 $('#pgall').onchange=e=>{pgAll=e.target.checked;partyView()};
 $('#view').querySelectorAll('[data-pgo]').forEach(a=>a.onclick=()=>{document.body.classList.remove('menu');board='__sheets';shId=a.dataset.pgo;sh=null;thread=null;query='';if($('#sheetroot'))$('#view').innerHTML='';render()});
 $('#view').querySelectorAll('[data-pgw],[data-pgb]').forEach(b=>b.onclick=async()=>{const w=!!b.dataset.pgw,[id,dl]=(b.dataset.pgw||b.dataset.pgb).split('|'),d=(pm.sheets||[]).find(x=>x.id===id);if(!d)return;
  try{if(w){const wm=shWM(d),v=Math.max(0,Math.min(wm,(+d.wounds||0)+(+dl)));if(v===(+d.wounds||0))return;await db.doc('sheets/'+id).update({wounds:v,edited:Date.now()})}
   else{const v=Math.max(0,(parseInt(d.bn)||0)+(+dl));await db.doc('sheets/'+id).update({bn:String(v),edited:Date.now()})}}
  catch(e){alert('Could not save: '+(e.message||e.code))}})}
{const st=document.createElement('style');st.textContent=`
.red:not(.open) a.ext{color:inherit!important;pointer-events:none;text-decoration:none}
.hcard{position:fixed;z-index:100003;width:300px;max-width:calc(100vw - 16px);background:var(--panel);border:1px solid var(--cy);box-shadow:0 0 16px rgba(0,255,255,.3);padding:10px 12px;font-size:13px}
.hcard .hcr{display:flex;gap:10px;align-items:flex-start}.hcard .hcr img{width:64px;height:64px;object-fit:cover;border:1px solid var(--line);flex:none}
.hcard .hcb{margin-top:6px;overflow-wrap:anywhere}
.pvs{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-width:560px}
.pvimg img,.pvimg video{display:block;max-width:100%;max-height:340px;border:1px solid var(--line);cursor:zoom-in}
.pvc{display:block;border:1px solid var(--line);border-left:3px solid var(--cy);background:rgba(0,0,0,.25);padding:6px 10px;text-decoration:none!important;color:var(--tx);cursor:pointer}
.pvc:hover{border-color:var(--cy)}
.pvc .pvs1{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em}
.pvc .pvt{font-weight:bold;color:var(--cy);overflow-wrap:anywhere}
.pvc .pvd{font-size:12px;color:var(--dim);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.pvv{border-left-color:var(--mg)}.pvp{border-left-color:var(--am)}
.pvf{width:100%;max-width:560px;aspect-ratio:16/9;border:1px solid var(--line);background:#000}
a.ext{word-break:break-all}
.pgt{width:100%;border-collapse:collapse;min-width:760px}.pgt th{text-align:left;font-size:11px;color:var(--dim);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--cy);padding:4px 8px}
.pgt td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.pgn{display:flex;gap:8px;align-items:center;cursor:pointer;color:var(--tx);text-decoration:none}.pgn img{width:36px;height:36px;object-fit:cover;border:1px solid var(--line)}.pgn .pgi{font-size:22px;width:36px;text-align:center}
.pgw{display:inline-flex;gap:3px;vertical-align:middle}.pgw .wd{display:inline-block;width:12px;height:12px;border:1px solid var(--mg);transform:skewX(-12deg)}.pgw .wd.on{background:var(--mg)}`;document.head.appendChild(st)}
setTimeout(()=>{try{pvMarkAll()}catch(e){}},400);

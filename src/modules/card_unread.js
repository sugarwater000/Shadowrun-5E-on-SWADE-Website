// ---- "New" for the card pages (jobs, missions, contacts, map pins, districts, rules, newspaper, Matrix News ...)
// Posts in these sections are already tracked by thread. This adds the cards, which live outside the threads.
const CU_SRC={contacts:()=>[...(pm.contacts||[]),...(pm.favors||[])],'plot-hooks':()=>pm.missions||[],downtime:()=>pm.downtime||[],finds:()=>pm.ledger||[],jobs:()=>pm.jobs||[],
 __map:()=>pm.mappins||[],__dist:()=>pm.districts||[],__gloss:()=>pm.glossary||[],__paper:()=>papers||[],__news:()=>newsAll||[]};
const CU_COLL={contacts:['contacts'],favors:['contacts'],missions:['plot-hooks'],downtime:['downtime'],ledger:['finds'],jobs:['jobs'],mappins:['__map'],districts:['__dist'],glossary:['__gloss'],papers:['__paper'],news:['__news']};
const cuKey=b=>'c:'+b;
const cuStamp=x=>Math.max(+x.ts||0,+x.edited||0,+x.editedAt||0);
const cuTitle=x=>String(x.title||x.name||x.term||x.desc||x.text||x.item||x.who||'(untitled)').replace(/\s+/g,' ').trim().slice(0,60);
function cuNew(b,since){const f=CU_SRC[b];if(!f)return[];if(since==null)since=seen[cuKey(b)];if(since==null)return[];
 return f().filter(x=>x&&!x.deleted&&cuStamp(x)>since&&!(uid&&x.uid===uid&&cuStamp(x)===(+x.ts||0)))}
const cuN=b=>(muteB(b)||!CU_SRC[b])?0:cuNew(b).length;
const cuBoards=()=>Object.keys(CU_SRC).filter(b=>cuN(b)>0);
const cuViewing=b=>!!CU_SRC[b]&&!thread&&!(typeof PMB!=='undefined'&&PMB[b]&&tabm[b]==='thread');
function cuInit(){let ch=false;Object.keys(CU_SRC).forEach(b=>{if(!(cuKey(b) in seen)){seen[cuKey(b)]=Date.now();ch=true}});if(ch)saveSeen()}
let cuCur={b:'',prev:0};
function cuEnter(){const b=board;
 if(!cuViewing(b)){if(cuCur.b&&cuCur.b!==b)cuCur={b:'',prev:0};return}
 const k=cuKey(b);if(cuCur.b!==b)cuCur={b,prev:seen[k]==null?Date.now():seen[k]};
 const top=Math.max(0,...(CU_SRC[b]()||[]).filter(x=>x&&!x.deleted).map(cuStamp));
 if(seen[k]==null||top>seen[k]){seen[k]=Math.max(Date.now(),top);saveSeen()}
 setTimeout(cuBanner,0)}
function cuBanner(){if(!cuCur.b||cuCur.b!==board||thread)return;const v=$('#view');if(!v||v.querySelector('.cunb'))return;
 const it=cuNew(board,cuCur.prev);if(!it.length)return;
 const d=document.createElement('div');d.className='hint cunb';
 const names=it.slice(0,5).map(x=>'<b>'+esc(cuTitle(x))+'</b>').join(', ')+(it.length>5?' and '+(it.length-5)+' more':'');
 d.innerHTML='🆕 '+it.length+' new or changed since your last visit: '+names+'.';v.insertBefore(d,v.firstChild)}
function cuMine(path){const c=String(path||'').split('/')[0],bs=CU_COLL[c];if(!bs)return;let ch=false;
 bs.forEach(b=>{if(cuKey(b) in seen){seen[cuKey(b)]=Math.max(seen[cuKey(b)]||0,Date.now());ch=true}});if(ch){saveSeen();try{nav()}catch(e){}}}
function cuHook(){if(!db||db.__cu)return;const od=db.doc.bind(db),oc=db.collection.bind(db);
 const wd=d=>{['update','set','delete'].forEach(m=>{const f=d[m];if(typeof f==='function')d[m]=async function(...a){const r=await f.apply(this,a);try{cuMine(d.path)}catch(e){}return r}});return d};
 const wc=c=>{const f=c.add,g=c.doc;if(typeof f==='function')c.add=async function(...a){const r=await f.apply(this,a);try{cuMine(c.path)}catch(e){}return r};if(typeof g==='function')c.doc=function(id){return wd(g.call(c,id))};return c};
 db.doc=p=>wd(od(p));db.collection=p=>wc(oc(p));db.__cu=1}
function unreadView(){const cb=cuBoards(),ut=allThreads().filter(isNew).filter(a=>!muteB(a[0].board)).sort((a,b)=>b[b.length-1].ts-a[a.length-1].ts);
 const cardRows=cb.map(b=>{const B=allBoards().find(x=>x.id===b)||{name:b},it=cuNew(b);
  return `<a class="row" data-cub="${esc(b)}"><div class="t"><span class="tag" style="color:#000;background:var(--mg)">${it.length} NEW</span> ${B.ico?esc(B.ico)+' ':''}${esc(String(B.name||b).replace(/^\S*\s(?=[A-Z])/u,m=>/[^\x00-\x7F]/.test(m)?'':m))}</div><div class="meta">${it.slice(0,5).map(x=>esc(cuTitle(x))).join(' · ')}${it.length>5?' · and '+(it.length-5)+' more':''}</div></a>`}).join('');
 $('#view').innerHTML=`<div class="bar"><h2>UNREAD</h2><button class="btn sm" id="mar">Mark all read</button></div><div class="hint" style="margin-bottom:10px">Threads with posts you haven't opened yet, and pages with new or changed cards (jobs, contacts, map pins and so on). Read status is private to you and syncs across your devices.</div>`+
  (ut.length||cb.length?(ut.length?rowsHtml(ut):'')+(cb.length?`<div class="meta" style="margin:12px 0 6px">NEW OR CHANGED CARDS</div>`+cardRows:''):'<div class="empty">// ALL CAUGHT UP.</div>');bindRows();
 $('#view').querySelectorAll('[data-cub]').forEach(a=>a.onclick=()=>{board=a.dataset.cub;thread=null;render()});
 $('#mar').onclick=()=>{allThreads().forEach(markRead);Object.keys(CU_SRC).forEach(b=>{seen[cuKey(b)]=Math.max(Date.now(),...(CU_SRC[b]()||[]).map(cuStamp))});saveSeen();render()}}
{const st=document.createElement('style');st.textContent=`.cunb{border:1px solid var(--mg);color:var(--tx);padding:6px 10px;margin:0 0 10px}`;document.head.appendChild(st)}

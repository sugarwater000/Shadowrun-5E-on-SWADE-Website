// ---- Better search: one box for posts, cards, sheets, people, places, factions, rules, handouts, news, gear and clues
// Type chips with counts, best-match sorting, "quoted phrases", -exclude, by: in: type: shortcuts, highlights everywhere.
const SQ={t:'all',s:'rel',lim:{}};
const SX_T=[['posts','Posts','💬'],['cards','Jobs and cards','📋'],['sheets','Sheets','🧾'],['people','People','👥'],['places','Places','📍'],['factions','Factions','🏢'],['clues','Clues','🕵'],['table','Tabletop','🗺'],['rules','Rules and slang','📖'],['handouts','Handouts','🗂'],['news','News','📰'],['gear','Gear','🛒'],['other','Other','📅']];
const sxVis=s=>!!s&&!s.deleted&&!(s.hidden&&!isOwner&&s.uid!==uid);
function sxParse(q){const ph=[],not=[],must=[],o={type:'',by:'',inb:''};
 let rest=String(q||'').replace(/"([^"]+)"/g,(m,a)=>{const t=a.toLowerCase().trim();if(t)ph.push(t);return ' '});
 rest.split(/\s+/).filter(Boolean).forEach(w=>{const m=w.match(/^(by|from|in|type):(.+)$/i);
  if(m){const k=m[1].toLowerCase(),v=m[2].toLowerCase();if(k==='type')o.type=v;else if(k==='in')o.inb=v;else o.by=v;return}
  if(w[0]==='-'&&w.length>1)not.push(w.slice(1).toLowerCase());else must.push(w.toLowerCase())});
 return {must,ph,not,...o,hl:[...must,...ph.flatMap(p=>p.split(/\s+/))].filter(w=>w.length>1).join(' '),has:!!(must.length||ph.length||o.by||o.inb||o.type)}}
const SX_SKIP=new Set(['id','by','uid','ts','imgs','img','edited','editedAt','delAt','delBy','deleted','side','hide','log','pdf','fname','blob','col','color','kind','x','y','sold','lk','at','sk','favs','loadouts','status2']);
const sxLabel=(coll,k)=>{const S=PMK[coll];const f=S&&S.f.find(z=>z.k===k);return f?f.l.replace(/\s*\(.*$/,''):k.charAt(0).toUpperCase()+k.slice(1)};
function sxGen(coll,x){const o=[];Object.keys(x).forEach(k=>{if(SX_SKIP.has(k))return;let v=x[k];if(Array.isArray(v))v=v.filter(z=>typeof z==='string').join(', ');if(typeof v==='number')v=String(v);if(typeof v!=='string'||!v||v.length>3000)return;if(/^[0-9a-f]{20,}$/i.test(v))return;o.push([sxLabel(coll,k),v])});return o}
function sxItems(){const A=[],live=k=>(pm[k]||[]).filter(x=>x&&!x.deleted);
 const add=(type,ico,title,f,go,ts)=>A.push({type,ico,title:String(title||'').trim()||'(untitled)',f:f.filter(z=>z[1]),go,ts:+ts||0});
 live('sheets').filter(sxVis).forEach(x=>{const sk=[];for(const g in (x.sk||{}))(x.sk[g]||[]).forEach(s=>{if(s.n&&+s.d>0)sk.push(s.n)});
  add('sheets','🧾',x.name,[['Handle',x.handle&&x.handle!==x.name?x.handle:''],['Player',x.player],['Concept',x.concept],['Edges',[x.edges,...(x.edgeList||[]).map(e=>e.n+(e.opt?' ('+e.opt+')':''))].filter(Boolean).join(', ')],['Hindrances',[x.hind,...(x.hindList||[]).map(e=>e.n+(e.opt?' ('+e.opt+')':''))].filter(Boolean).join(', ')],['Skills',sk.join(', ')],['Weapons',(x.weapons||[]).map(w=>w.n).filter(Boolean).join(', ')],['Powers',(x.powers||[]).map(w=>w.n).filter(Boolean).join(', ')],['Notes',x.notes],['Wish list',x.wl]],'sh|'+x.id,x.ts)});
 (npcs||[]).forEach(x=>{if(x.name)add('people','🎭',x.name,[['Affiliation',x.aff],['About',x.desc],['Signature',x.sig]],'npc|'+x.name,0)});
 Object.values(profs||{}).forEach(x=>{if(x&&x.name&&!(npcs||[]).some(n=>n.name===x.name))add('people','👤',x.name,[['Affiliation',x.aff],['Role',x.role],['About',x.bio]],'npc|'+x.name,0)});
 live('contacts').forEach(x=>add('people','📇',x.name,sxGen('contacts',x),'card|contacts',x.edited||x.ts));
 live('favors').forEach(x=>add('cards','🤝',(x.cname||'Favor')+' favor',[['What',x.desc],['Who',(x.who||[]).join(', ')],['Size',x.size],['Direction',x.dir==='theyOwe'?'they owe us':'we owe them']],'card|contacts',x.ts));
 [['jobs','💼','title'],['missions','🎯','title'],['downtime','🛠','title'],['ledger','💰','desc']].forEach(([k,ico,tk])=>live(k).forEach(x=>add('cards',ico,x[tk]||x.title||x.desc,sxGen(k,x),'card|'+({jobs:'jobs',missions:'plot-hooks',downtime:'downtime',ledger:'finds'})[k],x.edited||x.ts)));
 live('districts').forEach(x=>add('places','🏙',x.name,[['Tag',x.tag],['About',x.desc],['Places',x.places],['Rumors',x.rumors],['Controlled by',x.ctrl]],'ds|'+x.id,x.edited||x.ts));
 live('mappins').forEach(x=>add('places','📍',x.title,[['Kind',x.kind],['Notes',x.note]],'pin|'+x.id,x.edited||x.ts));
 live('heat').filter(x=>x.kind==='fac').forEach(x=>add('factions','🏢',x.name,[['Type',x.ftype],['Tag',x.tag],['What we know',x.desc],['Wants',x.wants],['Holdings',x.hold],['Key people',x.people],['Note',x.note]].concat(isOwner?[['GM secret',x.secret]]:[]),'fac|'+x.id,0));
 live('handouts').forEach(x=>add('handouts','🗂',x.title,[['About',x.desc],['File',x.fname]],'vault|'+x.id,x.ts));
 (typeof glAll==='function'?glAll():[]).forEach(x=>add('rules','📖',x.term,[['Also',x.aka],['Meaning',x.def],['Kind',x.kind]],'gl|'+x.term,0));
 (papers||[]).filter(x=>!x.deleted).forEach(x=>add('news','📰',x.title||'Newspaper edition',sxGen('papers',x),'paper|'+x.id,x.edited||x.ts));
 (newsAll||[]).filter(x=>!x.deleted).forEach(x=>add('news','📡',x.title,[['Story',x.body],['Source',x.src]],'news|'+x.id,x.edited||x.ts));
 live('inventory').forEach(x=>{const sh=live('sheets').find(s=>s.name===x.owner);add('gear','🎒',x.name,[['Owner',x.owner],['Category',x.cat],['Note',x.note],['Info',x.info]],sh?'sh|'+sh.id:'gear|-1',x.ts)});
 (typeof CATALOG!=='undefined'?CATALOG:[]).forEach((x,i)=>add('gear','🛒',x.n,[['Category',[x.c,x.s].filter(Boolean).join(' · ')],['Details',x.d],['Price',x.p!=null?yen(x.p):'']],'gear|'+i,0));
 live('events').forEach(x=>add('other','📅',x.title,[['Date',x.date],['Notes',x.note]],'ev|'+x.id,x.ts));
 live('clues').filter(x=>isOwner||!x.gm).forEach(x=>add('clues','🕵',x.title,[['Kind',x.kind],['Notes',x.text],['Tags',(x.tags||[]).map(t=>{const c=CB_T.find(z=>z[0]===t);return c?c[1]:t}).join(', ')],['Date',x.dt]],'clue|'+x.id,x.edited||x.ts));
 try{const tm=isOwner?tbMaps():[tbActive()].filter(Boolean),ok=new Set(tm.map(m=>m.id));
  tm.forEach(m=>add('table','🗺',m.name||'Map',[['Kind','Tabletop map']],'tbj|'+m.id+':'+Math.round((+m.w||0)/2)+':'+Math.round((+m.h||0)/2)+':',m.ts));
  live('tbmeta').filter(x=>x.kind==='note'&&ok.has(x.map)&&(isOwner||x.shown)&&(x.title||x.text)).forEach(x=>add('table','📌',x.title||'Map note',[['Note',x.text],['Map',(tm.find(m=>m.id===x.map)||{}).name]],'tbj|'+x.map+':'+Math.round(+x.x||0)+':'+Math.round(+x.y||0)+':',x.ts))}catch(e){}
 if(typeof hqOn==='function'&&hqOn())hqStash().forEach(x=>add('other','🏠',x.name,[['Category',x.cat],['Note',x.note]],'safe|'+x.id,x.ts));
 return A}
function sxHit(P,it){const h=(it.title+' \n '+it.f.map(z=>z[1]).join(' \n ')).toLowerCase();return P.must.every(w=>h.includes(w))&&P.ph.every(w=>h.includes(w))&&!P.not.some(w=>h.includes(w))}
function sxScore(P,it){let s=0;const t=String(it.title||'').toLowerCase(),ws=[...P.must,...P.ph];ws.forEach(w=>{if(t===w)s+=12;else if(t.startsWith(w))s+=8;else if(t.includes(w))s+=5;it.f.forEach(z=>{if(String(z[1]||'').toLowerCase().includes(w))s+=1})});return s+(it.ts?it.ts/Date.now():0)}
function sxSnip(P,it){const ws=[...P.must,...P.ph];let pick=null;if(ws.length){pick=it.f.find(z=>ws.some(w=>String(z[1]).toLowerCase().includes(w)))}if(!pick)pick=it.f[0];if(!pick)return '';
 const t=String(pick[1]).replace(/\s+/g,' '),lo=t.toLowerCase(),w=ws.find(w=>lo.includes(w)),m=w?lo.indexOf(w):0,a=Math.max(0,m-45);return pick[0]+': '+(a?'… ':'')+t.slice(a,a+160)+(t.length>a+160?' …':'')}
function sxPosts(P){let ps=posts.slice();const lo=s=>String(s||'').toLowerCase();
 if(P.by)ps=ps.filter(p=>lo(p.handle).includes(P.by));
 if(P.inb)ps=ps.filter(p=>{const b=allBoards().find(x=>x.id===p.board)||{};return lo(b.name).includes(P.inb)||lo(p.board).includes(P.inb)});
 ps=ps.filter(p=>{const h=lo([p.title,p.body,p.handle,p.to,p.aff,(p.tags||[]).join(' ')].join(' \n '));return P.must.every(w=>h.includes(w))&&P.ph.every(w=>h.includes(w))&&!P.not.some(w=>h.includes(w))});
 if(sf.board)ps=ps.filter(p=>p.board===sf.board);if(sf.h)ps=ps.filter(p=>p.handle===sf.h);
 const kf=igtKey(sf.from),kt=igtKey(sf.to);if(kf!=null)ps=ps.filter(p=>{const k=igtKey(p.igt);return k!=null&&k>=kf});if(kt!=null)ps=ps.filter(p=>{const k=igtKey(p.igt);return k!=null&&k<=kt+1439});
 const ws=[...P.must,...P.ph];
 if(SQ.s==='new')ps.sort((a,b)=>b.ts-a.ts);else if(SQ.s==='old')ps.sort((a,b)=>a.ts-b.ts);
 else{const sc=p=>{let s=0;const t=lo(p.title),b=lo(p.body),h=lo(p.handle);ws.forEach(w=>{if(t.includes(w))s+=(p.op?5:2);if(h===w)s+=3;let i=0,n=0;while((i=b.indexOf(w,i))>=0&&n<5){n++;i+=w.length}s+=n});return s+p.ts/Date.now()};const m=new Map(ps.map(p=>[p,sc(p)]));ps.sort((a,b)=>m.get(b)-m.get(a))}
 return ps}
const sxFiltered=()=>!!(sf.board||sf.h||igtKey(sf.from)!=null||igtKey(sf.to)!=null);
function sxRowHtml(P,it){return `<a class="row" data-sx="${esc(it.go)}"><div class="t">${it.ico} ${hlt(it.title,P.hl)} <span class="tag aff">${esc((SX_T.find(z=>z[0]===it.type)||[])[1]||it.type)}</span></div>${sxSnip(P,it)?`<div class="meta">${hlt(sxSnip(P,it),P.hl)}</div>`:''}</a>`}
function sxPostHtml(P,p){const op=posts.find(x=>x.thread===p.thread&&x.op)||p,plain=t=>String(t||'').replace(/\s+/g,' '),t=plain(p.body),lo=t.toLowerCase(),w=[...P.must,...P.ph].find(w=>lo.includes(w)),m=w?lo.indexOf(w):0,a=Math.max(0,m-50),sn=(a?'… ':'')+t.slice(a,a+170)+(t.length>a+170?' …':'');
 return `<a class="row ${p.to?'dm':''}" data-sp="${p.id}"><div class="t">${p.to?'<span class="tag">PRIVATE</span>':''}${op.title?'<b>'+hlt(op.title,P.hl)+'</b> ':''}<span style="color:${cl(p.col)}">${hlt(p.handle,P.hl)}</span> <span class="meta">${esc((allBoards().find(b=>b.id===p.board)||{}).name||'')} · [${esc(igtFmt(p.igt))}] · 🕒 ${esc(irl(p.ts))}</span></div><div style="margin-top:3px">${hlt(sn,P.hl)}</div></a>`}
function sxGo(go){const i=go.indexOf('|'),t=go.slice(0,i),v=go.slice(i+1);
 if(['sh','npc','ds','safe','gl','fac','pin','vault','ev','gear'].includes(t))return gsGo(go);
 query='';if($('#q'))$('#q').value='';thread=null;dirH=null;document.body.classList.remove('menu');
 if(t==='tbj'){const a=v.split(':');return tbJumpTo(a[0],a[1],a[2],a[3],'🔍 Found by search')}if(t==='card'){board=v;tabm[v]='cards'}else if(t==='paper'){board='__paper'}else if(t==='news'){board='__news'}else if(t==='clue'){board='__clues';try{cbFocus=v}catch(e){}}
 render()}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-sx]');if(a)sxGo(a.dataset.sx)});
let sxRecent=(()=>{try{return JSON.parse(localStorage.getItem('sr_srch')||'[]')}catch(e){return []}})();
function sxRemember(q){q=String(q||'').trim();if(q.length<2)return;sxRecent=[q,...sxRecent.filter(z=>z!==q)].slice(0,6);try{localStorage.setItem('sr_srch',JSON.stringify(sxRecent))}catch(e){}}
function searchView(){let q=query;const P=sxParse(q);let tmr=window.__sxT;clearTimeout(tmr);window.__sxT=setTimeout(()=>sxRemember(query),1500);
 const filt=sxFiltered(),all=P.has||filt?sxItems().filter(it=>sxHit(P,it)&&(!P.type||it.type.startsWith(P.type)||(SX_T.find(z=>z[0]===it.type)||[])[1].toLowerCase().startsWith(P.type))&&!(P.by||P.inb)):[];
 const ps=(!P.type||'posts'.startsWith(P.type))?sxPosts(P):[];
 const items=filt?[]:all;
 const cnt={posts:ps.length};items.forEach(it=>{cnt[it.type]=(cnt[it.type]||0)+1});
 const total=ps.length+items.length,types=SX_T.filter(z=>cnt[z[0]]);
 if(SQ.t!=='all'&&!cnt[SQ.t])SQ.t='all';
 const hs=[...new Set(posts.map(p=>p.handle))].sort(),bs=allBoards().filter(b=>!b.hidden&&!b.id.startsWith('__'));
 const chip=(k,l,n)=>`<span class="chip ${SQ.t===k?'on':''}" data-sxt="${k}">${l} <b>${n}</b></span>`;
 const show=(k,arr,fn)=>{const lim=SQ.lim[k]||(SQ.t==='all'?5:30),a=arr.slice(0,lim);return a.map(fn).join('')+(arr.length>lim?`<div style="margin:2px 0 8px"><button class="btn sm" data-sxm="${k}">Show ${Math.min(25,arr.length-lim)} more (${arr.length-lim} left)</button></div>`:'')};
 let body='';
 if(!total)body=`<div class="empty">// NOTHING FOUND FOR "${esc(q)}".</div><div class="hint">Try fewer or shorter words${filt?', or clear the board, person and date filters':''}. Words are matched anywhere in a title or its details. Quote an exact phrase, or put a minus in front of a word to leave it out.</div>`;
 else{const groups=SQ.t==='all'?SX_T.filter(z=>cnt[z[0]]):SX_T.filter(z=>z[0]===SQ.t);
  groups.forEach(([k,l,ico])=>{const arr=k==='posts'?ps:items.filter(it=>it.type===k).map(it=>({it,s:sxScore(P,it)})).sort((a,b)=>b.s-a.s).map(z=>z.it);
   body+=`<div class="meta" style="margin:12px 0 4px">${ico} ${esc(l.toUpperCase())} <span>(${arr.length})</span></div>`+(k==='posts'?show(k,arr,p=>sxPostHtml(P,p)):show(k,arr,it=>sxRowHtml(P,it)))})}
 $('#view').innerHTML=`<div class="bar"><h2>SEARCH: ${esc(q)}</h2></div>
 <div style="margin-bottom:8px"><span class="chip ${SQ.t==='all'?'on':''}" data-sxt="all">All <b>${total}</b></span> ${types.map(z=>chip(z[0],z[2]+' '+z[1],cnt[z[0]])).join(' ')}</div>
 <div class="two"><div><label>BOARD <span class="meta">(posts)</span></label><select data-sf="board"><option value="">All boards</option>${bs.map(b=>`<option value="${esc(b.id)}" ${sf.board===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select></div><div><label>PERSON <span class="meta">(posts)</span></label><select data-sf="h"><option value="">Anyone</option>${hs.map(h=>`<option ${sf.h===h?'selected':''}>${esc(h)}</option>`).join('')}</select></div></div>
 <div class="two"><div><label>IN-GAME DATE FROM</label><input data-sf="from" value="${esc(sf.from)}" placeholder="3/1/2077"></div><div><label>TO</label><input data-sf="to" value="${esc(sf.to)}" placeholder="3/31/2077"></div></div>
 <div style="margin:8px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="meta">${total} result${total==1?'':'s'}${filt?' (filters on: showing posts only)':''}</span><span><label style="display:inline;margin:0">SORT POSTS</label> <select id="sxs" style="width:auto"><option value="rel" ${SQ.s==='rel'?'selected':''}>Best match</option><option value="new" ${SQ.s==='new'?'selected':''}>Newest first</option><option value="old" ${SQ.s==='old'?'selected':''}>Oldest first</option></select></span>${filt?'<button class="btn sm" id="sxclr">Clear filters</button>':''}</div>
 <div class="hint" style="margin-bottom:6px">Tips: <b>"exact phrase"</b> · <b>-word</b> leaves a word out · <b>by:Name</b> posts by someone · <b>in:board</b> · <b>type:sheets</b> (or jobs, places, rules, news, gear, clues). Press <b>/</b> anywhere to search.</div>`+body;
 document.querySelectorAll('[data-sxt]').forEach(c=>c.onclick=()=>{SQ.t=c.dataset.sxt;SQ.lim={};render()});
 document.querySelectorAll('[data-sxm]').forEach(b=>b.onclick=()=>{const k=b.dataset.sxm;SQ.lim[k]=(SQ.lim[k]||(SQ.t==='all'?5:30))+25;render()});
 const ss=$('#sxs');if(ss)ss.onchange=()=>{SQ.s=ss.value;render()};const cl2=$('#sxclr');if(cl2)cl2.onclick=()=>{sf.board='';sf.h='';sf.from='';sf.to='';render()};
 document.querySelectorAll('[data-sf]').forEach(el=>el.onchange=()=>{sf[el.dataset.sf]=el.value.trim();render()});
 document.querySelectorAll('[data-sp]').forEach(a=>a.onclick=()=>{focusPost=a.dataset.sp;const p=allPosts.find(x=>x.id===focusPost);if(p)openThread(p.thread)})}

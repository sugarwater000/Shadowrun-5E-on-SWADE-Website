/* ================= GLOBAL SEARCH ================= */
function gsHay(a){return a.filter(Boolean).join(' ').toLowerCase()}
function gsFind(ws){
 const hit=a=>{const h=gsHay(a);return ws.every(w=>h.includes(w))},live=k=>(pm[k]||[]).filter(x=>!x.deleted),G=[];
 const add=(ico,grp,go,title,sub)=>G.push({ico,grp,go,title,sub:sub||''});
 live('sheets').forEach(x=>{if(hit([x.name,x.handle,x.player,x.concept,x.fsin]))add('🧾','Character sheets','sh|'+x.id,x.name,[x.handle&&x.handle!==x.name?'('+x.handle+')':'',x.player,x.concept].filter(Boolean).join(' · '))});
 (npcs||[]).forEach(x=>{if(x.name&&hit([x.name,x.aff,x.desc,x.sig]))add('🎭','NPC handles','npc|'+x.name,x.name,[x.aff,x.desc].filter(Boolean).join(' · ').slice(0,120))});
 live('districts').forEach(x=>{if(hit([x.name,x.tag,x.desc,x.places,x.rumors,x.ctrl]))add('🏙','Seattle districts','ds|'+x.id,x.name,[x.sec?'Security '+x.sec:'',x.tag].filter(Boolean).join(' · '))});
 live('heat').filter(x=>x.kind==='fac').forEach(x=>{if(hit([x.name,x.tag,x.desc,x.wants,x.hold,x.people,x.ftype]))add('🏢','Factions and corps','fac|'+x.id,x.name,[x.ftype,x.tag].filter(Boolean).join(' · '))});
 live('mappins').forEach(x=>{if(hit([x.title,x.note,x.kind]))add('📍','Map pins','pin|'+x.id,x.title,[x.kind,x.sec?'Security '+x.sec:'',String(x.note||'').slice(0,100)].filter(Boolean).join(' · '))});
 live('handouts').forEach(x=>{if(hit([x.title,x.desc,x.fname]))add('🗂','Handouts','vault|'+x.id,x.title,String(x.desc||'').slice(0,100))});
 live('events').forEach(x=>{if(hit([x.title,x.note,x.date]))add('📅','Calendar events','ev|'+x.id,x.title,[x.date,String(x.note||'').slice(0,100)].filter(Boolean).join(' · '))});
 if(typeof hqOn==='function'&&hqOn())hqStash().forEach(x=>{if(hit([x.name,x.cat,x.note]))add('🏠','Safe house stash','safe|'+x.id,x.name,'× '+x.qty+(x.note?' · '+String(x.note).slice(0,80):''))});
 if(typeof glAll==='function')glAll().forEach(x=>{if(hit([x.term,x.aka,x.def]))add('📖','Rules and slang','gl|'+x.term,x.term,String(x.def).slice(0,110))});
 CATALOG.forEach((x,i)=>{if(hit([x.n,x.c,x.s,x.d]))add('🛒','Gear and catalog','gear|'+i,x.n,[x.c,x.s,x.cu?'CUSTOM':'',x.p!=null?yen(x.p):''].filter(Boolean).join(' · '))});
 return G}
function gsHtml(ws,q){
 if(!ws.length||sf.board||sf.h||sf.from||sf.to)return '';
 const G=gsFind(ws);if(!G.length)return '';
 const groups=[];G.forEach(g=>{let o=groups.find(z=>z.n===g.grp);if(!o)groups.push(o={n:g.grp,a:[]});o.a.push(g)});
 return `<h2 style="font-size:14px;margin:12px 0 6px">ELSEWHERE ON THE GRID <span class="meta">(${G.length})</span></h2>`+groups.map(o=>`<div class="meta" style="margin:8px 0 2px">${esc(o.n.toUpperCase())}</div>`+o.a.slice(0,8).map(g=>`<a class="row" data-gs="${esc(g.go)}"><div class="t">${g.ico} ${hlt(g.title||'(untitled)',q)}</div>${g.sub?`<div class="meta">${hlt(g.sub,q)}</div>`:''}</a>`).join('')+(o.a.length>8?`<div class="meta" style="margin:2px 0 6px">and ${o.a.length-8} more. Narrow the search to see them.</div>`:'')).join('')}
function gsGo(go){
 const i=go.indexOf('|'),t=go.slice(0,i),v=go.slice(i+1);
 query='';if($('#q'))$('#q').value='';thread=null;tabm={};dirH=null;document.body.classList.remove('menu');
 if(t==='sh'){if(typeof shDirty!=='undefined'&&shDirty.size)shSave();board='__sheets';shId=v;sh=null;if($('#sheetroot'))$('#view').innerHTML=''}
 else if(t==='npc'){board='__dir';dirH=v}
 else if(t==='ds'){board='__dist';render();return dsCard(v)}
 else if(t==='safe'){board='__safe';hqQ=''}
 else if(t==='gl'){board='__gloss';glQ=v;glK=''}
 else if(t==='fac'){board='__heat'}
 else if(t==='pin'){board='__map';mapFocus=v}
 else if(t==='vault'){board='__vault'}
 else if(t==='ev'){const e=(pm.events||[]).find(z=>z.id===v),q=e&&igtParts(e.date);if(q)cal={y:q.y,m:q.mo};board='__cal'}
 else if(t==='gear'){const it=CATALOG[+v];shopS={...shopS,tab:'cat',q:it?it.n:'',cat:'',sub:''};board='__shop';if($('#shoproot'))$('#view').innerHTML=''}
 render()}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-gs]');if(a)gsGo(a.dataset.gs)});
document.addEventListener('keydown',e=>{if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey)return;const a=document.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;if($('#modal')&&$('#modal').innerHTML.trim())return;e.preventDefault();qsOpen()});

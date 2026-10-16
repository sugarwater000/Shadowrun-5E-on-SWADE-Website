// ---- sheet change history and print view
let shBase=null,shHPend=[],hsN=0;
const HS_SKIP=/^(edited|hist|_id|ts|timers|cr|strainAdj|veh|actVeh|pack)$|\.(ammo|spare)$/;
const hsClone=v=>JSON.parse(JSON.stringify(v===undefined?null:v));
function hsSnap(){try{shBase=sh&&shId?{id:shId,doc:hsClone(sh)}:null}catch(e){shBase=null}}
const hsT=s=>String(s).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
function hsLabel(p){const a=p.split('.');
 if(a[0]==='at'&&a[1])return hsT(a[1])+(a[2]==='d'?' die':a[2]==='m'?' bonus':'');
 if(a[0]==='sk'&&a.length>=3){const x=((sh&&sh.sk&&sh.sk[a[1]])||[])[+a[2]];return ((x&&x.n)||'Skill')+({d:' die',m:' bonus',n:' (name)'}[a[3]]||'')}
 if(a[0]==='sk'&&a.length===2)return 'Skills ('+hsT(a[1])+')';
 if(a[0]==='weapons'&&a.length>=3){const w=((sh&&sh.weapons)||[])[+a[1]];return ((w&&w.n)||'Weapon')+' '+({n:'name',rng:'range',rof:'RoF',dmg:'damage',ap:'AP',sk:'skill',ms:'Min Str',mag:'magazine size'}[a[2]]||a[2])}
 if(a[0]==='fsin')return 'F.SIN';
 if(a[0]==='edgeList')return 'Edges';if(a[0]==='hindList')return 'Hindrances';if(a[0]==='adv'&&a[1])return 'Advance '+(+a[1]+1);
 return hsT(a.join(' '))}
const hsNm=x=>x&&typeof x==='object'?(x.n||x.name||x.k||x.title||'item'):String(x);
function hsMake(p,o,n){const e={id:Date.now().toString(36)+(hsN++).toString(36)+(uid||'').length.toString(36),t:Date.now(),b:handle||'?',p,l:hsLabel(p)};
 const sc=v=>(typeof v==='number'||typeof v==='boolean'||(typeof v==='string'&&v.length<=200));
 if(sc(o)&&sc(n)){e.o=o;e.n=n;return e}
 if(Array.isArray(o)&&Array.isArray(n)){const so=new Set(o.map(x=>JSON.stringify(x))),sn=new Set(n.map(x=>JSON.stringify(x))),ad=n.filter(x=>!so.has(JSON.stringify(x))).map(hsNm),rm=o.filter(x=>!sn.has(JSON.stringify(x))).map(hsNm);
  e.s=(ad.length?'added '+ad.slice(0,4).join(', ')+(ad.length>4?'...':''):'')+(ad.length&&rm.length?'; ':'')+(rm.length?'removed '+rm.slice(0,4).join(', ')+(rm.length>4?'...':''):'')||'changed';return e}
 e.s=typeof n==='string'||typeof o==='string'?'text edited':'changed';return e}
function hsDiff(o,n,p,out){if(o===undefined||HS_SKIP.test(p))return;if(JSON.stringify(o)===JSON.stringify(n))return;
 const isO=v=>v&&typeof v==='object'&&!Array.isArray(v);
 if(isO(o)&&isO(n)){new Set([...Object.keys(o),...Object.keys(n)]).forEach(k=>hsDiff(o[k],n[k],p+'.'+k,out));return}
 if(Array.isArray(o)&&Array.isArray(n)&&o.length===n.length&&n.every(v=>v===null||typeof v!=='object'||isO(v))){n.forEach((v,i)=>hsDiff(o[i],v,p+'.'+i,out));return}
 out.push(hsMake(p,o,n))}
// called from shSave with the keys being saved; returns the new history list to store, or null
function hsEntries(d){try{const id=shId,doc=(pm.sheets||[]).find(x=>x.id===id);if(!doc||!sh)return null;
 const base=(shBase&&shBase.id===id)?shBase.doc:doc,out=[];
 Object.keys(d).forEach(k=>{if(!HS_SKIP.test(k))hsDiff(base[k],d[k],k,out)});
 if(!shBase||shBase.id!==id)shBase={id,doc:hsClone(doc)};Object.keys(d).forEach(k=>{shBase.doc[k]=hsClone(d[k])});
 if(!out.length)return null;
 const have=new Set((doc.hist||[]).map(e=>e.id)),cur=(doc.hist||[]).concat(shHPend.filter(e=>!have.has(e.id)));
 out.slice(0,14).forEach(e=>{const j=cur.map((c,i)=>({c,i})).reverse().find(z=>z.c.p===e.p&&z.c.b===e.b&&('o' in z.c)&&('o' in e)&&e.t-z.c.t<120000);
  if(j){j.c.n=e.n;j.c.t=e.t;if(JSON.stringify(j.c.o)===JSON.stringify(j.c.n))cur.splice(j.i,1)}else cur.push(e)});
 const L=cur.slice(-60);shHPend=L.slice(-12);return L}catch(e){return null}}
const hsFmt=v=>v===''||v==null?'(empty)':typeof v==='boolean'?(v?'on':'off'):String(v);
const hsAgo=t=>{const s=Math.max(0,(Date.now()-t)/1000);return s<60?'just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':new Date(t).toLocaleDateString()+' '+new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})};
function hsList(){const doc=(pm.sheets||[]).find(x=>x.id===shId)||{},have=new Set((doc.hist||[]).map(e=>e.id));return (doc.hist||[]).concat(shHPend.filter(e=>!have.has(e.id))).slice().sort((a,b)=>b.t-a.t)}
function hsModal(){if(!sh)return;const L=hsList(),getv=p=>{try{return p.split('.').reduce((o,k)=>o[k],sh)}catch(e){return undefined}};
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🕘 CHANGE HISTORY: ${esc(sh.name||'')}</h2><div class="hint">The latest changes made to this sheet and who made them. Undo puts the old value back. Rapid edits to the same box are combined, and the last 60 changes are kept. Ammo counts are not logged.</div>
 ${L.length?L.map(e=>{const cv=getv(e.p),can=('o' in e)&&shCan(),chg=('o' in e)&&JSON.stringify(cv)!==JSON.stringify(e.n);
 return `<div class="row" style="display:flex;gap:10px;align-items:center"><span style="flex:1"><b>${esc(e.l)}</b>: ${('o' in e)?esc(hsFmt(e.o))+' → '+esc(hsFmt(e.n)):esc(e.s||'changed')}<div class="meta">${esc(e.b)} · ${esc(hsAgo(e.t))}${chg?' · now '+esc(hsFmt(cv)):''}</div></span>${can?`<button class="btn sm" data-hsu="${esc(e.id)}">Undo</button>`:''}</div>`}).join(''):'<div class="empty">// NO CHANGES RECORDED YET.</div>'}
 <div style="margin-top:12px"><button class="btn mg" id="hscx">Close</button></div></div></div>`;
 $('#hscx').onclick=()=>{$('#modal').innerHTML=''};
 $('#modal').querySelectorAll('[data-hsu]').forEach(b=>b.onclick=async()=>{const e=hsList().find(x=>x.id===b.dataset.hsu);if(!e||!('o' in e))return;
  try{shSet(e.p,e.o)}catch(er){return alert('That value cannot be put back any more.')}await shSave();shBuild();hsModal()})}
// ---- print / save as PDF
function prHtml(){const S=sh,esc2=esc,ro=(k)=>k;const nm=(S.name||'Character'),half=n=>Math.floor((+n||0)/2);
 const d=v=>+v>0?'d'+v:'-',sg=m=>+m?(m>0?'+':'')+m:'';
 const at=SH_AT.map(([k,l])=>`<td><b>${l}</b><br>${S.at&&S.at[k]?d(S.at[k].d):'-'}${S.at&&S.at[k]&&+S.at[k].m?sg(S.at[k].m):''}</td>`).join('');
 const sk=Object.keys(S.sk||{}).flatMap(k=>(S.sk[k]||[]).filter(x=>x.n&&+x.d>0).map(x=>`<tr><td>${esc(x.n)}</td><td>${d(x.d)}${sg(x.m)}</td></tr>`)).join('');
 const tx=id=>{const e=$('#'+id);return e?e.textContent.trim():''};
 const inv=invOf(S.handle||S.name).map(x=>`<tr><td>${esc(x.name)}${x.worn?' (worn)':''}</td><td>${esc(x.qty||1)}</td><td>${esc(x.info||'')}</td></tr>`).join('');
 const wp=(S.weapons||[]).map(w=>`<tr><td>${esc(w.n||'')}</td><td>${esc(w.rng||'')}</td><td>${esc(w.rof||'')}</td><td>${esc(w.dmg||'')}</td><td>${esc(w.ap||'')}</td><td>${esc(w.sk||'Shooting')}</td><td>${(+w.mag>0)?(+w.ammo||0)+'/'+(+w.mag)+(amSpare(w)!==null?' +'+amSpare(w)+' mags':''):''}</td></tr>`).join('');
 const ed=(S.edgeList||[]).map(e=>esc(e.n)+(e.opt?' ('+esc(e.opt)+')':'')).join(', '),hd=(S.hindList||[]).map(e=>esc(e.n)+(e.opt?' ('+esc(e.opt)+')':'')).join(', ');
 const pw=(S.powers||[]).map(p=>`<tr><td>${esc(p.n||'')}</td><td>${esc(p.pp||'')}</td><td>${esc(p.rng||'')}</td><td>${esc(p.dur||'')}</td><td>${esc(p.sk||'')}</td></tr>`).join('');
 const dr=S.drone?`<p><b>Drone</b> run by ${esc((drOwnerDoc()||{}).name||'its rigger')}${S.scale!==''&&S.scale!=null?' · Scale '+esc(S.scale):''}</p>`:'';
 return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(nm)}</title><style>
 body{font:12px/1.4 Arial,Helvetica,sans-serif;color:#000;background:#fff;margin:18px}h1{font-size:22px;margin:0}h2{font-size:13px;margin:14px 0 4px;border-bottom:1px solid #000;letter-spacing:.08em}
 table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eee}.at td{text-align:center;font-size:14px}.two{columns:2;column-gap:20px}.two table{break-inside:avoid}.st{display:flex;gap:18px;margin:6px 0}.st div{border:1px solid #000;padding:4px 10px;text-align:center}.st b{display:block;font-size:16px}
 .sub{color:#444}pre{white-space:pre-wrap;font:12px Arial}@page{margin:12mm}</style></head><body>
 <h1>${esc(nm)}</h1><div class="sub">${esc(S.concept||'')}${S.player?' · Player: '+esc(S.player):''}${(S.handle&&S.handle!==nm)?' · Handle: '+esc(S.handle):''}${S.fsin?' · F.SIN: '+esc(S.fsin):''}</div>${dr}
 <div class="st"><div>Pace<b>${esc(S.pace||0)}</b></div><div>Parry<b>${esc(tx('shparry')||'')}</b></div><div>Toughness<b>${esc(tx('shtough')||'')}</b></div>${S.drone?'':`<div>Bennies<b>${esc(S.bn||S.bennies||'')}</b></div>`}<div>Wounds<b>${esc(S.wounds||0)}${S.inc?' (Inc.)':''}</b></div>${S.fatigue?`<div>Fatigue<b>${esc(S.fatigue)}</b></div>`:''}<div>Funds<b>${esc(yen(heldFunds(S.handle||S.name)))}</b></div></div>
 <table class="at"><tr>${at}</tr></table>
 <h2>SKILLS</h2><div class="two"><table>${sk||'<tr><td>No skills trained</td></tr>'}</table></div>
 ${ed?`<h2>EDGES</h2><div>${ed}</div>`:''}${hd?`<h2>HINDRANCES</h2><div>${hd}</div>`:''}
 ${wp?`<h2>WEAPONS</h2><table><tr><th>Weapon</th><th>Range</th><th>RoF</th><th>Damage</th><th>AP</th><th>Skill used</th><th>Ammo</th></tr>${wp}</table>`:''}
 ${pw?`<h2>POWERS</h2><table><tr><th>Power</th><th>PP</th><th>Range</th><th>Duration</th><th>Trapping/Skill</th></tr>${pw}</table>`:''}
 ${inv?`<h2>GEAR</h2><table><tr><th>Item</th><th>Qty</th><th>Details</th></tr>${inv}</table>`:''}
 ${S.notes?`<h2>NOTES</h2><pre>${esc(S.notes)}</pre>`:''}</body></html>`}
function prModal(){if(!sh)return;
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:900px;width:96vw"><h2>🖨 PRINT OR SAVE AS PDF</h2><div class="hint">A clean black-and-white copy of this sheet. Press Print, then choose <b>Save as PDF</b> as the printer to get a file.</div>
 <iframe id="prfr" style="width:100%;height:60vh;background:#fff;border:1px solid var(--line)"></iframe>
 <div style="margin-top:10px"><button class="btn grn" id="prgo">Print / Save as PDF</button> <button class="btn mg" id="prcx">Close</button></div></div></div>`;
 $('#prfr').srcdoc=prHtml();$('#prcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#prgo').onclick=()=>{const f=$('#prfr');try{f.contentWindow.focus();f.contentWindow.print()}catch(e){alert('Printing is blocked in this browser view. Use Ctrl+P instead.')}}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#shhist,#shprint');if(!t||!sh)return;if(t.id==='shhist')hsModal();else prModal()});

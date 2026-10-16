// ---- Clue Board extras: groups, string styles, tags and filters, GM-only notes, pictures, timeline, jump links, print and picture export.
// Loaded after p54_tbextra.js. Notes live in 'clues', strings in 'cluelinks', group frames in 'cbframes'.
const CB_T=[['unv','Unverified','#ffb000'],['ver','Verified','#39ff14'],['rh','Red herring','#9aa7b5'],['res','Resolved','#6ea8ff'],['urg','Urgent','#ff3b3b']];
const CB_LS={'':['String','#c0262d',''],ally:['Ally','#39ff14',''],enemy:['Enemy','#ff7a00','9 6'],suspect:['Suspected','#ffd60a','2 6'],confirmed:['Confirmed','#00f0d0','']};
const CB_FC=['#6ea8ff','#39ff14','#ffb000','#ff3b3b','#c77dff','#00f0d0'];
let cbTF=[],cbTM=tbLS('sr_cbtm','fade')==='hide'?'hide':'fade',cbHR=tbLS('sr_cbhr','0')==='1',cbTL=false,cbFd=null;
const cbTags=n=>Array.isArray(n.tags)?n.tags.filter(k=>CB_T.some(t=>t[0]===k)):[];
const cbLS=l=>CB_LS[l&&l.st]||CB_LS[''];
const cbFrames=()=>(pm.cbframes||[]).filter(f=>f&&!f.deleted&&+f.w>0&&+f.h>0);
function cbBad(n){const t=cbTags(n);return !!((cbTF.length&&!cbTF.some(k=>t.includes(k)))||(cbHR&&t.includes('res')&&!cbTF.includes('res')))}
const cbOff=n=>cbTM==='hide'&&cbBad(n);
const cbDim=n=>cbTM!=='hide'&&cbBad(n);
const cbDateTxt=d=>{if(!d)return '';const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d));return m?(+m[3])+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2]-1]+' '+m[1]:String(d)};
// ---- one note on the board
function cbNodeHtml(n){const k=cbKind(n),q=cbQ.trim().toLowerCase(),dim=(q&&!(String(n.title||'')+' '+String(n.text||'')).toLowerCase().includes(q))||cbDim(n),tg=cbTags(n),im=tbOk(n.img);
 return `<div class="cbn ${cbSS.includes(n.id)?'sel':''} ${cbLink===n.id?'lnk':''}${n.gm?' gm':''}${im?' hasim':''}" data-cbn="${esc(n.id)}" style="left:${+n.x||0}px;top:${+n.y||0}px;--k:${k[2]};${dim?'opacity:.22;':''}${cbOff(n)?'display:none;':''}"><span class="cbp"></span><b>${n.gm?'🔒 ':''}${k[0]} ${esc(n.title||'(untitled)')}</b><span class="cbt">${esc(String(n.text||'').slice(0,90))}</span>${tg.length?`<span class="cbtg">${tg.map(c=>{const t=CB_T.find(z=>z[0]===c);return `<u style="background:${t[2]}" title="${esc(t[1])}"></u>`}).join('')}</span>`:''}${im?`<img class="cbim" src="/_blob/${im}" alt="" draggable="false">`:''}${n.tb?'<i class="cbmp" title="Linked to a map">🗺</i>':''}${n.ref?'<i class="cbr" title="Linked to a page">↗</i>':''}</div>`}
// two quick clicks on a note open it (the board redraws on the first click, so the browser never sends a double-click event)
let cbLC=null;
function cbDbl(d){const t=Date.now();if(cbLink){cbLC=null;return}if(cbLC&&cbLC.id===d.id&&t-cbLC.t<450){cbLC=null;const n=cbNodes().find(z=>z.id===d.id);if(n){if(d.im&&tbOk(n.img))cbLightbox(n);else cbForm(n.kind,n)}return}cbLC={id:d.id,t}}
// ---- group frames
function cbFramesHtml(){return cbFrames().map(f=>{const c=cbFrameMembers(f).length;return `<div class="cbf" data-cbf="${esc(f.id)}" style="left:${+f.x}px;top:${+f.y}px;width:${+f.w}px;height:${+f.h}px;--k:${esc(/^#[0-9a-f]{6}$/i.test(f.col||'')?f.col:CB_FC[0])}"><div class="cbfh" data-cbfh="1"><span>▭ ${esc(f.label||'Group')}</span><span class="cbfc">${c} note${c===1?'':'s'}</span><button type="button" class="cbfe" data-cbfe="1" title="Rename, recolour or delete this group">✎</button></div><i class="cbfr" data-cbfr="1" title="Drag to resize"></i></div>`}).join('')}
function cbFrameMembers(f){return cbNodes().filter(n=>{const cx=(+n.x||0)+CB_W/2,cy=(+n.y||0)+CB_H/2;return cx>=f.x&&cx<=f.x+f.w&&cy>=f.y&&cy<=f.y+f.h})}
function cbFrameDown(e,fEl,v){const fr=fEl.closest('[data-cbf]');if(!fr)return false;const f=cbFrames().find(z=>z.id===fr.dataset.cbf);if(!f)return false;
 if(e.target.closest('[data-cbfe]')){cbFrameForm(f);e.preventDefault();return true}
 const rz=!!e.target.closest('[data-cbfr]');
 cbFd={id:f.id,mode:rz?'rz':'mv',sx:e.clientX,sy:e.clientY,ox:+f.x,oy:+f.y,ow:+f.w,oh:+f.h,mem:rz?[]:cbFrameMembers(f).map(n=>({id:n.id,nx:+n.x||0,ny:+n.y||0,el:v.querySelector('[data-cbn="'+n.id+'"]')})),el:fr,moved:false};
 try{v.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();return true}
function cbFrameMove(e){const D=cbFd;if(!D)return;const dx=(e.clientX-D.sx)/cbV.z,dy=(e.clientY-D.sy)/cbV.z;if(!D.moved&&Math.abs(dx)+Math.abs(dy)<4/cbV.z)return;D.moved=true;
 const f=cbFrames().find(z=>z.id===D.id);if(!f)return;
 if(D.mode==='mv'){const nx=D.mem.map(o=>o.nx),ny=D.mem.map(o=>o.ny);
  const lo=Math.max(-D.ox,...(nx.length?[-Math.min(...nx)]:[])),hi=Math.min(CB_WW-D.ow-D.ox,...(nx.length?[CB_WW-CB_W-Math.max(...nx)]:[])),lo2=Math.max(-D.oy,...(ny.length?[-Math.min(...ny)]:[])),hi2=Math.min(CB_WH-D.oh-D.oy,...(ny.length?[CB_WH-CB_H-Math.max(...ny)]:[]));
  const ddx=Math.max(lo,Math.min(hi,Math.round(dx))),ddy=Math.max(lo2,Math.min(hi2,Math.round(dy)));
  f.x=D.ox+ddx;f.y=D.oy+ddy;D.el.style.left=f.x+'px';D.el.style.top=f.y+'px';
  D.mem.forEach(o=>{o.x=o.nx+ddx;o.y=o.ny+ddy;if(o.el){o.el.style.left=o.x+'px';o.el.style.top=o.y+'px'}const n=(pm.clues||[]).find(z=>z.id===o.id);if(n){n.x=o.x;n.y=o.y}});const s=$('#cbsvg');if(s)s.innerHTML=cbLinesHtml()}
 else{f.w=Math.max(120,Math.min(CB_WW-D.ox,Math.round(D.ow+dx)));f.h=Math.max(90,Math.min(CB_WH-D.oy,Math.round(D.oh+dy)));D.el.style.width=f.w+'px';D.el.style.height=f.h+'px'}}
async function cbFrameUp(){const D=cbFd;cbFd=null;if(!D)return;const f=cbFrames().find(z=>z.id===D.id);if(!f)return cbDraw();if(!D.moved)return;
 const A=D.mode==='mv'?{x:f.x,y:f.y}:{w:f.w,h:f.h},B=D.mode==='mv'?{x:D.ox,y:D.oy}:{w:D.ow,h:D.oh},mem=D.mem.filter(o=>o.x!==o.nx||o.y!==o.ny);
 const run=async k=>{await cbSetDoc('cbframes',f.id,k==='a'?A:B);await Promise.all(mem.map(o=>cbSetDoc('clues',o.id,k==='a'?{x:o.x,y:o.y}:{x:o.nx,y:o.ny})))};
 try{await run('a')}catch(er){alert('Could not save: '+(er.message||er.code));return}
 cbHPush(D.mode==='mv'?'move a group':'resize a group',()=>run('b'),()=>run('a'));cbDraw()}
async function cbFrameNew(){if(!$('#cbroot'))return;const L=cbSelNodes();let x,y,w,h;
 if(L.length){const x0=Math.min(...L.map(n=>+n.x||0)),y0=Math.min(...L.map(n=>+n.y||0)),x1=Math.max(...L.map(n=>(+n.x||0)+CB_W)),y1=Math.max(...L.map(n=>(+n.y||0)+CB_H));x=Math.max(0,x0-24);y=Math.max(0,y0-38);w=Math.min(CB_WW-x,x1-x0+48);h=Math.min(CB_WH-y,y1-y0+62)}
 else{const c=cbCenterWorld();w=420;h=280;x=Math.max(0,Math.min(CB_WW-w,Math.round(c.x-w/2)));y=Math.max(0,Math.min(CB_WH-h,Math.round(c.y-h/2)))}
 const doc={x:Math.round(x),y:Math.round(y),w:Math.round(w),h:Math.round(h),label:'',col:CB_FC[cbFrames().length%CB_FC.length],by:handle||'?',uid:uid||'',ts:Date.now()};
 try{const r=await db.collection('cbframes').add(doc);tbLoc('cbframes',r.id,doc);const id=r.id,set=d=>cbSetDoc('cbframes',id,{deleted:d});cbHPush('add a group',()=>set(true),()=>set(false));cbDraw();cbFrameForm(pm.cbframes.find(z=>z.id===id),true)}catch(e){alert('Could not add the group: '+(e.message||e.code))}}
function cbFrameForm(f,isNew){if(!f)return;let col=f.col||CB_FC[0];
 $('#modal').innerHTML=`<div class="modal"><form id="cbff"><h2>${isNew?'NEW':'EDIT'} GROUP</h2><div class="hint">A labelled box. Drag its title bar to move the box together with every note inside it. Drag the corner to resize it.</div><label>NAME</label><input name="l" maxlength="40" value="${esc(f.label||'')}" placeholder="e.g. The Ares run, Suspects"><label>COLOUR</label><div class="tbsws">${CB_FC.map(c=>`<button type="button" class="tbcc ${c===col?'on':''}" data-cbfc="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
 <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grn" type="submit">Save</button><button type="button" class="btn" id="cx">${isNew?'Keep as is':'Cancel'}</button><button type="button" class="btn mg del" id="cbfd" style="margin-left:auto">Delete group</button></div><div class="meta" style="margin-top:6px">Deleting a group only removes the box. The notes stay.</div></form></div>`;
 $('#cx').onclick=closeM;document.querySelectorAll('[data-cbfc]').forEach(b=>b.onclick=()=>{col=b.dataset.cbfc;document.querySelectorAll('[data-cbfc]').forEach(z=>z.classList.toggle('on',z===b))});
 $('#cbff').onsubmit=async e=>{e.preventDefault();const l=String(new FormData(e.target).get('l')||'').trim().slice(0,40),a={label:l,col},b={label:f.label||'',col:f.col||CB_FC[0]};
  try{await cbSetDoc('cbframes',f.id,a);if(JSON.stringify(a)!==JSON.stringify(b))cbHPush('edit a group',()=>cbSetDoc('cbframes',f.id,b),()=>cbSetDoc('cbframes',f.id,a));closeM();cbDraw()}catch(er){alert('Could not save: '+(er.message||er.code))}};
 $('#cbfd').onclick=async()=>{const set=d=>cbSetDoc('cbframes',f.id,d?{deleted:true,delAt:Date.now()}:{deleted:false});try{await set(true);const op=cbHPush('delete a group',()=>set(false),()=>set(true));closeM();cbDraw();undoBar('Group removed. The notes are still there.',async()=>{cbHDrop(op);await set(false);cbRedo.push(op);cbDraw()})}catch(er){alert('Could not delete: '+(er.message||er.code))}};
 setTimeout(()=>{const i=$('#cbff [name=l]');if(i){i.focus();i.select()}},50)}
// ---- tags and filters
function cbTagBar(){const el=$('#cbtags');if(!el)return;const L=cbSelNodes(),all=k=>L.length&&L.every(n=>cbTags(n).includes(k));
 const h=`<span class="meta">Show only:</span>${CB_T.map(t=>`<button class="cbtc ${cbTF.includes(t[0])?'on':''}" data-cbtf="${t[0]}" style="--k:${t[2]}">${esc(t[1])}</button>`).join('')}<button class="btn sm" data-cbxa="tm" title="What happens to notes that do not match: fade them out, or hide them completely">${cbTM==='hide'?'Hide the others':'Fade the others'}</button><label class="meta" style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" id="cbhr" ${cbHR?'checked':''} style="width:auto"> Hide resolved</label>${cbTF.length?'<button class="btn sm" data-cbxa="tfc">Show all</button>':''}`+
  (L.length?`<span class="meta" style="margin-left:10px">Tag ${L.length===1?'this note':L.length+' notes'}:</span>${CB_T.map(t=>`<button class="cbtc ${all(t[0])?'on':''}" data-cbtg="${t[0]}" style="--k:${t[2]}">${esc(t[1])}</button>`).join('')}`:'');
 if(el._h!==h){el._h=h;el.innerHTML=h}}
function cbTagToggle(key){const L=cbSelNodes();if(!L.length||!CB_T.some(t=>t[0]===key))return;const has=L.every(n=>cbTags(n).includes(key));
 cbEditMany(L.map(n=>{const b=cbTags(n),a=has?b.filter(k=>k!==key):CB_T.map(t=>t[0]).filter(k=>b.includes(k)||k===key);return {id:n.id,b:{tags:b},a:{tags:a}}}),has?'remove a tag':'tag '+(L.length===1?'a note':L.length+' notes'));cbDraw()}
// ---- GM-only notes
function cbGmToggle(){if(!isOwner)return;const L=cbSelNodes();if(!L.length)return;const hide=L.some(n=>!n.gm),now=Date.now();
 cbEditMany(L.map(n=>hide?{id:n.id,b:{gm:!!n.gm},a:{gm:true}}:{id:n.id,b:{gm:true,ts:n.ts},a:{gm:false,ts:now}}),hide?'hide from players':'reveal to players');
 cbToast(hide?'Hidden from the players.':'Revealed. The players can see '+(L.length===1?'it':'them')+' now.');cbDraw()}
// ---- pictures on notes
function cbLightbox(n){const im=tbOk(n&&n.img);if(!im)return;
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:94vw;width:auto;text-align:center"><h2>${esc(n.title||'Picture')}</h2><img src="/_blob/${im}" alt="" style="max-width:100%;max-height:74vh;display:block;margin:0 auto"><div style="margin-top:10px"><button class="btn" id="cx">Close</button></div></div></div>`;$('#cx').onclick=closeM}
function cbTipX(n){const im=tbOk(n.img),t=cbTags(n);
 return (im?`<img src="/_blob/${im}" alt="" style="display:block;max-width:300px;max-height:220px;margin:4px 0;border:1px solid var(--line)">`:'')+(n.gm?'<div class="meta">🔒 Only the GM can see this note</div>':'')+(n.dt?`<div class="meta">📅 ${esc(cbDateTxt(n.dt))}</div>`:'')+(t.length?`<div class="meta">${t.map(k=>esc(CB_T.find(z=>z[0]===k)[1])).join(' · ')}</div>`:'')+(n.tb?'<div class="meta">🗺 Linked to a spot on a map</div>':'')}
// ---- note form
function cbForm(kind,n){n=n||{};kind=n.kind||kind||'clue';const k=CB_K[kind]||CB_K.note;let img=tbOk(n.img),up=null;const tg=cbTags(n);
 $('#modal').innerHTML=`<div class="modal"><form id="cbf"><h2>${n.id?'EDIT':'NEW'} ${esc(k[1].toUpperCase())}</h2><label>TITLE</label><input name="t" maxlength="80" required value="${esc(n.title||'')}" placeholder="${kind==='clue'?'e.g. Torn ticket stub':kind==='npc'?'e.g. Mr. Johnson':kind==='place'?'e.g. Warehouse 9':kind==='job'?'e.g. The Ares run':'A short title'}"><label>WHAT DO WE KNOW?</label><textarea name="x" maxlength="1500" style="min-height:110px" placeholder="Details, who found it, where, when">${esc(n.text||'')}</textarea>
 <div style="display:flex;gap:12px;flex-wrap:wrap"><div style="flex:1;min-width:140px"><label>KIND</label><select name="k">${Object.keys(CB_K).map(z=>`<option value="${z}" ${z===kind?'selected':''}>${CB_K[z][0]} ${CB_K[z][1]}</option>`).join('')}</select></div><div style="flex:1;min-width:150px"><label>IN-GAME DATE (OPTIONAL)</label><input type="date" name="dt" value="${esc(n.dt||'')}"></div></div>
 <label>TAGS</label><div class="cbtgs">${CB_T.map(t=>`<label class="cbtc ${tg.includes(t[0])?'on':''}" style="--k:${t[2]}"><input type="checkbox" name="tg" value="${t[0]}" ${tg.includes(t[0])?'checked':''} style="display:none">${esc(t[1])}</label>`).join('')}</div>
 <label>PICTURE (OPTIONAL)</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span id="cbpv"></span><button type="button" class="btn sm" id="cbpb">⬆ Choose a picture</button><button type="button" class="btn sm" id="cbpx">Remove</button><span class="meta" id="cbpm"></span></div><input type="file" id="cbfi" accept="image/*" hidden>
 ${isOwner?`<label style="display:block;margin-top:10px"><input type="checkbox" name="gm" ${n.gm?'checked':''} style="width:auto"> 🔒 Only the GM can see this note until it is revealed</label>`:''}
 <div style="margin-top:12px;display:flex;gap:8px"><button class="btn grn" type="submit">Save</button><button class="btn mg" type="button" id="cx">Cancel</button></div></form></div>`;
 const pv=()=>{$('#cbpv').innerHTML=img?`<img src="/_blob/${img}" alt="" style="height:54px;max-width:120px;object-fit:cover;border:1px solid var(--line)">`:'<span class="meta">No picture</span>';$('#cbpx').style.display=img?'':'none'};pv();
 $('#cx').onclick=closeM;setTimeout(()=>{const i=$('#cbf [name=t]');if(i)i.focus()},50);
 document.querySelectorAll('#cbf .cbtgs input').forEach(i=>i.onchange=()=>i.closest('label').classList.toggle('on',i.checked));
 $('#cbpb').onclick=()=>$('#cbfi').click();$('#cbpx').onclick=()=>{img='';pv()};
 $('#cbfi').onchange=()=>{const f=$('#cbfi').files&&$('#cbfi').files[0];if(!f)return;if(!assets){$('#cbpm').textContent='Uploading is not available right now.';return}$('#cbpm').textContent='Uploading…';
  up=(async()=>{try{const s=await tbShrink(f,1600,.85);if(!s.w||!s.h)throw {message:'That file is not a picture this browser can read.'};const r=await assets.upload(s.blob);img=r.id;$('#cbpm').textContent='';pv()}catch(e){const m=$('#cbpm');if(m)m.textContent='Could not add the picture: '+(e.message||e.code||e)}up=null})()};
 $('#cbf').onsubmit=async e=>{e.preventDefault();if(e.target.dataset.busy)return;const f=new FormData(e.target),t=String(f.get('t')||'').trim();if(!t)return;e.target.dataset.busy=1;
  try{if(up)await up;const tags=CB_T.map(z=>z[0]).filter(z=>f.getAll('tg').includes(z)),dt=/^\d{4}-\d{2}-\d{2}$/.test(String(f.get('dt')||''))?String(f.get('dt')):'';
   if(n.id){const a={title:t,text:String(f.get('x')||'').trim(),kind:String(f.get('k')),dt,tags,img:img||''},b={title:n.title||'',text:n.text||'',kind:n.kind||'note',dt:n.dt||'',tags:cbTags(n),img:tbOk(n.img)};
    if(isOwner){a.gm=!!f.get('gm');b.gm=!!n.gm;if(b.gm&&!a.gm){a.ts=Date.now();b.ts=n.ts}}
    await cbSetDoc('clues',n.id,{...a,edited:Date.now()});if(JSON.stringify(a)!==JSON.stringify(b))cbHPush('edit a note',()=>cbSetDoc('clues',n.id,b),()=>cbSetDoc('clues',n.id,a))}
   else{const {x,y}=cbFreeSpot(),doc={title:t,text:String(f.get('x')||'').trim(),kind:String(f.get('k')),x,y,by:handle||'?',uid:uid||'',ts:Date.now()};if(tags.length)doc.tags=tags;if(dt)doc.dt=dt;if(img)doc.img=img;if(isOwner&&f.get('gm'))doc.gm=true;
    const r=await db.collection('clues').add(doc);cbSel=r.id;cbSS=[r.id];{const id=r.id,set=v=>cbSetDoc('clues',id,{deleted:v});cbHPush('add a note',()=>set(true),async()=>{await set(false);cbSel=id;cbSS=[id]})}}
   closeM();cbDraw()}catch(er){e.target.dataset.busy='';alert('Could not save: '+(er.message||er.code))}}}
// ---- string form
function cbLinkForm(id){const l=(pm.cluelinks||[]).find(x=>x.id===id);if(!l)return;const N=Object.fromEntries(cbNodes().map(n=>[n.id,n]));let st=l.st||'';
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🧵 CONNECTION</h2><div class="meta">${esc((N[l.a]||{}).title||'?')} ↔ ${esc((N[l.b]||{}).title||'?')}</div><label>WHAT CONNECTS THEM? (OPTIONAL)</label><input id="cbll" maxlength="60" value="${esc(l.label||'')}" placeholder="e.g. works for, seen at, paid by">
 <label>KIND OF STRING</label><div class="cbtgs">${Object.keys(CB_LS).map(k=>`<button type="button" class="cbtc ${k===st?'on':''}" data-cbst="${k}" style="--k:${CB_LS[k][1]}">${esc(CB_LS[k][0])}</button>`).join('')}</div>
 <div style="margin-top:12px"><button class="btn grn" id="cbls">Save</button> <button class="btn mg" id="cbld">Cut the string</button> <button class="btn" id="cbcl">Close</button></div></div></div>`;
 $('#cbcl').onclick=closeM;document.querySelectorAll('[data-cbst]').forEach(b=>b.onclick=()=>{st=b.dataset.cbst;document.querySelectorAll('[data-cbst]').forEach(z=>z.classList.toggle('on',z===b))});
 $('#cbls').onclick=async()=>{const a={label:$('#cbll').value.trim(),st},b={label:l.label||'',st:l.st||''};try{await cbSetDoc('cluelinks',id,a);if(JSON.stringify(a)!==JSON.stringify(b))cbHPush('change a string',()=>cbSetDoc('cluelinks',id,b),()=>cbSetDoc('cluelinks',id,a));closeM();cbDraw()}catch(e){alert('Could not save: '+(e.message||e.code))}};
 $('#cbld').onclick=async()=>{const set=v=>cbSetDoc('cluelinks',id,{deleted:v});try{await set(true);const op=cbHPush('cut a string',()=>set(false),()=>set(true));closeM();cbDraw();undoBar('String cut.',async()=>{cbHDrop(op);await set(false);cbRedo.push(op);cbDraw()})}catch(e){alert('Could not save: '+(e.message||e.code))}};$('#cbll').onkeydown=e=>{if(e.key==='Enter')$('#cbls').click()};setTimeout(()=>{const i=$('#cbll');if(i)i.focus()},50)}
// ---- timeline
function cbTLApply(){const tl=$('#cbtl'),v=$('#cbview'),vh=$('#cbvh');if(!tl||!v)return;tl.style.display=cbTL?'':'none';v.style.display=cbTL?'none':'';if(vh)vh.style.display=cbTL?'none':'';const b=$('#cbtlb');if(b){b.classList.toggle('on',cbTL);b.textContent=cbTL?'🕵 Back to the board':'🗓 Timeline'}if(cbTL)cbTLDraw(tl)}
function cbTLDraw(tl){const ae=document.activeElement;if(ae&&ae.tagName==='INPUT'&&tl.contains(ae))return;const q=cbQ.trim().toLowerCase();
 const L=cbNodes().filter(n=>!cbOff(n)&&(!q||(String(n.title||'')+' '+String(n.text||'')).toLowerCase().includes(q)));
 const D=L.filter(n=>n.dt).sort((a,b)=>String(a.dt).localeCompare(String(b.dt))||(a.ts||0)-(b.ts||0)),U=L.filter(n=>!n.dt).sort((a,b)=>(a.ts||0)-(b.ts||0));
 const row=n=>{const k=cbKind(n),tg=cbTags(n);return `<div class="cbtr${cbDim(n)?' dim':''}" data-cbtr="${esc(n.id)}" style="--k:${k[2]}"><input type="date" class="cbtd" data-cbtd="${esc(n.id)}" value="${esc(n.dt||'')}" title="In-game date"><div class="cbtm"><b>${n.gm?'🔒 ':''}${k[0]} ${esc(n.title||'(untitled)')}</b>${tg.map(c=>{const t=CB_T.find(z=>z[0]===c);return `<span class="cbtc on" style="--k:${t[2]}">${esc(t[1])}</span>`}).join('')}${tbOk(n.img)?'<span title="Has a picture">🖼</span>':''}${n.tb?'<span title="Linked to a map">🗺</span>':''}<div class="cbtx2">${esc(String(n.text||'').slice(0,200))}</div></div></div>`};
 let h=`<div class="meta" style="margin-bottom:6px">Notes in the order they happen in the story. Click a note to find it on the board. Set a date on a note (here or in its Edit window) to put it on the timeline.</div>`,last='';
 D.forEach(n=>{if(n.dt!==last){last=n.dt;h+=`<div class="cbth2">${esc(cbDateTxt(n.dt))}</div>`}h+=row(n)});
 if(U.length)h+=`<div class="cbth2">No date yet (${U.length})</div>`+U.map(row).join('');
 if(!L.length)h+='<div class="empty">// NOTHING ON THE BOARD YET.</div>';
 if(tl._h!==h){tl._h=h;tl.innerHTML=h}}
// ---- jump links between the board and the Tabletop
let tbJ=null;
function tbJumpTo(map,x,y,t,src){if(!tbMaps().some(m=>m.id===map))return alert('That map is not available any more.');tbJ={map,x:+x||0,y:+y||0,t:t||'',ts:Date.now(),src:src||''};if(isOwner)tbVid=map;board='__tbl';thread=null;render()}
function tbJumpChk(){const J=tbJ;if(!J)return;if(Date.now()-J.ts>8000){tbJ=null;return}const m=tbCur(),v=$('#tbview');if(!m||!v)return;
 if(m.id!==J.map){if(!isOwner){tbJ=null;tbNote('That map is not on the table right now.')}return}
 tbJ=null;let x=J.x,y=J.y;const t=J.t?tbTok(J.t):null;if(t&&t.map===m.id){const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1);x=g.ox+((+t.c||0)+sz/2)*g.gs;y=g.oy+((+t.r||0)+sz/2)*g.gs;if(isOwner||!t.hid){tbSel=t.id;tbTS=[t.id]}}
 tbV.z=Math.max(.6,Math.min(2.5,tbV.z<.6?1:tbV.z));tbV.x=v.clientWidth/2-x*tbV.z;tbV.y=v.clientHeight/2-y*tbV.z;tbApply();tbPingFx({x,y,by:'Clue Board'});tbNote(J.src||'🕵 From the Clue Board');tbDraw()}
function cbOpenNote(id){const n=cbNodes().find(z=>z.id===id);if(!n)return alert('That Clue Board note is not available any more.');cbFocus=id;board='__clues';thread=null;render()}
async function tbCluePin(t){if(!t)return;const have=cbNodes().find(n=>n.tb&&n.tb.t===t.id);if(have)return cbOpenNote(have.id);
 const m=(pm.tbmaps||[]).find(z=>z.id===t.map);if(!m)return;const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),nm=tbName(t),{x,y}=cbFreeSpot();
 const doc={title:String(nm).slice(0,80),text:'Seen on the map: '+String(m.name||'map'),kind:t.kind==='prop'?'clue':'npc',x,y,tb:{m:m.id,x:Math.round(g.ox+((+t.c||0)+sz/2)*g.gs),y:Math.round(g.oy+((+t.r||0)+sz/2)*g.gs),t:t.id},by:handle||'?',uid:uid||'',ts:Date.now()};
 try{const r=await db.collection('clues').add(doc);tbLoc('clues',r.id,doc);const id=r.id,set=d=>cbSetDoc('clues',id,{deleted:d});cbHPush('pin a token to the board',()=>set(true),()=>set(false));tbNote('Pinned to the Clue Board. Press the same button again to open it.')}catch(e){alert('Could not pin: '+(e.message||e.code))}}
function cbMapLinkForm(n){if(!tbReady()){tbLoad().then(()=>cbMapLinkForm(n)).catch(e=>alert(tbLoadMsg(e)));return}const M=tbMaps();if(!M.length)return alert('There are no maps on the Tabletop yet.');const cur=n.tb||{};let mid=(M.find(m=>m.id===cur.m)||tbActive()||M[0]).id;
 const toks=()=>{const m=M.find(z=>z.id===mid);return tbToks(m).filter(t=>isOwner||!t.hid)};
 $('#modal').innerHTML=`<div class="modal"><form id="cbmf"><h2>🗺 LINK TO THE MAP</h2><div class="hint">Add a button to this note that jumps straight to a spot on a Tabletop map.</div><label>MAP</label><select id="cbmm">${M.map(m=>`<option value="${esc(m.id)}" ${m.id===mid?'selected':''}>${esc(m.name||'Map')}</option>`).join('')}</select><label>WHERE</label><select id="cbmt"></select>
 <div style="margin-top:12px"><button class="btn grn" type="submit">Save</button> <button class="btn" type="button" id="cx">Cancel</button></div></form></div>`;
 const fill=()=>{$('#cbmt').innerHTML='<option value="">The middle of the map</option>'+toks().map(t=>`<option value="${esc(t.id)}" ${cur.t===t.id&&cur.m===mid?'selected':''}>${esc(tbName(t))}</option>`).join('')};fill();
 $('#cbmm').onchange=e=>{mid=e.target.value;fill()};$('#cx').onclick=closeM;
 $('#cbmf').onsubmit=async e=>{e.preventDefault();const m=M.find(z=>z.id===mid),tid=$('#cbmt').value,t=tid?tbTok(tid):null,g=tbGeoM(m);let tb;
  if(t){const sz=Math.max(.5,+t.sz||1);tb={m:mid,x:Math.round(g.ox+((+t.c||0)+sz/2)*g.gs),y:Math.round(g.oy+((+t.r||0)+sz/2)*g.gs),t:tid}}else tb={m:mid,x:Math.round(m.w/2),y:Math.round(m.h/2),t:''};
  try{await cbEditMany([{id:n.id,b:{tb:n.tb||''},a:{tb}}],'link a note to a map');closeM();cbDraw()}catch(er){alert('Could not save: '+(er.message||er.code))}}}
// ---- buttons under the board
function cbBarX(n){let h='';
 if(n){if(tbOk(n.img))h+=`<button class="btn sm" data-cbxa="pic">🖼 Picture</button>`;
  if(n.tb&&tbMaps().some(m=>m.id===n.tb.m))h+=`<button class="btn sm" data-cbxa="onmap" title="Open the Tabletop at this spot">🗺 Show on map ↗</button>`;
  h+=`<button class="btn sm" data-cbxa="maplink">🗺 ${n.tb?'Change map link':'Link to map'}</button>`+(n.tb?`<button class="btn sm" data-cbxa="unmap">Unlink map</button>`:'');
  if(isOwner)h+=`<button class="btn sm ${n.gm?'on':''}" data-cbxa="gm" title="${n.gm?'Players cannot see this note yet':'Hide this note from the players until you reveal it'}">${n.gm?'🔓 Reveal to players':'🔒 Hide from players'}</button>`;
  if(n.dt)h+=`<span class="meta">📅 ${esc(cbDateTxt(n.dt))}</span>`}
 else{h+=`<button class="btn sm" data-cbxa="frame" title="Draw a labelled box around the selected notes">▭ Frame these</button>`;if(isOwner)h+=`<button class="btn sm" data-cbxa="gm">🔒 Hide or reveal</button>`}
 return h}
function cbXAct(a){const L=cbSelNodes(),n=L.length===1?L[0]:null;
 if(a==='tl'){cbTL=!cbTL;cbDraw();return}
 if(a==='fr'){cbSelNorm();return cbFrameNew()}
 if(a==='frame')return cbFrameNew();
 if(a==='pr')return cbPrint();if(a==='png')return cbSavePng();
 if(a==='tm'){cbTM=cbTM==='hide'?'fade':'hide';tbLSset('sr_cbtm',cbTM);cbDraw();return}
 if(a==='tfc'){cbTF=[];cbDraw();return}
 if(a==='gm')return cbGmToggle();
 if(!n)return;
 if(a==='pic')return cbLightbox(n);
 if(a==='onmap'&&n.tb)return tbJumpTo(n.tb.m,n.tb.x,n.tb.y,n.tb.t);
 if(a==='maplink')return cbMapLinkForm(n);
 if(a==='unmap'){cbEditMany([{id:n.id,b:{tb:n.tb||''},a:{tb:''}}],'unlink a map');cbDraw()}}
// ---- export: picture of the board, and a printable page
const cbRes=c=>{c=String(c||'');if(!/^var\(/.test(c))return c;return (getComputedStyle(document.body).getPropertyValue(c.slice(4,-1).trim())||'').trim()||'#8899aa'};
function cbWrap(ctx,txt,w,max){const words=String(txt||'').split(/\s+/).filter(Boolean),out=[];let cur='';for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width<=w)cur=t;else{if(cur)out.push(cur);cur=wd;if(out.length>=max)break}}if(cur&&out.length<max)out.push(cur);
 if(out.length===max){const last=out[max-1];let s=last;while(s.length>1&&ctx.measureText(s+'…').width>w)s=s.slice(0,-1);const more=words.join(' ').length>out.join(' ').length;out[max-1]=more?s+'…':last}return out}
function cbClipT(ctx,txt,w){let s=String(txt||'');if(ctx.measureText(s).width<=w)return s;while(s.length>1&&ctx.measureText(s+'…').width>w)s=s.slice(0,-1);return s+'…'}
async function cbSnapCanvas(){const L=cbNodes().filter(n=>!cbOff(n)),F=cbFrames();if(!L.length&&!F.length)return null;
 const xs=[],ys=[];L.forEach(n=>{xs.push(+n.x||0,(+n.x||0)+CB_W);ys.push(+n.y||0,(+n.y||0)+CB_H)});F.forEach(f=>{xs.push(+f.x,+f.x+ +f.w);ys.push(+f.y,+f.y+ +f.h)});
 const x0=Math.min(...xs)-40,y0=Math.min(...ys)-40,x1=Math.max(...xs)+40,y1=Math.max(...ys)+40,W=x1-x0,H=y1-y0,sc=Math.max(.25,Math.min(2,4096/W,4096/H));
 const imgs={};await Promise.all([...new Set(L.map(n=>tbOk(n.img)).filter(Boolean))].map(id=>new Promise(res=>{const im=new Image();const t=setTimeout(res,4000);im.onload=()=>{clearTimeout(t);imgs[id]=im;res()};im.onerror=()=>{clearTimeout(t);res()};im.src='/_blob/'+id})));
 const cv=document.createElement('canvas');cv.width=Math.round(W*sc);cv.height=Math.round(H*sc);const c=cv.getContext('2d');c.scale(sc,sc);c.translate(-x0,-y0);
 c.fillStyle='#05070b';c.fillRect(x0,y0,W,H);c.strokeStyle='#121b26';c.lineWidth=1;c.beginPath();for(let gx=Math.ceil(x0/40)*40;gx<x1;gx+=40){c.moveTo(gx,y0);c.lineTo(gx,y1)}for(let gy=Math.ceil(y0/40)*40;gy<y1;gy+=40){c.moveTo(x0,gy);c.lineTo(x1,gy)}c.stroke();
 F.forEach(f=>{const col=/^#[0-9a-f]{6}$/i.test(f.col||'')?f.col:CB_FC[0];c.fillStyle=col+'1c';c.fillRect(f.x,f.y,f.w,f.h);c.strokeStyle=col;c.lineWidth=2;c.setLineDash([10,6]);c.strokeRect(f.x,f.y,f.w,f.h);c.setLineDash([]);c.fillStyle=col+'55';c.fillRect(f.x,f.y,f.w,26);c.fillStyle='#fff';c.font='bold 14px sans-serif';c.textBaseline='middle';c.fillText(cbClipT(c,'▭ '+(f.label||'Group'),f.w-12),f.x+8,f.y+13)});
 const N=Object.fromEntries(L.map(n=>[n.id,n]));
 cbLinks().forEach(l=>{const a=N[l.a],b=N[l.b];if(!a||!b)return;const s=cbLS(l),x1=cbCx(a),y1=cbCy(a),x2=cbCx(b),y2=cbCy(b),mx=(x1+x2)/2,my=(y1+y2)/2+Math.min(60,Math.abs(x2-x1)/4+12);
  c.strokeStyle=s[1];c.lineWidth=s[0]==='Confirmed'?3:2;c.setLineDash(s[2]?s[2].split(' ').map(Number):[]);c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo(mx,my,x2,y2);c.stroke();c.setLineDash([]);
  const px=(x1+2*mx+x2)/4,py=(y1+2*my+y2)/4;c.fillStyle='#0b1018';c.beginPath();c.arc(px,py,6,0,7);c.fill();c.stroke();if(l.label){c.fillStyle='#ffb4b4';c.font='13px sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(l.label,px,py-12);c.textAlign='left'}});
 L.forEach(n=>{const k=cbKind(n),col=cbRes(k[2]),x=+n.x||0,y=+n.y||0,im=imgs[tbOk(n.img)],tg=cbTags(n);c.fillStyle='#0b1018';c.fillRect(x,y,CB_W,CB_H);c.strokeStyle=col;c.lineWidth=1.5;c.setLineDash(n.gm?[6,4]:[]);c.strokeRect(x+.5,y+.5,CB_W-1,CB_H-1);c.setLineDash([]);
  c.fillStyle='#c0262d';c.beginPath();c.arc(x+CB_W/2,y,5,0,7);c.fill();
  c.font='bold 13px sans-serif';c.textBaseline='alphabetic';c.fillStyle=col;c.fillText(cbClipT(c,(n.gm?'🔒 ':'')+k[0]+' '+(n.title||'(untitled)'),CB_W-16),x+8,y+22);
  c.font='12px sans-serif';c.fillStyle='#9fb0c3';cbWrap(c,String(n.text||''),CB_W-16-(im?52:0),2).forEach((s,i)=>c.fillText(s,x+8,y+39+i*14));
  tg.forEach((k2,i)=>{c.fillStyle=CB_T.find(z=>z[0]===k2)[2];c.fillRect(x+8+i*14,y+CB_H-12,10,6)});
  if(im){c.drawImage(im,x+CB_W-48,y+CB_H-36,44,32);c.strokeStyle=col;c.lineWidth=1;c.strokeRect(x+CB_W-48,y+CB_H-36,44,32)}
  if(n.tb){c.font='11px sans-serif';c.fillStyle='#fff';c.fillText('🗺',x+CB_W-(im?66:18),y+CB_H-6)}});
 return cv}
const cbBlob=cv=>new Promise(res=>cv.toBlob(res,'image/png'));
async function cbSavePng(){cbToast('Making the picture…');try{const cv=await cbSnapCanvas();if(!cv)return cbToast('The board is empty.');const b=await cbBlob(cv);if(!b)throw 0;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='clue-board.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);cbToast('Saved clue-board.png')}catch(e){cbToast('Could not make the picture.')}}
function cbMetaLine(n){const t=cbTags(n).map(k=>CB_T.find(z=>z[0]===k)[1]),p=[];if(n.dt)p.push('Date: '+cbDateTxt(n.dt));if(t.length)p.push('Tags: '+t.join(', '));if(n.tb){const m=(pm.tbmaps||[]).find(z=>z.id===n.tb.m);p.push('Map: '+(m?m.name||'map':'a map'))}if(tbOk(n.img))p.push('Has a picture');return p.join(' · ')}
function cbGroupText(){const F=cbFrames();if(!F.length)return [];const out=['GROUPS ('+F.length+')'];F.forEach(f=>{const m=cbFrameMembers(f).map(n=>n.title||'(untitled)');out.push('• '+(f.label||'Group')+': '+(m.length?m.join('; '):'empty'))});return out}
function cbTimelineText(){const D=cbNodes().filter(n=>n.dt).sort((a,b)=>String(a.dt).localeCompare(String(b.dt))||(a.ts||0)-(b.ts||0));if(!D.length)return [];const out=['TIMELINE ('+D.length+')'];D.forEach(n=>out.push('• '+cbDateTxt(n.dt)+' — '+(n.title||'(untitled)')));return out}
async function cbPrint(){cbToast('Getting the page ready…');let png='';try{const cv=await cbSnapCanvas();if(cv)png=cv.toDataURL('image/png')}catch(e){}
 const L=cbNodes(),K=cbLinks(),N=Object.fromEntries(L.map(n=>[n.id,n])),nm=n=>esc(n.title||'(untitled)'),pl={clue:'Clues',npc:'People',place:'Places',job:'Jobs',note:'Notes'};
 let h=`<h1>Clue Board</h1><div class="cbpm">${esc(new Date().toLocaleString())} · ${L.length} note${L.length===1?'':'s'} · ${K.length} connection${K.length===1?'':'s'}</div>`;
 if(png)h+=`<img class="cbpi" src="${png}" alt="The board">`;
 if(!L.length)h+='<p>The board is empty.</p>';
 Object.keys(CB_K).forEach(k=>{const g=L.filter(n=>(CB_K[n.kind]?n.kind:'note')===k).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));if(!g.length)return;h+=`<h2>${pl[k]} (${g.length})</h2>`;
  g.forEach(n=>{const near=K.filter(l=>l.a===n.id||l.b===n.id).map(l=>{const o=N[l.a===n.id?l.b:l.a];return esc(o.title||'(untitled)')+(l.label?' ('+esc(l.label)+')':'')+(cbLS(l)[0]!=='String'?' ['+cbLS(l)[0]+']':'')}),mt=cbMetaLine(n);
   h+=`<div class="cbpn"><b>${n.gm?'[GM only] ':''}${nm(n)}</b>${n.by?` <small>added by ${esc(n.by)}</small>`:''}${mt?`<div class="cbpm">${esc(mt)}</div>`:''}${String(n.text||'').trim()?`<p>${esc(n.text)}</p>`:''}${near.length?`<div class="cbpm">Connected to: ${near.join('; ')}</div>`:''}</div>`})});
 const G=cbGroupText();if(G.length)h+=`<h2>${esc(G[0])}</h2><ul>${G.slice(1).map(s=>`<li>${esc(s.slice(2))}</li>`).join('')}</ul>`;
 const T=cbTimelineText();if(T.length)h+=`<h2>${esc(T[0])}</h2><ul>${T.slice(1).map(s=>`<li>${esc(s.slice(2))}</li>`).join('')}</ul>`;
 let el=$('#cbprint');if(el)el.remove();el=document.createElement('div');el.id='cbprint';el.innerHTML=h;document.body.appendChild(el);
 const done=()=>{window.removeEventListener('afterprint',done);const e=$('#cbprint');if(e)e.remove()};window.addEventListener('afterprint',done);
 setTimeout(()=>{try{window.print()}catch(e){done()}},200)}
// ---- events
document.addEventListener('click',e=>{if(!$('#cbroot'))return;const t=e.target&&e.target.closest?e.target:null;if(!t)return;
 const x=t.closest('[data-cbxa]');if(x){cbXAct(x.dataset.cbxa);return}
 const f=t.closest('[data-cbtf]');if(f){const k=f.dataset.cbtf;cbTF=cbTF.includes(k)?cbTF.filter(z=>z!==k):cbTF.concat(k);cbDraw();return}
 const g=t.closest('[data-cbtg]');if(g){cbTagToggle(g.dataset.cbtg);return}
 const r=t.closest('[data-cbtr]');if(r&&!t.closest('input')){const id=r.dataset.cbtr;cbTL=false;cbFocus=id;cbDraw()}});
document.addEventListener('change',e=>{const i=e.target;if(!i||!$('#cbroot'))return;
 if(i.id==='cbhr'){cbHR=!!i.checked;tbLSset('sr_cbhr',cbHR?'1':'0');cbDraw();return}
 if(i.dataset&&i.dataset.cbtd){const n=cbNodes().find(z=>z.id===i.dataset.cbtd);if(!n)return;const v=/^\d{4}-\d{2}-\d{2}$/.test(i.value)?i.value:'';i.blur();cbEditMany([{id:n.id,b:{dt:n.dt||''},a:{dt:v}}],'set a date');cbDraw()}});
{const st=document.createElement('style');st.textContent=`
.cbf{position:absolute;box-sizing:border-box;border:2px dashed var(--k);background:color-mix(in srgb,var(--k) 9%,transparent);pointer-events:none}.cbfh{position:absolute;left:-2px;top:-2px;right:-2px;height:26px;background:color-mix(in srgb,var(--k) 38%,#05070b);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;padding:0 6px;cursor:move;pointer-events:auto;overflow:hidden;white-space:nowrap}.cbfh>span:first-child{flex:1;overflow:hidden;text-overflow:ellipsis}.cbfc{font-weight:400;font-size:11px;opacity:.8}.cbfe{pointer-events:auto;background:transparent;border:0;color:#fff;cursor:pointer;font-size:14px;padding:0 2px}.cbfr{position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;background:var(--k);cursor:nwse-resize;pointer-events:auto;clip-path:polygon(100% 0,100% 100%,0 100%)}
.cbn.gm{border-style:dashed;background:#120d18}.cbn .cbtg{position:absolute;left:8px;bottom:4px;display:flex;gap:3px}.cbn .cbtg u{display:block;width:10px;height:6px;text-decoration:none}.cbn .cbim{position:absolute;right:4px;bottom:4px;width:44px;height:32px;object-fit:cover;border:1px solid var(--k);background:#000;pointer-events:auto}.cbn.hasim .cbt{padding-right:50px}.cbn .cbmp{position:absolute;right:5px;top:3px;font-style:normal;font-size:11px}
#cbtags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px}.cbtc{display:inline-block;border:1px solid var(--k);color:var(--k);background:transparent;padding:1px 8px;font:inherit;font-size:12px;cursor:pointer;border-radius:10px}.cbtc.on{background:var(--k);color:#05070b;font-weight:700}.cbtgs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}
#cbtl{border:1px solid var(--line);padding:8px 10px;max-height:var(--cbh,calc(100vh - 270px));min-height:320px;overflow:auto;background:#05070b}.cbth2{margin:12px 0 4px;color:var(--cy);font-size:13px;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid var(--line)}.cbtr{display:flex;gap:10px;align-items:flex-start;padding:5px 4px;border-left:3px solid var(--k);margin:3px 0;cursor:pointer;background:#0b1018}.cbtr:hover{background:#101826}.cbtr.dim{opacity:.35}.cbtr .cbtd{width:150px;flex:none}.cbtm{min-width:0;flex:1}.cbtm b{color:var(--k);margin-right:6px}.cbtm .cbtc{margin-right:4px;cursor:default}.cbtx2{color:var(--dim);font-size:12px;overflow:hidden;text-overflow:ellipsis}
#cbprint{display:none}
@media print{body>*:not(#cbprint){display:none!important}html,body{background:#fff!important}#cbprint{display:block!important;color:#000;background:#fff;font:11pt/1.4 Georgia,serif;padding:0}#cbprint h1{font-size:22pt;margin:0 0 2pt}#cbprint h2{font-size:14pt;border-bottom:1px solid #000;margin:14pt 0 4pt;break-after:avoid}#cbprint .cbpm{color:#444;font-size:9.5pt}#cbprint .cbpi{max-width:100%;max-height:60vh;border:1px solid #888;margin:8pt 0;break-inside:avoid}#cbprint .cbpn{margin:5pt 0;break-inside:avoid}#cbprint .cbpn p{margin:2pt 0;white-space:pre-wrap}#cbprint small{color:#555}#cbprint ul{margin:2pt 0 0 16pt;padding:0}}
`;document.head.appendChild(st)}

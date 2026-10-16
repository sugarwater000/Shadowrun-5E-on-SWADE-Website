// ---- Clue board: a shared pin-and-string board. Clues, people, places, jobs and notes you drag around and connect with red string.
const CB_K={clue:['🔎','Clue','var(--am)'],npc:['🎭','Person','var(--mg)'],place:['📍','Place','var(--cy)'],job:['💼','Job','#39ff14'],note:['📝','Note','#9d8cff']};
const CB_W=170,CB_H=78,CB_WW=3200,CB_WH=2200;
let cbV={x:20,y:20,z:1},cbSS=[],cbHist=[],cbRedo=[],cbClip=null,cbLP=null,cbSelMode=false,cbMq=null,cbSel=null,cbLink=null,cbDrag=null,cbPan=null,cbFocus=null,cbQ='',cbXP=false,cbRs=null,cbW=(()=>{try{const v=parseFloat(localStorage.getItem('sr_cbw'));return isFinite(v)?Math.max(0,Math.min(4000,v)):0}catch(e){return 0}})(),cbH=(()=>{try{const v=parseFloat(localStorage.getItem('sr_cbh'));return isFinite(v)?Math.max(0,Math.min(3000,v)):0}catch(e){return 0}})();
const cbNodes=()=>(pm.clues||[]).filter(x=>x&&!x.deleted&&(isOwner||!x.gm));
const cbLinks=()=>{const ids=new Set(cbNodes().map(n=>n.id));return (pm.cluelinks||[]).filter(l=>l&&!l.deleted&&ids.has(l.a)&&ids.has(l.b))};
const cbKind=n=>CB_K[n.kind]||CB_K.note;
const cbCx=n=>(+n.x||0)+CB_W/2,cbCy=n=>(+n.y||0)+6;
function cbLinesHtml(){const N=Object.fromEntries(cbNodes().map(n=>[n.id,n]));return cbLinks().map(l=>cbLineOne(l,N)).join('')}
function cbLineOne(l,N){const a=N[l.a],b=N[l.b];if(!a||!b)return '';if(cbOff(a)||cbOff(b))return '';const x1=cbCx(a),y1=cbCy(a),x2=cbCx(b),y2=cbCy(b),mx=(x1+x2)/2,my=(y1+y2)/2+Math.min(60,Math.abs(x2-x1)/4+12),on=cbSS.length&&(cbSS.includes(l.a)||cbSS.includes(l.b)),ls=cbLS(l),col=on&&!l.st?'#ff6b6b':ls[1],ft=cbDim(a)||cbDim(b)?' opacity="0.25"':'';
  return `<g data-cbg="${esc(l.id)}"${ft}><path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="${on||ls[0]==='Confirmed'?3:2}" stroke-linecap="round"${ls[2]?` stroke-dasharray="${ls[2]}"`:''} data-cbst="${esc(l.st||'')}"/><circle class="cbld" data-cbl="${esc(l.id)}" cx="${(x1+2*mx+x2)/4}" cy="${(y1+2*my+y2)/4}" r="${l.label?7:6}" fill="#0b1018" stroke="${col}" stroke-width="2" style="pointer-events:all;cursor:pointer"><title>${esc((l.label||'Connection')+(l.st?' ('+ls[0]+')':''))}</title></circle>${l.label?`<text x="${(x1+2*mx+x2)/4}" y="${(y1+2*my+y2)/4-12}" text-anchor="middle" fill="#ffb4b4" font-size="13" style="pointer-events:none">${esc(l.label)}</text>`:''}</g>`}
// cbNodeHtml lives in p55_cbplus.js
function cbApply(){const w=$('#cbworld'),v=$('#cbview');if(!w||!v)return;w.style.transform=`translate(${cbV.x}px,${cbV.y}px) scale(${cbV.z})`;v.style.backgroundPosition=`${cbV.x}px ${cbV.y}px`;v.style.backgroundSize=`${40*cbV.z}px ${40*cbV.z}px`;const z=$('#cbzl');if(z)z.textContent=Math.round(cbV.z*100)+'%'}
function cbBar(){const el=$('#cbsel');if(!el)return;cbSelNorm();const n=cbNodes().find(x=>x.id===cbSel);
 const ub=$('#cbun'),rb=$('#cbre');if(ub)ub.disabled=!cbHist.length;if(rb)rb.disabled=!cbRedo.length;const sb=$('#cbsl');if(sb)sb.classList.toggle('on',cbSelMode);
 el.innerHTML=cbSS.length>1?`<span class="meta"><b>${cbSS.length} notes selected</b></span> <button class="btn sm" id="cbgc">Copy</button> <button class="btn sm" id="cbgd">Duplicate</button><button class="btn sm mg del" id="cbgx">Delete</button>${cbBarX(null)}<span class="meta"> Drag any of them to move the group. Arrow keys nudge it.</span>`:cbLink?`<span class="hint" style="margin:0;padding:4px 8px">🧵 Click the note you want to connect <b>${esc((cbNodes().find(x=>x.id===cbLink)||{}).title||'')}</b> to. <button class="btn sm" id="cbcx">Cancel</button></span>`
  :n?`<span class="meta">Selected: <b style="color:${cbKind(n)[2]}">${esc(n.title||'')}</b></span> <button class="btn sm" id="cbed">Edit</button> <button class="btn sm" id="cbcn">🧵 Connect</button>${n.ref?'<button class="btn sm" id="cbop">Open page ↗</button>':''}<button class="btn sm" id="cbdp">Duplicate</button><button class="btn sm mg del" id="cbdl">Delete</button>${cbBarX(n)}${String(n.text||'').trim()?`<div class="cbdet"><span class="meta">What do we know:</span> ${esc(n.text)}</div>`:''}`
  :'<span class="meta">Drag notes to move them. Drag the background to pan. Hold Shift and drag a box (or use ⬚ Select) to pick several notes. Click a note to edit it or connect it with string.</span>';
 const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};b('#cbed',()=>cbForm(n.kind,n));b('#cbcn',()=>{cbLink=n.id;cbBar();cbDraw()});b('#cbcx',()=>{cbLink=null;cbBar();cbDraw()});b('#cbop',()=>cbOpen(n));b('#cbdl',()=>cbDelete(n));b('#cbdp',()=>cbPaste(true));b('#cbgc',()=>cbCopy(false));b('#cbgd',()=>cbPaste(true));b('#cbgx',()=>cbDeleteMany(cbSelNodes()))}
function cbDraw(){const w=$('#cbworld');if(!w||cbDrag||cbMq||cbFd)return;cbSelNorm();cbTLApply();
 w.innerHTML=cbFramesHtml()+`<svg id="cbsvg" width="${CB_WW}" height="${CB_WH}" style="position:absolute;left:0;top:0;pointer-events:none">${cbLinesHtml()}</svg>`+cbNodes().map(cbNodeHtml).join('');
 const c=$('#cbcount');if(c)c.textContent=cbNodes().length+' note'+(cbNodes().length==1?'':'s')+' · '+cbLinks().length+' connection'+(cbLinks().length==1?'':'s');
 cbApply();cbBar();cbTagBar();
 if(cbFocus){const n=cbNodes().find(x=>x.id===cbFocus);cbFocus=null;if(n){cbSel=n.id;cbSS=[n.id];const v=$('#cbview');cbV.x=v.clientWidth/2-(cbV.z*(+n.x||0))-CB_W*cbV.z/2;cbV.y=v.clientHeight/2-(cbV.z*(+n.y||0))-CB_H*cbV.z/2;cbApply();cbDraw()}}}
function cbFit(){const L=cbNodes(),v=$('#cbview');if(!v)return;if(!L.length){cbV={x:20,y:20,z:1};return cbApply()}
 const x0=Math.min(...L.map(n=>+n.x||0)),y0=Math.min(...L.map(n=>+n.y||0)),x1=Math.max(...L.map(n=>(+n.x||0)+CB_W)),y1=Math.max(...L.map(n=>(+n.y||0)+CB_H)),
  z=Math.max(.3,Math.min(1.2,Math.min((v.clientWidth-40)/(x1-x0),(v.clientHeight-40)/(y1-y0))));cbV={z,x:20-x0*z+((v.clientWidth-40)-(x1-x0)*z)/2,y:20-y0*z+((v.clientHeight-40)-(y1-y0)*z)/2};cbApply()}
function cbZoom(f,cx,cy){const v=$('#cbview');if(!v)return;const r=v.getBoundingClientRect(),px=cx==null?v.clientWidth/2:cx-r.left,py=cy==null?v.clientHeight/2:cy-r.top,z0=cbV.z,z=Math.max(.3,Math.min(1.8,z0*f));cbV.x=px-(px-cbV.x)*(z/z0);cbV.y=py-(py-cbV.y)*(z/z0);cbV.z=z;cbApply()}
function cbFreeSpot(){const c=cbCenterWorld(),L=cbNodes(),bx=Math.round(c.x-CB_W/2),by=Math.round(c.y-CB_H/2);
 const free=(x,y)=>x>=0&&y>=0&&x<=CB_WW-CB_W&&y<=CB_WH-CB_H&&!L.some(n=>Math.abs((+n.x||0)-x)<CB_W+14&&Math.abs((+n.y||0)-y)<CB_H+14);
 for(let r=0;r<12;r++){const pts=r===0?[[0,0]]:[];if(r){for(let i=-r;i<=r;i++){pts.push([i,-r],[i,r]);if(Math.abs(i)<r)pts.push([-r,i],[r,i])}}
  for(const [i,j] of pts){const x=bx+i*(CB_W+20),y=by+j*(CB_H+24);if(free(x,y))return {x,y}}}
 return {x:Math.max(0,Math.min(CB_WW-CB_W,bx)),y:Math.max(0,Math.min(CB_WH-CB_H,by))}}
function cbCenterWorld(){const v=$('#cbview');return {x:((v?v.clientWidth/2:300)-cbV.x)/cbV.z,y:((v?v.clientHeight/2:200)-cbV.y)/cbV.z}}
function cbView(){
 $('#view').innerHTML=`<div id="cbroot"><div class="bar"><h2>🕵 CLUE BOARD</h2><div class="mfold" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${Object.keys(CB_K).map((k,i)=>`<button class="btn sm${i>=2?' mf':''}" data-cbadd="${k}" style="border-color:${CB_K[k][2]};color:${CB_K[k][2]}">+ ${CB_K[k][1]}</button>`).join('')}<button class="btn sm" id="cbex">📥 Add existing…</button><button type="button" class="btn sm mfb" aria-expanded="false">More ▾</button></div></div>
 <div class="hint" style="margin:-4px 0 8px">A shared board for the whole party. Pin up clues, people, places and jobs, drag them around, and connect them with red string to show how they fit together. Everyone can add, move and connect.</div>
 <div class="mfold" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><input id="cbq" placeholder="Find on the board…" value="${esc(cbQ)}" style="width:190px;display:inline-block"> <button class="btn sm" id="cbzo" title="Zoom out">−</button><span class="meta" id="cbzl" style="min-width:42px;text-align:center">100%</span><button class="btn sm" id="cbzi" title="Zoom in">+</button><button class="btn sm" id="cbfit">Fit all</button><button class="btn sm mf" id="cbfull" title="Fill the whole window (Esc to leave)">⛶ Full window</button><button class="btn sm mf" id="cbrs" title="Back to the standard size">Reset size</button><button class="btn sm mf" id="cbsum" title="Write out everything on the board as text">📄 Summary</button><button class="btn sm mf" id="cbtlb" data-cbxa="tl" title="See the notes in the order they happen in the story">🗓 Timeline</button><button class="btn sm mf" data-cbxa="fr" title="Add a labelled box to group notes. Select notes first to wrap them.">▭ Group</button><button class="btn sm mf" data-cbxa="pr" title="Print the board, or save it as a PDF from the print window">🖨 Print board</button><button class="btn sm mf" data-cbxa="png" title="Save a picture of the whole board">🖼 Save picture</button><button type="button" class="btn sm mfb" aria-expanded="false">More ▾</button><button class="btn sm" id="cbsl" title="Drag a box on the board to select several notes (or hold Shift and drag)">⬚ Select</button><button class="btn sm" id="cbun" title="Undo (Ctrl+Z)">↶</button><button class="btn sm" id="cbre" title="Redo (Ctrl+Y)">↷</button><span class="meta" id="cbcount"></span></div>
 <div id="cbtags"></div>
 <div id="cbsel" style="margin-bottom:6px;min-height:30px"></div>
 <div id="cbview"><div id="cbworld"></div><div id="cbtoast"></div></div><div id="cbtl" style="display:none"></div><div id="cbvh" title="Drag up or down to make the board taller"><i></i></div><div id="cbhw" class="hwid" title="Drag left or right to make the board wider or narrower"><i></i></div></div>`;
 cbXP=false;cbRs=null;cbTipHide();cbSize();
 const v=$('#cbview');
 const vh=$('#cbvh');if(vh){vh.addEventListener('pointerdown',e=>{e.preventDefault();try{vh.setPointerCapture(e.pointerId)}catch(x){}cbRs={y:e.clientY,h:v.offsetHeight,pid:e.pointerId}});vh.addEventListener('pointermove',e=>{if(cbRs&&cbRs.pid===e.pointerId){cbH=Math.max(240,Math.min(3000,Math.round(cbRs.h+e.clientY-cbRs.y)));cbSize();try{localStorage.setItem('sr_cbh',cbH)}catch(x){}}});const en=e=>{cbRs=null;try{vh.releasePointerCapture(e.pointerId)}catch(x){}};vh.addEventListener('pointerup',en);vh.addEventListener('pointercancel',en)}
 const hw=$('#cbhw');if(hw){hw.addEventListener('pointerdown',e=>{e.preventDefault();try{hw.setPointerCapture(e.pointerId)}catch(x){}cbRs={x:e.clientX,w:$('#cbroot').offsetWidth,pid:e.pointerId,kind:'w'}});hw.addEventListener('pointermove',e=>{if(cbRs&&cbRs.pid===e.pointerId&&cbRs.kind==='w'){const mx=Math.max(520,($('#view').clientWidth||900)-32);cbW=Math.max(520,Math.min(mx,Math.round(cbRs.w+e.clientX-cbRs.x)));cbSize();try{localStorage.setItem('sr_cbw',cbW)}catch(x){}}});const en2=e=>{cbRs=null;try{hw.releasePointerCapture(e.pointerId)}catch(x){}};hw.addEventListener('pointerup',en2);hw.addEventListener('pointercancel',en2)}
 v.addEventListener('pointermove',cbTipMove);v.addEventListener('pointerleave',cbTipHide);v.addEventListener('pointerdown',cbTipHide);v.addEventListener('wheel',cbTipHide,{passive:true});
 v.addEventListener('pointerdown',e=>{if(e.button!=null&&e.button>0)return;const nEl=e.target.closest('[data-cbn]'),lEl=e.target.closest('[data-cbl]');
  if(lEl)return;cbSelNorm();const mod=e.shiftKey||e.ctrlKey||e.metaKey;
  {const fEl=e.target.closest('[data-cbfh],[data-cbfr],[data-cbfe]');if(fEl&&!nEl&&cbFrameDown(e,fEl,v))return}
  if(nEl){const id=nEl.dataset.cbn,n=cbNodes().find(x=>x.id===id);if(!n)return;
   if(cbLink){if(id!==cbLink)cbConnect(cbLink,id);cbLink=null;cbSel=id;cbSS=[id];cbBar();cbDraw();return}
   if(mod){cbToggle(id);e.preventDefault();return}
   const inG=cbSS.length>1&&cbSS.includes(id);if(!inG)cbSS=[id];cbSel=id;
   const grp=inG?cbSS.map(i=>{const z=cbNodes().find(q=>q.id===i),el=v.querySelector('[data-cbn="'+i+'"]');return z&&el?{id:i,el,nx:+z.x||0,ny:+z.y||0}:null}).filter(Boolean):null;
   cbDrag={id,sx:e.clientX,sy:e.clientY,nx:+n.x||0,ny:+n.y||0,moved:false,el:nEl,group:grp&&grp.length>1?grp:null,collapse:inG,im:!!e.target.closest('.cbim')};cbPaintSel();try{v.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();return}
  if(mod||cbSelMode){const p=cbPt(e);cbMq={x0:p.x,y0:p.y,x1:p.x,y1:p.y,add:mod,moved:false};try{v.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();return}
  cbPan={sx:e.clientX,sy:e.clientY,vx:cbV.x,vy:cbV.y,moved:false};try{v.setPointerCapture(e.pointerId)}catch(x){}v.style.cursor='grabbing'});
 v.addEventListener('pointermove',e=>{cbLP=cbPt(e);
  if(cbFd){cbFrameMove(e);return}
  if(cbDrag){const dx=(e.clientX-cbDrag.sx)/cbV.z,dy=(e.clientY-cbDrag.sy)/cbV.z;if(!cbDrag.moved&&Math.abs(dx)+Math.abs(dy)<4/cbV.z)return;cbDrag.moved=true;
   const G=cbDrag.group||[cbDrag];let ddx=Math.round(dx),ddy=Math.round(dy);
   ddx=Math.max(-Math.min(...G.map(o=>o.nx)),Math.min(CB_WW-CB_W-Math.max(...G.map(o=>o.nx)),ddx));ddy=Math.max(-Math.min(...G.map(o=>o.ny)),Math.min(CB_WH-CB_H-Math.max(...G.map(o=>o.ny)),ddy));
   if(!cbDrag.pr){const N=Object.fromEntries(cbNodes().map(n=>[n.id,n])),ids=new Set(G.map(o=>o.id)),s=$('#cbsvg'),gs={};if(s)s.querySelectorAll('g[data-cbg]').forEach(g=>gs[g.dataset.cbg]=g);
    cbDrag.pr={N,aff:cbLinks().filter(l=>ids.has(l.a)||ids.has(l.b)).map(l=>({l,g:gs[l.id]})).filter(x=>x.g),pmn:Object.fromEntries(G.map(o=>[o.id,(pm.clues||[]).find(z=>z.id===o.id)]))}}
   const P=cbDrag.pr;G.forEach(o=>{o.x=o.nx+ddx;o.y=o.ny+ddy;o.el.style.left=o.x+'px';o.el.style.top=o.y+'px';const n=P.pmn[o.id];if(n){n.x=o.x;n.y=o.y}P.N[o.id]={...P.N[o.id],x:o.x,y:o.y}});
   P.aff.forEach(a=>{const h=cbLineOne(a.l,P.N);a.g.insertAdjacentHTML('beforebegin',h);const ng=a.g.previousElementSibling;a.g.remove();a.g=ng});return}
  if(cbMq){const p=cbPt(e);cbMq.x1=p.x;cbMq.y1=p.y;if(Math.hypot(p.x-cbMq.x0,p.y-cbMq.y0)*cbV.z>5)cbMq.moved=true;cbMqDraw();return}
  if(cbPan){const dx=e.clientX-cbPan.sx,dy=e.clientY-cbPan.sy;if(Math.abs(dx)+Math.abs(dy)>3)cbPan.moved=true;cbV.x=cbPan.vx+dx;cbV.y=cbPan.vy+dy;cbApply()}});
 v.addEventListener('pointerleave',()=>{cbLP=null});
 const up=e=>{try{v.releasePointerCapture(e.pointerId)}catch(x){}v.style.cursor='';
  if(cbFd){cbFrameUp();return}
  if(cbDrag){const d=cbDrag;cbDrag=null;
   if(d.moved){const G=d.group||[d];cbEditMany(G.map(o=>({id:o.id,b:{x:o.nx,y:o.ny},a:{x:o.x,y:o.y}})).filter(it=>it.a.x!==it.b.x||it.a.y!==it.b.y),'move '+(G.length===1?'a note':G.length+' notes'));cbSel=d.id;cbBar();cbDraw()}
   else{if(d.collapse){cbSS=[d.id]}cbSel=d.id;cbBar();cbDraw();cbDbl(d)}return}
  if(cbMq){const Q=cbMq;cbMq=null;const w=$('#cbmq');if(w)w.remove();
   if(!Q.moved){if(!Q.add){cbSel=null;cbSS=[];cbLink=null}cbBar();cbDraw();return}
   const x0=Math.min(Q.x0,Q.x1),x1=Math.max(Q.x0,Q.x1),y0=Math.min(Q.y0,Q.y1),y1=Math.max(Q.y0,Q.y1),hit=cbNodes().filter(n=>{if(cbOff(n))return false;const x=+n.x||0,y=+n.y||0;return x<x1&&x+CB_W>x0&&y<y1&&y+CB_H>y0}).map(n=>n.id);
   const set=Q.add?new Set(cbSS):new Set();hit.forEach(i=>set.add(i));cbSS=[...set];cbSel=hit.length?hit[hit.length-1]:(cbSS[cbSS.length-1]||null);cbBar();cbDraw();if(cbSS.length)cbToast(cbSS.length+' note'+(cbSS.length===1?'':'s')+' selected.');return}
  if(cbPan){const p=cbPan;cbPan=null;if(!p.moved&&!e.target.closest('[data-cbl]')){cbSel=null;cbSS=[];cbLink=null;cbBar();cbDraw()}}};
 v.addEventListener('pointerup',up);v.addEventListener('pointercancel',up);
 v.addEventListener('click',e=>{const l=e.target.closest('[data-cbl]');if(l)cbLinkForm(l.dataset.cbl)});
 v.addEventListener('dblclick',e=>{const tg=e.target===v?(document.elementFromPoint(e.clientX,e.clientY)||e.target):e.target;{const fh=tg.closest('[data-cbfh]');if(fh){const fr=fh.closest('[data-cbf]'),f=fr&&cbFrames().find(z=>z.id===fr.dataset.cbf);if(f)cbFrameForm(f);return}const im=tg.closest('.cbim');if(im){const nn=im.closest('[data-cbn]'),z=nn&&cbNodes().find(q=>q.id===nn.dataset.cbn);if(z)cbLightbox(z);return}}
  const nEl=tg.closest('[data-cbn]');if(nEl&&!($('#modal')&&$('#modal').innerHTML.trim())){const n=cbNodes().find(x=>x.id===nEl.dataset.cbn);if(n)cbForm(n.kind,n)}});
 v.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();cbZoom(e.deltaY<0?1.1:0.9,e.clientX,e.clientY)},{passive:false});
 document.querySelectorAll('[data-cbadd]').forEach(b=>b.onclick=()=>cbForm(b.dataset.cbadd));$('#cbex').onclick=cbPicker;
 $('#cbfull').onclick=()=>{cbXP=!cbXP;cbSize();setTimeout(cbApply,30)};$('#cbrs').onclick=()=>{cbH=0;cbW=0;cbXP=false;try{localStorage.setItem('sr_cbh',0);localStorage.setItem('sr_cbw',0)}catch(x){}cbSize()};$('#cbsum').onclick=cbSummary;
 $('#cbsl').onclick=()=>{cbSelMode=!cbSelMode;cbBar();v.style.cursor=cbSelMode?'crosshair':''};$('#cbun').onclick=cbUndo;$('#cbre').onclick=cbRedoDo;$('#cbzi').onclick=()=>cbZoom(1.2);$('#cbzo').onclick=()=>cbZoom(1/1.2);$('#cbfit').onclick=cbFit;
 $('#cbq').oninput=e=>{cbQ=e.target.value;cbDraw()};
 cbDraw();if(!cbFocus&&!cbView.done&&cbNodes().length){cbView.done=1;setTimeout(cbFit,50)}}
function cbSize(){const r=$('#cbroot');if(!r)return;if(cbH>0)r.style.setProperty('--cbh',cbH+'px');else r.style.removeProperty('--cbh');if(cbW>0)r.style.setProperty('--bw',cbW+'px');else r.style.removeProperty('--bw');r.classList.toggle('cbfull',cbXP);const b=$('#cbfull');if(b){b.textContent=cbXP?'⛶ Leave full window':'⛶ Full window';b.classList.toggle('on',cbXP)}}
// hover card: the whole note, so nobody has to open Edit to read it
function cbTipEl(){let t=$('#cbtip');if(!t){t=document.createElement('div');t.id='cbtip';document.body.appendChild(t)}return t}
function cbTipHide(){const t=$('#cbtip');if(t)t.style.display='none'}
function cbTipMove(e){if(e.pointerType&&e.pointerType!=='mouse')return;if(cbDrag&&cbDrag.moved||cbPan||cbRs)return cbTipHide();
 const nEl=e.target.closest&&e.target.closest('[data-cbn]');if(!nEl)return cbTipHide();const n=cbNodes().find(x=>x.id===nEl.dataset.cbn);if(!n)return cbTipHide();
 const t=cbTipEl(),k=cbKind(n),h=`<div class="cbth" style="color:${k[2]}">${k[0]} ${esc(k[1])}</div><b>${esc(n.title||'(untitled)')}</b>${cbTipX(n)}<div class="cbtx">${String(n.text||'').trim()?esc(n.text):'<span class="meta">No details written yet. Double-click to add what we know.</span>'}</div>${n.by?`<div class="meta">Added by ${esc(n.by)}</div>`:''}`;
 if(t._h!==h){t._h=h;t.innerHTML=h}t.style.display='block';const W=window.innerWidth,H=window.innerHeight,w=t.offsetWidth,hh=t.offsetHeight;let x=e.clientX+16,y=e.clientY+16;if(x+w>W-8)x=Math.max(8,e.clientX-w-12);if(y+hh>H-8)y=Math.max(8,H-hh-8);t.style.left=x+'px';t.style.top=y+'px'}
// text summary of the whole board
function cbSummaryText(){const L=cbNodes(),K=cbLinks(),N=Object.fromEntries(L.map(n=>[n.id,n])),pl={clue:'CLUES',npc:'PEOPLE',place:'PLACES',job:'JOBS',note:'NOTES'},nm=n=>n.title||'(untitled)';
 const out=['CLUE BOARD SUMMARY',new Date().toLocaleString()+' · '+L.length+' note'+(L.length===1?'':'s')+' · '+K.length+' connection'+(K.length===1?'':'s'),''];
 if(!L.length)return out.concat(['The board is empty.']).join('\n');
 const near=n=>K.filter(l=>l.a===n.id||l.b===n.id).map(l=>{const o=N[l.a===n.id?l.b:l.a];return nm(o)+(l.label?' ('+l.label+')':'')+(cbLS(l)[0]!=='String'?' ['+cbLS(l)[0]+']':'')});
 Object.keys(CB_K).forEach(k=>{const g=L.filter(n=>(CB_K[n.kind]?n.kind:'note')===k).sort((a,b)=>nm(a).localeCompare(nm(b)));if(!g.length)return;out.push(pl[k]+' ('+g.length+')');
  g.forEach(n=>{out.push('• '+nm(n)+(n.by?'  [added by '+n.by+']':'')+(isOwner&&n.gm?'  [GM only]':''));{const mt=cbMetaLine(n);if(mt)out.push('    '+mt)}const tx=String(n.text||'').trim();if(tx)tx.split(/\r?\n/).forEach(z=>out.push('    '+z));const c=near(n);if(c.length)out.push('    Connected to: '+c.join('; '))});out.push('')});
 {const gs=cbGroupText();if(gs.length)out.push(...gs,'')}
 if(K.length){out.push('CONNECTIONS ('+K.length+')');K.forEach(l=>out.push('• '+nm(N[l.a])+' ↔ '+nm(N[l.b])+(l.label?'  — '+l.label:'')+(cbLS(l)[0]!=='String'?'  ['+cbLS(l)[0]+']':'')));out.push('')}
 {const tl=cbTimelineText();if(tl.length)out.push(...tl,'')}
 return out.join('\n').replace(/\n+$/,'')+'\n'}
function cbSummary(){const txt=cbSummaryText();
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:760px;width:94vw"><h2>📄 BOARD SUMMARY</h2><div class="meta" style="margin-bottom:6px">Everything on the board, written out. Copy it into your notes or save it as a text file.</div><textarea id="cbst" readonly style="width:100%;min-height:52vh;font-family:inherit;line-height:1.4"></textarea><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grn" id="cbsc">Copy</button><button class="btn" id="cbsd">Save as .txt</button><button class="btn mg" id="cbsx">Close</button><span class="meta" id="cbsm"></span></div></div></div>`;
 $('#cbst').value=txt;$('#cbsx').onclick=closeM;
 $('#cbsc').onclick=async()=>{const t=$('#cbst');let ok=false;try{await navigator.clipboard.writeText(t.value);ok=true}catch(e){try{t.select();ok=document.execCommand('copy')}catch(x){}}$('#cbsm').textContent=ok?'Copied.':'Could not copy. Select the text and copy it by hand.'};
 $('#cbsd').onclick=()=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='clue-board-summary.txt';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){$('#cbsm').textContent='Could not save the file.'}}}

async function cbConnect(a,b){if(cbLinks().some(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a)))return;
 try{const r=await db.collection('cluelinks').add({a,b,label:'',by:handle||'?',uid:uid||'',ts:Date.now()}),id=r.id,set=v=>cbSetDoc('cluelinks',id,{deleted:v});const op=cbHPush('connect two notes',()=>set(true),()=>set(false));cbDraw();undoBar('Connected with string.',async()=>{cbHDrop(op);await set(true);cbRedo.push(op);cbDraw()})}catch(e){alert('Could not connect: '+(e.message||e.code))}}
// cbLinkForm and cbForm live in p55_cbplus.js
const cbDelete=n=>cbDeleteMany([n]);
async function cbDeleteMany(L,noAsk){L=L.filter(Boolean);if(!L.length)return;
 if(!noAsk&&!await ask(L.length===1?'Take "'+(L[0].title||'this note')+'" off the board? Its strings go with it. You can undo this.':'Take these '+L.length+' notes off the board? Their strings go with them. You can undo this.','Remove'))return;
 const ids=L.map(n=>n.id),set=v=>Promise.all(ids.map(id=>cbSetDoc('clues',id,v?{deleted:true,delAt:Date.now(),delBy:handle||'?'}:{deleted:false})));
 try{await set(true);cbSel=null;cbSS=[];const op=cbHPush(ids.length===1?'remove a note':'remove '+ids.length+' notes',async()=>{await set(false);cbSS=ids.slice();cbSel=ids[0]},()=>set(true));cbBar();cbDraw();
  undoBar(ids.length===1?'Note removed.':ids.length+' notes removed.',async()=>{cbHDrop(op);await set(false);cbSS=ids.slice();cbSel=ids[0];cbRedo.push(op);cbBar();cbDraw()})}catch(e){alert('Could not remove: '+(e.message||e.code))}}
// pages a note can point to
function cbOpen(n){const r=n.ref;if(!r)return;thread=null;dirH=null;query='';if($('#q'))$('#q').value='';tabm={};
 if(r.t==='job'){board='jobs';tabm.jobs='cards'}else if(r.t==='mission'){board='plot-hooks';tabm['plot-hooks']='cards'}else if(r.t==='contact'){board='contacts';tabm.contacts='cards'}
 else if(r.t==='pin'){board='__map';mapFocus=r.id}else if(r.t==='district'){board='__dist';render();return dsCard(r.id)}else if(r.t==='npc'){board='__dir';dirH=r.id}else if(r.t==='sheet'){board='__sheets';shId=r.id;sh=null;if($('#sheetroot'))$('#view').innerHTML=''}
 render()}
function cbSources(){const live=k=>(pm[k]||[]).filter(x=>x&&!x.deleted),o=[];
 live('jobs').forEach(x=>o.push({t:'job',id:x.id,kind:'job',title:x.title,text:[x.patron&&'From '+x.patron,x.pay&&'Pay '+x.pay,x.status].filter(Boolean).join(' · ')}));
 live('missions').forEach(x=>o.push({t:'mission',id:x.id,kind:'job',title:x.title,text:[x.status,x.next&&'Next: '+x.next].filter(Boolean).join(' · ')}));
 live('contacts').forEach(x=>o.push({t:'contact',id:x.id,kind:'npc',title:x.name,text:[x.role,x.aff].filter(Boolean).join(' · ')}));
 (npcs||[]).forEach(x=>{if(x.name)o.push({t:'npc',id:x.name,kind:'npc',title:x.name,text:[x.aff,x.desc].filter(Boolean).join(' · ').slice(0,90)})});
 live('mappins').forEach(x=>o.push({t:'pin',id:x.id,kind:'place',title:x.title,text:[x.kind,x.note].filter(Boolean).join(' · ').slice(0,90)}));
 live('districts').forEach(x=>o.push({t:'district',id:x.id,kind:'place',title:x.name,text:[x.tag,x.ctrl].filter(Boolean).join(' · ')}));
 (pm.sheets||[]).filter(sxVis).filter(x=>!x.drone).forEach(x=>o.push({t:'sheet',id:x.id,kind:'npc',title:x.name,text:[x.concept,x.player&&'Player: '+x.player].filter(Boolean).join(' · ')}));
 return o}
const CB_SRCN={job:'Jobs',mission:'Missions',contact:'Contacts',npc:'NPC handles',pin:'Map pins',district:'Districts',sheet:'Characters'};
function cbPicker(){const used=new Set(cbNodes().filter(n=>n.ref).map(n=>n.ref.t+':'+n.ref.id));let q='';
 const draw=()=>{const L=cbSources().filter(s=>!used.has(s.t+':'+s.id)&&(!q||(s.title+' '+s.text).toLowerCase().includes(q.toLowerCase())));const g={};L.forEach(s=>(g[s.t]=g[s.t]||[]).push(s));
  $('#cbpl').innerHTML=Object.keys(g).map(t=>`<div class="meta" style="margin:8px 0 2px">${esc(CB_SRCN[t].toUpperCase())}</div>`+g[t].slice(0,40).map(s=>`<a class="row" data-cbx="${esc(s.t+'|'+s.id)}"><div class="t">${CB_K[s.kind][0]} ${esc(s.title||'(untitled)')}</div><div class="meta">${esc(s.text||'')}</div></a>`).join('')).join('')||'<div class="empty">// NOTHING LEFT TO ADD.</div>';
  document.querySelectorAll('[data-cbx]').forEach(a=>a.onclick=async()=>{const [t,...r]=a.dataset.cbx.split('|'),id=r.join('|'),s=cbSources().find(z=>z.t===t&&z.id===id);if(!s)return;
   const {x,y}=cbFreeSpot();
   try{const rr=await db.collection('clues').add({title:String(s.title||'').slice(0,80),text:String(s.text||'').slice(0,300),kind:s.kind,ref:{t:s.t,id:s.id},x,y,by:handle||'?',uid:uid||'',ts:Date.now()});cbSel=rr.id;used.add(s.t+':'+s.id);cbDraw();draw()}catch(e){alert('Could not add: '+(e.message||e.code))}})};
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:560px"><h2>📥 ADD FROM THE GAME</h2><div class="hint">Pin something that already exists: a job, mission, contact, NPC, map pin, district or character. Click it to add it to the board. You can add as many as you like.</div><input id="cbxq" placeholder="Search…" style="margin:6px 0"><div id="cbpl" style="max-height:50vh;overflow:auto"></div><div style="margin-top:10px"><button class="btn" id="cbxc">Done</button></div></div></div>`;
 $('#cbxc').onclick=closeM;$('#cbxq').oninput=e=>{q=e.target.value;draw()};draw();setTimeout(()=>{const i=$('#cbxq');if(i)i.focus()},50)}
{const st=document.createElement('style');st.textContent=`#cbview{position:relative;height:var(--cbh,calc(100vh - 270px));min-height:420px;overflow:hidden;border:1px solid var(--line);background-color:#05070b;touch-action:none;cursor:grab;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:40px 40px;user-select:none;-webkit-user-select:none}#cbworld{position:absolute;left:0;top:0;width:${CB_WW}px;height:${CB_WH}px;transform-origin:0 0}.cbn{position:absolute;width:${CB_W}px;height:${CB_H}px;box-sizing:border-box;border:1px solid var(--k);background:#0b1018;padding:8px 8px 4px;overflow:hidden;cursor:move;color:var(--tx);font-size:13px;line-height:1.25;box-shadow:0 2px 8px rgba(0,0,0,.6)}.cbn b{display:block;color:var(--k);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cbn .cbt{display:block;color:var(--dim);font-size:12px;max-height:2.6em;overflow:hidden}.cbn .cbp{position:absolute;top:-1px;left:50%;margin-left:-5px;width:10px;height:10px;border-radius:50%;background:#c0262d;box-shadow:0 0 6px #c0262d;transform:translateY(-50%)}.cbn.sel{outline:2px solid var(--k);box-shadow:0 0 14px var(--k)}.cbn.lnk{outline:2px dashed #ff6b6b}.cbn .cbr{position:absolute;right:5px;bottom:2px;color:var(--k);font-style:normal;font-size:12px}#cbvh{height:14px;cursor:ns-resize;display:flex;align-items:center;justify-content:center;touch-action:none;margin-top:3px}#cbvh i{display:block;width:70px;height:5px;border-radius:3px;background:#2c3f55}#cbvh:hover i{background:var(--cy)}.cbdet{margin-top:6px;max-height:6.5em;overflow:auto;white-space:pre-wrap;font-size:13px;color:var(--tx);border-left:2px solid var(--cy);padding-left:8px}#cbroot.cbfull{position:fixed;inset:0;z-index:8;background:var(--bg);padding:8px 10px;display:flex;flex-direction:column;overflow:auto}.cbfull #cbview{height:auto;flex:1;min-height:0}.cbfull #cbvh{display:none}.cbfull>.hint{display:none}#cbtip{position:fixed;display:none;z-index:60;max-width:340px;max-height:60vh;overflow:hidden;background:#0b1018;border:1px solid var(--cy);box-shadow:0 4px 18px rgba(0,0,0,.8);padding:8px 10px;font-size:13px;line-height:1.35;pointer-events:none}#cbtip b{display:block;margin:2px 0 4px;color:var(--tx)}#cbtip .cbth{font-size:11px;letter-spacing:.08em;text-transform:uppercase}#cbtip .cbtx{white-space:pre-wrap;color:var(--tx);word-break:break-word}`;document.head.appendChild(st)}
// ---- selecting several notes, undo and redo, copy and paste
function cbSelNorm(){const ids=new Set(cbNodes().map(n=>n.id));cbSS=cbSS.filter(i=>ids.has(i));if(!cbSel||!ids.has(cbSel)){cbSel=null;cbSS=[]}else if(!cbSS.includes(cbSel))cbSS=[cbSel]}
const cbSelNodes=()=>{cbSelNorm();return cbSS.map(i=>cbNodes().find(n=>n.id===i)).filter(Boolean)};
function cbPaintSel(){const v=$('#cbview');if(v)v.querySelectorAll('.cbn').forEach(e=>e.classList.toggle('sel',cbSS.includes(e.dataset.cbn)));cbBar()}
function cbToggle(id){cbSelNorm();const i=cbSS.indexOf(id);if(i>=0){cbSS.splice(i,1);if(cbSel===id)cbSel=cbSS[cbSS.length-1]||null}else{cbSS.push(id);cbSel=id}cbPaintSel();cbDraw()}
function cbPt(e){const v=$('#cbview'),r=v.getBoundingClientRect();return {x:(e.clientX-r.left-cbV.x)/cbV.z,y:(e.clientY-r.top-cbV.y)/cbV.z}}
function cbMqDraw(){const w=$('#cbworld'),Q=cbMq;if(!w||!Q)return;let d=$('#cbmq');if(!d){d=document.createElement('div');d.id='cbmq';w.appendChild(d)}if(!Q.moved){d.style.display='none';return}
 d.style.display='block';d.style.left=Math.min(Q.x0,Q.x1)+'px';d.style.top=Math.min(Q.y0,Q.y1)+'px';d.style.width=Math.abs(Q.x1-Q.x0)+'px';d.style.height=Math.abs(Q.y1-Q.y0)+'px'}
function cbToast(t){const el=$('#cbtoast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}
function cbHPush(label,undo,redo){const o={label,undo,redo};cbHist.push(o);if(cbHist.length>100)cbHist.shift();cbRedo.length=0;cbBar();return o}
function cbHDrop(o){const i=cbHist.indexOf(o);if(i>=0)cbHist.splice(i,1)}
async function cbSetDoc(coll,id,f){const d=(pm[coll]||[]).find(x=>x&&x.id===id);if(d)Object.assign(d,f);await db.doc(coll+'/'+id).update(f)}
async function cbUndo(){const o=cbHist.pop();if(!o)return cbToast('Nothing to undo.');try{await o.undo();cbRedo.push(o);cbToast('Undid: '+o.label)}catch(e){cbToast('Could not undo that.')}cbSelNorm();cbBar();cbDraw()}
async function cbRedoDo(){const o=cbRedo.pop();if(!o)return cbToast('Nothing to redo.');try{await o.redo();cbHist.push(o);cbToast('Redid: '+o.label)}catch(e){cbToast('Could not redo that.')}cbSelNorm();cbBar();cbDraw()}
// a batch of changes to notes: items = [{id,b:{before},a:{after}}]. merge = fold quick repeats (arrow keys) into one step
async function cbEditMany(items,label,merge){items=items.filter(it=>it&&Object.keys(it.a).length);if(!items.length)return;
 const run=k=>Promise.all(items.map(it=>cbSetDoc('clues',it.id,it[k])));
 try{await run('a')}catch(e){alert('Could not save: '+(e.message||e.code));return}
 const key=items.map(it=>it.id).join(','),last=cbHist[cbHist.length-1];
 if(merge&&last&&last.grp===key&&Date.now()-last.at<1200){last.at=Date.now();last.redo=()=>run('a');cbRedo.length=0;cbBar();return}
 const op=cbHPush(label,()=>run('b'),()=>run('a'));if(merge){op.grp=key;op.at=Date.now()}}
const cbPlain=n=>({title:n.title||'',text:n.text||'',kind:n.kind||'note',x:+n.x||0,y:+n.y||0,ref:n.ref||null,tags:cbTags(n),dt:n.dt||'',img:tbOk(n.img),gm:!!n.gm,tb:n.tb||null});
function cbClipOf(L){const ids=L.map(n=>n.id);return {nodes:L.map(cbPlain),links:cbLinks().filter(l=>ids.includes(l.a)&&ids.includes(l.b)).map(l=>({a:ids.indexOf(l.a),b:ids.indexOf(l.b),label:l.label||''})),n:0}}
function cbCopy(cut){const L=cbSelNodes();if(!L.length)return cbToast('Select a note first.');cbClip=cbClipOf(L);const w=L.length===1?'the note':L.length+' notes';
 if(cut){cbDeleteMany(L,true);cbToast('Cut '+w+'. Press Ctrl+V to paste.')}else cbToast('Copied '+w+'. Press Ctrl+V to paste.')}
async function cbPaste(dup){let src;if(dup){const L=cbSelNodes();if(!L.length)return cbToast('Select a note first.');src=cbClipOf(L)}else{src=cbClip;if(!src||!src.nodes.length)return cbToast('Nothing copied yet.');src.n=(src.n||0)+1}
 const xs=src.nodes.map(n=>n.x),ys=src.nodes.map(n=>n.y),mnx=Math.min(...xs),mny=Math.min(...ys),mxx=Math.max(...xs),mxy=Math.max(...ys);let dx,dy;
 if(!dup&&cbLP){dx=cbLP.x-mnx;dy=cbLP.y-mny}else{dx=dy=30*(dup?1:src.n)}
 dx=Math.max(-mnx,Math.min(CB_WW-CB_W-mxx,Math.round(dx)));dy=Math.max(-mny,Math.min(CB_WH-CB_H-mxy,Math.round(dy)));
 const ids=[],lids=[];
 try{for(let i=0;i<src.nodes.length;i++){const d=src.nodes[i],doc={title:d.title,text:d.text,kind:d.kind,x:d.x+dx,y:d.y+dy,by:handle||'?',uid:uid||'',ts:Date.now()+i};if(d.ref)doc.ref=d.ref;if(d.tags&&d.tags.length)doc.tags=d.tags;if(d.dt)doc.dt=d.dt;if(d.img)doc.img=d.img;if(d.gm&&isOwner)doc.gm=true;if(d.tb)doc.tb=d.tb;ids.push((await db.collection('clues').add(doc)).id)}
  for(const l of src.links){if(ids[l.a]&&ids[l.b])lids.push((await db.collection('cluelinks').add({a:ids[l.a],b:ids[l.b],label:l.label||'',by:handle||'?',uid:uid||'',ts:Date.now()})).id)}}
 catch(e){alert('Could not paste: '+(e.message||e.code))}
 if(ids.length){const set=v=>Promise.all([...ids.map(id=>cbSetDoc('clues',id,{deleted:v})),...lids.map(id=>cbSetDoc('cluelinks',id,{deleted:v}))]);
  cbHPush((dup?'duplicate ':'paste ')+(ids.length===1?'a note':ids.length+' notes'),()=>set(true),async()=>{await set(false);cbSS=ids.slice();cbSel=ids[0]});
  cbSS=ids.slice();cbSel=ids[0];cbToast((dup?'Duplicated ':'Pasted ')+(ids.length===1?'1 note':ids.length+' notes')+'.');cbBar();cbDraw()}}
function cbNudge(dx,dy){const L=cbSelNodes();if(!L.length)return;const mnx=Math.min(...L.map(n=>+n.x||0)),mny=Math.min(...L.map(n=>+n.y||0)),mxx=Math.max(...L.map(n=>+n.x||0)),mxy=Math.max(...L.map(n=>+n.y||0));
 dx=Math.max(-mnx,Math.min(CB_WW-CB_W-mxx,dx));dy=Math.max(-mny,Math.min(CB_WH-CB_H-mxy,dy));if(!dx&&!dy)return;
 cbEditMany(L.map(n=>({id:n.id,b:{x:+n.x||0,y:+n.y||0},a:{x:(+n.x||0)+dx,y:(+n.y||0)+dy}})),'move '+(L.length===1?'a note':L.length+' notes'),true);cbDraw()}
document.addEventListener('keydown',e=>{if(!$('#cbroot')||($('#modal')&&$('#modal').innerHTML.trim()))return;
 if(e.key==='Escape'){if(cbMq){cbMq=null;const w=$('#cbmq');if(w)w.remove();return}if(cbXP){cbXP=false;cbSize();setTimeout(cbApply,30);return}if(cbSS.length||cbSel||cbLink){cbSel=null;cbSS=[];cbLink=null;cbBar();cbDraw()}return}
 const tg=document.activeElement&&document.activeElement.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tg||''))return;
 const mod=e.ctrlKey||e.metaKey,k=String(e.key||'').toLowerCase();
 if(mod&&!e.altKey){const txt=window.getSelection&&String(window.getSelection()).trim();
  if(k==='z'&&!e.shiftKey){e.preventDefault();cbUndo();return}if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();cbRedoDo();return}
  if(k==='c'||k==='x'){if(txt)return;if(cbSelNodes().length){e.preventDefault();cbCopy(k==='x')}return}
  if(k==='v'){if(cbClip&&cbClip.nodes.length){e.preventDefault();cbPaste(false)}return}
  if(k==='d'){e.preventDefault();cbPaste(true);return}
  if(k==='a'){e.preventDefault();cbSS=cbNodes().filter(n=>!cbOff(n)).map(n=>n.id);cbSel=cbSS[cbSS.length-1]||null;cbBar();cbDraw();return}
  return}
 if(e.altKey)return;
 if(e.key==='Delete'||e.key==='Backspace'){const L=cbSelNodes();if(L.length){e.preventDefault();cbDeleteMany(L)}return}
 const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(d&&cbSelNodes().length){e.preventDefault();const st=e.shiftKey?40:10;cbNudge(d[0]*st,d[1]*st)}});
{const st=document.createElement('style');st.textContent=`#cbmq{position:absolute;display:none;border:1.5px dashed #fff;background:rgba(255,255,255,.08);pointer-events:none;z-index:4}#cbtoast{position:absolute;left:12px;bottom:12px;z-index:7;background:#0b1018;border:1px solid var(--cy);padding:5px 10px;font-size:13px;opacity:0;transition:opacity .25s;pointer-events:none;max-width:70%}#cbtoast.on{opacity:1}#cbroot .btn:disabled{opacity:.4;cursor:default}#cbsl.on{border-color:var(--cy);color:var(--cy);background:rgba(0,240,208,.14)}`;document.head.appendChild(st)}
// new notes count as New for the other players, and show in the scrolling banner
try{CU_SRC.__clues=()=>(pm.clues||[]).filter(x=>isOwner||!(x&&x.gm));CU_COLL.clues=['__clues'];CU_COLL.cluelinks=['__clues']}catch(e){}

// ---- Tabletop area templates: Savage Worlds blast, cone and stream shapes, and who they catch.
// The templates are ordinary shapes (everyone can draw them, the GM can erase any); a blast is a circle, a cone is a triangle 9 squares long and 3 wide at the end, a stream is a strip.
// A token is "caught" if any part of its square is under the shape. Select a shape to see who it catches; a missed throw can scatter a blast.
const TB_TPL=[['sbt','Small blast','⚫',{k:'circle',rad:1,label:'Small blast'},'2 squares across'],['mbt','Medium blast','⚫',{k:'circle',rad:2,label:'Medium blast'},'4 squares across'],['lbt','Large blast','⚫',{k:'circle',rad:3,label:'Large blast'},'6 squares across'],
 ['cone','Cone','◺',{k:'cone',len:9,wd:3,fl:0,label:'Cone'},'9 squares long, 3 wide at the far end'],['stream','Stream','▬',{k:'cone',len:9,wd:1,fl:1,label:'Stream'},'9 squares long, 1 wide']];
const tbTplOn=()=>tbTool==='shape'&&tbShp.pre?tbShp.pre.label:'';
function tbTplPanel(m,S){const on=tbTplOn(),one=S&&S.length===1?S[0]:null;
 let h=`<div class="meta" style="margin-top:6px">Templates (a square is a Savage Worlds inch)</div><div class="tbvb">${TB_TPL.map(t=>`<button class="btn sm ${on===t[3].label?'on':''}" data-tbx="tpl:${t[0]}" title="${esc(t[4])}">${t[2]} ${esc(t[1])}</button>`).join('')}</div>`;
 if(on){const t=TB_TPL.find(x=>x[3].label===on);h+=`<div class="meta">${t&&t[3].k==='circle'?'Click the map to drop it, centred on the nearest grid corner (hold Alt to place it freely).':'Press where it starts and drag to aim it.'} Pick any shape above to go back to drawing freely.</div>`}
 if(S&&S.length){const C=tbCaught(m,S);h+=`<div class="tbcgl"><b>Caught${S.length>1?' by these shapes':''}:</b> ${C.length?C.map(c=>esc(tbName(c))).join(', '):'<span class="meta">nobody</span>'}</div>`}
 if(one&&one.kind==='circle'&&tbShpMoveOk(one))h+=`<div class="tbvb"><span class="meta">Missed throw:</span><select id="tbsc" aria-label="Range of the throw"><option value="1">Short · 1d6</option><option value="2">Medium · 2d6</option><option value="3">Long · 3d6</option></select><button class="btn sm" data-tbx="scat" title="Roll a d12 for the direction (like a clock face, 12 is up the map) and d6 squares for each range step, then move the blast">🎲 Scatter</button></div>`;
 return h}
TBX.tpl=x=>{const t=TB_TPL.find(z=>z[0]===x);if(!t)return;tbShp.pre={...t[3]};tbShp.type=t[3].k;tbAct('tool','shape')};
async function tbTplDrop(m,g,p,e){const pr=tbShp.pre;if(!pr)return;const free=tbShpFree(e),fx=(p.x-g.ox)/g.gs,fy=(p.y-g.oy)/g.gs;
 const d={kind:'circle',col:tbShp.col,fr:!!free,cx:free?tbn2(fx):Math.round(fx),cy:free?tbn2(fy):Math.round(fy),rad:pr.rad,label:pr.label,map:m.id};
 const ids=await tbShpCreate([d],'place a '+pr.label.toLowerCase());if(ids.length){tbShS=ids;tbSel=null}tbShpDraw();tbBar(m);tbRulDraw()}
// ---- geometry: does a shape overlap a square (grid units)?
function tbShpPolyG(s){const L=Math.max(.1,+s.len||1),a=+s.ang||0,ax=+s.cx||0,ay=+s.cy||0,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,ex=ax+L*dx,ey=ay+L*dy,hw=(+s.wd>0?+s.wd:(s.fl?1:L))/2;
 return s.fl?[[ax+nx*hw,ay+ny*hw],[ex+nx*hw,ey+ny*hw],[ex-nx*hw,ey-ny*hw],[ax-nx*hw,ay-ny*hw]]:[[ax,ay],[ex+nx*hw,ey+ny*hw],[ex-nx*hw,ey-ny*hw]]}
function tbSat(P,x0,y0,x1,y1){const E=1e-6,R=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],axes=[[1,0],[0,1]];
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],l=Math.hypot(ex,ey)||1;axes.push([-ey/l,ex/l])}
 for(const [ux,uy] of axes){let pmn=1e9,pmx=-1e9,rmn=1e9,rmx=-1e9;P.forEach(q=>{const v=q[0]*ux+q[1]*uy;pmn=Math.min(pmn,v);pmx=Math.max(pmx,v)});R.forEach(q=>{const v=q[0]*ux+q[1]*uy;rmn=Math.min(rmn,v);rmx=Math.max(rmx,v)});
  if(pmx<=rmn+E||rmx<=pmn+E)return false}return true}
function tbShpHitSq(s,x0,y0,x1,y1){const E=1e-6;
 if(s.kind==='rect'){const e=tbShpRect(s);return x0<e.x1-E&&x1>e.x0+E&&y0<e.y1-E&&y1>e.y0+E}
 if(s.kind==='circle'||s.kind==='ring'){const cx=+s.cx||0,cy=+s.cy||0,R=Math.max(.1,+s.rad||1),qx=Math.max(x0,Math.min(cx,x1)),qy=Math.max(y0,Math.min(cy,y1));if(Math.hypot(cx-qx,cy-qy)>=R-E)return false;
  if(s.kind==='ring'){const inner=R-Math.max(.1,+s.th||1),far=Math.max(...[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(q=>Math.hypot(q[0]-cx,q[1]-cy)));if(far<=inner+E)return false}return true}
 if(s.kind==='cone')return tbSat(tbShpPolyG(s),x0,y0,x1,y1);
 const e=tbShpEm(s);return x0<e.c+e.sz+e.n-E&&x1>e.c-e.n+E&&y0<e.r+e.sz+e.n-E&&y1>e.r-e.n+E}
// the tokens (that this player can see) under any of the given shapes
function tbCaught(m,S){if(!m||!S||!S.length)return [];const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null,out=[];
 tbToks(m).forEach(t=>{if(!tbSees(t,g,rows))return;const sz=Math.max(.5,+t.sz||1),x0=+t.c||0,y0=+t.r||0;
  if(S.some(s=>!(s.kind==='emanation'&&s.tok&&s.tok===t.id)&&tbShpHitSq(s,x0,y0,x0+sz,y0+sz)))out.push(t)});return out}
function tbCaughtPaint(){const tk=$('#tbtoks');if(!tk)return;const m=tbCur(),ids=new Set(m&&tbShS.length?tbCaught(m,tbShpSel().filter(s=>s.map===m.id)).map(t=>t.id):[]);
 tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('cgt',ids.has(e.dataset.tbt)))}
// ---- scatter: a missed throw moves the blast
TBX.scat=()=>{const m=tbCur(),s=tbShpSel()[0];if(!m||!s||s.kind!=='circle'||tbShpSel().length!==1||!tbShpMoveOk(s))return;const sel=$('#tbsc'),n=Math.max(1,Math.min(3,+(sel&&sel.value)||1));
 const clock=1+Math.floor(Math.random()*12),ds=Array.from({length:n},()=>1+Math.floor(Math.random()*6)),dist=ds.reduce((a,b)=>a+b,0),ang=(clock*30-90)*Math.PI/180;
 let cx=(+s.cx||0)+dist*Math.cos(ang),cy=(+s.cy||0)+dist*Math.sin(ang);if(!s.fr){cx=Math.round(cx);cy=Math.round(cy)}else{cx=tbn2(cx);cy=tbn2(cy)}
 const b={cx:s.cx,cy:s.cy},a={cx,cy};tbShpEdit([{id:s.id,b,a}],'scatter a blast');
 const txt=`💥 **${s.label||'Blast'}** scatters: direction ${clock} o'clock, ${n}d6 (${ds.join('+')}) = ${dist} squares`;tbNote(`Scatter: ${clock} o'clock, ${dist} squares`);
 try{dxRecord(txt,handle||'Table')}catch(e){}};
(function(){const st=document.createElement('style');st.id='tbtplcss';st.textContent=`.tbt.cgt{outline:3px dashed #ff2d95;outline-offset:2px;box-shadow:0 0 14px #ff2d95;z-index:5}.tbcgl{margin:6px 0;font-size:13px}`;document.head.appendChild(st)})();

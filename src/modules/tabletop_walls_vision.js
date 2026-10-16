// ---- Tabletop map tools: walls and doors, sight and light that uncover the fog, routes around walls, movement range, waypoint ruler.
// Loaded after p52_tbplus.js. Walls live in one GM-only document per map: tbmeta/w<mapId> = {kind:'walls',map,items:[{x0,y0,x1,y1,t:'w'|'d',o:open,l:locked}]} in grid-square units.
let tbWK=tbLS('sr_tbwk','w'),tbWD=null,tbRoute=tbLS('sr_tbrt','0')==='1',tbRangeOn=false,tbVisSig='',tbVisBusy=false;
const tbWallDoc=m=>m?(pm.tbmeta||[]).find(x=>x&&x.id==='w'+m.id&&x.kind==='walls'):null;
const tbWalls=m=>{const d=tbWallDoc(m);return d&&Array.isArray(d.items)?d.items:[]};
const tbBlocks=w=>w.t==='d'?!w.o:true;
const tbN1=v=>Math.round(v*100)/100;
function tbSegX(ax,ay,bx,by,cx,cy,dx,dy){const d1x=bx-ax,d1y=by-ay,d2x=dx-cx,d2y=dy-cy,den=d1x*d2y-d1y*d2x,E=1e-9;
 if(Math.abs(den)<E){if(Math.abs((cx-ax)*d1y-(cy-ay)*d1x)>E)return false;const L=d1x*d1x+d1y*d1y||1,t0=((cx-ax)*d1x+(cy-ay)*d1y)/L,t1=((dx-ax)*d1x+(dy-ay)*d1y)/L;return Math.max(0,Math.min(t0,t1))<=Math.min(1,Math.max(t0,t1))+E}
 const t=((cx-ax)*d2y-(cy-ay)*d2x)/den,u=((cx-ax)*d1y-(cy-ay)*d1x)/den;return t>=-E&&t<=1+E&&u>=-E&&u<=1+E}
const tbBlocked=(B,ax,ay,bx,by)=>{if(ax===bx&&ay===by)return false;for(let i=0;i<B.length;i++){const w=B[i];if(tbSegX(ax,ay,bx,by,w.x0,w.y0,w.x1,w.y1))return true}return false};
const tbBlockList=m=>tbWalls(m).filter(tbBlocks);
const tbTokCell=t=>{const sz=Math.max(.5,+t.sz||1);return {c:Math.floor((+t.c||0)+sz/2-.01),r:Math.floor((+t.r||0)+sz/2-.01)}};
// ---- saving walls (GM), with undo
async function tbWallsSet(m,items,label){if(!m||!isOwner)return;items=items.slice(0,1500);const before=tbWalls(m).map(w=>({...w}));
 const put=async arr=>{const doc={kind:'walls',map:m.id,items:arr,ts:Date.now()},L=pm.tbmeta=pm.tbmeta||[],o=L.find(x=>x&&x.id==='w'+m.id);if(o)Object.assign(o,doc);else L.push({id:'w'+m.id,...doc});await db.doc('tbmeta/w'+m.id).set(doc)};
 try{await put(items)}catch(e){alert('Could not save the walls: '+(e.message||e.code));return}
 tbHPush(label,()=>put(before),()=>put(items.map(w=>({...w}))));tbVisSig='';tbAfter()}
const tbWSnap=(g,p,free)=>{const fx=(p.x-g.ox)/g.gs,fy=(p.y-g.oy)/g.gs;return free?{x:tbN1(Math.round(fx*4)/4),y:tbN1(Math.round(fy*4)/4)}:{x:Math.round(fx),y:Math.round(fy)}};
function tbWallStart(m,g,p,e){const s=tbWSnap(g,p,!!e.altKey);tbWD={pid:e.pointerId,x0:s.x,y0:s.y,x1:s.x,y1:s.y,kind:tbWK,moved:false};tbRulDraw()}
function tbWallMove(p){const D=tbWD,m=tbCur();if(!D||!m)return;const s=tbWSnap(tbGeoM(m),p,false);D.x1=s.x;D.y1=s.y;D.moved=true;tbRulDraw()}
function tbWallEnd(){const D=tbWD;tbWD=null;const m=tbCur();if(!D||!m||!D.moved)return tbRulDraw();const W=tbWalls(m).map(w=>({...w}));let add=[];
 if(D.kind==='room'){const x0=Math.min(D.x0,D.x1),x1=Math.max(D.x0,D.x1),y0=Math.min(D.y0,D.y1),y1=Math.max(D.y0,D.y1);if(x1-x0<1||y1-y0<1)return tbRulDraw();
  add=[[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]].map(a=>({x0:a[0],y0:a[1],x1:a[2],y1:a[3],t:'w'}))}
 else{if(Math.hypot(D.x1-D.x0,D.y1-D.y0)<.5)return tbRulDraw();add=[{x0:D.x0,y0:D.y0,x1:D.x1,y1:D.y1,t:D.kind==='d'?'d':'w',...(D.kind==='d'?{o:0,l:0}:{})}]}
 tbWallsSet(m,W.concat(add),D.kind==='room'?'draw a room':D.kind==='d'?'draw a door':'draw a wall')}
const tbDistSeg=(px,py,x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,L=dx*dx+dy*dy,t=L?Math.max(0,Math.min(1,((px-x0)*dx+(py-y0)*dy)/L)):0;return Math.hypot(px-(x0+t*dx),py-(y0+t*dy))};
function tbWallNear(m,g,p,doorsOnly){const fx=(p.x-g.ox)/g.gs,fy=(p.y-g.oy)/g.gs,W=tbWalls(m);let best=-1,bd=doorsOnly?.4:.3;W.forEach((w,i)=>{if(doorsOnly&&w.t!=='d')return;const d=tbDistSeg(fx,fy,w.x0,w.y0,w.x1,w.y1);if(d<bd){bd=d;best=i}});return best}
function tbDoorToggle(m,i,lock){const W=tbWalls(m).map(w=>({...w})),w=W[i];if(!w||w.t!=='d')return;
 if(lock)w.l=w.l?0:1;else{if(w.l&&!w.o)return tbNote('That door is locked. Shift-click it to unlock it.');w.o=w.o?0:1}
 tbWallsSet(m,W,lock?(w.l?'lock a door':'unlock a door'):(w.o?'open a door':'close a door'));tbNote(lock?(w.l?'Door locked.':'Door unlocked.'):(w.o?'Door opened.':'Door closed.'))}
function tbWallErase(m,g,p){const i=tbWallNear(m,g,p,false);if(i<0)return;const W=tbWalls(m).map(w=>({...w}));const k=W[i].t==='d'?'door':'wall';W.splice(i,1);tbWallsSet(m,W,'remove a '+k)}
async function tbWallsClear(){const m=tbCur();if(!m||!isOwner)return;const n=tbWalls(m).length;if(!n)return tbNote('There are no walls on this map.');if(!await ask('Remove all '+n+' walls and doors from this map?','Remove all'))return;tbWallsSet(m,[],'clear all walls')}
// ---- drawing walls and doors
function tbWallsDraw(m,g,rows){const sv=$('#tbwalls');if(!sv)return;sv.setAttribute('width',m.w);sv.setAttribute('height',m.h);
 const W=tbWalls(m),gs=g.gs,X=c=>tbN1(g.ox+c*gs),Y=r=>tbN1(g.oy+r*gs),sw=Math.max(3,gs*.07);let h='';
 W.forEach((w,i)=>{const x0=X(w.x0),y0=Y(w.y0),x1=X(w.x1),y1=Y(w.y1);
  if(w.t==='d'){const mx=(w.x0+w.x1)/2,my=(w.y0+w.y1)/2;if(!isOwner&&rows){const fc=Math.floor(mx),fr=Math.floor(my),cs=w.x0===w.x1?[[Math.round(w.x0)-1,fr],[Math.round(w.x0),fr]]:w.y0===w.y1?[[fc,Math.round(w.y0)-1],[fc,Math.round(w.y0)]]:[[fc,fr]];
    if(!cs.some(q=>q[0]>=0&&q[1]>=0&&q[0]<g.cols&&q[1]<g.rows&&rows[q[1]]&&rows[q[1]][q[0]]))return}
   const col=w.l&&!w.o?'#ff3b3b':'#ffb000';
   if(w.o){h+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${tbN1(sw*.6)}" stroke-dasharray="${tbN1(sw*1.2)} ${tbN1(sw*1.6)}" stroke-linecap="round" opacity=".85"/>`}
   else h+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#000" stroke-width="${tbN1(sw*2.1)}" stroke-linecap="round" opacity=".7"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${tbN1(sw*1.5)}" stroke-linecap="butt"/>`;
   h+=`<circle cx="${X(mx)}" cy="${Y(my)}" r="${tbN1(sw*1.2)}" fill="#0b1018" stroke="${col}" stroke-width="${tbN1(sw*.5)}"/>`;if(w.l&&!w.o)h+=`<text x="${X(mx)}" y="${Y(my)}" text-anchor="middle" dominant-baseline="central" font-size="${tbN1(sw*1.6)}">🔒</text>`}
  else if(isOwner)h+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#000" stroke-width="${tbN1(sw*1.8)}" stroke-linecap="round" opacity=".6"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#00e5ff" stroke-width="${tbN1(sw)}" stroke-linecap="round"/>`});
 const sig=m.id+'|'+gs+'|'+isOwner+'|'+h;if(sv._h!==sig){sv._h=sig;sv.innerHTML=h}}
function tbWallPreview(m,g,k){const D=tbWD;if(!D||!D.moved)return '';const gs=g.gs,X=c=>g.ox+c*gs,Y=r=>g.oy+r*gs,col=D.kind==='d'?'#ffb000':'#00e5ff';
 if(D.kind==='room')return `<rect x="${X(Math.min(D.x0,D.x1))}" y="${Y(Math.min(D.y0,D.y1))}" width="${Math.abs(D.x1-D.x0)*gs}" height="${Math.abs(D.y1-D.y0)*gs}" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-width="${3*k}" stroke-dasharray="${8*k} ${5*k}"/>`;
 return `<line x1="${X(D.x0)}" y1="${Y(D.y0)}" x2="${X(D.x1)}" y2="${Y(D.y1)}" stroke="${col}" stroke-width="${4*k}" stroke-dasharray="${8*k} ${5*k}" stroke-linecap="round"/>`}
// ---- sight and light: tokens with a radius uncover the fog around them, stopped by walls and closed doors
function tbVisCells(m,g,t,B){const sz=Math.max(.5,+t.sz||1),cx=(+t.c||0)+sz/2,cy=(+t.r||0)+sz/2,R=Math.min(40,+t.vr||0)+sz/2,out=[];
 for(let r=Math.max(0,Math.floor(cy-R)-1);r<=Math.min(g.rows-1,Math.ceil(cy+R));r++)for(let c=Math.max(0,Math.floor(cx-R)-1);c<=Math.min(g.cols-1,Math.ceil(cx+R));c++){
  if(Math.hypot(c+.5-cx,r+.5-cy)>R+.001)continue;if(B.length&&tbBlocked(B,cx,cy,c+.5,r+.5))continue;out.push([c,r])}
 return out}
function tbVisChk(){if(!isOwner||tbGrid)return;const m=$('#tbroot')?tbCur():tbActive();if(!m||!tbFogOn(m)||m.av===false)return;
 const T=tbToks(m).filter(t=>(+t.vr>0)&&!t.hid&&t.mark!=='down');if(!T.length){tbVisSig='';return}
 const g=tbGeo(m,m),W=tbWalls(m),sig=m.id+'|'+g.gs+','+g.ox+','+g.oy+'|'+T.map(t=>[t.id,t.c,t.r,t.sz,t.vr].join(',')).join(';')+'|'+W.map(w=>[w.x0,w.y0,w.x1,w.y1,tbBlocks(w)?1:0].join(',')).join(';');
 if(sig===tbVisSig||tbVisBusy)return;tbVisSig=sig;
 const a=tbFogRows(m,g).map(u=>u.slice()),B=W.filter(tbBlocks);let n=0;
 T.forEach(t=>tbVisCells(m,g,t,B).forEach(q=>{if(!a[q[1]][q[0]]){a[q[1]][q[0]]=1;n++}}));
 if(n){tbVisBusy=true;tbFogWrite(m,a).then(()=>{tbVisBusy=false;if($('#tbroot')){tbDraw();tbNote('Sight and light uncovered '+n+' square'+(n===1?'':'s')+'.')}}).catch(()=>{tbVisBusy=false})}}
// ---- finding a route around walls (breadth-first over the squares, 8 directions, each step counts as one square)
function tbRouteCells(m,g,c0,r0,c1,r1){const B=tbBlockList(m),W=g.cols,H=g.rows;c0=Math.max(0,Math.min(W-1,c0));c1=Math.max(0,Math.min(W-1,c1));r0=Math.max(0,Math.min(H-1,r0));r1=Math.max(0,Math.min(H-1,r1));
 if(c0===c1&&r0===r1)return [[c0,r0]];const prev=new Int32Array(W*H).fill(-2),q=[c0+r0*W];prev[q[0]]=-1;
 for(let h=0;h<q.length;h++){const cur=q[h],cc=cur%W,cr=(cur-cc)/W;if(cc===c1&&cr===r1)break;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nc=cc+dx,nr=cr+dy;if(nc<0||nr<0||nc>=W||nr>=H)continue;const id=nc+nr*W;if(prev[id]!==-2)continue;
   if(B.length&&tbBlocked(B,cc+.5,cr+.5,nc+.5,nr+.5))continue;prev[id]=cur;q.push(id)}}
 const end=c1+r1*W;if(prev[end]===-2)return null;const out=[];for(let i=end;i!==-1;i=prev[i])out.push([i%W,Math.floor(i/W)]);return out.reverse()}
function tbFlood(m,g,c0,r0,maxd){const B=tbBlockList(m),W=g.cols,H=g.rows,dist=new Int16Array(W*H).fill(-1),q=[c0+r0*W],out=[];dist[q[0]]=0;
 for(let h=0;h<q.length;h++){const cur=q[h],cc=cur%W,cr=(cur-cc)/W,d=dist[cur];out.push([cc,cr,d]);if(d>=maxd)continue;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nc=cc+dx,nr=cr+dy;if(nc<0||nr<0||nc>=W||nr>=H)continue;const id=nc+nr*W;if(dist[id]!==-1)continue;
   if(B.length&&tbBlocked(B,cc+.5,cr+.5,nc+.5,nr+.5))continue;dist[id]=d+1;q.push(id)}}
 return out}
function tbRangeDraw(){const sv=$('#tbrange'),m=tbCur();if(!sv)return;let h='';const t=tbSelToks()[0];
 if(m&&tbRangeOn&&t&&t.map===m.id&&(+t.spd>0)){const g=tbGeoM(m),c=tbTokCell(t);
  h=tbFlood(m,g,Math.max(0,Math.min(g.cols-1,c.c)),Math.max(0,Math.min(g.rows-1,c.r)),Math.min(60,+t.spd)).map(q=>`<rect x="${g.ox+q[0]*g.gs}" y="${g.oy+q[1]*g.gs}" width="${g.gs}" height="${g.gs}" fill="#00d0ff" fill-opacity="${q[2]?.2:.35}" stroke="#00d0ff" stroke-opacity=".5" stroke-width="1"/>`).join('')}
 if(m&&typeof tbRingsSvg==='function')h+=tbRingsSvg(m,tbGeoM(m));
 if(m&&typeof tbRigSvg==='function')h+=tbRigSvg(m,tbGeoM(m));
 if(sv._h!==h){sv._h=h;sv.innerHTML=h}if(m){sv.setAttribute('width',m.w);sv.setAttribute('height',m.h)}}
// ---- the ruler: waypoints (hold Shift and press to continue from the end), and an optional route around walls
function tbRulPoly(R){const P=(R.path||[]).map(a=>({x:a[0],y:a[1]}));P.push({x:R.x0,y:R.y0},{x:R.x1,y:R.y1});return P}
function tbRulSvg(R,m,g,k,col,pre){const P=tbRulPoly(R),gs=g.gs,su=+m.su||1,un=esc(m.un||'m');let sq=0,dist=0,h='',lm=null;
 for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];let used=false;
  if(R.rt){const ca=tbCell(g,a),cb=tbCell(g,b),rc=tbRouteCells(m,g,ca.c,ca.r,cb.c,cb.r);
   if(rc){const pts=rc.map(q=>(g.ox+(q[0]+.5)*gs)+','+(g.oy+(q[1]+.5)*gs)).join(' ');h+=`<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${3*k}" stroke-dasharray="${9*k} ${6*k}" stroke-linecap="round" stroke-linejoin="round"/>`;sq+=rc.length-1;dist+=(rc.length-1)*su;used=true;lm={x:(a.x+b.x)/2,y:(a.y+b.y)/2}}}
  if(!used){const dx=(b.x-a.x)/gs,dy=(b.y-a.y)/gs;h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${3*k}" stroke-dasharray="${9*k} ${6*k}" stroke-linecap="round"/>`;sq+=Math.round(Math.max(Math.abs(dx),Math.abs(dy)));dist+=Math.hypot(dx,dy)*su;lm={x:(a.x+b.x)/2,y:(a.y+b.y)/2}}}
 P.forEach((q,i)=>{h+=`<circle cx="${q.x}" cy="${q.y}" r="${6*k}" fill="${col}"/>`});
 const last=P[P.length-1],first=P[0];lm=lm||{x:(first.x+last.x)/2,y:(first.y+last.y)/2};
 h+=`<text x="${lm.x}" y="${lm.y-10*k}" text-anchor="middle" font-size="${15*k}" font-weight="700" fill="#fff" stroke="#000" stroke-width="${4*k}" paint-order="stroke" stroke-linejoin="round">${pre||''}${tbFmt(dist)} ${un} · ${sq} sq${P.length>2?' ('+(P.length-1)+' legs)':''}${R.rt?' · routed':''}</text>`+(R.bd&&typeof tbRulExtra==='function'?tbRulExtra(R,P,m,g,k,lm):'');return h}
// ---- the token's own speed, sight/light and range controls
const TB_SPD=[0,4,5,6,8,10,12,15,20,30],TB_VR=[0,2,3,4,5,6,8,10,12,15,20];
function tbMovePanel(L){const ok=L.filter(tbCndCan);if(!ok.length)return '';const m=tbCur(),su=+m.su||1,un=esc(m.un||'m'),t=ok[0],cur=+t.spd||0;
 return `<div class="tbcw"><div class="meta">Speed and range</div><div class="tbvb"><select id="tbspd">${TB_SPD.map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n?n+' sq per move ('+tbFmt(n*su)+' '+un+')':'Speed not set'}</option>`).join('')}</select><button class="btn sm ${tbRangeOn?'on':''}" data-tbx="range" title="Shade every square this token can reach, going around walls">◎ Show range</button></div></div>`}
function tbVisPanel(L){const t=L[0],cur=+t.vr||0;
 return `<div class="tbcw"><div class="meta">Sight or light: uncovers the fog around the token as it moves (stopped by walls and closed doors)</div><div class="tbvb"><select id="tbvr">${TB_VR.map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n?n+' squares':'Off'}</option>`).join('')}</select></div></div>`}
function tbWallPanel(m){const W=tbWalls(m),nd=W.filter(w=>w.t==='d').length,kinds=[['w','▬ Wall'],['d','🚪 Door'],['room','▭ Room']];
 return `<div class="tbcw"><div class="meta"><b>Walls and doors</b> (${W.length-nd} wall${W.length-nd===1?'':'s'}, ${nd} door${nd===1?'':'s'}). Walls stop sight and light and movement routes. Players see only the doors they have uncovered.</div>
 <div class="tbvb">${kinds.map(k=>`<button class="btn sm ${tbTool==='wall'&&tbWK===k[0]?'on':''}" data-tbx="wall:${k[0]}">${k[1]}</button>`).join('')}<button class="btn sm ${tbTool==='wallx'?'on':''}" data-tbx="ptool:${tbTool==='wallx'?'move':'wallx'}">🧽 Remove</button></div>
 <div class="meta">${tbTool==='wall'?'Drag on the map from corner to corner. Squares snap to grid corners; hold Alt for finer placement.':tbTool==='wallx'?'Click a wall or door to remove it.':'Click a door in the Move tool to open or close it. Shift-click locks or unlocks it.'}</div>
 <div class="tbvb"><button class="btn sm ${m.av===false?'':'on'}" data-tbx="avtog" title="When on, tokens with a sight or light radius uncover fog automatically while fog of war is on">👁 Auto-reveal: ${m.av===false?'OFF':'ON'}</button><button class="btn sm" data-tbx="wallsclr">Remove all</button></div></div>`}
function tbMsrPanel(m){return `<div class="tbvb"><button class="btn sm ${tbRoute?'on':''}" data-tbx="route" title="When on, the ruler follows the shortest path around walls and closed doors instead of a straight line">↪ Route around walls: ${tbRoute?'ON':'OFF'}</button></div>
 <div class="meta">With the ruler (📏), drag to measure. Hold Shift and press again to continue from the end with another leg. Select a token and press <b>Show range</b> to shade how far it can move. If the token carries a weapon, the ruler also names the range band.</div>`+(typeof tbRngMsr==='function'?tbRngMsr(m):'')+tbMarkPanel()}

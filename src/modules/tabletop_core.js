// ---- Tabletop: a shared battle map with a fitted grid, tokens, manual fog of war, a ruler and pings.
// The GM uploads a map and fits the grid. Everybody can move tokens. Players add their own character; the GM adds everything else.
// Collections: tbmaps (maps), tbtoks (tokens), tbfog (revealed squares per map), tbmeta/state (which map the players see), tblib (saved tokens), tbping (pings).
const TBX={};// extra Tabletop actions registered by add-on modules: TBX.name=(x,m,t,e)=>...
const TB_K={pc:['Character','var(--cy)'],npc:['NPC','var(--am)'],enemy:['Enemy','var(--red)'],item:['Item','#39ff14'],prop:['Prop','#9d8cff']};
const TB_COLS=['#ff3b3b','#ff9f1c','#ffd60a','#39ff14','#00f0d0','#3a86ff','#9d8cff','#ff2d95','#e8e8e8','#7a7a7a'];
const TB_GC={l:['Light','255,255,255',.38],d:['Dark','0,0,0',.55],c:['Cyan','0,240,208',.5],m:['Magenta','255,45,149',.5]};
let tbV={x:0,y:0,z:1},tbSel=null,tbTS=[],tbMq=null,tbTool='move',tbDrag=null,tbPan=null,tbPts=new Map(),tbPinch=null,tbRul=null,tbRub=null,tbPaint=null,tbShpD=null,tbGrid=null,tbShown='',tbFog={mode:'rev',shape:'brush',n:1},tbFogD=null,tbHideGrid=false,tbSeenP={},tbGq=0;
const tbNum=(v,lo,hi,d)=>{v=parseFloat(v);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
// per-person view settings (kept in this browser): grid line strength, GM fog preview, map area size, side panel
let tbGO=tbNum(tbLS('sr_tbgo','50'),0,100,50),tbFD=tbNum(tbLS('sr_tbfd','120'),10,240,120),tbH=tbNum(tbLS('sr_tbh','0'),0,3000,0),tbPW=tbNum(tbLS('sr_tbpw','0'),0,640,0),tbW=tbNum(tbLS('sr_tbw','0'),0,4000,0),tbPC=tbLS('sr_tbpc','')==='1',tbXP=false,tbRO=null,tbSpace=false,tbRs=null,tbOpenS={cmb:1,tok:1,sel:1,msr:1,shp:1,fog:1,gmt:1,gmv:1,view:1,grid:0};if(innerWidth<=700)tbOpenS={cmb:1,tok:1,sel:1,msr:0,shp:0,fog:0,gmt:0,gmv:0,view:0,grid:0};
// grid geometry: squares are numbered from the top-left corner of the picture; the grid origin sits at or before the picture edge
function tbGeo(m,d){d=d||m;const gs=Math.max(8,+d.gs||50),gx=(((+d.gx||0)%gs)+gs)%gs,gy=(((+d.gy||0)%gs)+gs)%gs,ox=gx>0?gx-gs:0,oy=gy>0?gy-gs:0;
 return {gs,ox,oy,cols:Math.max(1,Math.ceil((m.w-ox)/gs)),rows:Math.max(1,Math.ceil((m.h-oy)/gs))}}
const tbGeoM=m=>tbGeo(m,tbGrid&&tbGrid.id===m.id?tbGrid:m);
const tbInit=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const tbFmt=n=>{const r=Math.round(n*10)/10;return String(r)};
// ---- fog of war
const tbFogOn=m=>!!m&&m.fog===true;
function tbFogRows(m,g){if(tbFogD&&tbFogD.id===m.id&&tbFogD.cols===g.cols&&tbFogD.n===g.rows)return tbFogD.a;
 const d=(pm.tbfog||[]).find(x=>x&&x.id===m.id),src=(d&&Array.isArray(d.rows))?d.rows:[],a=[];
 for(let r=0;r<g.rows;r++){const s=String(src[r]||''),u=new Uint8Array(g.cols);for(let c=0;c<g.cols&&c<s.length;c++)u[c]=s.charCodeAt(c)===49?1:0;a.push(u)}return a}
const tbFogStr=a=>a.map(u=>Array.prototype.join.call(u,''));
function tbFogCanvas(m,g,rows){const c=$('#tbfogc');if(!c)return;if(!rows){c.style.display='none';return}
 c.style.display='block';c.style.left=g.ox+'px';c.style.top=g.oy+'px';c.style.width=g.cols*g.gs+'px';c.style.height=g.rows*g.gs+'px';
 if(c.width!==g.cols)c.width=g.cols;if(c.height!==g.rows)c.height=g.rows;
 const x=c.getContext('2d'),im=x.createImageData(g.cols,g.rows),al=isOwner?Math.round(tbFD):255;
 for(let r=0;r<g.rows;r++)for(let k=0;k<g.cols;k++){if(!rows[r][k])im.data[(r*g.cols+k)*4+3]=al}
 x.putImageData(im,0,0)}
function tbSees(t,g,rows){if(isOwner)return true;if(t.hid)return false;if(!rows||t.kind==='pc')return true;
 const sz=Math.max(.5,+t.sz||1),c=Math.max(0,Math.min(g.cols-1,Math.floor((+t.c||0)+sz/2-.01))),r=Math.max(0,Math.min(g.rows-1,Math.floor((+t.r||0)+sz/2-.01)));return !!(rows[r]&&rows[r][c])}
// ---- the page
function tbViewHtml(){return `<label class="tbsl">Grid lines <span class="meta" id="tbgov">${tbGO}%</span><input type="range" id="tbgo" min="0" max="100" value="${tbGO}"></label>
 <label class="tbsl" data-gm="1">Fog, as you see it <span class="meta" id="tbfdv">${Math.round(tbFD/2.4)}%</span><input type="range" id="tbfd" min="10" max="240" value="${tbFD}"></label>
 <label class="tbsl">Shape fill <span class="meta" id="tbsfv">${Math.round(tbShFill/.8)}%</span><input type="range" id="tbsf" min="0" max="80" value="${tbShFill}"></label>
 <div class="tbvb"><button class="btn sm" data-tbx="shpfmt" id="tbslb" title="Show or hide the size written on each shape">Shape sizes: on</button></div>
 <div class="tbvb"><button class="btn sm" data-tbx="grid:p" id="tbgb">▦ Grid on</button><button class="btn sm" data-tbx="fit:p">⤢ Fit map</button><button class="btn sm" data-tbx="shape" title="Make the map area the same shape as the map">↕ Match map shape</button><button class="btn sm" data-tbx="expand:p" id="tbxb">⛶ Full window</button><button class="btn sm" data-tbx="rsz" title="Back to the standard size">Reset size</button></div>
 <div class="meta">Make the map area bigger: drag the bar under the map to change its height, drag the divider beside it to change this panel's width, or use <b>Full window</b>. Right-click drag, middle-click drag or holding Space pans in any mode.</div>`}
function tbGridHtml(){return `<div class="meta" style="margin-bottom:6px">Make the squares bigger or smaller to suit your map. Changes show in cyan until you press <b>Save grid</b>.</div>
 <label class="tbsl">Square size <span class="meta" id="tbg-v"></span><input type="range" id="tbg-rng" min="8" max="300" step="0.5" value="50"></label>
 <div class="tbvb"><button class="btn sm" data-tbx="gscale:0.95">− Smaller</button><button class="btn sm" data-tbx="gscale:1.05">＋ Bigger</button><button class="btn sm" data-tbx="gsq" id="tbgsq" title="Drag a box over one square on the map and the grid snaps to it">▭ Draw one square</button></div>
 <div class="tbgf"><label>Square size (px)<input type="number" id="tbg-gs" step="0.1" min="8"></label><label>Squares across<input type="number" id="tbg-cols" step="0.1" min="1"></label><label>Shift right (px)<input type="number" id="tbg-gx" step="1"></label><label>Shift down (px)<input type="number" id="tbg-gy" step="1"></label></div>
 <div class="tbvb"><span class="meta">Nudge:</span><button class="btn sm" data-tbx="nudge:-1:0" aria-label="Nudge left">◀</button><button class="btn sm" data-tbx="nudge:1:0" aria-label="Nudge right">▶</button><button class="btn sm" data-tbx="nudge:0:-1" aria-label="Nudge up">▲</button><button class="btn sm" data-tbx="nudge:0:1" aria-label="Nudge down">▼</button><span class="meta">Shift = 10 px</span></div>
 <div class="tbvb"><button class="btn sm grn" data-tbx="gsave" id="tbgsv">Save grid</button><button class="btn sm" data-tbx="gcancel" id="tbgcx">Reset</button></div>
 <div class="meta" id="tbgst"></div><div class="meta" style="margin-top:4px">Tokens stay on their squares when the grid changes. If the number of squares changes, any fog is cleared.</div>`}
function tbPage(){tbDrag=tbPan=tbPaint=tbRul=tbRub=tbPinch=tbRs=tbShpD=tbShMv=tbShRz=tbMq=tbWD=tbLyD=null;tbTS=[];tbPts.clear();tbShown='';tbFogD=null;tbXP=false;if(tbRO){try{tbRO.disconnect()}catch(e){}tbRO=null}
 const S=(id,ic,tt,gm,body)=>`<details class="tbsec" data-tbd="${id}" ${tbOpenS[id]?'open':''} ${gm?'data-gm="1"':''}><summary>${ic} ${tt}</summary><div class="tbpb">${body}</div></details>`;
 $('#view').innerHTML=`<div id="tbroot"><div class="bar"><h2>♟ TABLETOP</h2><div id="tbhd"></div></div>
 <div id="tbstage"><div id="tbrail"></div>
 <div id="tbcol"><div id="tbview" class="tool-${tbTool}"><div id="tbmw"><img id="tbimg" alt="" draggable="false"><div id="tbly"></div></div><canvas id="tbgrid"></canvas>
 <div id="tbtw"><svg id="tbshp"></svg><svg id="tbaura"></svg><svg id="tbrange"></svg><canvas id="tbfogc"></canvas><svg id="tbwalls"></svg><div id="tbtoks"></div><div id="tbgh"></div><div id="tbnotes"></div><svg id="tbsvg"></svg><div id="tbmarks"></div><div id="tbpings"></div></div>
 <div id="tbtoast"></div><div id="tbturn"></div><div id="tbzoom"><button class="tbb" data-tbx="zout" title="Zoom out" aria-label="Zoom out">−</button><span id="tbzl">100%</span><button class="tbb" data-tbx="zin" title="Zoom in" aria-label="Zoom in">+</button><button class="tbb" data-tbx="mine" title="Centre the view on my character" aria-label="Centre on my character">⌖</button></div><div id="tbempty"></div></div>
 <div id="tbvh" title="Drag up or down to make the map area shorter or taller"><i></i></div></div>
 <div id="tbdiv" title="Drag left or right to change the width of the options panel"></div>
 <aside id="tbpanel">
${S('cmb','⚔️','Combat',0,'<div id="tbcmb"></div>')}
 ${S('tok','🎯','Tokens on this map <span class="meta" id="tbtn"></span>',0,'<input id="tbtq" placeholder="Find a token…"><div id="tbtl"></div><div class="tbtbtns"><button class="btn sm grn" data-tbx="addtok:p">＋ Add token</button><button class="btn sm" data-tbx="selall" title="Select every token you can see (Ctrl+Shift+A)">Select all</button><button class="btn sm" data-tbx="clr" data-gmx="1">Clear encounter</button></div>')}
 ${S('chs','🏁','Chase',0,'<div id="tbchs"></div>')}
 ${S('sel','🔘','Selected token',0,'<div id="tbsel"></div>')}
 ${S('msr','📏','Measure and move',0,'<div id="tbmsr"></div>')}
 ${S('shp','✏️','Draw shapes',0,'<div id="tbshpp"></div>')}
 ${S('fog','🌫','Fog of war',1,'<div id="tbfogp"></div>')}
 ${S('gmt','🧭','GM tools and notes',1,'<div id="tbgmp"></div>')}
 ${S('gmv','🗺','Views, layers and files',1,'<div id="tbgmv"></div>')}
 ${S('view','👁','View and size',0,tbViewHtml())}
 ${S('grid','▦','Grid and scale',1,tbGridHtml())}
 </aside></div><input type="file" id="tbfile" accept="image/*" hidden><input type="file" id="tblyf" accept="image/*" hidden><input type="file" id="tbmpf" accept=".json,application/json" hidden><div id="tbhw" class="hwid" title="Drag left or right to make the whole Tabletop wider or narrower"><i></i></div></div>`;
 tbBind();tbSizeApply();const v=$('#tbview');if(window.ResizeObserver&&v){tbRO=new ResizeObserver(()=>tbGridQ());tbRO.observe(v)}
 tbDraw()}
function tbSizeApply(){const r=$('#tbroot');if(!r)return;if(tbH>0)r.style.setProperty('--tbh',tbH+'px');else r.style.removeProperty('--tbh');if(tbPW>0)r.style.setProperty('--tbpw',tbPW+'px');else r.style.removeProperty('--tbpw');if(tbW>0)r.style.setProperty('--bw',tbW+'px');else r.style.removeProperty('--bw');r.classList.toggle('tbpc',tbPC);r.classList.toggle('tbfull',tbXP)}
function tbViewSync(){const g=$('#tbgb');if(g){g.textContent=tbHideGrid?'▦ Grid off':'▦ Grid on';g.classList.toggle('on',!tbHideGrid)}const sl=$('#tbslb');if(sl){sl.textContent='Shape sizes: '+(tbShLab?'on':'off');sl.classList.toggle('on',tbShLab)}const x=$('#tbxb');if(x){x.textContent=tbXP?'⛶ Leave full window':'⛶ Full window';x.classList.toggle('on',tbXP)}}
function tbSig(el,h){if(!el)return false;if(el._h===h)return false;el._h=h;el.innerHTML=h;return true}
function tbHead(m){const el=$('#tbhd');if(!el)return;const act=tbActive(),L=tbMaps();let h='';
 if(isOwner){h=(L.length?`<select id="tbmsel" title="Which map you are looking at">${L.map(x=>`<option value="${esc(x.id)}" ${m&&x.id===m.id?'selected':''}>${esc(x.name||'Map')}${act&&x.id===act.id?' ★':''}</option>`).join('')}</select> `:'')+
  `<button class="btn sm" data-tbx="addmap">⬆ Add map</button>`+(m?` <button class="btn sm" data-tbx="mset">⚙ Map settings</button>`:'')+
  (m&&(!act||act.id!==m.id)?` <button class="btn sm grn" data-tbx="send">👁 Show players this map</button>`:'')+(m&&act&&act.id===m.id?' <span class="meta">★ players see this map</span>':'')}
 else h=m?`<span class="meta">${esc(m.name||'Map')}</span>`:'';
 tbSig(el,h)}
function tbRail(m){const el=$('#tbrail');if(!el)return;const T=(id,ic,tt)=>`<button class="tbb ${tbTool===id?'on':''}" data-tbx="tool:${id}" title="${tt}">${ic}</button>`;
 tbSig(el,m?(`<button class="tbb add" data-tbx="addtok" title="Add a token to the map">＋</button>`+T('move','✋','Move tokens and pan the map')+T('ruler','📏','Measure a distance')+T('ping','📍','Ping a spot so everyone sees it')+T('mark','🏷','Drop a marker that fades by itself, like checking here or target (key K)')+T('select','⬚','Select several tokens: drag a box around them (or hold Shift and drag in the Move tool)')+T('shape','✏️','Draw a shape: rectangle, circle, cone, ring or emanation')+T('attack','⚔','Attack: click your attacker, then the target')+T('erase','🧽','Erase a shape (yours; the GM can erase any)')+(isOwner?T('fog','🌫','Fog of war: reveal or hide squares')+T('look','🔭','Look here: click a spot to bring every player there')+T('wall','🧱','Draw walls and doors (key W)')+T('note','📌','Pin a hidden note to the map'):'')+
  `<button class="tbb ${tbHideGrid?'':'on'}" data-tbx="grid" title="Show or hide the grid (only for you)">▦</button><button class="tbb" data-tbx="fit" title="Fit the whole map in view">⤢</button><button class="tbb ${tbXP?'on':''}" data-tbx="expand" title="Full-window map (Esc to leave)">⛶</button><button class="tbb ${tbPC?'':'on'}" data-tbx="pcol" title="Show or hide the options panel">☰</button>`):'')}
function tbDraw(){const root=$('#tbroot');if(!root||tbDrag||tbPaint||tbPinch||tbShpD||tbShMv||tbShRz||tbMq||tbLyD)return;
 tbSelNorm();const m=tbCur();if(!isOwner&&tbVid)tbVid='';
 tbHead(m);tbRail(m);
 const em=$('#tbempty'),mw=$('#tbmw'),tw=$('#tbtw');
 if(!m){mw.style.display=tw.style.display='none';em.style.display='flex';
  em.innerHTML=isOwner?`<div><div style="font-size:42px">♟</div><b>No map yet.</b><div class="meta" style="margin:6px 0 12px">Upload a picture of a battle map, then line the grid up with it.</div><button class="btn grn" data-tbx="addmap">⬆ Upload a map</button></div>`:`<div><div style="font-size:42px">♟</div><b>The table is empty.</b><div class="meta" style="margin-top:6px">The GM has not put a map on the table yet.</div></div>`;
  tbShown='';tbGridDraw();tbBar(null);return}
 em.style.display='none';mw.style.display=tw.style.display='';
 const g=tbGeoM(m),fresh=tbShown!==m.id;
 if(fresh){tbShown=m.id;tbSel=null;tbTS=[];tbRul=null;tbFogD=null;if(tbGrid&&tbGrid.id!==m.id)tbGrid=null}
 mw.style.width=tw.style.width=m.w+'px';mw.style.height=tw.style.height=m.h+'px';
 const sv=$('#tbsvg');sv.setAttribute('width',m.w);sv.setAttribute('height',m.h);
 const im=$('#tbimg'),src='/_blob/'+tbOk(m.img);if(im.getAttribute('src')!==src)im.setAttribute('src',src);
 const rows=tbFogOn(m)?tbFogRows(m,g):null;tbFogCanvas(m,g,rows);tbAuraDraw(m,g,rows);tbRangeDraw();tbWallsDraw(m,g,rows);tbLayersDraw(m);
 const tk=$('#tbtoks'),ini=tbIniCur(),html=tbToks(m).filter(t=>tbSees(t,g,rows)).sort((a,b)=>(+a.ts||0)-(+b.ts||0)).map(t=>tbTokHtml(t,g,ini)).join('');
 if(tk._h!==html){const old={};tk.querySelectorAll('.tbt').forEach(e=>{old[e.dataset.tbt]=[e.style.left,e.style.top]});tk._h=html;tk.innerHTML=html;
  tk.querySelectorAll('.tbt').forEach(e=>{const o=old[e.dataset.tbt];if(o&&(o[0]!==e.style.left||o[1]!==e.style.top)){const L=e.style.left,T=e.style.top;e.style.transition='none';e.style.left=o[0];e.style.top=o[1];void e.offsetWidth;e.style.transition='';e.style.left=L;e.style.top=T}})}
 if(tbSel&&!tbTok(tbSel))tbSel=null;
 tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('sel',tbTS.includes(e.dataset.tbt)));
 if(fresh)tbFit();else tbApply();
 tbShpDraw();tbNotesDraw(m);tbRulDraw();tbBar(m);tbPingChk();tbTurnDraw();tbLookChk();tbVisChk();tbMarksDraw();tbJumpChk()}
function tbIniCur(){try{if(!iniM.active)return null;return iniList().find(x=>x.id===iniM.cur)||null}catch(e){return null}}
function tbTokHtml(t,g,ini){const sz=Math.max(.5,Math.min(8,+t.sz||1)),px=sz*g.gs,l=g.ox+(+t.c||0)*g.gs,tp=g.oy+(+t.r||0)*g.gs,k=TB_K[t.kind]||TB_K.prop,col=tbColOk(t.col)||k[1],
  sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet&&!s.deleted):null,img=tbOk(sh&&sh.img)||tbOk(t.img),nm=(sh&&sh.name)||t.name||'?',
  turn=!!ini&&((t.sheet&&ini.sheet===t.sheet)||(!t.sheet&&!ini.sheet&&String(ini.name||'').toLowerCase()===String(t.name||'').toLowerCase()));
 let wd='';if(sh){try{const w=Math.min(shWM(sh),+sh.wounds||0);if(w>0)wd=`<span class="tbw" title="Wounds">−${w}</span>`}catch(e){}}
 return `<div class="tbt k-${esc(t.kind||'prop')}${t.lock?' lk':''}${t.mark==='down'?' dn':''}${t.hid?' hd':''}${turn?' turn':''}${typeof tbRigCls==='function'?tbRigCls(t):''}" data-tbt="${esc(t.id)}" title="${esc(nm+(tbCndOf(t).length?' ['+tbCndOf(t).map(k=>TB_CND.find(c=>c[0]===k)[2]).join(', ')+']':'')+(t.note?' · '+t.note:''))}" style="left:${l}px;top:${tp}px;width:${px}px;height:${px}px;--k:${col}"><div class="tbi" style="${img?`background-image:url('/_blob/${img}')`:`background:${col}33`}">${img?'':(t.emoji?`<span style="font-size:${Math.round(px*.56)}px;line-height:1">${esc(t.emoji)}</span>`:`<b style="font-size:${Math.round(px*.4)}px">${esc(tbInit(nm))}</b>`)}</div>${wd}${typeof tbRigBadge==='function'?tbRigBadge(t,px):''}${tbCndHtml(t,px)}${tbHpBar(t)}${t.mark==='down'?'<span class="tbx">✖</span>':''}${t.lock?'<span class="tbk">🔒</span>':''}<span class="tbl">${esc(nm)}</span></div>`}
// ---- view: pan, zoom, grid lines
function tbApply(){const a=$('#tbmw'),b=$('#tbtw');if(!a||!b)return;const t=`translate(${tbV.x}px,${tbV.y}px) scale(${tbV.z})`;a.style.transform=b.style.transform=t;b.style.setProperty('--iz',String(1/tbV.z));try{const mm=tbCur(),gz=mm?tbGeoM(mm).gs*tbV.z:99;b.classList.toggle('lowz',gz<46)}catch(e){}if(tbShS.length&&tbApply._z!==tbV.z){tbApply._z=tbV.z;tbRulDraw()}tbGridQ();const z=$('#tbzl');if(z)z.textContent=Math.round(tbV.z*100)+'%'}
function tbGridQ(){if(tbGq)return;tbGq=requestAnimationFrame(()=>{tbGq=0;tbGridDraw();tbShpDraw()})}
function tbGridDraw(){const c=$('#tbgrid'),v=$('#tbview');if(!c||!v)return;const dpr=window.devicePixelRatio||1,W=v.clientWidth,H=v.clientHeight;
 if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);c.style.width=W+'px';c.style.height=H+'px'}
 const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);const m=tbCur();if(!m||(m.grid===false&&!tbGrid)||(tbHideGrid&&!tbGrid))return;
 const g=tbGeoM(m),s=g.gs*tbV.z;if(s<5)return;x.setTransform(dpr,0,0,dpr,0,0);
 const gc=TB_GC[m.gc]||TB_GC.l,ga=Math.min(1,gc[2]*tbGO/50);if(!tbGrid&&ga<.01)return;x.strokeStyle=tbGrid?'rgba(0,240,208,.9)':`rgba(${gc[1]},${ga})`;x.lineWidth=tbGrid?1.5:1;x.beginPath();
 const X0=tbV.x,Y0=tbV.y,X1=tbV.x+m.w*tbV.z,Y1=tbV.y+m.h*tbV.z,q=v=>Math.round(v)+.5;
 for(let k=0;k<=g.cols;k++){const wx=g.ox+k*g.gs;if(wx<0||wx>m.w)continue;const sx=q(tbV.x+wx*tbV.z);x.moveTo(sx,Math.max(0,Y0));x.lineTo(sx,Math.min(H,Y1))}
 for(let k=0;k<=g.rows;k++){const wy=g.oy+k*g.gs;if(wy<0||wy>m.h)continue;const sy=q(tbV.y+wy*tbV.z);x.moveTo(Math.max(0,X0),sy);x.lineTo(Math.min(W,X1),sy)}
 x.stroke()}
function tbFit(){const m=tbCur(),v=$('#tbview');if(!m||!v)return;const W=v.clientWidth||600,H=v.clientHeight||400,z=Math.max(.05,Math.min(4,Math.min((W-24)/m.w,(H-24)/m.h)));tbV={z,x:(W-m.w*z)/2,y:(H-m.h*z)/2};tbApply()}
function tbZoom(f,cx,cy){const v=$('#tbview');if(!v)return;const r=v.getBoundingClientRect(),px=cx==null?v.clientWidth/2:cx-r.left,py=cy==null?v.clientHeight/2:cy-r.top,z0=tbV.z,z=Math.max(.05,Math.min(5,z0*f));tbV.x=px-(px-tbV.x)*(z/z0);tbV.y=py-(py-tbV.y)*(z/z0);tbV.z=z;tbApply()}
function tbPt(e){const v=$('#tbview'),r=v.getBoundingClientRect();return {x:(e.clientX-r.left-tbV.x)/tbV.z,y:(e.clientY-r.top-tbV.y)/tbV.z}}
const tbCell=(g,p)=>({c:Math.floor((p.x-g.ox)/g.gs),r:Math.floor((p.y-g.oy)/g.gs)});
// ---- pointer handling
function tbBind(){const v=$('#tbview');
 v.addEventListener('pointerdown',tbDown);v.addEventListener('pointermove',tbMove);v.addEventListener('pointerup',tbUp);v.addEventListener('pointercancel',tbUp);
 v.addEventListener('wheel',e=>{e.preventDefault();tbZoom(e.deltaY<0?1.14:1/1.14,e.clientX,e.clientY)},{passive:false});
 v.addEventListener('contextmenu',e=>{e.preventDefault();try{tbCtxMenu(e)}catch(x){}});v.addEventListener('pointerleave',()=>{tbLP=null});
 const rs=(el,start,move)=>{if(!el)return;el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(x){}tbRs=start(e);tbRs.pid=e.pointerId});el.addEventListener('pointermove',e=>{if(tbRs&&tbRs.pid===e.pointerId)move(e)});const end=e=>{if(tbRs&&tbRs.pid===e.pointerId){tbRs=null;try{el.releasePointerCapture(e.pointerId)}catch(x){}}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)};
 rs($('#tbvh'),e=>({y:e.clientY,h:$('#tbview').offsetHeight}),e=>{tbH=Math.round(tbNum(tbRs.h+e.clientY-tbRs.y,240,3000,tbRs.h));tbSizeApply();tbLSset('sr_tbh',tbH)});
 rs($('#tbhw'),e=>({x:e.clientX,w:$('#tbroot').offsetWidth}),e=>{const mx=Math.max(520,($('#view').clientWidth||900)-32);tbW=Math.round(tbNum(tbRs.w+e.clientX-tbRs.x,520,mx,tbRs.w));tbSizeApply();tbLSset('sr_tbw',tbW)});
 rs($('#tbdiv'),e=>({x:e.clientX,w:$('#tbpanel').offsetWidth}),e=>{tbPW=Math.round(tbNum(tbRs.w-(e.clientX-tbRs.x),200,640,tbRs.w));tbSizeApply();tbLSset('sr_tbpw',tbPW)});
 v.addEventListener('dblclick',e=>{if(e.target.closest('#tbzoom,#tbempty,#tbturn'))return;const hit=document.elementFromPoint(e.clientX,e.clientY),tEl=hit&&hit.closest('[data-tbt]');
  if(tEl){const t=tbTok(tEl.dataset.tbt);if(!t)return;if(isOwner)tbEdit(t);else tbOpenSheet(t);return}
  if(tbTool==='move'){const p=tbPt(e);tbPing(p.x,p.y)}})}
function tbDown(e){if(e.button>2)return;if(e.target.closest('#tbzoom,#tbempty,#tbturn'))return;const v=$('#tbview');if(e.button===2)tbCtxV={x:tbV.x,y:tbV.y};try{tbLongStart(e)}catch(x){}tbPts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{v.setPointerCapture(e.pointerId)}catch(x){}
 if(tbPts.size===2){tbPinchStart();return}if(tbPts.size>2)return;
 const m=tbCur();if(!m)return;const g=tbGeoM(m),p=tbPt(e),tEl=e.target.closest('[data-tbt]'),alt=e.button===1||e.button===2||tbSpace;
 if(alt){tbPan={sx:e.clientX,sy:e.clientY,vx:tbV.x,vy:tbV.y,moved:true,pid:e.pointerId};v.classList.add('pan');e.preventDefault();return}
 if(tbGrid&&tbGrid.sq){tbRub={x0:p.x,y0:p.y,x1:p.x,y1:p.y,pid:e.pointerId};tbRubDraw();e.preventDefault();return}
 if(tbTool==='shape'&&!tbGrid&&tbShp.pre&&tbShp.pre.k==='circle'&&typeof tbTplDrop==='function'){tbTplDrop(m,g,p,e);e.preventDefault();return}
 if(tbTool==='shape'&&!tbGrid){tbShpStart(m,g,p,tEl,e.pointerId,e);e.preventDefault();return}
 if(tbTool==='erase'&&!tbGrid){tbShpErase(m,g,p);e.preventDefault();return}
 if(tbTool==='ruler'){const s=tbSnapC(g,p);
  if(e.shiftKey&&tbRul&&(tbRul.path||[]).length<10){tbRul.path.push([tbRul.x0,tbRul.y0]);tbRul.x0=tbRul.x1;tbRul.y0=tbRul.y1;tbRul.x1=s.x;tbRul.y1=s.y;tbRul.pid=e.pointerId}
  else tbRul={x0:s.x,y0:s.y,x1:s.x,y1:s.y,pid:e.pointerId,path:[]};
  tbRulDraw();e.preventDefault();return}
 if(tbTool==='attack'&&!tbGrid&&typeof tbAtkClick==='function'){tbAtkClick(m,tEl,e);e.preventDefault();return}
 if(tbTool==='ping'){tbPing(p.x,p.y);return}
 if(tbTool==='mark'&&!tbGrid){tbMarkPlace(p);return}
 if(tbTool==='look'&&isOwner&&!tbGrid){tbLookSend(p.x,p.y,0);return}
 if(tbTool==='wall'&&isOwner&&!tbGrid){tbWallStart(m,g,p,e);e.preventDefault();return}
 if(tbTool==='wallx'&&isOwner&&!tbGrid){tbWallErase(m,g,p);e.preventDefault();return}
 if(isOwner&&tbLyEdit&&!tEl&&!tbGrid&&(tbTool==='move'||tbTool==='select')&&tbLyDown(m,p,e)){e.preventDefault();return}
 if(isOwner&&!tEl&&!tbGrid&&(tbTool==='move'||tbTool==='select')){const di=tbWallNear(m,g,p,true);if(di>=0){tbDoorToggle(m,di,!!(e.shiftKey||e.ctrlKey||e.metaKey));e.preventDefault();return}}
 if(tbTool==='note'&&isOwner&&!tbGrid){tbNoteNew(p.x,p.y);tbAct('tool','move');return}
 if(tbTool==='fog'&&isOwner&&!tEl&&!tbGrid){tbPaintStart(m,g,p,e.pointerId);e.preventDefault();return}
 {const nEl=e.target.closest&&e.target.closest('[data-tbn]');if(nEl&&!tEl&&!tbGrid){tbPan={sx:e.clientX,sy:e.clientY,vx:tbV.x,vy:tbV.y,moved:false,pid:e.pointerId,note:nEl.dataset.tbn};v.classList.add('pan');return}}
 if(!tEl&&!tbGrid&&(tbTool==='select'||(tbTool==='move'&&(e.shiftKey||e.ctrlKey||e.metaKey)))&&!tbShpAll(m).some(s=>tbShpHas(s,g,p))){tbMqStart(e,p);e.preventDefault();return}
 if(tEl){const t=tbTok(tEl.dataset.tbt);if(!t)return;
  if(e.shiftKey||e.ctrlKey||e.metaKey){tbSelToggle(t.id);e.preventDefault();return}
  tbSelNorm();const inGrp=tbTS.length>1&&tbTS.includes(t.id);if(!inGrp)tbTS=[t.id];tbSel=t.id;if(tbShS.length){tbShS=[];tbRulDraw()}
  $('#tbtoks').querySelectorAll('.tbt').forEach(x=>x.classList.toggle('sel',tbTS.includes(x.dataset.tbt)));tbBar(m);
  if(t.lock&&!isOwner)return;
  const grp=inGrp?tbTS.map(tbTok).filter(x=>x&&!(x.lock&&!isOwner)).map(x=>{const el=$('#tbtoks').querySelector('[data-tbt="'+x.id+'"]');return el?{id:x.id,el,l:parseFloat(el.style.left),t:parseFloat(el.style.top)}:null}).filter(Boolean):null;
  tbDrag={id:t.id,sx:e.clientX,sy:e.clientY,l:parseFloat(tEl.style.left),t:parseFloat(tEl.style.top),moved:false,el:tEl,pid:e.pointerId,group:grp&&grp.length>1?grp:null,collapse:inGrp};e.preventDefault();return}
 if((tbTool==='move'||tbTool==='select')&&!tbGrid&&tbShpDownHit(m,g,p,e))return;
 tbPan={sx:e.clientX,sy:e.clientY,vx:tbV.x,vy:tbV.y,moved:false,pid:e.pointerId};v.classList.add('pan')}
function tbMove(e){if(tbPts.has(e.pointerId))tbPts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{tbLongMove(e)}catch(x){}try{tbLP=tbPt(e)}catch(x){}
 if((tbShRz&&e.pointerId===tbShRz.pid)||(tbShMv&&e.pointerId===tbShMv.pid)){tbShpDragMove(tbPt(e));return}
 if(tbPinch){tbPinchMove();return}
 if(tbDrag&&e.pointerId===tbDrag.pid){const dx=(e.clientX-tbDrag.sx)/tbV.z,dy=(e.clientY-tbDrag.sy)/tbV.z;if(!tbDrag.moved&&Math.abs(dx)+Math.abs(dy)<5/tbV.z)return;tbDrag.moved=true;
  const el=tbDrag.el;
  if(tbDrag.group){tbDrag.group.forEach(o=>{o.el.classList.add('drag');o.el.style.left=(o.l+dx)+'px';o.el.style.top=(o.t+dy)+'px';tbAuraDrag(o.id,dx,dy)})}
  else{el.classList.add('drag');el.style.left=(tbDrag.l+dx)+'px';el.style.top=(tbDrag.t+dy)+'px';tbAuraDrag(tbDrag.id,dx,dy)}
  tbGhost(el);return}
 if(tbPan&&e.pointerId===tbPan.pid){const dx=e.clientX-tbPan.sx,dy=e.clientY-tbPan.sy;if(Math.abs(dx)+Math.abs(dy)>3)tbPan.moved=true;tbV.x=tbPan.vx+dx;tbV.y=tbPan.vy+dy;tbApply();return}
 if(tbShpD&&e.pointerId===tbShpD.pid){tbShpMove(tbPt(e));return}
 if(tbRub&&e.pointerId===tbRub.pid){const p=tbPt(e);tbRub.x1=p.x;tbRub.y1=p.y;tbRubDraw();return}
 if(tbRul&&tbRul.pid===e.pointerId){const m=tbCur(),s=tbSnapC(tbGeoM(m),tbPt(e));tbRul.x1=s.x;tbRul.y1=s.y;tbRulDraw();tbRulTx(false);return}
 if(tbMq&&e.pointerId===tbMq.pid){tbMqMove(tbPt(e));return}
 if(tbLyD&&e.pointerId===tbLyD.pid){tbLyMove(tbPt(e));return}
 if(tbWD&&e.pointerId===tbWD.pid){tbWallMove(tbPt(e));return}
 if(tbPaint&&e.pointerId===tbPaint.pid){tbPaintMove(tbPt(e));return}}
function tbUp(e){const v=$('#tbview');tbLongEnd();try{tbCtxFlush()}catch(x){}tbPts.delete(e.pointerId);try{v.releasePointerCapture(e.pointerId)}catch(x){}
 if(tbPinch){if(tbPts.size<2)tbPinch=null;tbPan=null;tbDrag=null;v.classList.remove('pan');setTimeout(()=>tbDraw(),0);return}
 if(tbDrag&&e.pointerId===tbDrag.pid){const d=tbDrag;tbDrag=null;tbGhost(null);const t=tbTok(d.id),m=tbCur();d.el.classList.remove('drag');
  if(d.group&&d.moved&&t&&m){tbGroupDrop(d,t,m);tbDraw();return}
  if(!d.moved&&d.collapse&&t){tbTS=[t.id];tbSel=t.id;tbSelPaint()}
  if(d.moved&&t&&m){const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),need=Math.max(1,Math.ceil(sz)),c=Math.max(0,Math.min(g.cols-need,Math.round((parseFloat(d.el.style.left)-g.ox)/g.gs))),r=Math.max(0,Math.min(g.rows-need,Math.round((parseFloat(d.el.style.top)-g.oy)/g.gs)));
   const oc=t.c,orr=t.r;t.c=c;t.r=r;tbMoveWrite(t.id,c,r);if(oc!==c||orr!==r)tbTokMoveHist(t,oc,orr);$('#tbtoks')._h=''}
  if(d.moved)tbDraw();return}
 if(tbPan&&e.pointerId===tbPan.pid){const p=tbPan;tbPan=null;v.classList.remove('pan');if(!p.moved&&p.note){tbNoteOpen(p.note);return}if(!p.moved&&(tbSel||tbShS.length)){tbSel=null;tbTS=[];tbShS=[];tbDraw();tbRulDraw()}return}
 if(tbMq&&e.pointerId===tbMq.pid){tbMqEnd();return}
 if(tbLyD&&e.pointerId===tbLyD.pid){tbLyEnd();return}
 if(tbWD&&e.pointerId===tbWD.pid){tbWallEnd();return}
 if(tbRul&&e.pointerId===tbRul.pid){tbRulTx(true);return}
 if(tbShpD&&e.pointerId===tbShpD.pid){tbShpEnd();return}
 if((tbShRz&&e.pointerId===tbShRz.pid)||(tbShMv&&e.pointerId===tbShMv.pid)){tbShpDragEnd();return}
 if(tbRub&&e.pointerId===tbRub.pid){tbRubDone();return}
 if(tbPaint&&e.pointerId===tbPaint.pid){tbPaintEnd();return}}
function tbMoveWrite(id,c,r){try{db.doc('tbtoks/'+id).update({c,r,mv:Date.now(),mvby:handle||'?'}).catch(()=>{})}catch(e){}}
function tbGhost(el){const gh=$('#tbgh');if(!gh)return;if(!el){gh.style.display='none';return}const m=tbCur(),t=m&&tbTok(el.dataset.tbt);if(!m||!t)return;const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),need=Math.max(1,Math.ceil(sz)),
  c=Math.max(0,Math.min(g.cols-need,Math.round((parseFloat(el.style.left)-g.ox)/g.gs))),r=Math.max(0,Math.min(g.rows-need,Math.round((parseFloat(el.style.top)-g.oy)/g.gs)));
 gh.style.display='block';gh.style.left=g.ox+c*g.gs+'px';gh.style.top=g.oy+r*g.gs+'px';gh.style.width=gh.style.height=sz*g.gs+'px'}
function tbPinchStart(){const a=[...tbPts.values()];if(a.length<2)return;tbDrag=null;tbPan=null;tbMq=null;tbWD=null;tbRub=null;tbPaint=null;tbShpD=null;tbRulDraw();tbGhost(null);const v=$('#tbview'),r=v.getBoundingClientRect();
 tbPinch={d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,mx:(a[0].x+a[1].x)/2-r.left,my:(a[0].y+a[1].y)/2-r.top,z0:tbV.z,vx:tbV.x,vy:tbV.y}}
function tbPinchMove(){const a=[...tbPts.values()];if(a.length<2||!tbPinch)return;const v=$('#tbview'),r=v.getBoundingClientRect(),P=tbPinch,d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,
  z=Math.max(.05,Math.min(5,P.z0*d/P.d0)),mx=(a[0].x+a[1].x)/2-r.left,my=(a[0].y+a[1].y)/2-r.top;
 tbV.z=z;tbV.x=mx-(P.mx-P.vx)*(z/P.z0);tbV.y=my-(P.my-P.vy)*(z/P.z0);tbApply()}
// ---- ruler
const tbSnapC=(g,p)=>{const c=Math.floor((p.x-g.ox)/g.gs),r=Math.floor((p.y-g.oy)/g.gs);return {x:g.ox+(c+.5)*g.gs,y:g.oy+(r+.5)*g.gs}};
function tbRulDraw(){const sv=$('#tbsvg'),m=tbCur();if(!sv||!m)return;let h='';const k=1/tbV.z;
 if(tbRul){h+=tbRulSvg({...tbRul,rt:tbRoute,bd:1},m,tbGeoM(m),k,'#ffd60a','')}
 if(tbRub){const x=Math.min(tbRub.x0,tbRub.x1),y=Math.min(tbRub.y0,tbRub.y1),s=Math.max(Math.abs(tbRub.x1-tbRub.x0),Math.abs(tbRub.y1-tbRub.y0));h+=`<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="rgba(0,240,208,.18)" stroke="#00f0d0" stroke-width="${2*k}"/>`}
 if(tbPaint&&tbPaint.rect&&tbPaint.cur){const g=tbGeoM(m),a=tbPaint.start,b=tbPaint.cur,c0=Math.min(a.c,b.c),c1=Math.max(a.c,b.c),r0=Math.min(a.r,b.r),r1=Math.max(a.r,b.r);
  h+=`<rect x="${g.ox+c0*g.gs}" y="${g.oy+r0*g.gs}" width="${(c1-c0+1)*g.gs}" height="${(r1-r0+1)*g.gs}" fill="${tbPaint.val?'rgba(255,255,255,.2)':'rgba(0,0,0,.35)'}" stroke="#ffd60a" stroke-width="${2*k}" stroke-dasharray="${8*k} ${5*k}"/>`}
 if(tbShpD&&tbShpD.d&&tbShpD.moved){const g=tbGeoM(m);h+=tbShpSvg(tbShpD.d,g,m,true)}
 if(tbShS.length){h+=tbShpSelSvg(m,tbGeoM(m),k)}
 h+=tbMqSvg(k)+tbLySvg(m,tbGeoM(m),k)+tbWallPreview(m,tbGeoM(m),k)+tbRemoteRulers(m,tbGeoM(m),k);
 sv.innerHTML=h}
function tbRubDraw(){tbRulDraw()}
function tbRubDone(){const R=tbRub;tbRub=null;if(!R||!tbGrid){tbRulDraw();return}const s=Math.max(Math.abs(R.x1-R.x0),Math.abs(R.y1-R.y0));
 if(s>=8){const gs=Math.round(s*100)/100;tbGrid.gs=gs;tbGrid.gx=Math.min(R.x0,R.x1)%gs;tbGrid.gy=Math.min(R.y0,R.y1)%gs;tbGrid.sq=false;tbGridFields();const b=$('#tbgsq');if(b)b.classList.remove('on')}
 tbRulDraw();tbGridQ();const v=$('#tbview');if(v)v.classList.toggle('sq',!!(tbGrid&&tbGrid.sq))}
// ---- fog painting (GM)
function tbPaintStart(m,g,p,pid){if(!tbFogOn(m)){ask('Fog of war is off for this map. Turn it on? The whole map starts hidden from the players, and you reveal it as they explore.','Turn on fog').then(async ok=>{if(!ok)return;try{await db.doc('tbmaps/'+m.id).update({fog:true});m.fog=true;tbDraw()}catch(e){alert('Could not save: '+(e.message||e.code))}});return}
 const a=tbFogRows(m,g).map(u=>u.slice());tbFogD={id:m.id,cols:g.cols,n:g.rows,a};
 const cl=tbCell(g,p);cl.c=Math.max(0,Math.min(g.cols-1,cl.c));cl.r=Math.max(0,Math.min(g.rows-1,cl.r));
 tbPaint={pid,id:m.id,val:tbFog.mode==='rev'?1:0,rect:tbFog.shape==='rect',start:cl,cur:cl,last:cl,g,before:tbFogStr(a)};
 if(!tbPaint.rect){tbBrush(cl.c,cl.r);tbFogCanvas(m,g,tbFogD.a)}else tbRulDraw()}
function tbBrush(c,r){const P=tbPaint,n=tbFog.n,lo=-Math.floor((n-1)/2),hi=Math.ceil((n-1)/2);for(let j=lo;j<=hi;j++)for(let i=lo;i<=hi;i++){const rr=r+j,cc=c+i;if(rr>=0&&rr<P.g.rows&&cc>=0&&cc<P.g.cols)tbFogD.a[rr][cc]=P.val}}
function tbPaintMove(p){const P=tbPaint,m=tbCur();if(!P||!m)return;const g=P.g,cl=tbCell(g,p);cl.c=Math.max(0,Math.min(g.cols-1,cl.c));cl.r=Math.max(0,Math.min(g.rows-1,cl.r));
 if(P.rect){P.cur=cl;tbRulDraw();return}
 const steps=Math.max(Math.abs(cl.c-P.last.c),Math.abs(cl.r-P.last.r));for(let i=1;i<=steps;i++)tbBrush(Math.round(P.last.c+(cl.c-P.last.c)*i/steps),Math.round(P.last.r+(cl.r-P.last.r)*i/steps));P.last=cl;tbFogCanvas(m,g,tbFogD.a)}
async function tbPaintEnd(){const P=tbPaint;tbPaint=null;const m=tbCur();if(!P||!m||!tbFogD){tbFogD=null;return}
 if(P.rect){const a=P.start,b=P.cur;for(let r=Math.min(a.r,b.r);r<=Math.max(a.r,b.r);r++)for(let c=Math.min(a.c,b.c);c<=Math.max(a.c,b.c);c++)tbFogD.a[r][c]=P.val}
 const arr=tbFogD.a;tbFogD=null;await tbFogCommit(m,P.before,arr,P.val?'reveal fog':'cover fog');tbRulDraw();tbDraw()}
async function tbFogWrite(m,a){const rows=tbFogStr(a),old=(pm.tbfog||[]).find(x=>x&&x.id===m.id);if(old)old.rows=rows;else(pm.tbfog=pm.tbfog||[]).push({id:m.id,rows});
 try{await db.doc('tbfog/'+m.id).set({rows,ts:Date.now(),by:handle||'GM'})}catch(e){alert('Could not save the fog: '+(e.message||e.code))}}
async function tbFogAll(val){const m=tbCur();if(!m||!isOwner)return;if(!tbFogOn(m)){try{await db.doc('tbmaps/'+m.id).update({fog:true});m.fog=true}catch(e){return alert('Could not save: '+(e.message||e.code))}}
 if(!val&&!await ask('Hide the whole map from the players again?','Hide everything'))return;
 const g=tbGeoM(m),a=[],before=tbFogStr(tbFogRows(m,g));for(let r=0;r<g.rows;r++){const u=new Uint8Array(g.cols);if(val)u.fill(1);a.push(u)}await tbFogCommit(m,before,a,val?'reveal all':'cover all');tbDraw()}
// ---- pings
async function tbPing(x,y){const m=tbCur();if(!m)return;const id='p'+pid(uid||handle||'x'),d={map:m.id,x:Math.round(x),y:Math.round(y),by:handle||'?',ts:Date.now()};tbSeenP[id]=d.ts;tbPingFx(d);
 try{await db.doc('tbping/'+id).set(d)}catch(e){}}
function tbPingFx(p){const el=$('#tbpings');if(!el)return;const d=document.createElement('div');d.className='tbpg';d.style.left=p.x+'px';d.style.top=p.y+'px';d.innerHTML=`<i></i><i></i><i></i><span>${esc(p.by||'')}</span>`;el.appendChild(d);setTimeout(()=>d.remove(),3200)}
function tbPingChk(){const m=tbCur();(pm.tbping||[]).forEach(p=>{if(!p||/^[rkdh]/.test(String(p.id)))return;if(tbSeenP[p.id]===p.ts)return;tbSeenP[p.id]=p.ts;if(!m||p.map!==m.id||Date.now()-(+p.ts||0)>12000)return;tbPingFx(p)})}
// ---- the options panel to the right of the map: token list, selected token, fog, view and grid
function tbOpenSheet(t){const s=t&&t.sheet?(pm.sheets||[]).find(x=>x.id===t.sheet&&sxVis(x)):null;if(s)portraitGoSheet(s.id)}
function tbCanRm(t){if(isOwner)return true;if(t.kind!=='pc'&&!(t.kind==='vehicle'&&t.vh))return false;if(t.uid&&t.uid===uid)return true;const sid=t.sheet||(t.vh&&t.vh.s),s=sid?(pm.sheets||[]).find(x=>x.id===sid):null;return !!(s&&s.uid&&s.uid===uid)}
function tbCenter(t){const m=tbCur(),v=$('#tbview');if(!m||!v||!t)return;const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1);tbV.x=v.clientWidth/2-(g.ox+((+t.c||0)+sz/2)*g.gs)*tbV.z;tbV.y=v.clientHeight/2-(g.oy+((+t.r||0)+sz/2)*g.gs)*tbV.z;tbApply()}
function tbListHtml(m,g,rows){const q=String((($('#tbtq')||{}).value)||'').trim().toLowerCase();let L=tbToks(m).filter(t=>tbSees(t,g,rows));const all=L.length;
 if(q)L=L.filter(t=>(tbName(t)+' '+(TB_K[t.kind]||TB_K.prop)[0]+' '+(t.note||'')).toLowerCase().includes(q));
 if(!L.length)return `<div class="meta">${all?'Nothing matches.':'No tokens yet. Press ＋ Add token.'}</div>`;
 let h='';
 ['pc','npc','enemy','item','prop'].forEach(k=>{const A=L.filter(t=>(TB_K[t.kind]?t.kind:'prop')===k).sort((a,b)=>tbName(a).localeCompare(tbName(b),undefined,{numeric:true}));if(!A.length)return;
  h+=`<div class="tbgh">${TB_K[k][0]}${k==='npc'?'s':k==='enemy'?'ies':'s'} (${A.length})</div>`.replace('Enemyies','Enemies')+A.map(t=>{const sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null,img=tbOk(sh&&sh.img)||tbOk(t.img),col=tbColOk(t.col)||TB_K[k][1],nm=tbName(t);
   return `<div class="tbtr${tbTS.includes(t.id)?' sel':''}${t.mark==='down'?' dn':''}" data-tbtr="${esc(t.id)}" style="--k:${col}" title="Click to select it and move the view to it"><i class="tbtd" style="${img?`background-image:url('/_blob/${img}')`:''}">${img?'':(t.emoji?esc(t.emoji):esc(tbInit(nm)))}</i><span class="tbtn">${esc(nm)}</span>${tbCndOf(t).length?`<span class="tbtg" title="${esc(tbCndOf(t).map(k=>TB_CND.find(c=>c[0]===k)[2]).join(', '))}">${tbCndOf(t).slice(0,3).map(k=>TB_CND.find(c=>c[0]===k)[1]).join('')}</span>`:''}${t.hid?'<span class="tbtg" title="Hidden from players">🚫</span>':''}${t.lock?'<span class="tbtg">🔒</span>':''}${isOwner?`<span class="tbtq"><button data-tbx="rhid:${esc(t.id)}" title="${t.hid?'Show to players':'Hide from players'}">${t.hid?'👁':'🙈'}</button><button data-tbx="rdown:${esc(t.id)}" title="${t.mark==='down'?'Revive':'Mark as down'}">${t.mark==='down'?'♥':'💀'}</button><button data-tbx="rrm:${esc(t.id)}" title="Remove from the map">✕</button></span>`:''}</div>`}).join('')});
 return h}
function tbFogPanel(m){const F=tbFog,on=tbFogOn(m),pt=tbTool==='fog';
 return `<div class="tbvb"><button class="btn sm ${on?'on':''}" data-tbx="fogtog" title="Turn fog of war on or off for this map">${on?'Fog is ON':'Fog is OFF'}</button><button class="btn sm ${pt?'on':''}" data-tbx="ptool:${pt?'move':'fog'}">${pt?'✋ Stop painting':'🖌 Paint fog'}</button></div>
 <div class="tbvb"><span class="tbseg"><button class="btn sm ${F.mode==='rev'?'on':''}" data-tbx="fogm:rev">Reveal</button><button class="btn sm ${F.mode==='cov'?'on':''}" data-tbx="fogm:cov">Hide</button></span><span class="tbseg"><button class="btn sm ${F.shape==='brush'?'on':''}" data-tbx="fogs:brush">Brush</button><button class="btn sm ${F.shape==='rect'?'on':''}" data-tbx="fogs:rect">Box</button></span></div>
 ${F.shape==='brush'?`<div class="tbvb"><span class="meta">Brush size:</span><span class="tbseg">${[1,2,3,5].map(n=>`<button class="btn sm ${F.n===n?'on':''}" data-tbx="fogn:${n}">${n}×${n}</button>`).join('')}</span></div>`:''}
 <div class="tbvb"><button class="btn sm" data-tbx="fogall:rev">Reveal all</button><button class="btn sm" data-tbx="fogall:cov">Hide all</button></div>
 <div class="meta">${pt?`Painting is on: drag on empty ground to ${F.mode==='rev'?'uncover':'cover'} squares. Tokens can still be dragged, and right-click drag or Space pans.`:'Press <b>Paint fog</b>, then drag on the map to uncover or cover squares.'} You see hidden areas dimmed; players see them black and cannot see tokens standing there (their own characters always show).</div>`}
function tbBar(m){m=m||tbCur();const root=$('#tbpanel');if(!root)return;root.querySelectorAll('[data-gm],[data-gmx]').forEach(e=>{e.style.display=isOwner?'':'none'});
 if(!m){tbSig($('#tbtl'),'<div class="meta">Nothing on the table yet.</div>');tbSig($('#tbsel'),'');tbSig($('#tbcmb'),'');tbSig($('#tbmsr'),'');tbSig($('#tbgmp'),'');tbSig($('#tbgmv'),'');tbSig($('#tbfogp'),'');tbSig($('#tbshpp'),'');const n=$('#tbtn');if(n)n.textContent='';return}
 const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null,n=$('#tbtn');if(n)n.textContent='('+tbToks(m).filter(t=>tbSees(t,g,rows)).length+')';
 tbSig($('#tbtl'),tbListHtml(m,g,rows));{const ae=document.activeElement;if(!(ae&&(ae.tagName==='SELECT'||ae.tagName==='INPUT')&&ae.closest&&ae.closest('#tbsel')))tbSig($('#tbsel'),tbSelHtml(m))}tbSig($('#tbcmb'),tbCmbHtml(m));{const ae=document.activeElement;if(!(ae&&ae.tagName==='INPUT'&&ae.closest&&ae.closest('#tbmsr')))tbSig($('#tbmsr'),tbMsrPanel(m))}if(isOwner){tbSig($('#tbgmp'),tbGmHtml(m));const ae=document.activeElement;if(!(ae&&ae.tagName==='INPUT'&&ae.closest&&ae.closest('#tbgmv')))tbSig($('#tbgmv'),tbFilesHtml(m))}{const ae=document.activeElement;if(!(ae&&ae.tagName==='INPUT'&&ae.closest&&ae.closest('#tbshpp')))tbSig($('#tbshpp'),tbShpPanel(m))}if(isOwner)tbSig($('#tbfogp'),tbFogPanel(m));
 try{if(typeof tbChaseSync==='function')tbChaseSync(m)}catch(e){}tbViewSync();tbGridFields()}
// ---- shapes: rectangle, circle, cone, ring, emanation. Everyone can draw. Click a shape to select and move it,
// drag its handle to resize it, copy/cut/paste/duplicate, undo/redo. You delete your own; the GM can delete any.
const TB_SH={rect:['▭','Rectangle','Drag from one corner to the opposite corner.'],circle:['◯','Circle','Drag from the centre outward to set the radius.'],cone:['◺','Cone','Drag from the point of the cone outward. Its width at the far end equals its length (it turns in 15° steps while snapping).'],ring:['◎','Ring','Drag from the centre outward to set the outer edge. Set the band thickness below.'],emanation:['✥','Emanation','Press on a token (or any square) and drag outward. The area spreads from its edge and follows the token if it moves.']};
const TB_SHK=['kind','col','fr','label','c0','r0','c1','r1','cx','cy','rad','th','ang','len','wd','fl','c','r','sz','n','tok','lock'];
let tbShp={type:TB_SH[tbLS('sr_tbst','circle')]?tbLS('sr_tbst','circle'):'circle',col:tbColOk(tbLS('sr_tbsc','#ff3b3b'))||'#ff3b3b',th:1,snap:tbLS('sr_tbsn','1')!=='0'},
 tbShS=[],tbShMv=null,tbShRz=null,tbClip=null,tbLP=null,tbHist=[],tbRedo=[],tbShLab=tbLS('sr_tbsl','1')!=='0',tbShFill=tbNum(tbLS('sr_tbsf','26'),0,80,26);
const tbn2=v=>Math.round(v*100)/100,tbn3=v=>Math.round(v*1000)/1000;
const tbShpAll=m=>m?(pm.tbdraw||[]).filter(s=>s&&!s.deleted&&s.map===m.id&&TB_SH[s.kind]).sort((a,b)=>(+a.ts||0)-(+b.ts||0)):[];
const tbShpById=id=>(pm.tbdraw||[]).find(s=>s&&s.id===id&&!s.deleted);
const tbShpCan=s=>isOwner||(s.uid?s.uid===uid:s.by===handle);
const tbShpMoveOk=s=>!s.lock||tbShpCan(s);
const tbShpSel=()=>tbShS.map(tbShpById).filter(Boolean);
function tbShpEm(d){const t=d.tok?tbTok(d.tok):null;return {c:t?+t.c||0:+d.c||0,r:t?+t.r||0:+d.r||0,sz:t?Math.max(.5,+t.sz||1):Math.max(.5,+d.sz||1),n:Math.max(.1,+d.n||1)}}
function tbShpRect(s){const a=Math.min(s.c0,s.c1),b=Math.max(s.c0,s.c1),c=Math.min(s.r0,s.r1),d=Math.max(s.r0,s.r1);return s.fr?{x0:a,x1:b,y0:c,y1:d}:{x0:a,x1:b+1,y0:c,y1:d+1}}
function tbShpAnchor(s){if(s.kind==='rect'){const e=tbShpRect(s);return {x:(e.x0+e.x1)/2,y:(e.y0+e.y1)/2}}
 if(s.kind==='emanation'){const e=tbShpEm(s);return {x:e.c+e.sz/2,y:e.r+e.sz/2}}
 return {x:+s.cx||0,y:+s.cy||0}}
function tbShpTxt(d,m,own){const su=+m.su||1,un=String(m.un||'m'),f=n=>tbFmt(n*su)+' '+un;let t;
 if(d.kind==='rect'){const e=tbShpRect(d);t='Rectangle '+f(e.x1-e.x0)+' × '+f(e.y1-e.y0)}
 else if(d.kind==='circle')t='Circle, radius '+f(+d.rad||1);
 else if(d.kind==='ring')t='Ring, radius '+f(+d.rad||1)+', band '+f(Math.min(+d.th||1,+d.rad||1));
 else if(d.kind==='cone')t=(d.fl?'Stream ':'Cone ')+f(+d.len||1)+(+d.wd>0?' × '+f(+d.wd):'');
 else t='Emanation '+f(Math.max(.1,+d.n||1));
 return own&&d.label?d.label+' · '+t:t}
// the picture of one shape. mode: false = saved, true = being drawn, 'sel' = selection outline
function tbShpSvg(d,g,m,mode){const gs=g.gs,X=c=>g.ox+c*gs,Y=r=>g.oy+r*gs,col=tbColOk(d.col)||'#ff3b3b',sw=Math.max(2,gs*.05),n=v=>Math.round(v*100)/100;
 const st=mode==='sel'?`fill="none" stroke="#fff" stroke-width="${n(sw*.7)}" stroke-dasharray="${n(sw*2.4)} ${n(sw*1.6)}" stroke-linejoin="round"`:`fill="${col}" fill-opacity="${mode?.2:tbShFill/100}" stroke="${col}" stroke-width="${n(sw)}" stroke-linejoin="round"${mode?` stroke-dasharray="${n(sw*3)} ${n(sw*2)}"`:''}`;let h='',lx=0,ly=0;
 if(d.kind==='rect'){const e=tbShpRect(d);h=`<rect x="${n(X(e.x0))}" y="${n(Y(e.y0))}" width="${n((e.x1-e.x0)*gs)}" height="${n((e.y1-e.y0)*gs)}" ${st}/>`;lx=X((e.x0+e.x1)/2);ly=Y((e.y0+e.y1)/2)}
 else if(d.kind==='circle'){const R=Math.max(.1,+d.rad||1)*gs;h=`<circle cx="${n(X(d.cx))}" cy="${n(Y(d.cy))}" r="${n(R)}" ${st}/>`;lx=X(d.cx);ly=Y(d.cy)}
 else if(d.kind==='ring'){const Ru=Math.max(.1,+d.rad||1),R=Ru*gs,r=Math.max(0,Ru-Math.max(.1,+d.th||1))*gs,cx=X(d.cx),cy=Y(d.cy),C=q=>q>0?`M${n(cx-q)} ${n(cy)}a${n(q)} ${n(q)} 0 1 0 ${n(2*q)} 0a${n(q)} ${n(q)} 0 1 0 ${n(-2*q)} 0Z`:'';
  h=`<path d="${C(R)}${C(r)}" fill-rule="evenodd" ${st}/>`;lx=cx;ly=cy-(R+r)/2}
 else if(d.kind==='cone'){const L=Math.max(.1,+d.len||1)*gs,a=+d.ang||0,ax=X(d.cx),ay=Y(d.cy),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,ex=ax+L*dx,ey=ay+L*dy,hw=(+d.wd>0?+d.wd*gs:(d.fl?gs:L))/2,p=d.fl?[[ax+nx*hw,ay+ny*hw],[ex+nx*hw,ey+ny*hw],[ex-nx*hw,ey-ny*hw],[ax-nx*hw,ay-ny*hw]]:[[ax,ay],[ex+nx*hw,ey+ny*hw],[ex-nx*hw,ey-ny*hw]];
  h=`<polygon points="${p.map(q=>n(q[0])+','+n(q[1])).join(' ')}" ${st}/>`;lx=ax+L*dx*.62;ly=ay+L*dy*.62}
 else{const e=tbShpEm(d);h=`<rect x="${n(X(e.c-e.n))}" y="${n(Y(e.r-e.n))}" width="${n((e.sz+2*e.n)*gs)}" height="${n((e.sz+2*e.n)*gs)}" rx="${n(gs*.3)}" ${st}/>`;lx=X(e.c+e.sz/2);ly=Y(e.r-e.n)+gs*.5}
 if(mode==='sel')return h;
 const own=String(d.label||'').trim(),txt=own?(tbShLab?own+' · '+tbShpTxt(d,m,false):own):(tbShLab?tbShpTxt(d,m,false):'');if(!txt)return h;const fs=Math.max(9,gs*.26);
 return h+`<text x="${n(lx)}" y="${n(ly)}" text-anchor="middle" dominant-baseline="middle" font-size="${n(fs)}" font-weight="700" fill="#fff" stroke="#000" stroke-width="${n(fs*.28)}" paint-order="stroke" stroke-linejoin="round">${esc(txt)}</text>`}
function tbShpDraw(){const sv=$('#tbshp'),m=tbCur();if(!sv)return;if(!m){if(sv._h){sv._h='';sv.innerHTML=''}return}
 const g=tbGeoM(m);sv.setAttribute('width',m.w);sv.setAttribute('height',m.h);
 const body=tbShpAll(m).map(s=>`<g data-tbs="${esc(s.id)}">`+tbShpSvg(s,g,m,false)+'</g>').join(''),h=m.id+'|'+g.gs+'|'+g.ox+'|'+g.oy+'|'+tbShLab+'|'+tbShFill+'|'+body;
 if(sv._h!==h){sv._h=h;sv.innerHTML=body}
 try{tbCaughtPaint()}catch(e){}
 try{if(typeof tbAtkPaint==='function')tbAtkPaint()}catch(e){}}
// selection outline and the resize handle, drawn on the top layer
function tbShpHandle(s,g){const gs=g.gs,X=c=>g.ox+c*gs,Y=r=>g.oy+r*gs;
 if(s.kind==='rect'){const e=tbShpRect(s);return {x:X(e.x1),y:Y(e.y1)}}
 if(s.kind==='circle'||s.kind==='ring')return {x:X((+s.cx||0)+(+s.rad||1)),y:Y(+s.cy||0)};
 if(s.kind==='cone'){const L=(+s.len||1)*gs,a=+s.ang||0;return {x:X(+s.cx||0)+L*Math.cos(a),y:Y(+s.cy||0)+L*Math.sin(a)}}
 const e=tbShpEm(s);return {x:X(e.c+e.sz+e.n),y:Y(e.r+e.sz/2)}}
function tbShpSelSvg(m,g,k){const L=tbShpSel().filter(s=>s.map===m.id);if(!L.length)return '';let h=L.map(s=>tbShpSvg(s,g,m,'sel')).join('');
 if(L.length===1&&tbShpMoveOk(L[0])){const p=tbShpHandle(L[0],g);h+=`<circle cx="${p.x}" cy="${p.y}" r="${7*k}" fill="#ffd60a" stroke="#000" stroke-width="${2*k}" style="cursor:nwse-resize"/>`}
 return h}
// making a shape from a drag. free = not snapped to the grid
function tbShpMake(st,g,p,free){const gs=g.gs,K=st.type,d={kind:K,col:tbShp.col,fr:!!free},fx=q=>(q.x-g.ox)/gs,fy=q=>(q.y-g.oy)/gs;
 if(K==='rect'){if(free){const a=st.p0;d.c0=tbn2(Math.min(fx(a),fx(p)));d.c1=tbn2(Math.max(fx(a),fx(p)));d.r0=tbn2(Math.min(fy(a),fy(p)));d.r1=tbn2(Math.max(fy(a),fy(p)))}
  else{const a={c:Math.floor(fx(st.p0)),r:Math.floor(fy(st.p0))},b={c:Math.floor(fx(p)),r:Math.floor(fy(p))};d.c0=Math.min(a.c,b.c);d.c1=Math.max(a.c,b.c);d.r0=Math.min(a.r,b.r);d.r1=Math.max(a.r,b.r)}}
 else if(K==='circle'||K==='ring'){const ox=free?fx(st.p0):Math.round(fx(st.p0)),oy=free?fy(st.p0):Math.round(fy(st.p0)),q=Math.hypot(fx(p)-ox,fy(p)-oy),R=free?Math.max(.25,tbn2(q)):Math.max(1,Math.round(q));d.cx=tbn2(ox);d.cy=tbn2(oy);d.rad=R;if(K==='ring')d.th=Math.min(R,tbShp.th)}
 else if(K==='cone'){const ox=free?fx(st.p0):Math.round(fx(st.p0)),oy=free?fy(st.p0):Math.round(fy(st.p0)),dx=fx(p)-ox,dy=fy(p)-oy,qq=Math.PI/12,a=free?Math.atan2(dy,dx):Math.round(Math.atan2(dy,dx)/qq)*qq,q=Math.hypot(dx,dy);d.cx=tbn2(ox);d.cy=tbn2(oy);d.ang=tbn3(a);d.len=free?Math.max(.25,tbn2(q)):Math.max(1,Math.round(q));
  const pr=tbShp.pre;if(pr&&pr.k==='cone'){d.len=pr.len;d.wd=pr.wd;d.fl=pr.fl?1:0;d.label=pr.label||''}}
 else{const t=st.tok?tbTok(st.tok):null,sz=t?Math.max(.5,+t.sz||1):1,c=t?+t.c||0:(free?tbn2(fx(st.p0)-.5):Math.floor(fx(st.p0))),r=t?+t.r||0:(free?tbn2(fy(st.p0)-.5):Math.floor(fy(st.p0))),m=Math.max(Math.abs(fx(p)-(c+sz/2)),Math.abs(fy(p)-(r+sz/2)))-sz/2;
  Object.assign(d,{c,r,sz,tok:t?t.id:'',n:free?Math.max(.25,tbn2(m)):Math.max(1,Math.round(m))})}
 return d}
const tbShpFree=e=>tbShp.snap?!!(e&&e.altKey):!(e&&e.altKey);
function tbShpStart(m,g,p,tEl,pid,e){tbShpD={pid,type:tbShp.type,p0:p,tok:tEl?tEl.dataset.tbt:'',moved:false,free:tbShpFree(e),d:null};tbShpD.d=tbShpMake(tbShpD,g,p,tbShpD.free)}
function tbShpMove(p){const S=tbShpD,m=tbCur();if(!S||!m)return;if(!S.moved&&Math.hypot(p.x-S.p0.x,p.y-S.p0.y)*tbV.z<6)return;S.moved=true;S.d=tbShpMake(S,tbGeoM(m),p,S.free);tbRulDraw()}
async function tbShpEnd(){const S=tbShpD;tbShpD=null;const m=tbCur();if(!S||!m||!S.moved||!S.d){tbRulDraw();return}
 const ids=await tbShpCreate([{...S.d,map:m.id}],'draw a '+S.type);tbRulDraw();if(ids.length){tbShS=ids;tbSel=null}tbShpDraw();tbBar(m);tbRulDraw()}
// ---- hit testing
function tbShpHas(s,g,p){const gs=g.gs,fx=(p.x-g.ox)/gs,fy=(p.y-g.oy)/gs;
 if(s.kind==='rect'){const e=tbShpRect(s);return fx>=e.x0&&fx<e.x1&&fy>=e.y0&&fy<e.y1}
 if(s.kind==='circle')return Math.hypot(fx-s.cx,fy-s.cy)<=Math.max(.1,+s.rad||1);
 if(s.kind==='ring'){const R=Math.max(.1,+s.rad||1),q=Math.hypot(fx-s.cx,fy-s.cy);return q<=R&&q>=R-Math.max(.1,+s.th||1)}
 if(s.kind==='cone'){const L=Math.max(.1,+s.len||1),a=+s.ang||0,dx=fx-s.cx,dy=fy-s.cy,u=dx*Math.cos(a)+dy*Math.sin(a),v=-dx*Math.sin(a)+dy*Math.cos(a),hw=(+s.wd>0?+s.wd:(s.fl?1:L))/2;return u>=0&&u<=L&&Math.abs(v)<=(s.fl?hw:hw*u/L)}
 const e=tbShpEm(s);return fx>=e.c-e.n&&fx<=e.c+e.sz+e.n&&fy>=e.r-e.n&&fy<=e.r+e.sz+e.n}
// ---- editing helpers
async function tbSet(coll,id,f){const d=(pm[coll]||[]).find(x=>x&&x.id===id);if(d)Object.assign(d,f);await db.doc(coll+'/'+id).update(f)}
const tbPick=(o,keys)=>{const r={};keys.forEach(k=>{r[k]=o[k]!==undefined?o[k]:(k==='tok'||k==='label'?'':k==='fr'||k==='lock'?false:0)});return r};
function tbShpTranslate(s,dc,dr){const a=v=>tbn2(v);
 if(s.kind==='rect')return {c0:a(s.c0+dc),c1:a(s.c1+dc),r0:a(s.r0+dr),r1:a(s.r1+dr)};
 if(s.kind==='emanation'){const e=tbShpEm(s);return {tok:'',c:a(e.c+dc),r:a(e.r+dr),sz:e.sz}}
 return {cx:a((+s.cx||0)+dc),cy:a((+s.cy||0)+dr)}}
function tbShpToSnap(s){const R=Math.round,q=Math.PI/12;
 if(s.kind==='rect'){const e=tbShpRect(s),c0=R(e.x0),r0=R(e.y0);return {fr:false,c0,r0,c1:Math.max(c0,R(e.x1)-1),r1:Math.max(r0,R(e.y1)-1)}}
 if(s.kind==='circle')return {fr:false,cx:R(s.cx),cy:R(s.cy),rad:Math.max(1,R(+s.rad||1))};
 if(s.kind==='ring'){const r=Math.max(1,R(+s.rad||1));return {fr:false,cx:R(s.cx),cy:R(s.cy),rad:r,th:Math.max(1,Math.min(r,R(+s.th||1)))}}
 if(s.kind==='cone')return {fr:false,cx:R(s.cx),cy:R(s.cy),ang:tbn3(R((+s.ang||0)/q)*q),len:Math.max(1,R(+s.len||1))};
 const e=tbShpEm(s);return {fr:false,c:R(e.c),r:R(e.r),n:Math.max(1,R(e.n))}}
function tbShpToFree(s){if(s.kind==='rect'){const e=tbShpRect(s);return {fr:true,c0:e.x0,r0:e.y0,c1:e.x1,r1:e.y1}}return {fr:true}}
function tbShpResize(s,g,p){const fx=(p.x-g.ox)/g.gs,fy=(p.y-g.oy)/g.gs,free=!!s.fr;
 if(s.kind==='rect'){const e=tbShpRect(s);if(!free){const c0=Math.min(s.c0,s.c1),r0=Math.min(s.r0,s.r1);return {c0,r0,c1:Math.max(c0,Math.floor(fx)),r1:Math.max(r0,Math.floor(fy))}}
  return {c0:e.x0,r0:e.y0,c1:Math.max(tbn2(e.x0+.1),tbn2(fx)),r1:Math.max(tbn2(e.y0+.1),tbn2(fy))}}
 if(s.kind==='circle'||s.kind==='ring'){const q=Math.hypot(fx-s.cx,fy-s.cy),R=free?Math.max(.25,tbn2(q)):Math.max(1,Math.round(q)),o={rad:R};if(s.kind==='ring')o.th=Math.min(R,Math.max(free?.1:1,+s.th||1));return o}
 if(s.kind==='cone'){const dx=fx-s.cx,dy=fy-s.cy,qq=Math.PI/12,q=Math.hypot(dx,dy);return {ang:tbn3(free?Math.atan2(dy,dx):Math.round(Math.atan2(dy,dx)/qq)*qq),len:free?Math.max(.25,tbn2(q)):Math.max(1,Math.round(q))}}
 const e=tbShpEm(s),m=Math.max(Math.abs(fx-(e.c+e.sz/2)),Math.abs(fy-(e.r+e.sz/2)))-e.sz/2;return {n:free?Math.max(.25,tbn2(m)):Math.max(1,Math.round(m))}}
// ---- undo / redo (your own steps in this browser)
function tbNote(t){const el=$('#tbtoast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}
function tbHPush(label,undo,redo){const o={label,undo,redo};tbHist.push(o);if(tbHist.length>100)tbHist.shift();tbRedo.length=0;return o}
function tbHDrop(o){const i=tbHist.indexOf(o);if(i>=0)tbHist.splice(i,1)}
function tbAfter(){tbShS=tbShS.filter(id=>tbShpById(id));tbShpDraw();tbDraw();tbBar();tbRulDraw()}
async function tbUndo(){const o=tbHist.pop();if(!o)return tbNote('Nothing to undo.');try{await o.undo();tbRedo.push(o);tbNote('Undid: '+o.label)}catch(e){tbNote('Could not undo that.')}tbAfter()}
async function tbRedoDo(){const o=tbRedo.pop();if(!o)return tbNote('Nothing to redo.');try{await o.redo();tbHist.push(o);tbNote('Redid: '+o.label)}catch(e){tbNote('Could not redo that.')}tbAfter()}
// a batch of field changes on shapes: items = [{id,b:{before},a:{after}}]
async function tbShpEdit(items,label){items=items.filter(it=>it&&Object.keys(it.a).length);if(!items.length)return;
 const run=async k=>{await Promise.all(items.map(it=>tbSet('tbdraw',it.id,it[k])))};
 try{await run('a')}catch(e){alert('Could not save: '+(e.message||e.code));return}
 tbHPush(label,()=>run('b'),()=>run('a'));tbAfter()}
async function tbShpCreate(docs,label){const ids=[],now=Date.now();
 try{for(let i=0;i<docs.length;i++){const doc={...docs[i],by:handle||'?',uid:uid||'',ts:now+i};delete doc.id;delete doc.deleted;doc.lock=false;const r=await db.collection('tbdraw').add(doc);tbLoc('tbdraw',r.id,doc);ids.push(r.id)}}
 catch(e){alert('Could not save the shape: '+(e.message||e.code))}
 if(ids.length){const set=v=>Promise.all(ids.map(id=>tbSet('tbdraw',id,{deleted:v})));tbHPush(label,()=>set(true),async()=>{await set(false);tbShS=ids.slice();tbSel=null})}
 return ids}
function tbShpErase(m,g,p){const L=tbShpAll(m).filter(s=>tbShpHas(s,g,p));if(!L.length)return;const mine=L.filter(tbShpCan);
 if(!mine.length){const o=L[L.length-1];alert('That shape was drawn by '+(o.by||'someone else')+'. You can erase only your own.');return}
 tbShpDel([mine[mine.length-1]])}
async function tbShpDel(L){L=L.filter(tbShpCan);if(!L.length)return;const m=tbCur(),ids=L.map(s=>s.id),set=v=>Promise.all(ids.map(id=>tbSet('tbdraw',id,{deleted:v,...(v?{delAt:Date.now()}:{})})));
 try{await set(true);const op=tbHPush(ids.length===1?'erase a shape':'erase '+ids.length+' shapes',async()=>{await set(false);tbShS=ids.slice();tbSel=null},()=>set(true));tbAfter();
  undoBar(L.length===1?'Shape erased.':L.length+' shapes erased.',async()=>{tbHDrop(op);await set(false);tbRedo.push(op);tbAfter()})}catch(e){alert('Could not erase: '+(e.message||e.code))}}
async function tbShpClear(all){const m=tbCur();if(!m)return;const L=tbShpAll(m).filter(s=>all?isOwner:tbShpCan(s)&&(isOwner?(s.uid?s.uid===uid:s.by===handle):true));
 if(!L.length)return alert(all?'There are no shapes on this map.':'You have not drawn any shapes on this map.');
 if(!await ask((all?'Erase all '+L.length+' shape'+(L.length===1?'':'s')+' on this map?':'Erase the '+L.length+' shape'+(L.length===1?'':'s')+' you drew on this map?'),'Erase'))return;tbShpDel(L)}
// ---- copy, cut, paste, duplicate
function tbShpPlain(s){const o={};TB_SHK.forEach(k=>{if(s[k]!==undefined&&k!=='lock')o[k]=s[k]});if(s.kind==='emanation'){const e=tbShpEm(s);o.c=e.c;o.r=e.r;o.sz=e.sz;o.tok=''}return o}
function tbShpCopy(cut){const L=tbShpSel();if(!L.length)return tbNote('Select a shape first.');tbClip={kind:'shp',docs:L.map(tbShpPlain),n:0};
 if(cut){const del=L.filter(tbShpCan);if(del.length){tbShpDel(del);tbNote('Cut '+del.length+' shape'+(del.length===1?'':'s')+(del.length<L.length?' (the others are not yours, so they stay)':'')+'.')}else tbNote('Copied. You can cut only your own shapes.')}
 else tbNote('Copied '+L.length+' shape'+(L.length===1?'':'s')+'. Press Ctrl+V to paste.')}
async function tbShpPaste(dup){const m=tbCur();if(!m)return;const src=dup?tbShpSel().map(tbShpPlain):(tbClip&&tbClip.kind==='shp'?tbClip.docs:[]);if(!src.length)return tbNote(dup?'Select a shape first.':'Nothing copied yet.');
 const g=tbGeoM(m),A=src.map(tbShpAnchor),cx=A.reduce((a,b)=>a+b.x,0)/A.length,cy=A.reduce((a,b)=>a+b.y,0)/A.length;let dc,dr;
 if(!dup&&tbClip)tbClip.n++;
 if(!dup&&tbLP){dc=(tbLP.x-g.ox)/g.gs-cx;dr=(tbLP.y-g.oy)/g.gs-cy}else{const k=dup?1:(tbClip?tbClip.n:1);dc=dr=k}
 const docs=src.map(d=>{const f=!!d.fr,t=tbShpTranslate(d,f?dc:Math.round(dc),f?dr:Math.round(dr));return {...d,...t,map:m.id}});
 const ids=await tbShpCreate(docs,dup?'duplicate':'paste');if(ids.length){tbShS=ids;tbSel=null;tbNote((dup?'Duplicated ':'Pasted ')+ids.length+' shape'+(ids.length===1?'':'s')+'.')}tbAfter()}
function tbShpDelSel(){const L=tbShpSel();if(!L.length)return;const del=L.filter(tbShpCan);if(!del.length)return tbNote('You can delete only your own shapes.');tbShpDel(del)}
function tbShpNudge(dx,dy,fine){const L=tbShpSel().filter(tbShpMoveOk);if(!L.length)return;
 tbShpEdit(L.map(s=>{const k=(s.fr&&fine)?.1:1,a=tbShpTranslate(s,dx*k,dy*k);return {id:s.id,b:tbPick(s,Object.keys(a)),a}}),'move '+(L.length===1?'a shape':L.length+' shapes'))}
function tbShpSelect(ids,add){if(add){const set=new Set(tbShS);ids.forEach(i=>set.has(i)?set.delete(i):set.add(i));tbShS=[...set]}else tbShS=ids.slice();tbSel=null;const tk=$('#tbtoks');if(tk)tk.querySelectorAll('.tbt.sel').forEach(x=>x.classList.remove('sel'));tbBar();tbRulDraw()}
// ---- pointer: grab a shape or its handle (Move tool)
function tbShpDownHit(m,g,p,e){
 if(tbShS.length===1){const s=tbShpById(tbShS[0]);if(s&&s.map===m.id&&tbShpMoveOk(s)){const h=tbShpHandle(s,g);if(Math.hypot((h.x-p.x)*tbV.z,(h.y-p.y)*tbV.z)<=13){tbShRz={id:s.id,pid:e.pointerId,orig:{...s},moved:false};e.preventDefault();return true}}}
 const L=tbShpAll(m).filter(s=>tbShpHas(s,g,p));if(!L.length)return false;const s=L[L.length-1];
 if(e.shiftKey||e.ctrlKey||e.metaKey){tbShpSelect([s.id],true);e.preventDefault();return true}
 if(!tbShS.includes(s.id))tbShpSelect([s.id]);
 const mv=tbShpSel().filter(z=>z.map===m.id&&tbShpMoveOk(z));
 if(mv.length)tbShMv={pid:e.pointerId,x:p.x,y:p.y,ids:mv.map(z=>z.id),orig:Object.fromEntries(mv.map(z=>[z.id,{...z}])),moved:false};
 e.preventDefault();return true}
function tbShpDragMove(p){const m=tbCur();if(!m)return;const g=tbGeoM(m);
 if(tbShRz){const s=tbShpById(tbShRz.id);if(!s)return;tbShRz.moved=true;Object.assign(s,tbShpResize(tbShRz.orig,g,p));tbShpDraw();tbRulDraw();return}
 const M=tbShMv;if(!M)return;if(!M.moved&&Math.hypot(p.x-M.x,p.y-M.y)*tbV.z<4)return;M.moved=true;const dx=(p.x-M.x)/g.gs,dy=(p.y-M.y)/g.gs;
 M.ids.forEach(id=>{const s=tbShpById(id),o=M.orig[id];if(!s||!o)return;Object.assign(s,tbShpTranslate(o,o.fr?dx:Math.round(dx),o.fr?dy:Math.round(dy)))});tbShpDraw();tbRulDraw()}
async function tbShpDragEnd(){const R=tbShRz,M=tbShMv;tbShRz=tbShMv=null;
 if(R){const s=tbShpById(R.id);if(R.moved&&s){const keys=['c0','r0','c1','r1','rad','th','ang','len','n'].filter(k=>s[k]!==R.orig[k]);const a=tbPick(s,keys),b=tbPick(R.orig,keys);Object.keys(a).forEach(k=>{if(a[k]===b[k]){delete a[k];delete b[k]}});
   if(Object.keys(a).length){tbShpEdit([{id:s.id,b,a}],'resize a shape')}else tbAfter()}else tbAfter();return}
 if(M){if(!M.moved){tbAfter();return}const items=[];M.ids.forEach(id=>{const s=tbShpById(id),o=M.orig[id];if(!s||!o)return;const keys=Object.keys(tbShpTranslate(o,0,0));items.push({id,b:tbPick(o,keys),a:tbPick(s,keys)})});
  const ch=items.filter(it=>Object.keys(it.a).some(k=>it.a[k]!==it.b[k]));if(ch.length)tbShpEdit(ch,'move '+(ch.length===1?'a shape':ch.length+' shapes'));else tbAfter()}}
// ---- the panel
function tbShpPanel(m){const tool=tbTool==='shape',er=tbTool==='erase',F=TB_SH[tbShp.type],L=tbShpAll(m),S=tbShpSel(),one=S.length===1?S[0]:null,anyCan=S.some(tbShpCan),anyMove=S.some(tbShpMoveOk);
 const sel=S.length?`<div class="tbshs"><b>${one?esc(tbShpTxt(one,m,true)):S.length+' shapes selected'}</b>${one?` <span class="meta">· ${esc(one.by||'?')}</span>`:''}
  <div class="tbvb"><button class="btn sm" data-tbx="shpcp">Copy</button><button class="btn sm" data-tbx="shpct"${anyCan?'':' disabled'}>Cut</button><button class="btn sm" data-tbx="shpdup">Duplicate</button><button class="btn sm mg" data-tbx="shpdelsel"${anyCan?'':' disabled'}>Delete</button></div>
  ${one?`<div class="tbvb"><label class="tbck"><input type="checkbox" id="tbshsn" ${one.fr?'':'checked'}${tbShpMoveOk(one)?'':' disabled'}> Snap to grid</label><button class="btn sm ${one.lock?'on':''}" data-tbx="shplock"${tbShpCan(one)?'':' disabled'} title="A locked shape cannot be moved or resized except by whoever drew it and the GM">${one.lock?'🔒 Locked':'🔓 Lock'}</button></div>
  <input id="tbshlb" maxlength="40" placeholder="Label, e.g. Fireball (optional)" value="${esc(one.label||'')}"${tbShpMoveOk(one)?'':' disabled'}>`:`<div class="tbvb"><button class="btn sm ${S.every(z=>z.lock)?'on':''}" data-tbx="shplock"${anyCan?'':' disabled'}>🔒 Lock / unlock</button></div>`}
  <div class="meta">Drag the shape to move it${one?', or drag the yellow handle to resize it':''}. Arrow keys nudge it${anyMove?'':' (these are locked)'}. Pick a colour below to recolour it.</div></div>`:'';
 return `<div class="tbvb">${Object.keys(TB_SH).map((k,i)=>`<button class="btn sm ${tool&&tbShp.type===k?'on':''}" data-tbx="shp:${k}" title="${esc(TB_SH[k][2])} (key ${i+1})">${TB_SH[k][0]} ${TB_SH[k][1]}</button>`).join('')}</div>
 ${typeof tbTplPanel==='function'?tbTplPanel(m,S):''}
 <div class="tbvb"><span class="meta">Colour:</span><span class="tbsws">${TB_COLS.slice(0,8).map(c=>`<button class="tbswc ${tbShp.col.toLowerCase()===c.toLowerCase()?'on':''}" style="background:${c}" data-tbx="shpc:${c.slice(1)}" title="${c}"></button>`).join('')}</span></div>
 ${tbShp.type==='ring'?`<div class="tbvb"><span class="meta">Ring thickness:</span><span class="tbseg">${[1,2,3,4].map(n=>`<button class="btn sm ${tbShp.th===n?'on':''}" data-tbx="shpth:${n}">${n} sq</button>`).join('')}</span></div>`:''}
 <div class="tbvb"><button class="btn sm ${tbShp.snap?'on':''}" data-tbx="shpsnap" title="When on, new shapes snap to the grid. Hold Alt while drawing to do the opposite just once. (key G)">▦ Snap to grid: ${tbShp.snap?'ON':'OFF'}</button><button class="btn sm ${er?'on':''}" data-tbx="ptool:${er?'move':'erase'}" title="Click a shape on the map to erase it (key E)">🧽 ${er?'Stop erasing':'Eraser'}</button>${tool||er?'<button class="btn sm" data-tbx="ptool:move">✋ Stop drawing</button>':''}</div>
 <div class="meta">${tool?'<b>'+esc(F[1])+':</b> '+esc(F[2])+(tbShp.snap?' It snaps to the grid.':' It is free: it goes exactly where you drag.'):er?'Click a shape on the map to erase it. You can erase your own'+(isOwner?', and as GM, anyone\'s':'')+'.':'Pick a shape and drag on the map, or use the Move tool (✋) to click, move and resize shapes that are already there.'} Everyone sees what you draw.</div>
 ${sel}
 <div class="tbshl">${L.length?L.map(s=>`<div class="tbsr${tbShS.includes(s.id)?' sel':''}" data-tbsrid="${esc(s.id)}" title="Click to select it (Shift-click adds to the selection)"><i style="background:${esc(tbColOk(s.col)||'#ff3b3b')}"></i><span>${esc(tbShpTxt(s,m,true))} <span class="meta">· ${esc(s.by||'?')}${s.lock?' · 🔒':''}</span></span>${tbShpCan(s)?`<button class="btn sm" data-tbx="shprm:${esc(s.id)}" title="Erase this shape">✕</button>`:''}</div>`).join(''):'<div class="meta">No shapes on this map.</div>'}</div>
 <div class="tbvb"><button class="btn sm" data-tbx="shpall">Select all</button><button class="btn sm" data-tbx="shpdel:mine">Erase mine</button>${isOwner?'<button class="btn sm" data-tbx="shpdel:all">Erase all</button>':''}</div>
 <details class="tbkeys"><summary>Keyboard shortcuts</summary><div class="meta">Ctrl+Z undo · Ctrl+Y (or Ctrl+Shift+Z) redo · Ctrl+C copy · Ctrl+X cut · Ctrl+V paste at the pointer · Ctrl+D duplicate · Ctrl+A select all shapes · Delete erase · arrow keys nudge (Shift = fine on free shapes) · Shift-click adds to the selection · Esc cancels or deselects. Tools: V move, M measure, P ping, E eraser${isOwner?', F fog':''}, 1 to 5 pick a shape, G snap on or off. Alt while drawing flips snapping once.</div></details>`}
function tbShpKey(e,m){const mod=e.ctrlKey||e.metaKey,k=String(e.key||'').toLowerCase();
 if(mod&&!e.altKey){
  if(k==='z'&&!e.shiftKey){e.preventDefault();tbUndo();return true}
  if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();tbRedoDo();return true}
  const T=tbSel?tbTok(tbSel):null,txt=window.getSelection&&String(window.getSelection()).trim();
  if(k==='c'||k==='x'){if(txt)return false;if(T){e.preventDefault();tbTokCopy(k==='x');return true}if(tbShS.length){e.preventDefault();tbShpCopy(k==='x');return true}return false}
  if(k==='v'){if(tbClip&&tbClip.kind==='tok'){e.preventDefault();tbTokPaste();return true}if(tbClip&&tbClip.docs&&tbClip.docs.length){e.preventDefault();tbShpPaste(false);return true}return false}
  if(k==='d'){e.preventDefault();if(T){if(isOwner)tbTokPaste(true);else tbNote('Only the GM can duplicate tokens.')}else tbShpPaste(true);return true}
  if(k==='a'){e.preventDefault();if(e.shiftKey)tbSelAllToks();else tbShpSelect(tbShpAll(m).map(s=>s.id));return true}
  return false}
 if(e.altKey)return false;
 if(e.key==='Delete'||e.key==='Backspace'){const T=tbSel?tbTok(tbSel):null;if(T){e.preventDefault();tbRemoveMany(tbSelToks());return true}if(tbShS.length){e.preventDefault();tbShpDelSel();return true}return false}
 const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(d&&tbShS.length&&!tbSel){e.preventDefault();tbShpNudge(d[0],d[1],e.shiftKey);return true}
 if(e.shiftKey)return false;
 const T={v:'move',m:'ruler',p:'ping',e:'erase',s:'select',k:'mark'};if(isOwner){T.f='fog';T.l='look';T.n='note';T.w='wall'}
 if(k==='r'&&isOwner){const L=tbSelToks();if(L.length)tbRevealAround(L,tbRvN,true);else tbNote('Select a token first, then press R to uncover the fog around it.');return true}
 if(T[k]){tbAct('tool',T[k]);return true}
 const i='12345'.indexOf(k);if(i>=0&&k.length===1){tbAct('shp',Object.keys(TB_SH)[i]);return true}
 if(k==='g'){tbAct('shpsnap');return true}
 return false}

// ---- tokens: the same shortcuts work for them (the GM copies, cuts, pastes and duplicates; players move and remove their own)
const tbTokPlain=t=>({kind:t.kind,name:tbName(t),img:t.img||'',emoji:t.emoji||'',col:t.col||'',sz:t.sz||1,temp:!!t.temp,hid:!!t.hid,note:t.note||'',ar:+t.ar||0,ac:t.ac||'',...(t.cs?{cs:JSON.parse(JSON.stringify(t.cs))}:{}),...(+t.mhp>0?{mhp:+t.mhp}:{})});
function tbTokDocs(L){const c0=Math.min(...L.map(t=>+t.c||0)),r0=Math.min(...L.map(t=>+t.r||0));return L.map(t=>({...tbTokPlain(t),dc:(+t.c||0)-c0,dr:(+t.r||0)-r0}))}
function tbTokCopy(cut){const L=tbSelToks();if(!L.length)return tbNote('Select a token first.');if(!isOwner)return tbNote('Only the GM can copy and paste tokens.');
 tbClip={kind:'tok',docs:tbTokDocs(L),n:0};const w=L.length===1?tbName(L[0]):L.length+' tokens';if(cut){tbRemoveMany(L,true);tbNote('Cut '+w+'. Press Ctrl+V to paste.')}else tbNote('Copied '+w+'. Press Ctrl+V to paste.')}
async function tbTokPaste(dup){const m=tbCur();if(!m)return;if(!isOwner)return tbNote('Only the GM can paste tokens.');
 let src;if(dup){const L=tbSelToks();if(!L.length)return tbNote('Select a token first.');src=tbTokDocs(L)}else{if(!tbClip||tbClip.kind!=='tok')return;src=tbClip.docs;tbClip.n=(tbClip.n||0)+1}
 const g=tbGeoM(m);let bc,br;
 if(!dup&&tbLP){bc=Math.floor((tbLP.x-g.ox)/g.gs);br=Math.floor((tbLP.y-g.oy)/g.gs)}
 else{const L=dup?tbSelToks():[];const c0=dup?Math.min(...L.map(t=>+t.c||0)):0,r0=dup?Math.min(...L.map(t=>+t.r||0)):0;const k=dup?1:tbClip.n;bc=dup?c0+k:Math.floor(((($('#tbview')||{}).clientWidth||400)/2-tbV.x)/tbV.z/g.gs)+k;br=dup?r0+k:Math.floor(((($('#tbview')||{}).clientHeight||300)/2-tbV.y)/tbV.z/g.gs)+k}
 {let lo=-1e9,hi=1e9,loR=-1e9,hiR=1e9;src.forEach(d=>{const need=Math.max(1,Math.ceil(Math.max(.5,Math.min(8,+d.sz||1))));lo=Math.max(lo,-d.dc);hi=Math.min(hi,g.cols-need-d.dc);loR=Math.max(loR,-d.dr);hiR=Math.min(hiR,g.rows-need-d.dr)});bc=Math.max(lo,Math.min(Math.max(lo,hi),bc));br=Math.max(loR,Math.min(Math.max(loR,hiR),br))}
 const ids=[];
 try{for(const d of src){const base=String(d.name||'Token').replace(/\s+\d+$/,''),nm=base+' '+tbNextNum(m,base);ids.push(await tbAddTok(m,{...d,name:nm,sheet:'',at:{c:bc+d.dc,r:br+d.dr},nh:true}))}}
 catch(e){alert('Could not paste: '+(e.message||e.code))}
 if(ids.length){const set=v=>Promise.all(ids.map(id=>tbSet('tbtoks',id,{deleted:v})));tbHPush((dup?'duplicate ':'paste ')+(ids.length===1?'a token':ids.length+' tokens'),()=>set(true),async()=>{await set(false);tbSel=ids[0];tbTS=ids.slice();tbShS=[]});
  tbSel=ids[0];tbTS=ids.slice();tbShS=[];tbNote((dup?'Duplicated ':'Pasted ')+(ids.length===1?tbName(tbTok(ids[0])||{}):ids.length+' tokens')+'.');tbDraw()}}
function tbTokMoveHist(t,oc,orr){const id=t.id,nc=+t.c||0,nr=+t.r||0,last=tbHist[tbHist.length-1],set=(c,r)=>tbSet('tbtoks',id,{c,r,mv:Date.now(),mvby:handle||'?'});
 if(last&&last.tok===id&&Date.now()-last.at<1200){last.at=Date.now();last.redo=()=>set(nc,nr);tbRedo.length=0;return}
 const op=tbHPush('move '+(t.name||'a token'),()=>set(oc,orr),()=>set(nc,nr));op.tok=id;op.at=Date.now()}
function tbTokFlag(t,f){const k=Object.keys(f)[0],v=f[k],old=t[k]===undefined?(k==='mark'?'':false):t[k],set=x=>tbSet('tbtoks',t.id,{[k]:x});
 set(v).catch(()=>{});tbHPush((k==='hid'?(v?'hide ':'show '):k==='lock'?(v?'lock ':'unlock '):(v?'mark down ':'mark up '))+(t.name||'a token'),()=>set(old),()=>set(v));tbDraw()}
// ---- grid fitting and scale (GM). Edits are a preview (tbGrid) until Save grid.
function tbGridDraft(){const m=tbCur();if(!m)return null;if(!tbGrid||tbGrid.id!==m.id){const gg=tbGeo(m,m);tbGrid={id:m.id,gs:gg.gs,gx:gg.ox<0?gg.ox+gg.gs:0,gy:gg.oy<0?gg.oy+gg.gs:0,sq:false}}return tbGrid}
function tbGridEdit(){const m=tbCur();if(!m||!isOwner)return;tbGridDraft();tbOpenS.grid=1;const d=document.querySelector('[data-tbd=grid]');if(d)d.open=true;tbGridFields();tbDraw()}
function tbGridFields(skip){const m=tbCur();if(!m||!isOwner||!$('#tbg-gs'))return;const src=tbGrid&&tbGrid.id===m.id?tbGrid:m,gg=tbGeo(m,src),sx=gg.ox<0?gg.ox+gg.gs:0,sy=gg.oy<0?gg.oy+gg.gs:0,
 set=(id,v)=>{const i=$('#'+id);if(i&&id!==skip&&document.activeElement!==i)i.value=tbFmt(v)};
 set('tbg-gs',gg.gs);set('tbg-cols',m.w/gg.gs);set('tbg-gx',sx);set('tbg-gy',sy);
 const r=$('#tbg-rng');if(r&&skip!=='tbg-rng'){r.max=Math.max(60,Math.round(Math.min(m.w,m.h)/2));r.value=gg.gs}
 const v=$('#tbg-v');if(v)v.textContent=tbFmt(gg.gs)+' px';const st=$('#tbgst');if(st)st.textContent=tbGrid?'Editing the grid. Save it, or reset to go back to the saved grid.':'';
 [$('#tbgsv'),$('#tbgcx')].forEach(b=>{if(b)b.disabled=!tbGrid});const q=$('#tbgsq');if(q)q.classList.toggle('on',!!(tbGrid&&tbGrid.sq));tbGridQ()}
async function tbGridSave(){const m=tbCur(),G=tbGrid;if(!m||!G)return;const gs=Math.round(G.gs*100)/100,gg=tbGeo(m,G),gx=Math.round((gg.ox<0?gg.ox+gg.gs:0)*100)/100,gy=Math.round((gg.oy<0?gg.oy+gg.gs:0)*100)/100,o=tbGeo(m,m),dim=o.cols!==gg.cols||o.rows!==gg.rows||o.gs!==gg.gs||o.ox!==gg.ox||o.oy!==gg.oy;
 try{await db.doc('tbmaps/'+m.id).update({gs,gx,gy});m.gs=gs;m.gx=gx;m.gy=gy;
  if(dim&&tbFogOn(m)&&(pm.tbfog||[]).some(f=>f&&f.id===m.id)){const old=(pm.tbfog||[]).find(f=>f.id===m.id);if(old)old.rows=[];await db.doc('tbfog/'+m.id).set({rows:[],ts:Date.now(),by:handle||'GM'})}}
 catch(e){return alert('Could not save the grid: '+(e.message||e.code))}
 tbGrid=null;const v=$('#tbview');if(v)v.classList.remove('sq');tbGridFields();tbDraw()}
// ---- actions
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tbx]');
 if(!b){const sr=e.target.closest&&e.target.closest('[data-tbsrid]');if(sr&&$('#tbroot')){tbShpSelect([sr.dataset.tbsrid],e.shiftKey||e.ctrlKey||e.metaKey);return}const r=e.target.closest&&e.target.closest('[data-tbtr]');if(r&&$('#tbroot')){const t=tbTok(r.dataset.tbtr);if(t){if(e.shiftKey||e.ctrlKey||e.metaKey){tbSelToggle(t.id)}else{tbSel=t.id;tbTS=[t.id];tbShS=[];tbCenter(t);tbDraw()}}}return}
 if(!$('#tbroot')&&!b.closest('#modal'))return;const [a,x,y]=String(b.dataset.tbx).split(':');tbAct(a,x,y,e)});
function tbAct(a,x,y,e){const m=tbCur(),t=tbSel?tbTok(tbSel):null;
 if(TBX[a]){TBX[a](x,m,t,e,y);return}
 if(a==='tool'||a==='ptool'){tbTool=x;if(x!=='attack'&&typeof tbAtkSt!=='undefined')tbAtkSt.a=null;tbRul=null;tbShpD=null;tbWD=null;const v=$('#tbview');if(v)v.className='tool-'+x+(tbGrid&&tbGrid.sq?' sq':'');tbRulDraw();tbRail(m);tbBar(m);return}
 if(a==='shp'){if(!TB_SH[x])return;tbShp.pre=null;tbShp.type=x;tbLSset('sr_tbst',x);return tbAct('tool','shape')}
 if(a==='shpc'){tbShp.col='#'+String(x||'').replace(/[^0-9a-f]/gi,'').slice(0,6);tbLSset('sr_tbsc',tbShp.col);const S=tbShpSel().filter(tbShpCan);if(S.length)tbShpEdit(S.filter(z=>z.col!==tbShp.col).map(z=>({id:z.id,b:{col:z.col||'#ff3b3b'},a:{col:tbShp.col}})),'recolour');else tbBar(m);return}
 if(a==='shpsnap'){tbShp.snap=!tbShp.snap;tbLSset('sr_tbsn',tbShp.snap?'1':'0');tbBar(m);tbNote('Snap to grid: '+(tbShp.snap?'on':'off'));return}
 if(a==='shpcp')return tbShpCopy(false);if(a==='shpct')return tbShpCopy(true);if(a==='shpdup')return tbShpPaste(true);if(a==='shpdelsel')return tbShpDelSel();
 if(a==='shpall'){tbShpSelect(tbShpAll(m).map(z=>z.id));return}
 if(a==='shplock'){const S=tbShpSel().filter(tbShpCan);if(!S.length)return;const v=!S.every(z=>z.lock);tbShpEdit(S.map(z=>({id:z.id,b:{lock:!!z.lock},a:{lock:v}})),v?'lock':'unlock');return}
 if(a==='shpfmt'){tbShLab=!tbShLab;tbLSset('sr_tbsl',tbShLab?'1':'0');tbShpDraw();tbViewSync();return}
 if(a==='shpth'){tbShp.th=Math.max(1,Math.min(6,+x||1));tbBar(m);return}
 if(a==='shprm'){const q=(pm.tbdraw||[]).find(z=>z&&z.id===x&&!z.deleted);if(q)tbShpDel([q]);return}
 if(a==='shpdel'){tbShpClear(x==='all');return}
 if(a==='mine')return tbCentreMine();if(a==='zin')return tbZoom(1.25);if(a==='zout')return tbZoom(1/1.25);if(a==='fit')return tbFit();
 if(a==='grid'){tbHideGrid=!tbHideGrid;tbRail(m);tbViewSync();tbGridQ();return}
 if(a==='addtok')return tbPicker();
 if(a==='expand'){tbXP=!tbXP;tbSizeApply();tbRail(m);tbViewSync();setTimeout(tbFit,40);return}
 if(a==='pcol'){tbPC=!tbPC;tbLSset('sr_tbpc',tbPC?'1':'');tbSizeApply();tbRail(m);setTimeout(tbGridQ,40);return}
 if(a==='rsz'){tbH=0;tbPW=0;tbW=0;tbPC=false;tbXP=false;tbLSset('sr_tbw',0);tbLSset('sr_tbh',0);tbLSset('sr_tbpw',0);tbLSset('sr_tbpc','');tbSizeApply();tbRail(m);tbViewSync();setTimeout(tbFit,40);return}
 if(a==='shape'){if(!m)return;const v=$('#tbview');tbH=Math.round(tbNum(v.clientWidth*m.h/m.w+8,240,3000,0));tbXP=false;tbLSset('sr_tbh',tbH);tbSizeApply();tbViewSync();setTimeout(tbFit,40);return}
 if(a==='route'){tbRoute=!tbRoute;tbLSset('sr_tbrt',tbRoute?'1':'0');tbBar(m);tbRulDraw();return}
 if(a==='range'){tbRangeOn=!tbRangeOn;tbRangeDraw();tbBar(m);return}
 if(a==='cnd')return tbCndToggle(x);if(a==='cndclr')return tbCndClear();if(a==='aurc')return tbAuraSet(null,'#'+String(x||'').replace(/[^0-9a-f]/gi,'').slice(0,6));
 if(a==='grp')return tbGrpAct(x);if(a==='selall')return tbSelAllToks();
 if(a==='ininext'){try{iniNext().catch(er=>alert('Failed: '+(er.message||er.code)))}catch(er){}return}if(a==='iniprev'){try{iniPrev()}catch(er){}return}if(a==='iniopen')return tbGoIni();if(a==='turnfind'){if(!tbTurnFind(false)&&tbIniCur())tbNote('That token is not visible on this map.');return}
 if(a==='ini'&&t){const c=tbIniOf(t);if(c)tbGoIni(c.id);return}
 if(a==='turn'&&t&&isOwner){const c=tbIniOf(t);if(c)iniSet({cur:c.id,active:true});return}
 if(a==='sheet'&&t)return tbOpenSheet(t);
 if(a==='cbpin'&&t)return tbCluePin(t);
 if(a==='hp')return tbHpAdd(x==='full'?'full':+x);
 if(a==='roll'&&t)return tbRollOpen(t);
 if(a==='mic'){tbMicon=x;tbLSset('sr_tbmi',x);tbBar(m);return}
 if(a==='mclr')return tbMarkClear(false);
 if(a==='rm'&&t)return tbRemove(t);
 if(!isOwner)return;
 if(a==='looksend')return tbLookSendView();
 if(a==='mclra')return tbMarkClear(true);
 if(a==='vwsave'){const i=$('#tbvwn');const nm=i?i.value:'';if(i)i.value='';return tbViewSave(nm)}
 if(a==='vwgo')return tbViewGo(x);if(a==='vwsend')return tbViewSend(x);if(a==='vwdel')return tbViewDel(x);
 if(/^ly/.test(a))return tbLyAct(a,x);
 if(a==='mexp')return tbMapExport();
 if(a==='mimp'){const f=$('#tbmpf');if(f){f.value='';f.onchange=()=>tbMapImport(f.files&&f.files[0]);f.click()}return}
 if(a==='wall'){tbWK=x;tbLSset('sr_tbwk',x);return tbAct('tool','wall')}
 if(a==='avtog'&&m){m.av=(m.av===false);db.doc('tbmaps/'+m.id).update({av:m.av}).catch(()=>{});tbVisSig='';tbBar(m);tbDraw();return}
 if(a==='wallsclr')return tbWallsClear();
 if(a==='rvl'){const L=tbSelToks();if(!L.length)return tbNote('Select a token first.');return tbRevealAround(L,tbRvN,x==='1')}
 if(a==='noterev'){const n=(pm.tbmeta||[]).find(z=>z&&z.id===x&&z.kind==='note');if(n)tbSet('tbmeta',n.id,{shown:!n.shown}).then(()=>{tbDraw()}).catch(()=>{});return}
 if(a==='notectr'){const n=(pm.tbmeta||[]).find(z=>z&&z.id===x&&z.kind==='note'),v=$('#tbview');if(n&&v){tbV.x=v.clientWidth/2-(+n.x||0)*tbV.z;tbV.y=v.clientHeight/2-(+n.y||0)*tbV.z;tbApply()}return}
 if(a==='noteopen')return tbNoteOpen(x);
 if(a==='addmap'){const f=$('#tbfile');if(f){f.value='';f.onchange=()=>tbUploadMap(f.files&&f.files[0]);f.click()}return}
 if(a==='mset')return tbMapSet();
 if(a==='send'&&m)return tbSetActive(m.id);
 if(a==='clr')return tbClearTemp();
 if(a==='fogm'){tbFog.mode=x;tbBar(m);return}if(a==='fogs'){tbFog.shape=x;tbBar(m);return}if(a==='fogn'){tbFog.n=+x||1;tbBar(m);return}if(a==='fogall')return tbFogAll(x==='rev');
 if(a==='fogtog'&&m){db.doc('tbmaps/'+m.id).update({fog:!tbFogOn(m)}).catch(()=>{});m.fog=!tbFogOn(m);tbDraw();return}
 if(a==='rhid'){const r=tbTok(x);if(r)tbTokFlag(r,{hid:!r.hid});return}
 if(a==='rdown'){const r=tbTok(x);if(r)tbTokFlag(r,{mark:r.mark==='down'?'':'down'});return}
 if(a==='rrm'){const r=tbTok(x);if(r)tbRemove(r);return}
 if(a==='gscale'&&m){const G=tbGridDraft();G.gs=Math.round(tbNum(G.gs*(+x||1),8,Math.max(m.w,m.h),G.gs)*100)/100;tbGridFields();return}
 if(a==='nudge'&&m){const G=tbGridDraft(),k=e&&e.shiftKey?10:1,gg=tbGeo(m,G);G.gx=(gg.ox<0?gg.ox+gg.gs:0)+(+x||0)*k;G.gy=(gg.oy<0?gg.oy+gg.gs:0)+(+y||0)*k;tbGridFields();return}
 if(a==='gsq'&&m){const G=tbGridDraft();G.sq=!G.sq;const v=$('#tbview');if(v)v.classList.toggle('sq',G.sq);tbGridFields();return}
 if(a==='gsave')return tbGridSave();
 if(a==='gcancel'){tbGrid=null;const v=$('#tbview');if(v)v.classList.remove('sq');tbGridFields();tbDraw();return}
 if(!t)return;
 if(a==='edit')return tbEdit(t);
 if(a==='dup')return tbDup(t);
 if(a==='down')return tbTokFlag(t,{mark:t.mark==='down'?'':'down'});
 if(a==='lock')return tbTokFlag(t,{lock:!t.lock});
 if(a==='hide')return tbTokFlag(t,{hid:!t.hid});
 if(a==='lib')return tbToLib(t)}
document.addEventListener('input',e=>{const i=e.target;if(i&&i.dataset&&i.dataset.lyop&&isOwner){const l=tbLayer(i.dataset.lyop);if(l){if(l._op0===undefined)l._op0=l.op;l.op=Math.max(.1,Math.min(1,(+i.value||100)/100));tbLayersDraw(tbCur())}return}
 if(!i||!i.id)return;
 if(i.id==='tbmlb'){tbMlab=String(i.value||'').slice(0,24);tbLSset('sr_tbml',tbMlab);return}
 if(i.id==='tbtq'){tbBar(tbCur());return}
 if(i.id==='tbgo'){tbGO=tbNum(i.value,0,100,50);tbLSset('sr_tbgo',tbGO);const l=$('#tbgov');if(l)l.textContent=Math.round(tbGO)+'%';tbGridQ();return}
 if(i.id==='tbsf'){tbShFill=tbNum(i.value,0,80,26);tbLSset('sr_tbsf',tbShFill);const l=$('#tbsfv');if(l)l.textContent=Math.round(tbShFill/.8)+'%';tbShpDraw();return}
 if(i.id==='tbfd'){tbFD=tbNum(i.value,10,240,120);tbLSset('sr_tbfd',tbFD);const l=$('#tbfdv');if(l)l.textContent=Math.round(tbFD/2.4)+'%';const m=tbCur();if(m&&tbFogOn(m)){const g=tbGeoM(m);tbFogCanvas(m,g,tbFogRows(m,g))}return}
 if(!/^tbg-/.test(i.id)||!isOwner)return;const m=tbCur();if(!m)return;const v=parseFloat(i.value);if(!isFinite(v))return;
 const G=tbGridDraft(),cur=tbGeo(m,G),sx=cur.ox<0?cur.ox+cur.gs:0,sy=cur.oy<0?cur.oy+cur.gs:0;
 if(i.id==='tbg-gs'||i.id==='tbg-rng'){if(v<8)return;G.gs=v;G.gx=sx;G.gy=sy}
 else if(i.id==='tbg-cols'){if(v<1)return;G.gs=Math.max(8,m.w/v);G.gx=sx;G.gy=sy}
 else if(i.id==='tbg-gx')G.gx=v;else if(i.id==='tbg-gy')G.gy=v;else return;
 tbGridFields(i.id)});
document.addEventListener('change',e=>{const i=e.target;
 if(i&&i.dataset&&i.dataset.lyop&&isOwner){const l=tbLayer(i.dataset.lyop);if(l){const o=l._op0===undefined?l.op:l._op0,v=Math.max(.1,Math.min(1,(+i.value||100)/100));delete l._op0;l.op=o;tbLySet(l.id,{op:v},'change layer opacity')}return}
 if(i&&i.id==='tbhpc'){tbHpSet('hp',i.value);return}
 if(i&&i.id==='tbhpm'){tbHpSet('mhp',i.value);return}
 if(i&&i.id==='tbhpv'&&isOwner){const L=tbSelToks();tbTokEdit(L,t=>({hpv:!!i.checked}),'show or hide the health bar');return}
 if(i&&i.id==='tbaur'){const n=+i.value||0;i.blur();tbAuraSet(n,null);tbBar();return}
 if(i&&i.id==='tbspd'){const n=+i.value||0,L=tbSelToks().filter(tbCndCan);i.blur();tbTokEdit(L,t=>({spd:n}),'set speed');return}
 if(i&&i.id==='tbvr'&&isOwner){const n=+i.value||0,L=tbSelToks();i.blur();tbVisSig='';tbTokEdit(L,t=>({vr:n}),n?'set sight or light':'switch off sight or light');return}
 if(i&&i.id==='tbrvn'){tbRvN=Math.max(1,Math.min(30,+i.value||4));tbLSset('sr_tbrv',tbRvN);i.blur();tbBar();return}
 if(i&&i.id==='tbft'){tbFollow=!!i.checked;tbLSset('sr_tbft',tbFollow?'1':'0');return}
 if(i&&i.id==='tbshsn'){const s=tbShpSel()[0];if(s&&tbShpMoveOk(s)){const a=i.checked?tbShpToSnap(s):tbShpToFree(s);tbShpEdit([{id:s.id,b:tbPick(s,Object.keys(a)),a}],i.checked?'snap a shape to the grid':'free a shape from the grid')}return}
 if(i&&i.id==='tbshlb'){const s=tbShpSel()[0];if(s&&tbShpMoveOk(s)){const v=String(i.value||'').trim().slice(0,40);if(v!==String(s.label||''))tbShpEdit([{id:s.id,b:{label:s.label||''},a:{label:v}}],'label a shape')}return}
 if(i&&i.id==='tbmsel'&&isOwner){tbVid=i.value;tbGrid=null;tbShown='';const v=$('#tbview');if(v)v.classList.remove('sq');tbDraw()}});
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.tbd)tbOpenS[d.dataset.tbd]=d.open?1:0},true);
document.addEventListener('keydown',e=>{if(!$('#tbroot')||($('#modal')&&$('#modal').innerHTML))return;const tg=document.activeElement&&document.activeElement.tagName;
 if(e.code==='Space'){if(/INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY/.test(tg||''))return;tbSpace=true;e.preventDefault();return}
 if(/INPUT|TEXTAREA|SELECT/.test(tg||''))return;
 if(e.key!=='Escape'&&!tbShpD){const m0=tbCur();if(m0&&tbShpKey(e,m0))return}
 if(e.key==='Escape'){if(tbMq){tbMq=null;tbRulDraw();return}if(tbShpD){tbShpD=null;tbRulDraw();return}if(tbShMv||tbShRz){const M=tbShMv,R=tbShRz;tbShMv=tbShRz=null;if(M)M.ids.forEach(id=>{const q=tbShpById(id);if(q&&M.orig[id])Object.assign(q,M.orig[id])});if(R){const q=tbShpById(R.id);if(q)Object.assign(q,R.orig)}tbAfter();return}if(tbXP){tbXP=false;tbSizeApply();tbViewSync();tbRail(tbCur());setTimeout(tbFit,40);return}if(tbShS.length||tbSel){tbSel=null;tbTS=[];tbShS=[];tbRul=null;tbDraw();tbRulDraw();return}if(tbTool!=='move'){tbAct('tool','move');return}tbRul=null;tbDraw();return}
 const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d||!tbSel)return;tbSelNorm();if(tbTS.length>1){e.preventDefault();tbGroupShift(tbSelToks().filter(z=>!(z.lock&&!isOwner)),d[0],d[1]);tbDraw();return}const t=tbTok(tbSel),m=tbCur();if(!t||!m||(t.lock&&!isOwner))return;e.preventDefault();
 const g=tbGeoM(m),need=Math.max(1,Math.ceil(+t.sz||1));const oc=t.c,orr=t.r;t.c=Math.max(0,Math.min(g.cols-need,(+t.c||0)+d[0]));t.r=Math.max(0,Math.min(g.rows-need,(+t.r||0)+d[1]));tbDraw();tbMoveWrite(t.id,t.c,t.r);if(oc!==t.c||orr!==t.r)tbTokMoveHist(t,oc,orr)});
document.addEventListener('keyup',e=>{if(e.code==='Space')tbSpace=false});window.addEventListener('blur',()=>{tbSpace=false});
async function tbSetActive(id){try{await db.doc('tbmeta/state').set({active:id,ts:Date.now(),by:handle||'GM'});const o=(pm.tbmeta||[]).find(x=>x.id==='state');if(o)o.active=id;else(pm.tbmeta=pm.tbmeta||[]).push({id:'state',active:id});tbDraw()}catch(e){alert('Could not save: '+(e.message||e.code))}}
async function tbRemove(t,noAsk){if(!tbCanRm(t))return;const nm=t.name||'this token';if(!noAsk&&!await ask('Take '+nm+' off the map?','Remove'))return;
 try{const set=v=>tbSet('tbtoks',t.id,v?{deleted:true,delAt:Date.now()}:{deleted:false});await set(true);tbSel=null;const op=tbHPush('remove '+nm,async()=>{await set(false);tbSel=t.id;tbShS=[]},()=>set(true));tbAfter();undoBar(nm+' removed from the map.',async()=>{tbHDrop(op);await set(false);tbSel=t.id;tbShS=[];tbRedo.push(op);tbAfter()})}catch(e){alert('Could not remove: '+(e.message||e.code))}}
async function tbClearTemp(){const m=tbCur();if(!m||!isOwner)return;const L=tbToks(m).filter(t=>t.temp);if(!L.length)return alert('There are no encounter tokens on this map. Tokens added from the Encounter tab are marked as temporary.');
 if(!await ask('Remove all '+L.length+' encounter token'+(L.length===1?'':'s')+' from this map? Your characters and permanent tokens stay.','Clear encounter'))return;
 try{const set=v=>Promise.all(L.map(t=>tbSet('tbtoks',t.id,v?{deleted:true,delAt:Date.now()}:{deleted:false})));await set(true);tbSel=null;const op=tbHPush('clear the encounter',()=>set(false),()=>set(true));tbAfter();undoBar('Encounter cleared.',async()=>{tbHDrop(op);await set(false);tbRedo.push(op);tbAfter()})}catch(e){alert('Could not clear: '+(e.message||e.code))}}
function tbNextNum(m,base){let n=0;const re=new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' (\\d+)$','i');tbToks(m).forEach(t=>{const k=re.exec(t.name||'');if(k)n=Math.max(n,+k[1])});return n+1}
async function tbDup(t){const m=tbCur();if(!m||!isOwner)return;const base=String(t.name||'Token').replace(/\s+\d+$/,''),nm=base+' '+tbNextNum(m,base);
 try{const id=await tbAddTok(m,{kind:t.kind,name:nm,img:t.img,emoji:t.emoji,col:t.col,sheet:'',sz:t.sz,temp:t.temp,hid:t.hid,note:t.note});tbSel=id;tbDraw()}catch(e){alert('Could not copy: '+(e.message||e.code))}}
function tbSpot(m,g,sz){const v=$('#tbview'),cx=((v?v.clientWidth/2:300)-tbV.x)/tbV.z,cy=((v?v.clientHeight/2:200)-tbV.y)/tbV.z,c0=Math.max(0,Math.min(g.cols-1,Math.floor((cx-g.ox)/g.gs))),r0=Math.max(0,Math.min(g.rows-1,Math.floor((cy-g.oy)/g.gs))),need=Math.max(1,Math.ceil(sz)),occ=new Set();
 tbToks(m).forEach(t=>{const s=Math.max(1,Math.ceil(+t.sz||1));for(let i=0;i<s;i++)for(let j=0;j<s;j++)occ.add(((+t.c||0)+i)+','+((+t.r||0)+j))});
 const ok=(c,r)=>{if(c<0||r<0||c+need>g.cols||r+need>g.rows)return false;for(let i=0;i<need;i++)for(let j=0;j<need;j++)if(occ.has((c+i)+','+(r+j)))return false;return true};
 for(let R=0;R<40;R++)for(let dr=-R;dr<=R;dr++)for(let dc=-R;dc<=R;dc++){if(Math.max(Math.abs(dc),Math.abs(dr))!==R)continue;if(ok(c0+dc,r0+dr))return {c:c0+dc,r:r0+dr}}
 return {c:Math.max(0,Math.min(g.cols-need,c0)),r:Math.max(0,Math.min(g.rows-need,r0))}}
// a token's stat block, cleaned: numbers kept in range, text trimmed, at most six weapons
function tbCsClean(x){x=x&&typeof x==='object'?x:{};const n=(v,hi)=>Math.max(0,Math.min(hi,Math.floor(+v)||0)),o={};
 ['par','tg','ar','fi','sh','st','vi','sp'].forEach(k=>{o[k]=n(x[k],k==='tg'?40:30)});o.wc=!!x.wc;if(x.bn!==undefined&&x.bn!==null&&x.bn!=='')o.bn=n(x.bn,20);
 if(x.nt)o.nt=String(x.nt).slice(0,300);if(x.ak)o.ak=String(x.ak).slice(0,20);
 o.w=(Array.isArray(x.w)?x.w:[]).slice(0,6).filter(w=>w&&typeof w==='object').map(w=>{const r={n:String(w.n||'Weapon').slice(0,40),rng:String(w.rng||'').slice(0,20),dmg:String(w.dmg||'').slice(0,20),ap:n(w.ap,20),sk:String(w.sk||'').slice(0,20),rof:w.rof?String(n(w.rof,12)||''):''};if(+w.d)r.d=Math.max(4,Math.min(12,Math.floor(+w.d)));return r});return o}
async function tbAddTok(m,d){const g=tbGeoM(m),sz=Math.max(.5,Math.min(8,+d.sz||1)),sp=d.at||tbSpot(m,g,sz);
 const doc={map:m.id,kind:TB_K[d.kind]?d.kind:'prop',name:String(d.name||'Token').slice(0,60),img:tbOk(d.img),emoji:String(d.emoji||'').slice(0,8),col:tbColOk(d.col),sheet:d.sheet||'',sz,c:sp.c,r:sp.r,temp:!!d.temp,hid:!!d.hid,lock:false,mark:'',note:String(d.note||'').slice(0,200),ar:Math.max(0,Math.min(30,+d.ar||0)),ac:tbColOk(d.ac),...(d.vh&&d.vh.s&&d.vh.i?{vh:{s:String(d.vh.s),i:String(d.vh.i)}}:{}),...(d.cs?{cs:tbCsClean(d.cs)}:{}),...(+d.mhp>0?{mhp:Math.min(99,Math.floor(+d.mhp)),hp:Math.min(99,Math.floor(d.hp==null?+d.mhp:+d.hp))}:{}),by:handle||'?',uid:uid||'',ts:Date.now()};
 const r=await db.collection('tbtoks').add(doc);tbLoc('tbtoks',r.id,doc);if(!d.nh){const id=r.id,set=v=>tbSet('tbtoks',id,{deleted:v});tbHPush('add '+(doc.name||'a token'),()=>set(true),async()=>{await set(false);tbSel=id;tbShS=[]})}return r.id}
async function tbToLib(t){if(!isOwner)return;const d={name:String(t.name||'Token').replace(/\s+\d+$/,''),kind:t.kind,img:tbOk(t.img),emoji:t.emoji||'',col:tbColOk(t.col),sz:t.sz||1,note:t.note||'',...(t.cs?{cs:tbCsClean(t.cs)}:{}),...(+t.mhp>0?{mhp:+t.mhp}:{}),ts:Date.now()};
 try{await db.collection('tblib').add(d);undoBar('Saved "'+d.name+'" to the library.',()=>{})}catch(e){alert('Could not save: '+(e.message||e.code))}}
// ---- map upload
async function tbUploadMap(f){if(!f||!isOwner)return;if(!assets)return alert('Uploading is not available right now. Try again in a moment.');
 const hd=$('#tbhd');if(hd){hd._h='';hd.innerHTML='<span class="meta">Uploading the map…</span>'}
 try{const s=await tbShrink(f,3000,.86);if(!s.w||!s.h)throw {message:'That file is not a picture this browser can read. Try a PNG, JPG or WebP.'};
  const up=await assets.upload(s.blob),gs=Math.max(24,Math.round(Math.max(s.w,s.h)/36)),doc={name:String(f.name||'Map').replace(/\.[a-z0-9]+$/i,'').slice(0,60)||'Map',img:up.id,w:s.w,h:s.h,gs,gx:0,gy:0,grid:true,gc:'l',su:1,un:'m',fog:false,by:handle||'GM',ts:Date.now()};
  const r=await db.collection('tbmaps').add(doc);tbLoc('tbmaps',r.id,doc);tbVid=r.id;
  if(!tbActive())await tbSetActive(r.id);
  tbShown='';tbDraw();tbGridEdit()}
 catch(e){alert('Could not add the map: '+(e.message||e.code||e));tbDraw()}}
// ---- appearance
{const st=document.createElement('style');st.textContent=`
#tbroot .bar{flex-wrap:wrap;gap:8px}#tbhd{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#tbview{position:relative;height:var(--tbh,calc(100vh - 330px));min-height:240px;overflow:hidden;background:#04060a;border:1px solid #2c3f55;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;box-shadow:inset 0 0 70px rgba(0,0,0,.85),0 0 0 3px #0a0f16,0 0 0 4px #25364b}
#tbview::before,#tbview::after{content:"";position:absolute;width:18px;height:18px;z-index:6;pointer-events:none;border:2px solid var(--cy);opacity:.7}#tbview::before{left:4px;bottom:4px;border-width:0 0 2px 2px}#tbview::after{right:4px;bottom:4px;border-width:0 2px 2px 0}
#tbview.pan{cursor:grabbing}#tbview.tool-ruler,#tbview.tool-ping,#tbview.tool-fog,#tbview.tool-shape,#tbview.tool-erase,#tbview.sq{cursor:crosshair}
#tbmw,#tbtw{position:absolute;left:0;top:0;transform-origin:0 0}#tbtw{pointer-events:none}
#tbimg{display:block;width:100%;height:100%;max-width:none;-webkit-user-drag:none;user-select:none}
#tbgrid{position:absolute;left:0;top:0;pointer-events:none}
#tbfogc{position:absolute;image-rendering:pixelated;pointer-events:none;display:none}
#tbsvg,#tbshp,#tbwalls,#tbrange{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
#tbgh{display:none;position:absolute;box-sizing:border-box;border:2px dashed #ffd60a;background:rgba(255,214,10,.14);pointer-events:none}
.tbt{position:absolute;box-sizing:border-box;cursor:grab;touch-action:none;pointer-events:auto;transition:left .35s ease,top .35s ease}.tbt.drag{transition:none;cursor:grabbing;z-index:50}
.tbt.lk{cursor:not-allowed}.tbt.lk .tbi{filter:saturate(.7)}
.tbi{position:absolute;inset:5%;border-radius:50%;border:3px solid var(--k);background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;color:var(--k);font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.75);overflow:hidden}
.tbt.k-item .tbi,.tbt.k-prop .tbi{border-radius:14%}
.tbt.sel .tbi{box-shadow:0 0 0 3px #fff,0 0 16px var(--k)}
.tbt.turn .tbi{animation:tbturn 1.3s ease-in-out infinite}@keyframes tbturn{50%{box-shadow:0 0 0 4px #ffd60a,0 0 24px #ffd60a}}
.tbt.dn .tbi{filter:grayscale(1) brightness(.55)}.tbx{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ff3b3b;font-size:calc(34px*var(--iz,1));text-shadow:0 0 6px #000;pointer-events:none;line-height:1}
.tbt:hover,.tbt.sel{z-index:40}.tbt:hover .tbl,.tbt.sel .tbl{max-width:none;overflow:visible}.tbt.hd{opacity:.5}.tbt.hd .tbi{border-style:dashed}
.tbl{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:1px;white-space:nowrap;max-width:150%;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box;font-size:calc(12px*var(--iz,1));line-height:1.35;padding:0 .4em;background:rgba(5,8,12,.85);color:#fff;border:1px solid var(--k);pointer-events:none;z-index:2}
.tbw{position:absolute;right:-2px;top:-2px;background:#c0262d;color:#fff;font-size:calc(11px*var(--iz,1));padding:0 .35em;border-radius:3px;z-index:2;pointer-events:none;font-weight:700}
.tbk{position:absolute;left:-2px;top:-2px;font-size:calc(11px*var(--iz,1));z-index:2;pointer-events:none}
#tbrail{display:flex;flex-direction:column;gap:6px;flex:none}
#tbzoom{position:absolute;right:8px;top:8px;display:flex;gap:6px;align-items:center;z-index:8;background:rgba(5,8,12,.78);border:1px solid var(--line);padding:3px 6px}#tbzl{min-width:42px;text-align:center;font-size:12px;color:var(--dim)}
.tbb{width:38px;height:38px;padding:0;background:rgba(5,8,12,.82);border:1px solid #2c3f55;color:var(--tx);font-size:18px;cursor:pointer;line-height:1}.tbb:hover{border-color:var(--cy)}.tbb.on{border-color:var(--cy);color:var(--cy);background:rgba(0,240,208,.14)}.tbb.add{border-color:#39ff14;color:#39ff14;font-size:24px}
#tbzoom .tbb{width:30px;height:30px}
#tbempty{display:none;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;padding:20px;z-index:7;background:radial-gradient(circle at 50% 40%,#0c1520,#04060a)}
#tbsel{min-height:20px}.tbtb,.tbfb,.tbgb{border:1px solid var(--line);background:rgba(8,12,18,.7);padding:8px 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tbgb{display:block}
.tbac{display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:auto}.tbk2{border:1px solid var(--k);color:var(--k);padding:0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.tbseg{display:inline-flex;gap:0}.tbseg .btn{margin:0}.btn.on{border-color:var(--cy);color:var(--cy);background:rgba(0,240,208,.14)}
.tbgf{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}.tbgf label{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--dim)}.tbgf input{width:120px}.tbgn{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#tbpings{position:absolute;left:0;top:0}.tbpg{position:absolute;width:0;height:0}.tbpg i{position:absolute;left:0;top:0;width:calc(90px*var(--iz,1));height:calc(90px*var(--iz,1));margin:calc(-45px*var(--iz,1)) 0 0 calc(-45px*var(--iz,1));border:calc(4px*var(--iz,1)) solid #ffd60a;border-radius:50%;opacity:0;animation:tbpg 1.6s ease-out 2}.tbpg i:nth-child(2){animation-delay:.25s}.tbpg i:nth-child(3){animation-delay:.5s}
.tbpg span{position:absolute;left:0;top:calc(52px*var(--iz,1));transform:translateX(-50%);background:#ffd60a;color:#000;font-size:calc(12px*var(--iz,1));padding:0 .4em;font-weight:700;white-space:nowrap}
@keyframes tbpg{0%{transform:scale(.15);opacity:1}100%{transform:scale(1.5);opacity:0}}
.tbtabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.tbtabs .btn.on{border-color:var(--cy);color:var(--cy)}
.tbpr{display:flex;gap:10px;align-items:center;cursor:pointer}.tbpr img,.tbpr .tbpi{width:40px;height:40px;object-fit:cover;border:1px solid var(--line);flex:none;display:flex;align-items:center;justify-content:center;font-size:22px;background:#0b1018}
.tbpg2{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}.tbpg2 a{border:1px solid var(--line);padding:8px 4px;text-align:center;cursor:pointer;background:#0b1018;font-size:12px}.tbpg2 a:hover{border-color:var(--cy)}.tbpg2 a span{display:block;font-size:26px;line-height:1.2}
.tbsw{display:inline-flex;gap:4px;flex-wrap:wrap}.tbsw i{width:22px;height:22px;border:2px solid transparent;cursor:pointer;display:inline-block}.tbsw i.on{border-color:#fff}
@media(max-width:700px){.tbb{width:42px;height:42px}}
#tbstage{display:flex;gap:8px;align-items:flex-start}
#tbcol{flex:1;min-width:0;display:flex;flex-direction:column}
#tbvh{height:14px;cursor:ns-resize;display:flex;align-items:center;justify-content:center;touch-action:none;margin-top:3px}#tbvh i{display:block;width:70px;height:5px;border-radius:3px;background:#2c3f55}#tbvh:hover i{background:var(--cy)}
#tbdiv{width:10px;align-self:stretch;cursor:ew-resize;touch-action:none;position:relative;flex:none}#tbdiv::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:2px;background:#2c3f55}#tbdiv:hover::after{background:var(--cy)}
#tbpanel{width:var(--tbpw,300px);flex:none;max-height:var(--tbh,calc(100vh - 330px));overflow:auto;border:1px solid var(--line);background:rgba(8,12,18,.78)}
.tbpc #tbpanel,.tbpc #tbdiv{display:none}
.tbsec{border-bottom:1px solid var(--line)}.tbsec>summary{cursor:pointer;padding:8px 10px;letter-spacing:.08em;font-size:12px;color:var(--cy);text-transform:uppercase;user-select:none}.tbpb{padding:2px 10px 12px}
.tbtr{display:flex;gap:6px;align-items:center;padding:3px 4px;cursor:pointer;border-left:3px solid var(--k);margin:2px 0;background:#0b1018;min-height:32px}.tbtr:hover{background:#111b29}.tbtr.sel{outline:1px solid var(--cy)}.tbtr.dn .tbtn{text-decoration:line-through;opacity:.65}
.tbtd{width:26px;height:26px;border-radius:50%;flex:none;background-size:cover;background-position:center;border:2px solid var(--k);display:flex;align-items:center;justify-content:center;font-size:11px;font-style:normal;color:var(--k);font-weight:700;overflow:hidden}
.tbtn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbtg{font-size:11px}
.tbtq{display:flex;gap:2px;flex:none}.tbtq button{padding:0 5px;height:24px;background:transparent;border:1px solid var(--line);color:var(--tx);cursor:pointer;font-size:12px}.tbtq button:hover{border-color:var(--cy)}
.tbgh{font-size:11px;letter-spacing:.08em;color:var(--dim);margin:8px 0 2px;text-transform:uppercase}
.tbsl{display:block;font-size:12px;color:var(--dim);margin:8px 0}.tbsl input[type=range]{width:100%;padding:0;margin-top:2px}
.tbvb{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}
#tbtq{margin-bottom:6px}.tbtbtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
#tbpanel .tbgf{margin:6px 0}#tbpanel .tbgf input{width:96px}
#tbpanel .tbac{margin:8px 0 0}
#tbpanel .tbtb{border:0;background:none;padding:0;display:block}
#tbpanel .btn:disabled{opacity:.4;cursor:default}
#tbroot.tbfull{position:fixed;inset:0;z-index:8;background:var(--bg);padding:8px 10px;display:flex;flex-direction:column;overflow:auto}
.tbfull #tbstage{flex:1;min-height:0;align-items:stretch}.tbfull #tbview{height:auto;flex:1;min-height:0}.tbfull #tbpanel{max-height:none}.tbfull #tbvh{display:none}
.tbshl{max-height:170px;overflow:auto;margin:6px 0}.tbsr{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:12px}.tbsr i{width:12px;height:12px;border-radius:3px;flex:none}.tbsr span{flex:1;min-width:0}
#tbtoast{position:absolute;left:12px;bottom:26px;z-index:7;background:#0b1018;border:1px solid var(--cy);padding:5px 10px;font-size:13px;opacity:0;transition:opacity .25s;pointer-events:none;max-width:70%}#tbtoast.on{opacity:1}
.tbshs{border:1px solid #2c3f55;background:#0a1018;padding:8px;margin:8px 0}.tbck{display:inline-flex;gap:6px;align-items:center;font-size:13px;cursor:pointer;white-space:nowrap;margin:0}.tbck input{width:auto!important;margin:0;display:inline-block}.tbsr.sel{background:rgba(0,240,208,.12);outline:1px solid var(--cy)}.tbsr{cursor:pointer}.tbkeys{margin-top:8px}.tbkeys summary{cursor:pointer;color:var(--cy);font-size:12px}
@media(max-width:900px){#tbstage{flex-wrap:wrap}#tbdiv{display:none}#tbpanel{width:100%;max-height:none;flex:1 1 100%;order:3}}
@media (prefers-reduced-motion:reduce){.tbt,.tbpg i,.tbt.turn .tbi{animation:none;transition:none}}
`;document.head.appendChild(st)}

window.__tbv='1bab279280';
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
  em.innerHTML=isOwner?`<div><div style="font-size:calc(42px*var(--ts,1))">♟</div><b>No map yet.</b><div class="meta" style="margin:6px 0 12px">Upload a picture of a battle map, then line the grid up with it.</div><button class="btn grn" data-tbx="addmap">⬆ Upload a map</button></div>`:`<div><div style="font-size:calc(42px*var(--ts,1))">♟</div><b>The table is empty.</b><div class="meta" style="margin-top:6px">The GM has not put a map on the table yet.</div></div>`;
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
#tbzoom{position:absolute;right:8px;top:8px;display:flex;gap:6px;align-items:center;z-index:8;background:rgba(5,8,12,.78);border:1px solid var(--line);padding:3px 6px}#tbzl{min-width:42px;text-align:center;font-size:calc(12px*var(--ts,1));color:var(--dim)}
.tbb{width:38px;height:38px;padding:0;background:rgba(5,8,12,.82);border:1px solid #2c3f55;color:var(--tx);font-size:calc(18px*var(--ts,1));cursor:pointer;line-height:1}.tbb:hover{border-color:var(--cy)}.tbb.on{border-color:var(--cy);color:var(--cy);background:rgba(0,240,208,.14)}.tbb.add{border-color:#39ff14;color:#39ff14;font-size:calc(24px*var(--ts,1))}
#tbzoom .tbb{width:30px;height:30px}
#tbempty{display:none;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;padding:20px;z-index:7;background:radial-gradient(circle at 50% 40%,#0c1520,#04060a)}
#tbsel{min-height:20px}.tbtb,.tbfb,.tbgb{border:1px solid var(--line);background:rgba(8,12,18,.7);padding:8px 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tbgb{display:block}
.tbac{display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:auto}.tbk2{border:1px solid var(--k);color:var(--k);padding:0 6px;font-size:calc(12px*var(--ts,1));letter-spacing:.06em;text-transform:uppercase}
.tbseg{display:inline-flex;gap:0}.tbseg .btn{margin:0}.btn.on{border-color:var(--cy);color:var(--cy);background:rgba(0,240,208,.14)}
.tbgf{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}.tbgf label{display:flex;flex-direction:column;gap:2px;font-size:calc(12px*var(--ts,1));color:var(--dim)}.tbgf input{width:120px}.tbgn{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#tbpings{position:absolute;left:0;top:0}.tbpg{position:absolute;width:0;height:0}.tbpg i{position:absolute;left:0;top:0;width:calc(90px*var(--iz,1));height:calc(90px*var(--iz,1));margin:calc(-45px*var(--iz,1)) 0 0 calc(-45px*var(--iz,1));border:calc(4px*var(--iz,1)) solid #ffd60a;border-radius:50%;opacity:0;animation:tbpg 1.6s ease-out 2}.tbpg i:nth-child(2){animation-delay:.25s}.tbpg i:nth-child(3){animation-delay:.5s}
.tbpg span{position:absolute;left:0;top:calc(52px*var(--iz,1));transform:translateX(-50%);background:#ffd60a;color:#000;font-size:calc(12px*var(--iz,1));padding:0 .4em;font-weight:700;white-space:nowrap}
@keyframes tbpg{0%{transform:scale(.15);opacity:1}100%{transform:scale(1.5);opacity:0}}
.tbtabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.tbtabs .btn.on{border-color:var(--cy);color:var(--cy)}
.tbpr{display:flex;gap:10px;align-items:center;cursor:pointer}.tbpr img,.tbpr .tbpi{width:40px;height:40px;object-fit:cover;border:1px solid var(--line);flex:none;display:flex;align-items:center;justify-content:center;font-size:calc(22px*var(--ts,1));background:#0b1018}
.tbpg2{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}.tbpg2 a{border:1px solid var(--line);padding:8px 4px;text-align:center;cursor:pointer;background:#0b1018;font-size:calc(12px*var(--ts,1))}.tbpg2 a:hover{border-color:var(--cy)}.tbpg2 a span{display:block;font-size:calc(26px*var(--ts,1));line-height:1.2}
.tbsw{display:inline-flex;gap:4px;flex-wrap:wrap}.tbsw i{width:22px;height:22px;border:2px solid transparent;cursor:pointer;display:inline-block}.tbsw i.on{border-color:#fff}
@media(max-width:700px){.tbb{width:42px;height:42px}}
#tbstage{display:flex;gap:8px;align-items:flex-start}
#tbcol{flex:1;min-width:0;display:flex;flex-direction:column}
#tbvh{height:14px;cursor:ns-resize;display:flex;align-items:center;justify-content:center;touch-action:none;margin-top:3px}#tbvh i{display:block;width:70px;height:5px;border-radius:3px;background:#2c3f55}#tbvh:hover i{background:var(--cy)}
#tbdiv{width:10px;align-self:stretch;cursor:ew-resize;touch-action:none;position:relative;flex:none}#tbdiv::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:2px;background:#2c3f55}#tbdiv:hover::after{background:var(--cy)}
#tbpanel{width:var(--tbpw,300px);flex:none;max-height:var(--tbh,calc(100vh - 330px));overflow:auto;border:1px solid var(--line);background:rgba(8,12,18,.78)}
.tbpc #tbpanel,.tbpc #tbdiv{display:none}
.tbsec{border-bottom:1px solid var(--line)}.tbsec>summary{cursor:pointer;padding:8px 10px;letter-spacing:.08em;font-size:calc(12px*var(--ts,1));color:var(--cy);text-transform:uppercase;user-select:none}.tbpb{padding:2px 10px 12px}
.tbtr{display:flex;gap:6px;align-items:center;padding:3px 4px;cursor:pointer;border-left:3px solid var(--k);margin:2px 0;background:#0b1018;min-height:32px}.tbtr:hover{background:#111b29}.tbtr.sel{outline:1px solid var(--cy)}.tbtr.dn .tbtn{text-decoration:line-through;opacity:.65}
.tbtd{width:26px;height:26px;border-radius:50%;flex:none;background-size:cover;background-position:center;border:2px solid var(--k);display:flex;align-items:center;justify-content:center;font-size:calc(11px*var(--ts,1));font-style:normal;color:var(--k);font-weight:700;overflow:hidden}
.tbtn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbtg{font-size:calc(11px*var(--ts,1))}
.tbtq{display:flex;gap:2px;flex:none}.tbtq button{padding:0 5px;height:24px;background:transparent;border:1px solid var(--line);color:var(--tx);cursor:pointer;font-size:calc(12px*var(--ts,1))}.tbtq button:hover{border-color:var(--cy)}
.tbgh{font-size:calc(11px*var(--ts,1));letter-spacing:.08em;color:var(--dim);margin:8px 0 2px;text-transform:uppercase}
.tbsl{display:block;font-size:calc(12px*var(--ts,1));color:var(--dim);margin:8px 0}.tbsl input[type=range]{width:100%;padding:0;margin-top:2px}
.tbvb{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}
#tbtq{margin-bottom:6px}.tbtbtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
#tbpanel .tbgf{margin:6px 0}#tbpanel .tbgf input{width:96px}
#tbpanel .tbac{margin:8px 0 0}
#tbpanel .tbtb{border:0;background:none;padding:0;display:block}
#tbpanel .btn:disabled{opacity:.4;cursor:default}
#tbroot.tbfull{position:fixed;inset:0;z-index:8;background:var(--bg);padding:8px 10px;display:flex;flex-direction:column;overflow:auto}
.tbfull #tbstage{flex:1;min-height:0;align-items:stretch}.tbfull #tbview{height:auto;flex:1;min-height:0}.tbfull #tbpanel{max-height:none}.tbfull #tbvh{display:none}
.tbshl{max-height:170px;overflow:auto;margin:6px 0}.tbsr{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:calc(12px*var(--ts,1))}.tbsr i{width:12px;height:12px;border-radius:3px;flex:none}.tbsr span{flex:1;min-width:0}
#tbtoast{position:absolute;left:12px;bottom:26px;z-index:7;background:#0b1018;border:1px solid var(--cy);padding:5px 10px;font-size:calc(13px*var(--ts,1));opacity:0;transition:opacity .25s;pointer-events:none;max-width:70%}#tbtoast.on{opacity:1}
.tbshs{border:1px solid #2c3f55;background:#0a1018;padding:8px;margin:8px 0}.tbck{display:inline-flex;gap:6px;align-items:center;font-size:calc(13px*var(--ts,1));cursor:pointer;white-space:nowrap;margin:0}.tbck input{width:auto!important;margin:0;display:inline-block}.tbsr.sel{background:rgba(0,240,208,.12);outline:1px solid var(--cy)}.tbsr{cursor:pointer}.tbkeys{margin-top:8px}.tbkeys summary{cursor:pointer;color:var(--cy);font-size:calc(12px*var(--ts,1))}
@media(max-width:900px){#tbstage{flex-wrap:wrap}#tbdiv{display:none}#tbpanel{width:100%;max-height:none;flex:1 1 100%;order:3}}
@media (prefers-reduced-motion:reduce){.tbt,.tbpg i,.tbt.turn .tbi{animation:none;transition:none}}
`;document.head.appendChild(st)}
// ---- Tabletop: the "add to the map" picker, token editor and map settings
const TB_PROPS=[['📦','Crate','prop'],['🚪','Door','prop'],['🔒','Locked door','prop'],['💻','Terminal','prop'],['📷','Camera','prop'],['🚨','Alarm','prop'],['⚠️','Trap','prop'],['🚗','Car','prop'],['🏍️','Bike','prop'],['🛸','Drone','prop'],['🪑','Cover','prop'],['🧱','Wall','prop'],['🔥','Fire','prop'],['💧','Water','prop'],['🩸','Blood','prop'],['❓','Marker','prop'],
 ['💰','Loot','item'],['🔫','Weapon','item'],['🗝️','Key','item'],['📄','Document','item'],['💊','Medkit','item'],['🧪','Chemicals','item'],['💣','Explosive','item'],['🗃️','Stash','item'],['💾','Datachip','item'],['👜','Bag','item']];
const TB_SZ=[[.5,'Tiny'],[1,'Normal (1 square)'],[2,'Large (2×2)'],[3,'Huge (3×3)'],[4,'Giant (4×4)']];
let tbPT='party',tbPQ='',tbPimg='',tbPcol='',tbPmsg='';
const tbSwatch=cur=>`<span class="tbsw" id="tbsw">${TB_COLS.map(c=>`<i data-tbc="${c}" class="${c===cur?'on':''}" style="background:${c}"></i>`).join('')}</span>`;
function tbBindSw(onset){document.querySelectorAll('#tbsw [data-tbc]').forEach(i=>i.onclick=()=>{const was=i.classList.contains('on');document.querySelectorAll('#tbsw [data-tbc]').forEach(x=>x.classList.remove('on'));if(!was)i.classList.add('on');onset(was?'':i.dataset.tbc)})}
// uploads a small picture for a token
function tbBindImg(onid){const b=$('#tbimgb'),f=$('#tbimgf'),t=$('#tbimgt');if(!b||!f)return;b.onclick=()=>f.click();
 f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;if(!assets)return alert('Uploading is not available right now.');b.disabled=true;
  try{const s=await tbShrink(file,320,.85),up=await assets.upload(s.blob);onid(up.id);if(t)t.innerHTML=`<img src="/_blob/${esc(up.id)}" style="height:40px;vertical-align:middle;border:1px solid var(--line)"> <a id="tbimgx" style="cursor:pointer;color:var(--mg)">✕</a>`;const x=$('#tbimgx');if(x)x.onclick=()=>{onid('');t.innerHTML=''}}
  catch(e){alert('Upload failed: '+(e.message||e.code))}b.disabled=false}}
function tbPicker(tab){const m=tbCur();if(!m)return;if(tab&&tab!==tbPT){tbPT=tab;tbPQ='';tbPimg='';tbPcol='';tbPmsg=''}
 const tabs=[['party','🧑 Characters'],['people','🎭 NPCs &amp; contacts'],['enc','⚔ Encounter'],['arch','🦹 Archetypes'],['props','📦 Props &amp; items'],['lib','📚 Library']].filter(t=>isOwner||t[0]==='party');
 if(!tabs.some(t=>t[0]===tbPT))tbPT='party';
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:680px"><h2>＋ ADD TO THE MAP</h2><div class="tbtabs">${tabs.map(t=>`<button class="btn sm ${t[0]===tbPT?'on':''}" data-tbpt="${t[0]}">${t[1]}</button>`).join('')}</div><div id="tbpb"></div><div style="margin-top:12px"><button class="btn" id="tbpx">Done</button> <span class="meta" id="tbpm">${esc(tbPmsg)}</span></div></div></div>`;
 $('#tbpx').onclick=closeM;document.querySelectorAll('[data-tbpt]').forEach(b=>b.onclick=()=>tbPicker(b.dataset.tbpt));tbPBody()}
function tbPOk(msg){tbPmsg=msg;const e=$('#tbpm');if(e)e.textContent=msg;tbDraw()}
function tbPBody(){const m=tbCur(),el=$('#tbpb');if(!m||!el)return;const q=tbPQ.trim().toLowerCase();
 const srch=ph=>`<input id="tbpq" placeholder="${ph}" value="${esc(tbPQ)}" style="margin-bottom:8px">`,bq=()=>{const i=$('#tbpq');if(i){i.oninput=()=>{tbPQ=i.value;const p=i.selectionStart;tbPBody();const j=$('#tbpq');if(j){j.focus();try{j.setSelectionRange(p,p)}catch(e){}}}}};
 if(tbPT==='party'){const L=(pm.sheets||[]).filter(s=>sxVis(s)&&!s.drone&&(isOwner||s.uid===uid)&&(!q||(String(s.name||'')+' '+String(s.concept||'')).toLowerCase().includes(q))).sort((a,b)=>(b.uid===uid)-(a.uid===uid)||String(a.name).localeCompare(String(b.name))),
   dr=(pm.sheets||[]).filter(s=>sxVis(s)&&s.drone&&(isOwner||(!!uid&&s.uid===uid))&&(!q||String(s.name||'').toLowerCase().includes(q)));
  const row=s=>{const on=tbToks(m).some(t=>t.sheet===s.id);return `<a class="row tbpr" data-tbps="${esc(s.id)}">${tbOk(s.img)?`<img src="/_blob/${esc(s.img)}" alt="">`:`<span class="tbpi">${s.drone?'🤖':'🧾'}</span>`}<div style="flex:1;min-width:0"><div class="t">${esc(s.name||'(unnamed)')} ${s.uid===uid?'<span class="tag">yours</span>':''}</div><div class="meta">${esc([s.concept,s.player&&'Player: '+s.player].filter(Boolean).join(' · '))}</div></div>${on?'<span class="meta">on the map · select</span>':'<span class="btn sm">Add</span>'}</a>`};
  el.innerHTML=(isOwner?srch('Search characters…'):'')+(L.length||dr.length?L.map(row).join('')+(dr.length?`<div class="meta" style="margin:8px 0 2px">DRONES AND VEHICLES</div>`+dr.map(row).join(''):''):`<div class="empty">// ${isOwner?'NO CHARACTER SHEETS YET.':'YOU HAVE NO CHARACTER SHEET YET. MAKE ONE UNDER CHARACTER SHEETS FIRST.'}</div>`)+(typeof tbRigPick==='function'?tbRigPick(m,q):'');bq();if(typeof tbRigPickBind==='function')tbRigPickBind(el,m);
  el.querySelectorAll('[data-tbps]').forEach(a=>a.onclick=async()=>{const s=(pm.sheets||[]).find(x=>x.id===a.dataset.tbps);if(!s)return;const ex=tbToks(m).find(t=>t.sheet===s.id);
   if(ex){tbSel=ex.id;closeM();return}
   try{const id=await tbAddTok(m,{kind:'pc',sheet:s.id,name:s.name,img:s.img,sz:1});tbSel=id;tbPOk('Added '+s.name+'.');tbPBody()}catch(e){alert('Could not add: '+(e.message||e.code))}})}
 else if(tbPT==='people'&&isOwner){const seen=new Set(),L=[];
  (pm.contacts||[]).filter(c=>c&&!c.deleted&&c.name).forEach(c=>{const k=lc(c.name);if(seen.has(k))return;seen.add(k);L.push({name:c.name,img:tbOk((c.imgs||[])[0])||tbOk(portraitOf(c.name)),sub:[c.role,c.aff].filter(Boolean).join(' · '),col:'',src:'Contact'})});
  (npcs||[]).filter(n=>n&&n.name).forEach(n=>{const k=lc(n.name);if(seen.has(k))return;seen.add(k);L.push({name:n.name,img:tbOk(portraitOf(n.name)),sub:[n.aff,n.desc].filter(Boolean).join(' · ').slice(0,80),col:tbColOk(n.col),src:'NPC'})});
  const F=L.filter(x=>!q||(x.name+' '+x.sub).toLowerCase().includes(q)).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  el.innerHTML=srch('Search NPCs and contacts…')+`<div class="hint" style="margin:0 0 8px">Pulled from your NPC Handles and contact cards, with their pictures where they have one.</div><div style="max-height:46vh;overflow:auto">`+(F.length?F.slice(0,80).map((x,i)=>`<a class="row tbpr" data-tbpp="${i}">${x.img?`<img src="/_blob/${esc(x.img)}" alt="">`:`<span class="tbpi" style="color:${x.col||'var(--am)'}">${esc(tbInit(x.name))}</span>`}<div style="flex:1;min-width:0"><div class="t">${esc(x.name)} <span class="tag">${x.src}</span></div><div class="meta">${esc(x.sub)}</div></div><span class="btn sm">Add</span></a>`).join(''):'<div class="empty">// NOBODY MATCHES.</div>')+`</div>`;bq();
  el.querySelectorAll('[data-tbpp]').forEach(a=>a.onclick=async()=>{const x=F[+a.dataset.tbpp];if(!x)return;try{const id=await tbAddTok(m,{kind:'npc',name:x.name,img:x.img,col:x.col,sz:1});tbSel=id;tbPOk('Added '+x.name+'.')}catch(e){alert('Could not add: '+(e.message||e.code))}})}
 else if(tbPT==='enc'&&isOwner){
  el.innerHTML=`<div class="hint" style="margin:0 0 8px">Quick enemies for tonight's fight. Add a group at once ("Ganger" ×4 gives Ganger 1 to 4). They are marked as temporary, so <b>Clear encounter</b> removes them all when the fight is over.</div>
  <form id="tbenc"><div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:2;min-width:160px"><label>NAME</label><input name="n" maxlength="50" required placeholder="e.g. Halloweener"></div><div style="width:80px"><label>HOW MANY</label><input name="c" type="number" min="1" max="20" value="1"></div></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:150px"><label>TYPE</label><select name="k"><option value="enemy">Enemy</option><option value="npc">NPC or ally</option><option value="item">Item</option><option value="prop">Prop</option></select></div><div style="flex:1;min-width:150px"><label>SIZE</label><select name="s">${TB_SZ.map(s=>`<option value="${s[0]}" ${s[0]===1?'selected':''}>${s[1]}</option>`).join('')}</select></div></div>
  <label>COLOR <span class="meta">(optional)</span></label>${tbSwatch(tbPcol)}<label>PICTURE <span class="meta">(optional)</span></label><button type="button" class="btn sm" id="tbimgb">📎 Choose a picture</button><input type="file" id="tbimgf" accept="image/*" hidden> <span id="tbimgt"></span>
  <label style="display:block;margin-top:8px"><input type="checkbox" name="t" checked style="width:auto"> Temporary (removed by Clear encounter)</label><label style="display:block"><input type="checkbox" name="l" style="width:auto"> Also save to my library</label>
  <div style="margin-top:10px"><button class="btn grn" type="submit">Add to the map</button></div></form>`;
  tbBindSw(c=>{tbPcol=c});tbBindImg(id=>{tbPimg=id});
  $('#tbenc').onsubmit=async ev=>{ev.preventDefault();if(ev.target.dataset.busy)return;const f=new FormData(ev.target),base=String(f.get('n')||'').trim();if(!base)return;const n=Math.max(1,Math.min(20,parseInt(f.get('c'))||1)),temp=!!f.get('t'),exists=tbToks(m).some(t=>t.name===base||new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\d+$','i').test(t.name||''));
   ev.target.dataset.busy=1;let k=n>1||exists?tbNextNum(m,base):0,last='';
   try{for(let i=0;i<n;i++){last=await tbAddTok(m,{kind:String(f.get('k')),name:k?base+' '+(k+i):base,img:tbPimg,col:tbPcol,sz:+f.get('s')||1,temp});}
    if(f.get('l'))await db.collection('tblib').add({name:base,kind:String(f.get('k')),img:tbPimg,emoji:'',col:tbPcol,sz:+f.get('s')||1,ts:Date.now()});
    tbSel=last;ev.target.dataset.busy='';ev.target.querySelector('[name=n]').value='';tbPOk('Added '+(n>1?n+' × ':'')+base+'.')}catch(e){ev.target.dataset.busy='';alert('Could not add: '+(e.message||e.code))}}}
 else if(tbPT==='arch'&&isOwner){tbArchBody(el,m)}
 else if(tbPT==='props'&&isOwner){
  el.innerHTML=`<div class="hint" style="margin:0 0 8px">Click one to drop it on the map. You can rename it, resize it or hide it from the players afterwards.</div><label style="display:block;margin-bottom:6px"><input type="checkbox" id="tbptmp" style="width:auto"> Mark as temporary (removed by Clear encounter)</label>
  <div class="tbpg2">${TB_PROPS.map((p,i)=>`<a data-tbpr="${i}"><span>${p[0]}</span>${esc(p[1])}</a>`).join('')}</div>
  <h3 style="margin:14px 0 4px;font-size:calc(14px*var(--ts,1))">Something else</h3><form id="tbcus"><div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:2;min-width:140px"><label>NAME</label><input name="n" maxlength="50" required placeholder="e.g. Fixer's briefcase"></div><div style="width:90px"><label>EMOJI</label><input name="e" maxlength="4" value="📦"></div></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:140px"><label>TYPE</label><select name="k"><option value="item">Item</option><option value="prop">Prop</option></select></div><div style="flex:1;min-width:140px"><label>SIZE</label><select name="s">${TB_SZ.map(s=>`<option value="${s[0]}" ${s[0]===1?'selected':''}>${s[1]}</option>`).join('')}</select></div></div>
  <label>OR USE A PICTURE</label><button type="button" class="btn sm" id="tbimgb">📎 Choose a picture</button><input type="file" id="tbimgf" accept="image/*" hidden> <span id="tbimgt"></span><div style="margin-top:10px"><button class="btn grn" type="submit">Add to the map</button></div></form>`;
  tbBindImg(id=>{tbPimg=id});
  el.querySelectorAll('[data-tbpr]').forEach(a=>a.onclick=async()=>{const p=TB_PROPS[+a.dataset.tbpr];try{const id=await tbAddTok(m,{kind:p[2],name:p[1],emoji:p[0],sz:1,temp:!!$('#tbptmp').checked});tbSel=id;tbPOk('Added '+p[1]+'.')}catch(e){alert('Could not add: '+(e.message||e.code))}});
  $('#tbcus').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),nm=String(f.get('n')||'').trim();if(!nm)return;try{const id=await tbAddTok(m,{kind:String(f.get('k')),name:nm,emoji:tbPimg?'':String(f.get('e')||'').trim(),img:tbPimg,sz:+f.get('s')||1,temp:!!$('#tbptmp').checked});tbSel=id;tbPimg='';tbPOk('Added '+nm+'.');ev.target.querySelector('[name=n]').value='';const t=$('#tbimgt');if(t)t.innerHTML=''}catch(e){alert('Could not add: '+(e.message||e.code))}}}
 else if(tbPT==='lib'&&isOwner){const L=(pm.tblib||[]).filter(x=>x&&!x.deleted).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  el.innerHTML=`<div class="hint" style="margin:0 0 8px">Tokens you saved for reuse. Select a token on the map and press <b>📚 Save</b> to put it here.</div>`+(L.length?L.map(x=>`<a class="row tbpr" data-tbl="${esc(x.id)}">${tbOk(x.img)?`<img src="/_blob/${esc(x.img)}" alt="">`:`<span class="tbpi" style="color:${tbColOk(x.col)||(TB_K[x.kind]||TB_K.prop)[1]}">${x.emoji?esc(x.emoji):esc(tbInit(x.name))}</span>`}<div style="flex:1;min-width:0"><div class="t">${esc(x.name)}</div><div class="meta">${(TB_K[x.kind]||TB_K.prop)[0]} · size ${tbFmt(+x.sz||1)}</div></div><span class="btn sm">Add</span> <button class="btn sm mg del" data-tbld="${esc(x.id)}" title="Delete from the library">✕</button></a>`).join(''):'<div class="empty">// THE LIBRARY IS EMPTY.</div>');
  el.querySelectorAll('[data-tbld]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();const id=b.dataset.tbld;try{await db.doc('tblib/'+id).update({deleted:true});const o=(pm.tblib||[]).find(x=>x.id===id);if(o)o.deleted=true;tbPBody()}catch(e){alert('Could not delete: '+(e.message||e.code))}});
  el.querySelectorAll('[data-tbl]').forEach(a=>a.onclick=async()=>{const x=(pm.tblib||[]).find(z=>z.id===a.dataset.tbl);if(!x)return;try{const base=x.name,exists=tbToks(m).some(t=>t.name===base||new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\d+$','i').test(t.name||''));const id=await tbAddTok(m,{kind:x.kind,name:exists?base+' '+tbNextNum(m,base):base,img:x.img,emoji:x.emoji,col:x.col,sz:x.sz,temp:false,cs:x.cs,mhp:x.mhp});tbSel=id;tbPOk('Added '+base+'.')}catch(e){alert('Could not add: '+(e.message||e.code))}})}}
// ---- edit a token (GM)
function tbEdit(t){if(!isOwner||!t)return;const sh=t.sheet?(pm.sheets||[]).find(s=>s.id===t.sheet):null;tbPimg=tbOk(t.img);tbPcol=tbColOk(t.col);
 $('#modal').innerHTML=`<div class="modal"><form id="tbef"><h2>EDIT TOKEN</h2>${sh?`<div class="hint">This token follows the character sheet "${esc(sh.name)}": its name and picture come from the sheet.</div>`:''}
 ${sh?'':`<label>NAME</label><input name="n" maxlength="60" required value="${esc(t.name||'')}">`}
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:150px"><label>TYPE</label><select name="k">${Object.keys(TB_K).map(k=>`<option value="${k}" ${t.kind===k?'selected':''}>${TB_K[k][0]}</option>`).join('')}</select></div><div style="flex:1;min-width:150px"><label>SIZE</label><select name="s">${TB_SZ.map(s=>`<option value="${s[0]}" ${(+t.sz||1)===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></div></div>
 <label>RING COLOR <span class="meta">(tap again to go back to the type color)</span></label>${tbSwatch(tbPcol)}
 ${sh?'':`<label>EMOJI <span class="meta">(shown when there is no picture)</span></label><input name="e" maxlength="4" value="${esc(t.emoji||'')}"><label>PICTURE</label><button type="button" class="btn sm" id="tbimgb">📎 Choose a picture</button><input type="file" id="tbimgf" accept="image/*" hidden> <span id="tbimgt">${tbPimg?`<img src="/_blob/${esc(tbPimg)}" style="height:40px;vertical-align:middle;border:1px solid var(--line)"> <a id="tbimgx" style="cursor:pointer;color:var(--mg)">✕</a>`:''}</span>`}
 <label>NOTE <span class="meta">(shown when you point at the token)</span></label><input name="o" maxlength="200" value="${esc(t.note||'')}" placeholder="e.g. Carries the keycard">
 ${!sh&&isOwner&&t.cs&&t.cs.ak&&TB_ARCH.some(a=>a.k===t.cs.ak)?`<label class="tbck" style="margin-top:6px"><input type="checkbox" name="ra" style="width:auto"> Remember this picture for new ${esc(TB_ARCH.find(a=>a.k===t.cs.ak).n)} tokens</label>`:''}
 <label style="display:block;margin-top:8px"><input type="checkbox" name="h" ${t.hid?'checked':''} style="width:auto"> Hidden from players</label><label style="display:block"><input type="checkbox" name="l" ${t.lock?'checked':''} style="width:auto"> Locked (players cannot move it)</label><label style="display:block"><input type="checkbox" name="t" ${t.temp?'checked':''} style="width:auto"> Temporary (removed by Clear encounter)</label><label style="display:block"><input type="checkbox" name="d" ${t.mark==='down'?'checked':''} style="width:auto"> Down</label>
 <div style="margin-top:12px"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;tbBindSw(c=>{tbPcol=c});if(!sh){tbBindImg(id=>{tbPimg=id});const x=$('#tbimgx');if(x)x.onclick=()=>{tbPimg='';$('#tbimgt').innerHTML=''}}
 $('#tbef').onsubmit=async ev=>{ev.preventDefault();if(ev.target.dataset.busy)return;const f=new FormData(ev.target);ev.target.dataset.busy=1;
  const u={kind:String(f.get('k')),sz:+f.get('s')||1,col:tbPcol||'',note:String(f.get('o')||'').trim(),hid:!!f.get('h'),lock:!!f.get('l'),temp:!!f.get('t'),mark:f.get('d')?'down':''};
  if(!sh){u.name=String(f.get('n')||'').trim()||t.name;u.emoji=String(f.get('e')||'').trim();u.img=tbPimg||''}
  try{await db.doc('tbtoks/'+t.id).update(u);Object.assign(t,u);if(f.get('ra')&&t.cs&&t.cs.ak)await tbArPicSet(t.cs.ak,u.img||'');closeM()}catch(er){ev.target.dataset.busy='';alert('Could not save: '+(er.message||er.code))}}}
// ---- map settings (GM)
function tbMapSet(){const m=tbCur();if(!m||!isOwner)return;
 $('#modal').innerHTML=`<div class="modal"><form id="tbmf"><h2>⚙ MAP SETTINGS</h2><label>NAME</label><input name="n" maxlength="60" required value="${esc(m.name||'')}">
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div style="width:120px"><label>1 SQUARE =</label><input name="su" type="number" step="any" min="0.01" value="${tbFmt(+m.su||1)}"></div><div style="width:120px"><label>UNIT</label><input name="un" maxlength="8" value="${esc(m.un||'m')}"></div></div>
 <div class="meta">The ruler uses this to turn squares into distance.</div>
 <label style="display:block;margin-top:8px"><input type="checkbox" name="g" ${m.grid!==false?'checked':''} style="width:auto"> Show the grid</label><label>GRID COLOR</label><select name="gc">${Object.keys(TB_GC).map(k=>`<option value="${k}" ${(m.gc||'l')===k?'selected':''}>${TB_GC[k][0]}</option>`).join('')}</select>
 <label style="display:block;margin-top:8px"><input type="checkbox" name="f" ${m.fog?'checked':''} style="width:auto"> Fog of war (hide the map from players until you reveal it)</label>
 <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="tbmgrid">▦ Fit the grid</button> <button type="button" class="btn" id="cx">Cancel</button> <button type="button" class="btn mg del" id="tbmdel" style="margin-left:auto">Delete this map</button></div></form></div>`;
 $('#cx').onclick=closeM;$('#tbmgrid').onclick=()=>{closeM();setTimeout(tbGridEdit,50)};
 $('#tbmdel').onclick=async()=>{if(!await ask('Delete the map "'+(m.name||'Map')+'"? Its tokens go with it.','Delete map'))return;try{await db.doc('tbmaps/'+m.id).update({deleted:true});m.deleted=true;const a=tbActive();if(!a||a.id===m.id)await tbSetActive('');tbVid='';tbShown='';closeM()}catch(e){alert('Could not delete: '+(e.message||e.code))}};
 $('#tbmf').onsubmit=async ev=>{ev.preventDefault();if(ev.target.dataset.busy)return;ev.target.dataset.busy=1;const f=new FormData(ev.target),u={name:String(f.get('n')||'').trim()||m.name,su:Math.max(.01,parseFloat(f.get('su'))||1),un:String(f.get('un')||'m').trim().slice(0,8)||'m',grid:!!f.get('g'),gc:String(f.get('gc')||'l'),fog:!!f.get('f')};
  try{await db.doc('tbmaps/'+m.id).update(u);Object.assign(m,u);closeM()}catch(er){ev.target.dataset.busy='';alert('Could not save: '+(er.message||er.code))}}}
// ---- Tabletop extras: combat link, multi-select, status markers, auras, fog reveal + undo, look-here, GM notes, shared ruler.
// Loaded after p49_table.js. Functions only; nothing here runs at load except style + one timer.
const TB_CND=[['prone','🛌','Prone'],['stun','💫','Stunned'],['burn','🔥','Burning'],['bleed','🩸','Bleeding'],['pois','☠️','Poisoned'],['blind','🕶️','Blinded'],['slow','🐌','Slowed'],['fear','😱','Frightened'],['haste','⚡','Hasted'],['mark','🎯','Marked'],['inv','👻','Invisible'],['shield','🛡️','Shielded']];
const TB_AUR=[0,1,2,3,4,5,6,8,10,12];
let tbTurnSig=null,tbFollow=tbLS('sr_tbft','1')!=='0',tbRvN=tbNum(tbLS('sr_tbrv','4'),1,30,4),tbLookTs=0,tbLookMine=0,tbRulSent=0,tbFast=0,tbRemShown=false,tbIniSig='';
const tbCndOf=t=>Array.isArray(t.cnd)?t.cnd.filter(k=>TB_CND.some(c=>c[0]===k)):[];
const tbCndCan=t=>isOwner||!t.lock;
const tbIniOn=()=>{try{return !!iniM.active}catch(e){return false}};
// ---- which tokens are selected (tbSel is the main one; tbTS holds the whole group)
function tbSelNorm(){tbTS=tbTS.filter(id=>tbTok(id));if(!tbSel||!tbTok(tbSel)){tbTS=[]}else if(!tbTS.includes(tbSel))tbTS=[tbSel]}
const tbSelToks=()=>{tbSelNorm();return tbTS.map(tbTok).filter(Boolean)};
function tbSelPaint(){const tk=$('#tbtoks');if(tk)tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('sel',tbTS.includes(e.dataset.tbt)));tbBar();tbRulDraw();tbRangeDraw()}
function tbSelToggle(id){tbSelNorm();const i=tbTS.indexOf(id);if(i>=0){tbTS.splice(i,1);if(tbSel===id)tbSel=tbTS[tbTS.length-1]||null}else{tbTS.push(id);tbSel=id}tbShS=[];tbSelPaint()}
function tbSelAllToks(){const m=tbCur();if(!m)return;const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null,L=tbToks(m).filter(t=>tbSees(t,g,rows));if(!L.length)return tbNote('No tokens on this map.');
 tbTS=L.map(t=>t.id);tbSel=tbTS[0];tbShS=[];tbSelPaint();tbNote(L.length+' token'+(L.length===1?'':'s')+' selected.')}
// ---- marquee (drag a box to select tokens)
function tbMqStart(e,p){tbMq={pid:e.pointerId,x0:p.x,y0:p.y,x1:p.x,y1:p.y,add:!!(e.shiftKey||e.ctrlKey||e.metaKey),moved:false};tbRulDraw()}
function tbMqMove(p){const Q=tbMq;if(!Q)return;Q.x1=p.x;Q.y1=p.y;if(Math.hypot(Q.x1-Q.x0,Q.y1-Q.y0)*tbV.z>5)Q.moved=true;tbRulDraw()}
function tbMqEnd(){const Q=tbMq;tbMq=null;const m=tbCur();if(!Q||!m){tbRulDraw();return}
 if(!Q.moved){if(!Q.add){tbSel=null;tbTS=[];tbShS=[];tbDraw()}tbRulDraw();return}
 const g=tbGeoM(m),x0=Math.min(Q.x0,Q.x1),x1=Math.max(Q.x0,Q.x1),y0=Math.min(Q.y0,Q.y1),y1=Math.max(Q.y0,Q.y1),rows=tbFogOn(m)?tbFogRows(m,g):null;
 const hit=tbToks(m).filter(t=>{if(!tbSees(t,g,rows))return false;const sz=Math.max(.5,+t.sz||1),l=g.ox+(+t.c||0)*g.gs,tp=g.oy+(+t.r||0)*g.gs,w=sz*g.gs;return l<x1&&l+w>x0&&tp<y1&&tp+w>y0});
 if(hit.length){const set=Q.add?new Set(tbSelToks().map(t=>t.id)):new Set();hit.forEach(t=>set.add(t.id));tbTS=[...set];tbSel=hit[hit.length-1].id;tbShS=[];tbSelPaint();tbNote(tbTS.length+' token'+(tbTS.length===1?'':'s')+' selected.')}
 else{const sh=tbShpAll(m).filter(s=>{const a=tbShpAnchor(s),x=g.ox+a.x*g.gs,y=g.oy+a.y*g.gs;return x>=x0&&x<=x1&&y>=y0&&y<=y1}).map(s=>s.id);
  if(sh.length){tbSel=null;tbTS=[];tbShpSelect(sh,Q.add)}else{if(!Q.add){tbSel=null;tbTS=[];tbShS=[]}tbDraw()}}
 tbRulDraw()}
function tbMqSvg(k){const Q=tbMq;if(!Q||!Q.moved)return '';const x=Math.min(Q.x0,Q.x1),y=Math.min(Q.y0,Q.y1);return `<rect x="${x}" y="${y}" width="${Math.abs(Q.x1-Q.x0)}" height="${Math.abs(Q.y1-Q.y0)}" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="${1.5*k}" stroke-dasharray="${6*k} ${4*k}"/>`}
// ---- moving, copying and removing several tokens at once
const tbPosSet=L=>Promise.all(L.map(o=>tbSet('tbtoks',o.id,{c:o.c,r:o.r,mv:Date.now(),mvby:handle||'?'})));
function tbPosHist(before,after,label){const key=before.map(o=>o.id).join(','),last=tbHist[tbHist.length-1];
 if(last&&last.grp===key&&Date.now()-last.at<1200){last.at=Date.now();last.redo=()=>tbPosSet(after);tbRedo.length=0;return}
 const op=tbHPush(label,()=>tbPosSet(before),()=>tbPosSet(after));op.grp=key;op.at=Date.now()}
// move a group by whole squares; the whole group stops at the edge of the map together
function tbGroupShift(L,dc,dr){const m=tbCur();if(!m||!L.length)return false;const g=tbGeoM(m);let lo=-1e9,hi=1e9,loR=-1e9,hiR=1e9;
 L.forEach(t=>{const need=Math.max(1,Math.ceil(+t.sz||1));lo=Math.max(lo,-(+t.c||0));hi=Math.min(hi,g.cols-need-(+t.c||0));loR=Math.max(loR,-(+t.r||0));hiR=Math.min(hiR,g.rows-need-(+t.r||0))});
 if(lo>hi||loR>hiR)return false;dc=Math.max(lo,Math.min(hi,dc));dr=Math.max(loR,Math.min(hiR,dr));if(!dc&&!dr)return false;
 const before=L.map(t=>({id:t.id,c:+t.c||0,r:+t.r||0})),after=before.map(o=>({id:o.id,c:o.c+dc,r:o.r+dr}));
 tbPosSet(after).catch(()=>{});tbPosHist(before,after,'move '+(L.length===1?(L[0].name||'a token'):L.length+' tokens'));return true}
function tbGroupDrop(d,t,m){const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),need=Math.max(1,Math.ceil(sz)),c=Math.round((parseFloat(d.el.style.left)-g.ox)/g.gs),r=Math.round((parseFloat(d.el.style.top)-g.oy)/g.gs);
 const L=d.group.map(o=>tbTok(o.id)).filter(Boolean);tbGroupShift(L,c-(+t.c||0),r-(+t.r||0));const tk=$('#tbtoks');if(tk)tk._h='';tbAuraDrag(null)}
function tbAuraDrag(id,dx,dy){const sv=$('#tbaura');if(!sv)return;if(id===null){sv.querySelectorAll('[transform]').forEach(e=>e.removeAttribute('transform'));return}
 const e=sv.querySelector('[data-au="'+id+'"]');if(e)e.setAttribute('transform','translate('+dx+' '+dy+')')}
async function tbRemoveMany(L,noAsk){L=L.filter(tbCanRm);if(!L.length)return tbNote('You can remove only your own character token.');if(L.length===1)return tbRemove(L[0],noAsk);
 if(!noAsk&&!await ask('Take '+L.length+' tokens off the map?','Remove'))return;
 const ids=L.map(t=>t.id),set=v=>Promise.all(ids.map(id=>tbSet('tbtoks',id,v?{deleted:true,delAt:Date.now()}:{deleted:false})));
 try{await set(true);tbSel=null;tbTS=[];const op=tbHPush('remove '+ids.length+' tokens',async()=>{await set(false);tbSel=ids[0];tbTS=ids.slice();tbShS=[]},()=>set(true));tbAfter();
  undoBar(ids.length+' tokens removed from the map.',async()=>{tbHDrop(op);await set(false);tbSel=ids[0];tbTS=ids.slice();tbShS=[];tbRedo.push(op);tbAfter()})}catch(e){alert('Could not remove: '+(e.message||e.code))}}
// a batch of field changes on tokens, with undo/redo. fnA(t) returns the fields to set.
async function tbTokEdit(L,fnA,label){const dflt=k=>k==='cnd'?[]:k==='mark'||k==='ac'?'':k==='ar'?0:false;
 const items=L.map(t=>{const a=fnA(t),b={};Object.keys(a).forEach(k=>{const v=t[k]===undefined?dflt(k):t[k];b[k]=Array.isArray(v)?v.slice():v});return {id:t.id,a,b}}).filter(it=>Object.keys(it.a).some(k=>JSON.stringify(it.a[k])!==JSON.stringify(it.b[k])));
 if(!items.length)return;const run=k=>Promise.all(items.map(it=>tbSet('tbtoks',it.id,it[k])));
 try{await run('a')}catch(e){alert('Could not save: '+(e.message||e.code));return}
 tbHPush(label,()=>run('b'),()=>run('a'));tbAfter()}
function tbGrpAct(a){const L=tbSelToks();if(!L.length)return;
 if(a==='copy')return tbTokCopy(false);if(a==='dup')return tbTokPaste(true);if(a==='rm')return tbRemoveMany(L);
 if(!isOwner)return;const n=L.length+' token'+(L.length===1?'':'s');
 if(a==='down'){const v=!L.every(t=>t.mark==='down');return tbTokEdit(L,t=>({mark:v?'down':''}),(v?'mark down ':'mark up ')+n)}
 if(a==='lock'){const v=!L.every(t=>t.lock);return tbTokEdit(L,t=>({lock:v}),(v?'lock ':'unlock ')+n)}
 if(a==='hide'){const v=!L.every(t=>t.hid);return tbTokEdit(L,t=>({hid:v}),(v?'hide ':'show ')+n)}}
// ---- status markers (conditions)
function tbCndToggle(key){const L=tbSelToks().filter(tbCndCan);if(!L.length)return tbNote('Select a token first.');const on=!L.every(t=>tbCndOf(t).includes(key)),nm=(TB_CND.find(c=>c[0]===key)||[0,0,key])[2].toLowerCase();
 tbTokEdit(L,t=>{const a=tbCndOf(t).filter(k=>k!==key);if(on)a.push(key);return {cnd:a}},(on?'add ':'remove ')+nm+(L.length>1?' on '+L.length+' tokens':''))}
function tbCndClear(){const L=tbSelToks().filter(tbCndCan);tbTokEdit(L,t=>({cnd:[]}),'clear markers')}
function tbCndHtml(t,px){const L=tbCndOf(t);if(!L.length)return '';const fs=Math.max(10,Math.round(px*.26)),show=L.slice(0,4),more=L.length-show.length;
 return `<span class="tbcn" style="font-size:${fs}px">${show.map(k=>`<i>${TB_CND.find(c=>c[0]===k)[1]}</i>`).join('')}${more>0?`<i class="tbcm">+${more}</i>`:''}</span>`}
function tbCndPanel(L){const ok=L.filter(tbCndCan);if(!ok.length)return '';const t0=ok[0],names=tbCndOf(t0).map(k=>TB_CND.find(c=>c[0]===k)[2]);
 return `<div class="tbcw"><div class="meta">Status markers (click to switch on or off):</div><div class="tbccs">${TB_CND.map(c=>{const n=ok.filter(t=>tbCndOf(t).includes(c[0])).length;return `<button class="tbcc${n===ok.length?' on':n?' part':''}" data-tbx="cnd:${c[0]}" title="${c[2]}${n&&n<ok.length?' (some of them)':''}">${c[1]}</button>`}).join('')}</div>${names.length&&ok.length===1?`<div class="meta">${esc(names.join(', '))}</div>`:''}${ok.some(t=>tbCndOf(t).length)?'<button class="btn sm" data-tbx="cndclr">Clear markers</button>':''}</div>`}
// ---- auras
function tbAuraPanel(L){const ok=L.filter(tbCndCan);if(!ok.length)return '';const m=tbCur(),su=+m.su||1,un=esc(m.un||'m'),t=ok[0],cur=+t.ar||0,col=tbColOk(t.ac)||'#00f0d0';
 return `<div class="tbcw"><div class="meta">Aura: a ring that follows the token</div><div class="tbvb"><select id="tbaur">${TB_AUR.map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n?n+' sq ('+tbFmt(n*su)+' '+un+')':'Off'}</option>`).join('')}</select><span class="tbsws">${TB_COLS.slice(0,8).map(c=>`<button class="tbswc ${cur&&col.toLowerCase()===c.toLowerCase()?'on':''}" style="background:${c}" data-tbx="aurc:${c.slice(1)}" title="Aura colour"></button>`).join('')}</span></div></div>`}
function tbAuraSet(n,col){const L=tbSelToks().filter(tbCndCan);if(!L.length)return;tbTokEdit(L,t=>{const o={};if(n!=null)o.ar=n;if(col)o.ac=col;if(col&&n==null&&!(+t.ar>0))o.ar=2;if(n&&!tbColOk(t.ac))o.ac='#00f0d0';return o},n===0?'switch off aura':'set aura')}
function tbAuraDraw(m,g,rows){const sv=$('#tbaura');if(!sv)return;sv.setAttribute('width',m.w);sv.setAttribute('height',m.h);
 const h=tbToks(m).filter(t=>(+t.ar||0)>0&&tbSees(t,g,rows)).map(t=>{const sz=Math.max(.5,+t.sz||1),R=(sz/2+Math.min(30,+t.ar))*g.gs,cx=g.ox+((+t.c||0)+sz/2)*g.gs,cy=g.oy+((+t.r||0)+sz/2)*g.gs,col=tbColOk(t.ac)||'#00f0d0',sw=Math.max(2,g.gs*.04);
  return `<circle data-au="${esc(t.id)}" cx="${cx}" cy="${cy}" r="${R}" fill="${col}" fill-opacity=".13" stroke="${col}" stroke-opacity=".9" stroke-width="${sw}" stroke-dasharray="${sw*3} ${sw*2}"/>`}).join('');
 if(sv._h!==h){sv._h=h;sv.innerHTML=h}}
// ---- fog: undo/redo and "reveal around a token"
function tbFogFromStr(s,g){const a=[];for(let r=0;r<g.rows;r++){const u=new Uint8Array(g.cols),str=String((s&&s[r])||'');for(let c=0;c<g.cols&&c<str.length;c++)u[c]=str.charCodeAt(c)===49?1:0;a.push(u)}return a}
async function tbFogCommit(m,before,a,label){const after=tbFogStr(a);await tbFogWrite(m,a);if(before.join('|')===after.join('|'))return;
 const put=s=>tbFogWrite(m,tbFogFromStr(s,tbGeoM(m)));tbHPush(label,()=>put(before),()=>put(after))}
async function tbRevealAround(L,n,val){const m=tbCur();if(!m||!isOwner||!L.length)return;
 if(!tbFogOn(m)){if(!await ask('Fog of war is off for this map. Turn it on first? The whole map starts hidden from the players, then this reveals the area around the token.','Turn on fog'))return;try{await db.doc('tbmaps/'+m.id).update({fog:true});m.fog=true}catch(e){return alert('Could not save: '+(e.message||e.code))}}
 const g=tbGeoM(m),a=tbFogRows(m,g).map(u=>u.slice()),before=tbFogStr(a);
 L.forEach(t=>{const sz=Math.max(.5,+t.sz||1),R=n+sz/2,cx=(+t.c||0)+sz/2,cy=(+t.r||0)+sz/2;
  for(let r=Math.max(0,Math.floor(cy-R-1));r<=Math.min(g.rows-1,Math.ceil(cy+R+1));r++)for(let c=Math.max(0,Math.floor(cx-R-1));c<=Math.min(g.cols-1,Math.ceil(cx+R+1));c++){if(Math.hypot(c+.5-cx,r+.5-cy)<=R+.001)a[r][c]=val?1:0}});
 await tbFogCommit(m,before,a,(val?'reveal ':'hide ')+n+' squares around '+(L.length===1?tbName(L[0]):L.length+' tokens'));tbDraw();tbNote((val?'Revealed ':'Hidden ')+n+' squares around '+(L.length===1?tbName(L[0]):L.length+' tokens')+'.')}
function tbRevealPanel(L){return `<div class="tbcw"><div class="meta">Fog around ${L.length>1?'these tokens':'this token'}:</div><div class="tbvb"><select id="tbrvn">${[1,2,3,4,5,6,8,10,12,15,20].map(n=>`<option value="${n}" ${tbRvN===n?'selected':''}>${n} sq</option>`).join('')}</select><button class="btn sm grn" data-tbx="rvl:1" title="Uncover the squares around the token (key R)">🌫 Reveal</button><button class="btn sm" data-tbx="rvl:0">Cover</button></div></div>`}
// ---- combat: the Initiative tracker on the table
const tbIniOf=t=>{try{return iniList().find(c=>!c.out&&((t.sheet&&c.sheet===t.sheet)||(!t.sheet&&!c.sheet&&String(c.name||'').toLowerCase()===String(t.name||'').toLowerCase())))||null}catch(e){return null}};
const tbTokForIni=(c,m)=>c&&m?tbToks(m).find(t=>(t.sheet&&c.sheet===t.sheet)||(!t.sheet&&!c.sheet&&String(c.name||'').toLowerCase()===String(t.name||'').toLowerCase()))||null:null;
function tbGoIni(id){document.body.classList.remove('menu');thread=null;board='__init';render();if(id){let n=0;const go=()=>{const el=document.querySelector('[data-ir="'+id+'"]');if(el){el.scrollIntoView({block:'center'});el.style.outline='2px solid var(--cy)';setTimeout(()=>{el.style.outline=''},2400)}else if(++n<6)setTimeout(go,150)};setTimeout(go,120)}}
function tbTurnFind(quiet){const m=tbCur(),c=tbIniCur();if(!m||!c)return false;const t=tbTokForIni(c,m);if(!t){if(!quiet)tbNote(c.name+" has no token on this map.");return false}
 const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null;if(!tbSees(t,g,rows))return false;tbCenter(t);return true}
function tbTurnChk(){let cur='';try{cur=iniM.active?iniM.cur+'|'+(iniM.round||1):''}catch(e){}
 if(tbTurnSig===null){tbTurnSig=cur;return}if(cur===tbTurnSig)return;tbTurnSig=cur;try{if(typeof tbShakeOffer==='function')tbShakeOffer(cur)}catch(e){}if(!cur||!tbFollow)return;const c=tbIniCur();if(c&&tbTurnFind(true))tbNote('⚔ '+c.name+"'s turn")}
function tbTurnHtml(){if(!tbIniOn())return '';const c=tbIniCur(),o=iniOrder(),i=o.findIndex(x=>x.id===iniM.cur),nx=i>=0?o[i+1]:null;
 return `<span>⚔ R${iniM.round||1} · <b>${esc(c?c.name:'?')}</b>${nx?` <span class="meta">→ ${esc(nx.name)}</span>`:''}</span><button class="btn sm" data-tbx="iniprev" title="Back one turn">◀</button><button class="btn sm grn" data-tbx="ininext" title="Next turn">Next ▶</button><button class="btn sm" data-tbx="turnfind" title="Move the view to whoever's turn it is">🎯</button>`}
function tbTurnDraw(){const el=$('#tbturn');if(!el)return;const h=tbTurnHtml();if(el._h!==h){el._h=h;el.innerHTML=h}el.classList.toggle('on',!!h)}
function tbCmbHtml(m){if(!tbIniOn())return `<div class="meta">No fight is running right now.</div><div class="tbvb"><button class="btn sm" data-tbx="iniopen">⚔ Open the Initiative tracker</button></div>`;
 const c=tbIniCur(),t=tbTokForIni(c,m),o=iniOrder(),i=o.findIndex(x=>x.id===iniM.cur);
 return `<div><b style="color:var(--am)">Round ${iniM.round||1}</b> · turn ${i>=0?i+1:'?'} of ${o.length}</div><div style="margin:3px 0"><b>${esc(c?c.name:'?')}</b> is up${c&&!t?' <span class="meta">(no token on this map)</span>':''}</div>
 <div class="tbvb"><button class="btn sm" data-tbx="iniprev">◀ Back</button><button class="btn sm grn" data-tbx="ininext">Next ▶</button><button class="btn sm" data-tbx="turnfind">🎯 Find</button><button class="btn sm" data-tbx="iniopen">Open tracker</button></div>
 <label class="tbck"><input type="checkbox" id="tbft" ${tbFollow?'checked':''}> Move my view to each new turn</label>`}
// ---- GM: look here, and notes pinned to the map
async function tbLookSend(x,y,z,mapId){const m=tbCur();if(!m||!isOwner)return;const ts=Date.now();tbLookMine=ts;tbLookTs=ts;tbPingFx({x,y,by:'Look here'});
 try{await db.doc('tbmeta/look').set({map:mapId||m.id,x:Math.round(x),y:Math.round(y),z:z||0,ts,by:handle||'GM'});tbNote("Sent: everyone's view moves to this spot.")}catch(e){alert('Could not send: '+(e.message||e.code))}}
function tbLookSendView(){const v=$('#tbview');if(!v)return;tbLookSend((v.clientWidth/2-tbV.x)/tbV.z,(v.clientHeight/2-tbV.y)/tbV.z,Math.round(tbV.z*1000)/1000)}
function tbLookChk(){const d=(pm.tbmeta||[]).find(x=>x&&x.id==='look');if(!d||!d.ts||d.ts===tbLookTs)return;if(d.ts===tbLookMine){tbLookTs=d.ts;return}
 const m=tbCur(),v=$('#tbview');if(Date.now()-d.ts>45000||isOwner){tbLookTs=d.ts;return}if(!m||!v||d.map!==m.id)return;tbLookTs=d.ts;
 if(+d.z>0)tbV.z=Math.max(.05,Math.min(5,+d.z));tbV.x=v.clientWidth/2-(+d.x||0)*tbV.z;tbV.y=v.clientHeight/2-(+d.y||0)*tbV.z;tbApply();tbPingFx({x:+d.x||0,y:+d.y||0,by:d.by||'GM'});tbNote('🔭 '+(d.by||'The GM')+': look here')}
const tbNotes=m=>m?(pm.tbmeta||[]).filter(x=>x&&x.kind==='note'&&!x.deleted&&x.map===m.id&&(isOwner||x.shown)).sort((a,b)=>(a.ts||0)-(b.ts||0)):[];
function tbNotesDraw(m){const el=$('#tbnotes');if(!el)return;const h=tbNotes(m).map(n=>`<div class="tbnp ${n.shown?'sh':'hd'}" data-tbn="${esc(n.id)}" style="left:${+n.x||0}px;top:${+n.y||0}px" title="${esc((n.title||'Note')+(n.shown?'':' (only you can see this)'))}">${n.shown?'📌':'🔒'}<span>${esc(n.title||'Note')}</span></div>`).join('');if(el._h!==h){el._h=h;el.innerHTML=h}}
async function tbNoteNew(x,y){const m=tbCur();if(!m||!isOwner)return;const doc={kind:'note',map:m.id,x:Math.round(x),y:Math.round(y),title:'',text:'',shown:false,by:handle||'GM',ts:Date.now()};
 try{const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);tbDraw();tbNoteOpen(r.id,true)}catch(e){alert('Could not add the note: '+(e.message||e.code))}}
function tbNoteOpen(id,isNew){const n=(pm.tbmeta||[]).find(x=>x&&x.id===id&&x.kind==='note'&&!x.deleted);if(!n)return;
 if(!isOwner){if(!n.shown)return;$('#modal').innerHTML=`<div class="modal"><h2>📌 ${esc(n.title||'Note')}</h2><div style="white-space:pre-wrap;margin:8px 0">${esc(n.text||'')}</div><div><button class="btn" id="cx">Close</button>${n.cb&&cbNodes().some(z=>z.id===n.cb)?' <button class="btn" id="tbnc">🕵 Open on the Clue Board</button>':''}</div></div>`;$('#cx').onclick=closeM;{const b=$('#tbnc');if(b)b.onclick=()=>{closeM();cbOpenNote(n.cb)}};return}
 $('#modal').innerHTML=`<div class="modal"><form id="tbnf"><h2>📌 MAP NOTE</h2><div class="hint">A note pinned to this spot on the map. Only you see it until you tick the box below.</div>
 <label>TITLE</label><input name="t" maxlength="60" value="${esc(n.title||'')}" placeholder="e.g. Hidden door, Guard patrol, Read aloud">
 <label>NOTE</label><textarea name="x" rows="5" maxlength="1500" placeholder="What is here? Traps, secrets, what to read to the players…">${esc(n.text||'')}</textarea>
 <label style="display:block;margin-top:8px"><input type="checkbox" name="s" ${n.shown?'checked':''} style="width:auto"> Show this note to the players</label>
 <label>CLUE BOARD NOTE (OPTIONAL)</label><select name="cb"><option value="">None</option>${cbNodes().map(z=>`<option value="${esc(z.id)}" ${n.cb===z.id?'selected':''}>${esc(z.title||'(untitled)')}</option>`).join('')}</select>
 <div style="margin-top:12px"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="cx">${isNew?'Discard':'Cancel'}</button> ${n.cb&&cbNodes().some(z=>z.id===n.cb)?'<button type="button" class="btn" id="tbnc">🕵 Open on the Clue Board</button> ':''}<button type="button" class="btn mg del" id="tbnd" style="float:right">Delete</button></div></form></div>`;
 $('#cx').onclick=()=>{if(isNew&&!n.title&&!n.text){tbSet('tbmeta',n.id,{deleted:true,delAt:Date.now()}).catch(()=>{})}closeM()};
 $('#tbnd').onclick=async()=>{if(!await ask('Delete this note?','Delete'))return;try{await tbSet('tbmeta',n.id,{deleted:true,delAt:Date.now()})}catch(e){alert('Could not delete: '+(e.message||e.code))}closeM()};
 $('#tbnf').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target);try{await tbSet('tbmeta',n.id,{title:String(f.get('t')||'').trim().slice(0,60),text:String(f.get('x')||'').trim().slice(0,1500),shown:!!f.get('s'),cb:String(f.get('cb')||'')})}catch(e){return alert('Could not save: '+(e.message||e.code))}closeM()};{const b=$('#tbnc');if(b)b.onclick=()=>{closeM();cbOpenNote(n.cb)}}}
function tbGmHtml(m){const N=tbNotes(m);
 return `<div class="tbvb"><button class="btn sm ${tbTool==='look'?'on':''}" data-tbx="ptool:${tbTool==='look'?'move':'look'}" title="Click a spot and every player's view moves there (key L)">🔭 Look here</button><button class="btn sm" data-tbx="looksend" title="Move every player's view and zoom to what you are looking at now">📡 Send my view</button><button class="btn sm ${tbTool==='note'?'on':''}" data-tbx="ptool:${tbTool==='note'?'move':'note'}" title="Click the map to pin a note (key N)">📌 Add note</button></div>
 ${tbWallPanel(m)}
 <div class="meta">${tbTool==='look'?'Click anywhere on the map to bring every player there.':tbTool==='note'?'Click the map where the note belongs.':'Notes you pin to the map stay hidden from players until you show them.'}</div>
 ${N.length?N.map(n=>`<div class="tbsr" data-tbnr="${esc(n.id)}"><span>${n.shown?'📌':'🔒'} ${esc(n.title||'Note')}</span><button class="btn sm" data-tbx="noterev:${esc(n.id)}" title="${n.shown?'Hide from players':'Show to players'}">${n.shown?'🙈':'👁'}</button><button class="btn sm" data-tbx="notectr:${esc(n.id)}" title="Move the view here">🎯</button><button class="btn sm" data-tbx="noteopen:${esc(n.id)}" title="Edit">✎</button></div>`).join(''):'<div class="meta">No notes on this map.</div>'}`}
// ---- shared ruler: others see your line while you drag it, and for a few seconds afterwards
function tbRulTx(fin){const R=tbRul,m=tbCur();if(!R||!m||(R.x0===R.x1&&R.y0===R.y1&&!(R.path||[]).length))return;const now=Date.now();if(!fin&&now-tbRulSent<600)return;tbRulSent=now;
 const id='r'+pid(uid||handle||'x'),d={map:m.id,x0:Math.round(R.x0),y0:Math.round(R.y0),x1:Math.round(R.x1),y1:Math.round(R.y1),by:handle||'?',ts:now,live:!fin,rt:tbRoute?1:0,pa:(R.path||[]).slice(0,10).flatMap(a=>[Math.round(a[0]),Math.round(a[1])])};
 try{db.doc('tbping/'+id).set(d).catch(()=>{})}catch(e){}}
function tbRemoteRulers(m,g,k){const me='r'+pid(uid||handle||'x'),now=Date.now();let h='';tbRemShown=false;
 (pm.tbping||[]).forEach(p=>{if(!p||!/^r/.test(String(p.id))||p.id===me||p.map!==m.id)return;const age=now-(+p.ts||0);if(p.live?age>7000:age>9000)return;
  tbRemShown=true;if(p.live&&age<5000)tbFast=now+8000;
  const pa=Array.isArray(p.pa)?p.pa:[],path=[];for(let i=0;i+1<pa.length&&path.length<10;i+=2)path.push([+pa[i]||0,+pa[i+1]||0]);
  const op=p.live?1:Math.max(.25,1-(age/9000)*.75);
  h+=`<g opacity="${op}">`+tbRulSvg({x0:+p.x0,y0:+p.y0,x1:+p.x1,y1:+p.y1,path,rt:!!p.rt},m,g,k,'#00f0d0',esc(p.by||'')+': ')+'</g>'});
 return h}
// ---- timers: turn follow, expiring rulers, quick polling while someone is measuring
setInterval(()=>{try{tbVisChk()}catch(e){}if(!$('#tbroot'))return;const before=tbTurnSig;tbTurnChk();let s='';try{s=iniM.active?iniM.cur+'|'+(iniM.round||1):''}catch(e){}if(tbTurnSig!==before||s!==tbIniSig){tbIniSig=s;tbDraw()}tbTurnDraw();if(tbRemShown&&!tbRul)tbRulDraw();
 if(Date.now()<tbFast&&!document.hidden&&typeof window.__poll==='function')window.__poll()},900);
// ---- looks
{const st=document.createElement('style');st.textContent=`
#tbaura{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.tbcn{position:absolute;left:-12%;right:-12%;top:-14%;display:flex;justify-content:center;pointer-events:none;z-index:3;line-height:1;white-space:nowrap}.tbcn i{font-style:normal;margin:0 -.03em;text-shadow:0 1px 2px #000,0 0 3px #000}.tbcn .tbcm{font-size:.7em;background:#000b;color:#fff;border-radius:3px;padding:0 .25em;align-self:center;margin-left:.15em}
.tbcw{border-top:1px solid var(--line);margin-top:8px;padding-top:6px}
#tbturn{position:absolute;left:8px;top:8px;z-index:8;display:none;gap:6px;align-items:center;background:rgba(5,8,12,.86);border:1px solid #ffd60a;padding:3px 8px;font-size:calc(13px*var(--ts,1));max-width:calc(100% - 150px);flex-wrap:wrap}#tbturn.on{display:flex}#tbturn .btn{margin:0}
#tbnotes{position:absolute;left:0;top:0}.tbnp{position:absolute;pointer-events:auto;cursor:pointer;transform:translate(-8px,-100%) scale(var(--iz,1));transform-origin:8px 100%;font-size:calc(24px*var(--ts,1));line-height:1;white-space:nowrap;z-index:5;filter:drop-shadow(0 1px 2px #000)}.tbnp span{font-size:calc(12px*var(--ts,1));background:#0b1018;color:#fff;border:1px solid #ffd60a;padding:0 5px;margin-left:2px;vertical-align:middle}.tbnp.hd{opacity:.8}.tbnp.hd span{border-style:dashed;border-color:#9aa}
#tbview.tool-select,#tbview.tool-look,#tbview.tool-note{cursor:crosshair}
`;document.head.appendChild(st)}
// ---- the "selected token(s)" panel
function tbSelHtml(m){const L=tbSelToks();
 if(!L.length)return `<div class="meta">Click a token on the map or in the list above to see what you can do with it. To pick several: hold Shift and click them, or drag a box (hold Shift and drag, or use the ⬚ tool).</div>`;
 const B=(a,tx,c,tt)=>`<button class="btn sm ${c||''}" data-tbx="${a}"${tt?` title="${esc(tt)}"`:''}>${tx}</button>`;let head,btns;
 if(L.length===1){const t=L[0],k=TB_K[t.kind]||TB_K.prop,sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null,ci=tbIniOf(t);
  head=`<div><span class="tbk2" style="--k:${tbColOk(t.col)||k[1]}">${k[0]}</span> <b>${esc(tbName(t))}</b>${t.mark==='down'?' <span class="tag" style="color:var(--red);border-color:var(--red)">DOWN</span>':''}${t.lock?' <span class="tag">🔒 locked</span>':''}${t.hid?' <span class="tag" style="color:var(--am);border-color:var(--am)">hidden from players</span>':''}${t.temp?' <span class="meta">(encounter)</span>':''}${t.note?`<div class="meta" style="margin-top:3px">${esc(t.note)}</div>`:''}</div>`;
  btns=(sh&&sxVis(sh)?B('sheet','🧾 Open sheet'):'')+(isOwner||tbCanRm(t)?B('roll','🎲 Roll','','Roll dice for this token'):'')+B('cbpin','🕵 Clue note','','Pin this token to the Clue Board, or open its note')+(ci?B('ini','⚔ In tracker','','Jump to this character in the Initiative tracker')+(isOwner&&tbIniOn()&&iniM.cur!==ci.id?B('turn','▶ Their turn','','Make it this character\'s turn now'):''):'')+
   (isOwner?B('edit','Edit')+B('dup','Copy')+B('down',t.mark==='down'?'Revive':'💀 Down')+B('lock',t.lock?'Unlock':'🔒 Lock')+B('hide',t.hid?'Show':'🙈 Hide')+B('lib','📚 Save')+B('rm','Remove','mg del'):(tbCanRm(t)?B('rm','Remove','mg del'):''))}
 else{head=`<div><b>${L.length} tokens selected</b><div class="meta">${L.slice(0,4).map(t=>esc(tbName(t))).join(', ')}${L.length>4?' and '+(L.length-4)+' more':''}</div></div>`;
  btns=isOwner?B('grp:copy','Copy')+B('grp:dup','Duplicate')+B('grp:down','💀 Down or revive')+B('grp:lock','🔒 Lock or unlock')+B('grp:hide','🙈 Hide or show')+B('grp:rm','Remove','mg del'):(L.some(tbCanRm)?B('grp:rm','Remove mine','mg del'):'')}
 return `<div class="tbtb">${head}<div class="tbac">${btns}</div></div>`+(typeof tbFightPanel==='function'?tbFightPanel(L):'')+(typeof tbStatPanel==='function'?tbStatPanel(L):'')+tbCndPanel(L)+tbHpPanel(L)+tbAuraPanel(L)+tbMovePanel(L)+(typeof tbRngPanel==='function'?tbRngPanel(L):'')+(typeof tbAtkPanel==='function'?tbAtkPanel(L):'')+(typeof tbRigPanel==='function'?tbRigPanel(L):'')+(isOwner?tbVisPanel(L)+tbRevealPanel(L):'')+(L.length>1?`<div class="meta" style="margin-top:6px">Drag any of them to move the whole group. Arrow keys nudge the group.${isOwner?' Ctrl+C and Ctrl+V copy and paste it.':''}</div>`:'')}
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
// ---- Tabletop extras, part two: health bars, saved views, image layers, fading markers, dice on the table, map export and import.
// Loaded after p53_tbmap.js. GM-only data (views, layers) lives in tbmeta; markers and dice results are short-lived tbping documents.
const TB_MIC=['🎯','🔍','👀','⚠️','❓','✅','🚪','⚔️'];
let tbLyEdit=null,tbLyD=null,tbMicon=tbLS('sr_tbmi','🎯'),tbMlab=tbLS('sr_tbml','');
const tbMetaOf=kind=>(pm.tbmeta||[]).filter(x=>x&&x.kind===kind&&!x.deleted);
// ---- health bars
const tbHpVis=t=>+t.mhp>0&&(isOwner||t.kind==='pc'||!!t.hpv);
const tbHpCan=t=>isOwner||(t.kind==='pc'&&tbCanRm(t));
function tbHpBar(t){if(!tbHpVis(t))return '';const mhp=+t.mhp,hp=Math.max(0,Math.min(mhp,+t.hp||0)),pc=hp/mhp,col=pc>.5?'#39ff14':pc>.25?'#ffb000':'#ff3b3b';
 return `<span class="tbhp" title="Health ${hp} / ${mhp}"><i style="width:${Math.round(pc*100)}%;background:${col}"></i></span><span class="tbhn">${hp}/${mhp}</span>`}
function tbHpPanel(L){const ok=L.filter(tbHpCan);if(!ok.length)return '';const t=ok[0],multi=ok.length>1;
 return `<div class="tbcw"><div class="meta">Health${multi?' (applies to each token)':''}${+t.mhp>0?'':': set a maximum to show a bar'}</div>
 <div class="tbvb">${multi?'':`<input type="number" id="tbhpc" min="0" value="${Math.max(0,+t.hp||0)}" style="width:62px" title="Current health"> <span class="meta">of</span> `}<input type="number" id="tbhpm" min="0" max="999" value="${+t.mhp||0}" style="width:62px" title="Maximum health"> <span class="meta">max</span></div>
 <div class="tbvb">${[-5,-1,1,5].map(n=>`<button class="btn sm" data-tbx="hp:${n}">${n>0?'+'+n:n}</button>`).join('')}<button class="btn sm" data-tbx="hp:full">Full</button></div>
 ${isOwner?`<label class="tbck"><input type="checkbox" id="tbhpv" ${t.hpv?'checked':''}> Show the bar to players</label>`:''}</div>`}
function tbHpAdd(n){const L=tbSelToks().filter(tbHpCan);if(!L.length)return;if(!L.some(t=>+t.mhp>0))return tbNote('Set a maximum health first.');
 const nm=L.length===1?tbName(L[0]):L.length+' tokens';
 tbTokEdit(L.filter(t=>+t.mhp>0),t=>({hp:n==='full'?+t.mhp:Math.max(0,Math.min(+t.mhp,(+t.hp||0)+n))}),n==='full'?'restore '+nm:n<0?'damage '+nm:'heal '+nm);
 if(n!=='full'){const t=L[0];if(L.length===1)tbNote(tbName(t)+': '+Math.max(0,Math.min(+t.mhp,(+t.hp||0)+n))+' / '+t.mhp)}}
function tbHpSet(field,v){const L=tbSelToks().filter(tbHpCan);if(!L.length)return;v=Math.max(0,Math.min(999,Math.round(+v||0)));
 if(field==='mhp')tbTokEdit(L,t=>({mhp:v,hp:+t.mhp>0?Math.min(+t.hp||0,v):v}),'set maximum health');
 else tbTokEdit(L.filter(t=>+t.mhp>0),t=>({hp:Math.min(v,+t.mhp)}),'set health')}
// ---- saved views (GM): jump to them, or send everyone there (switching the map if needed)
const tbViews=()=>tbMetaOf('view').sort((a,b)=>(a.ts||0)-(b.ts||0));
async function tbViewSave(name){const m=tbCur(),v=$('#tbview');if(!m||!v||!isOwner)return;name=String(name||'').trim().slice(0,40)||('View '+(tbViews().length+1));
 const doc={kind:'view',map:m.id,name,x:Math.round((v.clientWidth/2-tbV.x)/tbV.z),y:Math.round((v.clientHeight/2-tbV.y)/tbV.z),z:Math.round(tbV.z*1000)/1000,by:handle||'GM',ts:Date.now()};
 try{const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);const id=r.id,set=d=>tbSet('tbmeta',id,{deleted:d});tbHPush('save view '+name,()=>set(true),()=>set(false));tbNote('Saved "'+name+'".');tbBar()}catch(e){alert('Could not save: '+(e.message||e.code))}}
function tbViewGo(id){const w=tbMetaOf('view').find(x=>x.id===id),v=$('#tbview');if(!w||!v)return;
 if(!tbMaps().some(m=>m.id===w.map))return tbNote('That map is gone.');
 if(!tbCur()||tbCur().id!==w.map){tbVid=w.map;tbGrid=null;tbShown='';tbDraw()}
 tbV.z=Math.max(.05,Math.min(5,+w.z||1));tbV.x=v.clientWidth/2-(+w.x||0)*tbV.z;tbV.y=v.clientHeight/2-(+w.y||0)*tbV.z;tbApply()}
async function tbViewSend(id){const w=tbMetaOf('view').find(x=>x.id===id);if(!w||!isOwner)return;tbViewGo(id);
 try{const act=tbActive();if(!act||act.id!==w.map)await tbSetActive(w.map)}catch(e){}
 tbLookSend(+w.x||0,+w.y||0,+w.z||0,w.map)}
function tbViewDel(id){const w=tbMetaOf('view').find(x=>x.id===id);if(!w)return;const set=d=>tbSet('tbmeta',id,{deleted:d});set(true);tbHPush('delete view '+w.name,()=>set(false),()=>set(true));tbBar()}
// ---- image layers (GM): floor plans, handouts, overlays on top of the map picture
const tbLayers=m=>m?tbMetaOf('layer').filter(l=>l.map===m.id&&tbOk(l.img)).sort((a,b)=>(a.ts||0)-(b.ts||0)):[];
const tbLayer=id=>tbMetaOf('layer').find(l=>l.id===id)||null;
function tbLayersDraw(m){const el=$('#tbly');if(!el)return;const h=tbLayers(m).filter(l=>isOwner||l.shown).map(l=>`<img src="/_blob/${tbOk(l.img)}" alt="" draggable="false" style="position:absolute;max-width:none;left:${+l.x||0}px;top:${+l.y||0}px;width:${+l.w||100}px;height:${+l.h||100}px;opacity:${l.shown?Math.max(.05,Math.min(1,+l.op||1)):Math.min(.35,+l.op||1)};${l.shown?'':'outline:2px dashed #8899aa;'}">`).join('');
 if(el._h!==h){el._h=h;el.innerHTML=h}}
async function tbLyUpload(f){const m=tbCur();if(!f||!m||!isOwner)return;if(!assets)return alert('Uploading is not available right now. Try again in a moment.');tbNote('Uploading the picture…');
 try{const s=await tbShrink(f,2400,.86);if(!s.w||!s.h)throw {message:'That file is not a picture this browser can read.'};const up=await assets.upload(s.blob),w=Math.round(Math.min(m.w*.6,s.w)),h=Math.round(w*s.h/s.w);
  const doc={kind:'layer',map:m.id,name:String(f.name||'Layer').replace(/\.[a-z0-9]+$/i,'').slice(0,40)||'Layer',img:up.id,x:Math.round((m.w-w)/2),y:Math.round((m.h-h)/2),w,h,shown:false,op:1,by:handle||'GM',ts:Date.now()};
  const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);tbLyEdit=r.id;{const id=r.id,set=d=>tbSet('tbmeta',id,{deleted:d});tbHPush('add layer '+doc.name,()=>set(true),()=>set(false))}
  tbNote('Layer added. Drag it into place; it is hidden from players until you show it.');tbDraw()}catch(e){alert('Could not add the picture: '+(e.message||e.code||e))}}
function tbLySet(id,a,label){const l=tbLayer(id);if(!l)return;const b={};Object.keys(a).forEach(k=>{b[k]=l[k]});if(Object.keys(a).every(k=>a[k]===b[k]))return;
 const run=o=>tbSet('tbmeta',id,o);run(a);tbHPush(label,()=>run(b),()=>run(a));tbAfter()}
function tbLyHit(m,p){const l=tbLyEdit?tbLayer(tbLyEdit):null;if(!l||l.map!==m.id)return null;
 if(Math.hypot((l.x+l.w-p.x)*tbV.z,(l.y+l.h-p.y)*tbV.z)<=15)return 'rz';return (p.x>=l.x&&p.x<=l.x+l.w&&p.y>=l.y&&p.y<=l.y+l.h)?'mv':null}
function tbLyDown(m,p,e){const h=tbLyHit(m,p);if(!h)return false;const l=tbLayer(tbLyEdit);tbLyD={id:l.id,mode:h,sx:p.x,sy:p.y,orig:{x:l.x,y:l.y,w:l.w,h:l.h},pid:e.pointerId,moved:false};return true}
function tbLyMove(p){const D=tbLyD,l=D&&tbLayer(D.id),m=tbCur();if(!l||!m)return;D.moved=true;const dx=p.x-D.sx,dy=p.y-D.sy;
 if(D.mode==='mv'){l.x=Math.round(D.orig.x+dx);l.y=Math.round(D.orig.y+dy)}else{const w=Math.max(40,Math.round(D.orig.w+dx));l.w=w;l.h=Math.round(w*D.orig.h/D.orig.w)}
 tbLayersDraw(m);tbRulDraw()}
function tbLyEnd(){const D=tbLyD;tbLyD=null;if(!D)return;const l=tbLayer(D.id);if(!l||!D.moved)return tbRulDraw();const a={x:l.x,y:l.y,w:l.w,h:l.h};Object.assign(l,D.orig);tbLySet(D.id,a,D.mode==='mv'?'move a layer':'resize a layer')}
function tbLySvg(m,g,k){const l=tbLyEdit?tbLayer(tbLyEdit):null;if(!l||l.map!==m.id||!isOwner)return '';
 return `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="none" stroke="#ffd60a" stroke-width="${2*k}" stroke-dasharray="${8*k} ${5*k}"/><circle cx="${l.x+l.w}" cy="${l.y+l.h}" r="${7*k}" fill="#ffd60a" stroke="#000" stroke-width="${2*k}"/>`}
function tbLyPanel(m){const L=tbLayers(m);
 return `<div class="tbcw"><div class="meta"><b>Layers</b>: pictures on top of the map (floor plans, handouts, overlays). Hidden from players until you show them.</div>
 <div class="tbvb"><button class="btn sm grn" data-tbx="lyadd">⬆ Add a picture</button></div>
 ${L.map(l=>`<div class="tbsr${tbLyEdit===l.id?' sel':''}"><span>${l.shown?'👁':'🚫'} ${esc(l.name||'Layer')}</span><button class="btn sm" data-tbx="lyshow:${esc(l.id)}" title="${l.shown?'Hide from players':'Show to players'}">${l.shown?'🙈':'👁'}</button><button class="btn sm ${tbLyEdit===l.id?'on':''}" data-tbx="lyedit:${esc(l.id)}" title="Move and resize on the map">✥</button><button class="btn sm" data-tbx="lysolo:${esc(l.id)}" title="Show only this one">①</button><button class="btn sm" data-tbx="lyrm:${esc(l.id)}" title="Delete">✕</button></div>${tbLyEdit===l.id?`<div class="tbvb"><span class="meta">Opacity</span><input type="range" min="10" max="100" value="${Math.round((+l.op||1)*100)}" data-lyop="${esc(l.id)}" style="flex:1"></div>`:''}`).join('')||'<div class="meta">No layers on this map.</div>'}</div>`}
function tbLyAct(a,x){const l=tbLayer(x),m=tbCur();
 if(a==='lyadd'){const f=$('#tblyf');if(f){f.value='';f.onchange=()=>tbLyUpload(f.files&&f.files[0]);f.click()}return}
 if(!l)return;
 if(a==='lyshow')return tbLySet(x,{shown:!l.shown},l.shown?'hide a layer':'show a layer');
 if(a==='lyedit'){tbLyEdit=tbLyEdit===x?null:x;tbRulDraw();tbBar();return}
 if(a==='lysolo'){const L=tbLayers(m),run=v=>Promise.all(L.map(q=>tbSet('tbmeta',q.id,{shown:v[q.id]}))),b={},n={};L.forEach(q=>{b[q.id]=!!q.shown;n[q.id]=q.id===x});run(n);tbHPush('show one layer',()=>run(b),()=>run(n));tbAfter();return}
 if(a==='lyrm'){const set=d=>tbSet('tbmeta',x,{deleted:d});set(true);if(tbLyEdit===x)tbLyEdit=null;tbHPush('delete a layer',()=>set(false),()=>set(true));tbAfter()}}
// ---- markers anyone can drop ("checking here", "target"); they fade by themselves
async function tbMarkPlace(p){const m=tbCur();if(!m)return;const g=tbGeoM(m),s=tbSnapC(g,p),id='k'+pid(uid||handle||'x'),d={map:m.id,x:Math.round(s.x),y:Math.round(s.y),ic:tbMicon,lb:String(tbMlab||'').slice(0,24),by:handle||'?',ts:Date.now(),ttl:25000};
 try{await db.doc('tbping/'+id).set(d)}catch(e){}tbMarksDraw()}
function tbMarkClear(all){const me='k'+pid(uid||handle||'x');(pm.tbping||[]).forEach(p=>{if(p&&/^k/.test(String(p.id))&&(all?isOwner:p.id===me)){p.ts=0;db.doc('tbping/'+p.id).update({ts:0}).catch(()=>{})}});tbMarksDraw()}
function tbMarksDraw(){const el=$('#tbmarks'),m=tbCur();if(!el)return;const now=Date.now(),g=m?tbGeoM(m):null;let h='';
 if(m)(pm.tbping||[]).forEach(p=>{if(!p||p.map!==m.id)return;const age=now-(+p.ts||0),id=String(p.id);
  if(/^k/.test(id)){const ttl=+p.ttl||25000;if(age<0||age>ttl)return;const op=age>ttl-5000?Math.max(.05,(ttl-age)/5000):1;
   h+=`<div class="tbmk" style="left:${+p.x||0}px;top:${+p.y||0}px;opacity:${op.toFixed(2)}"><b>${esc(p.ic||'🎯')}</b><span>${esc((p.lb?p.lb+' · ':'')+(p.by||''))}</span></div>`}
  else if(/^d/.test(id)){if(age<0||age>9000)return;const t=tbTok(p.tok);if(!t)return;const sz=Math.max(.5,+t.sz||1),op=age>7000?(9000-age)/2000:1;
   h+=`<div class="tbdr ${p.good===true?'ok':p.good===false?'bad':''}" style="left:${g.ox+((+t.c||0)+sz/2)*g.gs}px;top:${g.oy+(+t.r||0)*g.gs}px;opacity:${op.toFixed(2)}">${esc(p.text||'')}</div>`}});
 if(el._h!==h){el._h=h;el.innerHTML=h}}
function tbMarkPanel(){return `<div class="tbcw"><div class="meta">Markers: press 🏷 (key K) and click a square to drop one. It fades after about 25 seconds. You have one at a time.</div>
 <div class="tbsws">${TB_MIC.map(c=>`<button class="tbcc${tbMicon===c?' on':''}" data-tbx="mic:${c}" aria-label="Marker icon ${c}">${c}</button>`).join('')}</div>
 <div class="tbvb"><input id="tbmlb" maxlength="24" placeholder="Label (optional), e.g. checking the door" value="${esc(tbMlab)}" style="flex:1"></div>
 <div class="tbvb"><button class="btn sm" data-tbx="mclr">Clear mine</button>${isOwner?'<button class="btn sm" data-tbx="mclra">Clear all</button>':''}</div></div>`}
// ---- dice rolled from a token: the result floats over it and goes to the table roll log (and Discord)
function tbRollOpen(t){if(!t||!(isOwner||tbCanRm(t)))return;const nm=tbName(t),pc=t.kind==='pc'||!!t.sheet;let post=true;try{post=localStorage.getItem('sr_tbdp')!=='0'}catch(e){}
 const dd=(id,sel)=>`<select id="${id}">${[4,6,8,10,12].map(n=>`<option value="${n}" ${n===sel?'selected':''}>d${n}</option>`).join('')}</select>`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbrf"><h2>🎲 ROLL FOR ${esc(nm.toUpperCase())}</h2>
 <div class="hint">The result floats over the token, goes into the table roll log, and can be posted to Discord. Savage Worlds style, like the Dice Roller.</div>
 <h3 style="margin:8px 0 2px;font-size:calc(14px*var(--ts,1))">TRAIT ROLL</h3><input id="tbrl" placeholder="What is it for? e.g. Shooting" maxlength="40">
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>TRAIT DIE</label>${dd('tbrd',8)}</div><div><label>MODIFIER</label><input type="number" id="tbrm" value="0" style="width:80px"></div><div><label>TARGET #</label><input type="number" id="tbrt" value="4" style="width:80px"></div></div>
 <label class="tbck"><input type="checkbox" id="tbrw" ${pc?'checked':''}> Wild Die (d6)</label>
 <div style="margin:8px 0"><button class="btn grn" type="button" id="tbrgo">Roll trait</button></div>
 <h3 style="margin:8px 0 2px;font-size:calc(14px*var(--ts,1))">DAMAGE ROLL</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>DICE</label><input type="number" id="tbrc" value="2" min="1" max="20" style="width:70px"></div><div><label>DIE</label>${dd('tbrs',6)}</div><div><label>MODIFIER</label><input type="number" id="tbrx" value="0" style="width:80px"></div></div>
 <label class="tbck"><input type="checkbox" id="tbra" checked> Dice ace (explode on the highest number)</label>
 <div style="margin:8px 0"><button class="btn grn" type="button" id="tbrgd">Roll damage</button></div>
 <label class="tbck"><input type="checkbox" id="tbrp" ${post?'checked':''}> Also post to Discord</label>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;
 const fin=async(plain,short,good)=>{const p=$('#tbrp').checked;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}closeM();
  try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
  const m=tbCur();if(m){const d={map:m.id,tok:t.id,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}tbMarksDraw()}};
 $('#tbrgo').onclick=()=>{const sides=+$('#tbrd').value,mod=parseInt($('#tbrm').value)||0,tn=parseInt($('#tbrt').value)||4,wildOn=$('#tbrw').checked,title=$('#tbrl').value.trim()||'Trait Roll';
  const trait=dxDie(sides,true),wild=wildOn?dxDie(6,true):null,best=wild?Math.max(trait.total,wild.total):trait.total,total=best+mod,crit=wild?(trait.raw===1&&wild.raw===1):false;let line,good;
  if(crit){line='Critical Failure! ⚠️';good=false}else if(total>=tn){const rs=Math.floor((total-tn)/4);line=rs>0?`Success! 🎯 with ${rs} Raise${rs>1?'s':''}! ${'⬆️'.repeat(rs)}`:'Success! 🎯';good=true}else{line='Failure. ❌';good=false}
  const dt=wild?`Trait(d${sides}): ${dxF(trait)} | Wild(d6): ${dxF(wild)}`:`Trait(d${sides}): ${dxF(trait)}`;
  fin(`🎲 **${title}** (d${sides}${wildOn?'+Wild d6':''}${mod?(mod>0?'+'+mod:mod):''}) — ${dt} → **${total}** vs TN ${tn} — ${line}`,`${title}: ${total} vs ${tn} · ${line.replace(/ [^\x00-\x7F]+/g,'').replace(/[^\x00-\x7F]+/g,'')}`,good)};
 $('#tbrgd').onclick=()=>{const sides=+$('#tbrs').value,count=Math.max(1,Math.min(20,parseInt($('#tbrc').value)||1)),mod=parseInt($('#tbrx').value)||0,ace=$('#tbra').checked,dice=Array.from({length:count},()=>dxDie(sides,ace)),sum=dice.reduce((a,d)=>a+d.total,0)+mod,lab=count+'d'+sides+(mod?(mod>0?'+'+mod:mod):'');
  fin(`💥 **Damage Roll** (${lab}) — ${count}d${sides}: ${dice.map(dxF).join(', ')} → **${sum}** total damage`,`Damage ${lab}: ${sum}`,null)}}
// ---- export and import of a whole prepared map (GM)
const tbB64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsDataURL(blob)});
async function tbMapExport(){const m=tbCur();if(!m||!isOwner)return;tbNote('Packing the map…');
 try{const blobs={},want=id=>{id=tbOk(id);if(id)blobs[id]=null;return id},
  toks=tbToks(m).map(t=>{const sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null;return {kind:t.kind==='pc'&&!t.sheet?'pc':t.kind,name:tbName(t),img:want((sh&&sh.img)||t.img),emoji:t.emoji||'',col:t.col||'',sz:t.sz||1,c:t.c||0,r:t.r||0,hid:!!t.hid,lock:!!t.lock,mark:t.mark||'',note:t.note||'',temp:!!t.temp,ar:+t.ar||0,ac:t.ac||'',vr:+t.vr||0,spd:+t.spd||0,hp:+t.hp||0,mhp:+t.mhp||0,hpv:!!t.hpv,cnd:tbCndOf(t)}}),
  lay=tbLayers(m).map(l=>({name:l.name,img:want(l.img),x:l.x,y:l.y,w:l.w,h:l.h,shown:!!l.shown,op:+l.op||1})),mimg=want(m.img),fg=(pm.tbfog||[]).find(f=>f&&f.id===m.id);
  const out={app:'srbbs-map',v:1,exported:new Date().toISOString(),map:{name:m.name,w:m.w,h:m.h,gs:m.gs,gx:m.gx||0,gy:m.gy||0,grid:m.grid!==false,gc:m.gc||'l',su:m.su||1,un:m.un||'m',fog:!!m.fog,av:m.av!==false,img:mimg},
   fog:fg&&Array.isArray(fg.rows)?fg.rows:[],tokens:toks,layers:lay,walls:tbWalls(m).map(w=>({...w})),
   shapes:tbShpAll(m).map(s=>{const o=tbShpPlain(s);o.by=s.by||'';return o}),notes:tbMetaOf('note').filter(n=>n.map===m.id).map(n=>({x:n.x,y:n.y,title:n.title||'',text:n.text||'',shown:!!n.shown})),
   views:tbViews().filter(v=>v.map===m.id).map(v=>({name:v.name,x:v.x,y:v.y,z:v.z})),blobs:{}};
  for(const id of Object.keys(blobs)){const r=await fetch('/_blob/'+id);if(!r.ok)continue;out.blobs[id]=await tbB64(await r.blob())}
  const txt=JSON.stringify(out),url=URL.createObjectURL(new Blob([txt],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(String(m.name||'map').replace(/[^\w\- ]+/g,'').trim()||'map')+'.srmap.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},800);
  tbNote('Exported '+Math.round(txt.length/1024)+' KB.')}catch(e){alert('Could not export: '+(e.message||e))}}
async function tbMapImport(f){if(!f||!isOwner)return;if(!assets)return alert('Uploading is not available right now. Try again in a moment.');if(f.size>90e6)return alert('That file is too large.');
 let d;try{d=JSON.parse(await f.text())}catch(e){return alert('That is not a map file.')}
 if(!d||d.app!=='srbbs-map'||!d.map||!d.map.img||!d.blobs)return alert('That is not a map file exported from here.');
 tbNote('Importing the map…');
 try{const ids={},up=async id=>{if(!id||!d.blobs[id])return '';if(ids[id])return ids[id];const r=await fetch(d.blobs[id]),b=await r.blob(),u=await assets.upload(b);ids[id]=u.id;return u.id};
  const M=d.map,mimg=await up(M.img);if(!mimg)throw {message:'The map picture is missing from the file.'};
  const doc={name:String(M.name||'Imported map').slice(0,60),img:mimg,w:+M.w,h:+M.h,gs:Math.max(8,+M.gs||50),gx:+M.gx||0,gy:+M.gy||0,grid:M.grid!==false,gc:TB_GC[M.gc]?M.gc:'l',su:+M.su||1,un:String(M.un||'m').slice(0,8),fog:!!M.fog,av:M.av!==false,by:handle||'GM',ts:Date.now()};
  if(!(doc.w>0&&doc.h>0))throw {message:'The map size in the file is not valid.'};
  const r=await db.collection('tbmaps').add(doc);tbLoc('tbmaps',r.id,doc);const mid=r.id;
  if(Array.isArray(d.fog)&&d.fog.length)await db.doc('tbfog/'+mid).set({rows:d.fog.map(x=>String(x).replace(/[^01]/g,'')),ts:Date.now(),by:handle||'GM'});
  const now=Date.now();let i=0;
  for(const t of (d.tokens||[]).slice(0,400)){const img=await up(t.img);await db.collection('tbtoks').add({map:mid,kind:TB_K[t.kind]?t.kind:'prop',name:String(t.name||'Token').slice(0,60),img,emoji:String(t.emoji||'').slice(0,8),col:tbColOk(t.col),sheet:'',sz:Math.max(.5,Math.min(8,+t.sz||1)),c:Math.max(0,+t.c||0),r:Math.max(0,+t.r||0),temp:!!t.temp,hid:!!t.hid,lock:!!t.lock,mark:t.mark==='down'?'down':'',note:String(t.note||'').slice(0,200),
    ar:Math.max(0,Math.min(30,+t.ar||0)),ac:tbColOk(t.ac),vr:Math.max(0,Math.min(40,+t.vr||0)),spd:Math.max(0,Math.min(60,+t.spd||0)),hp:Math.max(0,+t.hp||0),mhp:Math.max(0,+t.mhp||0),hpv:!!t.hpv,cnd:(Array.isArray(t.cnd)?t.cnd:[]).filter(k=>TB_CND.some(c=>c[0]===k)),by:handle||'GM',uid:uid||'',ts:now+(i++)})}
  if((d.walls||[]).length)await db.doc('tbmeta/w'+mid).set({kind:'walls',map:mid,items:d.walls.slice(0,1500).map(w=>({x0:+w.x0||0,y0:+w.y0||0,x1:+w.x1||0,y1:+w.y1||0,t:w.t==='d'?'d':'w',...(w.t==='d'?{o:w.o?1:0,l:w.l?1:0}:{})})),ts:now});
  for(const n of (d.notes||[]).slice(0,200))await db.collection('tbmeta').add({kind:'note',map:mid,x:+n.x||0,y:+n.y||0,title:String(n.title||'').slice(0,60),text:String(n.text||'').slice(0,1500),shown:!!n.shown,by:handle||'GM',ts:now+(i++)});
  for(const v of (d.views||[]).slice(0,60))await db.collection('tbmeta').add({kind:'view',map:mid,name:String(v.name||'View').slice(0,40),x:+v.x||0,y:+v.y||0,z:+v.z||1,by:handle||'GM',ts:now+(i++)});
  for(const l of (d.layers||[]).slice(0,40)){const img=await up(l.img);if(img)await db.collection('tbmeta').add({kind:'layer',map:mid,name:String(l.name||'Layer').slice(0,40),img,x:+l.x||0,y:+l.y||0,w:Math.max(20,+l.w||100),h:Math.max(20,+l.h||100),shown:!!l.shown,op:Math.max(.05,Math.min(1,+l.op||1)),by:handle||'GM',ts:now+(i++)})}
  for(const s of (d.shapes||[]).slice(0,300)){if(!TB_SH[s.kind])continue;const o={};TB_SHK.forEach(k=>{if(s[k]!==undefined&&k!=='lock'&&k!=='tok')o[k]=s[k]});if(s.kind==='emanation')o.tok='';await db.collection('tbdraw').add({...o,map:mid,by:String(s.by||handle||'GM'),uid:uid||'',lock:false,ts:now+(i++)})}
  tbVid=mid;tbShown='';tbGrid=null;tbDraw();tbNote('Imported "'+doc.name+'".')}catch(e){alert('Could not import: '+(e.message||e.code||e));tbDraw()}}
// ---- GM panel: views, layers, files
function tbFilesHtml(m){const V=tbViews();
 return `<div class="tbcw"><div class="meta"><b>Saved views</b>: bookmark where you are looking. Go jumps there; the 📡 button also brings every player there (and switches their map).</div>
 <div class="tbvb"><input id="tbvwn" maxlength="40" placeholder="Name, e.g. Loading dock" style="flex:1"><button class="btn sm grn" data-tbx="vwsave">＋ Save this view</button></div>
 ${V.map(v=>{const mm=tbMaps().find(x=>x.id===v.map);return `<div class="tbsr"><span>${esc(v.name||'View')}${mm&&m&&mm.id!==m.id?` <span class="meta">· ${esc(mm.name||'map')}</span>`:''}</span><button class="btn sm" data-tbx="vwgo:${esc(v.id)}">Go</button><button class="btn sm" data-tbx="vwsend:${esc(v.id)}" title="Bring every player here">📡</button><button class="btn sm" data-tbx="vwdel:${esc(v.id)}" title="Delete">✕</button></div>`}).join('')||'<div class="meta">No saved views yet.</div>'}</div>
 ${tbLyPanel(m)}
 <div class="tbcw"><div class="meta"><b>Backup this map</b>: everything on it (picture, grid, fog, tokens, walls, notes, layers, views, shapes) in one file you can keep or load into another campaign.</div>
 <div class="tbvb"><button class="btn sm" data-tbx="mexp">⬇ Export this map</button><button class="btn sm" data-tbx="mimp">⬆ Import a map file</button></div></div>`}
{const st=document.createElement('style');st.textContent=`
.tbhp{position:absolute;left:10%;right:10%;bottom:7%;height:min(40%,max(4px,9%,calc(6px*var(--iz,1))));background:rgba(0,0,0,.75);border:1px solid #000;z-index:3;pointer-events:none;border-radius:2px;overflow:hidden}.tbhp i{display:block;height:100%}.tbhn{display:none;position:absolute;left:50%;bottom:calc(7% + min(40%,max(4px,9%,calc(6px*var(--iz,1))))+2px);transform:translateX(-50%);font:700 calc(11px*var(--iz,1))/1 'Share Tech Mono',monospace;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap;pointer-events:none;z-index:4}#tbtw.lowz .tbhn{display:block}
#tbview.tool-mark{cursor:crosshair}
#tbly{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
#tbmarks{position:absolute;left:0;top:0}
.tbmk{position:absolute;width:0;height:0;pointer-events:none;transition:opacity .9s linear}.tbmk b{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:calc(34px*var(--iz,1));line-height:1;filter:drop-shadow(0 2px 3px #000)}.tbmk span{position:absolute;left:0;top:calc(22px*var(--iz,1));transform:translateX(-50%);white-space:nowrap;background:#0b1018;color:#fff;border:1px solid #ffd60a;font-size:calc(12px*var(--iz,1));padding:0 .4em}
.tbdr{position:absolute;transform:translate(-50%,-100%);margin-top:calc(-6px*var(--iz,1));white-space:nowrap;background:#0b1018;color:#fff;border:2px solid #ffd60a;font-size:calc(14px*var(--iz,1));font-weight:700;padding:calc(2px*var(--iz,1)) calc(8px*var(--iz,1));pointer-events:none;z-index:6;transition:opacity .9s linear;box-shadow:0 2px 8px #000}.tbdr.ok{border-color:#39ff14}.tbdr.bad{border-color:#ff3b3b}
`;document.head.appendChild(st)}
setInterval(()=>{if($('#tbroot'))try{tbMarksDraw()}catch(e){}},1000);
// ---- Tabletop: token right-click / long-press menu, and "centre on my character"
let tbCtxV=null,tbLong=null,tbCtxPend=null;
const tbMineT=m=>tbToks(m).filter(t=>{if(t.uid&&t.uid===uid)return true;const s=t.sheet?(pm.sheets||[]).find(x=>x&&x.id===t.sheet&&!x.deleted):null;return !!(s&&s.uid&&s.uid===uid)});
function tbCentreMine(){const m=tbCur(),v=$('#tbview');if(!m||!v)return;const L=tbMineT(m);let t=L.find(x=>x.id===tbSel)||L[0];
 if(!t&&isOwner&&tbSel)t=tbTok(tbSel);
 if(!t)return tbNote(isOwner?'Select a token first, then press this to centre on it.':'You do not have a token on this map. Press ＋ to put your character on it.');
 const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),x=g.ox+((+t.c||0)+sz/2)*g.gs,y=g.oy+((+t.r||0)+sz/2)*g.gs;
 tbV.z=Math.max(.6,Math.min(2.5,tbV.z<.6?1:tbV.z));tbV.x=v.clientWidth/2-x*tbV.z;tbV.y=v.clientHeight/2-y*tbV.z;tbSel=t.id;tbTS=[t.id];tbApply();tbDraw();tbPingFx({x,y,by:tbName(t)})}
function tbCtxClose(){const o=document.getElementById('tbctx');if(o)o.remove();document.removeEventListener('pointerdown',tbCtxOut,true);document.removeEventListener('keydown',tbCtxKey,true)}
const tbCtxOut=e=>{if(!e.target.closest||!e.target.closest('#tbctx'))tbCtxClose()};
function tbCtxKey(e){const o=document.getElementById('tbctx');if(!o)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();tbCtxClose();return}
 const b=[...o.querySelectorAll('button')],i=b.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();b[(i+1)%b.length].focus()}else if(e.key==='ArrowUp'){e.preventDefault();b[(i-1+b.length)%b.length].focus()}}
function tbCtxMenu(e){const m=tbCur();if(!m)return;
 if(!(e.buttons&2)&&tbCtxV&&(Math.abs(tbCtxV.x-tbV.x)>4||Math.abs(tbCtxV.y-tbV.y)>4)){tbCtxV=null;return}if(!(e.buttons&2))tbCtxV=null;
 let el=null;if(e.clientX||e.clientY){const hit=document.elementFromPoint(e.clientX,e.clientY);el=hit&&hit.closest('[data-tbt]')}else if(tbSel)el=document.querySelector('#tbtoks [data-tbt="'+tbSel+'"]');
 if(!el)return tbCtxClose();const t=tbTok(el.dataset.tbt);if(!t)return;
 const r=el.getBoundingClientRect(),x=e.clientX||r.left+r.width/2,y=e.clientY||r.top+r.height/2;
 if(e.buttons&2){tbCtxPend={id:t.id,x,y};return}tbCtxOpen(t,x,y)}
function tbCtxFlush(){const P=tbCtxPend;tbCtxPend=null;if(!P)return;const moved=tbCtxV&&(Math.abs(tbCtxV.x-tbV.x)>4||Math.abs(tbCtxV.y-tbV.y)>4);tbCtxV=null;if(moved)return;const t=tbTok(P.id);if(t)tbCtxOpen(t,P.x,P.y)}
function tbCtxOpen(t,x,y){const m=tbCur();if(!m)return;tbCtxClose();tbSelNorm();if(!tbTS.includes(t.id)){tbTS=[t.id]}tbSel=t.id;$('#tbtoks').querySelectorAll('.tbt').forEach(z=>z.classList.toggle('sel',tbTS.includes(z.dataset.tbt)));tbBar(m);
 const nm=tbName(t),can=isOwner||tbCanRm(t),hp=tbHpCan(t),sh=t.sheet&&(pm.sheets||[]).some(s=>s.id===t.sheet&&sxVis(s));
 const I=[];const add=(k,ic,lb,fn)=>I.push({k,ic,lb,fn});
 if(isOwner)add('edit','✎','Edit',()=>tbEdit(t));
 if(sh)add('sheet','📄','Open character sheet',()=>tbAct('sheet'));
 if(can)add('roll','🎲','Roll…',()=>tbRollOpen(t));
 if(isOwner)add('hide',t.hid?'👁':'🙈',t.hid?'Show to players':'Hide from players',()=>tbTokFlag(t,{hid:!t.hid}));
 if(hp)add('down',t.mark==='down'?'⬆':'⬇',t.mark==='down'?'Stand up':'Mark as down',()=>tbTokFlag(t,{mark:t.mark==='down'?'':'down'}));
 add('clue','🕵',(cbNodes().some(n=>n.tb&&n.tb.t===t.id)?'Open its Clue Board note':'Pin to the Clue Board'),()=>tbCluePin(t));
 if(isOwner&&tbIniOf(t))add('turn','▶','It is their turn',()=>tbAct('turn'));
 if(can)add('rm','🗑','Remove from the map',()=>tbRemove(t));
 const o=document.createElement('div');o.id='tbctx';o.setAttribute('role','menu');o.setAttribute('aria-label','Actions for '+nm);
 o.innerHTML=`<div class="tbcx-h">${esc(nm)}</div>`+I.map(i=>`<button type="button" role="menuitem" data-tbck="${i.k}"><span>${i.ic}</span>${esc(i.lb)}</button>`).join('');document.body.appendChild(o);
 const w=o.offsetWidth,h=o.offsetHeight;o.style.left=Math.max(4,Math.min(innerWidth-w-4,x))+'px';o.style.top=Math.max(4,Math.min(innerHeight-h-4,y))+'px';
 o.onclick=ev=>{const b=ev.target.closest('[data-tbck]');if(!b)return;const it=I.find(z=>z.k===b.dataset.tbck);tbCtxClose();if(it)try{it.fn()}catch(er){}};
 setTimeout(()=>{document.addEventListener('pointerdown',tbCtxOut,true);document.addEventListener('keydown',tbCtxKey,true);const f=o.querySelector('button');if(f)f.focus()},0)}
/* long-press on a token (touch screens) opens the same menu */
function tbLongStart(e){tbLongEnd();if(e.pointerType!=='touch'||e.button>0)return;const tEl=e.target.closest&&e.target.closest('[data-tbt]');if(!tEl)return;
 tbLong={x:e.clientX,y:e.clientY,id:tEl.dataset.tbt,pid:e.pointerId,t:setTimeout(()=>{const L=tbLong;tbLong=null;if(!L)return;const t=tbTok(L.id);if(!t)return;tbDrag=null;tbPan=null;try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}tbCtxOpen(t,L.x,L.y)},550)}}
function tbLongMove(e){if(tbLong&&e.pointerId===tbLong.pid&&Math.abs(e.clientX-tbLong.x)+Math.abs(e.clientY-tbLong.y)>9)tbLongEnd()}
function tbLongEnd(){if(tbLong){clearTimeout(tbLong.t);tbLong=null}}
// ---- Tabletop: weapon range bands on the ruler, and range rings around a token.
// A weapon's range is three numbers (Short/Medium/Long, like 12/24/48). Past Long it is Extreme, up to four times Long; beyond that it is out of range.
// The numbers count in grid squares (a Savage Worlds inch) unless the GM switches the map to "map units".
const TB_RB=[['Short','#39ff14'],['Medium','#ffd60a'],['Long','#ff9f1c'],['Extreme','#ff3b3b']],TB_RBP=[0,-2,-4,-8];
let tbRingsOn=false;
const tbRWmem=()=>{try{return JSON.parse(localStorage.getItem('sr_tbrw')||'{}')||{}}catch(e){return {}}};
const tbRWset=(id,i)=>{try{const o=tbRWmem();o[id]=i;localStorage.setItem('sr_tbrw',JSON.stringify(o))}catch(e){}};
const tbSheetOf=t=>t&&t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet&&!s.deleted)||null:null;
function tbRngNums(s){const m=String(s==null?'':s).match(/\d+(\.\d+)?/g);return m&&m.length>=3?m.slice(0,3).map(Number):null}
// the weapons a token can use: from its character or drone sheet, or from its own attack profile (cs.w)
function tbWeapons(t){if(!t)return [];const sh=tbSheetOf(t),L=sh?(Array.isArray(sh.weapons)?sh.weapons:[]):((t.cs&&Array.isArray(t.cs.w))?t.cs.w:[]);
 return L.map((w,i)=>w?{i,n:String(w.n||'Weapon'),rs:String(w.rng||''),rng:tbRngNums(w.rng),dmg:String(w.dmg||''),ap:+w.ap||0,sk:String(w.sk||''),rof:String(w.rof||''),mag:+w.mag||0,ammo:w.ammo,raw:w}:null).filter(Boolean)}
function tbWpnPick(t){const L=tbWeapons(t);if(!L.length)return null;const mem=tbRWmem()[t.id],w=L.find(x=>x.i===mem);return w||L.find(x=>x.rng)||L[0]}
const tbRU=(m,sq)=>m&&m.rbu==='mu'?sq*(+m.su||1):sq;
const tbSqOf=(m,u)=>m&&m.rbu==='mu'?u/(+m.su||1):u;
function tbBand(d,rng){if(!rng)return null;const a=rng[0],b=rng[1],c=rng[2],i=d<=a?0:d<=b?1:d<=c?2:3;return {i,name:TB_RB[i][0],pen:TB_RBP[i],col:TB_RB[i][1],out:d>c*4}}
const tbPenTxt=p=>p?'−'+Math.abs(p):'0';
// centre of a token in grid squares, and the distance between two tokens (squares, straight line)
const tbMid=t=>{const sz=Math.max(.5,+t.sz||1);return {x:(+t.c||0)+sz/2,y:(+t.r||0)+sz/2}};
const tbTokDist=(a,b)=>{const p=tbMid(a),q=tbMid(b);return Math.hypot(p.x-q.x,p.y-q.y)};
// which token does the ruler measure from: the one under its first point, else the selected one
function tbRulWho(R,m){const P=tbRulPoly(R)[0],g=tbGeoM(m);if(!P)return null;
 const hit=tbToks(m).find(t=>{const sz=Math.max(.5,+t.sz||1),x=(P.x-g.ox)/g.gs,y=(P.y-g.oy)/g.gs;return x>=(+t.c||0)&&x<=(+t.c||0)+sz&&y>=(+t.r||0)&&y<=(+t.r||0)+sz&&tbWeapons(t).length});
 if(hit)return hit;const s=tbSelToks();return s.length===1&&s[0].map===m.id&&tbWeapons(s[0]).length?s[0]:null}
// the second line under the ruler's distance label
function tbRulExtra(R,P,m,g,k,lm){const t=tbRulWho(R,m);if(!t)return '';const w=tbWpnPick(t);if(!w)return '';
 let sq=0;for(let i=0;i<P.length-1;i++)sq+=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y)/g.gs;const d=tbRU(m,sq);let txt,col;
 if(w.rng){const b=tbBand(d,w.rng);txt=b.out?w.n+': out of range':w.n+': '+b.name+' range ('+tbPenTxt(b.pen)+')';col=b.out?'#ff3b3b':b.col}
 else{const adj=sq<=1.5;txt=w.n+': '+(adj?'in reach':'not adjacent');col=adj?'#39ff14':'#ff9f1c'}
 return `<text x="${lm.x}" y="${lm.y+9*k}" text-anchor="middle" font-size="${14*k}" font-weight="700" fill="${col}" stroke="#000" stroke-width="${4*k}" paint-order="stroke" stroke-linejoin="round">${esc(txt)}</text>`}
// rings around the selected token: Short, Medium and Long for its chosen weapon
function tbRingsSvg(m,g){if(!tbRingsOn||!m)return '';const s=tbSelToks();if(s.length!==1||s[0].map!==m.id)return '';const t=s[0],w=tbWpnPick(t);if(!w||!w.rng)return '';
 const p=tbMid(t),cx=g.ox+p.x*g.gs,cy=g.oy+p.y*g.gs,k=1/Math.max(.25,tbV.z),fs=Math.max(11,g.gs*.24);let h='';
 [0,1,2].forEach(i=>{const R=tbSqOf(m,w.rng[i])*g.gs,col=TB_RB[i][1];
  h+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${i===0?col:'none'}" fill-opacity=".08" stroke="${col}" stroke-width="${Math.max(2,g.gs*.04)}" stroke-dasharray="${g.gs*.3} ${g.gs*.2}" stroke-opacity=".9"/>`;
  h+=`<text x="${cx}" y="${cy-R-4}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${col}" stroke="#000" stroke-width="${fs*.28}" paint-order="stroke" stroke-linejoin="round">${TB_RB[i][0]} ${tbPenTxt(TB_RBP[i])} · ${esc(String(w.rng[i]))}</text>`});
 return h}
// ---- the selected-token panel: pick the weapon the ruler and rings use
function tbRngPanel(L){if(!L||L.length!==1)return '';const t=L[0],ws=tbWeapons(t);if(!ws.length)return '';const w=tbWpnPick(t),m=tbCur(),hasR=ws.some(x=>x.rng);
 return `<div class="tbcw"><div class="meta">Weapon range</div><div class="tbvb"><select id="tbrw" aria-label="Weapon for the ruler and range rings">${ws.map(x=>`<option value="${x.i}" ${w&&w.i===x.i?'selected':''}>${esc(x.n)} (${esc(x.rs||'melee')})</option>`).join('')}</select>${hasR?`<button class="btn sm ${tbRingsOn?'on':''}" data-tbx="rings" title="Draw Short, Medium and Long range rings around this token">◎ Range rings</button>`:''}</div>
 <div class="meta">The ruler (📏) now says Short, Medium, Long or Extreme for this weapon, with the attack penalty.${m&&m.rbu==='mu'?' Ranges count in map units.':' Ranges count in grid squares.'}</div></div>`}
// ---- GM: what the weapon range numbers count in (kept on the map)
function tbRngMsr(m){if(!isOwner||!m)return '';return `<div class="tbvb"><span class="meta">Weapon ranges count in</span><select id="tbrbu"><option value="sq" ${m.rbu==='mu'?'':'selected'}>grid squares</option><option value="mu" ${m.rbu==='mu'?'selected':''}>map units (${esc(m.un||'m')})</option></select></div>`}
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.id)return;
 if(el.id==='tbrw'){const t=tbSelToks()[0];if(t){tbRWset(t.id,+el.value);tbRulDraw();tbRangeDraw()}}
 else if(el.id==='tbrbu'&&isOwner){const m=tbCur();if(!m)return;const v=el.value==='mu'?'mu':'sq';m.rbu=v;db.doc('tbmaps/'+m.id).update({rbu:v}).catch(()=>{});tbRulDraw();tbRangeDraw();tbBar(m)}});
TBX.rings=()=>{tbRingsOn=!tbRingsOn;tbRangeDraw();tbBar(tbCur())};
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
(function(){const st=document.createElement('style');st.id='tbtplcss';st.textContent=`.tbt.cgt{outline:3px dashed #ff2d95;outline-offset:2px;box-shadow:0 0 14px #ff2d95;z-index:5}.tbcgl{margin:6px 0;font-size:calc(13px*var(--ts,1))}`;document.head.appendChild(st)})();
// ---- Tabletop: attack from the map. Press the ⚔ tool, click your attacker, then click the target.
// A window works out the range, the target number and the penalties, rolls the attack (with the real sheet rules when the attacker has a sheet),
// rolls damage, and offers to apply the wounds to the target. Players' hits on tokens they do not own go to the GM to approve.
// Savage Worlds: Shooting and Throwing are against TN 4, Fighting is against the target's Parry, 4 over is a raise (+d6 damage),
// damage over Toughness is Shaken, and every 4 more is a wound.
const TB_CVR=[['No cover',0],['Light cover',-1],['Medium cover',-2],['Heavy cover',-4],['Near-total cover',-6]],TB_LIT=[['Bright light',0],['Dim light',-2],['Dark',-4],['Pitch black',-6]];
let tbAtkSt={a:null},tbAtk=null;
const tbAtkCan=t=>!!t&&(isOwner||tbCanRm(t));
// run fn with the global character set to this sheet (the same way Party at a Glance reads other sheets), then put everything back
function tbAs(d,fn){const kS=sh,kI=shId,kO={mod:shOpt.mod,tn:shOpt.tn,wild:shOpt.wild,pen:shOpt.pen};
 try{sh=shFix(JSON.parse(JSON.stringify(d)));shId=d.id;return fn(sh)}finally{sh=kS;shId=kI;shOpt.mod=kO.mod;shOpt.tn=kO.tn;shOpt.wild=kO.wild;shOpt.pen=kO.pen}}
const tbNum2=(v,lo,hi,d)=>{v=parseFloat(v);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
// what we know about a token as a target
function tbStatsOf(t){const s=tbSheetOf(t),cs=t.cs||{};
 if(!s&&!(cs.par||cs.tg)&&t.vh&&typeof tbVhTarget==='function'){const v=tbVhTarget(t);if(v)return {sheet:false,veh:true,parry:v.parry,tough:v.tough,arm:v.arm,wounds:v.wounds,wm:3,inc:false,shaken:false,known:v.known}}
 if(s){let st=null;try{st=pgStats(s)}catch(e){}st=st||{parry:0,tough:0,arm:0};let def=0;try{def=tbAs(s,()=>coParry())}catch(e){}
  let wm=3;try{wm=shWM(s)}catch(e){}
  return {sheet:true,parry:(+st.parry||0)+def,tough:+st.tough||0,arm:+st.arm||0,wounds:+s.wounds||0,wm,inc:!!s.inc,shaken:(s.status||[]).includes('Shaken'),known:true}}
 return {sheet:false,parry:+cs.par||0,tough:+cs.tg||0,arm:+cs.ar||0,wounds:(+t.mhp>0?Math.max(0,(+t.mhp)-(t.hp==null?+t.mhp:+t.hp)):0),wm:+t.mhp||0,inc:t.mark==='down',shaken:(Array.isArray(t.cnd)?t.cnd:[]).includes('stun'),known:!!(+cs.par||+cs.tg)}}
// one trait roll for a token that has no sheet: a die, an optional Wild Die, a modifier and a target number
function tbTraitRoll(title,sides,mod,tn,wild){const tr=dxDie(sides,true),wd=wild?dxDie(6,true):null,best=wd?Math.max(tr.total,wd.total):tr.total,fin=best+mod,crit=wd?(tr.raw===1&&wd.raw===1):false;
 let line,ok=false,rs=0;if(crit)line='Critical Failure! ⚠️';else if(fin>=tn){ok=true;rs=Math.floor((fin-tn)/4);line=rs>0?`Success! 🎯 with ${rs} Raise${rs>1?'s':''}! ${'⬆️'.repeat(rs)}`:'Success! 🎯'}else line='Failure. ❌';
 const sg=mod?(mod>0?'+'+mod:''+mod):'';
 return {fin,ok,rs,crit,line,title,detail:`Trait d${sides}: ${dxB(tr)}${wd?' | Wild d6: '+dxB(wd):''}`,plain:`🎲 **${title}** (d${sides}${wd?'+Wild d6':''}${sg}) — Trait: ${dxF(tr)}${wd?' | Wild: '+dxF(wd):''} → **${fin}** vs TN ${tn} — ${line}`}}
// damage like 2d6+1 or Str+d6 for a token without a sheet (Str uses the token's Strength die, d6 if unset)
function tbDmgRoll(str,strDie,raise,wildAtk){const s=String(str||'').replace(/\s+/g,'');if(!s)return null;const parts=s.match(/[+-]?[^+-]+/g);if(!parts)return null;let sum=0;const bits=[];
 for(const p0 of parts){const sg=p0[0]==='-'?-1:1,p=p0.replace(/^[+-]/,'');let m;
  if(/^str$/i.test(p)){const d=dxDie(strDie||6,true);sum+=sg*d.total;bits.push('Str d'+(strDie||6)+': '+dxF(d))}
  else if(m=p.match(/^(\d*)d(\d+)$/i)){for(let i=0;i<(+(m[1]||1));i++){const d=dxDie(+m[2],true);sum+=sg*d.total;bits.push('d'+m[2]+': '+dxF(d))}}
  else if(/^\d+$/.test(p)){sum+=sg*+p;bits.push((sg>0?'+':'−')+p)}else return null}
 if(wildAtk){sum+=2;bits.push('Wild Attack +2')}
 if(raise){const d=dxDie(6,true);sum+=d.total;bits.push('Raise d6: '+dxF(d))}
 return {sum,bits}}
// what a hit does: Shaken, then a wound for each 4 over Toughness (and one more if already Shaken)
function tbOutcome(dmg,eff,T){const mg=dmg-eff;if(mg<0)return {none:true,text:'no effect',nw:0,shaken:false};
 const rz=Math.floor(mg/4),nw=rz+(T.shaken?1:0),nt=T.wounds+nw,inc=T.veh?nt>=4:T.sheet?nt>T.wm:(+T.wm>0?nt>=T.wm:false);
 const bits=[T.veh?'Hit':(T.shaken?'Shaken again':'Shaken')];if(rz)bits.push(rz+' raise'+(rz>1?'s':'')+' over');if(nw)bits.push('+'+nw+' wound'+(nw>1?'s':''));if(inc)bits.push(T.veh?'WRECKED':'INCAPACITATED');
 return {none:false,text:bits.join(', '),nw,rz,shaken:true,inc,mg}}
// ---- picking attacker and target on the map
function tbAtkPaint(){const tk=$('#tbtoks');if(!tk)return;tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('atkr',tbTool==='attack'&&e.dataset.tbt===tbAtkSt.a))}
function tbAtkClick(m,tEl,e){const t=tEl?tbTok(tEl.dataset.tbt):null;
 if(!t){if(tbAtkSt.a){tbAtkSt.a=null;tbAtkPaint();tbNote('Attack cancelled.')}return}
 if(!tbAtkSt.a){if(!tbAtkCan(t)){tbNote('Pick one of your own tokens as the attacker first.');return}tbAtkSt.a=t.id;tbAtkPaint();tbNote('Attacker: '+tbName(t)+'. Now click the target.');return}
 if(t.id===tbAtkSt.a){tbAtkSt.a=null;tbAtkPaint();tbNote('Attack cancelled.');return}
 const a=tbTok(tbAtkSt.a);if(!a){tbAtkSt.a=null;return}tbAtkOpen(a,t)}
TBX.atk=(x,m,t)=>{const s=tbSelToks();tbAtkSt.a=(s.length===1&&tbAtkCan(s[0]))?s[0].id:null;tbAct('tool','attack');tbAtkPaint();tbNote(tbAtkSt.a?'Attacker: '+tbName(tbTok(tbAtkSt.a))+'. Click the target.':'Click your attacker, then the target.')};
function tbAtkPanel(L){if(!L||L.length!==1)return '';const t=L[0];if(!tbAtkCan(t))return '';
 return `<div class="tbcw"><div class="tbvb"><button class="btn sm ${tbTool==='attack'?'on':''}" data-tbx="atk" title="Attack from this token: then click the target on the map">⚔ Attack from here</button></div><div class="meta">Click the target after pressing it. The window works out range and cover, rolls the attack and damage, and offers to apply the wounds.</div></div>`}
// ---- the attack window
function tbAtkOpen(a,t){const m=tbCur();if(!m)return;const A=a,Tk=t,ws=tbWeapons(A),sheetA=tbSheetOf(A),cs=A.cs||{},tstat=tbStatsOf(Tk),dsq=tbTokDist(A,Tk),post=(()=>{try{return localStorage.getItem('sr_tbdp')!=='0'}catch(e){return true}})();
 const w0=ws.find(x=>x.rng)||ws[0]||null;
 tbAtk={a:A.id,t:Tk.id,wi:w0?w0.i:-1,res:null,dmg:null,hit:null,tn:null,T:tstat,dsq,done:false};
 const dd=(id,v)=>`<select id="${id}">${[4,6,8,10,12].map(n=>`<option value="${n}" ${n===v?'selected':''}>d${n}</option>`).join('')}</select>`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbaf"><h2>⚔ ${esc(tbName(A))} → ${esc(tbName(Tk))}</h2><div id="tbawh"></div>
 <div class="two"><div><label>WEAPON</label>${sheetA||ws.length?`<select id="tbaw">${ws.map(x=>`<option value="${x.i}" ${w0&&w0.i===x.i?'selected':''}>${esc(x.n)}${x.rs?' ('+esc(x.rs)+')':' (melee)'}</option>`).join('')}${sheetA?'':'<option value="-1">Something else…</option>'}</select>`:'<div class="meta">No weapons on file. Fill in the boxes below.</div>'}</div>
 <div><label>DISTANCE</label><div id="tbad" class="meta"></div></div></div>
 <div id="tbarof" style="display:none;gap:12px;align-items:flex-end;flex-wrap:wrap;margin:4px 0"><div><label>RATE OF FIRE (DICE)</label><select id="tbarf"><option value="1">1</option></select></div><label class="tbck" id="tbarrl" style="display:none"><input type="checkbox" id="tbarr" ${(()=>{try{return sheetA&&tbAs(sheetA,S=>swHasEdge(S,'rock_and_roll'))?'checked':''}catch(e){return ''}})()}> Ignore recoil (Rock and Roll, did not move)</label><span class="meta" id="tbarfm"></span></div>
 <div id="tbaam" class="meta" style="margin:2px 0 4px"></div>
 ${sheetA?'<div class="meta" id="tbasn" style="margin:2px 0 6px"></div>':`<div id="tbacs" style="border:1px solid var(--line);padding:6px 8px;margin:6px 0"><div class="meta">This token has no sheet: fill in its numbers.</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><div><label>SKILL DIE</label>${dd('tbasd',+cs.fi&&cs[(w0&&/^fight/i.test(w0.sk))?'fi':'sh']||+cs.sh||8)}</div><div><label>MODIFIER</label><input type="number" id="tbasm" value="0" style="width:70px"></div><div><label>STRENGTH DIE</label>${dd('tbast',+cs.st||6)}</div>
  <label class="tbck" style="align-self:end"><input type="checkbox" id="tbasw" ${cs.wc?'checked':''}> Wild Card (Wild Die)</label></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><div style="flex:2;min-width:120px"><label>WEAPON NAME</label><input id="tbawn" maxlength="40" value="${esc(w0?w0.n:'')}"></div><div style="width:110px"><label>RANGE</label><input id="tbawr" maxlength="20" placeholder="12/24/48" value="${esc(w0?w0.rs:'')}"></div><div style="width:100px"><label>DAMAGE</label><input id="tbawd" maxlength="20" placeholder="2d6" value="${esc(w0?w0.dmg:'')}"></div><div style="width:60px"><label>AP</label><input type="number" id="tbawa" value="${w0?w0.ap:0}" min="0"></div><div style="width:60px"><label>ROF</label><input type="number" id="tbawf" value="${w0&&w0.rof?esc(w0.rof):''}" min="1" max="12" placeholder="1"></div><div style="width:100px"><label>SKILL</label><select id="tbawk"><option>Shooting</option><option>Fighting</option><option>Throwing</option><option>Athletics</option></select></div></div>
  ${isOwner?'<div style="margin-top:4px"><button type="button" class="btn sm" id="tbasv">💾 Remember this on the token</button> <span class="meta" id="tbasvm"></span></div>':''}</div>`}
 <h3 style="margin:8px 0 2px;font-size:calc(14px*var(--ts,1))">TARGET</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><div><label>PARRY</label><input type="number" id="tbtp" value="${tstat.parry||''}" min="0" style="width:70px" ${tstat.sheet?'disabled':''}></div><div><label>TOUGHNESS</label><input type="number" id="tbtt" value="${tstat.tough||''}" min="0" style="width:80px" ${tstat.sheet?'disabled':''}></div><div><label>ARMOR (IN TOUGHNESS)</label><input type="number" id="tbta" value="${tstat.arm||0}" min="0" style="width:80px" ${tstat.sheet?'disabled':''}></div>
  ${!tstat.sheet&&isOwner?'<button type="button" class="btn sm" id="tbtsv">💾 Remember</button>':''}<span class="meta" id="tbtnote">${tstat.sheet?'from the target\'s sheet':(tstat.known?'':'Not set yet: fill in Parry and Toughness (the GM can remember them on the token).')}</span></div>
 <h3 style="margin:8px 0 2px;font-size:calc(14px*var(--ts,1))">MODIFIERS</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>RANGE BAND</label><select id="tbarb"><option value="0">Short (0)</option><option value="1">Medium (−2)</option><option value="2">Long (−4)</option><option value="3">Extreme (−8)</option></select></div><div><label>COVER</label><select id="tbacv">${TB_CVR.map((c,i)=>`<option value="${i}">${c[0]} (${c[1]||0})</option>`).join('')}</select></div><div><label>LIGHT</label><select id="tbali">${TB_LIT.map((c,i)=>`<option value="${i}">${c[0]} (${c[1]||0})</option>`).join('')}</select></div><div><label>CALLED SHOT</label><select id="tbacl"><option value="0">None</option><option value="-2">Limb or small target (−2)</option><option value="-4">Head or tiny target (−4)</option></select></div></div>
 <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px"><label class="tbck"><input type="checkbox" id="tbaai"> Aimed shot (+2)</label><label class="tbck"><input type="checkbox" id="tbasl"> Smartlink or targeting aid (+1)</label><label class="tbck"><input type="checkbox" id="tbawa2"> Wild Attack (+2 attack and damage, melee)</label><span>Other <input type="number" id="tbaom" value="0" style="width:64px"></span></div>
 <div class="meta" id="tbatn" style="margin-top:6px"></div>
 <div style="margin:10px 0"><button class="btn grn" type="button" id="tbago">🎲 Roll attack</button> <button class="btn" type="button" id="tbagd" disabled>💥 Roll damage</button> <label class="tbck" style="display:inline-block;margin-left:10px"><input type="checkbox" id="tbadp" ${post?'checked':''}> Post to Discord</label></div>
 <div id="tbar"><div id="tbar1"></div><div id="tbar2"></div></div>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Close</button></div></form></div>`;
 tbAtkWire();tbAtkRefresh()}
function tbAtkWeapon(){const A=tbTok(tbAtk.a);if(!A)return null;const sheetA=tbSheetOf(A);
 if(sheetA||$('#tbaw')&&+$('#tbaw').value>=0){const ws=tbWeapons(A),i=$('#tbaw')?+$('#tbaw').value:tbAtk.wi;return ws.find(x=>x.i===i)||ws[0]||null}
 const rs=($('#tbawr')||{}).value||'';return {i:-1,n:($('#tbawn')||{}).value||'Weapon',rs,rng:tbRngNums(rs),dmg:($('#tbawd')||{}).value||'',ap:+($('#tbawa')||{}).value||0,sk:($('#tbawk')||{}).value||(tbRngNums(rs)?'Shooting':'Fighting'),rof:($('#tbawf')||{}).value||'',raw:null}}
function tbAtkT(){const T=tbAtk.T,g=id=>+($(id)||{}).value||0;return T.sheet?T:{...T,parry:g('#tbtp'),tough:g('#tbtt'),arm:g('#tbta')}}
// the range band, target number and the sum of all the modifiers the window knows about
function tbAtkCalc(){const A=tbTok(tbAtk.a),m=tbCur(),w=tbAtkWeapon();if(!A||!m||!w)return null;const T=tbAtkT(),melee=!w.rng,d=tbRU(m,tbAtk.dsq),b=w.rng?tbBand(d,w.rng):null,v=id=>+($(id)||{}).value||0;
 const bi=b?(+($('#tbarb')||{}).value):0;
 const xs=[];if(!melee&&bi)xs.push([['Short','Medium','Long','Extreme'][bi]+' range',TB_RBP[bi]]);
 const cv=TB_CVR[v('#tbacv')][1],li=TB_LIT[v('#tbali')][1],cl=v('#tbacl'),ai=$('#tbaai').checked?2:0,sl=$('#tbasl').checked&&!melee?1:0,wa=$('#tbawa2').checked&&melee?2:0,om=v('#tbaom');
 if(cv)xs.push([TB_CVR[v('#tbacv')][0],cv]);if(li)xs.push([TB_LIT[v('#tbali')][0],li]);if(cl)xs.push([cl===-2?'Called shot (limb)':'Called shot (head)',cl]);if(ai)xs.push(['Aimed shot',ai]);if(sl)xs.push(['Smartlink',sl]);if(wa)xs.push(['Wild Attack',wa]);if(om)xs.push(['Other',om]);
 const n=melee?1:Math.max(1,Math.min(12,v('#tbarf')||1));if(n>1&&!($('#tbarr')||{}).checked)xs.push(['Recoil',-2]);
 return {A,m,w,T,melee,d,b,xs,n,tn:melee?Math.max(1,T.parry||4):4,sum:xs.reduce((s,x)=>s+x[1],0)}}
function tbAtkRefresh(){if(!tbAtk||!$('#tbaf'))return;const rf=$('#tbarf');if(rf){const r=$('#tbarrl');if(r)r.style.display=(+rf.value>1)?'':'none'}tbAtkAmmoLine();const C=tbAtkCalc(),el=$('#tbatn');if(!C){if(el)el.textContent='Pick a weapon.';return}
 const dtx=$('#tbad'),dd=Math.round(C.d*10)/10,u=C.m.rbu==='mu'?(C.m.un||'m'):'squares';
 if(dtx)dtx.innerHTML=`${dd} ${esc(u)} straight line`+(C.w.rng&&C.b?` · <b style="color:${C.b.col}">${C.b.out?'out of range':C.b.name+' range'}</b>`:C.melee?(tbAtk.dsq<=1.5?' · <b style="color:#39ff14">adjacent</b>':' · <b style="color:#ff9f1c">not adjacent</b>'):'');
 if(el)el.innerHTML=`Target number <b>${C.tn}</b> (${C.melee?'target Parry':'Shooting and Throwing'})${C.n>1?' · <b>'+C.n+' dice</b>':''} · modifiers <b>${C.sum>0?'+'+C.sum:C.sum}</b>${C.xs.length?' <span class="meta">('+esc(C.xs.map(x=>x[0]+' '+(x[1]>0?'+':'−')+Math.abs(x[1])).join(', '))+')</span>':''}`;
 const sn=$('#tbasn');if(sn&&tbSheetOf(C.A)){let L=[];try{L=tbAs(tbSheetOf(C.A),()=>{coChk();return coActive()})}catch(e){}sn.textContent=L.length?'From the sheet: '+L.join(' · ')+'. Wound and condition penalties are added when you roll.':'Wound and condition penalties from the sheet are added when you roll.'}}
function tbAtkWire(){const f=$('#tbaf');if(!f)return;$('#cx').onclick=closeM;const m=tbCur(),A=tbTok(tbAtk.a);
 const setBand=()=>{const w=tbAtkWeapon(),b=w&&w.rng?tbBand(tbRU(m,tbAtk.dsq),w.rng):null;$('#tbarb').value=b?String(Math.min(3,b.i)):'0';$('#tbarb').disabled=!b;
  const wa=$('#tbawa2');if(wa)wa.parentElement.style.opacity=w&&!w.rng?'':'.45';tbAtkRofFill();
  const sd=$('#tbasd');if(sd&&w&&A){const c=A.cs||{},fight=/^fight/i.test(w.sk||''),d=+(w.raw&&w.raw.d)||+c[fight?'fi':'sh']||0;if(d&&[...sd.options].some(o=>+o.value===d))sd.value=String(d)}};
 f.addEventListener('input',()=>{tbAtkRefresh()});f.addEventListener('change',e=>{if(e.target.id==='tbaw'||e.target.id==='tbawr')setBand();tbAtkRefresh()});
 $('#tbawr')&&$('#tbawr').addEventListener('input',setBand);$('#tbawf')&&$('#tbawf').addEventListener('input',setBand);
 setBand();
 const memo=(id,tok,ob,msg)=>{if(!tok)return;tbTokEdit([tok],()=>ob,'remember numbers').then(()=>{const e=$(id);if(e)e.textContent=msg})};
 const sv=$('#tbasv');if(sv)sv.onclick=()=>{const w=tbAtkWeapon();if(!w)return;const cs={...(A.cs||{})},fight=/^fight/i.test(w.sk||''),sd=+$('#tbasd').value;
  if(fight)cs.fi=sd;else cs.sh=sd;cs.st=+$('#tbast').value;cs.wc=$('#tbasw').checked;cs.w=[{n:w.n,rng:w.rs,dmg:w.dmg,ap:w.ap,sk:w.sk,rof:w.rof||''}];memo('#tbasvm',A,{cs},'Saved on '+tbName(A)+'.')};
 const ts=$('#tbtsv');if(ts)ts.onclick=()=>{const T=tbTok(tbAtk.t);if(!T)return;const cs={...(T.cs||{}),par:+$('#tbtp').value||0,tg:+$('#tbtt').value||0,ar:+$('#tbta').value||0};memo('#tbtnote',T,{cs},'Saved on '+tbName(T)+'.')};
 $('#tbago').onclick=tbAtkRoll;$('#tbagd').onclick=tbAtkDamage}
// ---- the attack roll
async function tbAtkFinish(plain,short,good,tokId){const p=$('#tbadp')?$('#tbadp').checked:true;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}
 const A=tbTok(tbAtk.a),nm=A?tbName(A):handle;try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
 const m=tbCur();if(m){const d={map:m.id,tok:tokId||tbAtk.a,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}try{tbMarksDraw()}catch(e){}}}
const tbAtkSgn=xs=>xs.map(x=>x[0]+' '+(x[1]>0?'+':'−')+Math.abs(x[1])).join(', ');
// most dice the weapon can fire: its Rate of Fire, plus one with Rapid Fire
function tbAtkRofMax(A,w){if(!w||!w.rng||/^fight/i.test(w.sk||''))return 1;let r=Math.max(1,spNum(w.rof));const s=tbSheetOf(A);
 if(s){try{if(tbAs(s,S=>swHasEdge(S,'rapid_fire')||swHasEdge(S,'improved_rapid_fire')))r++}catch(e){}}return Math.min(12,r)}
function tbAtkRofFill(){const A=tbTok(tbAtk.a),w=tbAtkWeapon(),box=$('#tbarof'),sel=$('#tbarf');if(!box||!sel||!A)return;const mx=tbAtkRofMax(A,w),old=+sel.value||1;
 box.style.display=mx>1?'flex':'none';
 let h='';for(let n=1;n<=mx;n++)h+=`<option value="${n}">${n===1?'1 die (single shot)':n+' dice (ROF '+n+')'+' · '+amShots(n)+' rounds'}</option>`;
 if(sel._h!==h){sel._h=h;sel.innerHTML=h}sel.value=String(Math.min(old,mx));
 const rl=$('#tbarrl');if(rl)rl.style.display=(+sel.value>1)?'':'none'}
// the ammo line, for sheets that track a magazine on the weapon
function tbAtkAmmoLine(){const el=$('#tbaam');if(!el||!tbAtk)return;const A=tbTok(tbAtk.a),s=A&&tbSheetOf(A),w=tbAtkWeapon(),rw=s&&w&&w.i>=0?(s.weapons||[])[w.i]:null;
 if(!rw||!amOn(rw)){if(el._h){el._h='';el.innerHTML=''}return}
 const a=Math.max(0,Math.floor(+rw.ammo||0)),sp=amSpare(rw),n=Math.max(1,Math.min(12,+($('#tbarf')||{}).value||1)),need=amShots(n);
 const h=`Ammo: <b style="color:${a<need?'var(--mg)':'inherit'}">${a}</b> / ${+rw.mag} rounds${sp!==null?' · '+sp+' spare magazine'+(sp===1?'':'s'):''}${n>1?' · this burst uses '+need:''}${a<need&&a>0?' (only '+a+' left: it uses them all)':''}${a<=0?' · <b style="color:var(--mg)">empty</b>':''} <button type="button" class="btn sm" id="tbarl" ${a>=+rw.mag||(sp!==null&&sp<=0)?'disabled':''}>Reload</button>`;
 if(el._h!==h){el._h=h;el.innerHTML=h;const b=$('#tbarl');if(b)b.onclick=tbAtkReload}}
async function tbAtkReload(){const A=tbTok(tbAtk.a),s=A&&tbSheetOf(A),w=tbAtkWeapon();if(!s||!w||w.i<0)return;const rw=(s.weapons||[])[w.i];if(!rw||!amOn(rw))return;
 const cur=Math.max(0,Math.floor(+rw.ammo||0)),sp=amSpare(rw);if(cur>=+rw.mag||(sp!==null&&sp<=0))return;
 const ws=s.weapons.map(x=>({...x}));ws[w.i].ammo=+rw.mag;if(sp!==null)ws[w.i].spare=sp-1;s.weapons=ws;
 try{await db.doc('sheets/'+s.id).update({weapons:ws})}catch(e){alert('Could not reload: '+(e.message||e.code||''));return}
 const el=$('#tbaam');if(el)el._h='';tbAtkAmmoLine();tbSay(tbName(A),'🔄 **'+tbName(A)+'** reloads '+(rw.n||'the weapon')+'.','Reloads '+(rw.n||'weapon'),null,A.id)}
// takes the rounds off the weapon on the real sheet. Returns '' or the reason it cannot fire.
async function tbAtkAmmo(C){const s=tbSheetOf(C.A),w=C.w;if(!s||w.i<0)return '';const rw=(s.weapons||[])[w.i];if(!rw||!amOn(rw))return '';
 const a=Math.max(0,Math.floor(+rw.ammo||0));if(a<=0)return (rw.n||'This weapon')+' is empty. Press Reload first.';
 const ws=s.weapons.map(x=>({...x}));ws[w.i].ammo=a-Math.min(amShots(C.n),a);s.weapons=ws;
 try{await db.doc('sheets/'+s.id).update({weapons:ws})}catch(e){return 'Could not use the ammo: '+(e.message||e.code||'')}
 const el=$('#tbaam');if(el)el._h='';tbAtkAmmoLine();return ''}
// one attack roll (one die, or a burst of several). elan adds the +2 a Benny reroll gets from the Elan edge.
function tbAtkDo(C,elan){const A=C.A,sheetA=tbSheetOf(A),w=C.w,sk=w.sk||(C.melee?'Fighting':'Shooting'),n=C.n;let res;
 if(sheetA){res=tbAs(sheetA,S=>{let f=null;for(const k in S.sk)(S.sk[k]||[]).forEach(x=>{if(x.n===sk)f=x});if(!f&&drRigOn())f={n:sk,d:0,m:0};if(!f)return {err:'This sheet has no "'+sk+'" skill.'};
   coChk();shOpt.mod=0;shOpt.tn=C.tn;shOpt.pen=true;
   const xs=C.xs.concat(shWXs(S.weapons[w.i]||w.raw||{})),p=shPrep(+f.d||4,f.m,w.n+(n>1?' autofire ROF '+n:' attack')+' ('+f.n+')',!+f.d,true,{sk:f.n},xs);
   if(elan&&coHas('elan'))p.m+=2;
   if(n>1)return shMultiRes({n,tns:[C.tn],title:p.title},p);
   const o={title:p.title,sides:p.sides,mod:p.m,tn:C.tn,wild:p.wild,ws:p.ws||6},r=shRes(o);
   r.rs=r.ok?Math.floor((r.fin-o.tn)/4):0;r.crit=/Critical/.test(r.line);return r});
  if(res&&res.err)return res}
 else{const sides=+($('#tbasd')||{}).value||8,mod=(+($('#tbasm')||{}).value||0)+C.sum,wc=!!($('#tbasw')||{}).checked,
   title=w.n+(n>1?' autofire ROF '+n:' attack')+' ('+sk+')'+(C.xs.length?' ['+tbAtkSgn(C.xs)+']':'');
  res=n>1?shMultiRes({n,tns:[C.tn],title},{sides,m:mod,title,wild:wc,ws:6}):tbTraitRoll(title,sides,mod,C.tn,wc)}
 if(!res.items)res.items=[{fin:res.fin,tn:C.tn,ok:!!res.ok,rs:res.rs||0}];
 res.score=res.crit?-1:(res.score!=null?res.score:res.fin);return res}
function tbAtkShow(note){const res=tbAtk.res,C=tbAtkCalc(),A=tbTok(tbAtk.a);if(!res||!C||!A)return;
 const hits=res.items.filter(x=>x.ok).length,bn=tbBnOf(A);
 $('#tbar1').innerHTML=`<div class="post" style="padding:8px 10px">${note?`<div class="meta">${esc(note)}</div>`:''}<div style="font-size:calc(16px*var(--ts,1))"><b>${esc(String(res.fin))}</b> vs TN ${C.tn} — ${esc(res.line)}</div><div class="meta">${esc(res.detail)}</div>
  <div style="margin-top:6px"><button type="button" class="btn sm" id="tbabn" ${tbBnCan(A)&&!tbAtk.dmg?'':'disabled'} title="Spend a Benny and roll the attack again. You keep the better result.">🎟 Benny reroll (${esc(tbBnTxt(A))})</button> <span class="meta" id="tbabm"></span></div></div>`;
 $('#tbagd').disabled=!res.ok;const b=$('#tbabn');if(b)b.onclick=tbAtkBenny}
async function tbAtkRoll(){const C=tbAtkCalc();if(!C)return;const A=C.A,T=tbTok(tbAtk.t),w=C.w;
 if(!C.melee&&C.b&&C.b.out&&!await ask('The target is beyond Extreme range. Roll anyway?','Roll anyway'))return;
 const bad=await tbAtkAmmo(C);if(bad){$('#tbar1').innerHTML=`<div class="warn">${esc(bad)}</div>`;return}
 const res=tbAtkDo(C);
 if(res&&res.err){$('#tbar1').innerHTML=`<div class="warn">${esc(res.err)}</div>`;return}
 tbAtk.res=res;tbAtk.wi=w.i;tbAtk.hit=null;tbAtk.dmg=null;tbAtk.applied=false;$('#tbar2').innerHTML='';
 const who=tbName(A),tg=tbName(T||{}),plain=`⚔ **${who}** attacks **${tg}** with ${w.n}${C.b&&!C.melee?' ('+(C.b.out?'out of range':C.b.name+' range')+')':''}: `+res.plain;
 tbAtkShow();$('#tbago').textContent='🎲 Roll attack again';
 const hits=res.items.filter(x=>x.ok),rz=Math.max(0,...res.items.map(x=>x.rs));
 tbAtkFinish(plain,`${w.n}: ${res.fin} vs ${C.tn} · ${hits.length?(C.n>1?hits.length+' of '+C.n+' hit':(rz?'hit +'+rz+' raise'+(rz>1?'s':''):'hit')):(res.crit?'critical failure':'miss')}`,hits.length>0,tbAtk.a);
 const tf=$('#tbadp');if(res.crit&&tf)tf.disabled=false}
// Benny: roll the attack again, keep the better of the two
async function tbAtkBenny(){const C=tbAtkCalc(),old=tbAtk&&tbAtk.res;if(!C||!old||tbAtk.dmg)return;const A=C.A,why=await tbBnSpend(A);if(why){const m=$('#tbabm');if(m)m.textContent=why;return}
 const nw=tbAtkDo(C,true);if(nw.err){$('#tbabm').textContent=nw.err;return}
 const better=nw.score>=old.score,keep=better?nw:old;
 const note=`Benny reroll: new ${nw.fin} vs old ${old.fin} → keeps ${keep.fin}`;
 tbAtk.res=keep;tbAtkShow(note);try{tbBar()}catch(e){}
 const hits=keep.items.filter(x=>x.ok).length;
 tbAtkFinish(`🔁 **${tbName(A)}** spends a Benny on the ${C.w.n} attack: new **${nw.fin}** vs old **${old.fin}** → keeps **${keep.fin}** vs TN ${C.tn} — ${keep.line}`,`Benny reroll → ${keep.fin} vs ${C.tn}`,hits>0,tbAtk.a)}
// ---- the damage roll and the hit
// Several hits in a row: each one is worked out against the target as the earlier ones left it (Shaken, then wounds)
function tbOcSum(list,T0){const L=list.filter(x=>!x.oc.none);if(list.length===1)return list[0].oc;if(!L.length)return {none:true,text:'no effect',nw:0,shaken:false};
 const nw=L.reduce((a,x)=>a+x.oc.nw,0),inc=!!L[L.length-1].oc.inc,bits=[T0.veh?'Hit':(T0.shaken?'Shaken again':'Shaken')];if(nw)bits.push('+'+nw+' wound'+(nw>1?'s':''));if(inc)bits.push(T0.veh?'WRECKED':'INCAPACITATED');
 return {none:false,text:bits.join(', '),nw,rz:0,shaken:true,inc}}
function tbAtkDmgDo(C,res){const A=C.A,sheetA=tbSheetOf(A),w=C.w,Tn=C.T,eff=Math.max(0,Tn.tough-Math.min(w.ap||0,Tn.arm||0)),wildAtk=C.melee&&$('#tbawa2').checked,list=[];let Tc={...Tn};
 for(const h of res.items.filter(x=>x.ok)){let r;
  if(sheetA){r=tbAs(sheetA,S=>{coChk();return dmgCore(w.i,{wild:wildAtk&&/^fight/i.test(w.sk||'Fighting'),joker:false,raise:h.rs>0,gk:false,chi:false,dbl:false,benny:false,tt:'',ta:''})});if(!r)return {err:'That weapon has no damage written on the sheet (like 2d6+1).'};r={sum:r.sum,bits:r.bits}}
  else{r=tbDmgRoll(w.dmg,+($('#tbast')||{}).value||6,h.rs>0,wildAtk);if(!r)return {err:'Type the damage like 2d6+1 or Str+d6 first.'}}
  const oc=tbOutcome(r.sum,eff,Tc);if(!oc.none)Tc={...Tc,wounds:Tc.wounds+oc.nw,shaken:true};list.push({sum:r.sum,bits:r.bits,oc})}
 return {list,eff,oc:tbOcSum(list,Tn),total:list.reduce((a,x)=>a+x.sum,0)}}
function tbAtkDmgShow(note){const D=tbAtk.dmg,C=tbAtkCalc(),T=tbTok(tbAtk.t),A=tbTok(tbAtk.a);if(!D||!C||!T||!A)return;const Tn=C.T,w=C.w,oc=D.oc,multi=D.list.length>1;
 const can=isOwner||(Tn.sheet&&tbSheetOf(T)&&tbSheetOf(T).uid===uid)||(Tn.veh&&typeof tbVhMine==='function'&&tbVhMine(T));
 const ap=w.ap?` (AP ${w.ap} against armor ${Tn.arm||0})`:'';
 tbAtk.hit={dmg:multi?D.list.map(x=>x.sum).join(', '):D.list[0].sum,bits:D.list.reduce((a,x)=>a.concat(x.bits),[]),eff:D.eff,oc,wname:w.n,tn:Tn};
 $('#tbar2').innerHTML=`<div class="post" style="padding:8px 10px;margin-top:6px">${note?`<div class="meta">${esc(note)}</div>`:''}
  ${multi?`<div style="font-size:calc(15px*var(--ts,1))">💥 ${D.list.length} hits against Toughness <b>${D.eff}</b>${esc(ap)}</div>${D.list.map((x,i)=>`<div>Hit ${i+1}: <b>${x.sum}</b> damage → ${esc(x.oc.text)} <span class="meta">${esc(x.bits.join(' | '))}</span></div>`).join('')}<div style="margin-top:4px">Together: <b style="color:${oc.none?'var(--dim)':'var(--mg)'}">${esc(oc.text)}</b></div>`
  :`<div style="font-size:calc(16px*var(--ts,1))">💥 <b>${D.list[0].sum}</b> damage vs Toughness <b>${D.eff}</b>${esc(ap)} — <b style="color:${oc.none?'var(--dim)':'var(--mg)'}">${esc(oc.text)}</b></div><div class="meta">${esc(D.list[0].bits.join(' | '))}</div>`}
  <div style="margin-top:6px">${oc.none||tbAtk.applied?'':can?'<button type="button" class="btn grn" id="tbapl">Apply to '+esc(tbName(T))+'</button> ':'<button type="button" class="btn grn" id="tbaps">Send to the GM to apply</button> '}<button type="button" class="btn sm" id="tbadb" ${tbBnCan(A)&&!tbAtk.applied?'':'disabled'} title="Spend a Benny and roll the damage again. You keep the better result.">🎟 Benny: roll damage again (${esc(tbBnTxt(A))})</button> <span class="meta" id="tbaplm"></span></div></div>`;
 $('#tbagd').disabled=true;
 const b=$('#tbapl');if(b)b.onclick=async()=>{b.disabled=true;try{await tbApplyHit(tbAtk.t,tbAtk.hit);tbAtk.applied=true;const bb=$('#tbadb');if(bb)bb.disabled=true;$('#tbaplm').textContent='Applied.';tbAtkSoakBtn()}catch(e){b.disabled=false;$('#tbaplm').textContent='Could not apply: '+(e.message||e.code||'')}};
 const s=$('#tbaps');if(s)s.onclick=async()=>{s.disabled=true;await tbHitSend(tbAtk.t,tbAtk.hit);tbAtk.applied=true;const bb=$('#tbadb');if(bb)bb.disabled=true;$('#tbaplm').textContent='Sent. The GM will see it on the Tabletop.'};
 const d=$('#tbadb');if(d)d.onclick=tbAtkDmgBenny}
// after the wounds are on the target: offer to Soak them (spends a Benny of the target's)
function tbAtkSoakBtn(){const T=tbTok(tbAtk.t),oc=tbAtk.hit&&tbAtk.hit.oc;if(!T||!oc||!oc.nw||!tbWoundsOf(T))return;if(!(isOwner||tbShkMine(T)))return;const el=$('#tbaplm');if(!el)return;
 el.insertAdjacentHTML('afterend',` <button type="button" class="btn sm" id="tbasoak" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny and roll Vigor. Each success and raise takes back one wound from this hit.">🛡 Soak (${esc(tbBnTxt(T))})</button>`);
 $('#tbasoak').onclick=async e=>{const b=e.currentTarget;b.disabled=true;const msg=await tbSoak(tbAtk.t,oc.nw);$('#tbaplm').textContent=msg;const k=$('#tbasoak');if(k)k.remove()}}
function tbAtkDamage(){const C=tbAtkCalc(),res=tbAtk&&tbAtk.res;if(!C||!res||!res.ok)return;const A=C.A,T=tbTok(tbAtk.t),w=C.w;
 const D=tbAtkDmgDo(C,res);if(D.err){$('#tbar2').insertAdjacentHTML('beforeend',`<div class="warn">${esc(D.err)}</div>`);return}
 tbAtk.dmg=D;tbAtk.applied=false;tbAtkDmgShow();const ab=$('#tbabn');if(ab)ab.disabled=true;
 const ap=w.ap?` (AP ${w.ap} against armor ${C.T.arm||0})`:'';
 const body=D.list.length>1?D.list.map(x=>x.sum).join(', ')+' damage':D.list[0].sum+' damage';
 tbAtkFinish(`💥 **${tbName(A)}** hits **${tbName(T||{})}** with ${w.n}: ${body} vs Toughness ${D.eff}${ap} → ${D.oc.text}`,`${body} → ${D.oc.text}`,D.oc.none?false:null,tbAtk.t)}
async function tbAtkDmgBenny(){const C=tbAtkCalc(),old=tbAtk&&tbAtk.dmg,res=tbAtk&&tbAtk.res;if(!C||!old||!res||tbAtk.applied)return;const A=C.A,why=await tbBnSpend(A);if(why){$('#tbaplm').textContent=why;return}
 const D=tbAtkDmgDo(C,res);if(D.err){$('#tbaplm').textContent=D.err;return}const keep=D.total>=old.total?D:old;
 const note=`Benny reroll: new ${D.total} vs old ${old.total} → keeps ${keep.total}`;tbAtk.dmg=keep;tbAtkDmgShow(note);try{tbBar()}catch(e){}
 const T=tbTok(tbAtk.t);tbAtkFinish(`🔁 **${tbName(A)}** spends a Benny on the ${C.w.n} damage: new **${D.total}** vs old **${old.total}** → keeps **${keep.total}** vs Toughness ${keep.eff} → ${keep.oc.text}`,`Benny: ${keep.total} damage → ${keep.oc.text}`,keep.oc.none?false:null,tbAtk.t)}
// apply a hit to a token: a sheet gets wounds and statuses, a token with a health bar loses health, any other token gets a Stunned marker
async function tbApplyHit(tokId,hit){const T=tbTok(tokId);if(!T||!hit||hit.oc.none)return;const s=tbSheetOf(T),oc=hit.oc;
 if(T.vh&&!s&&typeof tbVhHit==='function'&&await tbVhHit(T,oc))return;
 if(s){const w0=+s.wounds||0,i0=s.inc?1:0,st0=(s.status||[]).slice();let w=w0+oc.nw,inc=i0,st=st0.slice(),wm=3;try{wm=shWM(s)}catch(e){}
  if(!st.includes('Shaken'))st.push('Shaken');if(w>wm){w=wm;if(!inc){inc=1}if(!st.includes('Incapacitated'))st.push('Incapacitated')}
  await db.doc('sheets/'+s.id).update({wounds:w,inc,status:st});
  undoBar(tbName(T)+': '+oc.text+'.',()=>db.doc('sheets/'+s.id).update({wounds:w0,inc:i0,status:st0}));return}
 await tbTokEdit([T],t=>{const o={},cnd=Array.isArray(t.cnd)?t.cnd.slice():[];if(!cnd.includes('stun')){cnd.push('stun');o.cnd=cnd}
  if(+t.mhp>0&&oc.nw){const hp=Math.max(0,(+t.hp||0)-oc.nw);o.hp=hp;if(hp<=0)o.mark='down'}else if(!(+t.mhp>0)&&oc.inc)o.mark='down';return o},'hit '+tbName(T));
 tbNote(tbName(T)+': '+oc.text)}
// a player's hit on a token they do not own: the GM sees it and can apply it
async function tbHitSend(tokId,hit){const m=tbCur();if(!m)return;const d={map:m.id,tok:tokId,hit:{dmg:hit.dmg,eff:hit.eff,w:hit.wname,oc:hit.oc},by:handle||'?',ts:Date.now()};
 try{await db.doc('tbping/h'+pid(uid||handle||'x')+Date.now().toString(36)).set(d)}catch(e){alert('Could not send: '+(e.message||e.code))}}
// the GM's list of hits waiting to be applied (stays until applied or dismissed)
function tbHitList(){const m=tbCur();if(!m)return [];return (pm.tbping||[]).filter(p=>p&&/^h/.test(String(p.id))&&!p.done&&p.map===m.id&&p.hit&&p.hit.oc&&Date.now()-(+p.ts||0)<36e5&&tbTok(p.tok))}
let tbHitGc={};
// the GM tidies away hits that were handled (or are over an hour old)
function tbHitSweep(){if(!isOwner)return;(pm.tbping||[]).forEach(p=>{if(!p||!/^h/.test(String(p.id))||tbHitGc[p.id])return;if(p.done||Date.now()-(+p.ts||0)>36e5){tbHitGc[p.id]=1;db.doc('tbping/'+p.id).delete().catch(()=>{})}})}
function tbHitChk(){tbHitSweep();let el=$('#tbhits');const L=isOwner&&$('#tbroot')?tbHitList():[];
 if(!L.length){if(el)el.remove();return}
 const sig=L.map(p=>p.id).join(',');if(!el){el=document.createElement('div');el.id='tbhits';document.body.appendChild(el)}if(el._s===sig)return;el._s=sig;
 el.innerHTML='<b>⚔ Hits waiting</b>'+L.map(p=>`<div class="tbhr"><span>${esc(p.by)}: <b>${esc(tbName(tbTok(p.tok)))}</b> takes ${esc(String(p.hit.dmg))} vs Toughness ${esc(String(p.hit.eff))} (${esc(p.hit.w||'')}) → ${esc(p.hit.oc.text)}</span><button class="btn sm grn" data-tbhit="a:${esc(p.id)}">Apply</button><button class="btn sm" data-tbhit="d:${esc(p.id)}">Dismiss</button></div>`).join('')}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-tbhit]');if(!b)return;const [a,id]=[b.dataset.tbhit.slice(0,1),b.dataset.tbhit.slice(2)],p=(pm.tbping||[]).find(x=>x&&x.id===id);if(!p)return;b.disabled=true;
 try{if(a==='a')await tbApplyHit(p.tok,{dmg:p.hit.dmg,eff:p.hit.eff,oc:p.hit.oc,wname:p.hit.w});await db.doc('tbping/'+id).update({done:1});p.done=1}catch(err){b.disabled=false;alert('Could not do that: '+(err.message||err.code||''))}tbHitChk()});
setInterval(()=>{try{tbHitChk()}catch(e){}},2500);
(function(){const st=document.createElement('style');st.id='tbatkcss';st.textContent=`.tbt.atkr{outline:3px solid #ffd60a;outline-offset:2px;box-shadow:0 0 16px #ffd60a;z-index:6}#tbview.tool-attack{cursor:crosshair}#tbhits{position:fixed;left:12px;bottom:12px;z-index:900;max-width:min(520px,calc(100vw - 24px));background:var(--panel,#10121c);border:2px solid #ff2d95;padding:8px 10px;font-size:calc(13px*var(--ts,1))}.tbhr{display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap}.tbhr span{flex:1;min-width:180px}`;document.head.appendChild(st)})();
// ---- Tabletop: Bennies, Soak, and recovering from Shaken at the start of a turn.
// Sheets keep their Bennies in the sheet (bn). A token without a sheet can carry a Benny count of its own (cs.bn); one without a count uses the GM's pool, untracked.
// Every roll uses the sheet's own rules (tbAs) when the token has a sheet, and a plain trait roll from the token's numbers when it does not.
const tbBnOf=t=>{const s=tbSheetOf(t);if(s)return Math.max(0,parseInt(s.bn)||0);const b=t&&t.cs?t.cs.bn:undefined;return(b===undefined||b===null||b==='')?null:Math.max(0,parseInt(b)||0)};
async function tbBnPut(t,n){n=Math.max(0,Math.min(99,n|0));const s=tbSheetOf(t);if(s){s.bn=String(n);await db.doc('sheets/'+s.id).update({bn:String(n)});return}await tbTokEdit([t],tk=>({cs:{...(tk.cs||{}),bn:n}}),'set Bennies')}
// spends one Benny. Returns '' when it worked, otherwise the reason it did not.
async function tbBnSpend(t){const n=tbBnOf(t);if(n===null)return isOwner?'':'Only the GM can spend Bennies for this token.';if(n<=0)return tbName(t)+' has no Bennies left.';await tbBnPut(t,n-1);return ''}
const tbBnTxt=t=>{const n=tbBnOf(t);return n===null?'GM Benny':n+' left'};
const tbBnCan=t=>{const n=tbBnOf(t);return n===null?isOwner:n>0};
// say it in the dice log, and on Discord if the person has that switched on for the Tabletop
async function tbSay(nm,plain,short,good,tokId){let p=true;try{p=localStorage.getItem('sr_tbdp')!=='0'}catch(e){}
 try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
 const m=tbCur();if(m){const d={map:m.id,tok:tokId,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}try{tbMarksDraw()}catch(e){}}}
// one roll of Vigor or Spirit for a token
function tbAttrRoll(t,key,title,tn){const s=tbSheetOf(t),cs=t.cs||{};
 if(s)return tbAs(s,S=>{coChk();shOpt.mod=0;shOpt.tn=tn;if(key==='spirit')shOpt.pen=true;const a=(S.at&&S.at[key])||{d:4,m:0},p=shPrep(+a.d||4,a.m,title,false,false,key==='vigor'?{at:key,free:1}:{at:key},[]),o={title:p.title,sides:p.sides,mod:p.m,tn,wild:p.wild,ws:p.ws||6},r=shRes(o);
  r.rs=r.ok?Math.floor((r.fin-tn)/4):0;r.crit=/Critical/.test(r.line);return r});
 return tbTraitRoll(title,+(key==='vigor'?cs.vi:cs.sp)||6,0,tn,!!cs.wc)}
const tbWoundsOf=t=>{const s=tbSheetOf(t);if(s)return (+s.wounds||0)+(s.inc?1:0);return +t.mhp>0?Math.max(0,(+t.mhp)-(t.hp==null?+t.mhp:+t.hp)):0};
// ---- Soak: spend a Benny, roll Vigor, each success and raise takes one wound back (never more than cap)
async function tbSoak(tokId,cap){const T=tbTok(tokId);if(!T)return 'That token is gone.';const s=tbSheetOf(T);
 if(!s&&!(+T.mhp>0))return 'This token has no health bar, so there is nothing to Soak. Set one on the token first.';
 if(!tbWoundsOf(T))return 'There are no wounds to Soak.';
 const why=await tbBnSpend(T);if(why)return why;
 const r=tbAttrRoll(T,'vigor','Soak (Vigor, Benny spent)',4),n=r.ok?1+(r.rs||0):0;let got=0,msg;
 if(s){const w0=+s.wounds||0,i0=s.inc?1:0,st0=(s.status||[]).slice();let WM=3;try{WM=shWM(s)}catch(e){}
  const raw0=i0?WM+1:w0;got=Math.min(n,raw0,cap==null?99:cap);const raw=raw0-got,w=Math.min(WM,raw),inc=raw>WM?1:0,st=inc?st0:st0.filter(x=>x!=='Incapacitated');
  if(got){s.wounds=w;s.inc=inc;s.status=st;await db.doc('sheets/'+s.id).update({wounds:w,inc,status:st})}
  const bn1=tbBnOf(T);
  undoBar(tbName(T)+(got?' soaks '+got+' wound'+(got>1?'s':''):': the Soak failed')+'.',async()=>{s.wounds=w0;s.inc=i0;s.status=st0;s.bn=String((bn1||0)+1);await db.doc('sheets/'+s.id).update({wounds:w0,inc:i0,status:st0,bn:String((bn1||0)+1)});try{tbBar()}catch(e){}})}
 else{const hp0=t0=>t0.hp==null?+t0.mhp:+t0.hp,h0=hp0(T),m0=T.mark||'',bn0=tbBnOf(T);got=Math.min(n,(+T.mhp)-h0,cap==null?99:cap);
  if(got)await tbTokEdit([T],t=>{const o={hp:h0+got};if(t.mark==='down')o.mark='';return o},'soak');
  undoBar(tbName(T)+(got?' soaks '+got+' wound'+(got>1?'s':''):': the Soak failed')+'.',async()=>{const k=tbTok(tokId);if(!k)return;await tbTokEdit([k],t=>{const o={hp:h0,mark:m0};if(bn0!==null)o.cs={...(t.cs||{}),bn:bn0};return o},'undo soak')})}
 msg=r.line+(got?' Soaks '+got+' wound'+(got>1?'s':'')+'.':' No wounds soaked.');
 const plain=r.plain+(got?' | Soaks '+got+' wound'+(got>1?'s':''):' | Soak failed');
 await tbSay(tbName(T),'🛡 '+plain,(got?'Soaks '+got:'Soak failed'),got>0,tokId);
 try{tbBar()}catch(e){}
 return msg}
// ---- Shaken: roll Spirit (or spend a Benny) to shake it off
const tbShaken=t=>{const s=tbSheetOf(t);return s?(s.status||[]).includes('Shaken'):(Array.isArray(t.cnd)?t.cnd:[]).includes('stun')};
async function tbShakeClear(t){const s=tbSheetOf(t);
 if(s){const st=(s.status||[]).filter(x=>x!=='Shaken');s.status=st;await db.doc('sheets/'+s.id).update({status:st});return}
 await tbTokEdit([t],tk=>({cnd:(Array.isArray(tk.cnd)?tk.cnd:[]).filter(x=>x!=='stun')}),'recover from Shaken')}
async function tbShakeGo(tokId,mode){const T=tbTok(tokId);if(!T)return 'That token is gone.';if(!tbShaken(T))return tbName(T)+' is not Shaken.';let msg,plain,good;
 if(mode==='b'){const why=await tbBnSpend(T);if(why)return why;await tbShakeClear(T);msg=tbName(T)+' spends a Benny and is no longer Shaken.';plain='😵‍💫 **'+tbName(T)+'** spends a Benny to recover from Shaken.';good=true}
 else{const r=tbAttrRoll(T,'spirit','Recover from Shaken (Spirit)',4);good=r.ok;
  if(r.ok){await tbShakeClear(T);msg=r.line+' '+tbName(T)+' is no longer Shaken and can act normally.'}else msg=r.line+' '+tbName(T)+' is still Shaken: only moving and free actions this turn.';
  plain='😵‍💫 '+r.plain+(r.ok?' | No longer Shaken':' | Still Shaken')}
 await tbSay(tbName(T),plain,good?'Recovers from Shaken':'Still Shaken',good,tokId);try{tbBar()}catch(e){}return msg}
const tbShkMine=t=>{if(!t)return false;const s=tbSheetOf(t);if(s)return s.uid===uid||(isOwner&&!s.uid);return isOwner||tbCanRm(t)};
let tbShk=null,tbShkSeen='';
function tbShakeOffer(sig){const m=tbCur(),c=typeof tbIniCur==='function'?tbIniCur():null;if(!m||!c||!sig)return;const t=tbTokForIni(c,m);if(!t||!tbShkMine(t)||!tbShaken(t))return;
 const k=sig+'|'+t.id;if(tbShkSeen===k)return;tbShkSeen=k;tbShk={tok:t.id,msg:''};tbShkDraw()}
function tbShkDraw(){let el=$('#tbshk');if(!tbShk||!$('#tbroot')){if(el)el.remove();return}const T=tbTok(tbShk.tok);if(!T){tbShk=null;if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='tbshk';document.body.appendChild(el)}
 const still=tbShaken(T),bn=tbBnCan(T);
 el.innerHTML=`<b>😵 ${esc(tbName(T))} ${still?'is Shaken':'shook it off'}</b>${still?`<div class="meta">It is their turn. Roll Spirit (target 4) to recover, or spend a Benny to recover right away.</div>`:''}${tbShk.msg?`<div style="margin:4px 0">${esc(tbShk.msg)}</div>`:''}
 <div class="tbvb">${still?`<button class="btn sm grn" data-tbshk="r">🎲 Roll Spirit</button>${bn?`<button class="btn sm" data-tbshk="b">🎟 Use a Benny (${esc(tbBnTxt(T))})</button>`:''}`:''}<button class="btn sm" data-tbshk="x">${still?'Not now':'Close'}</button></div>`}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-tbshk]');if(!b||!tbShk)return;const a=b.dataset.tbshk;
 if(a==='x'){tbShk=null;tbShkDraw();return}b.disabled=true;
 try{tbShk.msg=await tbShakeGo(tbShk.tok,a)}catch(err){tbShk.msg='Could not do that: '+(err.message||err.code||'')}
 tbShkDraw();const T=tbTok(tbShk&&tbShk.tok);if(T&&!tbShaken(T)){const k=tbShk;setTimeout(()=>{if(tbShk===k){tbShk=null;tbShkDraw()}},7000)}});
setInterval(()=>{try{if(!$('#tbroot')){if(tbShk){tbShk=null;tbShkDraw()}return}if(tbShk)tbShkDraw()}catch(e){}},2000);
// ---- the token panel: Bennies, Soak, recover from Shaken
TBX.bnadj=(x,m,t)=>{const L=tbSelToks();if(L.length!==1)return;const T=L[0],n=tbBnOf(T),d=+x||0;if(d>0&&!isOwner&&!tbSheetOf(T))return;tbBnPut(T,(n==null?0:n)+d).then(()=>{try{tbBar()}catch(e){}}).catch(err=>alert('Could not change Bennies: '+(err.message||err.code||'')))};
TBX.bntrack=()=>{const L=tbSelToks();if(L.length!==1||!isOwner)return;tbBnPut(L[0],2).then(()=>{try{tbBar()}catch(e){}})};
TBX.soak=async()=>{const L=tbSelToks();if(L.length!==1)return;const msg=await tbSoak(L[0].id);tbNote(msg)};
TBX.shake=async(x)=>{const L=tbSelToks();if(L.length!==1)return;const msg=await tbShakeGo(L[0].id,x==='b'?'b':'r');tbNote(msg)};
function tbFightPanel(L){if(!L||L.length!==1)return '';const T=L[0];if(!(isOwner||tbCanRm(T)||tbShkMine(T)))return '';const s=tbSheetOf(T),bn=tbBnOf(T);
 if(T.kind==='prop'||T.kind==='item')return '';
 const w=tbWoundsOf(T),shk=tbShaken(T),bits=[];
 bits.push(bn===null?(isOwner?`<span class="meta">Bennies: GM pool</span> <button class="btn sm" data-tbx="bntrack" title="Give this token a Benny count of its own (2 to start)">Track</button>`:''):`<span>🎟 Bennies <b>${bn}</b></span> <button class="btn sm" data-tbx="bnadj:-1" ${bn?'':'disabled'} title="Spend one">−</button><button class="btn sm" data-tbx="bnadj:1" ${isOwner||s?'':'disabled'} title="Add one">+</button>`);
 const btns=[];if(shk)btns.push(`<button class="btn sm grn" data-tbx="shake:r" title="Roll Spirit, target 4. Success removes Shaken.">😵 Recover from Shaken</button><button class="btn sm" data-tbx="shake:b" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny: no longer Shaken right away">Benny</button>`);
 if(w&&(s||+T.mhp>0))btns.push(`<button class="btn sm" data-tbx="soak" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny and roll Vigor. Each success and raise takes back one wound.">🛡 Soak</button>`);
 return `<div class="tbcw"><div class="tbvb">${bits.join('')}</div>${btns.length?`<div class="tbvb">${btns.join('')}</div>`:''}</div>`}
(function(){const st=document.createElement('style');st.id='tbfightcss';st.textContent=`#tbshk{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:900;max-width:min(520px,calc(100vw - 24px));background:var(--panel,#10121c);border:2px solid var(--am,#ffb000);padding:8px 12px;font-size:calc(13px*var(--ts,1))}`;document.head.appendChild(st)})();
// ---- Tabletop: enemy archetype library (Savage Worlds stat blocks with a Shadowrun flavour) and the stat block panel.
// A stat block is the token's cs: {par,tg,ar,fi,sh,st,vi,sp,wc,bn,nt,w:[weapons]} plus its health bar (mhp wound levels).
// Extras go out of action on the first wound (1 level). Wild Cards have 4 levels: the 4th wound is Incapacitated.
// Parry = 2 + half Fighting. Toughness = 2 + half Vigor + armor + Size. Both are worked out here and can be edited on the token afterwards.
const TB_ARW={
 knife:['Knife','','Str+d4',0,'Fighting',''],club:['Club','','Str+d4',0,'Fighting',''],bat:['Bat','','Str+d4',0,'Fighting',''],machete:['Machete','','Str+d6',0,'Fighting',''],
 fists:['Fists','','Str',0,'Fighting',''],baton:['Stun baton','','Str+d6',0,'Fighting',''],katana:['Katana','','Str+d8',0,'Fighting',''],mono:['Monosword','','Str+d8+2',4,'Fighting',''],
 bigclub:['Big club','','Str+d8',0,'Fighting',''],claws:['Claws','','Str+d6',0,'Fighting',''],bite:['Bite','','Str+d4',0,'Fighting',''],bitebig:['Bite','','Str+d6',0,'Fighting',''],
 lpistol:['Light pistol','10/20/40','2d6',0,'Shooting',1],pistol:['Pistol','12/24/48','2d6',1,'Shooting',1],hpistol:['Heavy pistol','12/24/48','2d6+1',2,'Shooting',1],
 smg:['SMG','12/24/48','2d6',0,'Shooting',3],rifle:['Assault rifle','24/48/96','2d8',2,'Shooting',3],shotgun:['Shotgun (3d6 close, less far)','12/24/48','3d6',0,'Shooting',1],
 sniper:['Sniper rifle','50/100/200','2d10',2,'Shooting',1],hmg:['Heavy machine gun','30/60/120','2d10',2,'Shooting',3],frag:['Frag grenade','5/10/20','3d6',0,'Throwing',1],
 bolt:['Bolt (spell)','12/24/48','2d6',0,'Shooting',1],flame:['Flame breath','3/6/12','2d6',0,'Shooting',1]};
// k key, n name, g group, e emoji, fi/sh/st/vi/sp dice, ar armor (inside Toughness), wc Wild Card, w weapons, sz token size, size = Size (Toughness bonus), pb Parry bonus, tb extra Toughness, bn Bennies, sd spell die (the Shooting die for spell weapons), t notes
const TB_ARCH=[
 {k:'ganger',n:'Ganger',g:'Street',e:'🧢',fi:6,sh:6,st:6,vi:6,sp:6,ar:1,w:['pistol','knife'],t:'Gang colours, lined coat. Runs when the boss goes down (Spirit roll).'},
 {k:'hallow',n:'Halloweener',g:'Street',e:'🎃',fi:8,sh:6,st:6,vi:6,sp:6,ar:1,w:['machete','pistol'],t:'Brutal and loud. Likes the close work.'},
 {k:'orkgang',n:'Ork ganger',g:'Street',e:'🐗',fi:6,sh:6,st:8,vi:8,sp:6,ar:1,w:['club','shotgun'],t:'Big, tough and in a gang. Hits hard in the hall.'},
 {k:'thug',n:'Thug',g:'Street',e:'👊',fi:6,sh:4,st:6,vi:6,sp:6,ar:0,w:['club','knife'],t:'Muscle for hire. No armor.'},
 {k:'junkie',n:'Strung-out junkie',g:'Street',e:'💉',fi:6,sh:4,st:6,vi:6,sp:4,ar:0,w:['knife'],t:'Desperate and unpredictable. Panics at the first wound.'},
 {k:'scav',n:'Squatter sniper',g:'Street',e:'🏚️',fi:4,sh:8,st:6,vi:6,sp:6,ar:1,w:['rifle'],t:'Knows the building. Likes high windows.'},
 {k:'guard',n:'Corp security guard',g:'Corporate',e:'🛡️',fi:6,sh:8,st:6,vi:6,sp:6,ar:2,w:['pistol','baton'],t:'Armored vest. Calls for backup on the first shot.'},
 {k:'resp',n:'Corp response team',g:'Corporate',e:'🪖',fi:8,sh:8,st:8,vi:8,sp:8,ar:4,w:['rifle','pistol'],t:'Full body armor, trained, in squads. Arrives a few rounds after the alarm.'},
 {k:'capt',n:'Corp security captain',g:'Corporate',e:'🎖️',wc:1,fi:8,sh:10,st:6,vi:8,sp:8,ar:3,bn:2,w:['hpistol','smg'],t:'Edges: Level Headed, Marksman. Directs the guards.'},
 {k:'agent',n:'Corp agent',g:'Corporate',e:'🕴️',wc:1,fi:8,sh:10,st:6,vi:6,sp:8,ar:2,bn:2,w:['hpistol'],t:'Edges: Quick, Marksman. Cool, well paid and well informed.'},
 {k:'suit',n:'Corp suit (VIP)',g:'Corporate',e:'💼',fi:4,sh:4,st:4,vi:6,sp:6,ar:1,w:[],t:'A target, not a fighter. Hides behind the guards.'},
 {k:'cop',n:'Lone Star patrol officer',g:'Law',e:'👮',fi:6,sh:6,st:6,vi:6,sp:6,ar:2,w:['pistol','baton'],t:'Patrol vest. Backup is a few minutes away.'},
 {k:'swat',n:'Lone Star SWAT',g:'Law',e:'🚔',fi:6,sh:8,st:8,vi:8,sp:8,ar:4,w:['rifle','pistol','frag'],t:'Heavy armor, breach and clear. Flash-bangs on the way in.'},
 {k:'lt',n:'Lone Star lieutenant',g:'Law',e:'⭐',wc:1,fi:8,sh:8,st:6,vi:8,sp:8,ar:3,bn:2,w:['hpistol','smg'],t:'Edges: Level Headed, Command. Calls in the SWAT team.'},
 {k:'yaku',n:'Yakuza enforcer',g:'Crime',e:'🐉',fi:8,sh:8,st:8,vi:6,sp:8,ar:2,w:['katana','pistol'],t:'Never takes a step back. Loyal to the oyabun.'},
 {k:'yaklt',n:'Yakuza lieutenant',g:'Crime',e:'🎴',wc:1,fi:10,sh:8,st:8,vi:8,sp:8,ar:2,bn:2,w:['katana','hpistol'],t:'Edges: Block, Trademark Weapon. Calm until it is not.'},
 {k:'mafia',n:'Mafia soldier',g:'Crime',e:'🧥',fi:6,sh:8,st:6,vi:6,sp:6,ar:2,w:['pistol','smg'],t:'Armored long coat.'},
 {k:'body',n:'Bodyguard',g:'Crime',e:'🕶️',fi:8,sh:8,st:8,vi:8,sp:8,ar:3,w:['hpistol','fists'],t:'Hard to shoot past. Takes the hit for the boss (Interpose).'},
 {k:'bount',n:'Bounty hunter',g:'Crime',e:'🎯',wc:1,fi:8,sh:10,st:8,vi:8,sp:8,ar:2,bn:2,w:['hpistol','shotgun'],t:'Edges: Marksman, Trademark Weapon. Wants you alive or paid.'},
 {k:'snip',n:'Sniper',g:'Crime',e:'🔭',fi:4,sh:10,st:6,vi:6,sp:8,ar:1,w:['sniper','pistol'],t:'Patient. Called shots to the head at long range.'},
 {k:'sam',n:'Street samurai',g:'Shadowrunners',e:'🥷',wc:1,fi:10,sh:10,st:8,vi:8,sp:8,ar:4,bn:2,w:['mono','smg'],t:'Cyberware: reflex boosters (Quick), smartlink (+1 to hit with a linked gun), dermal plating. Edges: Quick, Frenzy.'},
 {k:'merc',n:'Mercenary',g:'Shadowrunners',e:'💂',fi:8,sh:8,st:8,vi:8,sp:8,ar:3,w:['rifle','pistol','knife'],t:'Seen it before. Fights in pairs.'},
 {k:'runner',n:'Shadowrunner (generic)',g:'Shadowrunners',e:'🕵️',wc:1,fi:8,sh:8,st:6,vi:8,sp:8,ar:2,bn:2,w:['pistol','smg'],t:'A rival team member. Change the numbers to fit the job.'},
 {k:'decker',n:'Decker',g:'Shadowrunners',e:'💻',wc:1,fi:4,sh:6,st:4,vi:6,sp:8,ar:1,bn:2,w:['lpistol'],t:'Hacking d10 on the Net. Stays behind the team and avoids a fair fight.'},
 {k:'rigger',n:'Rigger',g:'Shadowrunners',e:'🚗',wc:1,fi:4,sh:6,st:6,vi:6,sp:6,ar:1,bn:2,w:['pistol'],t:'Piloting d10. Usually in a vehicle or behind drones: add them from the Vehicles list.'},
 {k:'adept',n:'Physical adept',g:'Magic',e:'🥋',wc:1,fi:10,sh:6,st:8,vi:8,sp:8,ar:1,bn:2,pb:1,w:['fists','katana'],t:'Magic in the body: Parry +1 (improved reflexes). Fast and hard to pin down.'},
 {k:'mage',n:'Mage',g:'Magic',e:'🧙',wc:1,fi:4,sh:6,st:4,vi:6,sp:10,ar:0,bn:2,sd:10,w:['bolt','lpistol'],t:'Spellcasting d10 (used for the Bolt attack). Other spells are up to the GM: Stun, Barrier, Healing.'},
 {k:'shaman',n:'Shaman',g:'Magic',e:'🦅',wc:1,fi:4,sh:6,st:4,vi:6,sp:10,ar:0,bn:2,sd:10,w:['bolt','knife'],t:'Spellcasting d10 and a spirit ally: add a Spirit from this list next to the shaman.'},
 {k:'spirit',n:'Spirit (Force 3)',g:'Magic',e:'👻',fi:8,sh:4,st:8,vi:8,sp:8,ar:2,w:['claws'],t:'Spirits are hard to hurt with ordinary weapons (GM call: halve their damage). Gone when the summoner falls.'},
 {k:'insect',n:'Insect spirit',g:'Magic',e:'🪲',fi:8,sh:4,st:8,vi:8,sp:6,ar:2,w:['bitebig'],t:'Hive creature. More arrive until the nest is destroyed.'},
 {k:'dog',n:'Guard dog',g:'Creatures',e:'🐕',fi:6,sh:4,st:6,vi:6,sp:6,ar:0,w:['bite'],t:'Pace 8 (running die d10). Barks first.'},
 {k:'hound',n:'Hellhound',g:'Creatures',e:'🔥',fi:8,sh:8,st:10,vi:8,sp:8,ar:1,size:1,w:['bitebig','flame'],t:'Size 1. Flame breath burns (cone, GM call). Immune to fire.'},
 {k:'rat',n:'Devil rat',g:'Creatures',e:'🐀',fi:6,sh:4,st:4,vi:4,sp:6,ar:0,size:-2,sz:.5,w:['bite'],t:'Size −2. Comes in swarms. Disease on a bite (GM call).'},
 {k:'ghoul',n:'Ghoul',g:'Creatures',e:'🧟',fi:8,sh:4,st:8,vi:8,sp:6,ar:0,w:['claws'],t:'A bite can spread disease. Hungry, not bright.'},
 {k:'troll',n:'Troll bouncer',g:'Creatures',e:'👹',fi:8,sh:4,st:12,vi:10,sp:6,ar:2,size:2,w:['bigclub','fists'],t:'Size 2, dermal armor. Reach 1. Throws people out of the club.'},
 {k:'sdrone',n:'Security drone',g:'Drones',e:'🤖',fi:0,sh:8,st:6,vi:6,sp:6,ar:3,size:-1,w:['smg'],t:'A robot: no Fighting, so Parry 2. Immune to Shaken effects of poison and fear (GM call). Pace 8, flies.'},
 {k:'sentry',n:'Sentry gun',g:'Drones',e:'🔫',fi:0,sh:8,st:6,vi:8,sp:6,ar:6,size:1,w:['hmg'],t:'Does not move. Wrecked at the first wound. Can be hacked or shot at its motor.'},
 {k:'civ',n:'Bystander',g:'Other',e:'🧍',fi:4,sh:4,st:4,vi:6,sp:6,ar:0,w:[],t:'Just here for a drink. Runs or hides.'}];
const TB_ARG=['Street','Corporate','Law','Crime','Shadowrunners','Magic','Creatures','Drones','Other'];
function tbArchBuild(a){const D=(v)=>+v||0,fi=D(a.fi),vi=D(a.vi),ar=D(a.ar),par=2+(fi?fi/2:0)+D(a.pb),tg=2+vi/2+ar+D(a.size)+D(a.tb),
  w=(a.w||[]).map(k=>TB_ARW[k]).filter(Boolean).map(x=>({n:x[0],rng:x[1],dmg:x[2],ap:x[3],sk:x[4],rof:x[5]?String(x[5]):'',...(/spell/i.test(x[0])&&a.sd?{d:a.sd}:{})}));
 return {cs:{par:Math.floor(par),tg:Math.floor(tg),ar,fi,sh:D(a.sh),st:D(a.st),vi,sp:D(a.sp),wc:!!a.wc,bn:a.bn!=null?D(a.bn):undefined,nt:a.t||'',ak:a.k,w},mhp:a.wc?4:1}}
// pictures the GM chose for an archetype, kept in one shared doc so every new token of that type uses them
const tbArPics=()=>{const d=(pm.tbmeta||[]).find(x=>x&&x.id==='archpics'),o={};if(d&&d.pics&&typeof d.pics==='object')for(const k in d.pics)if(tbOk(d.pics[k]))o[k]=d.pics[k];return o};
async function tbArPicSet(k,img){const pics={...tbArPics()};if(img&&tbOk(img))pics[k]=img;else delete pics[k];const d=(pm.tbmeta||[]).find(x=>x&&x.id==='archpics');if(d)d.pics=pics;else(pm.tbmeta=pm.tbmeta||[]).push({id:'archpics',pics});
 await db.doc('tbmeta/archpics').set({pics,ts:Date.now(),by:handle||'GM'})}
let tbArQ='',tbArG='',tbArN=1,tbArT=true;
function tbArchBody(el,m){const q=tbArQ.trim().toLowerCase(),L=TB_ARCH.filter(a=>(!tbArG||a.g===tbArG)&&(!q||(a.n+' '+a.g+' '+a.t).toLowerCase().includes(q)));
 const pics=tbArPics(),row=a=>{const b=tbArchBuild(a),c=b.cs,pc=pics[a.k];return `<a class="row tbpr" data-tbar="${esc(a.k)}">${pc?`<img src="/_blob/${esc(pc)}" alt="">`:`<span class="tbpi">${esc(a.e)}</span>`}<div style="flex:1;min-width:0"><div class="t">${esc(a.n)} <span class="meta">${a.wc?'Wild Card':'Extra'}</span></div>
  <div class="meta">Parry ${c.par} · Toughness ${c.tg}${c.ar?' ('+c.ar+' armor)':''} · ${c.w.length?esc(c.w.map(x=>x.n.replace(/ \(.*/,'')).join(', ')):'unarmed'}</div></div><button type="button" class="btn sm" data-tbarp="${esc(a.k)}" title="${pc?'Change the picture for this archetype':'Choose a picture for this archetype: new tokens will use it'}">🖼</button>${pc?`<button type="button" class="btn sm mg" data-tbarx="${esc(a.k)}" title="Go back to the emoji">✕</button>`:''}<span class="btn sm">Add</span></a>`};
 el.innerHTML=`<div class="hint" style="margin:0 0 8px">Click one to drop it on the map with its Parry, Toughness, armor, weapons and health filled in. The numbers are the usual Savage Worlds values for that kind of opponent: change them on the token afterwards, or from the attack window.</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:6px"><div style="flex:1;min-width:150px"><input id="tbarq" placeholder="Search archetypes…" value="${esc(tbArQ)}"></div><div style="width:84px"><label>HOW MANY</label><input type="number" id="tbarn" min="1" max="20" value="${tbArN}"></div><label class="tbck"><input type="checkbox" id="tbart" ${tbArT?'checked':''}> Temporary</label></div>
 <div class="tbvb" style="margin-bottom:6px;flex-wrap:wrap"><button class="btn sm ${tbArG?'':'on'}" data-tbarg="">All (${TB_ARCH.length})</button>${TB_ARG.map(g=>`<button class="btn sm ${tbArG===g?'on':''}" data-tbarg="${esc(g)}">${esc(g)}</button>`).join('')}</div>
 <input type="file" id="tbarpf" accept="image/*" hidden><div id="tbarlist">${L.length?L.map(row).join(''):'<div class="empty">// NOTHING MATCHES.</div>'}</div>`;
 const i=$("#tbarq");if(i)i.oninput=()=>{tbArQ=i.value;const p=i.selectionStart;tbArchBody(el,m);const j=$('#tbarq');if(j){j.focus();try{j.setSelectionRange(p,p)}catch(e){}}};
 const nI=$('#tbarn');if(nI)nI.onchange=()=>{tbArN=Math.max(1,Math.min(20,parseInt(nI.value)||1))};const tI=$('#tbart');if(tI)tI.onchange=()=>{tbArT=tI.checked};
 el.querySelectorAll('[data-tbarg]').forEach(b=>b.onclick=()=>{tbArG=b.dataset.tbarg;tbArchBody(el,m)});
 let picFor='';const pf=$('#tbarpf');
 el.querySelectorAll('[data-tbarp]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();ev.preventDefault();picFor=b.dataset.tbarp;if(pf)pf.click()});
 el.querySelectorAll('[data-tbarx]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();ev.preventDefault();try{await tbArPicSet(b.dataset.tbarx,'');tbArchBody(el,m)}catch(e){alert('Could not save: '+(e.message||e.code))}});
 if(pf)pf.onchange=async()=>{const file=pf.files&&pf.files[0];pf.value='';if(!file||!picFor)return;if(!assets)return alert('Uploading is not available right now.');
  try{const sh=await tbShrink(file,320,.85),up=await assets.upload(sh.blob);await tbArPicSet(picFor,up.id);tbArchBody(el,m)}catch(e){alert('Upload failed: '+(e.message||e.code))}};
 el.querySelectorAll('[data-tbar]').forEach(a=>a.onclick=async()=>{const A=TB_ARCH.find(x=>x.k===a.dataset.tbar);if(!A)return;const n=Math.max(1,Math.min(20,parseInt(($('#tbarn')||{}).value)||1)),temp=!!($('#tbart')||{}).checked;tbArN=n;tbArT=temp;
  try{const id=await tbArchDrop(m,A,n,temp);tbSel=id;tbPOk('Added '+(n>1?n+' × ':'')+A.n+'.')}catch(e){alert('Could not add: '+(e.message||e.code))}})}
// puts n of them on the map (numbered when there is more than one, or one already there)
async function tbArchDrop(m,A,n,temp){const b=tbArchBuild(A),base=A.n,exists=tbToks(m).some(t=>t.name===base||new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\d+$','i').test(t.name||''));
 let k=n>1||exists?tbNextNum(m,base):0,last='';
 const pic=tbArPics()[A.k]||'';
 for(let i=0;i<n;i++)last=await tbAddTok(m,{kind:'enemy',name:k?base+' '+(k+i):base,emoji:A.e,img:pic,sz:A.sz||1,temp,cs:b.cs,mhp:b.mhp,hp:b.mhp});
 return last}
// ---- the stat block on the token panel (GM only): what the token knows, and a form to change it
function tbStatLine(t){const c=t.cs||{};if(!(c.par||c.tg||(c.w||[]).length))return '';const d=k=>+c[k]?'d'+c[k]:'—';
 return `Parry <b>${+c.par||0}</b> · Toughness <b>${+c.tg||0}</b>${+c.ar?' ('+c.ar+' armor)':''} · Fighting ${d('fi')} · Shooting ${d('sh')} · Str ${d('st')} · Vigor ${d('vi')} · Spirit ${d('sp')}${c.wc?' · <b>Wild Card</b>':' · Extra'}${+t.mhp>0?' · health '+(t.hp==null?t.mhp:t.hp)+'/'+t.mhp:''}`}
function tbStatPanel(L){if(!isOwner||!L||L.length!==1)return '';const t=L[0];if(t.sheet||t.kind==='pc'||t.kind==='prop'||t.kind==='item')return '';const c=t.cs||{},ln=tbStatLine(t);
 return `<div class="tbcw"><div class="meta">STAT BLOCK <span style="color:var(--dim)">(only you see this)</span></div>${ln?`<div style="font-size:calc(12.5px*var(--ts,1));margin:3px 0">${ln}</div>`:'<div class="meta">No numbers yet. Add them so attacks against and from this token fill themselves in.</div>'}
  ${(c.w||[]).length?`<div class="meta">${c.w.map(w=>esc(w.n)+' '+(w.rng?esc(w.rng)+' ':'')+esc(w.dmg||'')+(+w.ap?' AP'+(+w.ap):'')+(+w.rof>1?' ROF'+(+w.rof):'')).join(' · ')}</div>`:''}${c.nt?`<div class="meta" style="margin-top:3px">${esc(c.nt)}</div>`:''}
  <div class="tbvb"><button class="btn sm" data-tbx="statedit">✏ ${ln?'Edit':'Add'} stat block</button></div></div>`}
TBX.statedit=()=>{const L=tbSelToks();if(L.length!==1||!isOwner)return;tbStatForm(L[0])};
function tbStatForm(t){const c=t.cs||{},w=(c.w||[]).slice(0,5);while(w.length<3)w.push({});
 const dsel=(id,v)=>`<select id="${id}"><option value="0">—</option>${[4,6,8,10,12].map(n=>`<option value="${n}" ${+v===n?'selected':''}>d${n}</option>`).join('')}</select>`,num=(id,v,lo,hi,wd)=>`<input type="number" id="${id}" value="${v==null?'':v}" min="${lo}" max="${hi}" style="width:${wd||70}px">`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbstf"><h2>✏ STAT BLOCK: ${esc(tbName(t))}</h2><div class="hint">These numbers fill in the attack window when this token attacks or is attacked. Toughness already includes the armor.</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>PARRY</label>${num('tbsp',c.par,0,30)}</div><div><label>TOUGHNESS</label>${num('tbst',c.tg,0,40)}</div><div><label>ARMOR (IN TOUGHNESS)</label>${num('tbsa',c.ar,0,30,90)}</div><div><label>HEALTH LEVELS</label>${num('tbsh',t.mhp,0,20,80)}</div><div><label>BENNIES</label>${num('tbsb',c.bn,0,20,70)}</div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>FIGHTING</label>${dsel('tbsfi',c.fi)}</div><div><label>SHOOTING</label>${dsel('tbssh',c.sh)}</div><div><label>STRENGTH</label>${dsel('tbsstr',c.st)}</div><div><label>VIGOR</label>${dsel('tbsvi',c.vi)}</div><div><label>SPIRIT</label>${dsel('tbssp',c.sp)}</div></div>
 <label class="tbck" style="margin:6px 0"><input type="checkbox" id="tbswc" ${c.wc?'checked':''}> Wild Card (rolls a Wild Die, 4 health levels)</label>
 <h3 style="margin:8px 0 2px;font-size:calc(14px*var(--ts,1))">WEAPONS</h3>${w.map((x,i)=>`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"><input data-w="n${i}" placeholder="Name" maxlength="40" value="${esc(x.n||'')}" style="flex:2;min-width:110px"><input data-w="r${i}" placeholder="Range 12/24/48" maxlength="20" value="${esc(x.rng||'')}" style="width:110px"><input data-w="d${i}" placeholder="Damage 2d6" maxlength="20" value="${esc(x.dmg||'')}" style="width:90px"><input data-w="a${i}" type="number" placeholder="AP" min="0" max="20" value="${+x.ap||''}" style="width:56px"><input data-w="f${i}" type="number" placeholder="ROF" min="1" max="12" value="${+x.rof||''}" style="width:56px"><select data-w="s${i}">${['Shooting','Fighting','Throwing','Athletics'].map(s=>`<option ${(x.sk||(x.rng?'Shooting':'Fighting'))===s?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')}
 <div class="meta">Leave the range empty for a melee weapon. Damage can be Str+d6 or 2d6+1.</div>
 <label style="margin-top:6px">NOTES</label><textarea id="tbsn" maxlength="300" rows="2">${esc(c.nt||'')}</textarea>
 <div style="margin-top:10px"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;
 $('#tbstf').onsubmit=async ev=>{ev.preventDefault();const g=id=>+($('#'+id)||{}).value||0,W=[0,1,2,3,4].map(i=>{const q=k=>($('[data-w="'+k+i+'"]')||{}).value||'';return {n:q('n').trim(),rng:q('r').trim(),dmg:q('d').trim(),ap:+q('a')||0,rof:q('f')?String(+q('f')||''):'',sk:q('s')||'Shooting'}}).filter(x=>x.n||x.dmg);
  const mhp=Math.max(0,Math.min(20,g('tbsh'))),cs=tbCsClean({...(t.cs||{}),par:g('tbsp'),tg:g('tbst'),ar:g('tbsa'),fi:g('tbsfi'),sh:g('tbssh'),st:g('tbsstr'),vi:g('tbsvi'),sp:g('tbssp'),wc:$('#tbswc').checked,bn:$('#tbsb').value===''?undefined:g('tbsb'),nt:$('#tbsn').value,w:W});
  closeM();await tbTokEdit([t],tk=>{const o={cs};const old=+tk.mhp||0;if(mhp!==old){const cur=tk.hp==null?old:+tk.hp;o.mhp=mhp;o.hp=Math.max(0,Math.min(mhp,cur+(mhp-old)))}return o},'edit the stat block')}}
// ---- Tabletop: drone and vehicle tokens, the line from a drone to its rigger, and the chase tracker.
// Drones are the drone sheets from the Drones section. A player can put their own on the map; the GM can put any.
// A vehicle token is linked to a vehicle in its owner's gear (token field vh = {s: sheet id, i: item id}); its damage lives on the owner's sheet (sheet.veh), so the sheet and the map always agree.
// The chase tracker (GM) keeps a list of tokens in order with the gap between each one and the one ahead. It is stored in tbmeta/chase and everyone can see it.
TB_K.vehicle=['Vehicle','#ff9f1c'];
const TB_GAP=[['Close','#ff3b3b'],['Short','#ff9f1c'],['Medium','#ffd60a'],['Long','#39ff14'],['Extreme','#4ad8ff']];
const tbShById=id=>id?(pm.sheets||[]).find(s=>s&&s.id===id&&!s.deleted)||null:null;
const tbMineSh=s=>!!s&&(isOwner||(!!uid&&s.uid===uid));
// ---- vehicles
function tbVhOf(t){if(!t||!t.vh||!t.vh.s||!t.vh.i)return null;const sheet=tbShById(t.vh.s);if(!sheet)return null;
 const it=invOf(sheet.handle||sheet.name).find(x=>x.id===t.vh.i&&x.cat==='Vehicles');if(!it)return null;
 const v=(sheet.veh&&sheet.veh[it.id])||{},st={w:Math.max(0,Math.min(4,+v.w||0)),wr:!!v.wr,h:v.h===''||v.h==null?null:+v.h,sk:v.sk||'',n:v.n||''};
 return {sheet,it,s:vhStats(it),st}}
const tbVhMine=t=>{const v=tbVhOf(t);return !!v&&tbMineSh(v.sheet)};
function tbVhSize(s){const n=parseInt(s&&s.size,10);return isNaN(n)?2:n<=2?1:n<=5?2:n<=8?3:4}
function tbVhEmoji(it){const t=(it.name||'')+' '+(it.sub||'');if(/bike|cycle|scooter|moped/i.test(t))return '🏍️';if(/truck|van|lorry|bus\b/i.test(t))return '🚚';const k=vhSkill(it);return k==='Piloting'?'🚁':k==='Boating'?'🚤':'🚗'}
// the numbers an attack window needs for a vehicle target: Toughness like "12 (4)" means 12 with 4 of armor
function tbVhTarget(t){const v=tbVhOf(t);if(!v)return null;const tg=String(v.s.tough||''),m=tg.match(/(\d+)(?:\s*\((\d+)\))?/);return {parry:4,tough:m?+m[1]:0,arm:m&&m[2]?+m[2]:0,wounds:v.st.w,known:!!m}}
async function tbVhPut(v,patch){const cur=(v.sheet.veh&&v.sheet.veh[v.it.id])||{},nv={...cur,...patch},all={...(v.sheet.veh||{}),[v.it.id]:nv};v.sheet.veh=all;
 await db.doc('sheets/'+v.sheet.id).update({veh:all});{const ae=document.activeElement;if(ae&&ae.closest&&ae.closest('#tbsel')&&ae.blur)ae.blur()}tbDraw();tbBar(tbCur())}
// a hit on a vehicle token: each wound is a level of damage, the fourth wrecks it
async function tbVhHit(t,oc){const v=tbVhOf(t);if(!v)return false;if(!oc||!oc.nw)return true;const w0=v.st.w,wr0=v.st.wr,w=Math.min(4,w0+oc.nw);
 await tbVhPut(v,{w,wr:w>=4?true:wr0});undoBar(tbName(t)+': '+oc.nw+' damage'+(w>=4?', WRECKED':'')+'.',()=>tbVhPut(v,{w:w0,wr:wr0}));return true}
function tbRigCls(t){const v=t&&t.vh?tbVhOf(t):null;return v&&v.st.wr?' wrk':''}
function tbRigBadge(t,px){let h='';const sh=tbSheetOf(t);if(sh&&sh.drone)h+='<span class="tbrg" title="Drone">🤖</span>';
 const v=t&&t.vh?tbVhOf(t):null;if(v){if(v.st.wr)h+='<span class="tbvd wr" title="Wrecked">WRECKED</span>';else if(v.st.w)h+=`<span class="tbvd" title="Vehicle damage ${v.st.w} of 4">🔧${v.st.w}</span>`}
 return h}
// ---- the lines: a drone to its rigger, and the chase order
function tbRigSvg(m,g){const rows=tbFogOn(m)?tbFogRows(m,g):null,T=tbToks(m),mid=t=>{const p=tbMid(t);return {x:g.ox+p.x*g.gs,y:g.oy+p.y*g.gs}},k=1/Math.max(.25,tbV.z);let h='';
 T.forEach(t=>{const s=tbSheetOf(t);if(!s||!s.drone||!s.owner||!tbSees(t,g,rows))return;const r=T.find(x=>x.sheet===s.owner&&x.id!==t.id);if(!r||!tbSees(r,g,rows))return;
  if(tbTokDist(t,r)<1.6)return;const a=mid(t),b=mid(r);
  h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#00f0d0" stroke-width="${Math.max(2,g.gs*.035)}" stroke-dasharray="${g.gs*.18} ${g.gs*.14}" stroke-opacity=".7"/>`});
 const c=tbChase();if(c){const L=(c.rows||[]).map(r=>({r,t:tbTok(r.tok)})).filter(x=>x.t&&x.t.map===m.id&&tbSees(x.t,g,rows));
  for(let i=1;i<L.length;i++){const a=mid(L[i-1].t),b=mid(L[i].t),gp=TB_GAP[Math.max(0,Math.min(4,+L[i].r.gap||0))],mx=(a.x+b.x)/2,my=(b.y+a.y)/2,fs=Math.max(12,g.gs*.26);
   h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${gp[1]}" stroke-width="${Math.max(3,g.gs*.06)}" stroke-dasharray="${g.gs*.35} ${g.gs*.2}" stroke-opacity=".85"/><text x="${mx}" y="${my}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${gp[1]}" stroke="#000" stroke-width="${fs*.28}" paint-order="stroke" stroke-linejoin="round">${esc(gp[0])}</text>`}}
 return h}
// ---- the selected-token panel
function tbRigPanel(L){if(!L||L.length!==1)return '';const t=L[0],s=tbSheetOf(t),m=tbCur();let h='';
 if(s&&s.drone){const r=tbShById(s.owner),rt=r&&tbToks(m).find(x=>x.sheet===r.id);let st=null;try{st=pgStats(s)}catch(e){}let wm=3;try{wm=shWM(s)}catch(e){}
  h+=`<div class="tbcw"><div class="meta">🤖 Drone</div><div>Rigged by <b>${esc(r?r.name||r.handle||'?':'(unknown)')}</b></div><div class="meta">Wounds ${Math.min(+s.wounds||0,wm)} of ${wm}${s.inc?' · INCAPACITATED':''}${st?' · Toughness '+st.tough+(st.arm?' (armor '+st.arm+')':''):''}</div>
  <div class="tbvb">${rt?`<button class="btn sm" data-tbx="rigsel:${esc(rt.id)}" title="Select the rigger's token">Select the rigger</button>`:''}<button class="btn sm" data-tbx="rigsh:${esc(s.id)}" title="Open the drone's sheet">Open the sheet</button></div></div>`}
 const v=t.vh?tbVhOf(t):null;
 if(t.vh&&!v)h+=`<div class="tbcw"><div class="meta">🚗 This vehicle is no longer in its owner's gear.</div></div>`;
 if(v){const can=tbMineSh(v.sheet),sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h,S=v.s;
  h+=`<div class="tbcw"><div class="meta">🚗 Vehicle · ${esc(v.sheet.name||'')}'s</div>
  <div class="meta">${[S.size!==''?'Size '+S.size:'',S.hand!==''||v.st.h!=null?'Handling '+(hd>0?'+':'')+hd:'',S.speed?'Top Speed '+S.speed:'',S.tough?'Toughness '+esc(S.tough):'',S.crew?'Crew '+esc(S.crew):''].filter(Boolean).join(' · ')||'No stat line in the gear entry.'}</div>
  <div class="tbvb"><span class="meta">Damage</span><button class="btn sm" data-tbx="vhw:-1" ${can?'':'disabled'} aria-label="Less damage">−</button><b style="min-width:44px;text-align:center;color:${v.st.w?'var(--red)':'var(--dim)'}">${v.st.wr?'WRECKED':v.st.w+' / 4'}</b><button class="btn sm" data-tbx="vhw:1" ${can?'':'disabled'} aria-label="More damage">+</button>
  <label class="tbck"><input type="checkbox" data-tbx="vhwr" ${v.st.wr?'checked':''} ${can?'':'disabled'}> Wrecked</label></div>
  <div class="tbvb"><button class="btn sm grn" data-tbx="vhroll" ${can&&!v.st.wr?'':'disabled'} title="Roll ${esc(sk)} for this vehicle with its Handling and damage">🎲 Roll ${esc(sk)}</button></div></div>`}
 return h}
TBX.rigsel=x=>{const t=tbTok(x);if(t){tbSel=t.id;tbTS=[t.id];tbDraw();tbBar(tbCur());tbCenter(t)}};
TBX.rigsh=x=>{const s=tbShById(x);if(s)portraitGoSheet(s.id)};
TBX.vhw=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet))return;const d=+x||0,w=Math.max(0,Math.min(4,v.st.w+d));if(w===v.st.w)return;const w0=v.st.w,wr0=v.st.wr;
 tbVhPut(v,{w,wr:w>=4?true:(d<0&&wr0&&w<4?false:wr0)}).then(()=>undoBar(tbName(t)+' damage '+w+' of 4.',()=>tbVhPut(v,{w:w0,wr:wr0}))).catch(e=>alert('Could not save: '+(e.message||e.code)))};
TBX.vhwr=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet))return;tbVhPut(v,{wr:!v.st.wr}).catch(e=>alert('Could not save: '+(e.message||e.code)))};
// ---- a driving roll with the real sheet rules
let tbVR=null;
TBX.vhroll=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet)||v.st.wr)return;tbVR={t:t.id};const sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h,post=(()=>{try{return localStorage.getItem('sr_tbdp')!=='0'}catch(e){return true}})();
 $('#modal').innerHTML=`<div class="modal"><form id="tbvrf"><h2>🚗 ${esc(tbName(t))}: ${esc(sk)} roll</h2><div class="meta">${esc(v.sheet.name||'')} drives. Handling ${hd>0?'+':''}${hd}${v.st.w?', vehicle damage −'+v.st.w:''} are added for you, plus any wound penalties on the sheet.</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><div><label>TARGET NUMBER</label><input type="number" id="tbvtn" value="4" min="2" max="20" style="width:80px"></div><div><label>OTHER MODIFIER</label><input type="number" id="tbvom" value="0" style="width:80px"></div></div>
 <div style="margin:10px 0"><button type="button" class="btn grn" id="tbvgo">🎲 Roll</button> <label class="tbck" style="display:inline-block;margin-left:10px"><input type="checkbox" id="tbvdp" ${post?'checked':''}> Post to Discord</label></div><div id="tbvr"></div>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Close</button></div></form></div>`;
 $('#cx').onclick=closeM;$('#tbvgo').onclick=tbVhRoll};
async function tbVhRoll(){const t=tbVR&&tbTok(tbVR.t),v=t&&tbVhOf(t);if(!v)return;const tn=Math.max(2,Math.min(20,+$('#tbvtn').value||4)),om=+$('#tbvom').value||0,sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h;
 const xs=[];if(hd)xs.push(['Handling',hd]);if(v.st.w)xs.push(['Vehicle damage',-v.st.w]);if(om)xs.push(['Other',om]);
 const res=tbAs(v.sheet,S=>{let f=null;for(const k in S.sk)(S.sk[k]||[]).forEach(x=>{if(x.n===sk)f=x});if(!f)return {err:'This sheet has no "'+sk+'" skill.'};
  coChk();shOpt.mod=0;shOpt.tn=tn;shOpt.pen=true;const p=shPrep(+f.d||4,f.m,v.it.name+' ('+f.n+')',!+f.d,false,{sk:f.n},xs),o={title:p.title,sides:p.sides,mod:p.m,tn,wild:p.wild,ws:p.ws||6},r=shRes(o);r.rs=r.ok?Math.floor((r.fin-tn)/4):0;return r});
 if(res.err){$('#tbvr').innerHTML=`<div class="warn">${esc(res.err)}</div>`;return}
 $('#tbvr').innerHTML=`<div class="post" style="padding:8px 10px"><div style="font-size:calc(16px*var(--ts,1))"><b>${res.fin}</b> vs TN ${tn} — ${esc(res.line)}</div><div class="meta">${esc(res.detail)}</div></div>`;
 const p=$('#tbvdp')?$('#tbvdp').checked:true;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}
 const plain=`🚗 **${tbName(t)}** (${v.sheet.name||'?'}): `+res.plain;try{await dxRecord(plain,v.sheet.name||handle)}catch(e){}if(p){try{await dxPost(plain,v.sheet.name||handle)}catch(e){}}}
// ---- the add-to-map picker: the player's own drones and vehicles
function tbRigPick(m,q){const out=[];(pm.sheets||[]).filter(s=>s&&!s.deleted&&!s.drone&&sxVis(s)&&tbMineSh(s)).forEach(s=>{invOf(s.handle||s.name).filter(x=>x.cat==='Vehicles').forEach(it=>{
  if(q&&!((it.name||'')+' '+(s.name||'')).toLowerCase().includes(q))return;out.push({s,it})})});
 if(!out.length)return '';
 return `<div class="meta" style="margin:8px 0 2px">VEHICLES</div>`+out.map(x=>{const on=tbToks(m).some(t=>t.vh&&t.vh.i===x.it.id);return `<a class="row tbpr" data-tbpv="${esc(x.s.id)}|${esc(x.it.id)}"><span class="tbpi">${tbVhEmoji(x.it)}</span><div style="flex:1;min-width:0"><div class="t">${esc(x.it.name||'Vehicle')} ${x.s.uid===uid?'<span class="tag">yours</span>':''}</div><div class="meta">${esc([x.s.name,x.it.sub].filter(Boolean).join(' · '))}</div></div>${on?'<span class="meta">on the map · select</span>':'<span class="btn sm">Add</span>'}</a>`}).join('')}
function tbRigPickBind(el,m){el.querySelectorAll('[data-tbpv]').forEach(a=>a.onclick=async()=>{const [sid,iid]=a.dataset.tbpv.split('|'),s=tbShById(sid),it=s&&invOf(s.handle||s.name).find(x=>x.id===iid);if(!it)return;
  const ex=tbToks(m).find(t=>t.vh&&t.vh.i===iid);if(ex){tbSel=ex.id;closeM();return}
  try{const id=await tbAddTok(m,{kind:'vehicle',name:it.name||'Vehicle',emoji:tbVhEmoji(it),sz:tbVhSize(vhStats(it)),vh:{s:sid,i:iid}});tbSel=id;tbPOk('Added '+(it.name||'the vehicle')+'.');tbPBody()}catch(e){alert('Could not add: '+(e.message||e.code))}})}
// ---- chase tracker
function tbChase(){const c=(pm.tbmeta||[]).find(x=>x&&x.id==='chase');return c&&c.on?c:null}
async function tbChaseSave(patch){const o=(pm.tbmeta||[]).find(x=>x&&x.id==='chase')||{rows:[],round:1,on:0},doc={kind:'chase',on:('on' in patch?patch.on:o.on)?1:0,round:Math.max(1,+('round' in patch?patch.round:o.round)||1),rows:(('rows' in patch?patch.rows:o.rows)||[]).slice(0,12).map(r=>({tok:String(r.tok),gap:Math.max(0,Math.min(4,+r.gap||0))})),ts:Date.now(),by:handle||'GM'};
 const L=pm.tbmeta=pm.tbmeta||[],e=L.find(x=>x&&x.id==='chase');if(e)Object.assign(e,doc);else L.push({id:'chase',...doc});
 try{await db.doc('tbmeta/chase').set(doc)}catch(er){alert('Could not save the chase: '+(er.message||er.code))}tbBar(tbCur());tbRangeDraw()}
function tbChaseHtml(m){const c=tbChase(),T=c?(c.rows||[]).map(r=>({r,t:tbTok(r.tok)})).filter(x=>x.t):[];
 if(!c)return isOwner?`<div class="meta">A chase keeps a list of vehicles or runners in order, with the gap between each one and the one ahead. Select the tokens you want (the leader first) and press Start.</div><div class="tbvb"><button class="btn sm grn" data-tbx="chstart" title="Start a chase with the selected tokens">🏁 Start a chase with the selected tokens</button></div>`:'';
 const list=T.map((x,i)=>{const gp=TB_GAP[Math.max(0,Math.min(4,+x.r.gap||0))];
  return `<div class="tbchr"><span class="tbchn">${i+1}</span><a class="tbchname" data-tbx="rigsel:${esc(x.t.id)}">${esc(tbName(x.t))}</a>${i?`<span class="tbchgap" style="color:${gp[1]}">${isOwner?`<button class="btn sm" data-tbx="chgap:${i}:-1" aria-label="Closer">◀</button> `:''}<b>${gp[0]}</b>${isOwner?` <button class="btn sm" data-tbx="chgap:${i}:1" aria-label="Further">▶</button>`:''} <span class="meta">behind ${esc(tbName(T[i-1].t))}</span></span>`:'<span class="meta">in front</span>'}${isOwner?`<span class="tbchb"><button class="btn sm" data-tbx="chmv:${i}:-1" ${i?'':'disabled'} aria-label="Move up">▲</button><button class="btn sm" data-tbx="chmv:${i}:1" ${i<T.length-1?'':'disabled'} aria-label="Move down">▼</button><button class="btn sm mg" data-tbx="chrm:${i}" aria-label="Take out of the chase">✕</button></span>`:''}</div>`}).join('');
 return `<div class="tbvb"><b>🏁 Chase · round ${+c.round||1}</b></div>${list||'<div class="meta">Nobody in the chase.</div>'}${isOwner?`<div class="tbvb"><button class="btn sm" data-tbx="chadd" title="Add the selected tokens to the end of the list">＋ Add selected</button><button class="btn sm grn" data-tbx="chnext">Next round</button><button class="btn sm mg" data-tbx="chend">End the chase</button></div>`:''}`}
function tbChaseSync(m){const el=$('#tbchs');if(!el)return;const h=m?tbChaseHtml(m):'';tbSig(el,h);const d=el.closest('details');if(d)d.style.display=h?'':'none';const on=!!tbChase();if(on&&!tbChaseSync.was&&d){d.open=true;try{tbOpenS.chs=1}catch(e){}}tbChaseSync.was=on}
const tbChRows=()=>((tbChase()||{}).rows||[]).filter(r=>tbTok(r.tok)).map(r=>({...r}));
TBX.chstart=()=>{if(!isOwner)return;const S=tbSelToks();if(!S.length)return tbNote('Select the tokens first, the one in front first.');tbChaseSave({on:1,round:1,rows:S.map((t,i)=>({tok:t.id,gap:i?1:0}))})};
TBX.chadd=()=>{if(!isOwner)return;const R=tbChRows(),S=tbSelToks().filter(t=>!R.some(r=>r.tok===t.id));if(!S.length)return tbNote('Select tokens that are not in the chase yet.');tbChaseSave({rows:R.concat(S.map(t=>({tok:t.id,gap:1})))})};
TBX.chgap=(x,m,t,e,y)=>{if(!isOwner)return;const i=+x,R=tbChRows();if(!R[i]||!i)return;R[i].gap=Math.max(0,Math.min(4,R[i].gap+(+y||0)));tbChaseSave({rows:R})};
TBX.chmv=(x,m,t,e,y)=>{if(!isOwner)return;const i=+x,j=i+(+y||0),R=tbChRows();if(!R[i]||!R[j])return;[R[i],R[j]]=[R[j],R[i]];tbChaseSave({rows:R})};
TBX.chrm=x=>{if(!isOwner)return;const R=tbChRows();R.splice(+x,1);tbChaseSave(R.length>1?{rows:R}:{on:0,rows:[]})};
TBX.chnext=()=>{if(!isOwner)return;const c=tbChase();if(c)tbChaseSave({round:(+c.round||1)+1})};
TBX.chend=async()=>{if(!isOwner)return;if(!await ask('End the chase?','End it'))return;tbChaseSave({on:0,rows:[]})};
(function(){const st=document.createElement('style');st.id='tbrigcss';st.textContent=`.tbt .tbrg{position:absolute;left:-2px;top:-2px;font-size:calc(13px*var(--ts,1));line-height:1;background:#000c;border-radius:6px;padding:1px 2px;z-index:3}.tbt .tbvd{position:absolute;right:-2px;bottom:-2px;font-size:calc(11px*var(--ts,1));font-weight:700;background:#000d;color:#ff9f1c;border:1px solid #ff9f1c;border-radius:6px;padding:0 3px;z-index:3;white-space:nowrap}.tbt .tbvd.wr{color:#ff3b3b;border-color:#ff3b3b}.tbt.wrk .tbi{filter:grayscale(1) brightness(.55)}.tbchr{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}.tbchn{font-weight:700;min-width:18px}.tbchname{cursor:pointer;font-weight:700}.tbchb{margin-left:auto;display:inline-flex;gap:3px}.tbchgap{display:inline-flex;gap:3px;align-items:center;flex-wrap:wrap}`;document.head.appendChild(st)})();

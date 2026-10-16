// ---- Wider pages: drag the grip on the right edge to use free screen space on the Seattle Map, Initiative and Home pages.
// The Seattle Map also gets a bar under the map to make it taller. Double-click either one to put it back.
const WV_B={__map:1,__init:1,__home:1};
const wvLS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const wvSet=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
const wvBoard=()=>{try{return typeof board==='string'?board:''}catch(e){return ''}};
let wvDrag=null,wvQ=0;
function wvGrip(){let g=document.getElementById('wgrip');if(!g){g=document.createElement('div');g.id='wgrip';g.title='Drag left or right to make this page wider or narrower. Double-click to put it back.';g.innerHTML='<i></i>';document.body.appendChild(g)}return g}
function wvPos(){const g=wvGrip(),v=document.getElementById('view'),b=wvBoard();
 if(!v||!WV_B[b]||window.innerWidth<=900){g.style.display='none';return}
 const r=v.getBoundingClientRect(),t=Math.max(r.top,0)+70,bt=Math.min(r.bottom,window.innerHeight)-20;
 if(bt-t<60){g.style.display='none';return}
 g.style.display='flex';g.style.left=(r.right-15)+'px';g.style.top=t+'px';g.style.height=(bt-t)+'px'}
function wvPosQ(){if(wvQ)return;wvQ=requestAnimationFrame(()=>{wvQ=0;wvPos()})}
function wvApply(){const v=document.getElementById('view');if(!v)return;const b=wvBoard(),on=!!WV_B[b];
 const w=on?(parseFloat(wvLS('sr_wv_'+b,'0'))||0):0,want=w>0?(Math.round(w)+32)+'px':'';
 if(v.style.maxWidth!==want)v.style.maxWidth=want;
 if(b==='__map'){const m=document.getElementById('mapwrap');
  if(m){const h=parseFloat(wvLS('sr_wh_map','0'))||0;m.style.height=h>0?Math.round(h)+'px':'';
   if(!document.getElementById('wvh')){const d=document.createElement('div');d.id='wvh';d.className='wvh';d.title='Drag up or down to make the map taller. Double-click to put it back.';d.innerHTML='<i></i>';m.insertAdjacentElement('afterend',d)}}}
 wvPos()}
function wvRefit(){try{if(wvBoard()==='__map'&&typeof mapFit==='function')mapFit()}catch(e){}}
document.addEventListener('pointerdown',e=>{const t=e.target.closest&&e.target.closest('#wgrip,#wvh');if(!t)return;e.preventDefault();const v=document.getElementById('view'),b=wvBoard();
 if(t.id==='wgrip'){const cur=v.style.maxWidth;v.style.maxWidth='none';const full=v.getBoundingClientRect().width;v.style.maxWidth=cur;wvDrag={k:'w',x:e.clientX,w:v.getBoundingClientRect().width-32,max:full-32,pid:e.pointerId,b}}
 else{const m=document.getElementById('mapwrap');if(!m)return;wvDrag={k:'h',y:e.clientY,h:m.offsetHeight,pid:e.pointerId,b}}
 try{t.setPointerCapture(e.pointerId)}catch(x){}});
document.addEventListener('pointermove',e=>{const D=wvDrag;if(!D||e.pointerId!==D.pid)return;
 if(D.k==='w'){wvSet('sr_wv_'+D.b,Math.round(Math.max(520,Math.min(Math.max(520,D.max),D.w+e.clientX-D.x))))}
 else wvSet('sr_wh_map',Math.round(Math.max(240,Math.min(3000,D.h+e.clientY-D.y))));
 wvApply()});
const wvEnd=e=>{const D=wvDrag;if(!D||e.pointerId!==D.pid)return;wvDrag=null;wvRefit()};
document.addEventListener('pointerup',wvEnd);document.addEventListener('pointercancel',wvEnd);
document.addEventListener('dblclick',e=>{const t=e.target.closest&&e.target.closest('#wgrip,#wvh');if(!t)return;
 if(t.id==='wgrip')wvSet('sr_wv_'+wvBoard(),0);else wvSet('sr_wh_map',0);wvApply();wvRefit()});
{const st=document.createElement('style');st.textContent=`#wgrip{position:fixed;width:14px;z-index:30;cursor:ew-resize;display:none;align-items:center;justify-content:center;touch-action:none}#wgrip i{display:block;width:5px;height:70px;border-radius:3px;background:#2c3f55}#wgrip:hover i{background:var(--cy)}.wvh{height:14px;cursor:ns-resize;display:flex;align-items:center;justify-content:center;touch-action:none;margin-top:3px}.wvh i{display:block;width:70px;height:5px;border-radius:3px;background:#2c3f55}.wvh:hover i{background:var(--cy)}`;document.head.appendChild(st)}
{const init=()=>{const v=document.getElementById('view');if(!v)return;new MutationObserver(()=>wvApply()).observe(v,{childList:true});if(window.ResizeObserver)new ResizeObserver(()=>wvPosQ()).observe(v);window.addEventListener('resize',wvPosQ);window.addEventListener('scroll',wvPosQ,true);wvApply()};
 if(document.getElementById('view'))init();else document.addEventListener('DOMContentLoaded',init)}

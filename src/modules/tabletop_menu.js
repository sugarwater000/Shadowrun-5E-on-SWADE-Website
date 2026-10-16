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

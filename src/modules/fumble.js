// ---- Critical failure d4 (optional roll after both dice show 1) + "working on it" notice for slow actions
const FM_DEF=['A small slip: −1 to your next roll.','Gear trouble: a weapon or tool jams or fails until someone spends an action to fix it.','You draw attention: someone nearby notices what you are doing.','A real disaster: the GM chooses a serious complication.'];
const fmDoc=()=>(pm.fumble||[]).find(x=>x.id==='main'&&!x.deleted)||null;
const fmOn=()=>{const m=fmDoc();return !m||m.on!==false};
const fmRows=()=>{const m=fmDoc(),r=m&&Array.isArray(m.rows)?m.rows:FM_DEF;return [0,1,2,3].map(i=>String(r[i]==null?'':r[i]).slice(0,300).trim())};
let fmQ=[],fmBusy=false;
function fmOffer(plain,who){const t=String(plain||'');if(!/Critical Failure/.test(t)||/Fumble d4/.test(t)||!(t.startsWith('🎲')||t.startsWith('➕')))return;if(!fmOn())return;
 const m=t.match(/^\S+\s+\*\*(.+?)\*\*/);fmQ.push({title:m?m[1]:'your roll',who:who||handle});setTimeout(fmNext,1400)}
function fmNext(){if(fmBusy||!fmQ.length)return;fmBusy=true;const q=fmQ.shift();let o=document.getElementById('fumb');if(o)o.remove();o=document.createElement('div');o.id='fumb';
 o.innerHTML=`<div class="fumb" role="dialog" aria-modal="true" aria-labelledby="fmt"><div class="fmh" id="fmt">⚠ CRITICAL FAILURE</div><div class="fmm"><b>${esc(q.title)}</b>: both dice came up 1.<br>Do you want to roll a d4 to see what goes wrong?</div><div class="fmd" id="fmd" hidden></div><div class="fmo" id="fmo"></div><div class="askr" id="fmb"><button class="btn mg" id="fmY">🎲 Roll d4</button><button class="btn" id="fmN">Cancel</button></div></div>`;
 document.body.appendChild(o);let rolling=false;
 const close=()=>{document.removeEventListener('keydown',kd,true);o.remove();fmBusy=false;setTimeout(fmNext,300)},kd=e=>{if(e.key==='Escape'&&!rolling){e.preventDefault();e.stopPropagation();close()}};document.addEventListener('keydown',kd,true);
 document.getElementById('fmN').onclick=close;
 document.getElementById('fmY').onclick=()=>{if(rolling)return;rolling=true;const d=document.getElementById('fmd'),bar=document.getElementById('fmb');bar.innerHTML='<span class="meta">Rolling…</span>';d.hidden=false;
  const n=dxRand(4);let k=0;const iv=setInterval(()=>{d.textContent=String(dxRand(4));if(++k>=10){clearInterval(iv);d.textContent=String(n);d.classList.add('done');rolling=false;
   const eff=fmRows()[n-1],plain=`🎲 **Fumble d4** (${q.title}) — d4: [${n}] → **${n}**${eff?' — '+eff:''}`;
   document.getElementById('fmo').textContent=eff||'The GM decides what happens.';bar.innerHTML='<button class="btn" id="fmC">Close</button>';document.getElementById('fmC').onclick=close;document.getElementById('fmC').focus();
   try{dxRecord(plain,q.who)}catch(e){}
   try{if(typeof shOpt!=='undefined'&&shOpt&&shOpt.auto)dxPost(plain,q.who)}catch(e){}}},70)};
 document.getElementById('fmY').focus()}
function fmGmPanel(){const el=$('#fmgm');if(!el||!isOwner)return;const m=fmDoc(),on=fmOn(),rows=fmRows();
 el.innerHTML=`<div class="post" style="padding:12px;margin-top:12px"><h2 style="font-size:14px">CRITICAL FAILURE d4</h2>
 <div class="hint" style="margin:6px 0 10px">When anyone's roll is a critical failure (both dice show 1), they get a pop-up with <b>Roll d4</b> or <b>Cancel</b>. The result goes in the table roll log. Write what each number means below, or leave a line empty to show only the number.</div>
 <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="fmon" style="width:auto" ${on?'checked':''}> Offer the d4 roll after a critical failure</label>
 ${rows.map((r,i)=>`<label style="margin-top:8px">${i+1}</label><input data-fmr="${i}" maxlength="300" value="${esc(r)}" placeholder="What happens on a ${i+1}?">`).join('')}
 <div style="margin-top:8px"><button class="btn grn" id="fmsave">Save</button> <button class="btn sm" id="fmdef">Use the suggested lines</button> <span class="meta" id="fmmsg"></span></div></div>`;
 el.querySelector('#fmdef').onclick=()=>{el.querySelectorAll('[data-fmr]').forEach((i,k)=>i.value=FM_DEF[k])};
 el.querySelector('#fmsave').onclick=async()=>{const prev={on:fmOn(),rows:fmRows()},rw=[...el.querySelectorAll('[data-fmr]')].map(i=>i.value.trim().slice(0,300)),nx={on:el.querySelector('#fmon').checked,rows:rw,by:handle||'GM',ts:Date.now()};
  try{await db.doc('fumble/main').set(nx);el.querySelector('#fmmsg').textContent='Saved.';undoBar('Critical failure settings saved.',()=>db.doc('fumble/main').set({...prev,by:handle||'GM',ts:Date.now()}).then(fmGmPanel))}catch(e){alert('Could not save: '+(e.message||e.code))}}}

/* ===== "Working on it" notice: shows when a save or action is slow, and locks the clicked button until it finishes ===== */
const BZ_QUIET=/\/api\/(sync|presence|me|unfurl)(\?|$)/;
let bzN=0,bzT1=0,bzT2=0,bzLast=null,bzShown=false;const bzP=new Set();
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button,.btn,[type=submit]');bzLast=b?{el:b,t:Date.now()}:null},true);
function bzLock(r){const e=r.lb;if(e&&e.isConnected&&!r.on&&!e.classList.contains('bz')){r.on=1;e.classList.add('bz');e.setAttribute('aria-busy','true')}}
function bzUnlock(r){const e=r.lb;if(e&&r.on){e.classList.remove('bz');e.removeAttribute('aria-busy')}r.on=0}
function bzShow(){bzShown=true;let el=document.getElementById('bzmsg');if(!el){el=document.createElement('div');el.id='bzmsg';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
 el.textContent='⏳ Working on it… please wait, no need to click again.';el.classList.add('on');bzP.forEach(bzLock);clearTimeout(bzT2);bzT2=setTimeout(()=>{const e=document.getElementById('bzmsg');if(e&&bzN>0)e.textContent='⏳ Still working… the connection is slow. Your action has not been lost, so please do not repeat it.'},7000)}
function bzHide(){bzShown=false;clearTimeout(bzT1);clearTimeout(bzT2);const el=document.getElementById('bzmsg');if(el)el.classList.remove('on')}
/* quick actions are never locked: a button is only locked once the notice shows (a save is taking longer than about half a second) */
if(!window.__bzWrapped&&typeof window.fetch==='function'){window.__bzWrapped=1;const of=window.fetch.bind(window);
 window.fetch=function(u,o){const url=typeof u==='string'?u:(u&&u.url)||'';
  if(!/\/api\//.test(url)||BZ_QUIET.test(url))return of(u,o);
  bzN++;if(bzN===1){clearTimeout(bzT1);bzT1=setTimeout(bzShow,600)}
  const r={lb:bzLast&&Date.now()-bzLast.t<500&&bzLast.el.isConnected?bzLast.el:null,on:0};bzP.add(r);if(bzShown)bzLock(r);
  const cap=setTimeout(()=>{bzUnlock(r);bzP.delete(r)},25000);
  const fin=()=>{clearTimeout(cap);bzP.delete(r);bzUnlock(r);bzN=Math.max(0,bzN-1);if(bzN===0)bzHide()};
  let p;try{p=of(u,o)}catch(e){fin();throw e}
  p.then(fin,fin);return p}}
{const st=document.createElement('style');st.textContent=`#fumb{position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:16px}
.fumb{background:var(--panel);border:2px solid var(--red);box-shadow:0 0 28px rgba(255,59,59,.45);padding:18px;max-width:440px;width:100%;text-align:center}
.fmh{font-size:20px;font-weight:700;color:var(--red);letter-spacing:.06em;margin-bottom:8px}.fmm{margin-bottom:12px}
.fmd{font-size:64px;font-weight:700;line-height:1.1;color:var(--am);border:2px solid var(--am);width:96px;margin:6px auto 10px;padding:6px 0}.fmd.done{color:var(--red);border-color:var(--red)}
.fmo{margin:0 0 12px;min-height:1.2em;font-weight:600}
#bzmsg{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(20px);z-index:100020;background:var(--panel);border:1px solid var(--am);color:var(--am);padding:8px 14px;font-size:14px;max-width:min(92vw,560px);text-align:center;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;box-shadow:0 0 14px rgba(255,176,0,.3)}
#bzmsg.on{opacity:1;transform:translateX(-50%)}
.bz{pointer-events:none!important;opacity:.55!important;cursor:progress!important}
@media (prefers-reduced-motion:reduce){#bzmsg{transition:none}}`;document.head.appendChild(st)}

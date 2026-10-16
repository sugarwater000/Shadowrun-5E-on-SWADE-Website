// ---- Cosmetic flair: handle badges, name effects, portrait frames (shared) and dice themes, roll animations (personal)
const FL_BADGES=[['🔫','Gunslinger'],['⚡','Fast mover'],['🧠','Brains'],['🔮','Mage'],['🚗','Wheels'],['🛡','Tank'],['💀','Bad news'],['🐉','Dragon bait'],['🕶','Cool shades'],['🎲','Gambler'],['🔧','Tinker'],['💊','Medic'],['🦾','Chrome'],['👁','Watcher'],['🐺','Lone wolf'],['🦅','Scout'],['🌙','Night owl'],['☢','Toxic'],['🎭','Face'],['📡','Signal'],['💰','Money'],['🔥','Hot'],['🍀','Lucky'],['🗡','Blade']];
const FL_FX=[['','None'],['glow','Neon glow'],['pulse','Pulse'],['flicker','Flicker'],['glitch','Glitch'],['shimmer','Shimmer'],['chrome','Chrome'],['ember','Ember']];
const FL_FR=[['','None (no picture)'],['plain','No frame (just the picture)'],['neon','Neon ring'],['hazard','Hazard stripes'],['gold','Corp gold'],['glitch','Glitch'],['holo','Hologram'],['circuit','Circuit']];
const FL_DICE=[['','Neon (default)'],['chrome','Chrome'],['bone','Bone'],['blood','Blood'],['toxic','Toxic'],['gold','Gold'],['holo','Hologram'],['void','Void']];
const FL_ANIM=[['','Classic shuffle'],['tumble','Tumble'],['flip','Flip'],['slow','Slow reveal'],['glitch','Glitch decode'],['instant','Instant']];
const flOk=(list,v)=>list.some(x=>x[0]===v)?v:'';
function flOf(h){const p=profs&&profs[pid(h||'')],f=p&&p.flair;if(!f||typeof f!=='object')return null;
 const o={b:FL_BADGES.some(x=>x[0]===f.b)?f.b:'',t:String(f.t||'').replace(/[<>]/g,'').slice(0,14),fx:flOk(FL_FX,f.fx),fr:flOk(FL_FR,f.fr),img:(typeof portraitOf==='function'?portraitOf(h):'')||(/^[0-9a-f]{8,64}$/i.test(p.img||'')?p.img:'')};
 return (o.b||o.t||o.fx||o.fr)?o:null}
const flCss=document.createElement('style');flCss.textContent=`
.fx-glow{text-shadow:0 0 6px currentColor,0 0 14px currentColor}
.fx-pulse{animation:flpulse 2s ease-in-out infinite}@keyframes flpulse{0%,100%{text-shadow:0 0 3px currentColor}50%{text-shadow:0 0 6px currentColor,0 0 18px currentColor,0 0 28px currentColor}}
.fx-flicker{animation:flflick 3.2s infinite}@keyframes flflick{0%,18%,22%,25%,53%,57%,100%{opacity:1;text-shadow:0 0 8px currentColor}20%,24%,55%{opacity:.35;text-shadow:none}}
.fx-glitch{animation:flglit 2.6s steps(1) infinite}@keyframes flglit{0%,88%,100%{text-shadow:none}90%{text-shadow:2px 0 #f0f,-2px 0 #0ff}93%{text-shadow:-2px 0 #f0f,2px 0 #0ff}96%{text-shadow:1px 1px #f0f,-1px -1px #0ff}}
.fx-shimmer,.fx-chrome,.fx-ember{-webkit-background-clip:text;background-clip:text;color:transparent!important;-webkit-text-fill-color:transparent}
.fx-shimmer{background-image:linear-gradient(90deg,#ff2d95,#ffb000,#39ff14,#00f0d0,#c084fc,#ff2d95);background-size:200% 100%;animation:flshim 4s linear infinite}@keyframes flshim{to{background-position:200% 0}}
.fx-chrome{background-image:linear-gradient(180deg,#fff 0%,#9aa7b0 45%,#e8eef2 55%,#6f7d86 100%)}
.fx-ember{background-image:linear-gradient(0deg,#ff3b00,#ffb000 60%,#fff2a8);animation:flemb 1.8s ease-in-out infinite alternate}@keyframes flemb{to{filter:brightness(1.35) drop-shadow(0 0 4px #ff6a00)}}
.flb{margin-left:4px;cursor:default}.flt{margin-left:5px;font-size:10px;letter-spacing:.08em;border:1px solid currentColor;padding:0 4px;color:var(--dim);vertical-align:middle;text-transform:uppercase}
.flav{width:24px;height:24px;object-fit:cover;vertical-align:middle;margin-right:6px}.flav.npcav{width:34px;height:34px;border:1px solid var(--am);margin-right:8px}
img.afr-neon{border:2px solid var(--cy)!important;border-radius:50%!important;box-shadow:0 0 10px var(--cy)}
img.afr-hazard{border:3px solid!important;border-image:repeating-linear-gradient(45deg,#ffb000 0 6px,#111 6px 12px) 3!important}
img.afr-gold{border:2px double #ffd23f!important;outline:1px solid #8a6d00;outline-offset:1px;box-shadow:0 0 10px rgba(255,210,63,.6)}
img.afr-glitch{border:1px solid #0ff!important;box-shadow:3px 0 #f0f,-3px 0 #0ff}
img.afr-holo{border:2px solid #7df!important;border-radius:6px!important;animation:flholo 4s linear infinite}@keyframes flholo{to{filter:hue-rotate(360deg)}}
img.afr-circuit{border:2px dashed var(--cy)!important;border-radius:8px!important;box-shadow:0 0 0 2px var(--bg,#05070d),0 0 0 3px var(--cy)}
@media (prefers-reduced-motion:reduce){.fx-pulse,.fx-flicker,.fx-glitch,.fx-shimmer,.fx-ember,img.afr-holo{animation:none}}
.dth-chrome .dx-box{border-color:#cfd8dc!important;background:linear-gradient(135deg,#eceff1,#78909c)!important;color:#102027!important}
.dth-bone .dx-box{border-color:#8a7a5a!important;background:#f3ead3!important;color:#2b2118!important}
.dth-blood .dx-box{border-color:#ff1744!important;background:#3a0008!important;color:#ffd6d6!important;box-shadow:0 0 8px rgba(255,23,68,.5)}
.dth-toxic .dx-box{border-color:#76ff03!important;background:#0b2a00!important;color:#b2ff59!important;text-shadow:0 0 6px #76ff03;box-shadow:0 0 8px rgba(118,255,3,.45)}
.dth-gold .dx-box{border-color:#8a6d00!important;background:linear-gradient(135deg,#ffe58a,#c99700)!important;color:#3a2a00!important}
.dth-holo .dx-box{border-color:#7df!important;background:linear-gradient(135deg,rgba(0,240,208,.35),rgba(192,132,252,.35),rgba(255,45,149,.35))!important;color:#fff!important;animation:flholo 5s linear infinite}
.dth-void .dx-box{border-color:#9c27b0!important;background:#0a0010!important;color:#e1bee7!important;box-shadow:0 0 10px rgba(156,39,176,.6)}
.dx-box.fl-tumble{animation:fltum .6s cubic-bezier(.3,1.4,.5,1)}@keyframes fltum{0%{transform:rotate(-540deg) scale(.2);opacity:0}70%{opacity:1}100%{transform:none}}
.dx-box.fl-flip{animation:flflip .3s linear infinite}@keyframes flflip{to{transform:rotateX(360deg)}}
.dx-box.fl-land{animation:flland .35s ease-out}@keyframes flland{0%{transform:scale(1.4)}100%{transform:none}}
.dx-box.fl-gl{text-shadow:2px 0 #f0f,-2px 0 #0ff;font-family:monospace}
#flroot .flc{display:inline-flex;gap:4px;align-items:center;margin:2px 4px 2px 0}#flroot .flbd{font-size:18px;width:38px;height:36px;padding:0;text-align:center}#flroot .flbd.on{outline:2px solid var(--cy);background:rgba(0,240,208,.15)}
#flroot .dx-box{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:2px solid;font-weight:700;margin:2px}`;
document.head.appendChild(flCss);
const FL_FXALL=FL_FX.filter(x=>x[0]).map(x=>'fx-'+x[0]),FL_FRALL=FL_FR.filter(x=>x[0]).map(x=>'afr-'+x[0]);
let flObs=null,flT=0;
function flxClean(el){(el._fln||[]).forEach(n=>n.remove());el._fln=[];el.classList.remove(...FL_FXALL)}
function flMarkOne(el){const h=el.dataset.ph||'';if(!h||el.classList.contains('ed')||el.classList.contains('scby'))return;
 const f=prefs.flv===false?null:flOf(h),img=(typeof portraitOf==='function'?portraitOf(h):''),
  npc=!!(el.closest('.post,.cm')&&el.closest('.post,.cm').querySelector('.tag[title="NPC handle"]'))||!!(typeof npcOf==='function'&&npcOf(h)),
  showAv=!!img&&(npc||!!(f&&f.fr)),key=(f?JSON.stringify(f):'')+'|'+(showAv?img:'')+(npc?'N':'');
 if((el.dataset.flk||'')===key)return;el.dataset.flk=key;flxClean(el);
 if(f&&f.fx)el.classList.add('fx-'+f.fx);
 if(showAv){const im=document.createElement('img');im.className='flav'+(npc?' npcav':'')+(f&&f.fr?' afr-'+f.fr:'');im.src='/_blob/'+img;im.alt='';im.title=h;el.parentNode.insertBefore(im,el);el._fln.push(im)}
 if(!f)return;let last=el;
 if(f.b){const s=document.createElement('span');s.className='flb';s.textContent=f.b;const bn=FL_BADGES.find(x=>x[0]===f.b);if(bn)s.title=bn[1];last.after(s);last=s;el._fln.push(s)}
 if(f.t){const s=document.createElement('span');s.className='flt';s.textContent=f.t;last.after(s);el._fln.push(s)}}
function flFrames(){const v=$('#view');if(!v)return;
 const set=(im,h)=>{const f=prefs.flv===false?null:flOf(h),want=f&&f.fr?'afr-'+f.fr:'';im.classList.remove(...FL_FRALL);if(want)im.classList.add(want)};
 v.querySelectorAll('a.row[data-h] > img').forEach(im=>set(im,im.parentNode.dataset.h));
 if(board==='__dir'&&dirH)v.querySelectorAll('.post img[src^="/_blob/"][style*="width:140px"]').forEach(im=>set(im,dirH))}
function flMarkAll(){try{const v=$('#view');if(!v)return;flObs&&flObs.disconnect();v.querySelectorAll('[data-ph]').forEach(flMarkOne);flFrames()}finally{flWatch()}}
function flWatch(){const v=$('#view');if(!v||typeof MutationObserver==='undefined')return;if(!flObs)flObs=new MutationObserver(()=>{clearTimeout(flT);flT=setTimeout(flMarkAll,90)});flObs.observe(v,{childList:true,subtree:true})}
function flApply(){const b=document.body;if(!b)return;Array.from(b.classList).filter(c=>c.startsWith('dth-')).forEach(c=>b.classList.remove(c));const t=flOk(FL_DICE,prefs.dth||'');if(t)b.classList.add('dth-'+t);flMarkAll()}
/* roll animations (replaces the original dice-tray animation) */
const flRnd=n=>Math.floor(Math.random()*n)+1;
function flAnimBoxes(boxes,kind){return new Promise(res=>{
 if(reducedMo())kind='instant';
 const show=x=>{x.b.textContent=String(x.v);x.b.classList.remove('fl-flip','fl-gl','fl-tumble')},land=x=>{show(x);if(kind!=='instant'){x.b.classList.remove('fl-land');void x.b.offsetWidth;x.b.classList.add('fl-land')}};
 if(kind==='instant'){boxes.forEach(show);return setTimeout(res,60)}
 if(kind==='tumble')boxes.forEach(x=>x.b.classList.add('fl-tumble'));
 if(kind==='flip')boxes.forEach(x=>x.b.classList.add('fl-flip'));
 if(kind==='glitch')boxes.forEach(x=>x.b.classList.add('fl-gl'));
 const GL='#%&@§Ø01▓░',ticks=kind==='slow'?16:kind==='glitch'?12:kind==='tumble'?10:8,ms=kind==='slow'?90:kind==='glitch'?45:60;
 let k=0;const iv=setInterval(()=>{k++;
  boxes.forEach((x,i)=>{
   const stopAt=kind==='slow'?ticks-2+i*3:kind==='glitch'?ticks-2+i*2:ticks;
   if(x.done)return;
   if(k>=stopAt){x.done=1;land(x);return}
   x.b.textContent=kind==='glitch'&&Math.random()<.6?GL[flRnd(GL.length)-1]:String(flRnd(x.s))});
  if(boxes.every(x=>x.done)){clearInterval(iv);setTimeout(res,200)}},ms)})}
function dxAnim(groups){return new Promise(res=>{const st=$('#dxStage');if(!st)return res();st.innerHTML='';const boxes=[];
 groups.forEach(g=>{const w=document.createElement('div');w.className='dx-wrap'+(g.dropped?' dropped':'');const row=document.createElement('div');row.className='dx-rowd';
  g.rolls.forEach((v,i)=>{if(i>0){const pl=document.createElement('span');pl.className='dx-plus';pl.textContent='+';row.appendChild(pl)}const b=document.createElement('div');b.className='dx-box';if(i<g.rolls.length-1)b.classList.add('aced');const c=dxClip(g.sides);if(c){b.style.clipPath=c;b.style.borderRadius='4px'}b.style.borderColor=dxCol(g.sides);b.style.background=dxCol(g.sides)+'26';b.textContent='?';row.appendChild(b);boxes.push({b,s:g.sides,v})});
  w.appendChild(row);const l=document.createElement('div');l.className='dx-lbl';l.style.color=dxCol(g.sides);l.textContent=(g.role?g.role+' ':'')+'d'+g.sides+(g.rolls.length>1?' — Ace!':'')+(g.dropped?' (Dropped)':'');w.appendChild(l);st.appendChild(w)});
 flAnimBoxes(boxes,flOk(FL_ANIM,prefs.dan||'')).then(res)})}
/* the Flair window */
function flairModal(){
 const who0=handle||'',gm=isOwner,cur=flOf(who0)||{b:'',t:'',fx:'',fr:''};
 let S={who:who0,b:cur.b,t:cur.t,fx:cur.fx,fr:cur.fr,dth:flOk(FL_DICE,prefs.dth||''),dan:flOk(FL_ANIM,prefs.dan||''),flv:prefs.flv!==false};
 const chip=(attr,v,l,on)=>`<span class="cnd tg ${on?'on':''}" ${attr}="${esc(v)}" style="--cc:var(--cy)">${esc(l)}</span>`;
 const draw=()=>{const f=S,img=portraitOf(f.who);
  $('#modal').innerHTML=`<div class="modal"><div class="box" id="flroot"><h2>✨ FLAIR</h2><div class="hint">Cosmetic only. The badge, name effect and portrait frame are what other people see next to your handle. The dice theme and roll animation are just for you.</div>
  <label>HANDLE</label>${gm?`<input id="flh" list="flhl" value="${esc(f.who)}"><datalist id="flhl">${knownHandles().map(h=>`<option value="${esc(h)}">`).join('')}</datalist>`:`<input id="flh" value="${esc(f.who)}" readonly>`}
  <div class="post" style="padding:8px 12px;margin:8px 0" id="flpv"></div>
  <label>BADGE</label><div>${FL_BADGES.map(b=>`<button type="button" class="btn sm flbd ${f.b===b[0]?'on':''}" data-flb="${b[0]}" title="${esc(b[1])}">${b[0]}</button>`).join('')}<button type="button" class="btn sm" data-flb="">No badge</button></div>
  <label>TITLE TAG <span class="meta">(UP TO 14 LETTERS, SHOWN NEXT TO YOUR NAME)</span></label><input id="flt" maxlength="14" value="${esc(f.t)}" placeholder="e.g. Decker">
  <label>NAME EFFECT</label><div>${FL_FX.map(x=>chip('data-flfx',x[0],x[1],f.fx===x[0])).join('')}</div>
  <label>PORTRAIT FRAME <span class="meta">(NONE HIDES THE PICTURE NEXT TO YOUR NAME)</span></label><div>${FL_FR.map(x=>chip('data-flfr',x[0],x[1],f.fr===x[0])).join('')}</div>${img?'':'<div class="meta">Add a portrait (on your character sheet, or in your Character Directory profile) and your frame will appear around it and beside your name.</div>'}
  <h2 style="margin-top:16px;font-size:14px">JUST FOR YOU</h2>
  <label>DICE THEME</label><div>${FL_DICE.map(x=>chip('data-fldt',x[0],x[1],f.dth===x[0])).join('')}</div>
  <label>ROLL ANIMATION</label><div>${FL_ANIM.map(x=>chip('data-flan',x[0],x[1],f.dan===x[0])).join('')}</div>
  <div id="flprev" class="dx-rowd" style="margin:8px 0;gap:6px">${[4,6,8,10,12].map(n=>{const c=dxClip(n);return `<div class="dx-box" data-fls="${n}" style="${c?'clip-path:'+c+';border-radius:4px;':''}border-color:${dxCol(n)};background:${dxCol(n)}26">${n}</div>`}).join('')}<button type="button" class="btn sm" id="flroll">🎲 Preview roll</button></div>
  <label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="flv" style="width:auto" ${f.flv?'checked':''}> Show other people's badges, effects and frames</label>
  <div style="margin-top:12px"><button class="btn grn" id="flok">Save</button> <button class="btn" id="flcx">Cancel</button></div></div></div>`;
  const pv=$('#flpv');pv.innerHTML=`<div class="hd">${f.fr&&img?`<img class="flav afr-${f.fr}" src="/_blob/${esc(img)}" alt="">`:''}<span class="handle ${f.fx?'fx-'+f.fx:''}">${esc(f.who||'Your handle')}</span>${f.b?`<span class="flb">${f.b}</span>`:''}${f.t?`<span class="flt">${esc(f.t)}</span>`:''}</div>`;
  const doc=$('#modal');
  const keepT=()=>{const t=$('#flt');if(t)S.t=t.value.replace(/[<>]/g,'').slice(0,14);const w=$('#flh');if(w&&gm)S.who=w.value.trim();const v=$('#flv');if(v)S.flv=v.checked};
  const redo=()=>{keepT();draw()};
  doc.querySelectorAll('[data-flb]').forEach(b=>b.onclick=()=>{keepT();S.b=b.dataset.flb;draw()});
  doc.querySelectorAll('[data-flfx]').forEach(b=>b.onclick=()=>{keepT();S.fx=b.dataset.flfx;draw()});
  doc.querySelectorAll('[data-flfr]').forEach(b=>b.onclick=()=>{keepT();S.fr=b.dataset.flfr;draw()});
  doc.querySelectorAll('[data-fldt]').forEach(b=>b.onclick=()=>{keepT();S.dth=b.dataset.fldt;draw();Array.from(document.body.classList).forEach(c=>c.startsWith('dth-')&&document.body.classList.remove(c));if(S.dth)document.body.classList.add('dth-'+S.dth)});
  doc.querySelectorAll('[data-flan]').forEach(b=>b.onclick=()=>{keepT();S.dan=b.dataset.flan;draw();flPrev()});
  const flPrev=()=>{const bx=Array.from($('#flprev').querySelectorAll('[data-fls]')).map(b=>({b,s:+b.dataset.fls,v:flRnd(+b.dataset.fls)}));flAnimBoxes(bx,flOk(FL_ANIM,S.dan))};
  $('#flroll').onclick=()=>{keepT();flPrev()};
  const wh=$('#flh');if(wh&&gm)wh.onchange=()=>{keepT();const c2=flOf(S.who);if(c2){S.b=c2.b;S.t=c2.t;S.fx=c2.fx;S.fr=c2.fr}else{S.b='';S.t='';S.fx='';S.fr=''}draw()};
  $('#flcx').onclick=()=>{$('#modal').innerHTML='';flApply()};
  $('#flok').onclick=async()=>{keepT();if(!S.who)return alert('Set your handle first (Profile).');
   try{await db.doc('profiles/'+pid(S.who)).update({name:S.who,flair:{b:S.b,t:S.t.trim(),fx:S.fx,fr:S.fr}});
    prefs={...prefs,dth:S.dth,dan:S.dan,flv:S.flv};await savePrefs();$('#modal').innerHTML='';flApply();render()}catch(x){alert('Could not save: '+(x.message||x.code))}}};
 draw()}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#setFlair')){try{moreToggle(false)}catch(x){}flairModal()}});
flWatch();

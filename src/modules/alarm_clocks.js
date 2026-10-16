// ---- Alarm level for a run (GM sets it, everyone sees it) and countdown clocks (the GM fills them in as the story moves)
const ALM=[['Quiet','🟢','#39ff14','Nobody is looking for you.'],['Suspicious','🟡','#ffd23a','Something looks off. Eyes are turning your way.'],['Alert','🟠','#ff8a1a','Security knows. They are searching for you.'],['Lockdown','🔴','#ff2d2d','The place is sealed and reinforcements are on the way.']];
let almD={lvl:0,label:'',note:'',peak:0,hist:[]},almFirst=true,rtBoot=Date.now();
const almClean=d=>{d=d||{};const l=Math.max(0,Math.min(3,Math.round(+d.lvl)||0));return{lvl:l,label:String(d.label||'').slice(0,80),note:String(d.note||'').slice(0,300),peak:Math.max(l,Math.min(3,Math.round(+d.peak)||0)),hist:Array.isArray(d.hist)?d.hist.slice(-12):[],by:d.by||'',at:+d.at||0}};
function rtBanner(a1,a2,a3,col,ms){let b=$('#alban');if(!b){b=document.createElement('div');b.id='alban';b.setAttribute('role','status');b.setAttribute('aria-live','polite');document.body.appendChild(b)}
 b.style.setProperty('--alc',col||'#ff8a1a');b.className='';b.innerHTML=`<div class="a1">${esc(a1)}</div><div class="a2">${esc(a2)}</div>${a3?`<div class="a3">${esc(a3)}</div>`:''}`;void b.offsetWidth;b.className='on';clearTimeout(b._t);b._t=setTimeout(()=>{b.className=''},ms||5200)}
function rtFlash(col){if(reducedMo()||(prefs.atm||'full')==='off')return;const f=$('#alfx');if(!f)return;f.style.setProperty('--alc',col||'#ff2d2d');f.classList.remove('pop');void f.offsetWidth;f.classList.add('pop');setTimeout(()=>f.classList.remove('pop'),1100)}
function almLoad(d){const old=almD;almD=almClean(d);almDraw();
 if(!almFirst&&old.lvl!==almD.lvl&&Date.now()-rtBoot>4000){const n=almD.lvl,L=ALM[n];rtBanner(n===0?'ALL CLEAR':n>old.lvl?'ALARM RAISED':'ALARM LOWERED',n===0?'🟢 STAND DOWN':L[1]+' '+L[0].toUpperCase(),[almD.label,almD.note].filter(Boolean).join(' — '),L[2],6000);rtFlash(L[2])}
 almFirst=false;tickLast='';try{drawTick()}catch(e){}if(board==='__clk'&&$('#clkroot')&&!$('#modal').innerHTML)clkDraw()}
function almDraw(){const el=$('#alm'),fx=$('#alfx'),L=ALM[almD.lvl];
 const ev=$('#evc');if(ev){ev.className=isOwner?'on':'';ev.textContent='🎲 Event'}
 if(fx){fx.className='l'+almD.lvl+((prefs.atm||'full')==='off'?' off':'');fx.style.setProperty('--alc',L[2])}
 document.body.dataset.alm=almD.lvl;if(!el)return;
 if(!almD.lvl&&!isOwner){el.className='';el.innerHTML='';return}
 el.className='on'+(almD.lvl?' lv'+almD.lvl:'')+(isOwner?' gm':'');el.style.setProperty('--alc',L[2]);
 el.innerHTML=almD.lvl?`${L[1]} <b>${esc(L[0].toUpperCase())}</b>${almD.label?` <span class="meta">·</span> ${esc(almD.label)}`:''}`:'<span class="meta">🚨 Alarm: Quiet</span>';
 el.title=(almD.lvl?L[0]+': '+L[3]+(almD.note?'\n'+almD.note:''):'No alarm is up.')+(isOwner?'\nClick to change the alarm level.':'\nClick for details.')}
function almModal(){const L=ALM[almD.lvl];
 if(!isOwner){$('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🚨 ALARM LEVEL</h2><div style="border:2px solid ${L[2]};padding:10px 12px;margin:6px 0"><div style="font-size:18px;color:${L[2]}"><b>${L[1]} ${esc(L[0].toUpperCase())}</b>${almD.label?' · '+esc(almD.label):''}</div><div class="meta" style="margin-top:4px">${esc(L[3])}</div>${almD.note?`<p style="margin:8px 0 0">${esc(almD.note)}</p>`:''}</div><div style="margin-top:10px"><button class="btn" id="alx">Close</button></div></div></div>`;$('#alx').onclick=()=>{$('#modal').innerHTML=''};return}
 const hist=(almD.hist||[]).slice().reverse().slice(0,6);
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🚨 ALARM LEVEL</h2><div class="hint">Raise the alarm when a run goes loud. Everyone sees the level, the place and your note at the top of the screen, and the screen edges tint.</div>
 <label>WHERE <span class="meta">(optional)</span></label><input id="alp" maxlength="80" value="${esc(almD.label)}" placeholder="e.g. Arasaka Tower, floor 40">
 <div class="almg" role="radiogroup" aria-label="Alarm level">${ALM.map((a,i)=>`<button type="button" class="almb${i===almD.lvl?' on':''}" role="radio" aria-checked="${i===almD.lvl}" data-al="${i}" style="--alc:${a[2]}"><span>${a[1]}</span><b>${a[0]}</b><i>${esc(a[3])}</i></button>`).join('')}</div>
 <label>NOTE FOR THE TABLE <span class="meta">(optional, everyone sees it)</span></label><textarea id="aln" rows="2" maxlength="300" placeholder="e.g. Guards are sweeping the lower floors">${esc(almD.note)}</textarea>
 <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grn" id="alu">Update the text</button><button class="btn" id="alq">Stand down (Quiet)</button><button class="btn mg" id="ale">🏁 End the run…</button><button class="btn" id="alx">Close</button></div>
 <div class="meta" style="margin-top:8px">Highest this run: <b style="color:${ALM[almD.peak][2]}">${ALM[almD.peak][1]} ${ALM[almD.peak][0]}</b>. Pressing <b>End the run</b> offers to add Heat for it, then resets the alarm.</div>
 ${hist.length?`<div class="meta" style="margin-top:6px">RECENT: ${hist.map(h=>ALM[h.l][1]+' '+esc(htWhen(h.t))).join(' · ')}</div>`:''}</div></div>`;
 $('#alx').onclick=()=>{$('#modal').innerHTML=''};
 const vals=()=>({label:$('#alp').value.trim(),note:$('#aln').value.trim()});
 $('#modal').querySelectorAll('[data-al]').forEach(b=>b.onclick=async()=>{await almSet(+b.dataset.al,vals());almModal()});
 $('#alu').onclick=async()=>{await almSet(almD.lvl,vals(),true);almModal()};
 $('#alq').onclick=async()=>{await almSet(0,vals());almModal()};
 $('#ale').onclick=almEndRun}
async function almSet(lvl,v,textOnly){const prev=JSON.parse(JSON.stringify(almD)),hist=(prev.hist||[]).slice();if(lvl!==prev.lvl)hist.push({l:lvl,t:Date.now()});
 const nv={lvl,label:v.label||'',note:v.note||'',peak:Math.max(prev.peak||0,lvl),hist:hist.slice(-12),by:handle||'GM',at:Date.now()};
 try{await db.doc('meta/alarm').set(nv);if(!textOnly)undoBar('Alarm: '+ALM[lvl][0]+'.',()=>db.doc('meta/alarm').set(prev))}catch(e){alert('Could not change the alarm: '+(e.message||e.code))}}
function almEndRun(){const pk=almD.peak||0,sug=[0,0,1,2][pk],pcs=htPcs();
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🏁 END THE RUN</h2><div class="hint">The highest alarm this run was <b style="color:${ALM[pk][2]}">${ALM[pk][1]} ${ALM[pk][0]}</b>. Add Heat to the runners who were on it, then the alarm goes back to Quiet.</div>
 <div class="two"><div><label>HEAT TO ADD (0 to 3)</label><input id="aeh" type="number" min="0" max="3" value="${sug}"></div><div><label>WHY (SHOWN IN THE HEAT HISTORY)</label><input id="aew" maxlength="100" value="Run ended at ${ALM[pk][0]}"></div></div>
 <label>WHO WAS ON THE RUN</label><div style="max-height:220px;overflow:auto">${pcs.length?pcs.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:2px 0"><input type="checkbox" data-ep="${esc(s.id)}" checked style="width:auto"> ${esc(s.name||'Character')} <span class="meta">Heat ${htVal(s.id,'heat')}</span></label>`).join(''):'<div class="meta">// NO CHARACTERS.</div>'}</div>
 <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grn" id="aeg">Add Heat and reset the alarm</button><button class="btn" id="aen">Reset the alarm only</button><button class="btn mg" id="aex">Cancel</button></div></div></div>`;
 $('#aex').onclick=almModal;
 const reset=async()=>{const prev=JSON.parse(JSON.stringify(almD));await db.doc('meta/alarm').set({lvl:0,label:'',note:'',peak:0,hist:[],by:handle||'GM',at:Date.now()});return prev};
 $('#aen').onclick=async()=>{try{const prev=await reset();$('#modal').innerHTML='';undoBar('Run ended. Alarm reset.',()=>db.doc('meta/alarm').set(prev))}catch(e){alert('Could not reset: '+(e.message||e.code))}};
 $('#aeg').onclick=async()=>{const n=Math.max(0,Math.min(3,Math.round(+$('#aeh').value)||0)),why=$('#aew').value.trim(),ids=[...$('#modal').querySelectorAll('[data-ep]:checked')].map(c=>c.dataset.ep);
  try{const done=[];if(n)for(const id of ids){const s=pcs.find(x=>x.id===id);if(!s)continue;const u=await htWrite(id,'heat','pc',htVal(id,'heat')+n,why,{name:s.name},true);if(u)done.push(u)}
   const prev=await reset();$('#modal').innerHTML='';undoBar('Run ended.'+(done.length?' Heat +'+n+' for '+done.length+' runner'+(done.length==1?'':'s')+'.':''),async()=>{for(const u of done)await db.doc('heat/'+u.id).update(u.rb);await db.doc('meta/alarm').set(prev)})}catch(e){alert('Could not finish: '+(e.message||e.code))}}}
// ---------- countdown clocks
const CLK_KINDS={danger:['⚠ Danger','Bad when it fills'],good:['📈 Progress','Good when it fills'],neutral:['⏳ Timer','Just a countdown']};
const CLK_TPL=[['Security response arrives',6,'danger','Guards are on the way.','Heavily armed response team storms the scene.'],['Corp trace completes',4,'danger','Someone is tracing the intrusion.','The corp has your location and a hit team is dispatched.'],['The law closes in',8,'danger','Lone Star is asking questions.','Warrants, roadblocks and a very bad week.'],['The deal goes bad',4,'danger','The Johnson is losing patience.','The offer is withdrawn and the contact turns hostile.'],['The ritual completes',6,'danger','Something is being summoned.','The spirit breaks free of the circle.'],['Convoy arrives',6,'neutral','The target is on its way.',''],['The building comes down',8,'danger','Structural failure spreading.','The floor gives way.'],['Hack in progress',6,'good','The decker is working the host.',''],['Escape route is clear',4,'good','Clearing the way out.',''],['Gang war boils over',8,'danger','Tension between the crews is rising.','Open fighting in the streets.'],['Dawn breaks',6,'neutral','Daylight is coming and so are the crowds.',''],['Reinforcements arrive',4,'danger','More of them are coming.','Twice as many enemies on the scene.'],['The toxic spill spreads',8,'danger','The cloud is growing.','The whole block is contaminated.'],['Medical emergency',4,'danger','Someone is bleeding out.','The patient dies without a medic.'],['Training or research',8,'good','Slow, steady work.','']];
const clkAll=()=>(pm.clocks||[]).filter(c=>c&&!c.deleted&&c.name&&(isOwner||!c.hide));
const clkLive=()=>clkAll().filter(c=>!c.done).sort((a,b)=>(+a.order||0)-(+b.order||0)||(a.ts||0)-(b.ts||0));
const clkFull=c=>(c.fill|0)>=(c.segs|0);
function clkColor(c){const f=(c.fill|0)/Math.max(1,c.segs|0);if(c.kind==='good')return clkFull(c)?'#39ff14':'#00e5ff';if(c.kind==='neutral')return clkFull(c)?'#ffb000':'#b86bff';return f>=1?'#ff2d2d':f>.75?'#ff5a1a':f>.5?'#ff9a1a':'#ffd23a'}
function clkSvg(c,size,live){const n=Math.max(2,Math.min(12,c.segs|0)),f=Math.max(0,Math.min(n,c.fill|0)),col=clkColor(c),R=46;let s=`<svg viewBox="-50 -50 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(c.name)}: ${f} of ${n}"><circle r="49" fill="#06080d" stroke="${f>=n?col:'var(--line)'}" stroke-width="1.5"/>`;
 for(let i=0;i<n;i++){const a0=-Math.PI/2+i*2*Math.PI/n+.03,a1=-Math.PI/2+(i+1)*2*Math.PI/n-.03,x0=R*Math.cos(a0),y0=R*Math.sin(a0),x1=R*Math.cos(a1),y1=R*Math.sin(a1);
  s+=`<path d="M0 0L${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${i<f?col:'rgba(255,255,255,.07)'}" stroke="rgba(0,0,0,.6)" stroke-width="1"${live?` data-seg="${i+1}" style="cursor:pointer"`:''}/>`}
 return s+'</svg>'}
function clkCard(c,gm){const full=clkFull(c),k=CLK_KINDS[c.kind]||CLK_KINDS.danger;
 return `<div class="clkc ${esc(c.kind||'danger')}${full?' full':''}" data-clk="${esc(c.id)}"><div class="clkp">${clkSvg(c,gm?116:104,gm&&!c.done)}</div><div class="clkbd"><b>${esc(c.name)}</b>${c.hide?' <span class="tag" style="color:#000;background:var(--am)">GM only</span>':''}${c.done?' <span class="tag">finished</span>':''}<div class="meta">${c.fill|0}/${c.segs|0} · ${esc(k[0])}</div>${c.note?`<div class="clkn">${esc(c.note)}</div>`:''}
  ${full&&c.secret?`<div class="clkx">${c.kind==='good'?'✅':'⚠'} <b>It filled:</b> ${esc(c.secret)}</div>`:''}${gm&&c.secret&&!full?`<div class="meta" style="margin-top:3px">GM only, when it fills: ${esc(c.secret)}</div>`:''}
  ${gm?`<div class="clkbt"><button class="btn sm" data-ck="-" aria-label="Take one segment off ${esc(c.name)}">−</button><button class="btn sm grn" data-ck="+" aria-label="Fill one more segment of ${esc(c.name)}">+1</button><button class="btn sm" data-ck="e">✎</button><button class="btn sm" data-ck="d">${c.done?'Reopen':'✓ Done'}</button><button class="btn sm mg" data-ck="x" aria-label="Delete ${esc(c.name)}">🗑</button></div>`:''}</div></div>`}
function clkDraw(){const r=$('#clkroot');if(!r)return;const gm=isOwner,live=clkLive(),done=clkAll().filter(c=>c.done).sort((a,b)=>(b.ts||0)-(a.ts||0));
 const L=ALM[almD.lvl];
 r.innerHTML=`<div class="bar"><h2>⏱ CLOCKS</h2>${gm?'<button class="btn grn" id="clkn">+ New clock</button>':''}</div>
 <div class="shsec" style="margin:0 0 12px;border-color:${L[2]}"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="color:${L[2]};font-size:15px">🚨 ${L[1]} ${esc(L[0].toUpperCase())}</b>${almD.label?`<span>${esc(almD.label)}</span>`:''}<span class="meta" style="flex:1">${esc(almD.note||L[3])}</span>${gm?'<button class="btn sm" id="clka">Change the alarm</button>':''}</div></div>
 <div class="hint" style="margin-bottom:10px">Clocks show how close something is to happening. <b>Danger</b> clocks are bad when they fill, <b>progress</b> clocks are good. The GM fills them in as the story moves.</div>
 ${live.length?`<div class="clkg">${live.map(c=>clkCard(c,gm)).join('')}</div>`:'<div class="empty">// NO CLOCKS RUNNING.</div>'}
 ${done.length?`<details style="margin-top:14px"><summary style="cursor:pointer;color:var(--cy)">Finished clocks (${done.length})</summary><div class="clkg" style="margin-top:8px">${done.map(c=>clkCard(c,gm)).join('')}</div></details>`:''}
 ${typeof evFeedHtml==='function'?evFeedHtml():''}`;
 const a=$('#clka');if(a)a.onclick=almModal;const n=$('#clkn');if(n)n.onclick=()=>clkForm('');
 if(typeof evFeedBind==='function')evFeedBind()}
function clkView(){$('#view').innerHTML='<div id="clkroot"></div>';clkDraw()}
async function clkSet(id,fill){const c=(pm.clocks||[]).find(x=>x.id===id);if(!c||!isOwner)return;fill=Math.max(0,Math.min(c.segs|0,fill));if(fill===(c.fill|0))return;const old=c.fill|0;c.fill=fill;clkDraw();
 try{await db.doc('clocks/'+id).update({fill,ts2:Date.now(),...(fill>=(c.segs|0)?{fullAt:Date.now()}:{})});if(fill>=(c.segs|0))undoBar('"'+c.name+'" is full.',()=>db.doc('clocks/'+id).update({fill:old}))}catch(e){c.fill=old;clkDraw();alert('Could not save: '+(e.message||e.code))}}
document.addEventListener('click',e=>{const seg=e.target.closest&&e.target.closest('#clkroot [data-seg]');if(seg&&isOwner){const card=seg.closest('[data-clk]'),c=(pm.clocks||[]).find(x=>x.id===card.dataset.clk);if(c){const n=+seg.dataset.seg;clkSet(c.id,n===(c.fill|0)?n-1:n)}return}
 const b=e.target.closest&&e.target.closest('#clkroot [data-ck]');if(!b||!isOwner)return;const card=b.closest('[data-clk]'),c=(pm.clocks||[]).find(x=>x.id===card.dataset.clk);if(!c)return;const k=b.dataset.ck;
 if(k==='+')clkSet(c.id,(c.fill|0)+1);else if(k==='-')clkSet(c.id,(c.fill|0)-1);else if(k==='e')clkForm(c.id);
 else if(k==='d')db.doc('clocks/'+c.id).update({done:!c.done}).catch(er=>alert('Could not save: '+(er.message||er.code)));
 else if(k==='x')ask('Delete the clock "'+c.name+'"?','Delete').then(ok=>{if(ok)db.doc('clocks/'+c.id).update({deleted:true,delAt:Date.now(),delBy:handle||'GM'}).then(()=>undoBar('Clock deleted.',()=>db.doc('clocks/'+c.id).update({deleted:false}))).catch(er=>alert('Could not delete: '+(er.message||er.code)))})});
function clkForm(id){const c=id?(pm.clocks||[]).find(x=>x.id===id):null;
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${c?'EDIT CLOCK':'NEW CLOCK'}</h2>${c?'':`<label>START FROM A TEMPLATE <span class="meta">(optional)</span></label><select id="ckt"><option value="">— choose —</option>${CLK_TPL.map((t,i)=>`<option value="${i}">${esc(t[0])} (${t[1]})</option>`).join('')}</select>`}
 <label>NAME</label><input id="ckn" maxlength="60" value="${esc(c?c.name:'')}" placeholder="e.g. Security response arrives">
 <div class="two"><div><label>SEGMENTS</label><select id="cks">${[3,4,5,6,8,10,12].map(n=>`<option ${c&&c.segs===n?'selected':''}>${n}</option>`).join('')}</select></div><div><label>KIND</label><select id="ckk">${Object.entries(CLK_KINDS).map(([k,v])=>`<option value="${k}" ${c&&c.kind===k?'selected':''}>${esc(v[0])} — ${esc(v[1])}</option>`).join('')}</select></div></div>
 <label>FILLED SO FAR</label><input id="ckf" type="number" min="0" max="12" value="${c?c.fill|0:0}">
 <label>WHAT THE TABLE SEES <span class="meta">(optional)</span></label><input id="ckd" maxlength="160" value="${esc(c?c.note||'':'')}" placeholder="e.g. Guards are on the way">
 <label>WHEN IT FILLS <span class="meta">(only you see this until the clock is full)</span></label><input id="ckx" maxlength="200" value="${esc(c?c.secret||'':'')}" placeholder="e.g. A heavy response team storms the lobby">
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="ckh" style="width:auto" ${c&&c.hide?'checked':''}> Hide this clock from the players (GM only)</label>
 <div style="margin-top:12px"><button class="btn grn" id="cks2">Save</button> <button class="btn" id="ckc">Cancel</button></div></div></div>`;
 if($('#ckt'))$('#ckt').onchange=e=>{const t=CLK_TPL[+e.target.value];if(!t)return;$('#ckn').value=t[0];$('#cks').value=String(t[1]);$('#ckk').value=t[2];$('#ckd').value=t[3];$('#ckx').value=t[4]};
 $('#ckc').onclick=()=>{$('#modal').innerHTML=''};
 $('#cks2').onclick=async()=>{const name=$('#ckn').value.trim();if(!name)return alert('Give the clock a name.');const segs=+$('#cks').value,fill=Math.max(0,Math.min(segs,Math.round(+$('#ckf').value)||0));
  const d={name,segs,kind:$('#ckk').value,fill,note:$('#ckd').value.trim(),secret:$('#ckx').value.trim(),hide:$('#ckh').checked};
  try{if(c)await db.doc('clocks/'+c.id).update({...d,ts2:Date.now()});else{await db.collection('clocks').add({...d,done:false,by:handle||'GM',ts:Date.now(),order:Date.now()})}$('#modal').innerHTML='';clkChanged(true)}catch(e){alert('Could not save: '+(e.message||e.code))}}}
let clkPrev=null;
function clkChanged(quiet){const L=clkLive(),m={};L.forEach(c=>m[c.id]=c.fill|0);
 if(clkPrev&&!quiet&&Date.now()-rtBoot>4000)L.forEach(c=>{const o=clkPrev[c.id];if(o===undefined||(c.fill|0)<=o)return;const full=clkFull(c);if(isOwner&&!full)return;
  rtBanner(full?'⏱ CLOCK FILLED':'⏱ CLOCK TICKS',c.name,full?(c.secret||(c.kind==='good'?'It is done.':'Time is up.')):(c.fill|0)+' of '+(c.segs|0),clkColor(c),full?7000:4500);if(full)rtFlash(clkColor(c))});
 clkPrev=m;clkChip();tickLast='';try{drawTick()}catch(e){}
 if(board==='__clk'&&$('#clkroot')&&!$('#modal').innerHTML)clkDraw();if(board==='__home'&&$('#homeroot')&&!$('#modal').innerHTML&&!(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)))render()}
function clkChip(){const el=$('#clkc');if(!el)return;const L=clkLive();if(!L.length){el.className='';el.innerHTML='';return}
 const hot=L.some(c=>c.kind==='danger'&&(c.fill|0)>=(c.segs|0)-1&&(c.segs|0)>=3);el.className='on'+(hot?' hot':'');el.innerHTML='⏱ '+L.length+' <span class="meta">clock'+(L.length==1?'':'s')+'</span>';el.title=L.map(c=>c.name+' '+(c.fill|0)+'/'+(c.segs|0)).join('\n')+'\nClick to open the clocks.'}
function clkHomeHtml(){const L=clkLive(),a=almD.lvl;if(!L.length&&!a)return '';
 return (a?`<div class="row" style="cursor:default;border-color:${ALM[a][2]}"><b style="color:${ALM[a][2]}">🚨 ${ALM[a][1]} ${esc(ALM[a][0].toUpperCase())}</b>${almD.label?' · '+esc(almD.label):''}<div class="meta">${esc(almD.note||ALM[a][3])}</div></div>`:'')+(L.length?`<div class="clkm">${L.slice(0,8).map(c=>`<a data-hm="b|__clk" class="clkmi" title="${esc(c.name)} ${c.fill|0}/${c.segs|0}">${clkSvg(c,54)}<span>${esc(c.name)}</span></a>`).join('')}</div>`:'')+`<div style="margin-top:6px"><button class="btn sm" data-hm="b|__clk">Open clocks</button></div>`}
// ---------- the scrolling banner picks these up
function rtTickItems(){const out=[];try{if(almD.lvl){const L=ALM[almD.lvl];out.push(`<a data-rt="clk" style="color:${L[2]};cursor:pointer">🚨 ALARM · ${esc(L[0].toUpperCase())}${almD.label?' — '+esc(almD.label):''}</a>`)}
 clkLive().filter(c=>(c.fill|0)>0&&!clkFull(c)).sort((a,b)=>(b.fill/b.segs)-(a.fill/a.segs)).slice(0,3).forEach(c=>out.push(`<a data-rt="clk" style="color:${clkColor(c)};cursor:pointer">⏱ CLOCK · ${esc(c.name.toUpperCase())} ${c.fill|0}/${c.segs|0}</a>`));
 if(typeof evTickItems==='function')out.push(...evTickItems())}catch(e){}return out}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#tickt [data-rt]');if(!a)return;board='__clk';thread=null;query='';render()});
['alm','clkc'].forEach(id=>document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#'+id);if(!t)return;if(id==='alm')almModal();else{board='__clk';thread=null;query='';render()}}));
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target&&(e.target.id==='alm'||e.target.id==='clkc')){e.preventDefault();e.target.click()}});
(function(){const st=document.createElement('style');st.id='rtcss';st.textContent=`
#alm,#clkc,#evc{display:none;border:1px solid var(--alc,var(--am));color:var(--alc,var(--am));padding:1px 8px;font-size:12px;cursor:pointer;max-width:100%}#alm.on,#clkc.on,#evc.on{display:inline-block}
#alm.lv2{animation:alchip 2.4s ease-in-out infinite}#alm.lv3{animation:alchip 1s ease-in-out infinite;background:rgba(255,45,45,.16)}#clkc{--alc:var(--am)}#clkc.hot{--alc:#ff4d4d;animation:alchip 1.6s ease-in-out infinite}#evc{--alc:var(--mg)}
@keyframes alchip{50%{box-shadow:0 0 10px var(--alc)}}
#alfx{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .9s}#alfx.l1{opacity:1;box-shadow:inset 0 0 90px rgba(255,210,58,.14)}#alfx.l2{opacity:1;box-shadow:inset 0 0 130px rgba(255,138,26,.28);animation:alpul 2.8s ease-in-out infinite}#alfx.l3{opacity:1;box-shadow:inset 0 0 180px rgba(255,30,30,.46);animation:alpul 1.2s ease-in-out infinite}#alfx.off{opacity:0!important;animation:none!important}
@keyframes alpul{50%{filter:brightness(.55)}}
#alfx.pop{animation:alpop 1.05s ease-out}@keyframes alpop{0%{background:var(--alc);opacity:.0}12%{background:var(--alc);opacity:.34}100%{opacity:1}}
#alban{position:fixed;left:50%;top:13%;transform:translateX(-50%);z-index:99998;pointer-events:none;text-align:center;padding:12px 28px;background:rgba(6,8,13,.9);border:2px solid var(--alc);box-shadow:0 0 26px var(--alc);opacity:0;max-width:92vw}#alban.on{animation:atmban 5.2s ease both}
#alban .a1{font-size:11px;letter-spacing:.3em;color:var(--alc)}#alban .a2{font-family:Orbitron,Impact,sans-serif;font-size:clamp(18px,4vw,30px);letter-spacing:.1em;color:var(--tx);text-shadow:0 0 10px var(--alc);margin:4px 0}#alban .a3{font-size:12px;color:var(--dim)}
.almg{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:8px 0}.almb{display:flex;flex-direction:column;gap:2px;align-items:flex-start;text-align:left;border:2px solid var(--line);background:var(--bg,#0a0a12);color:var(--tx);padding:8px 10px;cursor:pointer;font:inherit}.almb span{font-size:20px}.almb i{font-style:normal;font-size:11px;color:var(--dim)}.almb.on{border-color:var(--alc);box-shadow:0 0 12px var(--alc)}.almb:focus-visible{outline:2px solid var(--am)}
.clkg{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}.clkc{display:flex;gap:10px;border:1px solid var(--line);padding:8px;background:rgba(0,0,0,.25)}.clkc.full.danger{border-color:#ff2d2d;animation:alchip 1.6s ease-in-out infinite;--alc:#ff2d2d}.clkc.full.good{border-color:#39ff14}.clkp{flex:none}.clkbd{min-width:0;flex:1}.clkn{margin:3px 0;color:var(--tx)}.clkx{margin:4px 0;color:var(--am)}.clkbt{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
.clkm{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}.clkmi{display:flex;flex-direction:column;align-items:center;gap:2px;width:78px;text-align:center;cursor:pointer;font-size:11px;color:var(--dim)}
@media (prefers-reduced-motion:reduce){#alfx,#alm,#clkc,.clkc{animation:none!important}#alban.on{animation:none;opacity:1}}`;document.head.appendChild(st);
 if(!document.getElementById('alfx')){const f=document.createElement('div');f.id='alfx';document.body.appendChild(f)}})();

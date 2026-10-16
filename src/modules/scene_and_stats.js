// ---- scene tracker: the GM sets where the party is, everyone sees it in the top bar
let scnD={},scnFirst=true;
function scnDraw(){try{atmApply()}catch(e){}const el=$('#scn');if(!el)return;const d=scnD||{},has=!!(d.loc||d.time||d.wx);
 if(!has&&!isOwner){el.className='';el.innerHTML='';return}
 el.className='on'+(isOwner?' gm':'');
 el.innerHTML=has?[d.loc?'📍 '+esc(d.loc):'',d.time?'🕒 '+esc(d.time):'',d.wx?'🌦 '+esc(d.wx):''].filter(Boolean).join(' <span class="meta">·</span> '):'<span class="meta">📍 Set the scene</span>';
 el.title=(d.note?d.note+'\n':'')+(isOwner?'Click to change the scene':'Where the party is right now (set by the GM). Click for details.')}
function scnLoad(d){const old=scnD||{};scnD=d||{};scnDraw();
 if(!scnFirst&&(old.loc!==scnD.loc||old.time!==scnD.time||old.wx!==scnD.wx)){const el=$('#scn');if(el){el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),4000)}}
 try{atmArrive(old,scnD,scnFirst)}catch(e){}scnFirst=false}
const SCN_WX=[['Clear skies',''],['Overcast',''],['Light drizzle','rain'],['Steady rain','rain'],['Heavy rain','rain'],['Thunderstorm','storm'],['Acid rain','acid'],['Fog','fog'],['Smog advisory','smog'],['Dust and haze','smog'],['Light snow','snow'],['Windy',''],['Heat wave',''],['Bitter cold','']];
const SCN_TIME=['Small hours (3:00 AM)','Pre-dawn (4:30 AM)','Dawn (6:00 AM)','Morning (9:00 AM)','Midday (12:00 PM)','Afternoon (3:00 PM)','Dusk (6:30 PM)','Evening (8:30 PM)','Night (11:00 PM)','Midnight (12:00 AM)'];
function scnModal(){const d=scnD||{};
 if(!isOwner){if(!(d.loc||d.time||d.wx||d.note))return;
  $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>📍 CURRENT SCENE</h2>${d.loc?`<p><b>Where:</b> ${esc(d.loc)}</p>`:''}${d.time?`<p><b>When:</b> ${esc(d.time)}</p>`:''}${d.wx?`<p><b>Weather:</b> ${esc(d.wx)}</p>`:''}${d.note?`<p>${esc(d.note)}</p>`:''}${typeof dsLink==='function'?dsLink(d.loc):''}<div class="meta">Set by ${esc(d.by||'the GM')}</div><div style="margin-top:12px"><button class="btn mg" id="scx">Close</button></div></div></div>`;
  $('#scx').onclick=()=>{$('#modal').innerHTML=''};return}
 const pre=()=>(pm.scenepresets||[]).filter(x=>!x.deleted&&x.name).sort((a,b)=>String(a.name).localeCompare(b.name)),preOpts=sel=>pre().length?pre().map(x=>`<option value="${esc(x.id)}" ${sel===x.id?'selected':''}>${esc(x.name)}${x.loc?' — '+esc(x.loc):''}</option>`).join(''):'<option value="">(none saved yet)</option>';
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>📍 SET THE SCENE</h2><div class="hint">Everyone sees this in the top bar until you change it. Leave a box empty to hide that part.</div>
 <div style="border:1px solid var(--line);padding:6px 8px;margin:6px 0 8px"><label style="margin-top:0">SCENE PRESETS <span class="meta">saved scenes you can launch with one click (only you see these)</span></label><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select id="scpre" style="flex:1;min-width:160px">${preOpts('')}</select><button class="btn sm grn" id="scpg" type="button">Launch</button><button class="btn sm" id="scpl" type="button">Load into form</button><button class="btn sm" id="scps" type="button">Save as preset</button><button class="btn sm mg" id="scpd" type="button">Delete</button></div></div>
 <label>LOCATION</label><input id="scl" list="dsl" maxlength="80" value="${esc(d.loc||'')}" placeholder="e.g. Redmond Barrens, behind the Stuffer Shack">${typeof dsDatalist==='function'?dsDatalist():''}
 <div class="two"><div><label>TIME</label><input id="sct" maxlength="60" value="${esc(d.time||'')}" placeholder="e.g. Tuesday, 11:40 PM"><div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap"><select id="sctq" style="flex:1;min-width:120px"><option value="">Pick a time of day...</option>${SCN_TIME.map(t=>`<option>${esc(t)}</option>`).join('')}</select><button class="btn sm" id="scnow" type="button">Use the net time</button></div></div><div><label>WEATHER</label><input id="scw" maxlength="60" value="${esc(d.wx||'')}" placeholder="e.g. Heavy rain, acid drizzle"><select id="scwq" style="margin-top:4px;width:100%"><option value="">Pick the weather...</option>${SCN_WX.map(w=>`<option value="${esc(w[0])}">${esc(w[0])}${w[1]?' (adds '+w[1]+' effect)':''}</option>`).join('')}</select></div></div>
 <div class="meta" style="margin:4px 0">Rain, storms, acid rain, fog, smog and snow change the background, and a time of day tints it. You can still type anything you like.</div>
 <label>NOTE FOR THE TABLE (OPTIONAL)</label><textarea id="scn2" rows="3" maxlength="400" placeholder="What the team can see or knows right now">${esc(d.note||'')}</textarea>
 <label>ATMOSPHERE <span class="meta">the background everyone sees</span></label><select id="sca"><option value="auto">Auto (from the district, weather and time)</option><option value="off">Off for this scene</option><option value="matrix">Matrix grid</option><option value="astral">Astral plane</option><option value="alert">Red alert</option></select>
 <div class="two"><div><label>MOOD</label><select id="scm"><option value="auto">Auto (from the district security rating)</option><option value="clean">Clean and corporate</option><option value="neon">Neon streets</option><option value="grit">Grit and grime</option><option value="danger">Danger zone</option><option value="none">None</option></select></div><div><label>BACKDROP PICTURE</label><select id="scp"><option value="">Auto (the district's first picture)</option><option value="none">None</option>${typeof artOpts==='function'?artOpts(d.atmImg):''}${d.atmImg&&d.atmImg!=='none'&&!(typeof artIs==='function'&&artIs(d.atmImg))?`<option value="${esc(d.atmImg)}">Custom picture</option>`:''}</select></div></div><div id="scgal"></div>
 <div style="margin:6px 0"><button type="button" class="btn sm" id="scpu">📎 Upload a custom picture</button><input type="file" id="scpf" accept="image/*" hidden> <span class="meta" id="scpt"></span></div>
 <label><input type="checkbox" id="scas" style="width:auto" ${d.atmSheet?'checked':''}> Also show the atmosphere on character sheets and the dice roller</label>
 <div style="margin-top:12px"><button class="btn grn" id="scs">Set scene</button> <button class="btn mg" id="scc">Clear scene</button> <button class="btn" id="scx">Close</button></div></div></div>`;
 $('#scx').onclick=()=>{$('#modal').innerHTML=''};
 $('#sca').value=d.atm||'auto';$('#scp').value=d.atmImg||'';try{artGallery()}catch(e){}$('#scm').value=d.mood||'auto';
 $('#sctq').onchange=e=>{if(e.target.value){$('#sct').value=e.target.value;e.target.value=''}};$('#scwq').onchange=e=>{if(e.target.value){$('#scw').value=e.target.value;e.target.value=''}};
 $('#scpu').onclick=()=>$('#scpf').click();$('#scpf').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;if(!assets)return alert('Picture upload is not available right now.');$('#scpt').textContent='Uploading...';try{const up=await assets.upload(await shrink(f));const o=document.createElement('option');o.value=up.id;o.textContent='Custom picture';$('#scp').appendChild(o);$('#scp').value=up.id;$('#scpt').textContent='Added.'}catch(e){$('#scpt').textContent='';alert('Upload failed: '+(e.message||e.code))}};
 $('#scnow').onclick=()=>{const c=$('#clk');if(c)$('#sct').value=c.textContent.trim()};
 const cur=()=>({loc:$('#scl').value.trim(),time:$('#sct').value.trim(),wx:$('#scw').value.trim(),note:$('#scn2').value.trim(),atm:$('#sca').value,mood:$('#scm').value,atmImg:$('#scp').value,atmSheet:$('#scas').checked});
 const save=async v=>{const prev=JSON.parse(JSON.stringify(scnD||{}));try{await db.doc('meta/scene').set({...v,by:handle||'GM',at:Date.now()});$('#modal').innerHTML='';undoBar(v.loc||v.time||v.wx||v.note?'Scene changed.':'Scene cleared.',()=>db.doc('meta/scene').set(prev))}catch(e){alert('Could not save the scene: '+(e.message||e.code||e))}};
 $('#scs').onclick=()=>save(cur());
 $('#scc').onclick=()=>save({loc:'',time:'',wx:'',note:'',atm:'auto',mood:'auto',atmImg:'',atmSheet:$('#scas').checked});
 const pf=x=>({loc:x.loc||'',time:x.time||'',wx:x.wx||'',note:x.note||'',atm:x.atm||'auto',mood:x.mood||'auto',atmImg:x.atmImg||'',atmSheet:!!x.atmSheet}),pick=()=>pre().find(x=>x.id===$('#scpre').value);
 $('#scpg').onclick=()=>{const x=pick();if(!x)return alert('Pick a preset first.');save(pf(x))};
 $('#scpl').onclick=()=>{const x=pick();if(!x)return alert('Pick a preset first.');const v=pf(x);$('#scl').value=v.loc;$('#sct').value=v.time;$('#scw').value=v.wx;$('#scn2').value=v.note;$('#sca').value=v.atm;$('#scm').value=v.mood;if(v.atmImg&&![...$('#scp').options].some(o=>o.value===v.atmImg)){const o=document.createElement('option');o.value=v.atmImg;o.textContent='Custom picture';$('#scp').appendChild(o)}$('#scp').value=v.atmImg;$('#scas').checked=v.atmSheet};
 $('#scps').onclick=async()=>{const c=cur();if(!(c.loc||c.time||c.wx||c.note))return alert('Fill in the scene first, then save it as a preset.');const nm=await askText('Name this preset','Preset: '+(c.loc||'Scene'),'Save');if(!nm||!nm.trim())return;const name=nm.trim().slice(0,60),ex=pre().find(x=>String(x.name).toLowerCase()===name.toLowerCase());
  try{if(ex){await db.doc('scenepresets/'+ex.id).update({...c,name,ts:Date.now()});Object.assign(ex,c,{name})}else{const ref=await db.collection('scenepresets').add({...c,name,by:handle||'GM',ts:Date.now()});(pm.scenepresets=pm.scenepresets||[]).push({id:ref.id,...c,name})}
   $('#scpre').innerHTML=preOpts((pre().find(x=>String(x.name)===name)||{}).id)}catch(e){alert('Could not save the preset: '+(e.message||e.code))}};
 $('#scpd').onclick=async()=>{const x=pick();if(!x)return alert('Pick a preset first.');if(!await ask('Delete the preset "'+x.name+'"?','Delete'))return;try{await db.doc('scenepresets/'+x.id).update({deleted:true});x.deleted=true;$('#scpre').innerHTML=preOpts('');undoBar('Preset deleted.',async()=>{await db.doc('scenepresets/'+x.id).update({deleted:false});x.deleted=false})}catch(e){alert('Could not delete: '+(e.message||e.code))}}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#scn');if(t)scnModal()});
// ---- table stats: roll streaks and the scoreboard (built from the shared roll log)
let stReset=0,stAll=false;
function stParse(tx){const t=String(tx||'');
 if(t.startsWith('💥')){const m=t.match(/→ \*\*(\d+)\*\* total damage/),n=t.match(/^💥 \*\*(.+?) damage\*\*/);return m?{k:'dmg',v:+m[1],n:n?n[1]:'weapon'}:null}
 if(t.startsWith('🩸')){const w=t.match(/\+(\d+) wound/);return{k:'hit',w:w?+w[1]:0,inc:/INCAPACITATED/.test(t)}}
 if(!t.startsWith('🎲')||/^🎲 \*\*Fumble d4\*\*/.test(t))return null;
 const tot=t.match(/→ \*\*([^*]+)\*\*/),nums=tot?(tot[1].match(/-?\d+/g)||[]).map(Number):[],tr=t.match(/Trait: ([^|]+)\|/),ti=t.match(/^🎲 \*\*(.+?)\*\*/);
 const crit=/Critical Failure/.test(t),ok=!crit&&/Success/.test(t),raises=(t.match(/with (\d+) Raise/g)||[]).reduce((a,x)=>a+(+x.match(/\d+/)[0]),0);
 const hasV=crit||ok||/Failure/.test(t);
 return{k:'chk',v:nums.length?Math.max(...nums):null,crit,ok,fail:hasV&&!ok&&!crit,raises,ace:!!(tr&&/\+/.test(tr[1].replace(/^\s*-/,''))&&/\d\+\d/.test(tr[1])),t:ti?ti[1]:'',hasV}}
function stCompute(){const cut=stAll?0:stReset,rs=(rollsAll||[]).filter(r=>(r.ts||0)>cut).sort((a,b)=>(a.ts||0)-(b.ts||0)),P={};
 rs.forEach(r=>{const w=String(rollWho(r)).trim(),key=w.toLowerCase(),s=stParse(r.text);if(!s)return;
  const p=P[key]=P[key]||{n:w,rolls:0,ok:0,fail:0,crit:0,raises:0,raiseRolls:0,aces:0,best:null,bestT:'',dmg:null,dmgN:'',wounds:0,down:0,hits:0,cur:0,curK:'',hot:0,cold:0,run:0,runK:''};
  p.n=w;
  if(s.k==='chk'){if(!s.hasV)return;p.rolls++;if(s.crit)p.crit++;else if(s.ok)p.ok++;else p.fail++;if(s.raises){p.raises+=s.raises;p.raiseRolls++}if(s.ace)p.aces++;
   if(s.v!=null&&(p.best==null||s.v>p.best)){p.best=s.v;p.bestT=s.t}
   const k=s.ok?'h':'c';if(p.runK===k)p.run++;else{p.runK=k;p.run=1}if(k==='h')p.hot=Math.max(p.hot,p.run);else p.cold=Math.max(p.cold,p.run);p.cur=p.run;p.curK=k}
  else if(s.k==='dmg'){if(p.dmg==null||s.v>p.dmg){p.dmg=s.v;p.dmgN=s.n}}
  else if(s.k==='hit'){p.hits++;p.wounds+=s.w;if(s.inc)p.down++}});
 return{P:Object.values(P).filter(p=>p.rolls||p.dmg!=null||p.hits),n:rs.length}}
function stModal(){const {P,n}=stCompute(),pc=p=>p.rolls?Math.round(100*p.ok/p.rolls):0,top=(f,min)=>{const L=P.filter(min||(()=>true)).filter(p=>f(p)>0).sort((a,b)=>f(b)-f(a));return L[0]&&(!L[1]||f(L[0])>f(L[1]))?L[0]:(L[0]||null)};
 const aw=[];const add=(i,t,p,txt)=>{if(p)aw.push(`<div class="shsec" style="padding:8px 10px;min-width:170px;flex:1"><div class="meta">${i} ${t}</div><b style="color:var(--am)">${esc(p.n)}</b><div class="meta">${txt}</div></div>`)};
 add('🍀','LUCKIEST',top(p=>pc(p)*1000+p.rolls,p=>p.rolls>=5),'');if(aw.length){const p=top(p=>pc(p)*1000+p.rolls,p=>p.rolls>=5);aw[aw.length-1]=aw[aw.length-1].replace('<div class="meta"></div>',`<div class="meta">${pc(p)}% of ${p.rolls} rolls succeed</div>`)}
 const g=top(p=>p.crit);add('💀','MOST GLITCHES',g,g?g.crit+' critical failure'+(g.crit>1?'s':''):'');
 const r=top(p=>p.raises);add('⬆️','MOST RAISES',r,r?r.raises+' raise'+(r.raises>1?'s':'')+' in '+r.raiseRolls+' roll'+(r.raiseRolls>1?'s':''):'');
 const b=top(p=>p.best||0);add('🎲','HIGHEST ROLL',b,b?b.best+(b.bestT?' on '+esc(b.bestT):''):'');
 const d=top(p=>p.dmg||0);add('💥','BIGGEST HIT',d,d?d.dmg+' damage ('+esc(d.dmgN)+')':'');
 const a=top(p=>p.aces);add('🔥','MOST ACES',a,a?a.aces+' exploding roll'+(a.aces>1?'s':''):'');
 const h=top(p=>p.hot);add('🏆','LONGEST HOT STREAK',h,h?h.hot+' successes in a row':'');
 const c=top(p=>p.cold);add('🧊','LONGEST COLD STREAK',c,c?c.cold+' misses in a row':'');
 const w=top(p=>p.wounds);add('🩸','MOST WOUNDS TAKEN',w,w?w.wounds+' wound'+(w.wounds>1?'s':'')+(w.down?', down '+w.down+'x':''):'');
 const rows=P.slice().sort((x,y)=>y.rolls-x.rolls).map(p=>`<tr><td><b>${esc(p.n)}</b></td><td>${p.rolls}</td><td>${p.rolls?pc(p)+'%':'-'}</td><td>${p.raises}</td><td>${p.crit}</td><td>${p.aces}</td><td>${p.best==null?'-':p.best}</td><td>${p.cur?(p.curK==='h'?'🔥 ':'🧊 ')+p.cur:'-'}</td><td>${p.hot}/${p.cold}</td></tr>`).join('');
 const since=!stAll&&stReset?new Date(stReset).toLocaleString():'the beginning';
 $('#modal').innerHTML=`<div class="modal"><div class="box" style="max-width:860px;width:96vw"><h2>📊 TABLE STATS</h2><div class="hint">Built from the shared roll log. Counting rolls since <b>${esc(since)}</b> (${n} roll${n===1?'':'s'}).</div>
 ${aw.length?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">${aw.join('')}</div>`:'<div class="empty">// NO ROLLS COUNTED YET.</div>'}
 ${rows?`<div style="overflow-x:auto"><table class="shtab"><tr><th>Roller</th><th>Rolls</th><th>Success</th><th>Raises</th><th>Glitches</th><th>Aces</th><th>Best</th><th>Streak now</th><th title="Longest run of successes / misses">Best hot/cold</th></tr>${rows}</table></div>`:''}
 <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label style="display:inline"><input type="checkbox" id="stall" ${stAll?'checked':''} style="width:auto"> include rolls from before the last reset</label>${isOwner?'<button class="btn mg sm" id="strs">Reset scoreboard (GM)</button>':''}<button class="btn" id="stx">Close</button></div></div></div>`;
 $('#stx').onclick=()=>{$('#modal').innerHTML=''};$('#stall').onchange=e=>{stAll=e.target.checked;stModal()};
 const rb=$('#strs');if(rb)rb.onclick=async()=>{if(!await iniAsk('Reset the scoreboard for everyone? The roll log itself is not touched. Stats start counting from now.'))return;try{const pv=stReset||0;await db.doc('meta/score').set({resetAt:Date.now(),by:handle||'GM'});stReset=Date.now();stModal();undoBar('Scoreboard reset.',async()=>{await db.doc('meta/score').set({resetAt:pv,by:handle||'GM'});stReset=pv})}catch(e){alert('Could not reset: '+(e.message||e.code||e))}}}

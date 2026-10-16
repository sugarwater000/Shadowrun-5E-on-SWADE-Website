// ---- Seattle district guide (everyone reads, the GM writes)
const DS_SEC=['AAA','AA','A','B','C','D','E','Z'];
const DS_SECTX={AAA:'Corporate grade. Armed response in minutes and cameras everywhere.',AA:'Heavy security. Trouble is noticed fast.',A:'Well patrolled. Cops arrive quickly.',B:'Patrolled, but not well.',C:'Police show up late, if at all.',D:'Spotty coverage. Mostly left alone.',E:'Almost no law. Neighbors settle things.',Z:'No real law at all. Z-zone rules.'};
const dsCol=r=>({AAA:'#00e5ff',AA:'#00e5ff',A:'#39ff14',B:'#39ff14',C:'#ffb000',D:'#ff7a00',E:'#ff3df0',Z:'#ff3df0'})[r]||'var(--dim)';
const dsImgs=d=>Array.isArray(d&&d.imgs)?d.imgs.filter(x=>typeof x==='string'&&/^[0-9a-f]{8,64}$/i.test(x)):[];
const dsList=()=>(pm.districts||[]).filter(x=>!x.deleted).sort((a,b)=>String(a.name).localeCompare(b.name));
const dsFind=loc=>{loc=String(loc||'').toLowerCase();if(!loc)return null;let best=null;dsList().forEach(d=>{const n=String(d.name||'').toLowerCase();if(n&&loc.includes(n)&&(!best||n.length>String(best.name).length))best=d});return best};
const dsDatalist=()=>`<datalist id="dsl">${dsList().map(d=>`<option value="${esc(d.name)}">`).join('')}</datalist>`;
const dsLink=loc=>{const d=dsFind(loc);return d?`<p><button class="btn sm" data-dsopen="${esc(d.id)}">📖 District guide: ${esc(d.name)}</button></p>`:''};
const DS_SEED=[
 ['Downtown Seattle','AAA','Corporate towers and glass. Everything is watched, and everyone you pass is somebody’s employee.','The core of the city, where the big corps keep their offices and their private security. Easy to get into, hard to get out of with something that is not yours.'],
 ['Bellevue','AA','Quiet money. Gated streets and polite guards.','Rich residential streets and corporate campuses. A good place to meet a Mr. Johnson, a bad place to look out of place.'],
 ['Everett','B','A working port town with a hard edge.','Docks, warehouses and smuggling. Plenty of honest work and plenty of the other kind.'],
 ['Tacoma','C','Heavy industry and old rivalries.','Factories, shipyards and neighborhoods that belong to whoever has held them longest.'],
 ['Renton','C','Tired suburbs and strip malls.','Mixed neighborhoods where gangs, shopkeepers and the occasional corp clinic share a few blocks.'],
 ['Auburn','D','The edge of the sprawl.','Cheap housing, rail yards and not much patrol. Locals mind their own business.'],
 ['Snohomish','C','Farmland on the surface, quieter trades underneath.','Small towns and back roads. Good for lying low, bad if someone knows you are there.'],
 ['Touristville','B','Neon, souvenirs and pickpockets.','Where visitors go to see a safe version of the city. The tourists are watched. The shops behind them are not.'],
 ['Redmond Barrens','Z','Ruins, squatters and gangs.','A burned-out sprawl where the city stopped trying. Everything has a price and nobody asks for ID.'],
 ['Puyallup Barrens','Z','Cheap, crowded and dangerous after dark.','Overcrowded blocks, street markets and turf lines you learn by crossing them.'],
 ['Ork Underground','E','A city under the city.','Tunnels, markets and homes below the streets. Outsiders are tolerated if they behave.'],
 ['Fort Lewis','AA','A military base with its own rules.','Fences, patrols and no sense of humor. You do not wander in by accident.']];
function distView(){const gm=isOwner,L=dsList(),q=(dsQ||'').toLowerCase();const shown=L.filter(d=>!q||(d.name+' '+(d.ctrl||'')+' '+(d.tag||'')).toLowerCase().includes(q));
 $('#view').innerHTML=`<div id="distroot"><div class="bar"><h2>🏙 SEATTLE DISTRICTS</h2><div>${gm?`<button class="btn sm grn" id="dsadd">+ District</button> ${L.length?'':'<button class="btn sm" id="dsseed">Add the standard Seattle districts</button>'}`:''}</div></div>
 <div class="hint" style="margin-bottom:10px">A guide to the city, one card per district, with how well it is policed, who runs it, and what people say about it. ${gm?'You write these. The GM Secret box is never sent to players.':'The GM keeps this up to date as the team learns more.'}</div>
 <input id="dsq" placeholder="Search districts..." value="${esc(dsQ||'')}" style="margin-bottom:10px">
 ${shown.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${shown.map(d=>`<a class="row" data-dso="${esc(d.id)}" style="cursor:pointer;border-left:4px solid ${dsCol(d.sec)}">${dsImgs(d)[0]?`<img src="/_blob/${esc(dsImgs(d)[0])}" loading="lazy" alt="" style="width:100%;height:120px;object-fit:cover;display:block;margin-bottom:6px;border:1px solid var(--line)">`:''}<div style="display:flex;gap:8px;align-items:center"><b style="flex:1">${esc(d.name)}</b><span class="tag" style="color:${dsCol(d.sec)};border-color:${dsCol(d.sec)}" title="${esc(DS_SECTX[d.sec]||'')}">${esc(d.sec||'?')}</span></div>${d.tag?`<div style="font-style:italic;color:var(--dim)">${esc(d.tag)}</div>`:''}<div class="meta">${d.ctrl?'Run by '+esc(d.ctrl):'No one in charge on record'}</div></a>`).join('')}</div>`:`<div class="empty">// ${L.length?'NO MATCHES.':'NO DISTRICTS YET.'}${gm&&!L.length?' ADD ONE, OR ADD THE STANDARD SEATTLE LIST.':''}</div>`}</div>`;
 const q2=$('#dsq');q2.oninput=e=>{dsQ=e.target.value;const p=e.target.selectionStart;distView();const n=$('#dsq');n.focus();n.setSelectionRange(p,p)};
 $('#view').querySelectorAll('[data-dso]').forEach(a=>a.onclick=()=>dsCard(a.dataset.dso));
 const ad=$('#dsadd');if(ad)ad.onclick=()=>dsForm('');const sd=$('#dsseed');if(sd)sd.onclick=dsSeed}
let dsQ='';
async function dsSeed(){if(!isOwner)return;if(!await ask('Add 12 standard Seattle districts to start from? You can edit or remove any of them.','Add them'))return;
 try{for(const [name,sec,tag,desc] of DS_SEED)await db.collection('districts').add({name,sec,ctrl:'',tag,desc,places:'',rumors:'',secret:'',by:handle||'GM',ts:Date.now()})}catch(e){alert('Could not add: '+(e.message||e.code))}}
function dsCard(id){const d=dsList().find(x=>x.id===id);if(!d)return;const sec=(l,t)=>t?`<div style="margin-top:8px"><span class="meta">${l}</span><div style="white-space:pre-wrap">${esc(t)}</div></div>`:'';
 const fac=(pm.heat||[]).find(x=>!x.deleted&&x.kind==='fac'&&d.ctrl&&String(x.name).toLowerCase()===String(d.ctrl).toLowerCase());
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>🏙 ${esc(d.name).toUpperCase()}</h2><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="tag" style="color:${dsCol(d.sec)};border-color:${dsCol(d.sec)}">SECURITY ${esc(d.sec||'?')}</span><span class="meta">${esc(DS_SECTX[d.sec]||'')}</span></div>
 ${dsImgs(d).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${dsImgs(d).map(i=>`<img src="/_blob/${esc(i)}" data-dsz="${esc(i)}" alt="" title="Click to enlarge" style="height:${dsImgs(d).length===1?'200':'110'}px;max-width:100%;object-fit:cover;border:1px solid var(--line);cursor:zoom-in">`).join('')}</div>`:''}${d.tag?`<p style="font-style:italic">${esc(d.tag)}</p>`:''}${d.ctrl?`<p><b>Run by:</b> ${esc(d.ctrl)}${fac?` <button class="btn sm" id="dsfac">Faction profile</button>`:''}</p>`:''}${sec('WHAT PEOPLE KNOW',d.desc)}${sec('PLACES',d.places)}${sec('RUMORS',d.rumors)}
 ${isOwner&&d.secret?`<div style="margin-top:10px;border:1px solid var(--mg);padding:4px 8px"><span class="meta" style="color:var(--mg)">GM SECRET (PLAYERS CANNOT SEE THIS)</span><div style="white-space:pre-wrap">${esc(d.secret)}</div></div>`:''}
 <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${isOwner?`<button class="btn" id="dse">Edit</button><button class="btn grn" id="dsscene">Set as the current scene</button>`:''}<button class="btn mg" id="dsx">Close</button></div></div></div>`;
 $('#dsx').onclick=()=>{$('#modal').innerHTML=''};
 $('#modal').querySelectorAll('[data-dsz]').forEach(i=>i.onclick=()=>dsZoom(i.dataset.dsz));
 const e=$('#dse');if(e)e.onclick=()=>dsForm(id);const f=$('#dsfac');if(f)f.onclick=()=>{$('#modal').innerHTML='';board='__heat';thread=null;render()};
 const sc=$('#dsscene');if(sc)sc.onclick=async()=>{try{const prev=JSON.parse(JSON.stringify(scnD||{}));await db.doc('meta/scene').update({loc:d.name,atm:'auto',atmImg:'',by:handle||'GM'});$('#modal').innerHTML='';undoBar('Scene set to '+d.name+'.',()=>db.doc('meta/scene').set(prev))}catch(x){alert('Could not set the scene: '+(x.message||x.code))}}}
function dsForm(id){const d=id?dsList().find(x=>x.id===id):null;const facs=(pm.heat||[]).filter(x=>!x.deleted&&x.kind==='fac');
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${d?'EDIT DISTRICT':'NEW DISTRICT'}</h2><div class="two"><div><label>NAME</label><input id="dfn" maxlength="60" value="${esc(d?d.name:'')}"></div><div><label>SECURITY RATING</label><select id="dfs">${DS_SEC.map(r=>`<option ${d&&d.sec===r?'selected':''}>${r}</option>`).join('')}</select></div></div>
 <label>RUN BY (A FACTION, GANG OR CORP)</label><input id="dfc" list="dfcl" maxlength="80" value="${esc(d?d.ctrl||'':'')}"><datalist id="dfcl">${facs.map(f=>`<option value="${esc(f.name)}">`).join('')}</datalist>
 <label>ONE-LINE VIBE</label><input id="dft" maxlength="120" value="${esc(d?d.tag||'':'')}" placeholder="e.g. Neon, souvenirs and pickpockets">
 <label>WHAT PEOPLE KNOW (SHOWN TO EVERYONE)</label><textarea id="dfd" rows="3" maxlength="900">${esc(d?d.desc||'':'')}</textarea>
 <div class="two"><div><label>PLACES OF NOTE</label><textarea id="dfp" rows="3" maxlength="500" placeholder="One per line">${esc(d?d.places||'':'')}</textarea></div><div><label>RUMORS</label><textarea id="dfr" rows="3" maxlength="500" placeholder="One per line">${esc(d?d.rumors||'':'')}</textarea></div></div>
 <label>PICTURES</label><div id="dfimgs"></div><div style="margin-top:4px"><button class="btn sm" type="button" id="dfadd">📎 Add pictures</button><input type="file" id="dffi" accept="image/*" multiple hidden> <span class="meta" id="dfup"></span></div>
 <label>GM SECRET (PLAYERS NEVER RECEIVE THIS)</label><textarea id="dfx" rows="3" maxlength="900" style="border-color:var(--mg)">${esc(d?d.secret||'':'')}</textarea>
 <div style="margin-top:12px"><button class="btn grn" id="dfok">Save</button>${d?' <button class="btn mg" id="dfdel">Delete</button>':''} <button class="btn" id="dfcx">Cancel</button></div></div></div>`;
 let imgs=dsImgs(d).slice();
 const drawImgs=()=>{$('#dfimgs').innerHTML=imgs.length?imgs.map((i,k)=>`<span style="display:inline-block;position:relative;margin:0 6px 6px 0"><img src="/_blob/${esc(i)}" alt="" style="height:70px;min-width:70px;object-fit:cover;border:1px solid var(--line);display:block"><button type="button" class="btn sm mg" data-dfrm="${k}" title="Remove this picture" style="position:absolute;top:0;right:0;padding:0 5px">✕</button></span>`).join(''):'<span class="meta">No pictures yet.</span>';$('#dfimgs').querySelectorAll('[data-dfrm]').forEach(b=>b.onclick=()=>{imgs.splice(+b.dataset.dfrm,1);drawImgs()})};drawImgs();
 $('#dfadd').onclick=()=>$('#dffi').click();
 $('#dffi').onchange=async ev=>{const fs=[...ev.target.files].slice(0,8);if(!fs.length)return;if(!assets)return alert('Picture upload is not available right now.');
  for(let n=0;n<fs.length;n++){$('#dfup').textContent='Uploading '+(n+1)+' of '+fs.length+'...';try{const up=await assets.upload(await shrink(fs[n]));imgs.push(up.id);drawImgs()}catch(e){alert('Upload failed: '+(e.message||e.code))}}
  $('#dfup').textContent='';ev.target.value=''};
 $('#dfcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#dfok').onclick=async()=>{const name=$('#dfn').value.trim();if(!name)return alert('Give the district a name.');
  const v={name,sec:$('#dfs').value,ctrl:$('#dfc').value.trim(),tag:$('#dft').value.trim(),desc:$('#dfd').value.trim(),places:$('#dfp').value.trim(),rumors:$('#dfr').value.trim(),secret:$('#dfx').value.trim(),imgs};
  try{if(d){const pv=Object.fromEntries(Object.keys(v).map(k=>[k,d[k]===undefined?(k==='imgs'?[]:''):d[k]])),did=d.id;await db.doc('districts/'+did).update({...v,edited:Date.now()});undoBar('District "'+name+'" saved.',()=>db.doc('districts/'+did).update(pv))}else{const ref=await db.collection('districts').add({...v,by:handle||'GM',ts:Date.now()});undoBar('District "'+name+'" added.',()=>db.doc('districts/'+ref.id).update({deleted:true}))}$('#modal').innerHTML=''}catch(e){alert('Could not save: '+(e.message||e.code))}};
 const dl=$('#dfdel');if(dl)dl.onclick=async()=>{if(!await ask('Delete the district "'+d.name+'"?','Delete'))return;try{await db.doc('districts/'+d.id).update({deleted:true,delAt:Date.now()});$('#modal').innerHTML='';undoBar('District deleted.',()=>db.doc('districts/'+d.id).update({deleted:false}))}catch(e){alert('Could not delete: '+(e.message||e.code))}}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-dsopen]');if(t){e.preventDefault();dsCard(t.dataset.dsopen)}});

function dsZoom(id){const el=document.createElement('div');el.id='dszoom';el.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:12px';
 el.innerHTML=`<img src="/_blob/${esc(id)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;border:1px solid var(--line)">`;el.onclick=()=>el.remove();document.body.appendChild(el)}

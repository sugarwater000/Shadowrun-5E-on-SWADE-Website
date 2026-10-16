// ---- Duplicate a sheet; the GM can also turn a sheet into an NPC
function dpClone(){const c=JSON.parse(JSON.stringify(sh));['_id','id','hist','timers','cr','deleted','delAt','delBy','edited','dsys','dst','dronePil','veh','actVeh','pack'].forEach(k=>delete c[k]);return c}
function dpModal(){if(!sh||sh.drone)return;const base=sh.name||'Character';
 $('#modal').innerHTML=`<div class="modal"><form id="dpf"><h2>⧉ DUPLICATE ${esc(base).toUpperCase()}</h2><div class="hint">Makes a separate copy of this sheet. Wounds, fatigue and conditions start fresh. The copy gets its own handle, so its funds and gear are separate from the original.</div>
 <div class="two"><div><label>NEW CHARACTER NAME</label><input name="n" required autocomplete="off" value="${esc(base+' (copy)')}"></div><div><label>HANDLE FOR THE COPY</label><input name="h" required autocomplete="off" value="${esc(base+' (copy)')}"></div></div>
 <label style="display:block;margin-top:8px"><input type="checkbox" name="g" checked> Copy the gear too (${invOf(sh.handle||sh.name).length} item${invOf(sh.handle||sh.name).length===1?'':'s'})</label>
 ${isOwner?`<label style="display:block;margin-top:4px"><input type="checkbox" name="npc"> Make the copy an NPC (belongs to the GM)</label><label style="display:block;margin-top:4px"><input type="checkbox" name="hid"> Hide the copy from players</label>`:''}
 <div style="margin-top:12px;display:flex;gap:8px"><button class="btn grn" type="submit">Make copy</button><button class="btn mg" type="button" id="dpx">Cancel</button></div></form></div>`;
 $('#dpx').onclick=closeM;
 $('#dpf').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),n=String(f.get('n')||'').trim(),h=String(f.get('h')||'').trim();if(!n||!h)return;
  const id=pid(n),ex=(pm.sheets||[]).find(x=>x.id===id);if(ex&&!ex.deleted)return alert('A sheet called "'+n+'" already exists. Pick another name.');
  try{await shSave();const src=sh.handle||sh.name,c=dpClone(),npc=!!f.get('npc')&&isOwner;
   Object.assign(c,{name:n,handle:h,wounds:0,inc:0,fatigue:0,status:[],bennies:c.bennies,ppUsed:0,uid:uid||'',by:handle||'?',ts:Date.now(),copyOf:shId});
   if(npc)Object.assign(c,{npc:true,player:'NPC'});else if(!isOwner)c.player=handle||c.player;
   if(f.get('hid')&&isOwner)c.hidden=true;else delete c.hidden;
   (c.weapons||[]).forEach(w=>{if(w.mag&&w.ammo!=null)w.ammo=w.mag});
   await db.doc('sheets/'+id).set(c);
   let k=0;if(f.get('g')){for(const it of invOf(src)){const o={...it};delete o.id;delete o.worn_by;o.owner=h;o.ts=Date.now()+k;await db.collection('inventory').add(o);k++}}
   closeM();shId=id;sh=null;shPend=id;sheetsView();let tr=0;const iv=setInterval(()=>{if((pm.sheets||[]).find(x=>x.id===id)||++tr>30){clearInterval(iv);if(board==='__sheets')sheetsView()}},250)
  }catch(e){alert('Could not copy: '+(e.message||e.code))}}}
async function dpNpc(){if(!isOwner||!sh||sh.drone)return;if(!await ask('Turn "'+(sh.name||'this character')+'" into an NPC? It will belong to the GM and be marked NPC. The player who owned it can no longer edit it.','Make NPC'))return;
 try{await shSave();const pv={npc:!!sh.npc,uid:sh.uid||'',player:sh.player||''},sid=shId;sh.npc=true;sh.uid=uid||'';sh.player='NPC';await db.doc('sheets/'+shId).update({npc:true,uid:uid||'',player:'NPC'});shBuild();undoBar('Turned into an NPC.',async()=>{await db.doc('sheets/'+sid).update(pv);if(sh&&shId===sid){Object.assign(sh,pv);shBuild()}})}catch(e){alert('Could not change it: '+(e.message||e.code))}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#shdup,#shnpc');if(!t||!sh)return;if(t.id==='shdup')dpModal();else dpNpc()});

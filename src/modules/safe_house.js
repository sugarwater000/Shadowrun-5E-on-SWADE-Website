// ---- Team safe house (hidden until the GM turns it on)
const HQ_SEC=['No protection','A cheap lock','Secured','Hardened','Fortified','Fortress'];
const hqDoc=()=>(pm.safehouse||[]).find(x=>x.id==='main'&&!x.deleted)||null;
const hqOn=()=>{const m=hqDoc();return !!(m&&m.enabled===true)};
const hqUps=m=>Array.isArray(m&&m.upgrades)?m.upgrades.filter(u=>u&&u.id&&u.n):[];
const hqSecVal=m=>Math.max(0,Math.min(5,Math.round((+m.sec||0)+hqUps(m).filter(u=>u.built).reduce((a,u)=>a+(+u.bonus||0),0))));
const hqStash=()=>(pm.stash||[]).filter(x=>!x.deleted&&x.kind==='item'&&(+x.qty||0)>0).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const hqLogs=k=>(pm.stash||[]).filter(x=>!x.deleted&&x.kind===k).sort((a,b)=>(b.ts||0)-(a.ts||0));
const hqSheets=()=>(pm.sheets||[]).filter(s=>!s.deleted&&!s.drone&&(isOwner||(uid&&s.uid===uid)));
const hqWho=s=>s.handle||s.name;
let hqQ='';
function hqSet(patch){return db.doc('safehouse/main').update(patch)}
function hqView(){
 const gm=isOwner,m=hqDoc(),on=hqOn();
 if(!on&&!gm){$('#view').innerHTML='<div class="warn">Nothing here.</div>';return}
 const sec=m?hqSecVal(m):0,ups=hqUps(m),items=hqStash(),q=hqQ.toLowerCase().trim(),shown=items.filter(x=>!q||(x.name+' '+(x.cat||'')+' '+(x.note||'')).toLowerCase().includes(q));
 const rentLine=m&&+m.rent>0?`<b style="color:var(--am)">${money(+m.rent)}</b> ${esc(m.per||'per month')}${m.due?` · next due <b>${esc(igtFmt(m.due)||m.due)}</b>`:''}`:'No rent. This place is free.';
 const pays=hqLogs('rent').slice(0,5),logs=hqLogs('log').slice(0,12);
 const meter=`<div style="display:flex;gap:3px;margin:4px 0">${[1,2,3,4,5].map(i=>`<span style="width:34px;height:10px;border:1px solid var(--line);background:${i<=sec?(sec>=4?'var(--cy)':sec>=2?'#39ff14':'var(--am)'):'transparent'}"></span>`).join('')}</div>`;
 $('#view').innerHTML=`<div id="hqroot"><div class="bar"><h2>🏠 TEAM SAFE HOUSE</h2><div>${gm?`<button class="btn sm" id="hqed">${m?'Edit':'Set up'}</button> `:''}</div></div>
 ${gm&&!on?`<div class="warn" style="margin-bottom:10px">Players cannot see this yet. Get it ready, then <button class="btn sm grn" id="hqen">Show it to the players</button></div>`:''}
 ${gm&&on?`<div class="hint" style="margin-bottom:10px">Visible to everyone. <button class="btn sm" id="hqdis">Hide it from players again</button> <span class="meta">(nothing is deleted)</span></div>`:''}
 ${m?`<div class="post" style="padding:12px;margin-bottom:12px"><div class="hd"><span class="handle" style="color:var(--am)">${esc(m.name||'Our safe house')}</span><span class="meta">${esc(m.loc||'')}</span></div><div class="bd">${m.tag?`<p style="font-style:italic;margin:4px 0">${esc(m.tag)}</p>`:''}${typeof dsLink==='function'&&m.loc?dsLink(m.loc):''}${m.desc?`<div style="white-space:pre-wrap">${esc(m.desc)}</div>`:''}
  <div style="margin-top:8px"><span class="meta">SECURITY</span> <b>${esc(HQ_SEC[sec])}</b> <span class="meta">(${sec} of 5)</span>${meter}</div></div></div>
 <div class="post" style="padding:12px;margin-bottom:12px"><div class="hd"><span class="handle" style="color:var(--am)">RENT</span><span><button class="btn sm grn" id="hqpay" ${+m.rent>0?'':'disabled'}>Pay rent</button></span></div><div class="bd">${rentLine}${pays.length?`<div class="meta" style="margin-top:6px">${pays.map(p=>`Paid ${money(+p.amt||0)} by ${esc(p.who||'?')}${p.for?' ('+esc(p.for)+')':''}${p.igt?' on '+esc(igtFmt(p.igt)||p.igt):''}`).join('<br>')}</div>`:''}</div></div>
 <div class="post" style="padding:12px;margin-bottom:12px"><div class="hd"><span class="handle" style="color:var(--am)">UPGRADES</span><span>${gm?'<button class="btn sm" id="hqua">+ Upgrade</button>':''}</span></div><div class="bd">${ups.length?ups.map(u=>`<div class="row" style="cursor:default;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;align-items:center"><span>${u.built?'✅':'🔲'} <b>${esc(u.n)}</b> <span class="meta">${+u.cost>0?money(+u.cost):'free'}${+u.bonus>0?' · +'+(+u.bonus)+' security':''}${u.note?' · '+esc(u.note):''}</span></span>${gm?`<span><button class="btn sm" data-hqut="${esc(u.id)}">${u.built?'Mark not built':'Mark built'}</button> <button class="btn sm" data-hque="${esc(u.id)}">Edit</button></span>`:''}</div>`).join(''):'<div class="meta">No upgrades yet.</div>'}${ups.some(u=>u.built)?`<div class="meta" style="margin-top:6px">Built so far: ${money(ups.filter(u=>u.built).reduce((a,u)=>a+(+u.cost||0),0))}</div>`:''}</div></div>
 <div class="post" style="padding:12px;margin-bottom:12px"><div class="hd"><span class="handle" style="color:var(--am)">STASH</span><span><button class="btn sm grn" id="hqput">Put something in</button> <button class="btn sm" id="hqadd">Add loot</button></span></div><div class="bd"><div class="hint" style="margin-bottom:6px">Shared gear and loot the whole team can reach. Putting something in takes it off your character sheet. Taking something out moves it onto the sheet you choose.</div>
  ${items.length>5?`<input id="hqq" placeholder="Search the stash..." value="${esc(hqQ)}" style="margin-bottom:8px">`:''}
  ${shown.length?shown.map(x=>`<div class="row" style="cursor:default;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;align-items:center"><span><b>${esc(x.name)}</b> × ${+x.qty} <span class="meta">${[x.cat,x.grade?'grade '+x.grade:'',x.note,x.from?'from '+x.from:''].filter(Boolean).map(esc).join(' · ')}</span></span><span><button class="btn sm" data-hqtk="${esc(x.id)}">Take</button>${gm?` <button class="btn sm mg" data-hqrm="${esc(x.id)}">Remove</button>`:''}</span></div>`).join(''):`<div class="meta">${items.length?'Nothing matches that.':'The stash is empty.'}</div>`}</div></div>
 ${logs.length?`<div class="post" style="padding:12px"><div class="hd"><span class="handle" style="color:var(--am)">RECENT ACTIVITY</span></div><div class="bd">${logs.map(l=>`<div class="meta">${esc(new Date(l.ts||0).toLocaleDateString())} · ${esc(l.text||'')}</div>`).join('')}</div></div>`:''}`
 :`<div class="hint">${gm?'No safe house yet. Click Set up to describe the team’s base.':'Nothing here.'}</div>`}</div>`;
 const V=$('#view'),on1=(s,f)=>{const e=V.querySelector(s);if(e)e.onclick=f};
 on1('#hqed',()=>hqEdit());
 on1('#hqen',async()=>{if(!m)return alert('Set the safe house up first.');if(!await ask('Show the safe house to all players now?','Show it'))return;try{await hqSet({enabled:true});undoBar('The safe house is now visible to players.',()=>hqSet({enabled:false}))}catch(e){alert('Failed: '+(e.message||e.code))}});
 on1('#hqdis',async()=>{try{await hqSet({enabled:false});undoBar('The safe house is hidden from players.',()=>hqSet({enabled:true}))}catch(e){alert('Failed: '+(e.message||e.code))}});
 on1('#hqpay',()=>hqPay());on1('#hqua',()=>hqUpg(''));on1('#hqput',()=>hqPut());on1('#hqadd',()=>hqLoot());
 V.querySelectorAll('[data-hque]').forEach(b=>b.onclick=()=>hqUpg(b.dataset.hque));
 V.querySelectorAll('[data-hqut]').forEach(b=>b.onclick=async()=>{const id=b.dataset.hqut;try{const L=hqUps(m).map(u=>u.id===id?{...u,built:!u.built}:u);await hqSet({upgrades:L});undoBar('Upgrade updated.',()=>hqSet({upgrades:hqUps(m)}))}catch(e){alert('Failed: '+(e.message||e.code))}});
 V.querySelectorAll('[data-hqtk]').forEach(b=>b.onclick=()=>hqTake(b.dataset.hqtk));
 V.querySelectorAll('[data-hqrm]').forEach(b=>b.onclick=async()=>{const x=(pm.stash||[]).find(z=>z.id===b.dataset.hqrm);if(!x||!await ask('Remove '+x.name+' from the stash?','Remove'))return;try{await db.doc('stash/'+x.id).update({deleted:true});await hqLog('GM removed '+x.qty+'× '+x.name);undoBar('Removed.',()=>db.doc('stash/'+x.id).update({deleted:false}))}catch(e){alert('Failed: '+(e.message||e.code))}});
 const qi=$('#hqq');if(qi)qi.oninput=e=>{hqQ=e.target.value;const p=e.target.selectionStart;hqView();const n=$('#hqq');n.focus();n.setSelectionRange(p,p)}}
const hqLog=t=>db.collection('stash').add({kind:'log',text:t,by:handle||'?',ts:Date.now()});
function hqEdit(){if(!isOwner)return;const m=hqDoc()||{};
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${hqDoc()?'EDIT SAFE HOUSE':'SET UP THE SAFE HOUSE'}</h2>
 <label>NAME</label><input id="hqn" maxlength="60" value="${esc(m.name||'')}" placeholder="e.g. The Laundromat">
 <label>WHERE IS IT?</label><input id="hql" list="dsl" maxlength="80" value="${esc(m.loc||'')}">${typeof dsDatalist==='function'?dsDatalist():''}
 <label>ONE-LINE VIBE</label><input id="hqt" maxlength="120" value="${esc(m.tag||'')}" placeholder="e.g. Smells like detergent, hums like a server room">
 <label>DESCRIPTION</label><textarea id="hqd" rows="4" maxlength="900">${esc(m.desc||'')}</textarea>
 <div class="two"><div><label>BASE SECURITY (0 TO 5)</label><select id="hqs">${[0,1,2,3,4,5].map(i=>`<option value="${i}" ${(+m.sec||0)===i?'selected':''}>${i} · ${esc(HQ_SEC[i])}</option>`).join('')}</select></div><div><label>RENT IN NUYEN (0 = FREE)</label><input type="number" id="hqr" min="0" value="${+m.rent||0}"></div></div>
 <div class="two"><div><label>RENT IS DUE</label><input id="hqp" maxlength="30" value="${esc(m.per||'per month')}"></div><div><label>NEXT DUE (IN-GAME DATE)</label><input id="hqdu" maxlength="30" value="${esc(m.due||'')}" placeholder="e.g. 2077-04-01"></div></div>
 <div style="margin-top:12px"><button class="btn grn" id="hqok">Save</button> <button class="btn" id="hqcx">Cancel</button></div></div></div>`;
 $('#hqcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#hqok').onclick=async()=>{const v={name:$('#hqn').value.trim()||'Our safe house',loc:$('#hql').value.trim(),tag:$('#hqt').value.trim(),desc:$('#hqd').value.trim(),sec:+$('#hqs').value||0,rent:Math.max(0,Math.round(+$('#hqr').value||0)),per:$('#hqp').value.trim()||'per month',due:$('#hqdu').value.trim()};
  const pv=Object.fromEntries(Object.keys(v).map(k=>[k,m[k]===undefined?(typeof v[k]==='number'?0:''):m[k]]));
  try{if(!hqDoc())v.enabled=false;await hqSet(v);$('#modal').innerHTML='';undoBar('Safe house saved.',()=>hqSet(pv))}catch(e){alert('Could not save: '+(e.message||e.code))}}}
function hqUpg(id){if(!isOwner)return;const m=hqDoc();if(!m)return;const u=id?hqUps(m).find(z=>z.id===id):null;
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${u?'EDIT UPGRADE':'NEW UPGRADE'}</h2><label>NAME</label><input id="hun" maxlength="60" value="${esc(u?u.n:'')}" placeholder="e.g. Armored door">
 <div class="two"><div><label>COST IN NUYEN</label><input type="number" id="huc" min="0" value="${u?+u.cost||0:0}"></div><div><label>SECURITY BONUS</label><select id="hub">${[0,1,2].map(i=>`<option value="${i}" ${u&&(+u.bonus||0)===i?'selected':''}>+${i}</option>`).join('')}</select></div></div>
 <label>NOTE</label><input id="hunt" maxlength="120" value="${esc(u?u.note||'':'')}">
 <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="hubu" style="width:auto" ${u&&u.built?'checked':''}> Already built</label>
 <div style="margin-top:12px"><button class="btn grn" id="huok">Save</button>${u?' <button class="btn mg" id="hudel">Delete</button>':''} <button class="btn" id="hucx">Cancel</button></div></div></div>`;
 $('#hucx').onclick=()=>{$('#modal').innerHTML=''};
 const commit=async(L,msg)=>{const prev=hqUps(m);try{await hqSet({upgrades:L});$('#modal').innerHTML='';undoBar(msg,()=>hqSet({upgrades:prev}))}catch(e){alert('Failed: '+(e.message||e.code))}};
 $('#huok').onclick=()=>{const n=$('#hun').value.trim();if(!n)return alert('Give the upgrade a name.');const v={id:u?u.id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),n,cost:Math.max(0,Math.round(+$('#huc').value||0)),bonus:+$('#hub').value||0,note:$('#hunt').value.trim(),built:$('#hubu').checked};
  commit(u?hqUps(m).map(z=>z.id===u.id?v:z):hqUps(m).concat([v]),'Upgrade saved.')};
 const dl=$('#hudel');if(dl)dl.onclick=()=>commit(hqUps(m).filter(z=>z.id!==u.id),'Upgrade deleted.')}
function hqPay(){const m=hqDoc();if(!m||!(+m.rent>0))return;const S=hqSheets();
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>PAY RENT</h2><div class="hint">Rent is ${money(+m.rent)} ${esc(m.per||'per month')}. The payment is written into the Funds log.</div>
 <label>PAY FROM</label><select id="hpf"><option value="">The party's funds</option>${S.map(s=>`<option value="${esc(hqWho(s))}">${esc(s.name)}${s.handle&&s.handle!==s.name?' ('+esc(s.handle)+')':''}</option>`).join('')}</select>
 <label>AMOUNT</label><input type="number" id="hpa" min="1" value="${+m.rent}"><label>FOR (OPTIONAL)</label><input id="hpn" maxlength="60" placeholder="e.g. April">
 <div style="margin-top:12px"><button class="btn grn" id="hpok">Pay</button> <button class="btn" id="hpcx">Cancel</button></div></div></div>`;
 $('#hpcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#hpok').onclick=async()=>{const amt=Math.round(+$('#hpa').value||0);if(!(amt>0))return alert('Enter an amount.');const holder=$('#hpf').value,fr=$('#hpn').value.trim(),btn=$('#hpok');if(btn.dataset.busy)return;btn.dataset.busy=1;
  try{const l=await db.collection('ledger').add({type:'Funds',date:defIgt(),desc:'Safe house rent: '+(m.name||'Safe house')+(fr?' ('+fr+')':''),amount:-amt,holder,note:'Safe house',by:handle||'?',uid:uid||'',ts:Date.now()});
   const r=await db.collection('stash').add({kind:'rent',amt,who:holder||handle||'the party',for:fr,igt:defIgt(),by:handle||'?',ts:Date.now()});
   $('#modal').innerHTML='';undoBar('Rent paid: '+money(amt)+'.',async()=>{await db.doc('ledger/'+l.id).update({deleted:true});await db.doc('stash/'+r.id).update({deleted:true})})}catch(e){btn.dataset.busy='';alert('Failed: '+(e.message||e.code))}}}
async function hqPutItem(base,qty,from){ /* add to the stash, merging with an identical item */
 const same=hqStash().find(x=>x.name===base.name&&(x.cat||'')===(base.cat||'')&&(x.grade||'')===(base.grade||'')&&(x.note||'')===(base.note||''));
 if(same){await db.doc('stash/'+same.id).update({qty:(+same.qty||0)+qty});return {id:same.id,merged:true,prev:+same.qty||0}}
 const d={kind:'item',name:base.name,cat:base.cat||'Custom',sub:base.sub||'',qty,price:+base.price||0,grade:base.grade||'',strain:base.strain==null?null:base.strain,base:base.base==null?null:base.base,info:base.info||'',w:+base.w||0,note:base.note||'',from:from||'',by:handle||'?',ts:Date.now()};
 const r=await db.collection('stash').add(d);return {id:r.id,merged:false}}
function hqPut(){const S=hqSheets();if(!S.length)return alert('You need a character sheet with gear to put something in. You can still use Add loot.');
 const first=hqWho(S[0]);
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>PUT SOMETHING IN THE STASH</h2><label>FROM WHICH CHARACTER</label><select id="hpw">${S.map(s=>`<option value="${esc(hqWho(s))}">${esc(s.name)}</option>`).join('')}</select><label>WHICH ITEM</label><select id="hpi"></select><div id="hpqw"></div>
 <div style="margin-top:12px"><button class="btn grn" id="hpok">Put it in</button> <button class="btn" id="hpcx">Cancel</button></div></div></div>`;
 const fill=()=>{const w=$('#hpw').value,L=invOf(w).sort((a,b)=>String(a.name).localeCompare(String(b.name)));$('#hpi').innerHTML=L.length?L.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${(x.qty||1)>1?' ×'+x.qty:''}${x.worn?' (worn)':''}</option>`).join(''):'<option value="">(nothing to put in)</option>';qty()};
 const qty=()=>{const x=(pm.inventory||[]).find(z=>z.id===$('#hpi').value),q=x?(x.qty||1):0;$('#hpqw').innerHTML=q>1?`<label>HOW MANY (YOU HAVE ${q})</label><input type="number" id="hpn" min="1" max="${q}" value="${q}">`:''};
 $('#hpw').onchange=fill;$('#hpi').onchange=qty;fill();$('#hpcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#hpok').onclick=async()=>{const x=(pm.inventory||[]).find(z=>z.id===$('#hpi').value);if(!x)return alert('Pick an item.');const q=x.qty||1,n=Math.max(1,Math.min(q,Math.floor(+($('#hpn')?$('#hpn').value:q))||q)),btn=$('#hpok');if(btn.dataset.busy)return;btn.dataset.busy=1;
  try{const r=await hqPutItem(x,n,$('#hpw').value);
   if(n>=q)await db.doc('inventory/'+x.id).update({deleted:true,stashed:true,delAt:Date.now(),delBy:handle||'?'});else await db.doc('inventory/'+x.id).update({qty:q-n,worn:false});
   await hqLog((handle||'Someone')+' put '+n+'× '+x.name+' in the stash');$('#modal').innerHTML='';
   undoBar('Put '+n+'× '+x.name+' in the stash.',async()=>{if(n>=q)await db.doc('inventory/'+x.id).update({deleted:false});else await db.doc('inventory/'+x.id).update({qty:q});if(r.merged)await db.doc('stash/'+r.id).update({qty:r.prev});else await db.doc('stash/'+r.id).update({deleted:true})})}
  catch(e){btn.dataset.busy='';alert('Failed: '+(e.message||e.code))}}}
function hqLoot(){
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>ADD LOOT</h2><div class="hint">For things the team found that are not on anyone's sheet.</div><label>WHAT</label><input id="hln" maxlength="80"><div class="two"><div><label>HOW MANY</label><input type="number" id="hlq" min="1" value="1"></div><div><label>NOTE</label><input id="hlt" maxlength="120"></div></div>
 <div style="margin-top:12px"><button class="btn grn" id="hlok">Add</button> <button class="btn" id="hlcx">Cancel</button></div></div></div>`;
 $('#hlcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#hlok').onclick=async()=>{const n=$('#hln').value.trim(),q=Math.max(1,Math.floor(+$('#hlq').value)||1);if(!n)return alert('Say what it is.');const btn=$('#hlok');if(btn.dataset.busy)return;btn.dataset.busy=1;
  try{const r=await hqPutItem({name:n,cat:'Custom',note:$('#hlt').value.trim()},q,'');await hqLog((handle||'Someone')+' added '+q+'× '+n+' to the stash');$('#modal').innerHTML='';undoBar('Added '+q+'× '+n+'.',()=>r.merged?db.doc('stash/'+r.id).update({qty:r.prev}):db.doc('stash/'+r.id).update({deleted:true}))}
  catch(e){btn.dataset.busy='';alert('Failed: '+(e.message||e.code))}}}
function hqTake(id){const x=(pm.stash||[]).find(z=>z.id===id&&!z.deleted&&z.kind==='item');if(!x)return;const S=hqSheets();if(!S.length)return alert('You need a character sheet to take gear.');const q=+x.qty||0;
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>TAKE: ${esc(x.name)}</h2><label>GIVE IT TO</label><select id="htw">${S.map(s=>`<option value="${esc(hqWho(s))}">${esc(s.name)}</option>`).join('')}</select>${q>1?`<label>HOW MANY (${q} IN THE STASH)</label><input type="number" id="htn" min="1" max="${q}" value="1">`:''}
 <div style="margin-top:12px"><button class="btn grn" id="htok">Take it</button> <button class="btn" id="htcx">Cancel</button></div></div></div>`;
 $('#htcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#htok').onclick=async()=>{const cur=(pm.stash||[]).find(z=>z.id===id),qq=cur?+cur.qty||0:0,n=Math.max(1,Math.min(qq,Math.floor(+($('#htn')?$('#htn').value:1))||1)),to=$('#htw').value,btn=$('#htok');if(!cur||qq<1)return alert('Someone just took the last one.');if(btn.dataset.busy)return;btn.dataset.busy=1;
  try{const inv=await db.collection('inventory').add({owner:to,name:x.name,cat:x.cat||'Custom',sub:x.sub||'',qty:n,price:+x.price||0,grade:x.grade||'',strain:x.strain==null?null:x.strain,base:x.base==null?null:x.base,info:x.info||'',w:+x.w||0,note:x.note||'',by:handle||'?',uid:uid||'',ts:Date.now(),worn:false});
   if(n>=qq)await db.doc('stash/'+id).update({qty:0,deleted:true});else await db.doc('stash/'+id).update({qty:qq-n});
   await hqLog((handle||'Someone')+' took '+n+'× '+x.name+' ('+to+')');$('#modal').innerHTML='';
   undoBar('Took '+n+'× '+x.name+'.',async()=>{await db.doc('inventory/'+inv.id).update({deleted:true});await db.doc('stash/'+id).update({qty:qq,deleted:false})})}
  catch(e){btn.dataset.busy='';alert('Failed: '+(e.message||e.code))}}}
function hqGmPanel(){const el=$('#hqgm');if(!el)return;const m=hqDoc(),on=hqOn();
 el.innerHTML=`<div class="post" style="padding:12px;margin-top:12px"><h2 style="font-size:14px">TEAM SAFE HOUSE</h2><div class="hint" style="margin:6px 0 10px">A shared base for the team: where it is, rent, upgrades and a stash anyone can put gear into or take from. It stays completely hidden from players until you turn it on. ${on?'<b style="color:#39ff14">It is ON and visible to players.</b>':m?'<b>It is set up but hidden.</b>':'Not set up yet.'}</div><button class="btn grn" id="hqgo">${m?'Open the safe house':'Set it up'}</button> ${m&&!on?'<button class="btn" id="hqgon">Show it to the players</button>':''}${on?' <button class="btn" id="hqgoff">Hide it from players</button>':''}</div>`;
 $('#hqgo').onclick=()=>{board='__safe';thread=null;render()};
 const a=$('#hqgon');if(a)a.onclick=async()=>{if(!await ask('Show the safe house to all players now?','Show it'))return;try{await hqSet({enabled:true});undoBar('The safe house is now visible to players.',()=>hqSet({enabled:false}));hqGmPanel()}catch(e){alert('Failed: '+(e.message||e.code))}};
 const b=$('#hqgoff');if(b)b.onclick=async()=>{try{await hqSet({enabled:false});undoBar('The safe house is hidden from players.',()=>hqSet({enabled:true}));hqGmPanel()}catch(e){alert('Failed: '+(e.message||e.code))}}}

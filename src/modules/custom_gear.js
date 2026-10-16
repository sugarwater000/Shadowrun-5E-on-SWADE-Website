// ---- Custom gear and catalog entries that everyone at the table can use
const CAT_BASE=CATALOG.length;
const CG_HINT={'Ranged Weapons':'Ranged · Damage 2d6+1 · Range 12/24/48 · ROF 1 · AP 1','Melee Weapons':'Melee · Damage Str+d6 · Min Str d6 · AP 0','Armor':'Armor 4 · Torso/Arms/Legs · Min Str d6','Vehicles':'Bike · Size 2 · Scale Mod 0 · Handling 1 · Top Speed 80 · Toughness 9(2) · Crew 1+1','Drones':'Scale 0 · Pace 10 · Agi d6 · Smarts d4(A) · Str d4 · Vigor d6 · Toughness 5 · Medium Flight','Cyberware':'Hacking +1','Ammo and Explosives':'Regular ammo for pistols, 10 rounds','Gear and Tools':'What it does and any bonus it gives'};
const cgCats=()=>CAT_ORDER.filter(c=>c!=='Magic (reference)');
function cgItem(x,i){const it={n:x.n,c:x.c,s:x.s||'',p:x.c==='Cyberware'?null:(x.p===''||x.p==null?null:+x.p),d:x.d||'',i,cu:1,cid:x.id,by:x.by||'',uid:x.uid||''};
 if(x.c==='Cyberware'){const b=Math.max(1,Math.round(+x.base||1)),pr=Math.max(0,Math.round(+x.p||0));it.cy={G:[b+1,Math.round(pr/5)],S:[b,pr],C:[Math.max(1,b-1),pr*2],M:[b,pr*5]}}return it}
function cgRebuild(){CATALOG.length=CAT_BASE;(pm.customgear||[]).filter(x=>!x.deleted&&x.n&&x.c).sort((a,b)=>String(a.n).localeCompare(String(b.n))).forEach(x=>CATALOG.push(cgItem(x,CATALOG.length)))}
const cgMine=it=>!!it&&(isOwner||(!!it.uid&&it.uid===uid));
function cgCtl(it){if(!it.cu)return '';return ` <span class="tag" style="color:var(--cy);border-color:var(--cy)" title="${esc(it.by?'Added by '+it.by:'Added at the table')}">CUSTOM</span>`+(cgMine(it)?` <button class="btn sm" data-cge="${esc(it.cid)}">edit</button> <button class="btn sm mg" data-cgd="${esc(it.cid)}">remove</button>`:'')}
function cgForm(id){const x=id?(pm.customgear||[]).find(v=>v.id===id):null;if(id&&!x)return;const cat0=x?x.c:'Gear and Tools';
 const subs=c=>[...new Set(CATALOG.filter(v=>v.c===c).map(v=>v.s).filter(Boolean))];
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${x?'EDIT CUSTOM ITEM':'ADD A CUSTOM ITEM'}</h2><div class="hint">Anything you add shows up in Gear &amp; Shopping for everyone, and can be bought like any other item. You (and the GM) can change or remove it later.</div>
 <label>NAME</label><input id="cgn" maxlength="80" value="${esc(x?x.n:'')}">
 <div class="two"><div><label>CATEGORY</label><select id="cgc">${cgCats().map(c=>`<option ${c===cat0?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div><label>TYPE (OPTIONAL)</label><input id="cgs" list="cgsl" maxlength="40" value="${esc(x?x.s||'':'')}"><datalist id="cgsl"></datalist></div></div>
 <div class="two"><div><label id="cgpl">PRICE (¥)</label><input id="cgp" type="number" min="0" value="${x&&x.p!=null&&x.p!==''?+x.p:''}" placeholder="Leave empty to ask the GM"></div><div id="cgbw" style="display:none"><label>STRAIN (STANDARD GRADE)</label><input id="cgb" type="number" min="1" max="10" value="${x?+x.base||1:1}"></div></div>
 <label>WHAT IT DOES <span class="meta" id="cgh"></span></label><textarea id="cgd" rows="3" maxlength="500">${esc(x?x.d||'':'')}</textarea>
 <div class="meta" id="cgcy" style="display:none;margin-top:4px">Other grades are worked out for you: Gutterware costs a fifth and adds 1 Strain, Customware costs double, Milware five times.</div>
 <div style="margin-top:12px"><button class="btn grn" id="cgok">Save</button> <button class="btn mg" id="cgx">Cancel</button></div></div></div>`;
 const upd=()=>{const c=$('#cgc').value;$('#cgsl').innerHTML=subs(c).map(s=>`<option value="${esc(s)}">`).join('');$('#cgh').textContent='e.g. '+(CG_HINT[c]||CG_HINT['Gear and Tools']);$('#cgd').placeholder=CG_HINT[c]||CG_HINT['Gear and Tools'];const cy=c==='Cyberware';$('#cgbw').style.display=cy?'':'none';$('#cgcy').style.display=cy?'':'none';$('#cgpl').textContent=cy?'STANDARD GRADE PRICE (¥)':'PRICE (¥)'};
 $('#cgc').onchange=upd;upd();$('#cgx').onclick=()=>{$('#modal').innerHTML=''};setTimeout(()=>{const e=$('#cgn');if(e)e.focus()},50);
 $('#cgok').onclick=async()=>{const n=$('#cgn').value.trim();if(!n)return alert('Give the item a name.');const c=$('#cgc').value,pv=$('#cgp').value;
  const v={n,c,s:$('#cgs').value.trim(),p:pv===''?null:Math.max(0,Math.round(+pv)),d:$('#cgd').value.trim(),base:c==='Cyberware'?Math.max(1,Math.round(+$('#cgb').value)||1):null};
  if(c==='Cyberware'&&v.p==null)return alert('Cyberware needs a standard grade price.');
  try{if(x)await db.doc('customgear/'+x.id).update(v);else await db.collection('customgear').add({...v,by:handle||'?',uid:uid||'',ts:Date.now()});$('#modal').innerHTML=''}catch(e){alert('Could not save: '+(e.message||e.code))}}}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#cgadd,[data-cge],[data-cgd]');if(!a)return;
 if(a.id==='cgadd')return cgForm('');if(a.dataset.cge)return cgForm(a.dataset.cge);
 const id=a.dataset.cgd,x=(pm.customgear||[]).find(v=>v.id===id);if(!x||!cgMine(x))return;
 ask('Remove "'+x.n+'" from the shop list? Gear people already bought stays in their inventory.','Remove').then(async ok=>{if(!ok)return;try{await db.doc('customgear/'+id).update({deleted:true,delAt:Date.now()});undoBar('Custom item removed.',()=>db.doc('customgear/'+id).update({deleted:false}))}catch(er){alert('Could not remove: '+(er.message||er.code))}})});

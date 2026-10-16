// ---- Drones: a drone is its own sheet, linked to the character who runs it (sh.drone=1, sh.owner=<owner sheet id>)
// It has its own Toughness, armor, wounds, weapons and gear. Its skill rolls use the rigger's dice (default) or its own.
const drOwnerDoc=()=>sh&&sh.drone?(pm.sheets||[]).find(x=>x.id===sh.owner&&!x.deleted):null;
const drList=oid=>(pm.sheets||[]).filter(x=>x.drone&&x.owner===oid&&!x.deleted).sort((a,b)=>String(a.name).localeCompare(b.name));
const drRigOn=()=>!!(sh&&sh.drone&&sh.ctl!=='own'&&drOwnerDoc());
const drNm=o=>o?(o.handle||o.name||'the rigger'):'the rigger';
function drSkillOf(name){const o=drOwnerDoc();if(!o||!o.sk)return null;for(const k in o.sk){const x=(o.sk[k]||[]).find(v=>v&&v.n===name);if(x)return x}return null}
// the rigger's die and bonus for a skill roll (null when the roll should use the drone's own numbers)
// combat skills are run through the rigger's Piloting; anything else uses the rigger's skill of the same name
const drMapSk=n=>/^\s*(fighting|shooting|throwing)\b/i.test(String(n||''))?'Piloting':n;
function drRig(tr){if(!drRigOn()||!tr||!tr.sk)return null;const sk=drMapSk(tr.sk),x=drSkillOf(sk),d=x?+x.d||0:0;return{sides:d||4,mod:x?+x.m||0:0,unsk:!d,lab:drNm(drOwnerDoc())+' '+sk+(d?' d'+d:' (no dice)')+(sk!==tr.sk?' for '+tr.sk:'')}}
// extra modifiers that only a drone gets: jumped-in bonus and damaged systems
const DR_SYS=[['sensors','Sensors','−2 to Notice rolls'],['weapons','Weapon mounts','−2 to Fighting, Shooting and Throwing rolls and weapon attacks'],['drive','Drive and mobility','−2 to Piloting, Athletics and Driving rolls, and Pace is halved'],['link','Control link','−2 to every roll made with the rigger\'s dice']];
function drXs(tr){if(!sh||!sh.drone||!tr||!tr.sk)return[];const o=[],ds=sh.dsys||{},nm=String(tr.sk),atk=/^(fighting|shooting|throwing)/i.test(nm);
 if(drRigOn()&&sh.jump)o.push(['Jumped in',+sh.jb||2]);
 if(ds.sensors&&/^notice/i.test(nm))o.push(['Damaged sensors',-2]);
 if(ds.weapons&&atk)o.push(['Damaged weapon mounts',-2]);
 if(ds.drive&&/^(piloting|athletics|driving)/i.test(nm))o.push(['Damaged drive',-2]);
 if(ds.link&&drRigOn())o.push(['Damaged control link',-2]);
 return o}
const DR_ST=[['deployed','📡 Deployed'],['stowed','🎒 Stowed'],['away','🛰 Away on a task'],['offline','⛔ Offline']];
const drStat=x=>(DR_ST.find(s=>s[0]===(x&&x.dst||'deployed'))||DR_ST[0])[1];
// Parry can follow the rigger's Piloting instead of the drone's Fighting
const drParryDie=fi=>sh&&sh.drone&&sh.dpar&&drRigOn()?(+((drSkillOf('Piloting')||{}).d)||0):fi;
// wound and fatigue penalty of the rigger, used while the rigger is the one rolling
function drPen(){const o=drOwnerDoc();if(!o)return 0;let ig=0;try{ig=fxSum('ignw',shFix(JSON.parse(JSON.stringify(o))))}catch(e){}return Math.max(0,Math.min(3,+o.wounds||0)-ig)+(+o.fatigue||0)}
// Extras roll no Wild Die. The rigger does (on skill rolls); a drone with wounds to spare counts as a Wild Card.
const drWild=tr=>!sh||!sh.drone||!!(drRigOn()&&tr&&tr.sk)||(+sh.dwl||0)>0;
const shTB=()=>sh.drone&&sh.dtb!==undefined&&sh.dtb!==null&&sh.dtb!==''?(+sh.dtb||0):2+shHalf(swAtVal(sh,'vigor'))+(+sh.toughMod||0);
const DR_WL=[[0,'Extra: a wound wrecks it'],[1,'1 wound (Resilient)'],[2,'2 wounds (Very Resilient)'],[3,'3 wounds (Wild Card)'],[4,'4 wounds'],[5,'5 wounds'],[6,'6 wounds']];
// ---- reading a catalog stat block, e.g. "Scale 0 · Pace 4 · Agi d6 · Smarts d4(A) · Str d6 · Vigor d6 · Toughness 6(3) · Medium Humanoid Blade Arms: Str+d6, Fighting d6, Parry 5, Resilient"
function drParse(txt){const t=String(txt||''),g=re=>{const m=t.match(re);return m?m[1]:null},o={sk:{},at:{},notes:[]};
 const sc=g(/Scale\s*(-?\d+)/);o.scale=sc==null?'':sc;const pc=g(/Pace\s*(\d+)/);o.pace=pc==null?6:+pc;
 [['agility',/\bAgi(?:lity)?\s*d?(\d+)/i],['smarts',/\bSmarts\s*d?(\d+)/i],['strength',/\bStr(?:ength)?\s*d?(\d+)/i],['vigor',/\bVigor\s*d?(\d+)/i]].forEach(([k,re])=>{const v=g(re);if(v==null)return;if(SW_DIES.includes(+v))o.at[k]=+v;else{o.at[k]=4;o.notes.push(SW_ATTN[k]+' is '+v+' in the stat block (shown as d4)')}});
 const tm=t.match(/Toughness\s*(\d+)(?:\s*\((\d+)\))?/);if(tm){o.t=+tm[1];o.a=+(tm[2]||0)}
 ['Fighting','Shooting','Stealth','Piloting','Notice','Athletics','Driving','Hacking','Repair','Electronics','Healing','Thievery'].forEach(n=>{const v=g(new RegExp('\\b'+n+'\\s*d(\\d+)'));if(v&&SW_DIES.includes(+v))o.sk[n]=+v});
 const pr=g(/Parry\s*(\d+)/);if(pr!=null)o.parry=+pr;
 o.dwl=/Very Resilient/i.test(t)?2:/Resilient/i.test(t)?1:0;
 const bm=t.match(/([A-Za-z][A-Za-z \-]*?):\s*(Str\s*\+\s*d\d+(?:\s*\+\s*\d+)?)/);if(bm)o.blade={n:bm[1].trim(),dmg:bm[2].replace(/\s+/g,'')};
 return o}
const drCatText=n=>{const c=(typeof CATALOG!=='undefined'?CATALOG:[]).find(x=>String(x.n).toLowerCase()===String(n||'').toLowerCase());return c?c.d:''};
async function drCreate(own,src){if(!own)return;await shSave();
 const P=drParse(src&&src.d||''),base=(src&&src.n)||'Drone',used=(pm.sheets||[]).filter(x=>x.drone&&x.owner===own.id&&!x.deleted).map(x=>String(x.name).toLowerCase());
 let name=base,k=2;while(used.includes(name.toLowerCase()))name=base+' '+(k++);
 const oh=own.handle||own.name,s=shNew(name,own.player||'','Drone',name+' ('+oh+')');
 s.uid=own.uid||uid||'';s.drone=1;s.owner=own.id;s.ctl='rigger';s.dwl=P.dwl;s.scale=P.scale;s.pace=P.pace;s.dsrc=(src&&src.n)||'';s.ditem=(src&&src.id)||'';
 if(own.hidden)s.hidden=true;
 for(const a in P.at)s.at[a].d=P.at[a];
 for(const n in P.sk){let f=null;for(const kk in s.sk)s.sk[kk].forEach(x=>{if(x.n===n)f=x});if(f)f.d=P.sk[n];else s.sk.agility.push({n,d:P.sk[n],m:0,custom:1})}
 if(P.t!=null){s.dtb=Math.max(0,P.t-P.a);s.armor=P.a}
 if(P.parry!=null)s.parryMod=P.parry-2-shHalf(P.sk.Fighting||0);
 if(P.blade)s.weapons=[{n:P.blade.n,rng:'',rof:'',dmg:P.blade.dmg,ap:'0',sk:'Fighting',ms:''}];
 s.notes=(src&&src.d?'Stat block: '+src.d+'\n':'')+P.notes.join('\n');
 let id=pid(oh+' '+name),n2=2;while((pm.sheets||[]).some(x=>x.id===id))id=pid(oh+' '+name)+'-'+(n2++);
 try{await db.doc('sheets/'+id).set(s);closeM();board='__sheets';shId=id;sh=null;shPend=id;sheetsView();let tr=0;const iv=setInterval(()=>{if((pm.sheets||[]).find(x=>x.id===id)||++tr>30){clearInterval(iv);if(board==='__sheets')sheetsView()}},250)}catch(e){alert('Could not create the drone: '+(e.message||e.code))}}
function drOpen(id){shSave().then(()=>{board='__sheets';shId=id;sh=null;sheetsView()})}
function drMake(itemId){const x=(pm.inventory||[]).find(v=>v.id===itemId);if(!x||!sh||sh.drone)return;const own=(pm.sheets||[]).find(v=>v.id===shId);drCreate(own,{n:x.name,d:/Scale\s*-?\d|Toughness\s*\d/.test(x.info||'')?x.info:(drCatText(x.name)||x.info||''),id:x.id})}
function drAddModal(){if(!sh||sh.drone||!shOwn())return;const own=(pm.sheets||[]).find(v=>v.id===shId),mine=invOf(sh.handle||sh.name).filter(x=>x.cat==='Drones'),cat=(typeof CATALOG!=='undefined'?CATALOG:[]).filter(c=>c.c==='Drones').sort((a,b)=>String(a.n).localeCompare(b.n));
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>ADD A DRONE</h2><div class="hint">A drone gets its own sheet with its own Toughness, armor, wounds, weapons and gear. Skill rolls use ${esc(drNm(own))}'s dice unless you switch it on the drone's sheet.</div>
 ${mine.length?`<label>FROM ${esc(drNm(own).toUpperCase())}'S GEAR</label>${mine.map(x=>`<div class="row" style="cursor:pointer" data-dri="${x.id}"><b>${esc(x.name)}</b> <span class="meta">×${x.qty||1}</span><div class="meta">${esc(x.info||drCatText(x.name))}</div></div>`).join('')}`:'<div class="meta">No drones in this character\'s gear yet. Buy one in Gear &amp; Shopping, or pick one below.</div>'}
 <label style="margin-top:10px">ANY DRONE FROM THE CATALOG <span class="meta">for ones the GM hands out</span></label><div style="display:flex;gap:6px"><select id="drcs" style="flex:1">${cat.map(c=>`<option value="${esc(c.n)}">${esc(c.n)}</option>`).join('')}</select><button class="btn grn sm" id="drcg">Make</button></div>
 <label style="margin-top:10px">OR A BLANK DRONE</label><div style="display:flex;gap:6px"><input id="drbn" placeholder="Drone name" style="flex:1"><button class="btn sm" id="drbg">Create</button></div>
 <div style="margin-top:12px"><button class="btn mg" id="cx">Cancel</button></div></div></div>`;
 $('#cx').onclick=closeM;
 document.querySelectorAll('[data-dri]').forEach(a=>a.onclick=()=>{closeM();drMake(a.dataset.dri)});
 $('#drcg').onclick=()=>{const n=$('#drcs').value;drCreate(own,{n,d:drCatText(n)})};
 $('#drbg').onclick=()=>{const n=$('#drbn').value.trim();if(!n)return alert('Give the drone a name.');drCreate(own,{n,d:''})}}
// ---- giving gear between a rigger and the drones
function drTargets(){if(!sh)return[];if(sh.drone){const o=drOwnerDoc(),L=o?[{n:o.name+' (rigger)',h:o.handle||o.name}]:[];drList(sh.owner).filter(x=>x.id!==shId).forEach(x=>L.push({n:x.name,h:x.handle||x.name}));return L}
 return drList(shId).map(x=>({n:x.name,h:x.handle||x.name}))}
const drGiveBtn=(x,d)=>drTargets().length?`<button class="btn sm" data-give="${x.id}" ${d} title="Move this item to ${sh.drone?'its rigger or another drone':'one of your drones'}">Give to...</button> `:'';
const drMakeBtn=(x,d)=>{if(!sh||sh.drone||x.cat!=='Drones'||!shOwn())return'';const have=drList(shId).filter(z=>z.ditem===x.id);return have.length>=(x.qty||1)?`<button class="btn sm" data-opdr="${have[0].id}" title="Open this drone's sheet">Open drone</button> `:`<button class="btn sm grn" data-mkdr="${x.id}" ${d} title="Make a drone sheet from this item">Make drone sheet</button> `};
function drGive(id){const x=(pm.inventory||[]).find(v=>v.id===id),T=drTargets();if(!x||!T.length)return;const q=x.qty||1;
 $('#modal').innerHTML=`<div class="modal"><form id="drgf"><h2>GIVE: ${esc(x.name)}</h2><label>TO</label><select name="t">${T.map(t=>`<option value="${esc(t.h)}">${esc(t.n)}</option>`).join('')}</select>${q>1?`<label>HOW MANY (YOU HAVE ${q})</label><input type="number" name="n" min="1" max="${q}" value="${q}">`:''}<div class="meta" style="margin-top:6px">Armor and weapons are taken off first. Add a weapon to the other sheet's Weapons list from its own gear.</div><div style="margin-top:12px;display:flex;gap:8px"><button class="btn grn" type="submit">Give</button><button class="btn mg" type="button" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;$('#drgf').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),to=f.get('t'),n=Math.max(1,Math.min(q,Math.floor(+f.get('n')||q)));
  try{if(n>=q)await db.doc('inventory/'+id).update({owner:to,worn:false});
   else{await db.doc('inventory/'+id).update({qty:q-n});const c={...x};delete c.id;await db.collection('inventory').add({...c,owner:to,qty:n,worn:false,ts:Date.now()})}
   closeM();setTimeout(()=>{try{shLive()}catch(e){}},500)}catch(e){alert('Failed: '+(e.message||e.code))}}}
// ---- the sheet itself
function drTrim(R){const hide=e=>{if(e)e.style.display='none'},P=s=>R.querySelector(s);
 ['bennies','conv','player','concept'].forEach(k=>{const e=P('[data-sp="'+k+'"]');if(e)hide(e.parentElement)});const bn=P('[data-sp="bn"]');if(bn){const c=bn.closest('.bnc');hide(c&&c.parentElement)}
 const adv=$('#shadv');if(adv)hide(adv.parentElement);
 R.querySelectorAll('h2').forEach(h=>{if(/^POWERS/.test(h.textContent))hide(h.closest('.shsec'));if(/^POWER POINTS/.test(h.textContent)){hide(h);hide(h.nextElementSibling)}});hide($('#pptools'));
 const fat=P('[data-wd^="fatigue"]');if(fat)hide(fat.parentElement);hide($('#wsoak'));hide($('#wbleed'));
 const ar=$('#sharm');if(ar){const dt=ar.parentElement.querySelector('details');hide(dt)}
 ['#shpin'].forEach(s=>{const e=$(s);if(e)hide(e.closest('label'))});const hd=P('[data-sp="hidden"]');if(hd)hide(hd.closest('label'));
 const tm=P('[data-sp="toughMod"]');if(tm&&sh.dtb!==undefined&&sh.dtb!==''&&sh.dtb!==null){tm.disabled=true;tm.title='Not used: this drone has a fixed Toughness (set in the Drone box)'}
 const wt=R.querySelector('.wtk > .meta:last-child');if(wt&&!wt.id)wt.textContent=(+sh.dwl||0)?'At or over Toughness: Shaken. Every 4 over: a wound. Hit while Shaken: a wound. Past '+sh.dwl+' wound'+(sh.dwl>1?'s':'')+': Incapacitated (wrecked).':'At or over Toughness: Shaken. Any wound wrecks an Extra (Incapacitated).';
 const w=$('#shwild');if(w){const l=w.closest('label');let n=l.querySelector('[data-drwd]');if(!n){n=document.createElement('span');n.dataset.drwd='1';n.className='meta';l.appendChild(n)}n.textContent=drRigOn()?' (skills: rigger rolls it)':(+sh.dwl||0)>0?'':' (none: Extra)'}
 const bk=$('#shback');if(bk){const o=drOwnerDoc();bk.textContent=o?'< Back to '+drNm(o):'< All characters';bk.onclick=async()=>{await shSave();shId=o?o.id:null;sh=null;sheetsView()}}
 const dl=$('#shdel');if(dl){dl.textContent='Delete drone';dl.onclick=drDelete}
 // which die each skill roll will really use
 R.querySelectorAll('.shrow [data-r^="s:"]').forEach(b=>{const row=b.closest('.shrow');let t=row.querySelector('[data-drt]');if(t)t.remove();if(!drRigOn())return;const [,k,i]=b.dataset.r.split(':'),x=(sh.sk[k]||[])[+i];if(!x||!x.n)return;const r=drSkillOf(drMapSk(x.n)),d=r?+r.d||0:0;t=document.createElement('span');t.dataset.drt='1';t.className='meta';t.style.cssText='font-size:11px;white-space:nowrap;color:var(--cy)';t.textContent='→ '+(d?'d'+d+((+r.m)?(r.m>0?'+':'')+r.m:''):'d4−2');t.title=drNm(drOwnerDoc())+"'s "+drMapSk(x.n)+(drMapSk(x.n)!==x.n?" die is used for "+x.n:" die is used");b.parentNode.insertBefore(t,b)})}
async function drDelete(){if(!sh||!sh.drone||!shOwn())return;const o=drOwnerDoc(),oh=o?(o.handle||o.name):'',nm=sh.handle||sh.name,items=invOf(nm);
 if(!await ask('Move this drone to the trash?'+(items.length&&o?' Its '+items.length+' kind'+(items.length>1?'s':'')+' of gear go back to '+drNm(o)+'.':'')+' Anyone can restore the sheet from the Trash.'))return;
 try{await shSave();const sid=shId,own=o?o.id:null;for(const it of items)if(o)await db.doc('inventory/'+it.id).update({owner:oh,worn:false});
  await db.doc('sheets/'+sid).update({deleted:true,delAt:Date.now(),delBy:handle||'?'});shId=own;sh=null;sheetsView();undoBar('Drone moved to the trash.',()=>db.doc('sheets/'+sid).update({deleted:false}))}catch(e){alert('Failed: '+(e.message||e.code))}}
function drPanel(R){if(!sh||!sh.drone)return;const o=drOwnerDoc();let el=$('#drpanel');
 const d=shCan()?'':'disabled',rig=drRigOn(),dtb=sh.dtb!==undefined&&sh.dtb!==null?sh.dtb:'';
 const html=`<h2>🤖 DRONE <span class="meta">${o?'run by <a id="drown" style="cursor:pointer;color:var(--cy)">'+esc(drNm(o))+'</a>':'its rigger\'s sheet is gone, so it uses its own dice'}${sh.scale!==''&&sh.scale!==undefined?' · Scale '+esc(sh.scale):''}</span></h2>
  <div class="shg" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));margin:0 0 6px">
  <div><label>SKILL ROLLS USE</label><select id="drctl" ${d}><option value="rigger" ${sh.ctl!=='own'?'selected':''}>The rigger's dice${o?' ('+esc(drNm(o))+')':''}</option><option value="own" ${sh.ctl==='own'?'selected':''}>The drone's own dice</option></select></div>
  <div><label>WOUNDS BEFORE IT IS WRECKED</label><select id="drwl" ${d}>${DR_WL.map(w=>`<option value="${w[0]}" ${(+sh.dwl||0)===w[0]?'selected':''}>${w[1]}</option>`).join('')}</select></div>
  <div><label>TOUGHNESS (WITHOUT ARMOR)</label><input type="number" id="drtb" min="0" value="${esc(dtb)}" placeholder="auto: ${2+shHalf(swAtVal(sh,'vigor'))+(+sh.toughMod||0)}" ${d}></div>
  <div><label>BUILT-IN ARMOR</label><input type="number" id="drar" min="0" value="${+sh.armor||0}" ${d}></div>
  <div><label>SCALE</label><input id="drsc" value="${esc(sh.scale||'')}" placeholder="e.g. -2" ${d}></div>
  <div><label>STATUS</label><select id="drst" ${d}>${DR_ST.map(s=>`<option value="${s[0]}" ${(sh.dst||'deployed')===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></div></div>
  ${rig?`<div class="shg" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin:0 0 6px;align-items:end"><div><label style="display:inline"><input type="checkbox" id="drjp" ${sh.jump?'checked':''} ${d} style="width:auto"> <b>JUMPED IN</b></label> <span class="meta">the rigger is plugged into this drone</span></div><div><label>JUMPED-IN BONUS TO ITS ROLLS</label><input type="number" id="drjb" min="0" max="6" value="${sh.jb==null?2:+sh.jb}" ${d}></div><div><label style="display:inline"><input type="checkbox" id="drpar" ${sh.dpar?'checked':''} ${d} style="width:auto"> <b>PARRY FROM PILOTING</b></label> <span class="meta">2 + half the rigger's Piloting</span></div></div>`:''}
  <div class="meta" style="margin:4px 0 2px">DAMAGED SYSTEMS (tick what is broken)</div><div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:6px">${DR_SYS.map(s=>`<label style="display:inline" title="${esc(s[2])}"><input type="checkbox" data-drsys="${s[0]}" ${(sh.dsys||{})[s[0]]?'checked':''} ${d} style="width:auto"> ${esc(s[1])} <span class="meta">${esc(s[2])}</span></label>`).join('')}</div>
  <div class="meta">${rig?`Fighting, Shooting and Throwing rolls, and every weapon attack, use ${esc(drNm(o))}'s <b>Piloting</b> die and bonus. Any other skill uses ${esc(drNm(o))}'s skill of the same name. These rolls get a Wild Die and ${esc(drNm(o))}'s own wound penalties. The arrows (→) next to each skill show the die that will be rolled. Attribute rolls, damage (Str+...), Toughness, armor and gear effects come from the drone.`:`Rolls use this drone's own attributes and skills below${(+sh.dwl||0)>0?'':' with no Wild Die (an Extra)'}.`} No Bennies. Gear moves to and from the rigger with <b>Give to...</b> in Funds &amp; Equipment.</div>`;
 if(!el){el=document.createElement('div');el.id='drpanel';el.className='shsec';el.style.marginBottom='12px';const ref=$('#fxleg');ref.parentNode.insertBefore(el,ref)}
 if(el.dataset.sig===html)return;el.dataset.sig=html;el.innerHTML=html;
 const sv=(id,path,f,rebuild)=>{const e=$('#'+id);if(e)e.onchange=()=>{shSet(path,f(e.value));if(rebuild)shBuild()}};
 sv('drctl','ctl',v=>v,1);sv('drwl','dwl',v=>+v||0,1);sv('drtb','dtb',v=>v===''?'':Math.max(0,+v||0),1);sv('drar','armor',v=>Math.max(0,+v||0),1);sv('drsc','scale',v=>v.trim());
 sv('drst','dst',v=>v,1);sv('drjb','jb',v=>Math.max(0,Math.min(6,Math.floor(+v)||0)),1);
 const jp=$('#drjp');if(jp)jp.onchange=()=>{shSet('jump',jp.checked);shBuild()};const pr=$('#drpar');if(pr)pr.onchange=()=>{shSet('dpar',pr.checked);shBuild()};
 el.querySelectorAll('[data-drsys]').forEach(c=>c.onchange=()=>{if(!sh.dsys)sh.dsys={};shSet('dsys.'+c.dataset.drsys,c.checked);shBuild()});
 const a=$('#drown');if(a)a.onclick=()=>drOpen(o.id)}
// the box on the rigger's sheet
function drDraw(){if(!sh||sh.drone)return;const live=$('#shlive');if(!live)return;let el=$('#shdrn');const L=drList(shId);
 if(!el){if(!L.length&&!shOwn())return;el=document.createElement('div');el.id='shdrn';el.className='shsec';el.style.marginBottom='12px';live.insertAdjacentElement('afterend',el)}
 const row=x=>{let t='?';try{t=pinTough(x)}catch(e){}const w=Math.min(shWM(x),+x.wounds||0),st=(x.status||[]);
  return `<div class="row" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:180px"><b>${esc(x.name)}</b>${x.hidden?' <span class="tag">🙈 HIDDEN</span>':''} <span class="meta">${esc(drStat(x))}${x.jump?' · jumped in':''} · ${esc(x.scale!==''&&x.scale!==undefined?'Scale '+x.scale+' · ':'')}Toughness ${esc(t)} · ${x.inc?'<b style="color:var(--red)">WRECKED</b>':w?w+' wound'+(w>1?'s':''):'undamaged'}${st.length?' · '+esc(st.join(', ')):''} · ${x.ctl==='own'?'own dice':'rolls with your dice'}</span></span><label style="display:inline;margin:0" title="Show this drone under your character in the side bar"><input type="checkbox" data-drsd="${x.id}" ${shSide(x)?'checked':''} style="width:auto"> side bar</label> <button class="btn sm" data-drsend="${x.id}" ${shCan()?'':'disabled'}>${(x.dst||'deployed')==='deployed'||x.dst==='away'?'Recall':'Send out'}</button> <button class="btn sm" data-dro="${x.id}">Open</button></div>`};
 const html=`<h2>🤖 DRONES <span class="meta">${L.length?L.length+' linked':'machines you run'}</span></h2>${L.length?L.map(row).join(''):'<div class="meta">No drones yet. A drone has its own sheet for Toughness, armor, wounds, weapons and gear, and rolls with your skill dice.</div>'}${shOwn()?'<div style="margin-top:6px"><button class="btn sm" id="drnew">+ Add drone</button></div>':''}`;
 if(el.dataset.sig===html)return;el.dataset.sig=html;el.innerHTML=html;
 el.querySelectorAll('[data-dro]').forEach(b=>b.onclick=()=>drOpen(b.dataset.dro));el.querySelectorAll('[data-drsend]').forEach(b=>b.onclick=async()=>{const id=b.dataset.drsend,d=(pm.sheets||[]).find(x=>x.id===id)||{};try{await db.doc('sheets/'+id).update({dst:((d.dst||'deployed')==='deployed'||d.dst==='away')?'stowed':'deployed'})}catch(er){alert('Could not save: '+(er.message||er.code))}});el.querySelectorAll('[data-drsd]').forEach(c=>c.onchange=async()=>{const id=c.dataset.drsd,d=(pm.sheets||[]).find(x=>x.id===id)||{},cur=(d.side||[]).filter(z=>z!==uid);if(c.checked)cur.push(uid);try{await db.doc('sheets/'+id).update({side:cur})}catch(er){alert('Could not save: '+(er.message||er.code));c.checked=!c.checked}});const nb=$('#drnew');if(nb)nb.onclick=drAddModal}
function drApply(){const R=$('#sheetroot');if(!R||!sh)return;if(sh.drone){R.classList.add('drone');drTrim(R);drPanel(R)}else drDraw();try{plApply()}catch(e){}}

// side bar order: each character, then its drones just underneath
function drSideOrder(L){const nm=(a,b)=>String(a.name).localeCompare(String(b.name)),base=L.filter(x=>!x.drone).sort(nm),dr=L.filter(x=>x.drone),out=[];
 base.forEach(b=>{out.push(b);dr.filter(d=>d.owner===b.id).sort(nm).forEach(d=>out.push(d))});
 dr.filter(d=>!base.some(b=>b.id===d.owner)).sort(nm).forEach(d=>out.push(d));return out}

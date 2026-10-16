// ---- Vehicles (own stat line, damage, driving rolls) and packed gear that goes with the loadouts
let vhOpen=false;
const VH_PACK_SKIP=['Cyberware','Vehicles','Drones','Ranged Weapons','Melee Weapons','Armor'];
const vhItems=()=>(sh&&!sh.drone)?invOf(sh.handle||sh.name).filter(x=>x.cat==='Vehicles'):[];
const vhPackable=()=>(sh&&!sh.drone)?invOf(sh.handle||sh.name).filter(x=>!VH_PACK_SKIP.includes(x.cat)):[];
function vhStats(it){const t=String(it.info||''),g=rx=>{const m=rx.exec(t);return m?m[1]:''};return{size:g(/Size\s*(-?\d+)/i),scale:g(/Scale Mod\s*(-?\d+)/i),hand:g(/Handling\s*(-?\d+)/i),speed:g(/Top Speed\s*(\d+)/i),tough:g(/Toughness\s*(\d+(?:\s*\(\d+\))?)/i),crew:g(/Crew\s*([\d+]+)/i)}}
function vhSkill(it){const t=(it.sub||'')+' '+(it.name||'')+' '+(it.info||'');return /aircraft|plane|helicop|vtol|rotor|jet\b|gyro|airship|zeppelin/i.test(t)?'Piloting':/boat|ship|hover|watercraft|submar|jet ?ski|launch\b/i.test(t)?'Boating':'Driving'}
const vhSt=id=>{const v=(sh.veh&&sh.veh[id])||{};return{w:Math.max(0,Math.min(4,+v.w||0)),wr:!!v.wr,h:v.h===''||v.h==null?null:+v.h,sk:v.sk||'',n:v.n||''}};
function vhSet(id,patch){sh.veh=sh.veh||{};sh.veh[id]={...(sh.veh[id]||{}),...patch};shDirty.add('veh');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);vhDraw(true)}
function vhFindSkill(nm){let f=null;for(const k in sh.sk)sh.sk[k].forEach(x=>{if(x.n===nm)f=x});return f}
function vhRoll(id){if(!shCan())return;const it=vhItems().find(x=>x.id===id);if(!it)return;const st=vhSt(id);if(st.wr)return alert('That vehicle is wrecked.');const s=vhStats(it),sk=st.sk||vhSkill(it),f=vhFindSkill(sk);
 if(!f)return alert('This sheet has no '+sk+' skill.');const hand=st.h==null?(+s.hand||0):st.h,xs=[];if(hand)xs.push(['Handling',hand]);if(st.w)xs.push(['Vehicle damage',-st.w]);
 shRoll(+f.d||4,f.m,it.name+' ('+f.n+')',!+f.d,false,{sk:f.n},xs)}
function vhSnap(){return{veh:sh&&sh.actVeh||'',pack:((sh&&sh.pack)||[]).slice()}}
function vhApply(l){if(!sh||!l)return;const have=new Set(invOf(sh.handle||sh.name).map(x=>x.id));sh.actVeh=l.veh&&have.has(l.veh)?l.veh:'';sh.pack=(l.pack||[]).filter(id=>have.has(id));shDirty.add('actVeh');shDirty.add('pack');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);vhDraw(true)}
function vhMeta(l){const bits=[];const it=l.veh&&invOf(sh.handle||sh.name).find(x=>x.id===l.veh);if(it)bits.push('🚗 '+esc(it.name));const n=(l.pack||[]).filter(id=>invOf(sh.handle||sh.name).some(x=>x.id===id)).length;if(n)bits.push(n+' packed');return bits.length?' · '+bits.join(' · '):''}
function vhDraw(force){const R=$('#sheetroot');if(!R||!sh)return;let el=$('#shveh');const V=vhItems(),P=vhPackable();
 if(!V.length&&!P.length){if(el)el.remove();return}
 if(!el){const ref=$('#fxleg');if(!ref||!ref.parentNode)return;el=document.createElement('div');el.id='shveh';el.className='shsec';el.style.marginBottom='12px';ref.parentNode.insertBefore(el,ref)}
 const can=shCan(),act=sh.actVeh||'',pack=new Set(sh.pack||[]);
 const sig=JSON.stringify([V.map(x=>[x.id,x.name,x.info]),P.map(x=>[x.id,x.name]),sh.veh,act,[...pack],can,Object.keys(sh.sk).length]);if(!force&&el.dataset.sig===sig)return;el.dataset.sig=sig;
 const order=V.slice().sort((a,b)=>(a.id===act?-1:0)-(b.id===act?-1:0));
 const card=it=>{const s=vhStats(it),st=vhSt(it.id),sk=st.sk||vhSkill(it),hand=st.h==null?(+s.hand||0):st.h,f=vhFindSkill(sk),inUse=it.id===act;
  return `<div class="row" style="cursor:default;${inUse?'border-left:4px solid var(--cy)':''}${st.wr?';opacity:.65':''}"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${esc(it.name)}</b>${inUse?' <span class="tag" style="color:#000;background:#39ff14">IN USE</span>':''}${st.wr?' <span class="tag" style="color:var(--mg);border-color:var(--mg)">WRECKED</span>':''}<span style="margin-left:auto;white-space:nowrap"><button class="btn sm ${inUse?'':'grn'}" data-vhu="${esc(it.id)}" ${can?'':'disabled'}>${inUse?'Put away':'Use this vehicle'}</button> <button class="btn sm rb" data-vhr="${esc(it.id)}" ${can&&!st.wr?'':'disabled'} title="Roll ${esc(sk)}${hand?' with Handling '+(hand>0?'+':'')+hand:''}${st.w?' and −'+st.w+' for damage':''}">🎲 ${esc(sk)}${f?' d'+(+f.d||4):' (no skill)'}</button></span></div>
  <div class="meta">${[s.size!==''?'Size '+s.size:'',s.scale!==''&&s.scale!=='0'?'Scale '+s.scale:'',s.hand!==''||st.h!=null?'Handling '+(hand>0?'+':'')+hand:'',s.speed?'Top Speed '+s.speed:'',s.tough?'Toughness '+esc(s.tough):'',s.crew?'Crew '+esc(s.crew):''].filter(Boolean).join(' · ')||esc(it.info||'')}</div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:4px"><span class="meta">DAMAGE</span><button class="btn sm" data-vhw="${esc(it.id)}|-1" ${can?'':'disabled'}>−</button><b style="min-width:42px;text-align:center;color:${st.w?'var(--mg)':'var(--tx)'}" title="Each wound is −1 to driving rolls">${st.w} wound${st.w===1?'':'s'}</b><button class="btn sm" data-vhw="${esc(it.id)}|1" ${can?'':'disabled'}>+</button>
  <label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" data-vhx="${esc(it.id)}" ${st.wr?'checked':''} ${can?'':'disabled'}> Wrecked</label>
  <label class="meta">SKILL <select data-vhs="${esc(it.id)}" ${can?'':'disabled'}>${['Driving','Boating','Piloting'].map(k=>`<option ${k===sk?'selected':''}>${k}</option>`).join('')}</select></label>
  <label class="meta">HANDLING <input type="number" data-vhh="${esc(it.id)}" value="${hand}" style="width:54px" ${can?'':'disabled'} title="Added to rolls with this vehicle. Taken from the vehicle's stat line; change it if your table uses a different rule."></label></div>
  <input data-vhn="${esc(it.id)}" value="${esc(st.n)}" placeholder="Notes (mods, mounted weapons, plates...)" maxlength="200" style="width:100%;margin-top:4px" ${can?'':'disabled'}></div>`};
 el.innerHTML=`<h2>🚗 VEHICLES &amp; PACKED GEAR</h2>${V.length?order.map(card).join(''):'<div class="meta">// NO VEHICLES. BUY ONE IN GEAR &amp; SHOPPING AND IT SHOWS UP HERE.</div>'}
 ${P.length?`<details id="vhdet" style="margin-top:8px" ${vhOpen||pack.size?'open':''}><summary class="meta" style="cursor:pointer">PACKED GEAR (${[...pack].filter(id=>P.some(x=>x.id===id)).length}) · what you are carrying on this run. Saved with each loadout.</summary><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2px 12px;margin-top:4px">${P.map(x=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-vhp="${esc(x.id)}" ${pack.has(x.id)?'checked':''} ${can?'':'disabled'}> ${x.qty>1?x.qty+'× ':''}${esc(x.name)}</label>`).join('')}</div></details>`:''}`;
 const dt=el.querySelector('#vhdet');if(dt)dt.addEventListener('toggle',()=>{vhOpen=dt.open});
 el.querySelectorAll('[data-vhu]').forEach(b=>b.onclick=()=>{sh.actVeh=act===b.dataset.vhu?'':b.dataset.vhu;shDirty.add('actVeh');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);vhDraw(true)});
 el.querySelectorAll('[data-vhr]').forEach(b=>b.onclick=()=>vhRoll(b.dataset.vhr));
 el.querySelectorAll('[data-vhw]').forEach(b=>b.onclick=()=>{const [id,d]=b.dataset.vhw.split('|');vhSet(id,{w:Math.max(0,Math.min(4,vhSt(id).w+(+d)))})});
 el.querySelectorAll('[data-vhx]').forEach(c=>c.onchange=()=>vhSet(c.dataset.vhx,{wr:c.checked}));
 el.querySelectorAll('[data-vhs]').forEach(c=>c.onchange=()=>vhSet(c.dataset.vhs,{sk:c.value}));
 el.querySelectorAll('[data-vhh]').forEach(c=>c.onchange=()=>vhSet(c.dataset.vhh,{h:c.value===''?null:Math.max(-9,Math.min(9,Math.round(+c.value)||0))}));
 el.querySelectorAll('[data-vhn]').forEach(c=>c.onchange=()=>{sh.veh=sh.veh||{};sh.veh[c.dataset.vhn]={...(sh.veh[c.dataset.vhn]||{}),n:c.value.trim()};shDirty.add('veh');clearTimeout(shTimer);shTimer=setTimeout(shSave,700)});
 el.querySelectorAll('[data-vhp]').forEach(c=>c.onchange=()=>{const s=new Set(sh.pack||[]);c.checked?s.add(c.dataset.vhp):s.delete(c.dataset.vhp);sh.pack=[...s];shDirty.add('pack');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);vhDraw(true)})}

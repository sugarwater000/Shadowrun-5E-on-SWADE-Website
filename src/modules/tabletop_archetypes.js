// ---- Tabletop: enemy archetype library (Savage Worlds stat blocks with a Shadowrun flavour) and the stat block panel.
// A stat block is the token's cs: {par,tg,ar,fi,sh,st,vi,sp,wc,bn,nt,w:[weapons]} plus its health bar (mhp wound levels).
// Extras go out of action on the first wound (1 level). Wild Cards have 4 levels: the 4th wound is Incapacitated.
// Parry = 2 + half Fighting. Toughness = 2 + half Vigor + armor + Size. Both are worked out here and can be edited on the token afterwards.
const TB_ARW={
 knife:['Knife','','Str+d4',0,'Fighting',''],club:['Club','','Str+d4',0,'Fighting',''],bat:['Bat','','Str+d4',0,'Fighting',''],machete:['Machete','','Str+d6',0,'Fighting',''],
 fists:['Fists','','Str',0,'Fighting',''],baton:['Stun baton','','Str+d6',0,'Fighting',''],katana:['Katana','','Str+d8',0,'Fighting',''],mono:['Monosword','','Str+d8+2',4,'Fighting',''],
 bigclub:['Big club','','Str+d8',0,'Fighting',''],claws:['Claws','','Str+d6',0,'Fighting',''],bite:['Bite','','Str+d4',0,'Fighting',''],bitebig:['Bite','','Str+d6',0,'Fighting',''],
 lpistol:['Light pistol','10/20/40','2d6',0,'Shooting',1],pistol:['Pistol','12/24/48','2d6',1,'Shooting',1],hpistol:['Heavy pistol','12/24/48','2d6+1',2,'Shooting',1],
 smg:['SMG','12/24/48','2d6',0,'Shooting',3],rifle:['Assault rifle','24/48/96','2d8',2,'Shooting',3],shotgun:['Shotgun (3d6 close, less far)','12/24/48','3d6',0,'Shooting',1],
 sniper:['Sniper rifle','50/100/200','2d10',2,'Shooting',1],hmg:['Heavy machine gun','30/60/120','2d10',2,'Shooting',3],frag:['Frag grenade','5/10/20','3d6',0,'Throwing',1],
 bolt:['Bolt (spell)','12/24/48','2d6',0,'Shooting',1],flame:['Flame breath','3/6/12','2d6',0,'Shooting',1]};
// k key, n name, g group, e emoji, fi/sh/st/vi/sp dice, ar armor (inside Toughness), wc Wild Card, w weapons, sz token size, size = Size (Toughness bonus), pb Parry bonus, tb extra Toughness, bn Bennies, sd spell die (the Shooting die for spell weapons), t notes
const TB_ARCH=[
 {k:'ganger',n:'Ganger',g:'Street',e:'🧢',fi:6,sh:6,st:6,vi:6,sp:6,ar:1,w:['pistol','knife'],t:'Gang colours, lined coat. Runs when the boss goes down (Spirit roll).'},
 {k:'hallow',n:'Halloweener',g:'Street',e:'🎃',fi:8,sh:6,st:6,vi:6,sp:6,ar:1,w:['machete','pistol'],t:'Brutal and loud. Likes the close work.'},
 {k:'orkgang',n:'Ork ganger',g:'Street',e:'🐗',fi:6,sh:6,st:8,vi:8,sp:6,ar:1,w:['club','shotgun'],t:'Big, tough and in a gang. Hits hard in the hall.'},
 {k:'thug',n:'Thug',g:'Street',e:'👊',fi:6,sh:4,st:6,vi:6,sp:6,ar:0,w:['club','knife'],t:'Muscle for hire. No armor.'},
 {k:'junkie',n:'Strung-out junkie',g:'Street',e:'💉',fi:6,sh:4,st:6,vi:6,sp:4,ar:0,w:['knife'],t:'Desperate and unpredictable. Panics at the first wound.'},
 {k:'scav',n:'Squatter sniper',g:'Street',e:'🏚️',fi:4,sh:8,st:6,vi:6,sp:6,ar:1,w:['rifle'],t:'Knows the building. Likes high windows.'},
 {k:'guard',n:'Corp security guard',g:'Corporate',e:'🛡️',fi:6,sh:8,st:6,vi:6,sp:6,ar:2,w:['pistol','baton'],t:'Armored vest. Calls for backup on the first shot.'},
 {k:'resp',n:'Corp response team',g:'Corporate',e:'🪖',fi:8,sh:8,st:8,vi:8,sp:8,ar:4,w:['rifle','pistol'],t:'Full body armor, trained, in squads. Arrives a few rounds after the alarm.'},
 {k:'capt',n:'Corp security captain',g:'Corporate',e:'🎖️',wc:1,fi:8,sh:10,st:6,vi:8,sp:8,ar:3,bn:2,w:['hpistol','smg'],t:'Edges: Level Headed, Marksman. Directs the guards.'},
 {k:'agent',n:'Corp agent',g:'Corporate',e:'🕴️',wc:1,fi:8,sh:10,st:6,vi:6,sp:8,ar:2,bn:2,w:['hpistol'],t:'Edges: Quick, Marksman. Cool, well paid and well informed.'},
 {k:'suit',n:'Corp suit (VIP)',g:'Corporate',e:'💼',fi:4,sh:4,st:4,vi:6,sp:6,ar:1,w:[],t:'A target, not a fighter. Hides behind the guards.'},
 {k:'cop',n:'Lone Star patrol officer',g:'Law',e:'👮',fi:6,sh:6,st:6,vi:6,sp:6,ar:2,w:['pistol','baton'],t:'Patrol vest. Backup is a few minutes away.'},
 {k:'swat',n:'Lone Star SWAT',g:'Law',e:'🚔',fi:6,sh:8,st:8,vi:8,sp:8,ar:4,w:['rifle','pistol','frag'],t:'Heavy armor, breach and clear. Flash-bangs on the way in.'},
 {k:'lt',n:'Lone Star lieutenant',g:'Law',e:'⭐',wc:1,fi:8,sh:8,st:6,vi:8,sp:8,ar:3,bn:2,w:['hpistol','smg'],t:'Edges: Level Headed, Command. Calls in the SWAT team.'},
 {k:'yaku',n:'Yakuza enforcer',g:'Crime',e:'🐉',fi:8,sh:8,st:8,vi:6,sp:8,ar:2,w:['katana','pistol'],t:'Never takes a step back. Loyal to the oyabun.'},
 {k:'yaklt',n:'Yakuza lieutenant',g:'Crime',e:'🎴',wc:1,fi:10,sh:8,st:8,vi:8,sp:8,ar:2,bn:2,w:['katana','hpistol'],t:'Edges: Block, Trademark Weapon. Calm until it is not.'},
 {k:'mafia',n:'Mafia soldier',g:'Crime',e:'🧥',fi:6,sh:8,st:6,vi:6,sp:6,ar:2,w:['pistol','smg'],t:'Armored long coat.'},
 {k:'body',n:'Bodyguard',g:'Crime',e:'🕶️',fi:8,sh:8,st:8,vi:8,sp:8,ar:3,w:['hpistol','fists'],t:'Hard to shoot past. Takes the hit for the boss (Interpose).'},
 {k:'bount',n:'Bounty hunter',g:'Crime',e:'🎯',wc:1,fi:8,sh:10,st:8,vi:8,sp:8,ar:2,bn:2,w:['hpistol','shotgun'],t:'Edges: Marksman, Trademark Weapon. Wants you alive or paid.'},
 {k:'snip',n:'Sniper',g:'Crime',e:'🔭',fi:4,sh:10,st:6,vi:6,sp:8,ar:1,w:['sniper','pistol'],t:'Patient. Called shots to the head at long range.'},
 {k:'sam',n:'Street samurai',g:'Shadowrunners',e:'🥷',wc:1,fi:10,sh:10,st:8,vi:8,sp:8,ar:4,bn:2,w:['mono','smg'],t:'Cyberware: reflex boosters (Quick), smartlink (+1 to hit with a linked gun), dermal plating. Edges: Quick, Frenzy.'},
 {k:'merc',n:'Mercenary',g:'Shadowrunners',e:'💂',fi:8,sh:8,st:8,vi:8,sp:8,ar:3,w:['rifle','pistol','knife'],t:'Seen it before. Fights in pairs.'},
 {k:'runner',n:'Shadowrunner (generic)',g:'Shadowrunners',e:'🕵️',wc:1,fi:8,sh:8,st:6,vi:8,sp:8,ar:2,bn:2,w:['pistol','smg'],t:'A rival team member. Change the numbers to fit the job.'},
 {k:'decker',n:'Decker',g:'Shadowrunners',e:'💻',wc:1,fi:4,sh:6,st:4,vi:6,sp:8,ar:1,bn:2,w:['lpistol'],t:'Hacking d10 on the Net. Stays behind the team and avoids a fair fight.'},
 {k:'rigger',n:'Rigger',g:'Shadowrunners',e:'🚗',wc:1,fi:4,sh:6,st:6,vi:6,sp:6,ar:1,bn:2,w:['pistol'],t:'Piloting d10. Usually in a vehicle or behind drones: add them from the Vehicles list.'},
 {k:'adept',n:'Physical adept',g:'Magic',e:'🥋',wc:1,fi:10,sh:6,st:8,vi:8,sp:8,ar:1,bn:2,pb:1,w:['fists','katana'],t:'Magic in the body: Parry +1 (improved reflexes). Fast and hard to pin down.'},
 {k:'mage',n:'Mage',g:'Magic',e:'🧙',wc:1,fi:4,sh:6,st:4,vi:6,sp:10,ar:0,bn:2,sd:10,w:['bolt','lpistol'],t:'Spellcasting d10 (used for the Bolt attack). Other spells are up to the GM: Stun, Barrier, Healing.'},
 {k:'shaman',n:'Shaman',g:'Magic',e:'🦅',wc:1,fi:4,sh:6,st:4,vi:6,sp:10,ar:0,bn:2,sd:10,w:['bolt','knife'],t:'Spellcasting d10 and a spirit ally: add a Spirit from this list next to the shaman.'},
 {k:'spirit',n:'Spirit (Force 3)',g:'Magic',e:'👻',fi:8,sh:4,st:8,vi:8,sp:8,ar:2,w:['claws'],t:'Spirits are hard to hurt with ordinary weapons (GM call: halve their damage). Gone when the summoner falls.'},
 {k:'insect',n:'Insect spirit',g:'Magic',e:'🪲',fi:8,sh:4,st:8,vi:8,sp:6,ar:2,w:['bitebig'],t:'Hive creature. More arrive until the nest is destroyed.'},
 {k:'dog',n:'Guard dog',g:'Creatures',e:'🐕',fi:6,sh:4,st:6,vi:6,sp:6,ar:0,w:['bite'],t:'Pace 8 (running die d10). Barks first.'},
 {k:'hound',n:'Hellhound',g:'Creatures',e:'🔥',fi:8,sh:8,st:10,vi:8,sp:8,ar:1,size:1,w:['bitebig','flame'],t:'Size 1. Flame breath burns (cone, GM call). Immune to fire.'},
 {k:'rat',n:'Devil rat',g:'Creatures',e:'🐀',fi:6,sh:4,st:4,vi:4,sp:6,ar:0,size:-2,sz:.5,w:['bite'],t:'Size −2. Comes in swarms. Disease on a bite (GM call).'},
 {k:'ghoul',n:'Ghoul',g:'Creatures',e:'🧟',fi:8,sh:4,st:8,vi:8,sp:6,ar:0,w:['claws'],t:'A bite can spread disease. Hungry, not bright.'},
 {k:'troll',n:'Troll bouncer',g:'Creatures',e:'👹',fi:8,sh:4,st:12,vi:10,sp:6,ar:2,size:2,w:['bigclub','fists'],t:'Size 2, dermal armor. Reach 1. Throws people out of the club.'},
 {k:'sdrone',n:'Security drone',g:'Drones',e:'🤖',fi:0,sh:8,st:6,vi:6,sp:6,ar:3,size:-1,w:['smg'],t:'A robot: no Fighting, so Parry 2. Immune to Shaken effects of poison and fear (GM call). Pace 8, flies.'},
 {k:'sentry',n:'Sentry gun',g:'Drones',e:'🔫',fi:0,sh:8,st:6,vi:8,sp:6,ar:6,size:1,w:['hmg'],t:'Does not move. Wrecked at the first wound. Can be hacked or shot at its motor.'},
 {k:'civ',n:'Bystander',g:'Other',e:'🧍',fi:4,sh:4,st:4,vi:6,sp:6,ar:0,w:[],t:'Just here for a drink. Runs or hides.'}];
const TB_ARG=['Street','Corporate','Law','Crime','Shadowrunners','Magic','Creatures','Drones','Other'];
function tbArchBuild(a){const D=(v)=>+v||0,fi=D(a.fi),vi=D(a.vi),ar=D(a.ar),par=2+(fi?fi/2:0)+D(a.pb),tg=2+vi/2+ar+D(a.size)+D(a.tb),
  w=(a.w||[]).map(k=>TB_ARW[k]).filter(Boolean).map(x=>({n:x[0],rng:x[1],dmg:x[2],ap:x[3],sk:x[4],rof:x[5]?String(x[5]):'',...(/spell/i.test(x[0])&&a.sd?{d:a.sd}:{})}));
 return {cs:{par:Math.floor(par),tg:Math.floor(tg),ar,fi,sh:D(a.sh),st:D(a.st),vi,sp:D(a.sp),wc:!!a.wc,bn:a.bn!=null?D(a.bn):undefined,nt:a.t||'',ak:a.k,w},mhp:a.wc?4:1}}
// pictures the GM chose for an archetype, kept in one shared doc so every new token of that type uses them
const tbArPics=()=>{const d=(pm.tbmeta||[]).find(x=>x&&x.id==='archpics'),o={};if(d&&d.pics&&typeof d.pics==='object')for(const k in d.pics)if(tbOk(d.pics[k]))o[k]=d.pics[k];return o};
async function tbArPicSet(k,img){const pics={...tbArPics()};if(img&&tbOk(img))pics[k]=img;else delete pics[k];const d=(pm.tbmeta||[]).find(x=>x&&x.id==='archpics');if(d)d.pics=pics;else(pm.tbmeta=pm.tbmeta||[]).push({id:'archpics',pics});
 await db.doc('tbmeta/archpics').set({pics,ts:Date.now(),by:handle||'GM'})}
let tbArQ='',tbArG='',tbArN=1,tbArT=true;
function tbArchBody(el,m){const q=tbArQ.trim().toLowerCase(),L=TB_ARCH.filter(a=>(!tbArG||a.g===tbArG)&&(!q||(a.n+' '+a.g+' '+a.t).toLowerCase().includes(q)));
 const pics=tbArPics(),row=a=>{const b=tbArchBuild(a),c=b.cs,pc=pics[a.k];return `<a class="row tbpr" data-tbar="${esc(a.k)}">${pc?`<img src="/_blob/${esc(pc)}" alt="">`:`<span class="tbpi">${esc(a.e)}</span>`}<div style="flex:1;min-width:0"><div class="t">${esc(a.n)} <span class="meta">${a.wc?'Wild Card':'Extra'}</span></div>
  <div class="meta">Parry ${c.par} · Toughness ${c.tg}${c.ar?' ('+c.ar+' armor)':''} · ${c.w.length?esc(c.w.map(x=>x.n.replace(/ \(.*/,'')).join(', ')):'unarmed'}</div></div><button type="button" class="btn sm" data-tbarp="${esc(a.k)}" title="${pc?'Change the picture for this archetype':'Choose a picture for this archetype: new tokens will use it'}">🖼</button>${pc?`<button type="button" class="btn sm mg" data-tbarx="${esc(a.k)}" title="Go back to the emoji">✕</button>`:''}<span class="btn sm">Add</span></a>`};
 el.innerHTML=`<div class="hint" style="margin:0 0 8px">Click one to drop it on the map with its Parry, Toughness, armor, weapons and health filled in. The numbers are the usual Savage Worlds values for that kind of opponent: change them on the token afterwards, or from the attack window.</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:6px"><div style="flex:1;min-width:150px"><input id="tbarq" placeholder="Search archetypes…" value="${esc(tbArQ)}"></div><div style="width:84px"><label>HOW MANY</label><input type="number" id="tbarn" min="1" max="20" value="${tbArN}"></div><label class="tbck"><input type="checkbox" id="tbart" ${tbArT?'checked':''}> Temporary</label></div>
 <div class="tbvb" style="margin-bottom:6px;flex-wrap:wrap"><button class="btn sm ${tbArG?'':'on'}" data-tbarg="">All (${TB_ARCH.length})</button>${TB_ARG.map(g=>`<button class="btn sm ${tbArG===g?'on':''}" data-tbarg="${esc(g)}">${esc(g)}</button>`).join('')}</div>
 <input type="file" id="tbarpf" accept="image/*" hidden><div id="tbarlist">${L.length?L.map(row).join(''):'<div class="empty">// NOTHING MATCHES.</div>'}</div>`;
 const i=$("#tbarq");if(i)i.oninput=()=>{tbArQ=i.value;const p=i.selectionStart;tbArchBody(el,m);const j=$('#tbarq');if(j){j.focus();try{j.setSelectionRange(p,p)}catch(e){}}};
 const nI=$('#tbarn');if(nI)nI.onchange=()=>{tbArN=Math.max(1,Math.min(20,parseInt(nI.value)||1))};const tI=$('#tbart');if(tI)tI.onchange=()=>{tbArT=tI.checked};
 el.querySelectorAll('[data-tbarg]').forEach(b=>b.onclick=()=>{tbArG=b.dataset.tbarg;tbArchBody(el,m)});
 let picFor='';const pf=$('#tbarpf');
 el.querySelectorAll('[data-tbarp]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();ev.preventDefault();picFor=b.dataset.tbarp;if(pf)pf.click()});
 el.querySelectorAll('[data-tbarx]').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();ev.preventDefault();try{await tbArPicSet(b.dataset.tbarx,'');tbArchBody(el,m)}catch(e){alert('Could not save: '+(e.message||e.code))}});
 if(pf)pf.onchange=async()=>{const file=pf.files&&pf.files[0];pf.value='';if(!file||!picFor)return;if(!assets)return alert('Uploading is not available right now.');
  try{const sh=await tbShrink(file,320,.85),up=await assets.upload(sh.blob);await tbArPicSet(picFor,up.id);tbArchBody(el,m)}catch(e){alert('Upload failed: '+(e.message||e.code))}};
 el.querySelectorAll('[data-tbar]').forEach(a=>a.onclick=async()=>{const A=TB_ARCH.find(x=>x.k===a.dataset.tbar);if(!A)return;const n=Math.max(1,Math.min(20,parseInt(($('#tbarn')||{}).value)||1)),temp=!!($('#tbart')||{}).checked;tbArN=n;tbArT=temp;
  try{const id=await tbArchDrop(m,A,n,temp);tbSel=id;tbPOk('Added '+(n>1?n+' × ':'')+A.n+'.')}catch(e){alert('Could not add: '+(e.message||e.code))}})}
// puts n of them on the map (numbered when there is more than one, or one already there)
async function tbArchDrop(m,A,n,temp){const b=tbArchBuild(A),base=A.n,exists=tbToks(m).some(t=>t.name===base||new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\d+$','i').test(t.name||''));
 let k=n>1||exists?tbNextNum(m,base):0,last='';
 const pic=tbArPics()[A.k]||'';
 for(let i=0;i<n;i++)last=await tbAddTok(m,{kind:'enemy',name:k?base+' '+(k+i):base,emoji:A.e,img:pic,sz:A.sz||1,temp,cs:b.cs,mhp:b.mhp,hp:b.mhp});
 return last}
// ---- the stat block on the token panel (GM only): what the token knows, and a form to change it
function tbStatLine(t){const c=t.cs||{};if(!(c.par||c.tg||(c.w||[]).length))return '';const d=k=>+c[k]?'d'+c[k]:'—';
 return `Parry <b>${+c.par||0}</b> · Toughness <b>${+c.tg||0}</b>${+c.ar?' ('+c.ar+' armor)':''} · Fighting ${d('fi')} · Shooting ${d('sh')} · Str ${d('st')} · Vigor ${d('vi')} · Spirit ${d('sp')}${c.wc?' · <b>Wild Card</b>':' · Extra'}${+t.mhp>0?' · health '+(t.hp==null?t.mhp:t.hp)+'/'+t.mhp:''}`}
function tbStatPanel(L){if(!isOwner||!L||L.length!==1)return '';const t=L[0];if(t.sheet||t.kind==='pc'||t.kind==='prop'||t.kind==='item')return '';const c=t.cs||{},ln=tbStatLine(t);
 return `<div class="tbcw"><div class="meta">STAT BLOCK <span style="color:var(--dim)">(only you see this)</span></div>${ln?`<div style="font-size:12.5px;margin:3px 0">${ln}</div>`:'<div class="meta">No numbers yet. Add them so attacks against and from this token fill themselves in.</div>'}
  ${(c.w||[]).length?`<div class="meta">${c.w.map(w=>esc(w.n)+' '+(w.rng?esc(w.rng)+' ':'')+esc(w.dmg||'')+(+w.ap?' AP'+(+w.ap):'')+(+w.rof>1?' ROF'+(+w.rof):'')).join(' · ')}</div>`:''}${c.nt?`<div class="meta" style="margin-top:3px">${esc(c.nt)}</div>`:''}
  <div class="tbvb"><button class="btn sm" data-tbx="statedit">✏ ${ln?'Edit':'Add'} stat block</button></div></div>`}
TBX.statedit=()=>{const L=tbSelToks();if(L.length!==1||!isOwner)return;tbStatForm(L[0])};
function tbStatForm(t){const c=t.cs||{},w=(c.w||[]).slice(0,5);while(w.length<3)w.push({});
 const dsel=(id,v)=>`<select id="${id}"><option value="0">—</option>${[4,6,8,10,12].map(n=>`<option value="${n}" ${+v===n?'selected':''}>d${n}</option>`).join('')}</select>`,num=(id,v,lo,hi,wd)=>`<input type="number" id="${id}" value="${v==null?'':v}" min="${lo}" max="${hi}" style="width:${wd||70}px">`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbstf"><h2>✏ STAT BLOCK: ${esc(tbName(t))}</h2><div class="hint">These numbers fill in the attack window when this token attacks or is attacked. Toughness already includes the armor.</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>PARRY</label>${num('tbsp',c.par,0,30)}</div><div><label>TOUGHNESS</label>${num('tbst',c.tg,0,40)}</div><div><label>ARMOR (IN TOUGHNESS)</label>${num('tbsa',c.ar,0,30,90)}</div><div><label>HEALTH LEVELS</label>${num('tbsh',t.mhp,0,20,80)}</div><div><label>BENNIES</label>${num('tbsb',c.bn,0,20,70)}</div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>FIGHTING</label>${dsel('tbsfi',c.fi)}</div><div><label>SHOOTING</label>${dsel('tbssh',c.sh)}</div><div><label>STRENGTH</label>${dsel('tbsstr',c.st)}</div><div><label>VIGOR</label>${dsel('tbsvi',c.vi)}</div><div><label>SPIRIT</label>${dsel('tbssp',c.sp)}</div></div>
 <label class="tbck" style="margin:6px 0"><input type="checkbox" id="tbswc" ${c.wc?'checked':''}> Wild Card (rolls a Wild Die, 4 health levels)</label>
 <h3 style="margin:8px 0 2px;font-size:14px">WEAPONS</h3>${w.map((x,i)=>`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"><input data-w="n${i}" placeholder="Name" maxlength="40" value="${esc(x.n||'')}" style="flex:2;min-width:110px"><input data-w="r${i}" placeholder="Range 12/24/48" maxlength="20" value="${esc(x.rng||'')}" style="width:110px"><input data-w="d${i}" placeholder="Damage 2d6" maxlength="20" value="${esc(x.dmg||'')}" style="width:90px"><input data-w="a${i}" type="number" placeholder="AP" min="0" max="20" value="${+x.ap||''}" style="width:56px"><input data-w="f${i}" type="number" placeholder="ROF" min="1" max="12" value="${+x.rof||''}" style="width:56px"><select data-w="s${i}">${['Shooting','Fighting','Throwing','Athletics'].map(s=>`<option ${(x.sk||(x.rng?'Shooting':'Fighting'))===s?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')}
 <div class="meta">Leave the range empty for a melee weapon. Damage can be Str+d6 or 2d6+1.</div>
 <label style="margin-top:6px">NOTES</label><textarea id="tbsn" maxlength="300" rows="2">${esc(c.nt||'')}</textarea>
 <div style="margin-top:10px"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;
 $('#tbstf').onsubmit=async ev=>{ev.preventDefault();const g=id=>+($('#'+id)||{}).value||0,W=[0,1,2,3,4].map(i=>{const q=k=>($('[data-w="'+k+i+'"]')||{}).value||'';return {n:q('n').trim(),rng:q('r').trim(),dmg:q('d').trim(),ap:+q('a')||0,rof:q('f')?String(+q('f')||''):'',sk:q('s')||'Shooting'}}).filter(x=>x.n||x.dmg);
  const mhp=Math.max(0,Math.min(20,g('tbsh'))),cs=tbCsClean({...(t.cs||{}),par:g('tbsp'),tg:g('tbst'),ar:g('tbsa'),fi:g('tbsfi'),sh:g('tbssh'),st:g('tbsstr'),vi:g('tbsvi'),sp:g('tbssp'),wc:$('#tbswc').checked,bn:$('#tbsb').value===''?undefined:g('tbsb'),nt:$('#tbsn').value,w:W});
  closeM();await tbTokEdit([t],tk=>{const o={cs};const old=+tk.mhp||0;if(mhp!==old){const cur=tk.hp==null?old:+tk.hp;o.mhp=mhp;o.hp=Math.max(0,Math.min(mhp,cur+(mhp-old)))}return o},'edit the stat block')}}

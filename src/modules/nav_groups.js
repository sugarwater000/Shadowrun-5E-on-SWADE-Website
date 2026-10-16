// ---- Sidebar: grouped sections, collapsible with memory, pinned favourites, GM hub, phone settings
const NAV_PIN_MAX=8,HUB_TABS=[['__gmd','🛰','Dashboard'],['__party','🧭','Party'],['__heat','🔥','Heat & Rep'],['__bc','📢','Broadcast'],['__evt','🌆','Street events'],['__art','🖼','Backdrops'],['__bin','♻️','Recycle bin'],['__stor','💾','Storage'],['__gm','🛠','Tools']],HUB_IDS=HUB_TABS.map(x=>x[0]);
let hubTab='__gmd',navSetOpen=false,NAV_REG={};
const navPins=()=>Array.isArray(prefs.pins)?prefs.pins:[];
const navColl=()=>Array.isArray(prefs.navc)?prefs.navc:[];
function navTogglePin(k){const p=navPins().slice(),i=p.indexOf(k);if(i>=0)p.splice(i,1);else{if(p.length>=NAV_PIN_MAX)return flash('You can pin up to '+NAV_PIN_MAX+' pages. Unpin one first.');p.push(k)}prefs={...prefs,pins:p};savePrefs();nav()}
function navToggleSec(n){const c=navColl().slice(),i=c.indexOf(n);if(i>=0)c.splice(i,1);else c.push(n);prefs={...prefs,navc:c};savePrefs();nav()}
const NAV_PHONE=[['helpQ','❓ Help for this page'],['setH','👤 Profile'],['setP','🎨 Display'],['setFlair','✨ Flair'],['setC','🕒 Set clock'],['setHelp','❓ Help'],['bkDl','⬇ Backup (GM)',1],['bkPick','⏪ Restore from backup (GM)',1],['bkUp','⬆ Restore (GM)',1],['setOut','⏻ Sign out']];
function nav(){const tn=allPosts.filter(p=>p.deleted).length,un=unreadN(),ut=allThreads().filter(isNew).filter(a=>!muteB(a[0].board)),reg={},pins=navPins();
 const ubn=b=>muteB(b.id)?0:ut.filter(a=>a[0].board===b.id).length+cuN(b.id);
 const ubc=b=>{if(muteB(b.id))return ' <span class="meta" title="Muted">🔇</span>';const n=ubn(b);return n?` <span style="color:var(--mg)">(${n})</span>`:''};
 const plain=s=>String(s).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
 const item=(key,inner,o={})=>{const sp=!!o.sp,on=o.on!==undefined?o.on:(!sp&&board===key),pd=pins.includes(key);reg[key]={inner,o};
  return `<a class="${o.cls?o.cls+' ':''}${on?'on':''}" ${sp?`id="${key}" data-b=""`:`data-b="${o.bd||key}"`}${o.sty?` style="${o.sty}"`:''}>${inner}<i class="pn${pd?' pd':''}" data-pin="${key}" role="button" aria-label="${pd?'Unpin':'Pin'} ${esc(plain(inner))}" title="${pd?'Unpin from the top':'Pin to the top'}">${pd?'★':'☆'}</i></a>`};
 const grp=(name,html,badge,cls)=>{if(!html)return '';const act=/class="[^"]*\bon\b/.test(html),c=(cls==='set'?!navSetOpen:navColl().includes(name)&&!act);
  return `<div class="sg${c?' cl':''}${cls==='set'?' phoneonly':''}"><div class="sec" role="button" tabindex="0" aria-expanded="${!c}" data-sec="${esc(name)}"><span class="car">${c?'▸':'▾'}</span> ${name}${c&&badge?` <span style="color:var(--mg)">(${badge})</span>`:''}</div><div class="sb">${html}</div></div>`};
 const bs=allBoards().filter(b=>!b.hidden),secs=[];let curSec='';
 bs.forEach((b,i)=>{if(b.sec){curSec=b.sec;secs.push({n:b.sec,h:'',bd:0})}const S=secs[secs.length-1]||(secs.push({n:'',h:'',bd:0}),secs[0]);
  S.h+=item(b.id,`${b.ico?b.ico+' ':''}${esc(b.name)}${ubc(b)}`,{cls:b.dm?'dm':''});S.bd+=ubn(b);
  const nx=bs[i+1];if(!nx||nx.sec){if(curSec==='PUBLIC GRID')S.h+='<a id="addPub" data-b="" style="color:var(--dim)">+ New Public Grid channel</a>';if(curSec==='FACTION CHANNELS')S.h+='<a id="addCh" data-b="" style="color:var(--dim)">+ New faction channel</a>'}});
 const gs=n=>{const s=secs.find(x=>x.n===n);return s?grp(n,s.h,s.bd):''},order=['DIRECT','PUBLIC GRID'];
 const mine=drSideOrder((pm.sheets||[]).filter(x=>!x.deleted&&shSide(x))),mc=mine.length?grp('MY CHARACTERS',mine.map(x=>`<a class="${board==='__sheets'&&shId===x.id?'on':''}" data-sh="${x.id}"${x.drone?' style="padding-left:28px"':''}>${x.drone?'🤖':'🧾'} ${esc(x.name)}</a>`).join('')):'';
 const msgs=grp('MESSAGES',item('__inbox','📥 Inbox'+(un?' ('+un+')':''))+item('__unread','🔔 Unread'+(ut.length+cuBoards().length?' ('+(ut.length+cuBoards().length)+')':''))+item('__saved','★ Saved'+(bmItems.length?' ('+bmItems.length+')':''))+item('__trash','🗑 Trash'));
 const table=grp('TABLE',item('__tbl','♟ Tabletop')+item('__init','⚔️ Initiative')+item('__dice','🎲 Dice Roller')+item('navRng','🎯 Range &amp; Cover',{sp:1})+item('navStats','📊 Table Stats',{sp:1}));
 const chara=grp('CHARACTER',item('__sheets','🧾 Character Sheets')+item('__shop','🛒 Gear &amp; Shopping')+item('__notes','📓 My Notes 🔒')+item('__dir','👥 Character Directory')+item('__npc','🎭 NPC Handles'));
 const camp=grp('CAMPAIGN',item('__cal','📅 Calendar')+item('__tl','⏳ Timeline')+item('__clk','⏱ Clocks'+(typeof clkLive==='function'&&clkLive().length?' ('+clkLive().length+')':'')+(typeof almD!=='undefined'&&almD.lvl?' 🚨':''))+item('__vault','🗂 Handout Vault')+item('__dos','📁 GM Dossiers')+(isOwner?'':item('__heat','🔥 Heat &amp; Rep'))+(typeof hqOn==='function'&&hqOn()?item('__safe','🏠 Safe House'):''));
 const gm=isOwner?grp('GAME MASTER',item('__hub','🛠 GM Hub',{bd:hubTab,on:HUB_IDS.includes(board)})):'';
 const more=grp('HELP &amp; MORE',item('__emo','😀 Custom Emoji')+item('__help','❓ Help / How to use')+item('__fb','💡 Feedback &amp; Suggestions'));
 const phone=grp('⚙ SETTINGS',`<div class="meta" style="padding:2px 16px 6px">HANDLE <b style="color:var(--am)">${esc(handle||'(unset)')}</b> · ONLINE <b style="color:var(--am)">${peersList.length?new Set(peersList.map(p=>p.by||p.peer)).size:'—'}</b></div>`+NAV_PHONE.filter(x=>!x[2]||isOwner).map(x=>`<a data-mm="${x[0]}">${x[1]}</a>`).join(''),0,'set');
 const pinH=pins.filter(k=>reg[k]).map(k=>{const r=reg[k],o=r.o;return `<a class="${o.cls?o.cls+' ':''}${(o.on!==undefined?o.on:(!o.sp&&board===k))?'on':''}" ${o.sp?`data-nx="${k}" data-b=""`:`data-b="${o.bd||k}"`}>${r.inner}<i class="pn pd" data-pin="${k}" role="button" aria-label="Unpin ${esc(plain(r.inner))}" title="Unpin from the top">★</i></a>`}).join('');
 const home=`<a class="${board==='__home'?'on':''}" data-b="__home">🏡 Home${hmBadge()}</a>`;
 let h=home+phone+(pinH?grp('PINNED',pinH):'')+mc+msgs+order.map(gs).join('')+secs.filter(x=>x.n&&!order.includes(x.n)).map(x=>gs(x.n)).join('')+table+chara+camp+gm+more;
 NAV_REG=reg;h+=onlHtml();const el=$('#nav');if(el._h!==h){el._h=h;const st=el.scrollTop;el.innerHTML=h;el.scrollTop=st}$('#onl').textContent=peersList.length?new Set(peersList.map(p=>p.by||p.peer)).size:'—';setPresence()}
function navClick(e){const a=e.target.closest&&e.target.closest('#nav a'),sc=e.target.closest&&e.target.closest('#nav .sec[data-sec]');
 if(sc&&!a){if(sc.dataset.sec==='⚙ SETTINGS'){navSetOpen=!navSetOpen;nav()}else if(sc.dataset.sec)navToggleSec(sc.dataset.sec);return}
 if(!a)return;
 const pn=e.target.closest('.pn');if(pn){e.preventDefault();e.stopPropagation();navTogglePin(pn.dataset.pin);return}
 if(a.dataset.mm){document.body.classList.remove('menu');const b=document.getElementById(a.dataset.mm);if(b)b.click();return}
 if(!a.dataset.sh&&a.dataset.b===undefined)return;
 document.body.classList.remove('menu');scrollMain(0);
 if(a.dataset.sh){if(typeof shDirty!=='undefined'&&shDirty.size)shSave();board='__sheets';shId=a.dataset.sh;sh=null;if($('#sheetroot'))$('#view').innerHTML='';thread=null;dirH=null;query='';$('#q').value='';return render()}
 const id=a.id||a.dataset.nx;
 if(id==='navRng')return rngModal();if(id==='navStats')return stModal();if(id==='addCh')return addChannel('fac');if(id==='addPub')return addChannel('pub');
 if(typeof shDirty!=='undefined'&&shDirty.size)shSave();
 if(a.dataset.b==='__sheets'){shId=null;sh=null}
 board=a.dataset.b;if(HUB_IDS.includes(board))hubTab=board;thread=null;dirH=null;showAll={};tabm={};flt={tag:'',h:'',from:'',to:''};query='';$('#q').value='';render()}
document.getElementById('nav').addEventListener('click',navClick);
document.getElementById('nav').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.sec[data-sec]')){e.preventDefault();navClick(e)}});
/* GM hub: one tab strip over the five GM pages, the recycle bin and storage */
function hubTabs(){if(!isOwner||!HUB_IDS.includes(board))return;const v=document.getElementById('view');if(!v||v.querySelector('.hubtabs'))return;
 v.insertAdjacentHTML('afterbegin',`<div class="hubtabs" role="tablist">${HUB_TABS.map(t=>`<button type="button" class="btn sm${t[0]===board?' on':''}" role="tab" aria-selected="${t[0]===board}" data-hub="${t[0]}">${t[1]} ${esc(t[2])}</button>`).join('')}</div>`);
 v.querySelectorAll('[data-hub]').forEach(b=>b.onclick=()=>{hubTab=b.dataset.hub;board=hubTab;thread=null;query='';$('#q').value='';render()})}
try{new MutationObserver(()=>{if(isOwner&&HUB_IDS.includes(board)&&!document.querySelector('#view .hubtabs')){hubTabs();nav()}}).observe(document.getElementById('view'),{childList:true})}catch(e){}

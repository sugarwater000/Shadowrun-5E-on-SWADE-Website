// ---- Rules and slang glossary (built-in terms + GM custom entries)
const GL_KINDS=[['rule','Rules'],['slang','Street slang'],['matrix','Matrix'],['magic','Magic'],['setting','Setting']];
/* [term, kind, definition, aliases (comma separated), underline in posts (1/0)] */
const GL_BASE=[
 ['Trait roll','rule','Roll the die for the attribute or skill. A Wild Card also rolls a Wild Die (d6) and keeps the better of the two. You need a 4 or more to succeed.','trait roll,trait test',0],
 ['Wild Die','rule','The extra d6 that Wild Cards (player characters and major NPCs) roll with every trait roll. Use whichever result is higher. Extras do not get one.','wild die',1],
 ['Wild Card','rule','A player character or major NPC. Wild Cards roll a Wild Die and can take several wounds. Everyone else is an Extra.','wild cards',0],
 ['Extra','rule','A minor character. Extras roll no Wild Die and are taken out by a single wound.','extras',0],
 ['Ace','rule','When a die rolls its highest number, roll it again and add the result. This can repeat.','aces,acing,aced',0],
 ['Raise','rule','Beat the target number by 4 or more. A raise on an attack roll adds a d6 to damage, and raises on other rolls often give extra benefits.','raises',0],
 ['Target number','rule','What you need to roll. It is 4 for most rolls, or the opponent’s Parry for a melee attack.','tn',0],
 ['Benny','rule','A token you spend to reroll a trait roll (keep the better result), to Soak damage, or to shake off Shaken right away.','bennies',1],
 ['Soak','rule','Spend a Benny and roll Vigor after taking damage. Each success and raise cancels one wound from that hit.','soak roll',0],
 ['Toughness','rule','The damage target. It is 2 plus half your Vigor die, plus any armor. Damage that meets it makes you Shaken.','',0],
 ['Parry','rule','The target number to hit someone in melee. It is 2 plus half their Fighting die.','',0],
 ['Armor Piercing','rule','A weapon with AP ignores that many points of the target’s armor.','AP',0],
 ['Rate of Fire','rule','How many attack dice a weapon rolls in one action (RoF). Each die is a separate roll against the target.','RoF',0],
 ['Wound','rule','Lasting injury. Each wound is −1 to trait rolls, up to −3. Too many wounds and you are Incapacitated.','wounds',0],
 ['Edge','rule','A special ability a character buys with advances, such as a combat trick or a knack.','edges',0],
 ['Hindrance','rule','A flaw that makes life harder. Taking one earns the character extra points.','hindrances',0],
 ['Initiative','rule','Each round every character is dealt a card. The highest card acts first, and a Joker acts whenever it likes and adds +2 to trait and damage rolls.','jokers,joker',0],
 ['Strain','rule','How much the body and mind are taxed by cyberware. The Strain panel on a sheet compares the total against Vigor and Spirit limits.','',0],
 ['Heat','rule','How much attention the law and the corps are paying a runner, from 0 to 10. The GM sets it and every change keeps a note.','',0],
 ['Street Rep','rule','How well known and trusted a runner is on the street. It opens doors with fixers and contacts.','rep,street cred',1],
 ['Faction standing','rule','How a gang, corp or group feels about the team, from −10 (enemies) to +10 (allies).','standing',0],
 ['Scene','rule','The place, time and weather the GM has set. The scene bar at the top shows it and the background follows it.','',0],
 ['Nuyen','setting','The money of the Sixth World. Written ¥. Credsticks hold it, and most people never see enough.','nuyen,¥,nuyens',1],
 ['SIN','setting','System Identification Number. Your legal identity in the corporate world. Without one you cannot work, rent or travel openly.','SINless,sinless',1],
 ['F.SIN','setting','A fake SIN. Good ones pass most scans. Bad ones get you arrested at the worst moment.','fake SIN,fsin',1],
 ['Runner','slang','Short for shadowrunner. Deniable talent for hire who does the jobs the corps cannot be seen doing.','shadowrunner,shadowrunners,runners',1],
 ['Shadowrun','slang','A job done off the books, usually illegal, usually for a corp that will deny it.','shadowruns,the shadows',1],
 ['Johnson','slang','Mr. or Ms. Johnson. The anonymous contact who hires runners. Nobody has ever met a real one by that name.','mr. johnson,ms. johnson,mr johnson',1],
 ['Fixer','slang','A broker who connects runners to jobs, gear and information, for a cut.','fixers',1],
 ['Chummer','slang','Friend, pal, buddy. Said in a friendly voice. It can also be a cutting insult.','chummers',1],
 ['Choom','slang','Another word for a friend or crew mate, popular in the Pacific Northwest.','chooms',1],
 ['Drek','slang','Trash, garbage, or a polite swear word. You will hear it a lot.','',1],
 ['Frag','slang','To wreck, kill or mess up. Also a mild curse. “Frag it.”','fragged,fragging',1],
 ['Scrag','slang','To kill someone, or what you call a person you are not fond of.','scragged',1],
 ['Slot','slang','To curse, or a mild insult. “Slot it.”','slotted',0],
 ['Preem','slang','Premium. First rate, excellent.','',1],
 ['Gonk','slang','A fool, or something very bad.','',1],
 ['Dikoted','slang','Burned out or ruined. The word comes from the Dakota gang war.','',0],
 ['Geek','slang','To kill someone, or to take someone out. Not a nice word.','geeked',0],
 ['Wageslave','slang','A regular corp employee with a SIN, a job and a nice apartment. Treated with some pity, some envy.','wage slave,wageslaves,wagies',1],
 ['Joe','slang','Joe Average. An ordinary person with no cyber, no magic and no clue.','joe average',0],
 ['Mundane','slang','Someone who cannot use magic. Also just “normal.”','mundanes',0],
 ['Awakened','setting','Someone or something touched by magic.','',1],
 ['Samurai','slang','A street samurai. A cybered-up combat specialist for hire.','street sam,street samurai,sammy',1],
 ['Razorgirl','slang','A woman with heavy combat cyberware, such as razors in her hands. The men are razorboys.','razorboy,razor girl',0],
 ['Decker','slang','A hacker who jacks into the Matrix. Also called a hacker or a netrunner.','deckers,hacker,hackers',1],
 ['Rigger','slang','Someone who jacks into a vehicle or drone and drives or flies it as if it were their own body.','riggers',1],
 ['Technomancer','slang','A person who can sense and use the Matrix with just their mind, no deck needed.','technomancers',0],
 ['Talismonger','slang','A shop that sells magical supplies, foci and talismans.','',1],
 ['Dumpshock','matrix','The pain and disorientation of being dumped out of the Matrix when the connection is cut.','',1],
 ['Black ICE','matrix','Lethal security software. It attacks the decker directly and can kill.','black ice',1],
 ['ICE','matrix','Intrusion Countermeasures Electronics. Security software that guards a node.','ice',0],
 ['Commlink','matrix','The phone, wallet, ID and computer in one. Everyone carries one.','commlinks',1],
 ['Jack in','matrix','To connect to the Matrix, a vehicle or a drone through a datajack.','jacked in,jacks in,jacking in',0],
 ['Matrix','matrix','The worldwide network. Almost everything runs through it.','',0],
 ['Node','matrix','A single system or device on the Matrix, such as a camera or a corp server.','nodes',0],
 ['Simsense','matrix','Recorded experience that you play back in your own head, feelings and all.','simsense',1],
 ['BTL','matrix','Better Than Life. Illegal chips that turn simsense into an addictive trap.','better than life,btl',1],
 ['Trid','matrix','Three-dimensional video and TV.','trideo,trideo',1],
 ['Astral','magic','The mirror world of spirit that magic users can see and enter.','astral space,astral plane',1],
 ['Mage','magic','A magic user who works spells by study and theory.','mages',0],
 ['Shaman','magic','A magic user who draws power from a totem or spirit.','shamans',1],
 ['Adept','magic','A magic user who channels power into their own body, such as speed or strength.','adepts,physical adept',0],
 ['Spirit','magic','A being from the astral world. Summoned spirits serve a mage or shaman for a time.','spirits',0],
 ['Mana','magic','The magical energy in the world. It rises and falls with places and events.','',1],
 ['Focus','magic','A magical item a user bonds with to boost their magic.','foci',0],
 ['Dragon','setting','A great dragon, ancient, immensely powerful and often a corp boss.','dragons',1],
 ['Megacorp','setting','One of the giant corporations that run the world. They have their own laws and armies.','megacorps,the corps,corps',1],
 ['Extraterritoriality','setting','Corp land is its own country. Their law applies there, not the city’s.','extraterritorial',0],
 ['Lone Star','setting','The private police firm that patrols much of Seattle. Response times depend on your zip code.','',1],
 ['Knight Errant','setting','Ares’s private security company, a rival to Lone Star.','',1],
 ['DocWagon','setting','The medical rescue service. Subscribers get a fast armed ambulance, if they are paid up.','docwagon',1],
 ['Sprawl','setting','The huge urban area around Seattle.','the sprawl',0],
 ['Barrens','setting','The ruined, abandoned fringe of the city, run by gangs and squatters.','the barrens',1],
 ['Ork','setting','A metahuman with tusks and a tough body. They are strong and often face prejudice.','orks,orc,orcs',0],
 ['Troll','setting','A huge metahuman with horns and thick skin. Strong, hard to hurt and often shunned.','trolls',0],
 ['Elf','setting','A tall, graceful metahuman, charming and quick, with pointed ears.','elves',0],
 ['Dwarf','setting','A short, hardy metahuman with great toughness and resistance to toxins.','dwarves',0],
 ['Ghoul','setting','A person infected with a virus that turned their body gray and hungry. Most people recoil.','ghouls',1],
 ['Metahuman','setting','Any of the human, elf, dwarf, ork or troll peoples.','metahumans,metas',0],
 ['Credstick','setting','A physical bank card that holds nuyen. Certified sticks are traceable. Anonymous sticks are not.','credsticks,cred stick',1],
 ['Jackpoint','slang','A secret hideout where a team of runners meets and shares news.','',0],
 ['Dossier','slang','A file of information about a target or a person.','dossiers',0]
];
const GL_NOAUTO=new Set();
function glCustom(){return (pm.glossary||[]).filter(x=>!x.deleted&&x.term)}
function glKey(t){return String(t||'').trim().toLowerCase()}
function glAll(){
 const cu=glCustom(),cm=new Map();cu.forEach(x=>cm.set(glKey(x.term),x));
 const out=[];
 GL_BASE.forEach(([t,k,d,a,h])=>{if(cm.has(glKey(t)))return;out.push({term:t,kind:k,def:d,aka:a,hl:!!h,base:true})});
 CND.forEach(c=>{if(cm.has(glKey(c[0])))return;out.push({term:c[0],kind:'rule',def:c[3],aka:'',hl:false,base:true,ico:c[1]})});
 cu.forEach(x=>out.push({term:x.term,kind:GL_KINDS.some(k=>k[0]===x.kind)?x.kind:'setting',def:x.def||'',aka:x.aka||'',hl:x.hl!==false,id:x.id,base:false,by:x.by||'',ed:x.editedBy||''}));
 return out.sort((a,b)=>a.term.localeCompare(b.term))}
let glQ='',glK='';
function glossView(){const gm=true,A=glAll(),q=glQ.toLowerCase().trim(),ws=q.split(/\s+/).filter(Boolean);
 const shown=A.filter(e=>(!glK||(glK==='custom'?!e.base:e.kind===glK))&&ws.every(w=>(e.term+' '+e.aka+' '+e.def).toLowerCase().includes(w)));
 const kn=k=>(GL_KINDS.find(z=>z[0]===k)||[k,k])[1];
 $('#view').innerHTML=`<div id="glroot"><div class="bar"><h2>📖 RULES &amp; SLANG</h2><div>${gm?'<button class="btn sm grn" id="gladd">+ Term</button>':''}</div></div>
 <div class="hint" style="margin-bottom:10px">Quick definitions for the rules, the street slang and the setting. Known terms are also underlined in posts: tap one to see what it means. Anyone at the table can add a term or change one (even a built-in one). Your changes show for everyone, and Undo is offered right after you save.</div>
 <input id="glq" placeholder="Search terms and meanings..." value="${esc(glQ)}" style="margin-bottom:8px">
 <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${[['','All']].concat(GL_KINDS).concat([['custom','Our table']]).map(k=>`<span class="cnd tg ${glK===k[0]?'on':''}" data-glk="${k[0]}" style="--cc:var(--cy)">${esc(k[1])}</span>`).join('')}</div>
 <div class="meta" style="margin-bottom:6px">${shown.length} term${shown.length==1?'':'s'}</div>
 ${shown.map(e=>`<div class="post" data-glt="${esc(e.term)}" style="padding:8px 12px;margin-bottom:6px"><div class="hd" style="display:flex;justify-content:space-between;gap:8px"><span class="handle" style="color:var(--am)">${e.ico?e.ico+' ':''}${esc(e.term)}${e.aka?` <span class="meta" style="font-weight:normal">also: ${esc(e.aka.split(',').slice(0,4).join(', '))}</span>`:''}</span><span><span class="tag">${esc(kn(e.kind))}</span>${e.base?'':' <span class="tag" style="color:var(--mg);border-color:var(--mg)">OURS</span>'}</span></div><div class="gbd" style="margin-top:4px">${esc(e.def)}</div>${e.base||!(e.by||e.ed)?'':`<div class="meta" style="margin-top:4px">${e.by?'added by '+esc(e.by):''}${e.ed&&e.ed!==e.by?(e.by?', ':'')+'last edited by '+esc(e.ed):''}</div>`}${gm?`<div style="margin-top:6px"><button class="btn sm" data-gle="${esc(e.term)}">${e.base?'Customize':'Edit'}</button></div>`:''}</div>`).join('')||'<div class="hint">No term matches that.</div>'}</div>`;
 const qi=$('#glq');qi.oninput=e=>{glQ=e.target.value;const p=e.target.selectionStart;glossView();const n=$('#glq');n.focus();n.setSelectionRange(p,p)};
 $('#view').querySelectorAll('[data-glk]').forEach(c=>c.onclick=()=>{glK=c.dataset.glk;glossView()});
 $('#view').querySelectorAll('[data-gle]').forEach(b=>b.onclick=()=>glForm(b.dataset.gle));
 const ad=$('#gladd');if(ad)ad.onclick=()=>glForm('')}
function glForm(term){const e=term?glAll().find(x=>glKey(x.term)===glKey(term)):null,cu=e&&!e.base?glCustom().find(x=>x.id===e.id):null;
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>${cu?'EDIT TERM':e?'CUSTOMIZE TERM':'NEW TERM'}</h2>${e&&e.base?'<div class="hint">This changes the built-in term for your table only. Delete your version later to go back to the original.</div>':''}
 <label>TERM</label><input id="glft" maxlength="40" value="${esc(e?e.term:'')}">
 <div class="two"><div><label>KIND</label><select id="glfk">${GL_KINDS.map(k=>`<option value="${k[0]}" ${e&&e.kind===k[0]?'selected':''}>${esc(k[1])}</option>`).join('')}</select></div><div><label>OTHER SPELLINGS (COMMA SEPARATED)</label><input id="glfa" maxlength="120" value="${esc(e?e.aka:'')}" placeholder="plural, nickname, ..."></div></div>
 <label>MEANING</label><textarea id="glfd" rows="4" maxlength="500">${esc(e?e.def:'')}</textarea>
 <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="glfh" style="width:auto" ${!e||e.hl?'checked':''}> Underline this in posts so people can tap it</label>
 <div style="margin-top:12px"><button class="btn grn" id="glok">Save</button>${cu&&(isOwner||cu.by===handle||GL_BASE.some(b=>glKey(b[0])===glKey(cu.term))||CND.some(c=>glKey(c[0])===glKey(cu.term)))?' <button class="btn mg" id="gldel">'+(GL_BASE.some(b=>glKey(b[0])===glKey(cu.term))||CND.some(c=>glKey(c[0])===glKey(cu.term))?'Back to original':'Delete')+'</button>':''} <button class="btn" id="glcx">Cancel</button></div></div></div>`;
 $('#glcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#glok').onclick=async()=>{const t=$('#glft').value.trim(),d=$('#glfd').value.trim();if(!t)return alert('Give the term a name.');if(!d)return alert('Write what it means.');
  const v={term:t,kind:$('#glfk').value,def:d,aka:$('#glfa').value.trim(),hl:$('#glfh').checked},who=handle||'Someone';
  const same=glCustom().find(x=>glKey(x.term)===glKey(t));
  try{if(cu&&glKey(cu.term)!==glKey(t)&&same)return alert('You already have a term called "'+t+'".');
   const target=cu||same;
   if(target){const pv={term:target.term,kind:target.kind,def:target.def,aka:target.aka||'',hl:target.hl!==false};await db.doc('glossary/'+target.id).update({...v,editedBy:who,editedAt:Date.now()});undoBar('"'+t+'" saved.',()=>db.doc('glossary/'+target.id).update(pv))}
   else{const ref=await db.collection('glossary').add({...v,by:who,ts:Date.now()});undoBar('"'+t+'" added.',()=>db.doc('glossary/'+ref.id).update({deleted:true}))}
   $('#modal').innerHTML='';glRefresh()}catch(x){alert('Could not save: '+(x.message||x.code))}};
 const dl=$('#gldel');if(dl)dl.onclick=async()=>{if(!await ask('Remove "'+cu.term+'" from your glossary?','Remove'))return;try{await db.doc('glossary/'+cu.id).update({deleted:true});$('#modal').innerHTML='';undoBar('Term removed.',()=>db.doc('glossary/'+cu.id).update({deleted:false}));glRefresh()}catch(x){alert('Could not remove: '+(x.message||x.code))}}}
function glRefresh(){glRe=null;if(board==='__gloss')glossView();else glMarkAll()}
/* ---- underline known terms inside post text and show a small card on tap */
let glRe=null;
function glBuild(){
 const m=new Map(),words=[];
 glAll().forEach(e=>{if(!e.hl)return;[e.term].concat(String(e.aka||'').split(',')).forEach(w=>{w=w.trim();if(w.length<2)return;const k=glKey(w);if(!m.has(k)){m.set(k,e);words.push(w)}})});
 words.sort((a,b)=>b.length-a.length);
 const esc2=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const re=words.length?new RegExp('(^|[^\\p{L}\\p{N}_])('+words.map(esc2).join('|')+')(?![\\p{L}\\p{N}_])','giu'):null;
 const key=words.length+':'+words.join('|').length+':'+(pm.glossary||[]).length;
 glRe={re,m,key}}
function glMark(el){
 if(prefs&&prefs.gl===false)return;
 if(!glRe)glBuild();if(!glRe.re)return;
 if(el.dataset.glv===glRe.key)return;el.dataset.glv=glRe.key;
 const seen=new Set(),tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&!n.parentElement.closest('a,code,pre,button,input,textarea,select,.gl,.mention,[contenteditable]')&&n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}),nodes=[];
 while(tw.nextNode())nodes.push(tw.currentNode);
 for(const n of nodes){const s=n.nodeValue;glRe.re.lastIndex=0;let last=0,hit=false,f=document.createDocumentFragment(),r;
  while((r=glRe.re.exec(s))){const w=r[2],start=r.index+r[1].length,e=glRe.m.get(glKey(w));if(!e||seen.has(glKey(e.term)))continue;
   seen.add(glKey(e.term));hit=true;f.appendChild(document.createTextNode(s.slice(last,start)));
   const sp=document.createElement('span');sp.className='gl';sp.dataset.gl=e.term;sp.title=e.def;sp.textContent=w;f.appendChild(sp);last=start+w.length}
  if(hit){f.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(f,n)}}}
function glMarkAll(){try{const v=$('#view');if(!v||board==='__gloss')return;glObs&&glObs.disconnect();v.querySelectorAll('.post .bd').forEach(glMark)}finally{glWatch()}}
let glObs=null,glT=0;
function glWatch(){const v=$('#view');if(!v||typeof MutationObserver==='undefined')return;if(!glObs)glObs=new MutationObserver(()=>{clearTimeout(glT);glT=setTimeout(glMarkAll,120)});glObs.observe(v,{childList:true,subtree:true})}
const glCss=document.createElement('style');glCss.textContent='.gl{border-bottom:1px dotted var(--cy);cursor:help}.gl:hover{background:rgba(0,255,255,.12)}#glpop{position:fixed;z-index:100002;max-width:min(320px,calc(100vw - 20px));background:var(--panel);border:1px solid var(--cy);box-shadow:0 0 16px rgba(0,255,255,.35);padding:8px 12px;font-size:13px}#glpop b{color:var(--am)}';document.head.appendChild(glCss);
document.addEventListener('click',e=>{const old=document.getElementById('glpop');
 const g=e.target.closest&&e.target.closest('.gl');
 if(!g){if(old&&!e.target.closest('#glpop'))old.remove();if(e.target.closest&&e.target.closest('#glpop [data-glgo]')){const gb=e.target.closest('[data-glgo]');glQ=gb.dataset.glgo;glK='';board='__gloss';thread=null;old&&old.remove();document.body.classList.remove('menu');render()}return}
 e.preventDefault();e.stopPropagation();if(old)old.remove();
 const en=glAll().find(x=>glKey(x.term)===glKey(g.dataset.gl));if(!en)return;
 const p=document.createElement('div');p.id='glpop';p.innerHTML=`<b>${esc(en.term)}</b> <span class="tag">${esc((GL_KINDS.find(k=>k[0]===en.kind)||[0,en.kind])[1])}</span><div style="margin-top:4px">${esc(en.def)}</div><div style="margin-top:6px"><a data-glgo="${esc(en.term)}" style="cursor:pointer;color:var(--cy)">Open in the glossary</a></div>`;
 document.body.appendChild(p);const r=g.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight;
 p.style.left=Math.max(8,Math.min(innerWidth-pw-8,r.left))+'px';p.style.top=(r.bottom+ph+10>innerHeight?Math.max(8,r.top-ph-6):r.bottom+6)+'px'},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const o=document.getElementById('glpop');if(o)o.remove()}});
glWatch();

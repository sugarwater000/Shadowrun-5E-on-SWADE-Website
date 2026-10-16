// ---- Home: a landing page with your sheet, what needs doing, your jobs and favors, unread items and your latest rolls.
// GM requests: the GM can ask a player (or everyone) to do something. Each player ticks it off, and the GM sees who has.
const hmLc=s=>String(s||'').toLowerCase().trim();
const hmMine=()=>(pm.sheets||[]).filter(s=>s&&!s.deleted&&!s.drone&&uid&&s.uid===uid).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
function hmPc(){const L=hmMine();return L.find(s=>s.id===(prefs||{}).homePc)||fcMine()||L[0]||null}
const hmNames=()=>[handle,...hmMine().flatMap(s=>[s.name,s.handle])].map(hmLc).filter(Boolean);
const hmIsMe=t=>{const x=hmLc(t);return !!x&&hmNames().includes(x)};
const hmHas=txt=>{const t=hmLc(txt);return !!t&&hmNames().some(n=>t.includes(n))};
// ---- requests from the GM
const hmReq=()=>(pm.requests||[]).filter(r=>r&&!r.deleted).sort((a,b)=>(b.ts||0)-(a.ts||0));
const hmForMe=r=>!isOwner&&(!(r.to&&r.to.length)||r.to.some(hmIsMe));
const hmDoneDoc=(r,u)=>(pm.reqdone||[]).find(x=>x&&!x.deleted&&x.req===r.id&&x.uid===(u||uid));
const hmOpenReqs=()=>hmReq().filter(r=>!r.closed&&hmForMe(r)&&!hmDoneDoc(r));
const hmBadge=()=>{try{const n=hmOpenReqs().length;return n?' <span style="color:var(--mg)">('+n+')</span>':''}catch(e){return ''}};
async function hmTick(r){const id=r.id+'_'+pid(String(uid)),ex=(pm.reqdone||[]).find(x=>x.id===id),was=ex&&!ex.deleted;
 try{if(ex)await db.doc('reqdone/'+id).update({deleted:!!was,ts:Date.now(),by:handle||'?'});else await db.doc('reqdone/'+id).set({req:r.id,uid,by:handle||'?',ts:Date.now()});
  if(!was)undoBar('Marked done.',()=>db.doc('reqdone/'+id).update({deleted:true}))}catch(e){alert('Could not save: '+(e.message||e.code))}}
function hmReqForm(){const hs=[...new Set([...knownHandles(),...(pm.sheets||[]).filter(s=>!s.deleted&&!s.drone).map(s=>s.name)])].filter(Boolean).sort((a,b)=>a.localeCompare(b));
 $('#modal').innerHTML=`<div class="modal"><form id="rqf"><h2>ASK YOUR PLAYERS TO DO SOMETHING</h2><label>WHAT DO YOU NEED?</label><textarea name="t" required maxlength="400" style="min-height:80px" placeholder="e.g. Update your sheet with the new advance. Pick your downtime activity. Post what your character did over the weekend."></textarea>
 <label>WHO IS IT FOR? (LEAVE ALL UNTICKED FOR EVERYONE)</label>${usersField('rq',[])}<label>WHERE SHOULD IT TAKE THEM? (OPTIONAL)</label><select name="l"><option value="">Nowhere in particular</option>${[['__sheets','Character Sheets'],['downtime','Downtime Activities'],['jobs','Job Board'],['plot-hooks','Plot Hooks and Missions'],['scenes','Off Screen Scenes'],['finds','Finds and Funds'],['__clues','Clue Board'],['__cal','Calendar']].map(z=>`<option value="${z[0]}">${esc(z[1])}</option>`).join('')}</select>
 <label>DUE (OPTIONAL, FREE TEXT)</label><input name="d" maxlength="60" placeholder="e.g. before Friday's session"><div style="margin-top:12px;display:flex;gap:8px"><button class="btn grn" type="submit">Send</button><button class="btn mg" type="button" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;$('#rqf').onsubmit=async e=>{e.preventDefault();if(e.target.dataset.busy)return;const f=new FormData(e.target),t=String(f.get('t')||'').trim();if(!t)return;
  const to=[...new Set([...document.querySelectorAll('#rqf [data-u="rq"]:checked')].map(i=>i.value).concat(String(f.get('rq_extra')||'').split(',').map(z=>z.trim()).filter(Boolean)))];e.target.dataset.busy=1;
  try{await db.collection('requests').add({text:t,to,link:String(f.get('l')||''),due:String(f.get('d')||'').trim(),by:handle||'GM',ts:Date.now(),closed:false});closeM()}catch(er){e.target.dataset.busy='';alert('Could not send: '+(er.message||er.code))}}}
// ---- the page
const hmClean=t=>String(t||'').replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
function hmGo(a){const [k,v]=a.split('|');thread=null;dirH=null;query='';if($('#q'))$('#q').value='';tabm={};
 if(k==='b'){board=v;if(v==='__sheets'){shId=null;sh=null}else if(PMB[v])tabm[v]='cards'}
 else if(k==='sh'){board='__sheets';shId=v;sh=null;if($('#sheetroot'))$('#view').innerHTML=''}
 else if(k==='play'){prefs.play=true;savePrefs();board='__sheets';shId=v;sh=null;if($('#sheetroot'))$('#view').innerHTML=''}
 else if(k==='thr'){return openThread(v)}
 else if(k==='rolls'){rhToggle(true);return}
 render()}
function hmPanel(title,body,extra){return `<div class="shsec" style="margin:0"><h2>${title}${extra?' <span class="meta">'+extra+'</span>':''}</h2>${body}</div>`}
function hmLink(go,html,meta){return `<a class="row" data-hm="${esc(go)}"><div class="t">${html}</div>${meta?`<div class="meta">${meta}</div>`:''}</a>`}
function homeView(){const pcs=hmMine(),pc=hmPc(),gm=isOwner;let secs=[];
 // character
 let top='';
 if(pc){const d=pc,wm=shWM(d),w=Math.min(wm,+d.wounds||0),fat=+d.fatigue||0,bn=parseInt(d.bn)||0,st=d.status||[];
  const h=htVal(d.id,'heat'),r=htVal(d.id,'rep');
  top=`<div class="shsec" style="margin:0 0 12px;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">${d.img?`<img src="/_blob/${esc(d.img)}" style="width:96px;height:96px;object-fit:cover;border:1px solid var(--line)">`:''}<div style="flex:1;min-width:240px"><h2 style="margin:0">${esc(d.name||'Character')}${pcs.length>1?` <select id="hmpc" style="width:auto;font-size:13px">${pcs.map(s=>`<option value="${esc(s.id)}" ${s.id===d.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>`:''}</h2><div class="meta">${esc([d.concept,d.player&&'played by '+d.player].filter(Boolean).join(' · '))}</div>
  <div style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;align-items:center"><span title="Wounds">❤ ${Array.from({length:wm},(_,i)=>i+1).map(n=>`<i class="wd ${w>=n?'on':''}"></i>`).join('')}${d.inc?'<b style="color:var(--red)"> INC</b>':''}${fat?' <b>F'+fat+'</b>':''}</span><span title="Toughness">🛡 <b>${pinTough(d)}</b></span><span title="Bennies">🪙 <button class="btn sm" data-hmb="-1">−</button> <b>${bn}</b> <button class="btn sm" data-hmb="1">+</button></span><span title="Heat">🔥 <b>${h}</b> <span class="meta">${esc(htHeatName(h))}</span></span><span title="Street Rep">🎖 <b>${r}</b> <span class="meta">${esc(htRepName(r))}</span></span>${st.length?'<span>'+cndBadges(st)+'</span>':''}</div>
  <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-hm="sh|${esc(d.id)}">Open sheet</button><button class="btn sm" data-hm="play|${esc(d.id)}">▶ Play mode</button><button class="btn sm" data-hm="b|__dice">🎲 Dice roller</button><button class="btn sm" data-hm="rolls|">Roll history</button></div></div></div>`}
 else top=`<div class="shsec" style="margin:0 0 12px"><h2>${gm?'GAME MASTER':'NO CHARACTER YET'}</h2><div class="meta">${gm?'You have no character sheet of your own, so this page shows the table instead.':'Make a character sheet and it will show up here.'}</div><div style="margin-top:8px"><button class="btn sm" data-hm="b|__sheets">Open Character Sheets</button></div></div>`;
 // to do
 const todo=[];
 hmOpenReqs().forEach(r=>todo.push({k:'req',r}));
 const myJobs=(pm.jobs||[]).filter(j=>j&&!j.deleted&&j.status==='Taken'&&hmHas(j.taken)).sort(dlCmp);
 const myDt=(pm.downtime||[]).filter(x=>x&&!x.deleted&&['Planned','In progress'].includes(x.status)&&(x['for']||[]).some(hmIsMe));
 const myFav=favLive().filter(f=>f.status!=='done'&&(f.who||[]).some(hmIsMe));
 const ut=allThreads().filter(isNew).filter(a=>!muteB(a[0].board)).sort((a,b)=>b[b.length-1].ts-a[a.length-1].ts),cb=cuBoards();
 let reqHtml='';const rq=hmReq().filter(r=>!r.closed&&hmForMe(r));
 if(rq.length&&!gm)reqHtml=hmPanel('📌 FROM THE GM',(rq.length?rq.map(r=>{const dn=!!hmDoneDoc(r);return `<div class="row" style="cursor:default;display:flex;gap:10px;align-items:flex-start;${dn?'opacity:.55':''}"><input type="checkbox" data-hmr="${esc(r.id)}" ${dn?'checked':''} style="width:auto;margin-top:4px"><span style="flex:1"><span style="${dn?'text-decoration:line-through':''}">${esc(r.text)}</span>${r.link?` <a class="tag" data-hm="b|${esc(r.link)}" style="cursor:pointer;color:#000;background:var(--am)">go there ↗</a>`:''}<div class="meta">${esc(r.by||'GM')} · ${esc(irl(r.ts))}${r.due?' · due '+esc(r.due):''}${(r.to&&r.to.length)?' · for '+esc(r.to.join(', ')):' · for everyone'}</div></span></div>`}).join(''):'<div class="meta">Nothing asked of you right now.</div>'),rq.filter(r=>!hmDoneDoc(r)).length?rq.filter(r=>!hmDoneDoc(r)).length+' to do':'');
 // attention digest
 const dig=[];
 if(ut.length)dig.push(hmLink('b|__unread',`<span class="tag" style="color:#000;background:var(--mg)">${ut.length}</span> unread thread${ut.length==1?'':'s'}`,esc(ut.slice(0,3).map(a=>(a[0].title||'')).join(' · '))));
 if(cb.length)dig.push(hmLink('b|__unread',`<span class="tag" style="color:#000;background:var(--mg)">${cb.reduce((n,b)=>n+cuNew(b).length,0)}</span> new or changed card${cb.length==1&&cuNew(cb[0]).length==1?'':'s'}`,esc(cb.map(b=>(allBoards().find(x=>x.id===b)||{name:b}).name).join(' · '))));
 if(myJobs.length)dig.push(hmLink('b|jobs',`💼 ${myJobs.length} job${myJobs.length==1?'':'s'} in progress`,esc(myJobs.map(j=>j.title+(j.deadline?' (due '+j.deadline+')':'')).join(' · '))));
 if(myDt.length)dig.push(hmLink('b|downtime',`🛠 ${myDt.length} downtime activit${myDt.length==1?'y':'ies'}`,esc(myDt.map(x=>x.title).join(' · '))));
 if(myFav.length)dig.push(hmLink('b|contacts',`🤝 ${myFav.length} open favor${myFav.length==1?'':'s'}`,esc(myFav.map(f=>(f.dir==='theyOwe'?'they owe: ':'you owe: ')+(f.cname||'?')).join(' · '))));
 const att=hmPanel('⚡ NEEDS YOUR ATTENTION',dig.join('')||'<div class="empty" style="margin:0">// ALL CAUGHT UP.</div>');
 // jobs and favors
 const openJ=(pm.jobs||[]).filter(j=>j&&!j.deleted&&j.status==='Open').length;
 const jf=hmPanel('💼 JOBS AND FAVORS',(myJobs.length?myJobs.map(j=>hmLink('b|jobs',`<b>${esc(j.title)}</b> ${badge(j.risk,stc(j.risk))}${typeof fcJobBadge==='function'?fcJobBadge(j):''}`,esc([j.patron&&'From '+j.patron,j.pay&&'Pay '+j.pay,j.deadline&&'Due '+j.deadline].filter(Boolean).join(' · ')))).join(''):'<div class="meta">You have no jobs in progress.</div>')+(myFav.length?'<div class="meta" style="margin:8px 0 2px">FAVORS</div>'+myFav.map(f=>hmLink('b|contacts',`<span class="tag" style="color:#000;background:${f.dir==='theyOwe'?'var(--cy)':'var(--am)'}">${f.dir==='theyOwe'?'THEY OWE':'YOU OWE'}</span> <b>${esc(f.cname||'?')}</b> <span class="meta">${esc(f.size||'')}</span>`,esc(f.desc||''))).join(''):'')+`<div style="margin-top:6px"><button class="btn sm" data-hm="b|jobs">Job Board${openJ?' ('+openJ+' open)':''}</button> <button class="btn sm" data-hm="b|contacts">Contacts and favors</button></div>`);
 // unread
 const un=hmPanel('📬 UNREAD',ut.length?rowsHtml(ut.slice(0,5))+(ut.length>5?`<div class="meta" style="margin:4px 0"><a data-hm="b|__unread" style="cursor:pointer;color:var(--cy)">and ${ut.length-5} more…</a></div>`:''):'<div class="empty" style="margin:0">// NOTHING UNREAD.</div>');
 // rolls
 const mine=hmNames(),rl=(rollsAll||[]).filter(r=>r&&(r.uid===uid||mine.includes(hmLc(r.who))||mine.includes(hmLc(r.by)))).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,8);
 const rp=hmPanel('🎲 YOUR LAST ROLLS',rl.length?rl.map(r=>`<div class="row" style="cursor:default"><div class="meta">${esc(irl(r.ts))} · ${esc(rollWho(r))}</div><div>${esc(hmClean(r.text).slice(0,170))}</div></div>`).join('')+`<div style="margin-top:6px"><button class="btn sm" data-hm="rolls|">All table rolls</button></div>`:'<div class="meta">No rolls yet. Open Play mode or the Dice Roller to make one.</div>');
 // standing
 const fl=typeof fcFacs==='function'?fcFacs():[];
 const fp=fl.length?hmPanel('🏢 WHERE YOU STAND',fl.map(f=>{const v=fcFor(f);return `<div class="row" style="cursor:default;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="min-width:140px">${esc(f.name)}</b>${htBar(v,-10,10)} <b style="color:${fcColor(v)}">${fcSgn(v)}</b> <span class="meta">${esc(htFacName(v))}</span></div>`}).join('')+`<div style="margin-top:6px"><button class="btn sm" data-hm="b|__heat">Heat and Reputation</button></div>`):'';
 // calendar and clues
 const now=igtKey(clockNow()),evs=(pm.events||[]).filter(e=>e&&!e.deleted&&igtKey(e.date)!=null&&(now==null||igtKey(e.date)>=now)).sort((a,b)=>igtKey(a.date)-igtKey(b.date)).slice(0,3);
 const ep=evs.length?hmPanel('📅 COMING UP',evs.map(e=>hmLink('b|__cal',`<b>${esc(e.title)}</b>`,esc(igtFmt(e.date)))).join('')):'';
 const cl=(pm.clues||[]).filter(x=>x&&!x.deleted).sort((a,b)=>(b.edited||b.ts||0)-(a.edited||a.ts||0)).slice(0,3);
 const cp=cl.length?hmPanel('🕵 ON THE CLUE BOARD',cl.map(c=>hmLink('b|__clues',`${(CB_K[c.kind]||CB_K.note)[0]} <b>${esc(c.title)}</b>`,esc(String(c.text||'').slice(0,100)))).join('')+`<div style="margin-top:6px"><button class="btn sm" data-hm="b|__clues">Open the board</button></div>`):'';
 // GM
 let gp='';
 if(gm){const rs=hmReq(),pend=typeof fcPendingList==='function'?fcPendingList().length:0,fbn=(pm.feedback||[]).filter(x=>x&&!x.deleted&&x.status==='New').length,players=new Set((pm.sheets||[]).filter(s=>!s.deleted&&!s.drone&&s.uid).map(s=>s.uid)).size;
  gp=hmPanel('🛠 GM',`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn sm grn" id="hmrq">+ Ask players to do something</button><button class="btn sm" data-hm="b|__gmd">GM Dashboard</button>${pend?`<button class="btn sm" data-hm="b|__heat" style="border-color:var(--am);color:var(--am)">⚖ ${pend} faction change${pend==1?'':'s'} waiting</button>`:''}${fbn?`<button class="btn sm" data-hm="b|__fb">💡 ${fbn} new feedback</button>`:''}</div>`+
   (rs.length?rs.slice(0,12).map(r=>{const dn=[...new Map((pm.reqdone||[]).filter(x=>x&&!x.deleted&&x.req===r.id).map(x=>[x.uid,x])).values()],tot=Math.max((r.to&&r.to.length)?r.to.length:players,dn.length);return `<div class="row" style="cursor:default;${r.closed?'opacity:.5':''}"><div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap"><span>${esc(r.text)}</span><span><button class="btn sm" data-hmc="${esc(r.id)}">${r.closed?'Reopen':'Close'}</button> <button class="btn sm mg del" data-hmx="${esc(r.id)}">Delete</button></span></div><div class="meta">${(r.to&&r.to.length)?'for '+esc(r.to.join(', ')):'for everyone'} · ${dn.length}${tot?' of '+tot:''} done${dn.length?': '+esc(dn.map(x=>x.by).join(', ')):''}${r.closed?' · closed':''}</div></div>`}).join(''):'<div class="meta">No requests yet. Use the button above to ask a player, or everyone, to do something. They tick it off on their Home page.</div>'),'visible only to you')}
 const rtp=(typeof clkHomeHtml==='function'&&clkHomeHtml())?hmPanel('⏱ CLOCKS AND ALARM',clkHomeHtml()):'';
 const L=(gm?[gp,rtp,att,un,fp,ep,cp,...(pc?[jf,rp]:[])]:[reqHtml,rtp,att,jf,un,rp,fp,ep,cp]).filter(Boolean);
 $('#view').innerHTML=`<div id="homeroot"><div class="bar"><h2>🏡 HOME</h2><span class="meta">Welcome back, ${esc(handle||'runner')}.</span></div>${top}<div class="hmg">${L.join('')}</div></div>`;
 const pcSel=$('#hmpc');if(pcSel)pcSel.onchange=()=>{prefs.homePc=pcSel.value;savePrefs();render()};
 document.querySelectorAll('#homeroot [data-hmb]').forEach(b=>b.onclick=async()=>{const d=hmPc();if(!d)return;const v=Math.max(0,(parseInt(d.bn)||0)+(+b.dataset.hmb));d.bn=String(v);if(sh&&shId===d.id)sh.bn=String(v);render();try{await db.doc('sheets/'+d.id).update({bn:String(v)})}catch(e){alert('Could not save the bennies: '+(e.message||e.code||''))}});
 document.querySelectorAll('#homeroot [data-hmr]').forEach(c=>c.onchange=()=>{const r=hmReq().find(x=>x.id===c.dataset.hmr);if(r)hmTick(r)});
 const rq2=$('#hmrq');if(rq2)rq2.onclick=hmReqForm;
 document.querySelectorAll('#homeroot [data-hmc]').forEach(b=>b.onclick=async()=>{const r=hmReq().find(x=>x.id===b.dataset.hmc);if(r)try{await db.doc('requests/'+r.id).update({closed:!r.closed})}catch(e){alert('Could not save: '+(e.message||e.code))}});
 document.querySelectorAll('#homeroot [data-hmx]').forEach(b=>b.onclick=async()=>{const r=hmReq().find(x=>x.id===b.dataset.hmx);if(!r||!await ask('Delete this request?','Delete'))return;try{await db.doc('requests/'+r.id).update({deleted:true});undoBar('Request deleted.',()=>db.doc('requests/'+r.id).update({deleted:false}))}catch(e){alert('Could not delete: '+(e.message||e.code))}});
 bindRows()}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#homeroot [data-hm]');if(a){e.preventDefault();hmGo(a.dataset.hm)}});
// open on this page when a player arrives (once per visit, only if they have a character and have not clicked anywhere yet)
let hmSkip=false,hmDone=false;
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#nav,#tickt,#view'))hmSkip=true},true);
{const iv=setInterval(()=>{if(hmDone||hmSkip){clearInterval(iv);return}
  try{if(!db||!uid||!handle||!(pm.sheets||[]).length||!prefs)return;hmDone=true;clearInterval(iv);
   const want=isOwner?(prefs.homeStart===true):(prefs.homeStart!==false);
   if(want&&hmMine().length&&board==='general'&&!query&&!initP&&!($('#modal')&&$('#modal').innerHTML.trim())){board='__home';thread=null;render()}}catch(e){}},700);
 setTimeout(()=>clearInterval(iv),20000)}
{const st=document.createElement('style');st.textContent=`.hmg{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;align-items:start}@media(max-width:700px){.hmg{grid-template-columns:1fr}}#homeroot .wd{display:inline-block;width:12px;height:12px;border:1px solid var(--line);margin-right:2px;vertical-align:middle}#homeroot .wd.on{background:var(--red);border-color:var(--red)}`;document.head.appendChild(st)}

// ---- GM dashboard
let gmdBk=null,gmdBkT=0,gmdBusy=false;
const gmdAgo=t=>{const s=Math.max(0,(Date.now()-t)/1000);return s<90?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' d ago'};
async function gmdLoadBk(force){if(gmdBusy||(!force&&gmdBk&&Date.now()-gmdBkT<300000))return;gmdBusy=true;
 try{const r=await fetch('/api/backups',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});const j=await r.json().catch(()=>({}));
  if(!r.ok)gmdBk={err:j.error||('Error '+r.status),setup:!!j.setup};else{const ks=(j.backups||[]).map(b=>String(b.key||'')).filter(k=>/^backup-\d{4}-\d{2}-\d{2}/.test(k)).sort();gmdBk={last:ks.length?ks[ks.length-1].slice(7,17):'',n:ks.length}}}
 catch(e){gmdBk={err:'Could not check the backups.'}}
 gmdBkT=Date.now();gmdBusy=false;if(board==='__gmd')gmdView()}
function gmdView(){if(!isOwner){$('#view').innerHTML='<div class="empty">// GM ONLY.</div>';return}
 gmdLoadBk();
 const peers=new Map();(peersList||[]).forEach(p=>peers.set(p.by||p.peer,p));
 const sheets=(pm.sheets||[]).filter(x=>!x.deleted&&!x.drone).slice().sort((a,b)=>(b.edited||b.ts||0)-(a.edited||a.ts||0)).slice(0,8);
 const jobs=(pm.jobs||[]).filter(x=>!x.deleted&&(x.status==='Open'||x.status==='Taken')),hooks=(pm.missions||[]).filter(x=>!x.deleted&&x.status==='Active'),fb=(pm.feedback||[]).filter(x=>!x.deleted&&(!x.status||x.status==='New'));
 const heat=(pm.heat||[]).filter(x=>!x.deleted&&(x.kind==='pc'||x.kind==='guest')&&(+x.heat||0)>=5).sort((a,b)=>b.heat-a.heat);
 const guests=(pm.heat||[]).filter(x=>!x.deleted&&x.kind==='guest');
 const bid=k=>(Object.entries(PMB).find(e=>e[1]===k)||[])[0];
 let bk;if(!gmdBk)bk='<span class="meta">Checking...</span>';else if(gmdBk.err)bk=`<b style="color:var(--mg)">${esc(gmdBk.err)}</b>`+(gmdBk.setup?'<div class="meta">The backup storage is not set up yet. See the backup steps in the guide.</div>':'');
 else if(!gmdBk.last)bk='<b style="color:var(--am)">No backups yet.</b> <span class="meta">The backup worker has not run.</span>';
 else{const t=Date.parse(gmdBk.last+'T12:00:00Z'),days=Math.floor((Date.now()-Date.parse(gmdBk.last+'T00:00:00Z'))/864e5);bk=`<b style="color:${days>=2?'var(--mg)':days>=1?'var(--am)':'var(--cy)'}">${esc(gmdBk.last)}</b> <span class="meta">${days<=0?'today':days===1?'yesterday':days+' days ago'} · ${gmdBk.n} kept</span>${days>=2?'<div class="meta" style="color:var(--mg)">The daily backup has not run for '+days+' days. Check the backup worker.</div>':''}`}
 const sec=(t,b,go)=>`<div class="shsec" style="margin-bottom:12px"><h2>${t}</h2>${b}</div>`;
 const ini=(typeof iniM!=='undefined'&&iniM&&iniM.active)?`Combat is running · Round ${iniM.round||1}`:'No combat running';
 const sc=(typeof sceneNow==='function'?sceneNow():null);
 $('#view').innerHTML=`<div id="gmdroot"><div class="bar"><h2>🛰 GM DASHBOARD</h2><div><button class="btn sm" id="gmdbc">📢 Broadcast</button> <button class="btn sm" id="gmdr">Refresh</button></div></div>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px">
 ${sec('ONLINE NOW ('+peers.size+')',peers.size?[...peers.values()].map(p=>{const q=p.presence||{};return `<div class="row" style="cursor:default"><span style="color:${cl(q.c)}">● ${esc(q.h||'?')}</span>${p.isMe?' <span class="meta">(you)</span>':''} <span class="meta">${esc(q.w||'')}</span></div>`}).join(''):'<div class="meta">// NOBODY ELSE IS ONLINE.</div>')}
 ${sec('LAST BACKUP',bk+'<div style="margin-top:6px"><button class="btn sm" id="gmdb">Check again</button></div>')}
 ${sec('TABLE',`<div class="meta">${esc(ini)}</div>${guests.length?`<div class="meta" style="margin-top:6px">Players without sheets: ${guests.map(g=>esc(g.name)+' (Heat '+(+g.heat||0)+', Rep '+(+g.rep||0)+')').join(', ')}</div>`:''}${heat.length?'<div style="margin-top:6px"><b>Hot runners</b>'+heat.map(h=>`<div class="meta">🔥 ${esc(h.name)} · Heat ${h.heat}</div>`).join('')+'</div>':'<div class="meta" style="margin-top:6px">Nobody is running hot.</div>'}`)}
 ${sec('RECENTLY CHANGED SHEETS',sheets.length?sheets.map(s=>{const h=(s.hist||[]).slice(-1)[0];return `<a class="row" data-gmds="${esc(s.id)}" style="display:flex;gap:10px"><span style="flex:1"><b>${esc(s.name)}</b>${s.npc?' <span class="tag">NPC</span>':''}<div class="meta">${h?esc(h.l||'change')+' · by '+esc(h.b||'?'):''}</div></span><span class="meta">${(s.edited||s.ts)?esc(gmdAgo(s.edited||s.ts)):''}</span></a>`}).join(''):'<div class="meta">// NO SHEETS YET.</div>')}
 ${sec('OPEN JOBS ('+jobs.length+')',jobs.length?jobs.slice(0,8).map(j=>`<a class="row" data-gmdb="jobs" style="display:flex;gap:10px"><span style="flex:1"><b>${esc(j.title||'')}</b><div class="meta">${esc(j.patron||'')} ${j.deadline?'· due '+esc(j.deadline):''}</div></span><span>${badge(j.status,stc(j.status))}</span></a>`).join('')+(jobs.length>8?`<div class="meta">+${jobs.length-8} more</div>`:''):'<div class="meta">// NO OPEN JOBS.</div>')}
 ${sec('ACTIVE PLOT HOOKS ('+hooks.length+') · NEW FEEDBACK ('+fb.length+')',(hooks.length?hooks.slice(0,6).map(j=>`<a class="row" data-gmdb="missions" style="cursor:pointer"><b>${esc(j.title||'')}</b></a>`).join(''):'<div class="meta">// NO ACTIVE HOOKS.</div>')+(fb.length?`<div style="margin-top:6px"><a class="row" data-gmdf="1" style="cursor:pointer"><b>${fb.length} new feedback item${fb.length===1?'':'s'}</b></a></div>`:''))}
 </div></div>`;
 $('#gmdbc').onclick=bcCompose;$('#gmdr').onclick=()=>{gmdLoadBk(true);gmdView()};$('#gmdb').onclick=()=>{gmdBk=null;gmdView();gmdLoadBk(true)};
 $('#view').querySelectorAll('[data-gmds]').forEach(a=>a.onclick=()=>{shId=a.dataset.gmds;sh=null;board='__sheets';thread=null;render()});
 $('#view').querySelectorAll('[data-gmdb]').forEach(a=>a.onclick=()=>{const b=bid(a.dataset.gmdb);if(b){board=b;thread=null;render()}});
 $('#view').querySelectorAll('[data-gmdf]').forEach(a=>a.onclick=()=>{board='__fb';thread=null;render()})}
setInterval(()=>{try{if(board==='__gmd'&&isOwner&&!$('#modal').innerHTML&&!document.activeElement.matches('input,textarea,select'))gmdView()}catch(e){}},15000);

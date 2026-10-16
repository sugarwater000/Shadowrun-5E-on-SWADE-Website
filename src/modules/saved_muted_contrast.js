// ---- Bookmarks (Saved), muted boards, and high contrast
/* ===== Muted boards: no unread numbers, no chime for that board. @mentions still get through. ===== */
const muteL=()=>Array.isArray(prefs.mute)?prefs.mute:[];
const muteB=id=>muteL().includes(id);
const muteName=id=>((allBoards().find(b=>b.id===id)||{}).name||id);
const muteBtn=id=>(!id||id==='dm'||String(id).startsWith('__'))?'':`<button class="btn sm" data-mute="${esc(id)}" title="Mute: stop the unread numbers and chimes for this board. You are still told when someone @mentions you.">${muteB(id)?'🔇 Muted':'🔔 Mute'}</button> `;
function muteTog(id){const a=muteL().slice(),i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);prefs={...prefs,mute:a};savePrefs();
 document.querySelectorAll('[data-mute="'+id+'"]').forEach(b=>{b.textContent=muteB(id)?'🔇 Muted':'🔔 Mute'});
 try{nav()}catch(e){}
 try{undoBar(muteB(id)?muteName(id)+' muted. You will still be told when someone @mentions you.':muteName(id)+' unmuted.',()=>muteTog(id))}catch(e){}}
function muteListHtml(){const a=muteL();return `<label>MUTED BOARDS</label><div class="hint" id="mlist" style="margin-top:0">${a.length?a.map(id=>`<span style="display:inline-flex;gap:6px;align-items:center;margin-right:10px">🔇 ${esc(muteName(id))} <button type="button" class="btn sm" data-unm="${esc(id)}">Unmute</button></span>`).join(''):'None. Use the 🔔 Mute button at the top of any board to quiet it.'}</div>`}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-mute],[data-unm]');if(!t)return;
 if(t.dataset.unm){const id=t.dataset.unm,a=muteL().filter(x=>x!==id);prefs={...prefs,mute:a};savePrefs();t.parentElement.remove();try{nav()}catch(x){}const m=document.getElementById('mlist');if(m&&!m.children.length)m.textContent='None. Use the 🔔 Mute button at the top of any board to quiet it.';return}
 e.preventDefault();muteTog(t.dataset.mute)});

/* ===== Bookmarks: a personal Saved list for posts and handouts, kept on the server so it follows you ===== */
let bmItems=[],svQ='';
const bmKey=()=>'sr_saved_'+(uid||'x');
const bmHas=(k,id)=>bmItems.some(x=>x.k===k&&x.id===id);
function bmInit(d){let loc=[];try{loc=JSON.parse(localStorage.getItem(bmKey())||'[]')}catch(e){}
 const it=d&&d.exists?d.data().items:null;bmItems=Array.isArray(it)?it:(Array.isArray(loc)?loc:[])}
async function bmPush(){try{localStorage.setItem(bmKey(),JSON.stringify(bmItems))}catch(e){}try{if(db&&uid)await db.doc('data/users/'+uid+'/saved').set({items:bmItems})}catch(e){alert('Could not save your bookmark: '+(e.message||e.code))}}
function bmToggle(k,id){const i=bmItems.findIndex(x=>x.k===k&&x.id===id);if(i>=0)bmItems.splice(i,1);else bmItems=[{k,id,ts:Date.now()},...bmItems].slice(0,500);
 document.querySelectorAll('[data-bm="'+k+'|'+id+'"]').forEach(b=>{b.textContent=bmHas(k,id)?'★ Saved':'☆ Save'});
 try{nav()}catch(e){}if(board==='__saved')savedView();return bmPush()}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-bm]');if(!b)return;e.preventDefault();const [k,...r]=b.dataset.bm.split('|');bmToggle(k,r.join('|'))});
const bmPlain=h=>{const d=document.createElement('div');d.innerHTML=fmt(h||'');return (d.textContent||'').replace(/\s+/g,' ').trim()};
function savedView(){const q=svQ.toLowerCase().trim(),rows=[];
 bmItems.forEach(x=>{
  if(x.k==='p'){const p=allPosts.find(y=>y.id===x.id);if(!p||p.deleted){rows.push({x,gone:1,t:'(this post was deleted or is no longer available)',sub:'',ts:x.ts});return}
   const o=posts.find(y=>y.thread===p.thread&&y.op)||p,B=allBoards().find(b=>b.id===p.board)||{},where=o.to?'Private message':(B.name||p.board);
   rows.push({x,p,ico:'💬',t:o.title||'(untitled)',sub:where+' · '+p.handle+(p.igt?' · '+p.igt:''),body:bmPlain(p.body).slice(0,220),ts:x.ts})}
  else if(x.k==='h'){const h=(pm.handouts||[]).find(y=>y.id===x.id);if(!h||h.deleted){rows.push({x,gone:1,t:'(this handout was removed)',sub:'',ts:x.ts});return}
   rows.push({x,h,ico:'🗂',t:h.title,sub:'Handout Vault · '+(h.fname||''),body:h.desc||'',ts:x.ts})}});
 const shown=rows.filter(r=>!q||(r.t+' '+r.sub+' '+(r.body||'')).toLowerCase().includes(q));
 $('#view').innerHTML=`<div id="svroot"><div class="bar"><h2>★ SAVED</h2></div><div class="hint" style="margin-bottom:10px">Posts and handouts you starred. Press <b>☆ Save</b> on any post or handout to keep it here. Only you can see this list, and it follows you to your other devices.</div>
 ${rows.length>4?`<input id="svq" placeholder="Search your saved items..." value="${esc(svQ)}" style="margin-bottom:10px">`:''}
 <div class="meta" style="margin-bottom:6px">${shown.length} saved item${shown.length==1?'':'s'}</div>
 ${shown.map(r=>`<div class="post" style="padding:8px 12px;margin-bottom:6px"><div class="hd" style="display:flex;justify-content:space-between;gap:8px"><span class="handle" style="color:var(--am)">${r.ico?r.ico+' ':''}${esc(r.t)}</span><span class="meta">${r.x.ts?esc(new Date(r.x.ts).toLocaleDateString()):''}</span></div>${r.sub?`<div class="meta">${esc(r.sub)}</div>`:''}${r.body?`<div class="gbd" style="margin-top:4px">${esc(r.body)}${r.body.length>=220?'…':''}</div>`:''}<div style="margin-top:6px">${r.gone?'':`<button class="btn sm" data-svo="${esc(r.x.k+'|'+r.x.id)}">Open</button> `}<button class="btn sm mg del" data-bm="${esc(r.x.k+'|'+r.x.id)}">Remove</button></div></div>`).join('')||'<div class="empty">// NOTHING SAVED YET. PRESS ☆ SAVE ON A POST.</div>'}</div>`;
 const qi=$('#svq');if(qi)qi.oninput=e=>{svQ=e.target.value;const p=e.target.selectionStart;savedView();const n=$('#svq');n.focus();n.setSelectionRange(p,p)};
 $('#view').querySelectorAll('[data-svo]').forEach(b=>b.onclick=()=>{const [k,...r]=b.dataset.svo.split('|'),id=r.join('|');
  if(k==='p'){const p=allPosts.find(y=>y.id===id);if(!p)return;focusPost=id;openThread(p.thread)}
  else{const h=(pm.handouts||[]).find(y=>y.id===id);if(!h)return;vq=String(h.title||'').toLowerCase();pg=1;board='__vault';thread=null;render()}})}

/* ===== High contrast ===== */
const HC_VARS={'--bg':'#000','--panel':'#000','--line':'#bdbdbd','--tx':'#fff','--dim':'#dcdcdc','--cy':'#4df6ff','--mg':'#ff8ad8','--am':'#ffe14d','--red':'#ff7b7b'};
function hcApply(){const r=document.documentElement.style;if(prefs.hc)Object.keys(HC_VARS).forEach(k=>r.setProperty(k,HC_VARS[k]))}
{const st=document.createElement('style');st.textContent=`body.hc,body.hc.nolines{background:#000!important;background-image:none!important}
body.hc *{text-shadow:none!important;box-shadow:none!important}
body.hc .post,body.hc .modal,body.hc .box,body.hc input,body.hc select,body.hc textarea,body.hc .btn,body.hc .row,body.hc .tag{border-width:2px!important;border-color:var(--line)!important}
body.hc a:not(.btn):not([data-b]){text-decoration:underline}
body.hc :focus-visible{outline:3px solid var(--am)!important;outline-offset:2px}
body.hc #atm,body.hc #atmfx,body.hc #atmban{display:none!important}
body.hc .meta,body.hc .hint,body.hc label{color:#dcdcdc!important}
body.hc header{border-bottom:3px solid var(--cy)}
body.hc .gl{border-bottom:2px solid var(--cy)}
body.hc #nav a.on{outline:2px solid #fff;outline-offset:-2px}
body.hc ::placeholder{color:#cfcfcf}
body.hc #wx,body.hc #wx *,body.hc #ini,body.hc #ini *{color:#fff!important;opacity:1!important}
body.hc #wx{border-color:var(--line)!important}`;document.head.appendChild(st)}

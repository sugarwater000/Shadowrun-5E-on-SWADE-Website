// ---- Quick switcher (Ctrl+K or /): jump to any page, character, token, note, handout or place. And the "?" shortcuts sheet.
let qsS={q:'',i:0,L:[],idx:null};
const qsRecent=()=>{try{return JSON.parse(localStorage.getItem('sr_qs')||'[]')}catch(e){return []}};
const qsRemember=k=>{try{localStorage.setItem('sr_qs',JSON.stringify([k,...qsRecent().filter(z=>z!==k)].slice(0,6)))}catch(e){}};
const qsPlain=h=>String(h).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/\s*\(\d+\)\s*$/,'').replace(/\s*[☆★]\s*$/,'').trim();
function qsIndex(){const A=[],seen=new Set(),add=(k,ico,t,sub,fn)=>{if(seen.has(k))return;seen.add(k);A.push({k,ico,t:String(t||'').trim(),sub,fn})};
 const first=s=>{const m=String(s).match(/^(\S+)\s+(.*)$/u);return m&&!/[A-Za-z0-9]/.test(m[1][0])?[m[1],m[2]]:['📄',s]};
 add('p:__home','🏡','Home','Page',()=>qsPage('__home'));
 Object.keys(NAV_REG||{}).forEach(k=>{if(k==='__hub')return;const r=NAV_REG[k],t=qsPlain(r.inner),[ic,nm]=first(t.replace(/🔒$/,'').trim());add('p:'+k,ic,nm,'Page',()=>qsPage(k))});
 if(isOwner)HUB_TABS.forEach(t=>add('p:'+t[0],t[1],'GM '+t[2],'GM Hub',()=>{hubTab=t[0];board=t[0];thread=null;query='';render()}));
 add('p:help2','❓','Keyboard shortcuts','Help',()=>shOpen());add('p:help3','❓','Help for this page','Help',()=>helpPageOpen());add('p:news2','📰',"What's new",'Help',()=>showNews());
 try{sxItems().forEach(it=>{if(it.type==='posts'||it.type==='gear'&&String(it.go).startsWith('gear|')&&!(it.go.startsWith('sh|')))return;const lab=(SX_T.find(z=>z[0]===it.type)||[])[1]||it.type;add('i:'+it.go,it.ico,it.title,lab,()=>sxGo(it.go))})}catch(e){}
 try{const m=tbCur();if(m)(pm.tbtoks||[]).filter(t=>t&&!t.deleted&&t.map===m.id&&(isOwner||(!t.hid&&t.kind==='pc'))).forEach(t=>add('t:'+t.id,'♟',tbName(t),'Token on '+(m.name||'the map'),()=>tbJumpTo(m.id,0,0,t.id,'🔍 Jumped to '+tbName(t))))}catch(e){}
 return A}
function qsPage(k){const nv=document.getElementById('nav');const a=[...nv.querySelectorAll('a')].find(x=>x.dataset.b===k||x.id===k||x.dataset.nx===k);if(a){a.click();return}
 if(HUB_IDS.includes(k)&&isOwner){hubTab=k;board=k}else board=k;thread=null;query='';render()}
function qsScore(q,t){const l=t.toLowerCase();if(l===q)return 100;if(l.startsWith(q))return 80;const w=l.split(/[\s\/\-_·:]+/);if(w.some(x=>x.startsWith(q)))return 60;if(l.includes(q))return 40;
 const ws=q.split(/\s+/).filter(Boolean);if(ws.length>1&&ws.every(x=>l.includes(x)))return 30;return 0}
function qsFind(q){q=q.trim().toLowerCase();const A=qsS.idx||(qsS.idx=qsIndex());
 if(!q){const rec=qsRecent().map(k=>A.find(a=>a.k===k)).filter(Boolean);const base=A.filter(a=>a.k.startsWith('p:')&&!rec.includes(a)).slice(0,10);return [...rec,...base].slice(0,12)}
 return A.map(a=>{const b=qsScore(q,a.t);return {a,s:b?b+(a.k.startsWith('p:')?5:0)+(a.k.startsWith('t:')?2:0):0}}).filter(x=>x.s>0).sort((x,y)=>y.s-x.s||x.a.t.length-y.a.t.length||x.a.t.localeCompare(y.a.t)).slice(0,12).map(x=>x.a)}
function qsOpen(){if(document.getElementById('qsov'))return;qsS={q:'',i:0,L:[],idx:null};const o=document.createElement('div');o.id='qsov';
 o.innerHTML=`<div class="qsb" role="dialog" aria-modal="true" aria-label="Quick switcher"><input id="qsi" role="combobox" aria-expanded="true" aria-controls="qsl" autocomplete="off" placeholder="Jump to a page, character, note, token, handout…" aria-label="Jump to"><div id="qsl" role="listbox"></div><div class="meta qsh">↑ ↓ choose · Enter go · Esc close · or just type to search everything</div></div>`;document.body.appendChild(o);
 const i=document.getElementById('qsi'),close=()=>{o.remove();qsS.idx=null;document.removeEventListener('keydown',kd,true)};qsS.close=close;
 const draw=()=>{const l=document.getElementById('qsl');qsS.L=qsFind(qsS.q);qsS.i=Math.min(qsS.i,Math.max(0,qsS.L.length-(qsS.q.trim()?0:1)));
  l.innerHTML=qsS.L.map((a,n)=>`<div class="qsr${n===qsS.i?' on':''}" role="option" id="qso${n}" aria-selected="${n===qsS.i}" data-qsn="${n}"><span class="qsi">${esc(a.ico)}</span><span class="qst">${esc(a.t)}</span><span class="meta">${esc(a.sub)}</span></div>`).join('')+(qsS.q.trim()?`<div class="qsr${qsS.i===qsS.L.length?' on':''}" role="option" id="qso${qsS.L.length}" data-qsn="${qsS.L.length}"><span class="qsi">🔎</span><span class="qst">Search everything for “${esc(qsS.q.trim())}”</span><span class="meta">Search</span></div>`:'')+(!qsS.L.length&&!qsS.q.trim()?'<div class="meta" style="padding:8px">Nothing to show yet.</div>':'');
  i.setAttribute('aria-activedescendant','qso'+qsS.i);const on=l.querySelector('.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'})};
 const go=n=>{const a=qsS.L[n];if(!a){const q=qsS.q.trim();close();if(q){query=q;$('#q').value=q;thread=null;document.body.classList.remove('menu');render()}return}close();qsRemember(a.k);try{a.fn()}catch(e){}};
 const kd=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}if(!o.isConnected)return;
  const tot=qsS.L.length+(qsS.q.trim()?1:0);if(e.key==='ArrowDown'){e.preventDefault();qsS.i=(qsS.i+1)%Math.max(1,tot);draw()}else if(e.key==='ArrowUp'){e.preventDefault();qsS.i=(qsS.i-1+Math.max(1,tot))%Math.max(1,tot);draw()}else if(e.key==='Enter'&&e.target===i){e.preventDefault();go(qsS.i)}};
 document.addEventListener('keydown',kd,true);i.oninput=()=>{qsS.q=i.value;qsS.i=0;draw()};
 o.addEventListener('mousedown',e=>{const r=e.target.closest('[data-qsn]');if(r){e.preventDefault();go(+r.dataset.qsn)}else if(e.target===o)close()});
 o.addEventListener('mousemove',e=>{const r=e.target.closest('[data-qsn]');if(r&&+r.dataset.qsn!==qsS.i){qsS.i=+r.dataset.qsn;o.querySelectorAll('.qsr').forEach((x,n)=>{x.classList.toggle('on',n===qsS.i);x.setAttribute('aria-selected',n===qsS.i)})}});
 draw();i.focus()}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&String(e.key).toLowerCase()==='k'){e.preventDefault();if(document.getElementById('qsov'))qsS.close();else if(!(document.getElementById('askov')))qsOpen()}});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#qkBtn'))qsOpen()});
/* "?" opens the shortcuts sheet */
const SH_KEYS=()=>[['Everywhere',[['Ctrl+K or /','Quick switcher: jump to any page, character, note or token'],['?','This shortcuts sheet'],['Esc','Close a window, or cancel what you are doing']]],
 ['Tabletop',[['V  M  P  E','Move, Measure, Ping, Eraser tools'],['W  K  F','Walls (GM), Markers, Fog (GM)'],['1 to 5','Pick a shape to draw'],['G','Snap to grid on or off'],['Arrow keys','Nudge the selected token a square'],['Shift-click or drag a box','Select several tokens'],['Ctrl+Z / Ctrl+Y','Undo / redo'],['Ctrl+C  X  V  D','Copy, cut, paste, duplicate'],['Delete','Remove the selection'],['Space + drag','Pan the map'],['Right-click a token','Token menu']]],
 ['Clue Board',[['Click, then click another','Connect two notes with string'],['Shift-click or drag a box','Select several notes'],['Ctrl+A','Select every note'],['Ctrl+Z / Ctrl+Y','Undo / redo'],['Ctrl+C  X  V  D','Copy, cut, paste, duplicate'],['Delete','Remove the selected notes'],['Arrow keys','Nudge selected notes (Shift = bigger steps)'],['Double-click a note','Edit it']]],
 ['Writing',[['Ctrl+Enter','Send a post'],['@','Mention someone']]]];
function shOpen(){if(document.getElementById('shov'))return;const o=document.createElement('div');o.id='shov';
 const here=board==='__tbl'?'Tabletop':board==='__clues'?'Clue Board':'';const S=SH_KEYS().sort((a,b)=>(b[0]===here)-(a[0]===here));
 o.innerHTML=`<div class="qsb" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" style="max-height:80vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-size:16px">⌨ KEYBOARD SHORTCUTS</h2><button class="btn sm" id="shx" aria-label="Close">✕</button></div>${S.map(g=>`<div class="meta" style="margin:10px 0 4px;letter-spacing:.14em">${esc(g[0].toUpperCase())}</div>${g[1].map(r=>`<div class="shr"><kbd>${esc(r[0])}</kbd><span>${esc(r[1])}</span></div>`).join('')}`).join('')}<div style="margin-top:12px"><button class="btn sm" id="shhp">❓ Help for this page</button></div></div>`;document.body.appendChild(o);
 const close=()=>{o.remove();document.removeEventListener('keydown',kd,true)},kd=e=>{if(e.key==='Escape'||e.key==='?'){e.preventDefault();e.stopPropagation();close()}};document.addEventListener('keydown',kd,true);
 o.onmousedown=e=>{if(e.target===o)close()};document.getElementById('shx').onclick=close;document.getElementById('shhp').onclick=()=>{close();helpPageOpen()};document.getElementById('shx').focus()}
document.addEventListener('keydown',e=>{if(e.key!=='?'||e.ctrlKey||e.metaKey||e.altKey)return;const a=document.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;if(document.getElementById('qsov')||document.getElementById('askov'))return;if($('#modal')&&$('#modal').innerHTML.trim())return;e.preventDefault();shOpen()});

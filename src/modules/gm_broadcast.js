// ---- GM broadcast: a message that pops up for everyone
const BC_KINDS={news:['📰 News flash','#00e5ff'],trid:['📺 Trid alert','#ffb000'],raid:['🚨 Security alert','#ff3df0'],corp:['🏢 Corp memo','#39ff14'],sys:['📡 Matrix notice','#9aa0a6']};
let bcInit=false,bcQueue=[],bcShowing=false;
const bcAll=()=>(pm.broadcasts||[]).filter(x=>!x.deleted&&x.ts).sort((a,b)=>a.ts-b.ts);
const bcSeen=()=>{try{return +localStorage.getItem('bc_seen')||0}catch(e){return 0}};
const bcMark=t=>{try{localStorage.setItem('bc_seen',String(t))}catch(e){}};
function bcCheck(){const L=bcAll();if(!bcInit){bcInit=true;if(!bcSeen()){bcMark(L.length?L[L.length-1].ts:Date.now());return}}
 const seen=bcSeen(),fresh=L.filter(x=>x.ts>seen);if(!fresh.length)return;bcMark(fresh[fresh.length-1].ts);
 fresh.filter(x=>x.ts>Date.now()-6*3600e3).forEach(x=>bcQueue.push(x));bcNext()}
function bcNext(){if(bcShowing||!bcQueue.length)return;const b=bcQueue.shift(),k=BC_KINDS[b.kind]||BC_KINDS.news;bcShowing=true;bcBox(b,k,()=>{bcShowing=false;bcNext()})}
function bcBox(b,k,done){const old=$('#bcov');if(old)old.remove();const el=document.createElement('div');el.id='bcov';
 el.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:flex-start;justify-content:center;padding:8vh 16px 16px;overflow:auto';
 el.innerHTML=`<div role="alertdialog" aria-live="assertive" style="max-width:560px;width:100%;background:var(--bg,#0a0a12);border:2px solid ${k[1]};box-shadow:0 0 28px ${k[1]}66;padding:16px 18px"><div style="color:${k[1]};letter-spacing:.12em;font-size:12px;font-weight:700">${esc(k[0].toUpperCase())}</div>${b.title?`<h2 style="margin:6px 0 8px;color:var(--tx)">${esc(b.title)}</h2>`:''}<div style="white-space:pre-wrap;font-size:15px;line-height:1.45">${esc(b.text||'')}</div><div class="meta" style="margin-top:10px">${esc(b.by||'GM')} · ${esc(new Date(b.ts).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</div><div style="margin-top:12px"><button class="btn grn" id="bcok">Got it</button></div></div>`;
 document.body.appendChild(el);const close=()=>{el.remove();done&&done()};$('#bcok').onclick=close;el.onclick=e=>{if(e.target===el)close()};setTimeout(()=>{const o=$('#bcok');if(o)o.focus()},50)}
function bcCompose(){if(!isOwner)return;const hist=bcAll().slice(-6).reverse();
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>📢 GM BROADCAST</h2><div class="hint">Sends a pop-up to everyone who has the site open right now. People who open the site in the next few hours see it too.</div>
 <label>TYPE</label><select id="bck">${Object.entries(BC_KINDS).map(([k,v])=>`<option value="${k}">${esc(v[0])}</option>`).join('')}</select>
 <label>HEADLINE (OPTIONAL)</label><input id="bct" maxlength="100" placeholder="e.g. Knight Errant sweep in Redmond">
 <label>MESSAGE</label><textarea id="bcm" rows="4" maxlength="600" placeholder="What everyone sees"></textarea>
 <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grn" id="bcs">Send to everyone</button><button class="btn" id="bcp">Preview</button><button class="btn mg" id="bcx">Close</button></div>
 ${hist.length?`<div class="meta" style="margin-top:12px">RECENT</div>${hist.map(h=>`<div class="row" style="cursor:default;display:flex;gap:8px;align-items:center"><span style="flex:1"><b>${esc((BC_KINDS[h.kind]||BC_KINDS.news)[0])}</b> ${esc(h.title||String(h.text||'').slice(0,50))}<div class="meta">${esc(new Date(h.ts).toLocaleString())}</div></span><button class="btn sm" data-bcr="${esc(h.id)}">Send again</button></div>`).join('')}`:''}</div></div>`;
 const cur=()=>({kind:$('#bck').value,title:$('#bct').value.trim(),text:$('#bcm').value.trim()});
 $('#bcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#bcp').onclick=()=>{const c=cur();if(!c.text&&!c.title)return alert('Write a message first.');bcBox({...c,by:handle||'GM',ts:Date.now()},BC_KINDS[c.kind],null)};
 const send=async c=>{if(!c.text&&!c.title)return alert('Write a message first.');try{const ref=await db.collection('broadcasts').add({...c,by:handle||'GM',ts:Date.now()});$('#modal').innerHTML='';undoBar('Broadcast sent.',()=>db.doc('broadcasts/'+ref.id).update({deleted:true}))}catch(e){alert('Could not send: '+(e.message||e.code))}};
 $('#bcs').onclick=()=>send(cur());
 $('#modal').querySelectorAll('[data-bcr]').forEach(b=>b.onclick=()=>{const h=bcAll().find(x=>x.id===b.dataset.bcr);if(h)send({kind:h.kind,title:h.title||'',text:h.text||''})})}
function bcView(){const hist=bcAll().slice().reverse().slice(0,30);
 $('#view').innerHTML=`<div class="bar"><h2>📢 GM BROADCAST</h2><button class="btn grn" id="bcnew">New broadcast</button></div><div class="hint" style="margin-bottom:10px">Sends a pop-up to everyone who has the site open right now. People who open the site in the next few hours see it too.</div>`+(hist.length?hist.map(h=>`<div class="row" style="cursor:default;display:flex;gap:8px;align-items:center"><span style="flex:1"><b>${esc((BC_KINDS[h.kind]||BC_KINDS.news)[0])}</b> ${esc(h.title||String(h.text||'').slice(0,80))}<div class="meta">${esc(new Date(h.ts).toLocaleString())} · ${esc(h.by||'GM')}</div></span><button class="btn sm" data-bcr2="${esc(h.id)}">Send again</button></div>`).join(''):'<div class="empty">// NO BROADCASTS YET.</div>');
 $('#bcnew').onclick=bcCompose;$('#view').querySelectorAll('[data-bcr2]').forEach(b=>b.onclick=async()=>{const h=bcAll().find(x=>x.id===b.dataset.bcr2);if(!h||!await ask('Send "'+(h.title||String(h.text||'').slice(0,40))+'" to everyone again?','Send'))return;try{await db.collection('broadcasts').add({kind:h.kind,title:h.title||'',text:h.text||'',by:handle||'GM',ts:Date.now()});bcView()}catch(e){alert('Could not send: '+(e.message||e.code))}})}

// ---- Off Screen Scenes: "Writing as" (the scene character) next to the player's own handle
const scKey=t=>'sr_sc_'+t,scRecK='sr_sc_recent';
const scClean=v=>String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,60);
function scRecent(){try{const a=JSON.parse(localStorage.getItem(scRecK)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[]}catch(e){return[]}}
function scSet(t,v){v=scClean(v);try{localStorage.setItem(scKey(t),v);if(v){const r=[v,...scRecent().filter(x=>x!==v)].slice(0,12);localStorage.setItem(scRecK,JSON.stringify(r))}}catch(e){}}
function scGet(t){try{const v=localStorage.getItem(scKey(t));if(v!==null)return scClean(v)}catch(e){}
 const m=(posts||[]).filter(p=>p.thread===t&&p.sc&&((uid&&p.uid===uid)||(handle&&p.handle===handle))).sort((a,b)=>(b.ts||0)-(a.ts||0))[0];return m?m.sc:''}
function scMine(){return (pm.sheets||[]).filter(s=>!s.deleted&&!s.drone&&s.uid&&s.uid===uid&&(s.handle||s.name)).map(s=>String(s.handle||s.name))}
function scUsed(t){const seen=new Set(),out=[];(posts||[]).filter(p=>p.thread===t&&p.sc).sort((a,b)=>(b.ts||0)-(a.ts||0)).forEach(p=>{if(!seen.has(p.sc)){seen.add(p.sc);out.push(p.sc)}});return out}
function scAll(t){const s=new Set(),o=[];[...scMine(),...scUsed(t),...scRecent(),...(npcs||[]).map(n=>n.name)].forEach(x=>{if(x&&!s.has(x)){s.add(x);o.push(x)}});return o}
function scChips(t,cur){const s=new Set(),o=[];[...scMine(),...scUsed(t),...scRecent()].forEach(x=>{if(x&&!s.has(x)&&o.length<8){s.add(x);o.push(x)}});
 return o.map(x=>`<button type="button" class="btn sm scchip${x===cur?' on':''}" data-scn="${esc(x)}">${esc(x)}</button>`).join('')+(cur?`<button type="button" class="btn sm scchip" data-scn="" title="Post as yourself">✕ just me</button>`:'')}
function scBar(t){const cur=scGet(t);
 return `<div class="scbar"><span class="scp" title="You. This is the player the table sees behind every message you write.">👤 Player <b>${esc(handle||'(set a handle)')}</b></span><label class="scw" title="The character you are speaking as in this scene. Leave it empty to post as yourself.">🎭 Writing as <input id="scc" list="scl" maxlength="60" autocomplete="off" placeholder="Scene character (empty = just you)" value="${esc(cur)}"></label><datalist id="scl">${scAll(t).map(x=>`<option value="${esc(x)}">`).join('')}</datalist></div><div class="scchips" id="sccs">${scChips(t,cur)}</div>`}
const scCur=t=>{const i=$('#scc');return i?scClean(i.value):scGet(t)};
function scBind(op){const t=op.thread,i=$('#scc');if(!i)return;
 const draw=()=>{const h=$('#sccs');if(h)h.innerHTML=scChips(t,scClean(i.value))};
 i.oninput=()=>{scSet(t,i.value);draw()};
 i.onkeydown=k=>{if(k.key==='Enter'){k.preventDefault();const a=$('#cht');if(a)a.focus()}};
 const h=$('#sccs');if(h)h.onclick=e=>{const b=e.target.closest('[data-scn]');if(!b)return;i.value=b.dataset.scn;scSet(t,i.value);draw();const a=$('#cht');if(a)a.focus()}}
function scHead(p){const c='color:'+cl(p.col)+';cursor:pointer';
 if(!p.sc)return `<span class="handle" data-ph="${esc(p.handle)}" style="${c}">${esc(p.handle)}</span>`;
 return `<span class="handle" data-ph="${esc(p.sc)}" style="${c}">${esc(p.sc)}</span> <span class="scby" data-ph="${esc(p.handle)}" title="The player writing this character">👤 ${esc(p.handle)}</span>`}
function scField(e,o){const v=e?(e.sc||''):scGet(o.thread||'');const t=o.thread||(e&&e.thread)||'';
 return `<label>WRITING AS (SCENE CHARACTER, OPTIONAL)</label><input name="sc" maxlength="60" list="scl2" autocomplete="off" placeholder="Who you are speaking as. Empty = just you." value="${esc(v)}"><datalist id="scl2">${scAll(t).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`}
{const st=document.createElement('style');st.textContent=`.scbar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-bottom:6px}
.scp{border:1px solid var(--line);padding:3px 8px;font-size:13px;white-space:nowrap}.scp b{color:var(--cy)}
.scw{display:flex;align-items:center;gap:6px;flex:1;min-width:220px;margin:0;font-size:13px;color:var(--mg)}.scw input{flex:1;min-width:120px;padding:4px 8px}
.scchips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}.scchips:empty{display:none}.scchip.on{border-color:var(--mg);color:var(--mg)}
.scby{font-size:12px;color:var(--dim);border:1px solid var(--line);padding:0 6px;margin-left:4px;cursor:pointer;white-space:nowrap}`;document.head.appendChild(st)}

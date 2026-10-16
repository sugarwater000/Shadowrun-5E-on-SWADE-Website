// ---- Round timers: powers and conditions that wear off as initiative rounds pass
const tmRound=()=>(typeof iniM!=='undefined'&&iniM&&iniM.active)?Math.max(1,iniM.round||1):0;
const tmEff=t=>{const r=tmRound(),l=+t.left||0;return r&&r>=(+t.rd||1)?Math.max(0,l-(r-(+t.rd||1))):l};
const tmList=()=>(sh&&Array.isArray(sh.timers))?sh.timers:[];
const tmMine=()=>!!sh&&(isOwner||(!!sh.uid&&sh.uid===uid)||!sh.uid);
function tmXs(){if(!sh)return[];const o=[];tmList().forEach(t=>{const p=+t.pen||0;if(p&&tmEff(t)>0)o.push([(t.n||'Timer'),p])});return o}
function tmSave(arr){if(!sh)return;sh.timers=arr;shDirty.add('timers');clearTimeout(shTimer);shTimer=setTimeout(shSave,700)}
// when a round passes, write the new remaining counts back (only the owner or GM does this; the result is the same for everyone, so it is safe to repeat)
function tmCommit(){if(!sh||!tmMine())return;const r=tmRound();if(!r)return;let ch=false;
 const a=tmList().map(t=>{const rd=+t.rd||1;if(rd===r)return t;ch=true;return r>rd?{...t,left:tmEff(t),rd:r}:{...t,rd:r}});
 if(ch)tmSave(a)}
function tmAdd(n,left,pen,src){if(!sh||!shCan())return;n=String(n||'').trim().slice(0,40);left=Math.max(1,Math.min(99,Math.round(+left)||1));pen=Math.max(-6,Math.min(0,Math.round(+pen)||0));if(!n)return;
 const a=tmList().filter(t=>!(src&&t.src===src));a.push({id:'t'+Date.now().toString(36)+a.length,n,left,rd:tmRound()||1,pen,src:src||''});tmSave(a);tmDraw()}
function tmFromPower(pw){if(!pw||!shCan())return;const m=/(\d+)\s*(?:\+\s*)?(?:rounds?|rnds?)\b/i.exec(String(pw.dur||''));if(!m)return;tmAdd(pw.n||'Power',+m[1],0,'pw:'+(pw.n||''))}
function tmForm(){if(!shCan())return;const pre=['Stunned','Entangled','Bound','Distracted','Vulnerable','Shaken','Blinded','Burning','Poisoned'];
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>⏱ NEW TIMER</h2><div class="hint">Counts down by one each initiative round while combat is running. Use it for a power with a duration, or a condition that ends after a set time.</div>
 <label>NAME</label><input id="tmn" list="tmpre" maxlength="40" placeholder="e.g. Armor, Stunned, Invisibility"><datalist id="tmpre">${pre.map(x=>`<option value="${x}">`).join('')}</datalist>
 <label>ROUNDS</label><input id="tml" type="number" min="1" max="99" value="5">
 <label>ROLL PENALTY WHILE ACTIVE (0 FOR NONE, E.G. −1 FOR A SUSTAINED POWER)</label><input id="tmp" type="number" min="-6" max="0" value="0">
 <div style="margin-top:12px"><button class="btn grn" id="tmok">Add timer</button> <button class="btn" id="tmx">Cancel</button></div></div></div>`;
 $('#tmx').onclick=()=>{$('#modal').innerHTML=''};$('#tmok').onclick=()=>{const n=$('#tmn').value.trim();if(!n)return alert('Give the timer a name.');tmAdd(n,$('#tml').value,$('#tmp').value);$('#modal').innerHTML=''};
 setTimeout(()=>{const e=$('#tmn');if(e)e.focus()},50)}
function tmDraw(){const R=$('#sheetroot');if(!R||!sh||sh.drone&&false)return;let el=$('#shtm');tmCommit();
 if(!el){const ref=$('#fxleg');if(!ref||!ref.parentNode)return;el=document.createElement('div');el.id='shtm';el.className='shsec';el.style.marginBottom='12px';ref.parentNode.insertBefore(el,ref)}
 const L=tmList(),r=tmRound(),can=shCan();
 const rows=L.map(t=>{const e=tmEff(t),ex=e<=0,pen=+t.pen||0;return `<div class="row" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;${ex?'opacity:.7':''}"><b style="min-width:120px">${esc(t.n)}</b><span style="${ex?'color:var(--mg)':e<=1?'color:var(--am)':''}"><b>${ex?'ENDED':e+' round'+(e===1?'':'s')+' left'}</b></span>${pen&&!ex?`<span class="meta" title="Applied to this character's trait rolls while active">${pen} to rolls</span>`:''}${can?`<button class="btn sm" data-tmd="${esc(t.id)}|-1" title="One round less">−1</button><button class="btn sm" data-tmd="${esc(t.id)}|1" title="One round more">+1</button><button class="btn sm" data-tmx="${esc(t.id)}">${ex?'dismiss':'remove'}</button>`:''}</div>`}).join('');
 const sig=JSON.stringify([L,r,can]);if(el.dataset.sig===sig)return;el.dataset.sig=sig;
 el.innerHTML=`<h2>⏱ TIMERS</h2>${rows||'<div class="meta">// NOTHING RUNNING.'+(can?' ADD A POWER OR CONDITION THAT WEARS OFF AFTER SOME ROUNDS.':'')+'</div>'}${r?'':(L.length?'<div class="meta" style="margin-top:4px">Counts are paused until combat starts (Tools, Initiative).</div>':'')}${can?'<div style="margin-top:6px"><button class="btn sm grn" id="tmadd">+ Timer</button></div>':''}`;
 const ad=el.querySelector('#tmadd');if(ad)ad.onclick=tmForm;
 el.querySelectorAll('[data-tmd]').forEach(b=>b.onclick=()=>{const [id,d]=b.dataset.tmd.split('|');tmSave(tmList().map(t=>t.id===id?{...t,left:Math.max(0,Math.min(99,tmEff(t)+(+d))),rd:tmRound()||1}:t));tmDraw()});
 el.querySelectorAll('[data-tmx]').forEach(b=>b.onclick=()=>{tmSave(tmList().filter(t=>t.id!==b.dataset.tmx));tmDraw()})}
// keep counts fresh when the round turns
let tmSig='';setInterval(()=>{try{const s=(typeof iniM!=='undefined'&&iniM?(iniM.active?1:0)+'|'+(iniM.round||0):'');if(s!==tmSig){tmSig=s;if(sh&&$('#shtm'))tmDraw()}}catch(e){}},800);

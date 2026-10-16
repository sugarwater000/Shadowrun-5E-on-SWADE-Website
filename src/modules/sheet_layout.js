// ---- Sheet layout preferences: collapse and reorder sections (saved per player, used on every sheet)
const LAY_NAMES={shtm:'Timers',shlive:'Funds & equipment',shdrn:'Drones',shlo:'Loadouts',shveh:'Vehicles & packed gear',shsn:'Cyberware & Strain',shcr:'Build points',drpanel:'Drone controls'};
const layFixed=el=>el.classList.contains('bar')||['shbar','fxleg','plbox'].includes(el.id);
const layH2=el=>{const h=[...el.children].find(c=>c.tagName==='H2');return h||null};
function layKey(el){if(el.id)return el.id;const h=layH2(el);if(h&&h.childNodes[0]){const t=h.childNodes[0].textContent.toUpperCase().replace(/[^A-Z0-9&\/ ]/g,'').trim();if(t)return 'h:'+t}
 const tx=el.textContent.replace(/\s+/g,' ').trim();if(/^CHARACTER NAME/i.test(tx))return 'g:ident';if(/^Agility/.test(tx))return 'g:ast';if(/^Vigor/.test(tx))return 'g:vaw';if(/^ADVANCES/.test(tx)||/EDGES \d/.test(tx.slice(0,60)))return 'g:aeh';return ''}
function layName(el,k){if(LAY_NAMES[k])return LAY_NAMES[k];if(k==='g:ident')return 'Character details';if(k==='g:ast')return 'Agility, Smarts & Spirit';if(k==='g:vaw')return 'Strength, Vigor, armor & wounds';if(k==='g:aeh')return 'Advances, edges & hindrances';
 const h=layH2(el);if(h&&h.childNodes[0]){const t=h.childNodes[0].textContent.trim();return t.charAt(0)+t.slice(1).toLowerCase()}return k}
function layUnits(){const R=$('#sheetroot');if(!R)return[];return [...R.children].filter(c=>!layFixed(c)).map(el=>{const key=layKey(el);return{el,key,name:layName(el,key),can:!!layH2(el)}}).filter(u=>u.key)}
const layPref=()=>{const l=(prefs&&prefs.lay)||{};return{order:Array.isArray(l.order)?l.order:[],col:l.col&&typeof l.col==='object'?l.col:{}}};
function laySeq(units){const p=layPref().order,keys=units.map(u=>u.key),have=new Set(keys);const seq=p.filter(k=>have.has(k));const seen=new Set(seq);
 keys.forEach((k,i)=>{if(seen.has(k))return;let at=-1;for(let j=i-1;j>=0;j--){const q=seq.indexOf(keys[j]);if(q>=0){at=q;break}}seq.splice(at+1,0,k);seen.add(k)});return seq}
(()=>{if(document.getElementById('laycss'))return;const s=document.createElement('style');s.id='laycss';s.textContent='#sheetroot.lay{display:flex;flex-direction:column}.lcable>h2{cursor:pointer}.lcable>h2::after{content:" ▾";opacity:.45;font-size:.8em}.lc>h2::after{content:" ▸"}.lc>*:not(h2){display:none!important}';document.head.appendChild(s)})();
function layApply(){const R=$('#sheetroot');if(!R||!sh)return;const U=layUnits(),p=layPref(),custom=p.order.length>0;
 U.forEach(u=>{u.el.classList.toggle('lcable',u.can);u.el.classList.toggle('lc',u.can&&!!p.col[u.key])});
 if(!custom){R.classList.remove('lay');[...R.children].forEach(c=>{c.style.order=''});return}
 const seq=laySeq(U);R.classList.add('lay');[...R.children].forEach((c,i)=>{if(layFixed(c))c.style.order=String(i-1000)});
 U.forEach(u=>{u.el.style.order=String(seq.indexOf(u.key)*10)})}
function laySave(patch){const cur=layPref();prefs.lay={...cur,...patch};savePrefs();layApply()}
document.addEventListener('click',e=>{const h=e.target.closest&&e.target.closest('#sheetroot > .lcable > h2');if(h&&!e.target.closest('button,input,select,a,textarea')){const k=layKey(h.parentElement);if(!k)return;const col={...layPref().col};if(col[k])delete col[k];else col[k]=1;laySave({col});return}
 const b=e.target.closest&&e.target.closest('#shlay');if(b&&sh)layModal()});
function layModal(){const U=layUnits();if(!U.length)return;const p=layPref();let seq=laySeq(U);const byK=Object.fromEntries(U.map(u=>[u.key,u]));
 const draw=()=>{$('#modal').innerHTML=`<div class="modal"><div class="box"><h2>⚙ SHEET LAYOUT</h2><div class="hint">Move sections up or down, and fold away the ones you rarely use. This is saved for you and is used on every character sheet. You can also click a section's title on the sheet to fold or unfold it.</div>
  ${seq.map((k,i)=>{const u=byK[k],col=!!layPref().col[k];return `<div class="row" style="cursor:default;display:flex;gap:8px;align-items:center"><span style="flex:1">${esc(u.name)}</span>${u.can?`<label class="meta" style="white-space:nowrap"><input type="checkbox" data-layc="${esc(k)}" ${col?'checked':''}> folded</label>`:''}<button class="btn sm" data-layu="${i}" ${i?'':'disabled'} title="Move up">▲</button><button class="btn sm" data-layd="${i}" ${i<seq.length-1?'':'disabled'} title="Move down">▼</button></div>`}).join('')}
  <div style="margin-top:12px;display:flex;gap:8px"><button class="btn mg" id="layr">Reset to the standard layout</button><button class="btn grn" id="layx">Done</button></div></div></div>`;
  $('#layx').onclick=()=>{$('#modal').innerHTML=''};
  $('#layr').onclick=()=>{prefs.lay={order:[],col:{}};savePrefs();layApply();seq=laySeq(layUnits());draw()};
  $('#modal').querySelectorAll('[data-layc]').forEach(c=>c.onchange=()=>{const col={...layPref().col};if(c.checked)col[c.dataset.layc]=1;else delete col[c.dataset.layc];laySave({col})});
  const mv=(i,d)=>{const j=i+d;if(j<0||j>=seq.length)return;[seq[i],seq[j]]=[seq[j],seq[i]];laySave({order:seq.slice()});draw()};
  $('#modal').querySelectorAll('[data-layu]').forEach(b=>b.onclick=()=>mv(+b.dataset.layu,-1));$('#modal').querySelectorAll('[data-layd]').forEach(b=>b.onclick=()=>mv(+b.dataset.layd,1))};
 draw()}

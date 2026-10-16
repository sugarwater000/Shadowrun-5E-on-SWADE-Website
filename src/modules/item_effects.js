/* ================= ITEM EFFECTS ================= */
/* An item can carry the same effect lines as an edge. Catalog items get theirs from ITEM_FX (by category and name);
   any item can override them with its own "fx" text. "on" says whether the item is installed or in use. */
const itemKey=x=>x.cat+'|'+x.name;
const itemDef=x=>ITEM_FX[itemKey(x)]||null;
const itemFxText=x=>typeof x.fx==='string'?x.fx:(itemDef(x)||{f:''}).f;
const _itCache=new Map();
function itemFxParsed(t){let v=_itCache.get(t);if(!v){v=fxParse(t).fx;if(_itCache.size>400)_itCache.clear();_itCache.set(t,v)}return v}
function itemOn(x){if(armInfo(x))return !!x.worn;if(x.on!==undefined&&x.on!==null)return !!x.on;return x.cat==='Cyberware'}
function fxInv(S){const nm=S&&(S.handle||S.name);if(!nm)return[];const out=[];(pm.inventory||[]).forEach(x=>{if(x.deleted||x.owner!==nm)return;const t=itemFxText(x);if(!t||!itemOn(x))return;const fx=itemFxParsed(t);if(!fx.length)return;out.push({ent:{id:x.id,opt:x.opt||'',n:x.name},d:{n:x.name,_fx:fx}})});return out}
const itemNeedsOpt=x=>/\$(skill|opt)/i.test(itemFxText(x)||'')&&!String(x.opt||'').trim();
const itemShort=x=>{const L=fxFmt(itemFxParsed(itemFxText(x))).split('\n').filter(Boolean);return L.slice(0,2).join('; ')+(L.length>2?' …':'')};
/* the little switch on each row of the equipment list */
function itFxTag(x,d){const t=itemFxText(x);if(!t||!itemFxParsed(t).length)return'';const on=itemOn(x),isA=!!armInfo(x),full=fxFmt(itemFxParsed(t)).split('\n').join('; ');
 return `${isA?'':` <label class="tag fxon ${on?'on':''}" style="cursor:pointer;color:${on?'#39ff14':'var(--dim)'};border-color:currentColor" title="${on?'Counting on the sheet':'Not counting. Tick it when it is installed or in use.'}: ${esc(full)}"><input type="checkbox" data-iuse="${x.id}" ${on?'checked':''} ${d} style="width:auto;margin:0 3px 0 0">${x.cat==='Cyberware'?'Installed':'In use'}</label>`} <span class="meta" title="${esc(full)}">${esc(itemShort(x))}</span>${itemNeedsOpt(x)?` <a class="eqn" data-ei="${x.id}" style="color:var(--am)">⚠ choose skill</a>`:''}`}
/* --- the effects editor shown in the item window and the add-item window --- */
const IT_SPEC=[['parry','Parry'],['toughness','Toughness'],['pace','Pace'],['bennies','Bennies'],['power points','Power points'],['damage','Damage'],['cards','Extra action cards'],['ignore wounds','Ignore wound levels'],['max wounds','Max wounds']];
function itSkillsOf(from){if(Array.isArray(from))return from;const a=String(from||'').toLowerCase();return SW_SKILLS.filter(s=>s[1]===a).map(s=>s[0])}
function itFxSection(x,canEdit){const def=x?itemDef(x):null,text=x?itemFxText(x):'',isA=x&&armInfo(x),on=x?itemOn(x):true;
 if(!canEdit){return text?`<div class="post" style="padding:8px 12px;margin:8px 0"><b>EFFECTS ON THE SHEET</b><div class="meta">${esc(fxFmt(itemFxParsed(text)).split('\n').join('; '))}${isA||on?'':' (not in use right now)'}</div></div>`:''}
 const sk=swSkillNames(),opts=(def&&def.o)||null,optVals=String(x&&x.opt||'').split(',').map(z=>z.trim()).filter(Boolean);
 const optBox=opts?`<div id="itopt" style="margin:6px 0"><label>CHOOSE ${opts.n==1?'ONE':'UP TO '+opts.n} <span class="meta">(the effect applies to what you tick)</span></label><div style="display:flex;flex-wrap:wrap;gap:4px 14px">${itSkillsOf(opts.from).map(n=>`<label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" name="ito" value="${esc(n)}" ${optVals.some(v=>v.toLowerCase()===n.toLowerCase())?'checked':''} style="width:auto"> ${esc(n)}</label>`).join('')}</div></div>`
  :`<div id="itopt" style="margin:6px 0;${/\$(skill|opt)/i.test(text)?'':'display:none'}"><label>WHICH SKILL? <span class="meta">for lines that say $skill. Several skills: separate with commas.</span></label><input name="opt" list="itskl" value="${esc(optVals.join(', '))}" autocomplete="off" maxlength="120"><datalist id="itskl">${sk.map(n=>`<option value="${esc(n)}">`).join('')}</datalist></div>`;
 const tg=`<optgroup label="Skills">${sk.map(n=>`<option value="sk:${esc(n)}">${esc(n)}</option>`).join('')}</optgroup><optgroup label="Attributes"><option value="all:">All rolls</option>${Object.entries(SW_ATTN).map(([k,v])=>`<option value="at:${k}">${v}</option>`).join('')}<option value="opt:">A skill the player chooses</option></optgroup><optgroup label="Numbers on the sheet">${IT_SPEC.map(([k,v])=>`<option value="sp:${k}">${v}</option>`).join('')}</optgroup>`;
 return `<div class="post" id="itfx" style="padding:8px 12px;margin:8px 0"><b>EFFECTS ON THE SHEET</b> <span class="meta">${def?'Filled in from the catalog. You can change it.':'Optional. Numbers this item changes while it is installed or in use.'}</span>
  ${isA?'':`<label class="dx-chk" style="margin:6px 0"><input type="checkbox" name="on" ${on?'checked':''} style="width:auto"> <span>${x&&x.cat==='Cyberware'?'Installed':'In use'}: count its effects on the sheet</span></label>`}
  ${optBox}
  <label>EFFECT LINES <span class="meta">one per line</span></label><textarea name="fx" style="min-height:64px" placeholder="Hacking +1&#10;Agility die +2&#10;parry +1&#10;Shooting +1 at short range">${esc(text)}</textarea>
  <details style="margin-top:4px"><summary class="meta" style="cursor:pointer">Build a line for me</summary>
   <div class="two" style="margin-top:4px"><div><label>WHAT CHANGES</label><select id="fb_t">${tg}</select></div><div><label>HOW</label><select id="fb_k"><option value="b">Adds a bonus or penalty</option><option value="s">Raises or lowers the die (steps)</option></select></div></div>
   <div class="two"><div><label>AMOUNT <span class="meta">use a minus for a penalty</span></label><input type="number" id="fb_n" value="1" step="1"></div><div><label>ONLY WHEN <span class="meta">optional</span></label><input id="fb_w" placeholder="e.g. at short range" maxlength="80"></div></div>
   <button type="button" class="btn sm" id="fb_a" style="margin-top:4px">+ Add this line</button></details>
  <div class="hint" style="margin:4px 0">Plain lines always count while the item is on. Words after the number ("at short range", "when firing RoF 1") turn it into a tick-box you switch on for that roll.</div>
  <div id="itfe" class="warn" style="display:none"></div>
  ${def&&x&&typeof x.fx==='string'?'<button type="button" class="btn sm" id="itreset">Go back to the catalog effects</button>':''}</div>`}
function itFxBind(x){const f=$('#itfx');if(!f)return;const ta=f.querySelector('[name=fx]'),opt=f.querySelector('#itopt'),sync=()=>{const need=/\$(skill|opt)/i.test(ta.value);if(opt&&!f.querySelector('[name=ito]'))opt.style.display=need?'':'none'};ta.oninput=sync;sync();
 f.querySelector('#fb_a').onclick=()=>{const [kind,val]=f.querySelector('#fb_t').value.split(':'),mode=f.querySelector('#fb_k').value,n=parseInt(f.querySelector('#fb_n').value,10),cond=f.querySelector('#fb_w').value.trim(),er=$('#itfe');er.style.display='none';
  if(!n){er.textContent='Type an amount other than zero.';er.style.display='block';return}
  const sg=(n>0?'+':'-')+Math.abs(n);let t;
  if(mode==='s'){if(kind==='sk')t=val+' die '+sg;else if(kind==='at')t=val+' die '+sg;else if(kind==='opt')t='$skill die '+sg;else{er.textContent='Die steps only work on a skill or an attribute.';er.style.display='block';return}}
  else{if(kind==='sk')t=val+' '+sg;else if(kind==='at')t=SW_ATTN[val]+' rolls '+sg;else if(kind==='all')t='all rolls '+sg;else if(kind==='opt')t='$skill '+sg;else t=val+' '+sg}
  if(cond&&mode!=='s')t+=' '+cond;ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+t;sync()};
 const rs=f.querySelector('#itreset');if(rs)rs.onclick=()=>{const d=itemDef(x);ta.value=d?d.f:'';sync()};
 const chk=[...f.querySelectorAll('[name=ito]')],lim=((x&&itemDef(x)||{}).o||{}).n||1;chk.forEach(c=>c.onchange=()=>{const k=chk.filter(z=>z.checked);if(k.length>lim){c.checked=false}})}
/* reads the editor into d2. Returns true when something is wrong (the message is shown). */
function itFxCollect(x,form,d2){const ta=form.querySelector('[name=fx]');if(!ta)return false;const txt=ta.value.trim(),er=$('#itfe'),pf=fxParse(txt);
 if(pf.bad.length){if(er){er.textContent='I could not read these lines: '+pf.bad.join(' | ')+'. Try something like "Hacking +1", "parry +1", or "Agility die +2".';er.style.display='block'}return true}
 const def=x?itemDef(x):null;if(x){if(def){if(txt!==def.f||typeof x.fx==='string')d2.fx=txt}else if(txt||typeof x.fx==='string')d2.fx=txt}else if(txt)d2.fx=txt;
 const ck=[...form.querySelectorAll('[name=ito]')];d2.opt=ck.length?ck.filter(c=>c.checked).map(c=>c.value).join(', '):((form.querySelector('[name=opt]')||{}).value||'').trim();
 const on=form.querySelector('[name=on]');if(on)d2.on=on.checked;return false}
function swStrTerms(sign){const e=swStepDie(+sh.at.strength.d||4,fxStep(sh,{at:'strength'}).n,true),t=[{t:'d',n:1,s:e.d,sign,label:'Str d'+e.d}];if(e.x)t.push({t:'n',v:sign*e.x});return t}
/* the read-only EDGE box beside every attribute and skill */
function swBadges(){if(!sh)return;const R=$('#sheetroot');if(!R)return;let any=false;
 R.querySelectorAll('[data-fxb]').forEach(b=>{const [t,k,i]=b.dataset.fxb.split(':');let tr=null,base=0,isAt=false;
  if(t==='a'){tr={at:k};base=+sh.at[k].d||4;isAt=true}else{const x=(sh.sk[k]||[])[+i];if(x&&x.n){tr={sk:x.n};base=+x.d||0}}
  const r=tr?fxRoll(sh,tr):{m:0,why:[]},st=tr?fxStep(sh,tr):{n:0,why:[]},txt=[],tip=[];
  if(r.m){txt.push((r.m>0?'+':'−')+Math.abs(r.m));tip.push('Bonus '+(r.m>0?'+':'−')+Math.abs(r.m)+': '+r.why.join(', '))}
  if(st.n){const e=swStepDie(base,st.n,isAt);txt.push((st.n>0?'▲':'▼')+Math.abs(st.n));tip.push('Die '+(base?'d'+base:'unskilled')+' becomes '+swDieTxt(e)+': '+st.why.join(', '))}
  b.textContent=txt.join(' ');const pos=r.m>0||st.n>0,neg=r.m<0||st.n<0;b.className='fxn'+(pos?' up':neg?' dn':'');
  b.title=tip.length?'Automatic from your edges, hindrances and gear. '+tip.join('. ')+'. You cannot type here. Use the box to the right for your own bonus.':'No edge, hindrance or item changes this. Use the box to the right for your own bonus.';if(tip.length)any=true});
 const L=$('#fxleg');if(L)L.textContent=(any||(sh.edgeList||[]).length||(sh.hindList||[]).length)?'Each trait shows: die, then the EDGE box (automatic, from your edges, hindrances and gear that is installed or in use), then your own MOD box. Both are added to the roll. A green arrow up means the die goes up that many steps.':''}

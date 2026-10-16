// ---- play mode: a compact view for use during a scene or fight
const plOn=()=>!!prefs.play;
function plToggle(){prefs.play=!prefs.play;savePrefs();if(sh)shBuild()}
function plApply(){try{vhDraw()}catch(e){}try{snDraw()}catch(e){}try{crDraw()}catch(e){}try{tmDraw()}catch(e){}try{htChip()}catch(e){}try{layApply()}catch(e){}const R=$('#sheetroot');if(!R||!sh)return;const on=plOn();
 const b=$('#shplay');if(b){b.textContent=on?'✎ Edit mode':'▶ Play mode';b.title=on?'Back to the full sheet':'A compact view for use during play: rolls, weapons, powers, wounds and effects'}
 const keep=el=>{if(el.classList.contains('bar')||el.id==='shbar'||el.id==='shdrn'||el.id==='shtm'||el.id==='shveh'||el.id==='plbox')return true;
  const h=el.querySelector&&el.querySelector(':scope>h2'),ht=h?h.textContent:'';
  if(/^(FAVORITE ROLLS|DRONE)/.test(ht))return true;
  if(el.classList.contains('shg')&&el.querySelector('.wtk'))return true;return false};
 [...R.children].forEach(el=>{const hide=on&&!keep(el);if(hide){el.dataset.plh='1';el.style.display='none'}else if(el.dataset.plh){delete el.dataset.plh;el.style.display=''}});
 let box=$('#plbox');
 if(!on){if(box)box.remove();return}
 const sg=m=>+m?(m>0?'+':'')+m:'',sk=[];
 for(const k in sh.sk)(sh.sk[k]||[]).forEach((x,i)=>{if(x.n&&+x.d>0)sk.push({k,i,n:x.n,d:+x.d,m:x.m})});
 const eff=(n)=>{const rg=drRig({sk:n});return rg?' → d'+rg.sides+sg(rg.mod):''};
 let pci=0;const pcc=()=>'plc'+(pci++%4);
 const chips=SH_AT.map(([k,l])=>`<button class="btn sm ${pcc()}" data-plr="a:${k}">${l} d${(sh.at[k]||{}).d||4}${sg((sh.at[k]||{}).m)}</button>`).join(' ')+' '+sk.map(x=>`<button class="btn sm ${pcc()}" data-plr="s:${x.k}:${x.i}" title="${esc(x.n)}">${esc(x.n)} d${x.d}${sg(x.m)}${esc(eff(x.n))}</button>`).join(' ');
 const ro=!shCan()?'disabled':'';
 const wp=(sh.weapons||[]).map((w,i)=>{const am=amOn(w),a=Math.max(0,Math.floor(+w.ammo||0));
  return `<div class="row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:160px"><b>${esc(w.n||'Weapon')}</b> <span class="meta">${esc(w.dmg||'')}${w.rng?' · '+esc(w.rng):''}${w.rof?' · RoF '+esc(w.rof):''}${w.ap?' · AP '+esc(w.ap):''}</span>${am?` <b style="color:${a<=0?'var(--mg)':a<=Math.ceil(+w.mag/4)?'var(--am)':'var(--tx)'}">${a}/${+w.mag}</b>`:''}</span><button class="btn sm" data-plw="a:${i}" ${ro}>Attack</button><button class="btn sm" data-plw="d:${i}" ${ro}>Damage</button>${shSpecOpts(w).length?`<button class="btn sm" data-plw="s:${i}" ${ro}>Special</button>`:''}${am?`<button class="btn sm" data-plw="r:${i}" ${ro}>Reload</button>`:''}</div>`}).join('');
 const pw=(sh.powers||[]).map((w,i)=>`<div class="row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:160px"><b>${esc(w.n||'Power')}</b> <span class="meta">${w.cost?esc(w.cost)+' PP · ':''}${esc(w.rng||'')}${w.dur?' · '+esc(w.dur):''}</span>${w.effect?`<div class="meta">${esc(w.effect)}</div>`:''}</span><button class="btn sm" data-plw="c:${i}" ${ro}>Cast</button></div>`).join('');
 const ed=(sh.edgeList||[]).map(e=>esc(e.n)+(e.opt?' ('+esc(e.opt)+')':'')).join(', '),hd=(sh.hindList||[]).map(e=>esc(e.n)+(e.opt?' ('+esc(e.opt)+')':'')).join(', ');
 const html=`<div class="shsec" style="margin-bottom:12px"><h2>ROLL <span class="meta">tap to roll</span></h2><div style="display:flex;flex-wrap:wrap;gap:5px">${chips}</div></div>
 ${wp?`<div class="shsec" style="margin-bottom:12px"><h2>WEAPONS</h2>${wp}</div>`:''}${pw?`<div class="shsec" style="margin-bottom:12px"><h2>POWERS <span class="meta">${(+sh.ppTotal||0)?(Math.max(0,(+sh.ppTotal||0)-(+sh.ppUsed||0)))+' of '+(+sh.ppTotal||0)+' Power Points left':''}</span></h2>${pw}</div>`:''}
 ${ed||hd?`<details class="shsec" style="margin-bottom:12px"><summary style="cursor:pointer;color:var(--cy)">EDGES AND HINDRANCES</summary>${ed?`<div><b>Edges:</b> ${ed}</div>`:''}${hd?`<div><b>Hindrances:</b> ${hd}</div>`:''}</details>`:''}`;
 if(!box){box=document.createElement('div');box.id='plbox';const ref=$('#shbar');ref.insertAdjacentElement('afterend',box)}
 if(box.dataset.sig!==html){box.dataset.sig=html;box.innerHTML=html}}
document.addEventListener('click',e=>{if(!sh)return;const t=e.target.closest&&e.target.closest('#shplay,[data-plr],[data-plw]');if(!t)return;
 if(t.id==='shplay')return plToggle();
 if(t.dataset.plr){const [ty,k,i]=t.dataset.plr.split(':');return ty==='a'?shRollAttr(k):shRollSkill(k,+i)}
 const [ty,i]=t.dataset.plw.split(':'),n=+i;if(ty==='a')shAttack(n);else if(ty==='d')shRollDmg(n);else if(ty==='s')shSpecModal(n);else if(ty==='r')amReload(n);else if(ty==='c')shPowerCast(n)});

{const st=document.createElement('style');st.textContent=`.btn.plc1{color:var(--am);border-color:var(--am)}.btn.plc1:hover{background:var(--am);color:var(--bg);box-shadow:0 0 10px var(--am)}.btn.plc2{color:var(--mg);border-color:var(--mg)}.btn.plc2:hover{background:var(--mg);color:var(--bg);box-shadow:0 0 10px var(--mg)}.btn.plc3{color:#9d8cff;border-color:#9d8cff}.btn.plc3:hover{background:#9d8cff;color:var(--bg);box-shadow:0 0 10px #9d8cff}`;document.head.appendChild(st)}

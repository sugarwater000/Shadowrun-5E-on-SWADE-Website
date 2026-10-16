// ---- ammo and reloading
const AM_SHOTS={1:1,2:5,3:10,4:20,5:40,6:50};
const amShots=n=>n>=6?50:(AM_SHOTS[Math.max(1,Math.floor(+n||1))]||1);
const amOn=w=>!!w&&(w.sk||'Shooting')!=='Fighting'&&(+w.mag||0)>0;
const amSpare=w=>{const s=String(w&&w.spare!=null?w.spare:'').trim();return s===''?null:Math.max(0,Math.floor(+s)||0)};
// uses n rounds from weapon i. Returns false when the weapon is empty (and says so).
function amUse(i,n){const w=sh&&sh.weapons&&sh.weapons[i];if(!amOn(w))return true;const a=Math.max(0,Math.floor(+w.ammo||0));
 if(a<=0){alert((w.n||'This weapon')+' is empty. Press Reload first.');return false}
 shSet('weapons.'+i+'.ammo',a-Math.min(n,a));amDraw();return true}
function amReload(i){if(!shCan())return;const w=sh.weapons[i];if(!amOn(w))return alert('Enter the magazine size first.');
 const cur=Math.max(0,Math.floor(+w.ammo||0)),sp=amSpare(w);if(cur>=+w.mag)return;
 if(sp!==null&&sp<=0)return alert('No spare magazines left for '+(w.n||'this weapon')+'.');
 shSet('weapons.'+i+'.ammo',+w.mag);if(sp!==null)shSet('weapons.'+i+'.spare',sp-1);amDraw();
 undoBar('Reloaded '+(w.n||'weapon')+'.'+(sp!==null?' '+(sp-1)+' spare magazine'+(sp-1===1?'':'s')+' left.':''),()=>{shSet('weapons.'+i+'.ammo',cur);if(sp!==null)shSet('weapons.'+i+'.spare',sp);amDraw()})}
function amRow(w,i,d){if((w.sk||'Shooting')==='Fighting')return '';const on=amOn(w),a=Math.max(0,Math.floor(+w.ammo||0)),empty=on&&a<=0,low=on&&a>0&&a<=Math.ceil(+w.mag/4);
 return `<tr class="amrow"><td colspan="8" style="padding-top:0"><span class="meta" style="margin-right:4px">AMMO</span><input data-sp="weapons.${i}.ammo" data-ty="n" type="number" min="0" value="${a}" ${d} style="width:54px;${empty?'color:var(--mg);border-color:var(--mg)':low?'color:var(--am)':''}" title="Rounds left in the weapon"> / <input data-sp="weapons.${i}.mag" data-ty="n" type="number" min="0" value="${+w.mag||0}" ${d} style="width:54px" title="Magazine size. Leave at 0 to not track ammo for this weapon."> <span class="meta" style="margin:0 4px 0 8px">SPARE MAGS</span><input data-sp="weapons.${i}.spare" value="${esc(w.spare==null?'':w.spare)}" ${d} placeholder="∞" style="width:48px" title="Spare magazines. Leave empty for unlimited."> <button class="btn sm" data-wrl="${i}" ${d} ${on?'':'disabled'}>Reload</button> <span class="meta" data-amst="${i}">${on?(empty?'<b style="color:var(--mg)">EMPTY</b>':low?'<b style="color:var(--am)">low</b>':''):'Enter a magazine size to track shots.'}</span></td></tr>`}
// refresh the ammo boxes in place after a shot or reload
function amDraw(){const R=$('#sheetroot');if(!R||!sh)return;(sh.weapons||[]).forEach((w,i)=>{['ammo','spare'].forEach(k=>{const e=R.querySelector('[data-sp="weapons.'+i+'.'+k+'"]');if(e&&document.activeElement!==e)e.value=w[k]==null?(k==='ammo'?0:''):w[k]});
 const a=Math.max(0,Math.floor(+w.ammo||0)),on=amOn(w),e=R.querySelector('[data-sp="weapons.'+i+'.ammo"]');if(e){e.style.color=on&&a<=0?'var(--mg)':on&&a<=Math.ceil(+w.mag/4)?'var(--am)':'';e.style.borderColor=on&&a<=0?'var(--mg)':''}
 const rb=R.querySelector('[data-wrl="'+i+'"]');if(rb)rb.disabled=!on||!shCan();
 const s=R.querySelector('[data-amst="'+i+'"]');if(s)s.innerHTML=!on?'Enter a magazine size to track shots.':a<=0?'<b style="color:var(--mg)">EMPTY</b>':a<=Math.ceil(+w.mag/4)?'<b style="color:var(--am)">low</b>':''})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wrl]');if(b&&sh&&$('#sheetroot')&&$('#sheetroot').contains(b))amReload(+b.dataset.wrl)});
// typing a magazine size on a fresh weapon loads it
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||!/^weapons\.\d+\.mag$/.test(t.dataset.sp||'')||!sh)return;const i=+t.dataset.sp.split('.')[1],w=sh.weapons[i];if(!w)return;
 setTimeout(()=>{const m=+w.mag||0;if(m>0&&(w.ammo==null||(+w.ammo||0)===0||+w.ammo>m))shSet('weapons.'+i+'.ammo',m);amDraw();const s=$('#sheetroot').querySelector('[data-amst="'+i+'"]');},50)});

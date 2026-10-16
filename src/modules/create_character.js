const CR_ON=false; // switched off for now: set to true and re-add the header button to bring it back
// ---- Character creation helper: point budgets (5 attribute, 15 skill, up to 4 from hindrances)
const crStep=d=>{d=+d||0;if(d<4)return 0;return d>12?4+(d-12):(d-4)/2};
const crDie=s=>s<=4?SW_DIES[Math.max(0,s)]:12+(s-4);   // die after s steps above d4
const crCfg=()=>({a:5,s:15,h:4,e:0,...(sh&&sh.cr||{})});
function crCalc(){const cfg=crCfg(),out={cfg,att:[],sk:[],warn:[],aS:0,sS:0,hv:0,hp:0};if(!sh)return out;
 SH_AT.forEach(([k,lab])=>{const d=+(sh.at[k]||{}).d||4,c=crStep(d);out.aS+=c;out.att.push({k,lab,d,c})});
 for(const k in sh.sk){const ad=+(sh.at[k]||{}).d||4,al=(SH_AT.find(a=>a[0]===k)||[k,k])[1];
  (sh.sk[k]||[]).forEach(x=>{const d=+x.d||0;if(!d||!x.n)return;const n=crStep(d)+1;let c=0,dbl=0;for(let s=(x.core?2:1);s<=n;s++){const die=crDie(s-1);if(die<=ad)c+=1;else{c+=2;dbl++}}
   out.sS+=c;out.sk.push({n:x.n,d,c,dbl,ad,al});
   if(d>12)out.warn.push(x.n+' is above d12 ('+d+'). Only Edges and special rules take a skill past d12.');
   else if(dbl)out.warn.push(x.n+' d'+d+' is above '+al+' d'+ad+': the last '+dbl+' step'+(dbl>1?'s':'')+' cost 2 points each.')})}
 SH_AT.forEach(([k,lab])=>{const d=+(sh.at[k]||{}).d||4;if(d>12)out.warn.push(lab+' is above d12.')});
 (sh.hindList||[]).forEach(h=>{out.hv+=h.sev==='M'?2:1});out.hp=Math.min(cfg.h,out.hv);
 const aOver=Math.max(0,out.aS-cfg.a),sOver=Math.max(0,out.sS-cfg.s);
 out.aOver=aOver;out.sOver=sOver;out.need=aOver*2+sOver+(+cfg.e||0)*2;out.left={a:cfg.a-out.aS,s:cfg.s-out.sS,h:out.hp-out.need};
 if(out.hv>cfg.h)out.warn.push('Your hindrances are worth '+out.hv+' points but only '+cfg.h+' can be spent.');
 if(out.left.h<0)out.warn.push('You are '+(-out.left.h)+' hindrance point'+(out.left.h<-1?'s':'')+' short: reduce an attribute, skill or edge, or add a hindrance.');
 const maj=(sh.hindList||[]).filter(h=>h.sev==='M').length;if(maj>1)out.warn.push('You have '+maj+' Major hindrances. The usual limit is one Major and two Minor.');
 if((sh.hindList||[]).length>3)out.warn.push('You have '+(sh.hindList||[]).length+' hindrances. The usual limit is one Major and two Minor.');
 return out}
function crDraw(){const R=$('#sheetroot');if(!R||!sh)return;let el=$('#shcr');const on=CR_ON&&!!(prefs&&prefs.crOn)&&!sh.drone;
 if(!on){if(el)el.remove();const b=$('#shcrb');if(b)b.textContent='🧮 Build points';return}
 const b=$('#shcrb');if(b)b.textContent='🧮 Hide build points';
 if(!el){const ref=$('#fxleg');if(!ref||!ref.parentNode)return;el=document.createElement('div');el.id='shcr';el.className='shsec';el.style.marginBottom='12px';ref.parentNode.insertBefore(el,ref)}
 const c=crCalc(),cfg=c.cfg,can=shCan(),tone=n=>n<0?'color:var(--mg)':n===0?'color:var(--cy)':'color:var(--am)';
 const sig=JSON.stringify([c.aS,c.sS,c.hv,c.need,cfg,c.warn,can]);if(el.dataset.sig===sig)return;el.dataset.sig=sig;
 const inp=(f,v,mx)=>`<input type="number" data-crf="${f}" value="${v}" min="0" max="${mx}" style="width:54px" ${can?'':'disabled'}>`;
 el.innerHTML=`<h2>🧮 BUILD POINTS</h2><div class="hint" style="margin-bottom:8px">A helper for building a new character. It counts what you have spent so far and warns about illegal picks. It changes nothing on your sheet. Core skills start at d4 for free. Each die step costs 1 point, or 2 points when the skill goes above its linked attribute. Two hindrance points raise an attribute one step, one raises a skill one step, and two buy an Edge.</div>
 <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:8px">
 <div><div class="meta">ATTRIBUTES (BUDGET ${inp('a',cfg.a,20)})</div><b style="font-size:1.2em">${c.aS} / ${cfg.a}</b> <span style="${tone(c.left.a)}">${c.left.a>=0?c.left.a+' left':(-c.left.a)+' over'}</span></div>
 <div><div class="meta">SKILLS (BUDGET ${inp('s',cfg.s,60)})</div><b style="font-size:1.2em">${c.sS} / ${cfg.s}</b> <span style="${tone(c.left.s)}">${c.left.s>=0?c.left.s+' left':(-c.left.s)+' over'}</span></div>
 <div><div class="meta">HINDRANCE POINTS (MAX ${inp('h',cfg.h,10)})</div><b style="font-size:1.2em">${c.need} / ${c.hp}</b> <span class="meta">${c.hv} offered by your hindrances</span> <span style="${tone(c.left.h)}">${c.left.h>=0?c.left.h+' unspent':(-c.left.h)+' short'}</span></div>
 <div><div class="meta">EDGES BOUGHT WITH POINTS</div>${inp('e',+cfg.e||0,10)}</div></div>
 ${c.warn.length?`<div style="border:1px solid var(--am);padding:6px 10px"><b style="color:var(--am)">⚠ CHECK THESE</b>${c.warn.map(w=>`<div class="meta">• ${esc(w)}</div>`).join('')}</div>`:'<div class="meta" style="color:var(--cy)">✔ NOTHING ILLEGAL SPOTTED.</div>'}
 <details style="margin-top:6px"><summary class="meta" style="cursor:pointer">How the points were counted</summary><div class="meta">Attributes: ${c.att.map(a=>esc(a.lab)+' d'+a.d+' = '+a.c).join(' · ')}<br>Skills: ${c.sk.length?c.sk.map(s=>esc(s.n)+' d'+s.d+' = '+s.c+(s.dbl?'*':'')).join(' · '):'none yet'}<br>* costs extra because it is above its attribute. Extra attribute points cost 2 hindrance points each, extra skill points cost 1 each.</div></details>`;
 el.querySelectorAll('[data-crf]').forEach(i=>i.onchange=()=>{const f=i.dataset.crf,v=Math.max(0,Math.min(+i.max,Math.round(+i.value)||0));sh.cr={...crCfg(),[f]:v};shDirty.add('cr');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);el.dataset.sig='';crDraw()})}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#shcrb');if(!t||!sh)return;prefs.crOn=!prefs.crOn;try{savePrefs()}catch(x){}crDraw()});

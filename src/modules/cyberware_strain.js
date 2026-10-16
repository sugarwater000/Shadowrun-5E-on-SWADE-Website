// ---- Cyberware / Strain panel
function snRows(items){return items.filter(x=>x.cat==='Cyberware'&&x.grade).map(x=>{const q=x.qty||1,b=+x.base||0;let n=0;
 if(x.grade==='G')n=+x.strain||0;else n=b;return{name:x.name,q,g:x.grade,n}})}
function snCalc(){if(!sh||sh.drone)return null;const it=invOf(sh.handle||sh.name);if(!it.some(x=>x.cat==='Cyberware'&&x.grade))return null;
 const rows=snRows(it),raw=rows.reduce((a,r)=>a+r.n*r.q,0),tot0=strainOf(it),adj=Math.max(-20,Math.min(20,Math.round(+sh.strainAdj||0))),tot=Math.max(0,tot0+adj),
  vs=(+sh.at.vigor.d||4),sp=(+sh.at.spirit.d||4);
 return{rows,raw,tot0,adj,tot,vs,sp,grade:tot0-raw}}
function snMeter(label,val,lim,sub){const mx=lim*2,pct=Math.min(100,Math.round(100*val/mx)),tk=50,col=val>mx?'var(--mg)':val>lim?'var(--am)':'var(--cy)';
 return `<div style="min-width:240px;flex:1"><div class="meta">${label} <b style="color:${col}">${val} / ${lim}</b> <span style="opacity:.7">(MAX ${mx})</span></div><div style="position:relative;height:12px;border:1px solid var(--line);margin:3px 0"><div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:${col}"></div><div style="position:absolute;left:${tk}%;top:-2px;bottom:-2px;width:1px;background:var(--tx)"></div></div><div class="meta">${sub}</div></div>`}
function snDraw(){const R=$('#sheetroot');if(!R||!sh)return;let el=$('#shsn');const c=snCalc();
 if(!c){if(el)el.remove();return}
 if(!el){const ref=$('#fxleg');if(!ref||!ref.parentNode)return;el=document.createElement('div');el.id='shsn';el.className='shsec';el.style.marginBottom='12px';ref.parentNode.insertBefore(el,ref)}
 const can=shCan(),sig=JSON.stringify([c,can]);if(el.dataset.sig===sig)return;el.dataset.sig=sig;
 const phys=c.tot>c.vs*2?'<b class="dx-bad">Over the physical maximum!</b>':c.tot>c.vs?'<b style="color:var(--am)">Over Vigor: −2 Reaction with most people.</b>':'Within Vigor: no problems.';
 const ment=c.tot>c.sp*2?'<b class="dx-bad">Over the mental maximum!</b>':c.tot>c.sp?'<b style="color:var(--am)">Over Spirit: risk of cyberpsychosis.</b>':'Within Spirit: steady.';
 el.innerHTML=`<h2>🦾 CYBERWARE &amp; STRAIN</h2><div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:6px">${snMeter('PHYSICAL (VIGOR d'+c.vs+')',c.tot,c.vs,phys)}${snMeter('MENTAL (SPIRIT d'+c.sp+')',c.tot,c.sp,ment)}</div>
 <details><summary class="meta" style="cursor:pointer">Implants (${c.rows.length}) · total Strain ${c.tot}</summary><div style="margin-top:4px">${c.rows.map(r=>`<div class="meta">${r.q>1?r.q+'× ':''}${esc(r.name)} · ${esc(({G:'Used',S:'Standard',C:'Custom',M:'Military'})[r.g]||r.g)} · ${r.n} Strain${r.q>1?' each':''}</div>`).join('')}
 <div class="meta" style="margin-top:4px">Add up as listed: ${c.raw}${c.grade?' · grade adjustments (Custom / Military): '+(c.grade>0?'+':'')+c.grade:''}${c.adj?' · your adjustment: '+(c.adj>0?'+':'')+c.adj:''} = <b>${c.tot}</b></div></div></details>
 <div style="margin-top:6px" class="meta">ADJUSTMENT <input type="number" id="snadj" min="-20" max="20" value="${c.adj}" style="width:60px" ${can?'':'disabled'} title="Add or remove Strain for things the gear list does not cover, such as bioware, a house rule or a temporary effect."> <span style="opacity:.7">for bioware, house rules or temporary effects. Does not change your gear.</span></div>`;
 const a=el.querySelector('#snadj');if(a)a.onchange=()=>{sh.strainAdj=Math.max(-20,Math.min(20,Math.round(+a.value)||0));shDirty.add('strainAdj');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);el.dataset.sig='';snDraw();try{shBuild()}catch(e){}}}

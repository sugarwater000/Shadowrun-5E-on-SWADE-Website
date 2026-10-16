// ---- Extra-dice and special attacks: Frenzy, Sweep, Two-Fisted, Two-Gun Kid, Rapid Fire, autofire
let shSpecS={tn:'',xm:0};
const spNum=s=>{const m=String(s==null?'':s).match(/\d+/);return m?+m[0]:0};
function shPrep(sides,mod,title,unsk,atk,tr,xs){let stx=0,stw=[];const rg=drRig(tr);{const dx=drXs(tr);if(dx.length)xs=(xs||[]).concat(dx)}{const tx=tmXs();if(tx.length)xs=(xs||[]).concat(tx)}if(rg){sides=rg.sides;mod=rg.mod;unsk=rg.unsk}if(tr){const st=fxStep(sh,tr);if(st.n){const e=swStepDie(unsk?0:sides,st.n,!!tr.at);sides=e.d;stx=e.x;unsk=e.unsk;stw=st.why.concat(e.x?['beyond d12: +'+e.x]:[])}}
 const o=shOpt,cn=shCnd(atk),fm=fxRoll(sh,tr),co=coRoll(atk,tr),X=(xs||[]).filter(x=>x[1]),xv=X.reduce((a,x)=>a+x[1],0),wp=o.pen?shPen():0,
 cap=coCap(tr,atk,{sit:Math.max(0,-(+o.mod||0)),oth:wp+Math.max(0,-cn.m)+co.neg}),
 m=(+mod||0)+stx+(+o.mod||0)-wp-(unsk?2:0)+cn.m+fm.m+xv+co.m+cap.m,
 why=(rg?['Rigger '+rg.lab]:[]).concat(cn.why,fm.why,stw,co.why,X.map(x=>x[0]+' '+(x[1]>0?'+':'−')+Math.abs(x[1])),cap.why);
 return{sides,m,unsk,ws:swWild(tr),wild:!!shOpt.wild&&drWild(tr),title:title+(unsk?' (unskilled)':'')+(why.length?' ['+why.join(', ')+']':'')}}
function shRoll(sides,mod,title,unsk,atk,tr,xs,meta){if(!shCan())return;const p=shPrep(sides,mod,title,unsk,atk,tr,xs),o={title:p.title,sides:p.sides,mod:p.m,tn:+shOpt.tn||4,wild:p.wild,ws:p.ws||6},res=shRes(o);
 res.score=res.fin;res.rs=res.ok?Math.floor((res.fin-o.tn)/4):0;res.crit=/Critical/.test(res.line);res.rr={k:'s',o,t0:title,sk:tr&&tr.sk,pw:meta&&meta.pw,soak:meta&&meta.soak};
 if(atk)coAtkDone(res);shAfterRoll(res,null);shShow(res,res.plain,title);return res}
// n trait dice plus one Wild Die. The Wild Die replaces the lowest trait die if it is higher.
// Every trait die is its own attack and is compared with its own target number.
// sweep: one die, and the single result is compared with every target number.
function shMultiRes(o,p){const n=o.sweep?1:Math.max(1,Math.min(12,(o.n|0)||1)),tns=o.tns&&o.tns.length?o.tns:[+shOpt.tn||4];
 const td=[];for(let i=0;i<n;i++)td.push(dxDie(p.sides,true));
 const wd=p.wild?dxDie(p.ws||6,true):null;let wi=-1;
 if(wd){let lo=0;td.forEach((d,i)=>{if(d.total<td[lo].total)lo=i});if(wd.total>td[lo].total)wi=lo}
 const base=td.map((d,i)=>i===wi?wd.total:d.total),ones=td.filter(d=>d.raw===1).length+(wd&&wd.raw===1?1:0),crit=!!wd&&ones*2>n+1;
 const tgt=o.sweep?tns:base.map((_,i)=>tns[Math.min(i,tns.length-1)]),items=tgt.map((tn,i)=>{const fin=base[o.sweep?0:i]+p.m,ok=!crit&&fin>=tn,rs=ok?Math.floor((fin-tn)/4):0;return{fin,tn,ok,rs}});
 const lab=x=>x.ok?(x.rs?`Success with ${x.rs} Raise${x.rs>1?'s':''} ${'⬆️'.repeat(x.rs)}`:'Success 🎯'):'Failure ❌',
 many=items.length>1,hits=items.filter(x=>x.ok).length,sg=p.m?(p.m>0?'+'+p.m:''+p.m):'';
 const line=crit?'Critical Failure! ⚠️':items.map((x,i)=>many?`${o.sweep?'Target':'Die'} ${i+1} (TN ${x.tn}): ${lab(x)}`:lab(x)).join(' · ');
 const diceTxt=td.map(d=>dxB(d)).join(', '),diceF=td.map((d,i)=>i===wi?'~~'+dxF(d)+'~~':dxF(d)).join(', ');
 return{items,fin:items.map(x=>x.fin).join(' / '),line,cls:crit?'dx-bad':hits?'dx-ok':'dx-bad',ok:hits>0,crit,rs:Math.max(0,...items.map(x=>x.rs)),score:crit?-1:items.reduce((a,x)=>a+x.fin,0),title:p.title,sg,
  detail:`Trait d${p.sides}${n>1?' ×'+n:''}: ${diceTxt}${wd?' | Wild d'+(p.ws||6)+': '+dxB(wd)+(wi>=0?' (replaces die '+(wi+1)+')':' (dropped)'):''}`,
  plain:`🎲 **${p.title}** (d${p.sides}${n>1?'×'+n:''}${wd?'+Wild d'+(p.ws||6):''}${sg}) — Trait: ${diceF}${wd?' | Wild: '+dxF(wd)+(wi>=0?' (replaces die '+(wi+1)+')':''):''} → **${items.map(x=>x.fin).join(' / ')}** vs TN ${items.map(x=>x.tn).join(' / ')} — ${line}`}}
function shRollMulti(o){if(!shCan())return;const p=shPrep(o.sides,o.mod,o.title,o.unsk,o.atk,o.tr,o.xs),res=shMultiRes(o,p);res.rr={k:'m',o,p,t0:o.title};if(o.atk)coAtkDone(res);shShow(res,res.plain,o.title);return res}
function shSkOf(w){const nm=w.sk||'Shooting';let f=null;for(const k in sh.sk)sh.sk[k].forEach(x=>{if(x.n===nm)f=x});if(!f&&drRigOn())f={n:nm,d:0,m:0};if(!f)alert('This sheet has no "'+nm+'" skill.');return f}
function shSpecOpts(w){const sk=w.sk||'Shooting',has=k=>swHasEdge(sh,k),L=[],rof=spNum(w.rof);
 if(sk==='Fighting'){
  if(has('frenzy')||has('improved_frenzy')){const im=has('improved_frenzy');L.push({id:'frenzy',t:im?'Improved Frenzy':'Frenzy',d:'Roll two Fighting dice with this attack. The Wild Die can replace either one. Each die is its own attack and can go at a different target. '+(im?'You can do this with up to two attacks each turn.':'You can do this with one attack each turn.')})}
  if(has('sweep')||has('improved_sweep')){const im=has('improved_sweep');L.push({id:'sweep',t:im?'Improved Sweep':'Sweep',d:'One Fighting roll against every target in your Reach, friends included, '+(im?'with no penalty.':'at −2.')+' Put each target\'s Parry in the target numbers box to see who is hit. Roll damage separately for each target you hit.'})}
  if(has('two_fisted')){const am=has('ambidextrous');L.push({id:'two',t:'Two-Fisted',d:'Attack with this weapon, then with an off-hand melee weapon. No Multi-Action penalty. '+(am?'Ambidextrous: no off-hand penalty.':'The off-hand attack is at −2.'),pick:1})}
 }
 if(sk==='Shooting'){
  if(rof>1)L.push({id:'rof0',t:'Autofire (ROF '+rof+')',d:'Roll '+rof+' Shooting dice, one Wild Die. The Wild Die can replace any one of them. Each die is its own shot. Uses up ammo too if you track it on the weapon (ROF 2 = 5 rounds, 3 = 10, 4 = 20, 5 = 40, 6 = 50).',rof:rof,rec:has('rock_and_roll')?0:-2,rnr:has('rock_and_roll')});
  if(has('rapid_fire')||has('improved_rapid_fire')){const im=has('improved_rapid_fire'),r=Math.max(1,rof)+1;L.push({id:'rof1',t:im?'Improved Rapid Fire':'Rapid Fire',d:'Raise the weapon\'s Rate of Fire by 1 for this attack: '+r+' Shooting dice. '+(im?'You can do this twice in one turn as a Multi-Action. Set the actions box next to Combat options (2 actions is −2).':'Recoil applies at ROF 2 or more.'),rof:r,rec:has('rock_and_roll')?0:-2,rnr:has('rock_and_roll')})}
  if(has('two_gun_kid')){const am=has('ambidextrous');L.push({id:'two',t:'Two-Gun Kid',d:'Shoot this weapon, then an off-hand ranged weapon. No Multi-Action penalty. '+(am?'Ambidextrous: no off-hand penalty.':'The off-hand shot is at −2.'),pick:1})}
 }
 return L}
const shSpecBtn=(w,i,ro)=>shSpecOpts(w).length?`<button class="btn sm" data-wsp="${i}" ${ro?'disabled':''} title="Extra dice and special attacks from your edges (Frenzy, Sweep, Two-Fisted, Rapid Fire...)">Special</button> `:'';
function shSpecModal(i){const w=sh.weapons[i];if(!w||!shCan())return;const L=shSpecOpts(w);if(!L.length)return;
 const others=sh.weapons.map((x,j)=>({x,j})).filter(o=>o.j!==i&&(o.x.sk||'Shooting')===(w.sk||'Shooting'));
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>SPECIAL ATTACK: ${esc(w.n||'Weapon')}</h2><div class="hint">Rolled with your sheet bonuses (edges, gear, wounds, conditions, the actions box and the Situational Modifier), the same as the Attack button. Leave the target numbers empty to use the Target # on your sheet.</div>
 <div class="two"><div><label>TARGET NUMBERS (OPTIONAL)</label><input id="sptn" placeholder="e.g. 5, 6" value="${esc(shSpecS.tn)}"></div><div><label>EXTRA MODIFIER</label><input id="spxm" type="number" value="${+shSpecS.xm||0}"></div></div>
 ${L.map(o=>`<div class="shsec" style="margin-top:10px"><b style="color:var(--am)">${esc(o.t)}</b><div class="meta" style="margin:3px 0 6px">${esc(o.d)}</div>
 ${o.rof?`<div class="two"><div><label>RATE OF FIRE (DICE)</label><input id="sprof-${o.id}" type="number" min="1" max="12" value="${o.rof}"></div><div><label>RECOIL${o.rnr?' (ROCK AND ROLL: IGNORED IF YOU DID NOT MOVE)':''}</label><input id="sprec-${o.id}" type="number" max="0" value="${o.rec}"></div></div>`:''}
 ${o.pick?(others.length?`<label>OFF-HAND WEAPON</label><select id="spoh">${others.map(z=>`<option value="${z.j}">${esc(z.x.n||'Weapon')}</option>`).join('')}</select>`:'<div class="meta" style="color:var(--mg)">Add a second '+((w.sk||'Shooting')==='Fighting'?'melee':'ranged')+' weapon to the Weapons list first.</div>'):''}
 <button class="btn grn sm" data-spo="${o.id}" style="margin-top:6px" ${o.pick&&!others.length?'disabled':''}>Roll</button></div>`).join('')}
 <div style="margin-top:12px"><button class="btn mg" id="spcx">Close</button></div></div></div>`;
 $('#spcx').onclick=()=>{$('#modal').innerHTML=''};
 $('#modal').querySelectorAll('[data-spo]').forEach(b=>b.onclick=()=>shSpecGo(i,b.dataset.spo))}
function shSpecGo(i,id){const w=sh.weapons[i],f=w&&shSkOf(w);if(!f)return;
 const tnv=($('#sptn')||{}).value||'',tns=tnv.split(/[,\s/]+/).map(Number).filter(v=>v>0),xm=+(($('#spxm')||{}).value)||0,has=k=>swHasEdge(sh,k),nm=w.n||'Weapon',sk=f.n;
 shSpecS={tn:tnv,xm};const oh=$('#spoh')?sh.weapons[+$('#spoh').value]:null,gv=k=>{const e=$('#'+k+'-'+id);return e?+e.value:0},rofV=gv('sprof'),recV=gv('sprec');
 $('#modal').innerHTML='';
 const X0=xm?[['Extra',xm]]:[],B={sides:+f.d||4,mod:f.m,unsk:!+f.d,atk:true,tr:{sk:f.n},tns,xs:X0.concat(shWXs(w))};
 if(id==='frenzy')return shRollMulti({...B,n:2,title:nm+' '+(has('improved_frenzy')?'Improved Frenzy':'Frenzy')+' attack ('+sk+', 2 dice)'});
 if(id==='sweep')return shRollMulti({...B,sweep:true,xs:B.xs.concat(has('improved_sweep')?[]:[['Sweep',-2]]),title:nm+' '+(has('improved_sweep')?'Improved Sweep':'Sweep')+' ('+sk+', all in Reach)'});
 if(id==='rof0'||id==='rof1'){const n=Math.max(1,rofV),rec=Math.min(0,recV);if(!amUse(i,amShots(n)))return;return shRollMulti({...B,n,xs:B.xs.concat(rec?[['Recoil',rec]]:[]),title:nm+' '+(id==='rof1'?'Rapid Fire':'Autofire')+' ROF '+n+' ('+sk+')'})}
 if(id==='two'&&oh){const f2=shSkOf(oh);if(!f2)return;if(!amUse(i,1)||!amUse(sh.weapons.indexOf(oh),1))return;const am=has('ambidextrous'),t1=tns.length?[tns[0]]:[],t2=tns.length?[tns[1]!=null?tns[1]:tns[0]]:[];
  shRollMulti({...B,n:1,tns:t1,title:nm+' attack, main hand ('+sk+')'});
  shRollMulti({sides:+f2.d||4,mod:f2.m,unsk:!+f2.d,atk:true,tr:{sk:f2.n},n:1,tns:t2,xs:X0.concat(am?[]:[['Off-hand',-2]],shWXs(oh)),title:(oh.n||'Weapon')+' attack, off hand ('+f2.n+')'})}}

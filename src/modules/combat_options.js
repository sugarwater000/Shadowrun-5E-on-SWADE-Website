// ---- Combat options (stances, penalty edges, damage add-ons), Benny rerolls, Soak, Power Point helpers
const coTog=new Set(),coS={tt:'',ta:'',ma:0,sid:null};
const coSave={};
function coChk(){if(coS.sid!==shId){if(coS.sid!=null)coSave[coS.sid]={tog:[...coTog],tt:coS.tt,ta:coS.ta,ma:coS.ma};coTog.clear();const v=coSave[shId];coS.tt=v?v.tt:'';coS.ta=v?v.ta:'';coS.ma=v?v.ma||0:0;if(v)v.tog.forEach(x=>coTog.add(x));coS.sid=shId}}
const coHas=k=>!!sh&&swHasEdge(sh,k);
const CO_ST=[
 ['wild','Wild Attack','+2 to your Fighting attack and damage. You are Vulnerable until your next turn.'],
 ['defend','Defend','+2 Parry until your next turn.'],
 ['aim','Aim','+2 to a Shooting or throwing attack if you did not move.'],
 ['run','Ran this turn','−2 to trait rolls (−1 with Steady Hands).'],
 ['joker','Joker drawn','+2 to all trait rolls and damage.'],
 ['off','Off-hand weapon','−2 to the attack. Ambidextrous ignores it.'],
 ['unst','Unstable platform','−2 to Shooting and throwing. Steady Hands ignores it.'],
 ['imp','Improvised weapon','−1 to the attack and Parry. Improvisational Fighter ignores it.']];
function coRoll(atk,tr){const out={m:0,why:[],neg:0};if(!sh)return out;coChk();
 const sk=tr&&tr.sk,at=!!atk,shoot=sk==='Shooting'||sk==='Athletics',add=(v,l)=>{out.m+=v;out.why.push(l+' '+(v>0?'+':'−')+Math.abs(v));if(v<0)out.neg+=-v};
 if(coTog.has('wild')&&at&&sk==='Fighting')add(2,'Wild Attack');
 if(coTog.has('aim')&&at&&shoot)add(2,'Aim');
 if(coTog.has('joker'))add(2,'Joker');
 if(coTog.has('run'))add(coHas('steady_hands')?-1:-2,'Running');
 if(coS.ma>0&&(tr||at)&&!(tr&&tr.free))add(-2*coS.ma,'Multi-action');
 if(coTog.has('off')&&at&&!coHas('ambidextrous'))add(-2,'Off-hand');
 if(coTog.has('unst')&&at&&shoot&&!coHas('steady_hands'))add(-2,'Unstable platform');
 if(coTog.has('imp')&&at&&sk==='Fighting'&&!coHas('improvisational_fighter'))add(-1,'Improvised weapon');
 if(!sh.msOff&&tr&&(tr.at==='agility'||(tr.sk&&(sh.sk.agility||[]).some(x=>x.n===tr.sk)))){const ar=msArmor();if(ar.n)add(-ar.n,'Armor Min Str d'+ar.min)}
 return out}
// edges that let you ignore up to 2 points of penalties. pool.sit = the negative Situational Modifier, pool.oth = wounds, conditions and negative stances
function coCap(tr,atk,pool){const out={m:0,why:[]};if(!sh)return out;coChk();let sit=pool.sit;const sk=tr&&tr.sk;
 if(coTog.has('marks')&&coHas('marksman')&&atk&&(sk==='Shooting'||sk==='Athletics')){const n=Math.min(2,sit);if(n){out.m+=n;sit-=n;out.why.push('Marksman ignores '+n)}}
 if(coTog.has('calc')&&coHas('calculating')){const n=Math.min(2,sit+pool.oth);if(n){out.m+=n;out.why.push('Calculating ignores '+n);coTog.delete('calc');setTimeout(coBar,0)}}
 return out}
function coParry(){if(!sh)return 0;coChk();let m=0;if(coTog.has('defend'))m+=2;if(coTog.has('imp')&&!coHas('improvisational_fighter'))m-=1;return m}
function coActive(){coChk();const L=[];CO_ST.forEach(([k,t])=>{if(coTog.has(k))L.push(t)});if(coS.ma>0)L.push('Multi-action −'+2*coS.ma);
 if(coTog.has('marks')&&coHas('marksman'))L.push('Marksman');if(coTog.has('calc')&&coHas('calculating'))L.push('Calculating');
 if(coTog.has('raise'))L.push('Raise +d6');if(coTog.has('dbl'))L.push('Double damage');if(coTog.has('gk')&&coHas('giant_killer'))L.push('Giant Killer');if(coTog.has('chi')&&coHas('chi'))L.push('Chi');
 if(+coS.tt>0)L.push('Target Toughness '+coS.tt);return L}
// Multi-action: -2 to trait rolls for each action after the first, cleared when the turn moves on in the Initiative tracker
const MA_OPT=[[0,'1 action'],[1,'2 actions (−2)'],[2,'3 actions (−4)'],[3,'4 actions (−6)']];
function coMaReset(sid){if(coS.sid===sid){if(coS.ma){coS.ma=0;if($('#cobar'))coBar()}}else if(coSave[sid])coSave[sid].ma=0}
let coLastCur=null,coLastKey='';
function coTurn(){try{if(typeof iniM==='undefined'||!iniM||!iniM.active){coLastKey='';coLastCur=null;return}const k=iniM.cur+'|'+(iniM.round||1);if(k===coLastKey)return;coLastKey=k;const sid=id=>{const c=iniList().find(x=>x.id===id);return c&&c.sheet};if(coLastCur&&sid(coLastCur))coMaReset(sid(coLastCur));if(sid(iniM.cur))coMaReset(sid(iniM.cur));coLastCur=iniM.cur}catch(e){}}
function coBar(){const el=$('#cobar');if(!el||!sh)return;const on=coActive();
 el.innerHTML=`<button type="button" class="btn sm" id="cobtn" title="Stances, penalty-ignoring edges and damage add-ons">⚔ Combat options</button> <select id="coma" title="Actions this turn. Each action after the first gives −2 to your trait rolls. It clears itself when the turn moves on in the Initiative tracker." style="width:auto;padding:2px 4px">${MA_OPT.map(o=>`<option value="${o[0]}" ${coS.ma===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select> <span class="meta" id="costat">${on.length?esc(on.join(' · ')):'nothing ticked'}</span>`;
 $('#cobtn').onclick=coModal;$('#coma').onchange=e=>{coChk();coS.ma=+e.target.value||0;coBar();shDerive()}}
function coModal(){if(!sh)return;coChk();const ck=(k,t,d)=>`<label class="fxchip ${coTog.has(k)?'on':''}" style="display:block;margin:3px 0" title="${esc(d)}"><input type="checkbox" data-co="${k}" ${coTog.has(k)?'checked':''} style="width:auto"> <b>${esc(t)}</b> <span class="meta">${esc(d)}</span></label>`;
 const caps=[];if(coHas('marksman'))caps.push(ck('marks','Marksman','Not moving and firing at Rate of Fire 1: ignore up to 2 points of range, cover, called shot or size penalties on Shooting and throwing.'));
 if(coHas('calculating'))caps.push(ck('calc','Calculating','Action Card of Five or less: ignore up to 2 points of penalties on one action. It unticks itself after it is used.'));
 const dm=[ck('raise','Raise on the attack','Adds +d6 to the next damage roll. It ticks itself when an attack roll gets a raise.')];
 if(coHas('mighty_blow')||coHas('dead_shot'))dm.push(ck('dbl','Joker: double damage',(coHas('mighty_blow')?'Mighty Blow (Fighting)':'')+(coHas('mighty_blow')&&coHas('dead_shot')?' and ':'')+(coHas('dead_shot')?'Dead Shot (Shooting, throwing)':'')+': doubles the first successful attack. It unticks after one damage roll.'));
 if(coHas('giant_killer'))dm.push(ck('gk','Giant Killer','Target is three or more Sizes larger: +d6 damage.'));
 if(coHas('chi'))dm.push(ck('chi','Chi: +d6 unarmed','Spend a Chi Point to add +d6 to unarmed Fighting damage.'));
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>⚔ COMBAT OPTIONS</h2><div class="hint">Ticked items are added to the rolls on this sheet until you untick them. They are kept for each character until you reload the page. The <b>actions</b> box next to the Combat options button gives −2 to your trait rolls for each action after the first (Soak and Bleeding out are not actions). It resets when the turn moves on in the Initiative tracker. Frenzy, Sweep, Two-Fisted and Two-Gun Kid attacks count as one action.</div>
 <div class="meta" style="margin:8px 0 2px;letter-spacing:.1em">STANCES</div>${CO_ST.map(s=>ck(s[0],s[1],s[2])).join('')}
 ${caps.length?'<div class="meta" style="margin:10px 0 2px;letter-spacing:.1em">EDGES THAT IGNORE PENALTIES</div>'+caps.join(''):''}
 <div class="meta" style="margin:10px 0 2px;letter-spacing:.1em">DAMAGE ADD-ONS</div>${dm.join('')}
 <div class="two" style="margin-top:6px"><div><label>TARGET TOUGHNESS (OPTIONAL)</label><input id="cott" type="number" min="0" value="${esc(coS.tt)}" placeholder="e.g. 7"></div><div><label>TARGET ARMOR (OPTIONAL)</label><input id="cota" type="number" min="0" value="${esc(coS.ta)}" placeholder="part of that Toughness"></div></div>
 <div class="meta">With a Toughness filled in, each weapon Damage roll also says Shaken, how many wounds, or no effect. The weapon's AP is taken off the armor.</div>
 <div class="meta" style="margin:10px 0 2px;letter-spacing:.1em">RULES</div><label class="fxchip ${sh.msOff?'':'on'}" style="display:block"><input type="checkbox" id="coms" ${sh.msOff?'':'checked'} ${shCan()?'':'disabled'} style="width:auto"> <b>Minimum Strength penalties</b> <span class="meta">−1 per die type when your Strength is below a weapon's or worn armor's Min Str. Armor affects Agility rolls. Soldier and Brawny count your Strength a die higher.</span></label>
 <div style="margin-top:12px"><button class="btn mg" id="cocx">Close</button> <button class="btn" id="cocl">Clear all</button></div></div></div>`;
 $('#coms').onchange=e=>{shSet('msOff',!e.target.checked);e.target.closest('label').classList.toggle('on',e.target.checked);shBuild()};
 $('#cocx').onclick=()=>{$('#modal').innerHTML=''};
 $('#cocl').onclick=()=>{coTog.clear();coS.tt='';coS.ta='';coS.ma=0;coBar();shDerive();coModal()};
 $('#modal').querySelectorAll('[data-co]').forEach(c=>c.onchange=()=>{c.checked?coTog.add(c.dataset.co):coTog.delete(c.dataset.co);c.closest('label').classList.toggle('on',c.checked);coBar();shDerive()});
 $('#cott').oninput=e=>{coS.tt=e.target.value;coBar()};$('#cota').oninput=e=>{coS.ta=e.target.value}}
// ---- Bennies and Power Points
function coBn(d){const cur=parseInt(sh.bn)||0,v=Math.max(0,cur+d);shSet('bn',String(v));const i=document.querySelector('#sheetroot [data-sp="bn"]');if(i)i.value=String(v);const c=$('#shbnc');if(c){c.classList.remove('pulse');void c.offsetWidth;c.classList.add('pulse')}shSave()}
function coPP(d){sh.ppUsed=Math.max(0,Math.min(shPPT()||99,(+sh.ppUsed||0)-d));shDirty.add('ppUsed');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);shBuild()}
const coPPLeft=()=>Math.max(0,shPPT()-(+sh.ppUsed||0));
// ---- damage rolls: add-ons, doubling, and an optional "vs target Toughness" readout
function dmgCore(i,sn){const w=sh.weapons[i],pd=shDmgParse(w.dmg);if(!pd)return null;let sum=0;const bits=[];
 pd.terms.forEach(t=>{if(t.t==='n'){sum+=t.v;bits.push((t.v>0?'+':'')+t.v)}else for(let k=0;k<t.n;k++){const d=dxDie(t.s,true);sum+=t.sign*d.total;bits.push((t.label||'d'+t.s)+': '+dxF(d))}});
 {const fd=fxDmg(sh);if(fd.m){sum+=fd.m;bits.push(fd.why.join(', '))}}
 if(sn.wild){sum+=2;bits.push('Wild Attack +2')}if(sn.joker){sum+=2;bits.push('Joker +2')}
 const x=(on,l)=>{if(on){const d=dxDie(6,true);sum+=d.total;bits.push(l+' d6: '+dxF(d))}};x(sn.raise,'Raise');x(sn.gk,'Giant Killer');x(sn.chi,'Chi');
 if(sn.benny&&coHas('no_mercy')&&!fxItems(sh).some(it=>it.src==='No Mercy'&&fxOn(it))){sum+=2;bits.push('No Mercy +2')}
 if(sn.dbl){sum*=2;bits.push('doubled')}
 let tgt='';const tt=+sn.tt||0;if(tt>0){const ap=Math.max(0,+w.ap||0),ta=Math.max(0,+sn.ta||0),eff=Math.max(0,tt-Math.min(ap,ta)),mg=sum-eff,rz=Math.max(0,Math.floor(mg/4));
  tgt='vs Toughness '+eff+(ta&&ap?' (armor '+ta+', AP '+ap+')':'')+': '+(mg<0?'no effect':'Shaken'+(rz?' + '+rz+' wound'+(rz>1?'s':''):''))}
 return{sum,bits,pd,tgt,w}}
function shDmgEmit(i,sn,prev){const r=dmgCore(i,sn);if(!r)return alert('Enter the damage like 2d6+1 or Str+d8 first.');const w=r.w,nm=w.n||'Weapon',t0=nm+' damage';
 let f;if(prev){const better=r.sum>=prev.fin,base=better?{fin:r.sum,detail:r.bits.join(' | '),tgt:r.tgt}:{fin:prev.fin,detail:prev.detail0,tgt:prev.tgt};
  f={title:t0+' (reroll)',fin:base.fin,line:'💥 Damage'+r.pd.note+(base.tgt?' — '+base.tgt:''),cls:'',dmg:1,detail:'Reroll: new '+r.sum+' vs old '+prev.fin+', keeps '+base.fin+'. '+r.bits.join(' | '),detail0:base.detail,tgt:base.tgt,score:base.fin};
  f.plain=`🔁 **${nm} damage** reroll${sn.benny?' (Benny)':''}: new **${r.sum}** vs old **${prev.fin}** → keeps **${base.fin}** total damage${base.tgt?' — '+base.tgt:''}`}
 else{f={title:t0,fin:r.sum,line:'💥 Damage'+r.pd.note+(r.tgt?' — '+r.tgt:''),cls:'',dmg:1,detail:r.bits.join(' | '),detail0:r.bits.join(' | '),tgt:r.tgt,score:r.sum};
  f.plain=`💥 **${nm} damage** (${w.dmg}) — ${r.bits.join(' | ')} → **${r.sum}** total damage${r.tgt?' — '+r.tgt:''}`}
 f.rr={k:'d',i,sn:{...sn,benny:false},t0};{const wi=$('#wdmg');if(wi)wi.value=f.fin}shShow(f,f.plain,t0);return f}
function shRollDmg(i){if(!shCan())return;coChk();const w=sh.weapons[i],sk=w.sk||'Shooting',has=coHas;
 const sn={wild:coTog.has('wild')&&sk==='Fighting',joker:coTog.has('joker'),raise:coTog.has('raise'),gk:has('giant_killer')&&coTog.has('gk'),chi:has('chi')&&coTog.has('chi')&&sk==='Fighting',
  dbl:coTog.has('dbl')&&((sk==='Fighting'&&has('mighty_blow'))||((sk==='Shooting'||sk==='Athletics')&&has('dead_shot'))),tt:coS.tt,ta:coS.ta};
 const f=shDmgEmit(i,sn,null);if(f){coTog.delete('raise');coTog.delete('dbl');coBar()}}
// ---- after an attack roll: tick "raise" for the damage roll
function coAtkDone(res){coChk();if(res&&res.rs>0)coTog.add('raise');else coTog.delete('raise');coBar()}
// ---- Benny rerolls and result buttons
function shKeep(prev,nw,tag){const rr=prev.rr,better=nw.score>=prev.score,base=better?nw:prev,f={...base};
 f.title=rr.t0+' (reroll)';f.detail=tag+': new '+nw.fin+' vs old '+prev.fin+' → keeps '+base.fin+' | '+nw.detail;
 f.plain=`🔁 **${rr.t0}** ${tag}: new **${nw.fin}** vs old **${prev.fin}** → keeps **${f.fin}**${rr.k==='s'?' vs TN '+rr.o.tn:''} — ${f.line}`;
 f.rr={...rr,...(better&&nw.rr?nw.rr:{}),t0:rr.t0,xe:false,hw:0,chan:rr.chan,soak:rr.soak};f.soakN=prev.soakN||0;f.score=base.score;return f}
function shReroll(idx,mode){const prev=shLog[idx];if(!prev||!prev.rr||!shCan())return;const rr=prev.rr,free=mode==='f';
 if(!free){if((parseInt(sh.bn)||0)<=0)return alert('No Bennies left on this sheet. Use the + next to Bennies first, or ask the GM.');coBn(-1)}
 const elan=!free&&rr.k!=='d'&&coHas('elan'),tag=(free?'free reroll (Charismatic)':'Benny reroll')+(elan?' +2 Elan':'');let nw,f;
 if(rr.k==='s'){const o={...rr.o};if(elan)o.mod+=2;nw=shRes(o);nw.score=nw.fin;nw.rs=nw.ok?Math.floor((nw.fin-o.tn)/4):0;nw.crit=/Critical/.test(nw.line);nw.rr={...rr,o:rr.o};f=shKeep(prev,nw,tag);f.rr.o=rr.o}
 else if(rr.k==='m'){const p={...rr.p};if(elan)p.m+=2;nw=shMultiRes(rr.o,p);f=shKeep(prev,nw,tag)}
 else if(rr.k==='d'){return shDmgEmit(rr.i,{...rr.sn,benny:true},prev)}
 else return;
 if(free)f.rr.freeUsed=true;f.ok=f.ok;f.rs=f.rs;f.crit=f.crit;
 shAfterRoll(f,prev);shShow(f,f.plain,rr.t0)}
// effects that follow a final result: Channeling refund, Soak wounds
function shAfterRoll(f,prev){const rr=f.rr||{};f.line=String(f.line||'').replace(/ \| (Soaks .*|Soak failed)$/,'');f.plain=String(f.plain||'').replace(/ \| (Soaks .*|Soak failed)$/,'');
 if(rr.pw&&coHas('channeling')&&!rr.chan&&f.rs>0&&rr.pw.cost>0){rr.chan=true;coPP(1);f.line+=' | Channeling: 1 Power Point refunded';f.plain+=' | Channeling: 1 Power Point refunded'}
 if(rr.soak){const n=f.ok?1+(f.rs||0):0,had=f.soakN||0;if(n>had){shSoakApply(n-had,had===0);f.soakN=n}
  const t=f.soakN?' | Soaks '+f.soakN+' wound'+(f.soakN>1?'s':''):' | Soak failed';f.line+=t;f.plain+=t}}
function shSoakApply(n,first){const doc=(pm.sheets||[]).find(x=>x.id===shId)||{},st0=(doc.status||sh.status||[]).slice(),w0=+sh.wounds||0,i0=+sh.inc?1:0,WM=shWM();
 const valid=shUndo&&shUndo.id===shId&&shUndo.raw!=null&&Math.min(WM,shUndo.raw)===w0&&(shUndo.raw>WM)===!!i0,raw0=valid?shUndo.raw:(i0?WM+1:w0),raw=Math.max(0,raw0-n),w=Math.min(WM,raw),inc=raw>WM?1:0;
 if(first||!shUndo||shUndo.id!==shId)shUndo={id:shId,w:w0,inc:i0,st:st0.slice(),raw:raw0};shUndo.raw=raw;
 if(w!==w0)shSet('wounds',w);if(inc!==i0){shSet('inc',inc);if(!inc){const st=st0.filter(x=>x!=='Incapacitated');if(st.length!==st0.length)shStatSave(st)}}shBuild()}
function shSoak(){if(!shCan())return;if(!(+sh.wounds||0)&&!+sh.inc)return alert('There are no wounds to Soak.');if((parseInt(sh.bn)||0)<=0)return alert('No Bennies left on this sheet. Use the + next to Bennies first, or ask the GM.');
 coBn(-1);const t=sh.at.vigor;shRoll(+t.d||4,t.m,'Soak (Vigor, Benny spent)',false,false,{at:'vigor',free:1},[],{soak:1})}
function shBleed(){if(!shCan())return;const t=sh.at.vigor,htk=coHas('hard_to_kill')&&shOpt.pen,wp=Math.max(0,Math.min(3,+sh.wounds||0)-fxSum('ignw'));
 shRoll(+t.d||4,t.m,'Bleeding out (Vigor)',false,false,{at:'vigor',free:1},htk&&wp?[['Hard to Kill',wp]]:[])}
// +N added to a finished roll: Extra Effort (power rolls), Holy/Unholy Warrior (Soak)
function shBump(i,kind,n,pp){const r=shLog[i];if(!r||!r.rr||!shCan()||r.rr.k!=='s')return;
 if(coPPLeft()<pp)return alert('You only have '+coPPLeft()+' Power Points left.');
 coPP(-pp);const rr=r.rr,tn=rr.o.tn;r.fin+=n;r.score=r.fin;const ok=!r.crit&&r.fin>=tn,rs=ok?Math.floor((r.fin-tn)/4):0;
 r.ok=ok;r.rs=rs;r.line=ok?(rs>0?`Success! 🎯 with ${rs} Raise${rs>1?'s':''}! ${'⬆️'.repeat(rs)}`:'Success! 🎯'):(r.crit?r.line:'Failure. ❌');r.cls=ok?'dx-ok':'dx-bad';
 const lab=kind==='xe'?'Extra Effort':'Holy/Unholy Warrior';r.detail+=' | '+lab+' +'+n+' ('+pp+' PP)';if(kind==='xe')rr.xe=true;else rr.hw=(rr.hw||0)+n;
 const before=r.soakN||0;shAfterRoll(r,null);
 const msg=`➕ **${rr.t0}** — ${lab} +${n} (${pp} PP) → **${r.fin}** vs TN ${tn} — ${r.line}`;dxRecord(msg,sh.name||handle);if(shOpt.auto)dxPost(msg,sh.name);shDrawRes()}
const shActs=(r,i)=>{if(!r.rr||!sh||sh.drone||i>1)return'';const rr=r.rr,B=[`<button class="btn sm" data-rr="${i}" data-m="b" title="Spend a Benny and roll again. You keep the better result.${rr.k!=='d'&&coHas('elan')?' Elan adds +2.':''}">🔁 Benny reroll</button>`];
 if(rr.k==='s'&&rr.sk==='Persuasion'&&coHas('charismatic')&&!r.ok&&!r.crit&&!rr.freeUsed)B.push(`<button class="btn sm" data-rr="${i}" data-m="f" title="Charismatic: reroll a failed Persuasion roll for free">🔁 Free reroll (Charismatic)</button>`);
 if(rr.k==='s'&&rr.pw&&coHas('extra_effort')&&!r.crit&&!rr.xe)B.push(`<button class="btn sm" data-xb="${i}:xe:1:1" title="Extra Effort: +1 to the total for 1 Power Point">+1 (1 PP)</button><button class="btn sm" data-xb="${i}:xe:2:3" title="Extra Effort: +2 to the total for 3 Power Points">+2 (3 PP)</button>`);
 if(rr.k==='s'&&rr.soak&&coHas('holy_unholy_warrior')&&(rr.hw||0)<4)B.push(`<button class="btn sm" data-xb="${i}:hw:1:1" title="Holy/Unholy Warrior: +1 to the Soak total for each Power Point spent, up to 4">+1 Soak (1 PP)</button>`);
 return `<span style="display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:6px;vertical-align:middle">${B.join('')}</span>`};
function shDrawRes(){const el=$('#shres');if(!el)return;el.innerHTML=shLog.length?shLog.map((r,i)=>`<div style="${i?'opacity:.55;font-size:12px':''}"><b style="color:var(--am)">${esc(r.title)}</b> ${r.dmg?'':'<span class="meta">'+esc(r.sg||'')+'</span>'} <span class="meta">${esc(r.detail)}</span> → <span class="dx-total" style="font-size:${i?'1em':'1.5em'}">${r.fin}</span> <span class="${r.cls||''}" style="font-weight:600">${esc(r.line||'')}</span>${r.err?` <span class="dx-bad">Discord: ${esc(r.err)}</span>`:''}${shActs(r,i)}</div>`).join(''):'<span class="meta">Click a Roll button next to an attribute, skill or weapon.</span>';
 el.querySelectorAll('[data-rr]').forEach(b=>b.onclick=()=>shReroll(+b.dataset.rr,b.dataset.m));
 el.querySelectorAll('[data-xb]').forEach(b=>b.onclick=()=>{const [i,k,n,pp]=b.dataset.xb.split(':');shBump(+i,k,+n,+pp)})}
// ---- Power Point tools
function ppTools(){const el=$('#pptools');if(!el||!sh)return;const ro=!shCan(),L=[],rr=coHas('improved_rapid_recharge')?20:coHas('rapid_recharge')?10:5;
 L.push(`<button class="btn sm" data-ppt="rest" ${ro?'disabled':''} title="Power Points come back at this rate for every hour spent resting">Rest 1 hour (+${rr})</button>`);
 if(coHas('power_surge'))L.push(`<button class="btn sm" data-ppt="surge" ${ro?'disabled':''} title="Power Surge: recover 10 Power Points when your Action Card is a Joker">Joker drawn (+10)</button>`);
 if(coHas('soul_drain')){L.push(`<button class="btn sm" data-ppt="drain" ${ro?'disabled':''} title="Soul Drain: take a level of Fatigue for 5 Power Points">Soul Drain: Fatigue (+5)</button>`,`<button class="btn sm" data-ppt="exh" ${ro?'disabled':''} title="Soul Drain: Exhaust yourself for 10 Power Points">Soul Drain: Exhaust (+10)</button>`)}
 el.innerHTML=`<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="meta">RECOVER</span>${L.join('')}</div>${coHas('extra_effort')?'<div class="meta" style="margin-top:4px">Extra Effort: after you roll a power, use the +1 and +2 buttons under the result.</div>':''}`;
 el.querySelectorAll('[data-ppt]').forEach(b=>b.onclick=()=>{if(!shCan())return;const k=b.dataset.ppt,f=+sh.fatigue||0;
  if(k==='rest')coPP(rr);else if(k==='surge')coPP(10);
  else if(k==='drain'){if(f>=2)return alert('Already Exhausted. A third level of Fatigue would Incapacitate you.');shSet('fatigue',f+1);coPP(5)}
  else if(k==='exh'){if(f>=2)return alert('Already Exhausted.');shSet('fatigue',2);coPP(10)}})}
function shPowerCast(i){if(!shCan())return;const pw=sh.powers[i];let f=null;for(const k in sh.sk)sh.sk[k].forEach(x=>{if(x.n&&x.n===pw.sk)f=x});if(!f)return alert('Pick the skill used to cast this power first.');const cost=parseInt(pw.cost)||0;
 if(cost){sh.ppUsed=Math.min(shPPT()||99,(+sh.ppUsed||0)+cost);shDirty.add('ppUsed');clearTimeout(shTimer);shTimer=setTimeout(shSave,700)}
 shRoll(+f.d||4,f.m,(pw.n||'Power')+' ('+f.n+')',!+f.d,false,{sk:f.n},[],{pw:{cost}});try{tmFromPower(pw)}catch(e){}if(cost)shBuild()}

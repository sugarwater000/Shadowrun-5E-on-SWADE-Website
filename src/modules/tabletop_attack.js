// ---- Tabletop: attack from the map. Press the ⚔ tool, click your attacker, then click the target.
// A window works out the range, the target number and the penalties, rolls the attack (with the real sheet rules when the attacker has a sheet),
// rolls damage, and offers to apply the wounds to the target. Players' hits on tokens they do not own go to the GM to approve.
// Savage Worlds: Shooting and Throwing are against TN 4, Fighting is against the target's Parry, 4 over is a raise (+d6 damage),
// damage over Toughness is Shaken, and every 4 more is a wound.
const TB_CVR=[['No cover',0],['Light cover',-1],['Medium cover',-2],['Heavy cover',-4],['Near-total cover',-6]],TB_LIT=[['Bright light',0],['Dim light',-2],['Dark',-4],['Pitch black',-6]];
let tbAtkSt={a:null},tbAtk=null;
const tbAtkCan=t=>!!t&&(isOwner||tbCanRm(t));
// run fn with the global character set to this sheet (the same way Party at a Glance reads other sheets), then put everything back
function tbAs(d,fn){const kS=sh,kI=shId,kO={mod:shOpt.mod,tn:shOpt.tn,wild:shOpt.wild,pen:shOpt.pen};
 try{sh=shFix(JSON.parse(JSON.stringify(d)));shId=d.id;return fn(sh)}finally{sh=kS;shId=kI;shOpt.mod=kO.mod;shOpt.tn=kO.tn;shOpt.wild=kO.wild;shOpt.pen=kO.pen}}
const tbNum2=(v,lo,hi,d)=>{v=parseFloat(v);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
// what we know about a token as a target
function tbStatsOf(t){const s=tbSheetOf(t),cs=t.cs||{};
 if(!s&&!(cs.par||cs.tg)&&t.vh&&typeof tbVhTarget==='function'){const v=tbVhTarget(t);if(v)return {sheet:false,veh:true,parry:v.parry,tough:v.tough,arm:v.arm,wounds:v.wounds,wm:3,inc:false,shaken:false,known:v.known}}
 if(s){let st=null;try{st=pgStats(s)}catch(e){}st=st||{parry:0,tough:0,arm:0};let def=0;try{def=tbAs(s,()=>coParry())}catch(e){}
  let wm=3;try{wm=shWM(s)}catch(e){}
  return {sheet:true,parry:(+st.parry||0)+def,tough:+st.tough||0,arm:+st.arm||0,wounds:+s.wounds||0,wm,inc:!!s.inc,shaken:(s.status||[]).includes('Shaken'),known:true}}
 return {sheet:false,parry:+cs.par||0,tough:+cs.tg||0,arm:+cs.ar||0,wounds:(+t.mhp>0?Math.max(0,(+t.mhp)-(t.hp==null?+t.mhp:+t.hp)):0),wm:+t.mhp||0,inc:t.mark==='down',shaken:(Array.isArray(t.cnd)?t.cnd:[]).includes('stun'),known:!!(+cs.par||+cs.tg)}}
// one trait roll for a token that has no sheet: a die, an optional Wild Die, a modifier and a target number
function tbTraitRoll(title,sides,mod,tn,wild){const tr=dxDie(sides,true),wd=wild?dxDie(6,true):null,best=wd?Math.max(tr.total,wd.total):tr.total,fin=best+mod,crit=wd?(tr.raw===1&&wd.raw===1):false;
 let line,ok=false,rs=0;if(crit)line='Critical Failure! ⚠️';else if(fin>=tn){ok=true;rs=Math.floor((fin-tn)/4);line=rs>0?`Success! 🎯 with ${rs} Raise${rs>1?'s':''}! ${'⬆️'.repeat(rs)}`:'Success! 🎯'}else line='Failure. ❌';
 const sg=mod?(mod>0?'+'+mod:''+mod):'';
 return {fin,ok,rs,crit,line,title,detail:`Trait d${sides}: ${dxB(tr)}${wd?' | Wild d6: '+dxB(wd):''}`,plain:`🎲 **${title}** (d${sides}${wd?'+Wild d6':''}${sg}) — Trait: ${dxF(tr)}${wd?' | Wild: '+dxF(wd):''} → **${fin}** vs TN ${tn} — ${line}`}}
// damage like 2d6+1 or Str+d6 for a token without a sheet (Str uses the token's Strength die, d6 if unset)
function tbDmgRoll(str,strDie,raise,wildAtk){const s=String(str||'').replace(/\s+/g,'');if(!s)return null;const parts=s.match(/[+-]?[^+-]+/g);if(!parts)return null;let sum=0;const bits=[];
 for(const p0 of parts){const sg=p0[0]==='-'?-1:1,p=p0.replace(/^[+-]/,'');let m;
  if(/^str$/i.test(p)){const d=dxDie(strDie||6,true);sum+=sg*d.total;bits.push('Str d'+(strDie||6)+': '+dxF(d))}
  else if(m=p.match(/^(\d*)d(\d+)$/i)){for(let i=0;i<(+(m[1]||1));i++){const d=dxDie(+m[2],true);sum+=sg*d.total;bits.push('d'+m[2]+': '+dxF(d))}}
  else if(/^\d+$/.test(p)){sum+=sg*+p;bits.push((sg>0?'+':'−')+p)}else return null}
 if(wildAtk){sum+=2;bits.push('Wild Attack +2')}
 if(raise){const d=dxDie(6,true);sum+=d.total;bits.push('Raise d6: '+dxF(d))}
 return {sum,bits}}
// what a hit does: Shaken, then a wound for each 4 over Toughness (and one more if already Shaken)
function tbOutcome(dmg,eff,T){const mg=dmg-eff;if(mg<0)return {none:true,text:'no effect',nw:0,shaken:false};
 const rz=Math.floor(mg/4),nw=rz+(T.shaken?1:0),nt=T.wounds+nw,inc=T.veh?nt>=4:T.sheet?nt>T.wm:(+T.wm>0?nt>=T.wm:false);
 const bits=[T.veh?'Hit':(T.shaken?'Shaken again':'Shaken')];if(rz)bits.push(rz+' raise'+(rz>1?'s':'')+' over');if(nw)bits.push('+'+nw+' wound'+(nw>1?'s':''));if(inc)bits.push(T.veh?'WRECKED':'INCAPACITATED');
 return {none:false,text:bits.join(', '),nw,rz,shaken:true,inc,mg}}
// ---- picking attacker and target on the map
function tbAtkPaint(){const tk=$('#tbtoks');if(!tk)return;tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('atkr',tbTool==='attack'&&e.dataset.tbt===tbAtkSt.a))}
function tbAtkClick(m,tEl,e){const t=tEl?tbTok(tEl.dataset.tbt):null;
 if(!t){if(tbAtkSt.a){tbAtkSt.a=null;tbAtkPaint();tbNote('Attack cancelled.')}return}
 if(!tbAtkSt.a){if(!tbAtkCan(t)){tbNote('Pick one of your own tokens as the attacker first.');return}tbAtkSt.a=t.id;tbAtkPaint();tbNote('Attacker: '+tbName(t)+'. Now click the target.');return}
 if(t.id===tbAtkSt.a){tbAtkSt.a=null;tbAtkPaint();tbNote('Attack cancelled.');return}
 const a=tbTok(tbAtkSt.a);if(!a){tbAtkSt.a=null;return}tbAtkOpen(a,t)}
TBX.atk=(x,m,t)=>{const s=tbSelToks();tbAtkSt.a=(s.length===1&&tbAtkCan(s[0]))?s[0].id:null;tbAct('tool','attack');tbAtkPaint();tbNote(tbAtkSt.a?'Attacker: '+tbName(tbTok(tbAtkSt.a))+'. Click the target.':'Click your attacker, then the target.')};
function tbAtkPanel(L){if(!L||L.length!==1)return '';const t=L[0];if(!tbAtkCan(t))return '';
 return `<div class="tbcw"><div class="tbvb"><button class="btn sm ${tbTool==='attack'?'on':''}" data-tbx="atk" title="Attack from this token: then click the target on the map">⚔ Attack from here</button></div><div class="meta">Click the target after pressing it. The window works out range and cover, rolls the attack and damage, and offers to apply the wounds.</div></div>`}
// ---- the attack window
function tbAtkOpen(a,t){const m=tbCur();if(!m)return;const A=a,Tk=t,ws=tbWeapons(A),sheetA=tbSheetOf(A),cs=A.cs||{},tstat=tbStatsOf(Tk),dsq=tbTokDist(A,Tk),post=(()=>{try{return localStorage.getItem('sr_tbdp')!=='0'}catch(e){return true}})();
 const w0=ws.find(x=>x.rng)||ws[0]||null;
 tbAtk={a:A.id,t:Tk.id,wi:w0?w0.i:-1,res:null,dmg:null,hit:null,tn:null,T:tstat,dsq,done:false};
 const dd=(id,v)=>`<select id="${id}">${[4,6,8,10,12].map(n=>`<option value="${n}" ${n===v?'selected':''}>d${n}</option>`).join('')}</select>`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbaf"><h2>⚔ ${esc(tbName(A))} → ${esc(tbName(Tk))}</h2><div id="tbawh"></div>
 <div class="two"><div><label>WEAPON</label>${sheetA||ws.length?`<select id="tbaw">${ws.map(x=>`<option value="${x.i}" ${w0&&w0.i===x.i?'selected':''}>${esc(x.n)}${x.rs?' ('+esc(x.rs)+')':' (melee)'}</option>`).join('')}${sheetA?'':'<option value="-1">Something else…</option>'}</select>`:'<div class="meta">No weapons on file. Fill in the boxes below.</div>'}</div>
 <div><label>DISTANCE</label><div id="tbad" class="meta"></div></div></div>
 <div id="tbarof" style="display:none;gap:12px;align-items:flex-end;flex-wrap:wrap;margin:4px 0"><div><label>RATE OF FIRE (DICE)</label><select id="tbarf"><option value="1">1</option></select></div><label class="tbck" id="tbarrl" style="display:none"><input type="checkbox" id="tbarr" ${(()=>{try{return sheetA&&tbAs(sheetA,S=>swHasEdge(S,'rock_and_roll'))?'checked':''}catch(e){return ''}})()}> Ignore recoil (Rock and Roll, did not move)</label><span class="meta" id="tbarfm"></span></div>
 <div id="tbaam" class="meta" style="margin:2px 0 4px"></div>
 ${sheetA?'<div class="meta" id="tbasn" style="margin:2px 0 6px"></div>':`<div id="tbacs" style="border:1px solid var(--line);padding:6px 8px;margin:6px 0"><div class="meta">This token has no sheet: fill in its numbers.</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><div><label>SKILL DIE</label>${dd('tbasd',+cs.fi&&cs[(w0&&/^fight/i.test(w0.sk))?'fi':'sh']||+cs.sh||8)}</div><div><label>MODIFIER</label><input type="number" id="tbasm" value="0" style="width:70px"></div><div><label>STRENGTH DIE</label>${dd('tbast',+cs.st||6)}</div>
  <label class="tbck" style="align-self:end"><input type="checkbox" id="tbasw" ${cs.wc?'checked':''}> Wild Card (Wild Die)</label></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><div style="flex:2;min-width:120px"><label>WEAPON NAME</label><input id="tbawn" maxlength="40" value="${esc(w0?w0.n:'')}"></div><div style="width:110px"><label>RANGE</label><input id="tbawr" maxlength="20" placeholder="12/24/48" value="${esc(w0?w0.rs:'')}"></div><div style="width:100px"><label>DAMAGE</label><input id="tbawd" maxlength="20" placeholder="2d6" value="${esc(w0?w0.dmg:'')}"></div><div style="width:60px"><label>AP</label><input type="number" id="tbawa" value="${w0?w0.ap:0}" min="0"></div><div style="width:60px"><label>ROF</label><input type="number" id="tbawf" value="${w0&&w0.rof?esc(w0.rof):''}" min="1" max="12" placeholder="1"></div><div style="width:100px"><label>SKILL</label><select id="tbawk"><option>Shooting</option><option>Fighting</option><option>Throwing</option><option>Athletics</option></select></div></div>
  ${isOwner?'<div style="margin-top:4px"><button type="button" class="btn sm" id="tbasv">💾 Remember this on the token</button> <span class="meta" id="tbasvm"></span></div>':''}</div>`}
 <h3 style="margin:8px 0 2px;font-size:14px">TARGET</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><div><label>PARRY</label><input type="number" id="tbtp" value="${tstat.parry||''}" min="0" style="width:70px" ${tstat.sheet?'disabled':''}></div><div><label>TOUGHNESS</label><input type="number" id="tbtt" value="${tstat.tough||''}" min="0" style="width:80px" ${tstat.sheet?'disabled':''}></div><div><label>ARMOR (IN TOUGHNESS)</label><input type="number" id="tbta" value="${tstat.arm||0}" min="0" style="width:80px" ${tstat.sheet?'disabled':''}></div>
  ${!tstat.sheet&&isOwner?'<button type="button" class="btn sm" id="tbtsv">💾 Remember</button>':''}<span class="meta" id="tbtnote">${tstat.sheet?'from the target\'s sheet':(tstat.known?'':'Not set yet: fill in Parry and Toughness (the GM can remember them on the token).')}</span></div>
 <h3 style="margin:8px 0 2px;font-size:14px">MODIFIERS</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>RANGE BAND</label><select id="tbarb"><option value="0">Short (0)</option><option value="1">Medium (−2)</option><option value="2">Long (−4)</option><option value="3">Extreme (−8)</option></select></div><div><label>COVER</label><select id="tbacv">${TB_CVR.map((c,i)=>`<option value="${i}">${c[0]} (${c[1]||0})</option>`).join('')}</select></div><div><label>LIGHT</label><select id="tbali">${TB_LIT.map((c,i)=>`<option value="${i}">${c[0]} (${c[1]||0})</option>`).join('')}</select></div><div><label>CALLED SHOT</label><select id="tbacl"><option value="0">None</option><option value="-2">Limb or small target (−2)</option><option value="-4">Head or tiny target (−4)</option></select></div></div>
 <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px"><label class="tbck"><input type="checkbox" id="tbaai"> Aimed shot (+2)</label><label class="tbck"><input type="checkbox" id="tbasl"> Smartlink or targeting aid (+1)</label><label class="tbck"><input type="checkbox" id="tbawa2"> Wild Attack (+2 attack and damage, melee)</label><span>Other <input type="number" id="tbaom" value="0" style="width:64px"></span></div>
 <div class="meta" id="tbatn" style="margin-top:6px"></div>
 <div style="margin:10px 0"><button class="btn grn" type="button" id="tbago">🎲 Roll attack</button> <button class="btn" type="button" id="tbagd" disabled>💥 Roll damage</button> <label class="tbck" style="display:inline-block;margin-left:10px"><input type="checkbox" id="tbadp" ${post?'checked':''}> Post to Discord</label></div>
 <div id="tbar"><div id="tbar1"></div><div id="tbar2"></div></div>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Close</button></div></form></div>`;
 tbAtkWire();tbAtkRefresh()}
function tbAtkWeapon(){const A=tbTok(tbAtk.a);if(!A)return null;const sheetA=tbSheetOf(A);
 if(sheetA||$('#tbaw')&&+$('#tbaw').value>=0){const ws=tbWeapons(A),i=$('#tbaw')?+$('#tbaw').value:tbAtk.wi;return ws.find(x=>x.i===i)||ws[0]||null}
 const rs=($('#tbawr')||{}).value||'';return {i:-1,n:($('#tbawn')||{}).value||'Weapon',rs,rng:tbRngNums(rs),dmg:($('#tbawd')||{}).value||'',ap:+($('#tbawa')||{}).value||0,sk:($('#tbawk')||{}).value||(tbRngNums(rs)?'Shooting':'Fighting'),rof:($('#tbawf')||{}).value||'',raw:null}}
function tbAtkT(){const T=tbAtk.T,g=id=>+($(id)||{}).value||0;return T.sheet?T:{...T,parry:g('#tbtp'),tough:g('#tbtt'),arm:g('#tbta')}}
// the range band, target number and the sum of all the modifiers the window knows about
function tbAtkCalc(){const A=tbTok(tbAtk.a),m=tbCur(),w=tbAtkWeapon();if(!A||!m||!w)return null;const T=tbAtkT(),melee=!w.rng,d=tbRU(m,tbAtk.dsq),b=w.rng?tbBand(d,w.rng):null,v=id=>+($(id)||{}).value||0;
 const bi=b?(+($('#tbarb')||{}).value):0;
 const xs=[];if(!melee&&bi)xs.push([['Short','Medium','Long','Extreme'][bi]+' range',TB_RBP[bi]]);
 const cv=TB_CVR[v('#tbacv')][1],li=TB_LIT[v('#tbali')][1],cl=v('#tbacl'),ai=$('#tbaai').checked?2:0,sl=$('#tbasl').checked&&!melee?1:0,wa=$('#tbawa2').checked&&melee?2:0,om=v('#tbaom');
 if(cv)xs.push([TB_CVR[v('#tbacv')][0],cv]);if(li)xs.push([TB_LIT[v('#tbali')][0],li]);if(cl)xs.push([cl===-2?'Called shot (limb)':'Called shot (head)',cl]);if(ai)xs.push(['Aimed shot',ai]);if(sl)xs.push(['Smartlink',sl]);if(wa)xs.push(['Wild Attack',wa]);if(om)xs.push(['Other',om]);
 const n=melee?1:Math.max(1,Math.min(12,v('#tbarf')||1));if(n>1&&!($('#tbarr')||{}).checked)xs.push(['Recoil',-2]);
 return {A,m,w,T,melee,d,b,xs,n,tn:melee?Math.max(1,T.parry||4):4,sum:xs.reduce((s,x)=>s+x[1],0)}}
function tbAtkRefresh(){if(!tbAtk||!$('#tbaf'))return;const rf=$('#tbarf');if(rf){const r=$('#tbarrl');if(r)r.style.display=(+rf.value>1)?'':'none'}tbAtkAmmoLine();const C=tbAtkCalc(),el=$('#tbatn');if(!C){if(el)el.textContent='Pick a weapon.';return}
 const dtx=$('#tbad'),dd=Math.round(C.d*10)/10,u=C.m.rbu==='mu'?(C.m.un||'m'):'squares';
 if(dtx)dtx.innerHTML=`${dd} ${esc(u)} straight line`+(C.w.rng&&C.b?` · <b style="color:${C.b.col}">${C.b.out?'out of range':C.b.name+' range'}</b>`:C.melee?(tbAtk.dsq<=1.5?' · <b style="color:#39ff14">adjacent</b>':' · <b style="color:#ff9f1c">not adjacent</b>'):'');
 if(el)el.innerHTML=`Target number <b>${C.tn}</b> (${C.melee?'target Parry':'Shooting and Throwing'})${C.n>1?' · <b>'+C.n+' dice</b>':''} · modifiers <b>${C.sum>0?'+'+C.sum:C.sum}</b>${C.xs.length?' <span class="meta">('+esc(C.xs.map(x=>x[0]+' '+(x[1]>0?'+':'−')+Math.abs(x[1])).join(', '))+')</span>':''}`;
 const sn=$('#tbasn');if(sn&&tbSheetOf(C.A)){let L=[];try{L=tbAs(tbSheetOf(C.A),()=>{coChk();return coActive()})}catch(e){}sn.textContent=L.length?'From the sheet: '+L.join(' · ')+'. Wound and condition penalties are added when you roll.':'Wound and condition penalties from the sheet are added when you roll.'}}
function tbAtkWire(){const f=$('#tbaf');if(!f)return;$('#cx').onclick=closeM;const m=tbCur(),A=tbTok(tbAtk.a);
 const setBand=()=>{const w=tbAtkWeapon(),b=w&&w.rng?tbBand(tbRU(m,tbAtk.dsq),w.rng):null;$('#tbarb').value=b?String(Math.min(3,b.i)):'0';$('#tbarb').disabled=!b;
  const wa=$('#tbawa2');if(wa)wa.parentElement.style.opacity=w&&!w.rng?'':'.45';tbAtkRofFill();
  const sd=$('#tbasd');if(sd&&w&&A){const c=A.cs||{},fight=/^fight/i.test(w.sk||''),d=+(w.raw&&w.raw.d)||+c[fight?'fi':'sh']||0;if(d&&[...sd.options].some(o=>+o.value===d))sd.value=String(d)}};
 f.addEventListener('input',()=>{tbAtkRefresh()});f.addEventListener('change',e=>{if(e.target.id==='tbaw'||e.target.id==='tbawr')setBand();tbAtkRefresh()});
 $('#tbawr')&&$('#tbawr').addEventListener('input',setBand);$('#tbawf')&&$('#tbawf').addEventListener('input',setBand);
 setBand();
 const memo=(id,tok,ob,msg)=>{if(!tok)return;tbTokEdit([tok],()=>ob,'remember numbers').then(()=>{const e=$(id);if(e)e.textContent=msg})};
 const sv=$('#tbasv');if(sv)sv.onclick=()=>{const w=tbAtkWeapon();if(!w)return;const cs={...(A.cs||{})},fight=/^fight/i.test(w.sk||''),sd=+$('#tbasd').value;
  if(fight)cs.fi=sd;else cs.sh=sd;cs.st=+$('#tbast').value;cs.wc=$('#tbasw').checked;cs.w=[{n:w.n,rng:w.rs,dmg:w.dmg,ap:w.ap,sk:w.sk,rof:w.rof||''}];memo('#tbasvm',A,{cs},'Saved on '+tbName(A)+'.')};
 const ts=$('#tbtsv');if(ts)ts.onclick=()=>{const T=tbTok(tbAtk.t);if(!T)return;const cs={...(T.cs||{}),par:+$('#tbtp').value||0,tg:+$('#tbtt').value||0,ar:+$('#tbta').value||0};memo('#tbtnote',T,{cs},'Saved on '+tbName(T)+'.')};
 $('#tbago').onclick=tbAtkRoll;$('#tbagd').onclick=tbAtkDamage}
// ---- the attack roll
async function tbAtkFinish(plain,short,good,tokId){const p=$('#tbadp')?$('#tbadp').checked:true;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}
 const A=tbTok(tbAtk.a),nm=A?tbName(A):handle;try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
 const m=tbCur();if(m){const d={map:m.id,tok:tokId||tbAtk.a,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}try{tbMarksDraw()}catch(e){}}}
const tbAtkSgn=xs=>xs.map(x=>x[0]+' '+(x[1]>0?'+':'−')+Math.abs(x[1])).join(', ');
// most dice the weapon can fire: its Rate of Fire, plus one with Rapid Fire
function tbAtkRofMax(A,w){if(!w||!w.rng||/^fight/i.test(w.sk||''))return 1;let r=Math.max(1,spNum(w.rof));const s=tbSheetOf(A);
 if(s){try{if(tbAs(s,S=>swHasEdge(S,'rapid_fire')||swHasEdge(S,'improved_rapid_fire')))r++}catch(e){}}return Math.min(12,r)}
function tbAtkRofFill(){const A=tbTok(tbAtk.a),w=tbAtkWeapon(),box=$('#tbarof'),sel=$('#tbarf');if(!box||!sel||!A)return;const mx=tbAtkRofMax(A,w),old=+sel.value||1;
 box.style.display=mx>1?'flex':'none';
 let h='';for(let n=1;n<=mx;n++)h+=`<option value="${n}">${n===1?'1 die (single shot)':n+' dice (ROF '+n+')'+' · '+amShots(n)+' rounds'}</option>`;
 if(sel._h!==h){sel._h=h;sel.innerHTML=h}sel.value=String(Math.min(old,mx));
 const rl=$('#tbarrl');if(rl)rl.style.display=(+sel.value>1)?'':'none'}
// the ammo line, for sheets that track a magazine on the weapon
function tbAtkAmmoLine(){const el=$('#tbaam');if(!el||!tbAtk)return;const A=tbTok(tbAtk.a),s=A&&tbSheetOf(A),w=tbAtkWeapon(),rw=s&&w&&w.i>=0?(s.weapons||[])[w.i]:null;
 if(!rw||!amOn(rw)){if(el._h){el._h='';el.innerHTML=''}return}
 const a=Math.max(0,Math.floor(+rw.ammo||0)),sp=amSpare(rw),n=Math.max(1,Math.min(12,+($('#tbarf')||{}).value||1)),need=amShots(n);
 const h=`Ammo: <b style="color:${a<need?'var(--mg)':'inherit'}">${a}</b> / ${+rw.mag} rounds${sp!==null?' · '+sp+' spare magazine'+(sp===1?'':'s'):''}${n>1?' · this burst uses '+need:''}${a<need&&a>0?' (only '+a+' left: it uses them all)':''}${a<=0?' · <b style="color:var(--mg)">empty</b>':''} <button type="button" class="btn sm" id="tbarl" ${a>=+rw.mag||(sp!==null&&sp<=0)?'disabled':''}>Reload</button>`;
 if(el._h!==h){el._h=h;el.innerHTML=h;const b=$('#tbarl');if(b)b.onclick=tbAtkReload}}
async function tbAtkReload(){const A=tbTok(tbAtk.a),s=A&&tbSheetOf(A),w=tbAtkWeapon();if(!s||!w||w.i<0)return;const rw=(s.weapons||[])[w.i];if(!rw||!amOn(rw))return;
 const cur=Math.max(0,Math.floor(+rw.ammo||0)),sp=amSpare(rw);if(cur>=+rw.mag||(sp!==null&&sp<=0))return;
 const ws=s.weapons.map(x=>({...x}));ws[w.i].ammo=+rw.mag;if(sp!==null)ws[w.i].spare=sp-1;s.weapons=ws;
 try{await db.doc('sheets/'+s.id).update({weapons:ws})}catch(e){alert('Could not reload: '+(e.message||e.code||''));return}
 const el=$('#tbaam');if(el)el._h='';tbAtkAmmoLine();tbSay(tbName(A),'🔄 **'+tbName(A)+'** reloads '+(rw.n||'the weapon')+'.','Reloads '+(rw.n||'weapon'),null,A.id)}
// takes the rounds off the weapon on the real sheet. Returns '' or the reason it cannot fire.
async function tbAtkAmmo(C){const s=tbSheetOf(C.A),w=C.w;if(!s||w.i<0)return '';const rw=(s.weapons||[])[w.i];if(!rw||!amOn(rw))return '';
 const a=Math.max(0,Math.floor(+rw.ammo||0));if(a<=0)return (rw.n||'This weapon')+' is empty. Press Reload first.';
 const ws=s.weapons.map(x=>({...x}));ws[w.i].ammo=a-Math.min(amShots(C.n),a);s.weapons=ws;
 try{await db.doc('sheets/'+s.id).update({weapons:ws})}catch(e){return 'Could not use the ammo: '+(e.message||e.code||'')}
 const el=$('#tbaam');if(el)el._h='';tbAtkAmmoLine();return ''}
// one attack roll (one die, or a burst of several). elan adds the +2 a Benny reroll gets from the Elan edge.
function tbAtkDo(C,elan){const A=C.A,sheetA=tbSheetOf(A),w=C.w,sk=w.sk||(C.melee?'Fighting':'Shooting'),n=C.n;let res;
 if(sheetA){res=tbAs(sheetA,S=>{let f=null;for(const k in S.sk)(S.sk[k]||[]).forEach(x=>{if(x.n===sk)f=x});if(!f&&drRigOn())f={n:sk,d:0,m:0};if(!f)return {err:'This sheet has no "'+sk+'" skill.'};
   coChk();shOpt.mod=0;shOpt.tn=C.tn;shOpt.pen=true;
   const xs=C.xs.concat(shWXs(S.weapons[w.i]||w.raw||{})),p=shPrep(+f.d||4,f.m,w.n+(n>1?' autofire ROF '+n:' attack')+' ('+f.n+')',!+f.d,true,{sk:f.n},xs);
   if(elan&&coHas('elan'))p.m+=2;
   if(n>1)return shMultiRes({n,tns:[C.tn],title:p.title},p);
   const o={title:p.title,sides:p.sides,mod:p.m,tn:C.tn,wild:p.wild,ws:p.ws||6},r=shRes(o);
   r.rs=r.ok?Math.floor((r.fin-o.tn)/4):0;r.crit=/Critical/.test(r.line);return r});
  if(res&&res.err)return res}
 else{const sides=+($('#tbasd')||{}).value||8,mod=(+($('#tbasm')||{}).value||0)+C.sum,wc=!!($('#tbasw')||{}).checked,
   title=w.n+(n>1?' autofire ROF '+n:' attack')+' ('+sk+')'+(C.xs.length?' ['+tbAtkSgn(C.xs)+']':'');
  res=n>1?shMultiRes({n,tns:[C.tn],title},{sides,m:mod,title,wild:wc,ws:6}):tbTraitRoll(title,sides,mod,C.tn,wc)}
 if(!res.items)res.items=[{fin:res.fin,tn:C.tn,ok:!!res.ok,rs:res.rs||0}];
 res.score=res.crit?-1:(res.score!=null?res.score:res.fin);return res}
function tbAtkShow(note){const res=tbAtk.res,C=tbAtkCalc(),A=tbTok(tbAtk.a);if(!res||!C||!A)return;
 const hits=res.items.filter(x=>x.ok).length,bn=tbBnOf(A);
 $('#tbar1').innerHTML=`<div class="post" style="padding:8px 10px">${note?`<div class="meta">${esc(note)}</div>`:''}<div style="font-size:16px"><b>${esc(String(res.fin))}</b> vs TN ${C.tn} — ${esc(res.line)}</div><div class="meta">${esc(res.detail)}</div>
  <div style="margin-top:6px"><button type="button" class="btn sm" id="tbabn" ${tbBnCan(A)&&!tbAtk.dmg?'':'disabled'} title="Spend a Benny and roll the attack again. You keep the better result.">🎟 Benny reroll (${esc(tbBnTxt(A))})</button> <span class="meta" id="tbabm"></span></div></div>`;
 $('#tbagd').disabled=!res.ok;const b=$('#tbabn');if(b)b.onclick=tbAtkBenny}
async function tbAtkRoll(){const C=tbAtkCalc();if(!C)return;const A=C.A,T=tbTok(tbAtk.t),w=C.w;
 if(!C.melee&&C.b&&C.b.out&&!await ask('The target is beyond Extreme range. Roll anyway?','Roll anyway'))return;
 const bad=await tbAtkAmmo(C);if(bad){$('#tbar1').innerHTML=`<div class="warn">${esc(bad)}</div>`;return}
 const res=tbAtkDo(C);
 if(res&&res.err){$('#tbar1').innerHTML=`<div class="warn">${esc(res.err)}</div>`;return}
 tbAtk.res=res;tbAtk.wi=w.i;tbAtk.hit=null;tbAtk.dmg=null;tbAtk.applied=false;$('#tbar2').innerHTML='';
 const who=tbName(A),tg=tbName(T||{}),plain=`⚔ **${who}** attacks **${tg}** with ${w.n}${C.b&&!C.melee?' ('+(C.b.out?'out of range':C.b.name+' range')+')':''}: `+res.plain;
 tbAtkShow();$('#tbago').textContent='🎲 Roll attack again';
 const hits=res.items.filter(x=>x.ok),rz=Math.max(0,...res.items.map(x=>x.rs));
 tbAtkFinish(plain,`${w.n}: ${res.fin} vs ${C.tn} · ${hits.length?(C.n>1?hits.length+' of '+C.n+' hit':(rz?'hit +'+rz+' raise'+(rz>1?'s':''):'hit')):(res.crit?'critical failure':'miss')}`,hits.length>0,tbAtk.a);
 const tf=$('#tbadp');if(res.crit&&tf)tf.disabled=false}
// Benny: roll the attack again, keep the better of the two
async function tbAtkBenny(){const C=tbAtkCalc(),old=tbAtk&&tbAtk.res;if(!C||!old||tbAtk.dmg)return;const A=C.A,why=await tbBnSpend(A);if(why){const m=$('#tbabm');if(m)m.textContent=why;return}
 const nw=tbAtkDo(C,true);if(nw.err){$('#tbabm').textContent=nw.err;return}
 const better=nw.score>=old.score,keep=better?nw:old;
 const note=`Benny reroll: new ${nw.fin} vs old ${old.fin} → keeps ${keep.fin}`;
 tbAtk.res=keep;tbAtkShow(note);try{tbBar()}catch(e){}
 const hits=keep.items.filter(x=>x.ok).length;
 tbAtkFinish(`🔁 **${tbName(A)}** spends a Benny on the ${C.w.n} attack: new **${nw.fin}** vs old **${old.fin}** → keeps **${keep.fin}** vs TN ${C.tn} — ${keep.line}`,`Benny reroll → ${keep.fin} vs ${C.tn}`,hits>0,tbAtk.a)}
// ---- the damage roll and the hit
// Several hits in a row: each one is worked out against the target as the earlier ones left it (Shaken, then wounds)
function tbOcSum(list,T0){const L=list.filter(x=>!x.oc.none);if(list.length===1)return list[0].oc;if(!L.length)return {none:true,text:'no effect',nw:0,shaken:false};
 const nw=L.reduce((a,x)=>a+x.oc.nw,0),inc=!!L[L.length-1].oc.inc,bits=[T0.veh?'Hit':(T0.shaken?'Shaken again':'Shaken')];if(nw)bits.push('+'+nw+' wound'+(nw>1?'s':''));if(inc)bits.push(T0.veh?'WRECKED':'INCAPACITATED');
 return {none:false,text:bits.join(', '),nw,rz:0,shaken:true,inc}}
function tbAtkDmgDo(C,res){const A=C.A,sheetA=tbSheetOf(A),w=C.w,Tn=C.T,eff=Math.max(0,Tn.tough-Math.min(w.ap||0,Tn.arm||0)),wildAtk=C.melee&&$('#tbawa2').checked,list=[];let Tc={...Tn};
 for(const h of res.items.filter(x=>x.ok)){let r;
  if(sheetA){r=tbAs(sheetA,S=>{coChk();return dmgCore(w.i,{wild:wildAtk&&/^fight/i.test(w.sk||'Fighting'),joker:false,raise:h.rs>0,gk:false,chi:false,dbl:false,benny:false,tt:'',ta:''})});if(!r)return {err:'That weapon has no damage written on the sheet (like 2d6+1).'};r={sum:r.sum,bits:r.bits}}
  else{r=tbDmgRoll(w.dmg,+($('#tbast')||{}).value||6,h.rs>0,wildAtk);if(!r)return {err:'Type the damage like 2d6+1 or Str+d6 first.'}}
  const oc=tbOutcome(r.sum,eff,Tc);if(!oc.none)Tc={...Tc,wounds:Tc.wounds+oc.nw,shaken:true};list.push({sum:r.sum,bits:r.bits,oc})}
 return {list,eff,oc:tbOcSum(list,Tn),total:list.reduce((a,x)=>a+x.sum,0)}}
function tbAtkDmgShow(note){const D=tbAtk.dmg,C=tbAtkCalc(),T=tbTok(tbAtk.t),A=tbTok(tbAtk.a);if(!D||!C||!T||!A)return;const Tn=C.T,w=C.w,oc=D.oc,multi=D.list.length>1;
 const can=isOwner||(Tn.sheet&&tbSheetOf(T)&&tbSheetOf(T).uid===uid)||(Tn.veh&&typeof tbVhMine==='function'&&tbVhMine(T));
 const ap=w.ap?` (AP ${w.ap} against armor ${Tn.arm||0})`:'';
 tbAtk.hit={dmg:multi?D.list.map(x=>x.sum).join(', '):D.list[0].sum,bits:D.list.reduce((a,x)=>a.concat(x.bits),[]),eff:D.eff,oc,wname:w.n,tn:Tn};
 $('#tbar2').innerHTML=`<div class="post" style="padding:8px 10px;margin-top:6px">${note?`<div class="meta">${esc(note)}</div>`:''}
  ${multi?`<div style="font-size:15px">💥 ${D.list.length} hits against Toughness <b>${D.eff}</b>${esc(ap)}</div>${D.list.map((x,i)=>`<div>Hit ${i+1}: <b>${x.sum}</b> damage → ${esc(x.oc.text)} <span class="meta">${esc(x.bits.join(' | '))}</span></div>`).join('')}<div style="margin-top:4px">Together: <b style="color:${oc.none?'var(--dim)':'var(--mg)'}">${esc(oc.text)}</b></div>`
  :`<div style="font-size:16px">💥 <b>${D.list[0].sum}</b> damage vs Toughness <b>${D.eff}</b>${esc(ap)} — <b style="color:${oc.none?'var(--dim)':'var(--mg)'}">${esc(oc.text)}</b></div><div class="meta">${esc(D.list[0].bits.join(' | '))}</div>`}
  <div style="margin-top:6px">${oc.none||tbAtk.applied?'':can?'<button type="button" class="btn grn" id="tbapl">Apply to '+esc(tbName(T))+'</button> ':'<button type="button" class="btn grn" id="tbaps">Send to the GM to apply</button> '}<button type="button" class="btn sm" id="tbadb" ${tbBnCan(A)&&!tbAtk.applied?'':'disabled'} title="Spend a Benny and roll the damage again. You keep the better result.">🎟 Benny: roll damage again (${esc(tbBnTxt(A))})</button> <span class="meta" id="tbaplm"></span></div></div>`;
 $('#tbagd').disabled=true;
 const b=$('#tbapl');if(b)b.onclick=async()=>{b.disabled=true;try{await tbApplyHit(tbAtk.t,tbAtk.hit);tbAtk.applied=true;const bb=$('#tbadb');if(bb)bb.disabled=true;$('#tbaplm').textContent='Applied.';tbAtkSoakBtn()}catch(e){b.disabled=false;$('#tbaplm').textContent='Could not apply: '+(e.message||e.code||'')}};
 const s=$('#tbaps');if(s)s.onclick=async()=>{s.disabled=true;await tbHitSend(tbAtk.t,tbAtk.hit);tbAtk.applied=true;const bb=$('#tbadb');if(bb)bb.disabled=true;$('#tbaplm').textContent='Sent. The GM will see it on the Tabletop.'};
 const d=$('#tbadb');if(d)d.onclick=tbAtkDmgBenny}
// after the wounds are on the target: offer to Soak them (spends a Benny of the target's)
function tbAtkSoakBtn(){const T=tbTok(tbAtk.t),oc=tbAtk.hit&&tbAtk.hit.oc;if(!T||!oc||!oc.nw||!tbWoundsOf(T))return;if(!(isOwner||tbShkMine(T)))return;const el=$('#tbaplm');if(!el)return;
 el.insertAdjacentHTML('afterend',` <button type="button" class="btn sm" id="tbasoak" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny and roll Vigor. Each success and raise takes back one wound from this hit.">🛡 Soak (${esc(tbBnTxt(T))})</button>`);
 $('#tbasoak').onclick=async e=>{const b=e.currentTarget;b.disabled=true;const msg=await tbSoak(tbAtk.t,oc.nw);$('#tbaplm').textContent=msg;const k=$('#tbasoak');if(k)k.remove()}}
function tbAtkDamage(){const C=tbAtkCalc(),res=tbAtk&&tbAtk.res;if(!C||!res||!res.ok)return;const A=C.A,T=tbTok(tbAtk.t),w=C.w;
 const D=tbAtkDmgDo(C,res);if(D.err){$('#tbar2').insertAdjacentHTML('beforeend',`<div class="warn">${esc(D.err)}</div>`);return}
 tbAtk.dmg=D;tbAtk.applied=false;tbAtkDmgShow();const ab=$('#tbabn');if(ab)ab.disabled=true;
 const ap=w.ap?` (AP ${w.ap} against armor ${C.T.arm||0})`:'';
 const body=D.list.length>1?D.list.map(x=>x.sum).join(', ')+' damage':D.list[0].sum+' damage';
 tbAtkFinish(`💥 **${tbName(A)}** hits **${tbName(T||{})}** with ${w.n}: ${body} vs Toughness ${D.eff}${ap} → ${D.oc.text}`,`${body} → ${D.oc.text}`,D.oc.none?false:null,tbAtk.t)}
async function tbAtkDmgBenny(){const C=tbAtkCalc(),old=tbAtk&&tbAtk.dmg,res=tbAtk&&tbAtk.res;if(!C||!old||!res||tbAtk.applied)return;const A=C.A,why=await tbBnSpend(A);if(why){$('#tbaplm').textContent=why;return}
 const D=tbAtkDmgDo(C,res);if(D.err){$('#tbaplm').textContent=D.err;return}const keep=D.total>=old.total?D:old;
 const note=`Benny reroll: new ${D.total} vs old ${old.total} → keeps ${keep.total}`;tbAtk.dmg=keep;tbAtkDmgShow(note);try{tbBar()}catch(e){}
 const T=tbTok(tbAtk.t);tbAtkFinish(`🔁 **${tbName(A)}** spends a Benny on the ${C.w.n} damage: new **${D.total}** vs old **${old.total}** → keeps **${keep.total}** vs Toughness ${keep.eff} → ${keep.oc.text}`,`Benny: ${keep.total} damage → ${keep.oc.text}`,keep.oc.none?false:null,tbAtk.t)}
// apply a hit to a token: a sheet gets wounds and statuses, a token with a health bar loses health, any other token gets a Stunned marker
async function tbApplyHit(tokId,hit){const T=tbTok(tokId);if(!T||!hit||hit.oc.none)return;const s=tbSheetOf(T),oc=hit.oc;
 if(T.vh&&!s&&typeof tbVhHit==='function'&&await tbVhHit(T,oc))return;
 if(s){const w0=+s.wounds||0,i0=s.inc?1:0,st0=(s.status||[]).slice();let w=w0+oc.nw,inc=i0,st=st0.slice(),wm=3;try{wm=shWM(s)}catch(e){}
  if(!st.includes('Shaken'))st.push('Shaken');if(w>wm){w=wm;if(!inc){inc=1}if(!st.includes('Incapacitated'))st.push('Incapacitated')}
  await db.doc('sheets/'+s.id).update({wounds:w,inc,status:st});
  undoBar(tbName(T)+': '+oc.text+'.',()=>db.doc('sheets/'+s.id).update({wounds:w0,inc:i0,status:st0}));return}
 await tbTokEdit([T],t=>{const o={},cnd=Array.isArray(t.cnd)?t.cnd.slice():[];if(!cnd.includes('stun')){cnd.push('stun');o.cnd=cnd}
  if(+t.mhp>0&&oc.nw){const hp=Math.max(0,(+t.hp||0)-oc.nw);o.hp=hp;if(hp<=0)o.mark='down'}else if(!(+t.mhp>0)&&oc.inc)o.mark='down';return o},'hit '+tbName(T));
 tbNote(tbName(T)+': '+oc.text)}
// a player's hit on a token they do not own: the GM sees it and can apply it
async function tbHitSend(tokId,hit){const m=tbCur();if(!m)return;const d={map:m.id,tok:tokId,hit:{dmg:hit.dmg,eff:hit.eff,w:hit.wname,oc:hit.oc},by:handle||'?',ts:Date.now()};
 try{await db.doc('tbping/h'+pid(uid||handle||'x')+Date.now().toString(36)).set(d)}catch(e){alert('Could not send: '+(e.message||e.code))}}
// the GM's list of hits waiting to be applied (stays until applied or dismissed)
function tbHitList(){const m=tbCur();if(!m)return [];return (pm.tbping||[]).filter(p=>p&&/^h/.test(String(p.id))&&!p.done&&p.map===m.id&&p.hit&&p.hit.oc&&Date.now()-(+p.ts||0)<36e5&&tbTok(p.tok))}
let tbHitGc={};
// the GM tidies away hits that were handled (or are over an hour old)
function tbHitSweep(){if(!isOwner)return;(pm.tbping||[]).forEach(p=>{if(!p||!/^h/.test(String(p.id))||tbHitGc[p.id])return;if(p.done||Date.now()-(+p.ts||0)>36e5){tbHitGc[p.id]=1;db.doc('tbping/'+p.id).delete().catch(()=>{})}})}
function tbHitChk(){tbHitSweep();let el=$('#tbhits');const L=isOwner&&$('#tbroot')?tbHitList():[];
 if(!L.length){if(el)el.remove();return}
 const sig=L.map(p=>p.id).join(',');if(!el){el=document.createElement('div');el.id='tbhits';document.body.appendChild(el)}if(el._s===sig)return;el._s=sig;
 el.innerHTML='<b>⚔ Hits waiting</b>'+L.map(p=>`<div class="tbhr"><span>${esc(p.by)}: <b>${esc(tbName(tbTok(p.tok)))}</b> takes ${esc(String(p.hit.dmg))} vs Toughness ${esc(String(p.hit.eff))} (${esc(p.hit.w||'')}) → ${esc(p.hit.oc.text)}</span><button class="btn sm grn" data-tbhit="a:${esc(p.id)}">Apply</button><button class="btn sm" data-tbhit="d:${esc(p.id)}">Dismiss</button></div>`).join('')}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-tbhit]');if(!b)return;const [a,id]=[b.dataset.tbhit.slice(0,1),b.dataset.tbhit.slice(2)],p=(pm.tbping||[]).find(x=>x&&x.id===id);if(!p)return;b.disabled=true;
 try{if(a==='a')await tbApplyHit(p.tok,{dmg:p.hit.dmg,eff:p.hit.eff,oc:p.hit.oc,wname:p.hit.w});await db.doc('tbping/'+id).update({done:1});p.done=1}catch(err){b.disabled=false;alert('Could not do that: '+(err.message||err.code||''))}tbHitChk()});
setInterval(()=>{try{tbHitChk()}catch(e){}},2500);
(function(){const st=document.createElement('style');st.id='tbatkcss';st.textContent=`.tbt.atkr{outline:3px solid #ffd60a;outline-offset:2px;box-shadow:0 0 16px #ffd60a;z-index:6}#tbview.tool-attack{cursor:crosshair}#tbhits{position:fixed;left:12px;bottom:12px;z-index:900;max-width:min(520px,calc(100vw - 24px));background:var(--panel,#10121c);border:2px solid #ff2d95;padding:8px 10px;font-size:13px}.tbhr{display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap}.tbhr span{flex:1;min-width:180px}`;document.head.appendChild(st)})();

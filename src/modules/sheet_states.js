// ---- Minimum Strength, on/off states (Liquid Courage, Terminally Ill, Habit, Weakness), defenses, Jack-of-all-Trades
(()=>{const E=k=>SW_EDGES.find(e=>e.k===k);['professional','expert'].forEach(k=>{const e=E(k);if(e&&!e.f)e.f='$skill die +1'});const m=E('master');if(m){m.o='text';m.m=1}})();
const swWild=tr=>{if(!sh||!tr)return 6;return (sh.edgeList||[]).some(e=>e.k==='master'&&String(e.opt||'').split(',').some(z=>{z=z.trim().toLowerCase();return z&&((tr.at&&SW_ATTN[tr.at]&&SW_ATTN[tr.at].toLowerCase()===z)||(tr.sk&&String(tr.sk).toLowerCase()===z))}))?10:6};
// --- Minimum Strength
const MS_RX=/Min\.?\s*Str(?:ength)?\.?\s*:?\s*d\s*(4|6|8|10|12)/i;
function msStrIdx(){const v=swAtVal(sh,'strength');let i=SW_DIES.indexOf(Math.min(12,v));if(i<0)i=0;return i+Math.max(0,v-12)+(coHas('soldier')?1:0)+(coHas('brawny')?1:0)}
const msStr=()=>{const n=msStrIdx();return n>4?12+(n-4):SW_DIES[n]};
const msSteps=min=>min?Math.max(0,SW_DIES.indexOf(+min)-msStrIdx()):0;
function msFind(name,info){let m=MS_RX.exec(String(info||''));if(m)return +m[1];const nm=String(name||'').replace(/\s*\(.*\)\s*$/,'').trim().toLowerCase();if(!nm)return 0;
 const it=invOf(sh.handle||sh.name).find(x=>String(x.name||'').toLowerCase()===nm);m=it&&MS_RX.exec(String(it.info||''));
 if(!m){const c=(typeof CATALOG!=='undefined'?CATALOG:[]).find(x=>String(x.n).toLowerCase()===nm);m=c&&MS_RX.exec(String(c.d||''))}
 return m?+m[1]:0}
const msOf=w=>+w.ms||msFind(w.n,'');
function msPen(w){if(!sh||sh.msOff)return{n:0,min:0};const min=msOf(w);return{n:msSteps(min),min}}
const shWXs=w=>{const p=msPen(w);return p.n?[['Min Str d'+p.min,-p.n]]:[]};
function msArmor(){if(!sh||sh.msOff)return{n:0,min:0};let best={n:0,min:0};invOf(sh.handle||sh.name).filter(x=>x.worn&&armInfo(x)).forEach(x=>{const min=msFind(x.name,x.info),n=msSteps(min);if(n>best.n)best={n,min}});return best}
function msSel(w,i,d){const a=msFind(w.n,''),p=msPen(w);return `<select data-sp="weapons.${i}.ms" ${d} title="Minimum Strength of this weapon. Leave on auto to read it from the gear text."><option value="">auto${a?' (d'+a+')':''}</option>${[4,6,8,10,12].map(n=>`<option value="${n}" ${+w.ms===n?'selected':''}>d${n}</option>`).join('')}</select>${p.n?` <b style="color:var(--mg)" title="Your Strength is below d${p.min}: −${p.n} to attacks">−${p.n}</b>`:''}`}
function shAttack(i){if(!shCan())return;const w=sh.weapons[i];let f=null;for(const k in sh.sk)sh.sk[k].forEach(x=>{if(x.n===(w.sk||'Shooting'))f=x});if(!f&&drRigOn())f={n:w.sk||'Shooting',d:0,m:0};if(!f)return alert('This sheet has no "'+(w.sk||'Shooting')+'" skill.');if(!amUse(i,1))return;shRoll(+f.d||4,f.m,(w.n||'Weapon')+' attack ('+f.n+')',!+f.d,true,{sk:f.n},shWXs(w))}
// --- states
const stHind=k=>(sh.hindList||[]).find(h=>h.k===k);
const stOn=k=>!!(sh&&sh.states&&sh.states[k]);
const ST_DEFS=[
 {k:'lc',t:'Drinking (Liquid Courage)',src:'Liquid Courage',has:()=>coHas('liquid_courage'),d:'For the hour after a stiff drink: Vigor one die type higher (and Toughness), ignore 1 wound penalty, −1 to Agility and Smarts rolls. Afterwards you take a level of Fatigue: tick that yourself.'},
 {k:'ti',t:'Symptoms acting up (Terminally Ill)',src:'Terminally Ill',has:()=>!!stHind('terminally_ill'),d:'You drew a face card at the start of the session: −1 to all trait rolls.'},
 {k:'hab',t:'Deprived of your fix (Habit)',src:'Habit (deprived)',has:()=>!!stHind('habit'),d:'Minor Habit: −1 to all trait rolls. Major Habit: −2.'},
 {k:'wk',t:'Hit by your Weakness',src:'Weakness',has:()=>!!stHind('weakness'),d:'The Take Damage box adds +4 damage (Minor) or doubles it (Major). You also resist that power at −4.'}];
function coFx(S){const out=[];if(!S||!S.states)return out;
 const has=k=>(S.edgeList||[]).some(e=>e.k===k),hd=k=>(S.hindList||[]).find(h=>h.k===k),add=(k,src,w,v)=>out.push({id:'st_'+k,i:out.length,src,w,v,t:'',ini:'',key:'st_'+k+'|'+out.length});
 if(S.states.lc&&has('liquid_courage')){const names=[...(S.sk.agility||[]),...(S.sk.smarts||[])].map(x=>x.n).filter(Boolean);add('lc','Liquid Courage',['^vigor'],1);add('lc','Liquid Courage',['#ignw'],1);add('lc','Liquid Courage',['@agility','@smarts',...names],-1)}
 if(S.states.ti&&hd('terminally_ill'))add('ti','Terminally Ill',['*'],-1);
 if(S.states.hab&&hd('habit'))add('hab','Habit (deprived)',['*'],hd('habit').sev==='M'?-2:-1);
 return out}
function stDraw(){const el=$('#shstates');if(!el||!sh)return;const L=ST_DEFS.filter(s=>s.has()),ro=!shCan(),j=coHas('jack_of_all_trades');
 if(!L.length&&!j){el.innerHTML='';return}
 const jt=sh.jat;
 el.innerHTML=`<div class="meta" style="margin-bottom:2px">STATES FROM YOUR EDGES AND HINDRANCES</div>`+L.map(s=>`<label class="fxchip ${stOn(s.k)?'on':''}" style="display:block;margin:2px 0" title="${esc(s.d)}"><input type="checkbox" data-sts="${s.k}" ${stOn(s.k)?'checked':''} ${ro?'disabled':''} style="width:auto"> <b>${esc(s.t)}</b> <span class="meta">${esc(s.d)}</span></label>`).join('')
  +(j?`<div style="margin:4px 0"><b style="color:var(--am)">Jack-of-all-Trades</b> ${jt?`<span class="meta">${esc(jt.n)} is d${jt.d} until you study something else.</span> <button class="btn sm" data-jat="clear" ${ro?'disabled':''}>Clear</button>`:'<span class="meta">No skill studied.</span>'} <button class="btn sm" data-jat="study" ${ro?'disabled':''}>Study a skill...</button></div>`:'');
 el.querySelectorAll('[data-sts]').forEach(c=>c.onchange=()=>{if(!shCan())return;shSet('states',{...(sh.states||{}),[c.dataset.sts]:c.checked});stDraw();try{fxBar()}catch(e){}shDerive()});
 el.querySelectorAll('[data-jat]').forEach(b=>b.onclick=()=>b.dataset.jat==='clear'?jatSet(null):jatModal())}
function jatFind(n){for(const k in sh.sk){const x=(sh.sk[k]||[]).find(v=>v.n===n);if(x)return x}return null}
function jatSet(n,d){if(!shCan())return;const old=sh.jat;if(old){const x=jatFind(old.n);if(x&&+x.d===+old.d){x.d=0;shDirty.add('sk')}}
 if(n){const x=jatFind(n);if(!x||+x.d)return alert('Pick a skill you have no dice in.');x.d=d;shDirty.add('sk');sh.jat={n,d}}else sh.jat=null;shDirty.add('jat');clearTimeout(shTimer);shTimer=setTimeout(shSave,700);shBuild()}
function jatModal(){const L=[];for(const k in sh.sk)(sh.sk[k]||[]).forEach(x=>{if(x.n&&!+x.d)L.push(x.n)});
 $('#modal').innerHTML=`<div class="modal"><div class="box"><h2>JACK-OF-ALL-TRADES</h2><div class="hint">Make a Smarts roll after an hour of study. Success gives the skill a d4, a raise gives d6. It lasts until you study a different subject. It only works on a skill you have no dice in.</div>
 <label>SKILL STUDIED</label><select id="jts">${[...new Set(L)].sort().map(n=>`<option>${esc(n)}</option>`).join('')}</select>
 <label>RESULT OF THE SMARTS ROLL</label><select id="jtd"><option value="4">Success: d4</option><option value="6">Raise: d6</option></select>
 <div style="margin-top:12px"><button class="btn grn" id="jtok">Apply</button> <button class="btn mg" id="jtcx">Cancel</button></div></div></div>`;
 $('#jtcx').onclick=()=>{$('#modal').innerHTML=''};$('#jtok').onclick=()=>{const n=$('#jts').value,d=+$('#jtd').value;$('#modal').innerHTML='';if(n)jatSet(n,d)}}
// --- defenses line on the sheet
function stDef(){const el=$('#shdef');if(!el||!sh)return;const L=[];
 if(coHas('dodge'))L.push('Ranged attacks against you are at −2 (Dodge)'+(coHas('improved_dodge')?'; you can Evade area effects':''));
 if(coHas('acrobat')){const nm=sh.handle||sh.name,it=invOf(nm),wt=it.reduce((a,x)=>a+(+x.w||0)*(x.qty||1),0),lim=+sh.wl||5*msStr(),why=[];if(wt>lim)why.push('Encumbrance');if(msArmor().n||(sh.weapons||[]).some(w=>msPen(w).n))why.push('Minimum Strength');
  L.push(why.length?'Acrobat is off: '+why.join(' and ')+' penalty':'Attacks against you are at −1 (Acrobat)')}
 el.innerHTML=L.length?'<span class="tag" style="color:var(--cy);border-color:var(--cy)">DEFENSES</span> '+L.map(esc).join(' · '):''}

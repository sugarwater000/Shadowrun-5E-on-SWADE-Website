// ---- Factions: standing for each runner, job effects, and reactions on the Job Board and contact cards
// Party standing (heat doc .standing) stays the base. Each runner can sit above or below it (heat doc .ps[sheetId]).
// A job can name a faction and what DONE or FAILED does to it. The GM confirms the change with one click.
const FC_MOD=v=>v<=-7?-4:v<=-3?-2:v<0?-1:v===0?0:v<=2?1:v<=6?2:3;
const FC_TXT=v=>v<=-7?'Hostile on sight. Expect a trap, a refusal or worse.':v<=-3?'They will not deal with you willingly.':v<0?'Wary and short with you.':v===0?'Business as usual.':v<=2?'Friendly enough.':v<=6?'Glad to see you. Better terms and tips.':'Inside help, discounts and favors.';
const fcSgn=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'0';
const fcClamp=n=>Math.max(-10,Math.min(10,Math.round(+n||0)));
const fcFacs=()=>(pm.heat||[]).filter(x=>x&&!x.deleted&&x.kind==='fac').sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const fcById=id=>id?fcFacs().find(f=>f.id===id):null;
function fcMine(){const L=(pm.sheets||[]).filter(s=>s&&!s.deleted&&!s.drone&&uid&&s.uid===uid);if(!L.length)return null;const p=prefs||{};return L.find(s=>s.id===p.homePc)||L.find(s=>s.id===p.pin)||L[0]}
const fcEff=(f,sid)=>fcClamp((+f.standing||0)+(sid?(+((f.ps||{})[sid])||0):0));
const fcFor=f=>{const m=fcMine();return fcEff(f,m&&m.id)};
const fcModTxt=v=>{const m=FC_MOD(v);return m?'social rolls with them '+fcSgn(m):'no modifier'};
function fcMatch(name){const n=String(name||'').toLowerCase().trim();if(n.length<3)return null;const L=fcFacs();return L.find(f=>String(f.name).toLowerCase()===n)||L.find(f=>{const fn=String(f.name).toLowerCase();return fn.includes(n)||n.includes(fn)})||null}
const fcColor=v=>v<=-3?'var(--red)':v<0?'var(--am)':v===0?'var(--dim)':'#39ff14';
const fcWord=f=>{const v=fcFor(f);return htFacName(v)+' '+fcSgn(v)};
// ---- Job Board
const fcJobEff=(j,st)=>{const o=[];const f=fcById(j.fac),g=fcById(j.fac2),w=+j.facw||0,l=+j.facl||0,w2=+j.fac2w||0;
 if(st==='Done'){if(f&&w)o.push({f,d:w});if(g&&w2)o.push({f:g,d:w2})}else if(st==='Failed'){if(f&&l)o.push({f,d:l})}return o};
const fcEffTxt=a=>a.map(e=>e.f.name+' '+fcSgn(e.d)).join(', ');
function fcJobBadge(j){const f=fcById(j.fac);if(!f)return '';const v=fcFor(f),c=fcColor(v);return badge(f.name+' '+fcSgn(v),c)}
function fcJobLines(j){const o=[],f=fcById(j.fac)||(j.patron?fcMatch((npcOf(j.patron)||{}).aff):null);
 if(f){const v=fcFor(f);o.push(['Faction',f.name+' · you are '+htFacName(v)+' ('+fcSgn(v)+') · '+fcModTxt(v)]);o.push(['Their attitude',FC_TXT(v)])}
 const w=fcJobEff(j,'Done'),l=fcJobEff(j,'Failed');
 if(w.length)o.push(['If done',fcEffTxt(w)]);if(l.length)o.push(['If failed',fcEffTxt(l)]);
 if(j.facApplied&&(j.facApplied===j.status||j.facApplied==='skip:'+j.status))o.push(['Faction changes',j.facApplied.startsWith('skip:')?'GM chose not to apply':'applied'+(j.facAt?' '+htWhen(j.facAt):'')]);
 return o}
function fcContactLines(c){const f=fcMatch(c.aff);if(!f)return [];const v=fcFor(f);return [['Faction attitude',f.name+': '+htFacName(v)+' ('+fcSgn(v)+') · '+fcModTxt(v)]]}
// jobs finished but not yet applied to the standings (GM only)
function fcPendingList(){if(!isOwner)return [];return (pm.jobs||[]).filter(j=>j&&!j.deleted&&(j.status==='Done'||j.status==='Failed')&&j.facApplied!==j.status&&j.facApplied!=='skip:'+j.status&&fcJobEff(j,j.status).length)}
function fcPending(){const L=fcPendingList();if(!L.length)return '';
 return `<div class="post" style="padding:10px 12px;margin-bottom:12px;border-color:var(--am)"><div style="color:var(--am)"><b>⚖ FACTION CHANGES WAITING (${L.length})</b></div><div class="meta" style="margin-bottom:6px">These jobs are finished and name a faction. Apply them to change the party standing, or skip.</div>`+
  L.map(j=>`<div class="row" style="cursor:default;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap"><span><b>${esc(j.title)}</b> <span class="tag" style="color:${stc(j.status)};border-color:${stc(j.status)}">${esc(j.status)}</span> <span class="meta">${esc(fcEffTxt(fcJobEff(j,j.status)))}</span></span><span><button class="btn sm grn" data-fcap="${j.id}">Apply</button> <button class="btn sm" data-fcsk="${j.id}">Skip</button></span></div>`).join('')+`</div>`}
async function fcApply(jid){if(!isOwner)return;const j=(pm.jobs||[]).find(x=>x.id===jid);if(!j)return;const eff=fcJobEff(j,j.status);if(!eff.length)return;
 const done=[];for(const e of eff){const u=await htWrite(e.f.id,'standing','fac',(+e.f.standing||0)+e.d,'Job: '+j.title+' ('+j.status+')',{name:e.f.name},true);if(u)done.push(u)}
 const prev=j.facApplied||'';try{await db.doc('jobs/'+jid).update({facApplied:j.status,facAt:Date.now()})}catch(er){alert('Could not save: '+(er.message||er.code))}
 undoBar('Faction standing updated: '+fcEffTxt(eff)+'.',async()=>{for(const u of done)await db.doc('heat/'+u.id).update(u.rb);await db.doc('jobs/'+jid).update({facApplied:prev,facAt:0})});render()}
async function fcSkip(jid){if(!isOwner)return;const j=(pm.jobs||[]).find(x=>x.id===jid);if(!j)return;try{await db.doc('jobs/'+jid).update({facApplied:'skip:'+j.status,facAt:Date.now()})}catch(er){alert('Could not save: '+(er.message||er.code))}render()}
// ---- Faction page: each runner's own standing
async function fcWritePs(fid,sid,delta,why,reset){if(!isOwner)return;const f=htDoc(fid),s=(pm.sheets||[]).find(x=>x.id===sid);if(!f||!s)return;
 const ps={...(f.ps||{})},old=+ps[sid]||0,party=+f.standing||0;let nv=reset?0:old+delta;nv=Math.max(-10-party,Math.min(10-party,nv));if(nv===old)return;
 if(nv===0)delete ps[sid];else ps[sid]=nv;
 const log=(f.log||[]).concat([{t:Date.now(),by:handle||'GM',f:'ps',who:s.name,d:nv-old,v:party+nv,why:String(why||'').slice(0,120)}]).slice(-40),rb={ps:f.ps||{},log:f.log||[]};
 try{await db.doc('heat/'+fid).update({ps,log})}catch(e){alert('Could not save: '+(e.message||e.code));return}
 undoBar(s.name+' with '+f.name+': '+htFacName(party+old)+' → '+htFacName(party+nv)+'.',()=>db.doc('heat/'+fid).update(rb));render()}
const fcOpen={};
function fcRow(f){const me=fcMine(),pcs=htPcs(),gm=isOwner,party=+f.standing||0;let o='';
 if(me){const v=fcEff(f,me.id);o+=`<div class="meta" style="margin-top:4px">YOU (${esc(me.name)}): <b style="color:${fcColor(v)}">${htFacName(v)} ${fcSgn(v)}</b> · ${esc(fcModTxt(v))}</div>`}
 if(pcs.length){o+=`<details data-fcd="r${esc(f.id)}" ${fcOpen['r'+f.id]?'open':''} style="margin-top:4px"><summary class="meta" style="cursor:pointer">each runner (${pcs.length})</summary>`+pcs.map(s=>{const adj=+((f.ps||{})[s.id])||0,v=fcEff(f,s.id);
  return `<div class="meta" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0"><span style="min-width:130px;color:var(--tx)">${esc(s.name)}</span>${htBar(v,-10,10)} <b style="color:${fcColor(v)}">${fcSgn(v)}</b> ${htFacName(v)}${adj?` <span title="Personal adjustment on top of the party standing">(${fcSgn(adj)} personal)</span>`:''}${gm?` <button class="btn sm" data-fcp="${esc(f.id)}|${esc(s.id)}|-1">−</button><button class="btn sm" data-fcp="${esc(f.id)}|${esc(s.id)}|1">+</button>${adj?`<button class="btn sm" data-fcpr="${esc(f.id)}|${esc(s.id)}">reset</button>`:''}`:''}</div>`}).join('')+`<div class="meta">Party standing ${fcSgn(party)} is the starting point for everyone. Personal changes sit on top of it.</div></details>`}
 const js=(pm.jobs||[]).filter(j=>j&&!j.deleted&&(j.fac===f.id||j.fac2===f.id));
 if(js.length)o+=`<details data-fcd="j${esc(f.id)}" ${fcOpen['j'+f.id]?'open':''} style="margin-top:4px"><summary class="meta" style="cursor:pointer">jobs that involve them (${js.length})</summary>`+js.map(j=>{const w=j.fac===f.id?[+j.facw||0,+j.facl||0]:[+j.fac2w||0,0];return `<div class="meta">${esc(j.title)} · ${esc(j.status||'')}${w[0]?' · done '+fcSgn(w[0]):''}${w[1]?' · failed '+fcSgn(w[1]):''}${j.facApplied===j.status?' · applied':''}</div>`}).join('')+`</details>`;
 return o}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-fcap],[data-fcsk],[data-fcp],[data-fcpr]');if(!t)return;
 if(t.dataset.fcap)return fcApply(t.dataset.fcap);if(t.dataset.fcsk)return fcSkip(t.dataset.fcsk);
 if(t.dataset.fcp){const [fid,sid,d]=t.dataset.fcp.split('|'),f=htDoc(fid),s=(pm.sheets||[]).find(x=>x.id===sid);if(!f||!s)return;htAsk(s.name+' with '+f.name+(+d>0?' up':' down'),+d,w=>fcWritePs(fid,sid,+d,w))}
 if(t.dataset.fcpr){const [fid,sid]=t.dataset.fcpr.split('|');fcWritePs(fid,sid,0,'Back to the party standing',true)}});
// ---- Job form: faction picker
function fcSelect(k,v){return `<select name="${k}"><option value="">None</option>${fcFacs().map(f=>`<option value="${esc(f.id)}" ${v===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select>`}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.fcd)fcOpen[d.dataset.fcd]=d.open},true);

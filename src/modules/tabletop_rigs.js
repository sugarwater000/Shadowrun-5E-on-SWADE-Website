// ---- Tabletop: drone and vehicle tokens, the line from a drone to its rigger, and the chase tracker.
// Drones are the drone sheets from the Drones section. A player can put their own on the map; the GM can put any.
// A vehicle token is linked to a vehicle in its owner's gear (token field vh = {s: sheet id, i: item id}); its damage lives on the owner's sheet (sheet.veh), so the sheet and the map always agree.
// The chase tracker (GM) keeps a list of tokens in order with the gap between each one and the one ahead. It is stored in tbmeta/chase and everyone can see it.
TB_K.vehicle=['Vehicle','#ff9f1c'];
const TB_GAP=[['Close','#ff3b3b'],['Short','#ff9f1c'],['Medium','#ffd60a'],['Long','#39ff14'],['Extreme','#4ad8ff']];
const tbShById=id=>id?(pm.sheets||[]).find(s=>s&&s.id===id&&!s.deleted)||null:null;
const tbMineSh=s=>!!s&&(isOwner||(!!uid&&s.uid===uid));
// ---- vehicles
function tbVhOf(t){if(!t||!t.vh||!t.vh.s||!t.vh.i)return null;const sheet=tbShById(t.vh.s);if(!sheet)return null;
 const it=invOf(sheet.handle||sheet.name).find(x=>x.id===t.vh.i&&x.cat==='Vehicles');if(!it)return null;
 const v=(sheet.veh&&sheet.veh[it.id])||{},st={w:Math.max(0,Math.min(4,+v.w||0)),wr:!!v.wr,h:v.h===''||v.h==null?null:+v.h,sk:v.sk||'',n:v.n||''};
 return {sheet,it,s:vhStats(it),st}}
const tbVhMine=t=>{const v=tbVhOf(t);return !!v&&tbMineSh(v.sheet)};
function tbVhSize(s){const n=parseInt(s&&s.size,10);return isNaN(n)?2:n<=2?1:n<=5?2:n<=8?3:4}
function tbVhEmoji(it){const t=(it.name||'')+' '+(it.sub||'');if(/bike|cycle|scooter|moped/i.test(t))return '🏍️';if(/truck|van|lorry|bus\b/i.test(t))return '🚚';const k=vhSkill(it);return k==='Piloting'?'🚁':k==='Boating'?'🚤':'🚗'}
// the numbers an attack window needs for a vehicle target: Toughness like "12 (4)" means 12 with 4 of armor
function tbVhTarget(t){const v=tbVhOf(t);if(!v)return null;const tg=String(v.s.tough||''),m=tg.match(/(\d+)(?:\s*\((\d+)\))?/);return {parry:4,tough:m?+m[1]:0,arm:m&&m[2]?+m[2]:0,wounds:v.st.w,known:!!m}}
async function tbVhPut(v,patch){const cur=(v.sheet.veh&&v.sheet.veh[v.it.id])||{},nv={...cur,...patch},all={...(v.sheet.veh||{}),[v.it.id]:nv};v.sheet.veh=all;
 await db.doc('sheets/'+v.sheet.id).update({veh:all});{const ae=document.activeElement;if(ae&&ae.closest&&ae.closest('#tbsel')&&ae.blur)ae.blur()}tbDraw();tbBar(tbCur())}
// a hit on a vehicle token: each wound is a level of damage, the fourth wrecks it
async function tbVhHit(t,oc){const v=tbVhOf(t);if(!v)return false;if(!oc||!oc.nw)return true;const w0=v.st.w,wr0=v.st.wr,w=Math.min(4,w0+oc.nw);
 await tbVhPut(v,{w,wr:w>=4?true:wr0});undoBar(tbName(t)+': '+oc.nw+' damage'+(w>=4?', WRECKED':'')+'.',()=>tbVhPut(v,{w:w0,wr:wr0}));return true}
function tbRigCls(t){const v=t&&t.vh?tbVhOf(t):null;return v&&v.st.wr?' wrk':''}
function tbRigBadge(t,px){let h='';const sh=tbSheetOf(t);if(sh&&sh.drone)h+='<span class="tbrg" title="Drone">🤖</span>';
 const v=t&&t.vh?tbVhOf(t):null;if(v){if(v.st.wr)h+='<span class="tbvd wr" title="Wrecked">WRECKED</span>';else if(v.st.w)h+=`<span class="tbvd" title="Vehicle damage ${v.st.w} of 4">🔧${v.st.w}</span>`}
 return h}
// ---- the lines: a drone to its rigger, and the chase order
function tbRigSvg(m,g){const rows=tbFogOn(m)?tbFogRows(m,g):null,T=tbToks(m),mid=t=>{const p=tbMid(t);return {x:g.ox+p.x*g.gs,y:g.oy+p.y*g.gs}},k=1/Math.max(.25,tbV.z);let h='';
 T.forEach(t=>{const s=tbSheetOf(t);if(!s||!s.drone||!s.owner||!tbSees(t,g,rows))return;const r=T.find(x=>x.sheet===s.owner&&x.id!==t.id);if(!r||!tbSees(r,g,rows))return;
  if(tbTokDist(t,r)<1.6)return;const a=mid(t),b=mid(r);
  h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#00f0d0" stroke-width="${Math.max(2,g.gs*.035)}" stroke-dasharray="${g.gs*.18} ${g.gs*.14}" stroke-opacity=".7"/>`});
 const c=tbChase();if(c){const L=(c.rows||[]).map(r=>({r,t:tbTok(r.tok)})).filter(x=>x.t&&x.t.map===m.id&&tbSees(x.t,g,rows));
  for(let i=1;i<L.length;i++){const a=mid(L[i-1].t),b=mid(L[i].t),gp=TB_GAP[Math.max(0,Math.min(4,+L[i].r.gap||0))],mx=(a.x+b.x)/2,my=(b.y+a.y)/2,fs=Math.max(12,g.gs*.26);
   h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${gp[1]}" stroke-width="${Math.max(3,g.gs*.06)}" stroke-dasharray="${g.gs*.35} ${g.gs*.2}" stroke-opacity=".85"/><text x="${mx}" y="${my}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${gp[1]}" stroke="#000" stroke-width="${fs*.28}" paint-order="stroke" stroke-linejoin="round">${esc(gp[0])}</text>`}}
 return h}
// ---- the selected-token panel
function tbRigPanel(L){if(!L||L.length!==1)return '';const t=L[0],s=tbSheetOf(t),m=tbCur();let h='';
 if(s&&s.drone){const r=tbShById(s.owner),rt=r&&tbToks(m).find(x=>x.sheet===r.id);let st=null;try{st=pgStats(s)}catch(e){}let wm=3;try{wm=shWM(s)}catch(e){}
  h+=`<div class="tbcw"><div class="meta">🤖 Drone</div><div>Rigged by <b>${esc(r?r.name||r.handle||'?':'(unknown)')}</b></div><div class="meta">Wounds ${Math.min(+s.wounds||0,wm)} of ${wm}${s.inc?' · INCAPACITATED':''}${st?' · Toughness '+st.tough+(st.arm?' (armor '+st.arm+')':''):''}</div>
  <div class="tbvb">${rt?`<button class="btn sm" data-tbx="rigsel:${esc(rt.id)}" title="Select the rigger's token">Select the rigger</button>`:''}<button class="btn sm" data-tbx="rigsh:${esc(s.id)}" title="Open the drone's sheet">Open the sheet</button></div></div>`}
 const v=t.vh?tbVhOf(t):null;
 if(t.vh&&!v)h+=`<div class="tbcw"><div class="meta">🚗 This vehicle is no longer in its owner's gear.</div></div>`;
 if(v){const can=tbMineSh(v.sheet),sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h,S=v.s;
  h+=`<div class="tbcw"><div class="meta">🚗 Vehicle · ${esc(v.sheet.name||'')}'s</div>
  <div class="meta">${[S.size!==''?'Size '+S.size:'',S.hand!==''||v.st.h!=null?'Handling '+(hd>0?'+':'')+hd:'',S.speed?'Top Speed '+S.speed:'',S.tough?'Toughness '+esc(S.tough):'',S.crew?'Crew '+esc(S.crew):''].filter(Boolean).join(' · ')||'No stat line in the gear entry.'}</div>
  <div class="tbvb"><span class="meta">Damage</span><button class="btn sm" data-tbx="vhw:-1" ${can?'':'disabled'} aria-label="Less damage">−</button><b style="min-width:44px;text-align:center;color:${v.st.w?'var(--red)':'var(--dim)'}">${v.st.wr?'WRECKED':v.st.w+' / 4'}</b><button class="btn sm" data-tbx="vhw:1" ${can?'':'disabled'} aria-label="More damage">+</button>
  <label class="tbck"><input type="checkbox" data-tbx="vhwr" ${v.st.wr?'checked':''} ${can?'':'disabled'}> Wrecked</label></div>
  <div class="tbvb"><button class="btn sm grn" data-tbx="vhroll" ${can&&!v.st.wr?'':'disabled'} title="Roll ${esc(sk)} for this vehicle with its Handling and damage">🎲 Roll ${esc(sk)}</button></div></div>`}
 return h}
TBX.rigsel=x=>{const t=tbTok(x);if(t){tbSel=t.id;tbTS=[t.id];tbDraw();tbBar(tbCur());tbCenter(t)}};
TBX.rigsh=x=>{const s=tbShById(x);if(s)portraitGoSheet(s.id)};
TBX.vhw=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet))return;const d=+x||0,w=Math.max(0,Math.min(4,v.st.w+d));if(w===v.st.w)return;const w0=v.st.w,wr0=v.st.wr;
 tbVhPut(v,{w,wr:w>=4?true:(d<0&&wr0&&w<4?false:wr0)}).then(()=>undoBar(tbName(t)+' damage '+w+' of 4.',()=>tbVhPut(v,{w:w0,wr:wr0}))).catch(e=>alert('Could not save: '+(e.message||e.code)))};
TBX.vhwr=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet))return;tbVhPut(v,{wr:!v.st.wr}).catch(e=>alert('Could not save: '+(e.message||e.code)))};
// ---- a driving roll with the real sheet rules
let tbVR=null;
TBX.vhroll=(x,m,t)=>{const v=t&&tbVhOf(t);if(!v||!tbMineSh(v.sheet)||v.st.wr)return;tbVR={t:t.id};const sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h,post=(()=>{try{return localStorage.getItem('sr_tbdp')!=='0'}catch(e){return true}})();
 $('#modal').innerHTML=`<div class="modal"><form id="tbvrf"><h2>🚗 ${esc(tbName(t))}: ${esc(sk)} roll</h2><div class="meta">${esc(v.sheet.name||'')} drives. Handling ${hd>0?'+':''}${hd}${v.st.w?', vehicle damage −'+v.st.w:''} are added for you, plus any wound penalties on the sheet.</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><div><label>TARGET NUMBER</label><input type="number" id="tbvtn" value="4" min="2" max="20" style="width:80px"></div><div><label>OTHER MODIFIER</label><input type="number" id="tbvom" value="0" style="width:80px"></div></div>
 <div style="margin:10px 0"><button type="button" class="btn grn" id="tbvgo">🎲 Roll</button> <label class="tbck" style="display:inline-block;margin-left:10px"><input type="checkbox" id="tbvdp" ${post?'checked':''}> Post to Discord</label></div><div id="tbvr"></div>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Close</button></div></form></div>`;
 $('#cx').onclick=closeM;$('#tbvgo').onclick=tbVhRoll};
async function tbVhRoll(){const t=tbVR&&tbTok(tbVR.t),v=t&&tbVhOf(t);if(!v)return;const tn=Math.max(2,Math.min(20,+$('#tbvtn').value||4)),om=+$('#tbvom').value||0,sk=v.st.sk||vhSkill(v.it),hd=v.st.h==null?(+v.s.hand||0):v.st.h;
 const xs=[];if(hd)xs.push(['Handling',hd]);if(v.st.w)xs.push(['Vehicle damage',-v.st.w]);if(om)xs.push(['Other',om]);
 const res=tbAs(v.sheet,S=>{let f=null;for(const k in S.sk)(S.sk[k]||[]).forEach(x=>{if(x.n===sk)f=x});if(!f)return {err:'This sheet has no "'+sk+'" skill.'};
  coChk();shOpt.mod=0;shOpt.tn=tn;shOpt.pen=true;const p=shPrep(+f.d||4,f.m,v.it.name+' ('+f.n+')',!+f.d,false,{sk:f.n},xs),o={title:p.title,sides:p.sides,mod:p.m,tn,wild:p.wild,ws:p.ws||6},r=shRes(o);r.rs=r.ok?Math.floor((r.fin-tn)/4):0;return r});
 if(res.err){$('#tbvr').innerHTML=`<div class="warn">${esc(res.err)}</div>`;return}
 $('#tbvr').innerHTML=`<div class="post" style="padding:8px 10px"><div style="font-size:16px"><b>${res.fin}</b> vs TN ${tn} — ${esc(res.line)}</div><div class="meta">${esc(res.detail)}</div></div>`;
 const p=$('#tbvdp')?$('#tbvdp').checked:true;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}
 const plain=`🚗 **${tbName(t)}** (${v.sheet.name||'?'}): `+res.plain;try{await dxRecord(plain,v.sheet.name||handle)}catch(e){}if(p){try{await dxPost(plain,v.sheet.name||handle)}catch(e){}}}
// ---- the add-to-map picker: the player's own drones and vehicles
function tbRigPick(m,q){const out=[];(pm.sheets||[]).filter(s=>s&&!s.deleted&&!s.drone&&sxVis(s)&&tbMineSh(s)).forEach(s=>{invOf(s.handle||s.name).filter(x=>x.cat==='Vehicles').forEach(it=>{
  if(q&&!((it.name||'')+' '+(s.name||'')).toLowerCase().includes(q))return;out.push({s,it})})});
 if(!out.length)return '';
 return `<div class="meta" style="margin:8px 0 2px">VEHICLES</div>`+out.map(x=>{const on=tbToks(m).some(t=>t.vh&&t.vh.i===x.it.id);return `<a class="row tbpr" data-tbpv="${esc(x.s.id)}|${esc(x.it.id)}"><span class="tbpi">${tbVhEmoji(x.it)}</span><div style="flex:1;min-width:0"><div class="t">${esc(x.it.name||'Vehicle')} ${x.s.uid===uid?'<span class="tag">yours</span>':''}</div><div class="meta">${esc([x.s.name,x.it.sub].filter(Boolean).join(' · '))}</div></div>${on?'<span class="meta">on the map · select</span>':'<span class="btn sm">Add</span>'}</a>`}).join('')}
function tbRigPickBind(el,m){el.querySelectorAll('[data-tbpv]').forEach(a=>a.onclick=async()=>{const [sid,iid]=a.dataset.tbpv.split('|'),s=tbShById(sid),it=s&&invOf(s.handle||s.name).find(x=>x.id===iid);if(!it)return;
  const ex=tbToks(m).find(t=>t.vh&&t.vh.i===iid);if(ex){tbSel=ex.id;closeM();return}
  try{const id=await tbAddTok(m,{kind:'vehicle',name:it.name||'Vehicle',emoji:tbVhEmoji(it),sz:tbVhSize(vhStats(it)),vh:{s:sid,i:iid}});tbSel=id;tbPOk('Added '+(it.name||'the vehicle')+'.');tbPBody()}catch(e){alert('Could not add: '+(e.message||e.code))}})}
// ---- chase tracker
function tbChase(){const c=(pm.tbmeta||[]).find(x=>x&&x.id==='chase');return c&&c.on?c:null}
async function tbChaseSave(patch){const o=(pm.tbmeta||[]).find(x=>x&&x.id==='chase')||{rows:[],round:1,on:0},doc={kind:'chase',on:('on' in patch?patch.on:o.on)?1:0,round:Math.max(1,+('round' in patch?patch.round:o.round)||1),rows:(('rows' in patch?patch.rows:o.rows)||[]).slice(0,12).map(r=>({tok:String(r.tok),gap:Math.max(0,Math.min(4,+r.gap||0))})),ts:Date.now(),by:handle||'GM'};
 const L=pm.tbmeta=pm.tbmeta||[],e=L.find(x=>x&&x.id==='chase');if(e)Object.assign(e,doc);else L.push({id:'chase',...doc});
 try{await db.doc('tbmeta/chase').set(doc)}catch(er){alert('Could not save the chase: '+(er.message||er.code))}tbBar(tbCur());tbRangeDraw()}
function tbChaseHtml(m){const c=tbChase(),T=c?(c.rows||[]).map(r=>({r,t:tbTok(r.tok)})).filter(x=>x.t):[];
 if(!c)return isOwner?`<div class="meta">A chase keeps a list of vehicles or runners in order, with the gap between each one and the one ahead. Select the tokens you want (the leader first) and press Start.</div><div class="tbvb"><button class="btn sm grn" data-tbx="chstart" title="Start a chase with the selected tokens">🏁 Start a chase with the selected tokens</button></div>`:'';
 const list=T.map((x,i)=>{const gp=TB_GAP[Math.max(0,Math.min(4,+x.r.gap||0))];
  return `<div class="tbchr"><span class="tbchn">${i+1}</span><a class="tbchname" data-tbx="rigsel:${esc(x.t.id)}">${esc(tbName(x.t))}</a>${i?`<span class="tbchgap" style="color:${gp[1]}">${isOwner?`<button class="btn sm" data-tbx="chgap:${i}:-1" aria-label="Closer">◀</button> `:''}<b>${gp[0]}</b>${isOwner?` <button class="btn sm" data-tbx="chgap:${i}:1" aria-label="Further">▶</button>`:''} <span class="meta">behind ${esc(tbName(T[i-1].t))}</span></span>`:'<span class="meta">in front</span>'}${isOwner?`<span class="tbchb"><button class="btn sm" data-tbx="chmv:${i}:-1" ${i?'':'disabled'} aria-label="Move up">▲</button><button class="btn sm" data-tbx="chmv:${i}:1" ${i<T.length-1?'':'disabled'} aria-label="Move down">▼</button><button class="btn sm mg" data-tbx="chrm:${i}" aria-label="Take out of the chase">✕</button></span>`:''}</div>`}).join('');
 return `<div class="tbvb"><b>🏁 Chase · round ${+c.round||1}</b></div>${list||'<div class="meta">Nobody in the chase.</div>'}${isOwner?`<div class="tbvb"><button class="btn sm" data-tbx="chadd" title="Add the selected tokens to the end of the list">＋ Add selected</button><button class="btn sm grn" data-tbx="chnext">Next round</button><button class="btn sm mg" data-tbx="chend">End the chase</button></div>`:''}`}
function tbChaseSync(m){const el=$('#tbchs');if(!el)return;const h=m?tbChaseHtml(m):'';tbSig(el,h);const d=el.closest('details');if(d)d.style.display=h?'':'none';const on=!!tbChase();if(on&&!tbChaseSync.was&&d){d.open=true;try{tbOpenS.chs=1}catch(e){}}tbChaseSync.was=on}
const tbChRows=()=>((tbChase()||{}).rows||[]).filter(r=>tbTok(r.tok)).map(r=>({...r}));
TBX.chstart=()=>{if(!isOwner)return;const S=tbSelToks();if(!S.length)return tbNote('Select the tokens first, the one in front first.');tbChaseSave({on:1,round:1,rows:S.map((t,i)=>({tok:t.id,gap:i?1:0}))})};
TBX.chadd=()=>{if(!isOwner)return;const R=tbChRows(),S=tbSelToks().filter(t=>!R.some(r=>r.tok===t.id));if(!S.length)return tbNote('Select tokens that are not in the chase yet.');tbChaseSave({rows:R.concat(S.map(t=>({tok:t.id,gap:1})))})};
TBX.chgap=(x,m,t,e,y)=>{if(!isOwner)return;const i=+x,R=tbChRows();if(!R[i]||!i)return;R[i].gap=Math.max(0,Math.min(4,R[i].gap+(+y||0)));tbChaseSave({rows:R})};
TBX.chmv=(x,m,t,e,y)=>{if(!isOwner)return;const i=+x,j=i+(+y||0),R=tbChRows();if(!R[i]||!R[j])return;[R[i],R[j]]=[R[j],R[i]];tbChaseSave({rows:R})};
TBX.chrm=x=>{if(!isOwner)return;const R=tbChRows();R.splice(+x,1);tbChaseSave(R.length>1?{rows:R}:{on:0,rows:[]})};
TBX.chnext=()=>{if(!isOwner)return;const c=tbChase();if(c)tbChaseSave({round:(+c.round||1)+1})};
TBX.chend=async()=>{if(!isOwner)return;if(!await ask('End the chase?','End it'))return;tbChaseSave({on:0,rows:[]})};
(function(){const st=document.createElement('style');st.id='tbrigcss';st.textContent=`.tbt .tbrg{position:absolute;left:-2px;top:-2px;font-size:13px;line-height:1;background:#000c;border-radius:6px;padding:1px 2px;z-index:3}.tbt .tbvd{position:absolute;right:-2px;bottom:-2px;font-size:11px;font-weight:700;background:#000d;color:#ff9f1c;border:1px solid #ff9f1c;border-radius:6px;padding:0 3px;z-index:3;white-space:nowrap}.tbt .tbvd.wr{color:#ff3b3b;border-color:#ff3b3b}.tbt.wrk .tbi{filter:grayscale(1) brightness(.55)}.tbchr{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}.tbchn{font-weight:700;min-width:18px}.tbchname{cursor:pointer;font-weight:700}.tbchb{margin-left:auto;display:inline-flex;gap:3px}.tbchgap{display:inline-flex;gap:3px;align-items:center;flex-wrap:wrap}`;document.head.appendChild(st)})();

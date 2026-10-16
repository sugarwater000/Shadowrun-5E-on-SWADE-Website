// ---- Tabletop extras: combat link, multi-select, status markers, auras, fog reveal + undo, look-here, GM notes, shared ruler.
// Loaded after p49_table.js. Functions only; nothing here runs at load except style + one timer.
const TB_CND=[['prone','🛌','Prone'],['stun','💫','Stunned'],['burn','🔥','Burning'],['bleed','🩸','Bleeding'],['pois','☠️','Poisoned'],['blind','🕶️','Blinded'],['slow','🐌','Slowed'],['fear','😱','Frightened'],['haste','⚡','Hasted'],['mark','🎯','Marked'],['inv','👻','Invisible'],['shield','🛡️','Shielded']];
const TB_AUR=[0,1,2,3,4,5,6,8,10,12];
let tbTurnSig=null,tbFollow=tbLS('sr_tbft','1')!=='0',tbRvN=tbNum(tbLS('sr_tbrv','4'),1,30,4),tbLookTs=0,tbLookMine=0,tbRulSent=0,tbFast=0,tbRemShown=false,tbIniSig='';
const tbCndOf=t=>Array.isArray(t.cnd)?t.cnd.filter(k=>TB_CND.some(c=>c[0]===k)):[];
const tbCndCan=t=>isOwner||!t.lock;
const tbIniOn=()=>{try{return !!iniM.active}catch(e){return false}};
// ---- which tokens are selected (tbSel is the main one; tbTS holds the whole group)
function tbSelNorm(){tbTS=tbTS.filter(id=>tbTok(id));if(!tbSel||!tbTok(tbSel)){tbTS=[]}else if(!tbTS.includes(tbSel))tbTS=[tbSel]}
const tbSelToks=()=>{tbSelNorm();return tbTS.map(tbTok).filter(Boolean)};
function tbSelPaint(){const tk=$('#tbtoks');if(tk)tk.querySelectorAll('.tbt').forEach(e=>e.classList.toggle('sel',tbTS.includes(e.dataset.tbt)));tbBar();tbRulDraw();tbRangeDraw()}
function tbSelToggle(id){tbSelNorm();const i=tbTS.indexOf(id);if(i>=0){tbTS.splice(i,1);if(tbSel===id)tbSel=tbTS[tbTS.length-1]||null}else{tbTS.push(id);tbSel=id}tbShS=[];tbSelPaint()}
function tbSelAllToks(){const m=tbCur();if(!m)return;const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null,L=tbToks(m).filter(t=>tbSees(t,g,rows));if(!L.length)return tbNote('No tokens on this map.');
 tbTS=L.map(t=>t.id);tbSel=tbTS[0];tbShS=[];tbSelPaint();tbNote(L.length+' token'+(L.length===1?'':'s')+' selected.')}
// ---- marquee (drag a box to select tokens)
function tbMqStart(e,p){tbMq={pid:e.pointerId,x0:p.x,y0:p.y,x1:p.x,y1:p.y,add:!!(e.shiftKey||e.ctrlKey||e.metaKey),moved:false};tbRulDraw()}
function tbMqMove(p){const Q=tbMq;if(!Q)return;Q.x1=p.x;Q.y1=p.y;if(Math.hypot(Q.x1-Q.x0,Q.y1-Q.y0)*tbV.z>5)Q.moved=true;tbRulDraw()}
function tbMqEnd(){const Q=tbMq;tbMq=null;const m=tbCur();if(!Q||!m){tbRulDraw();return}
 if(!Q.moved){if(!Q.add){tbSel=null;tbTS=[];tbShS=[];tbDraw()}tbRulDraw();return}
 const g=tbGeoM(m),x0=Math.min(Q.x0,Q.x1),x1=Math.max(Q.x0,Q.x1),y0=Math.min(Q.y0,Q.y1),y1=Math.max(Q.y0,Q.y1),rows=tbFogOn(m)?tbFogRows(m,g):null;
 const hit=tbToks(m).filter(t=>{if(!tbSees(t,g,rows))return false;const sz=Math.max(.5,+t.sz||1),l=g.ox+(+t.c||0)*g.gs,tp=g.oy+(+t.r||0)*g.gs,w=sz*g.gs;return l<x1&&l+w>x0&&tp<y1&&tp+w>y0});
 if(hit.length){const set=Q.add?new Set(tbSelToks().map(t=>t.id)):new Set();hit.forEach(t=>set.add(t.id));tbTS=[...set];tbSel=hit[hit.length-1].id;tbShS=[];tbSelPaint();tbNote(tbTS.length+' token'+(tbTS.length===1?'':'s')+' selected.')}
 else{const sh=tbShpAll(m).filter(s=>{const a=tbShpAnchor(s),x=g.ox+a.x*g.gs,y=g.oy+a.y*g.gs;return x>=x0&&x<=x1&&y>=y0&&y<=y1}).map(s=>s.id);
  if(sh.length){tbSel=null;tbTS=[];tbShpSelect(sh,Q.add)}else{if(!Q.add){tbSel=null;tbTS=[];tbShS=[]}tbDraw()}}
 tbRulDraw()}
function tbMqSvg(k){const Q=tbMq;if(!Q||!Q.moved)return '';const x=Math.min(Q.x0,Q.x1),y=Math.min(Q.y0,Q.y1);return `<rect x="${x}" y="${y}" width="${Math.abs(Q.x1-Q.x0)}" height="${Math.abs(Q.y1-Q.y0)}" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="${1.5*k}" stroke-dasharray="${6*k} ${4*k}"/>`}
// ---- moving, copying and removing several tokens at once
const tbPosSet=L=>Promise.all(L.map(o=>tbSet('tbtoks',o.id,{c:o.c,r:o.r,mv:Date.now(),mvby:handle||'?'})));
function tbPosHist(before,after,label){const key=before.map(o=>o.id).join(','),last=tbHist[tbHist.length-1];
 if(last&&last.grp===key&&Date.now()-last.at<1200){last.at=Date.now();last.redo=()=>tbPosSet(after);tbRedo.length=0;return}
 const op=tbHPush(label,()=>tbPosSet(before),()=>tbPosSet(after));op.grp=key;op.at=Date.now()}
// move a group by whole squares; the whole group stops at the edge of the map together
function tbGroupShift(L,dc,dr){const m=tbCur();if(!m||!L.length)return false;const g=tbGeoM(m);let lo=-1e9,hi=1e9,loR=-1e9,hiR=1e9;
 L.forEach(t=>{const need=Math.max(1,Math.ceil(+t.sz||1));lo=Math.max(lo,-(+t.c||0));hi=Math.min(hi,g.cols-need-(+t.c||0));loR=Math.max(loR,-(+t.r||0));hiR=Math.min(hiR,g.rows-need-(+t.r||0))});
 if(lo>hi||loR>hiR)return false;dc=Math.max(lo,Math.min(hi,dc));dr=Math.max(loR,Math.min(hiR,dr));if(!dc&&!dr)return false;
 const before=L.map(t=>({id:t.id,c:+t.c||0,r:+t.r||0})),after=before.map(o=>({id:o.id,c:o.c+dc,r:o.r+dr}));
 tbPosSet(after).catch(()=>{});tbPosHist(before,after,'move '+(L.length===1?(L[0].name||'a token'):L.length+' tokens'));return true}
function tbGroupDrop(d,t,m){const g=tbGeoM(m),sz=Math.max(.5,+t.sz||1),need=Math.max(1,Math.ceil(sz)),c=Math.round((parseFloat(d.el.style.left)-g.ox)/g.gs),r=Math.round((parseFloat(d.el.style.top)-g.oy)/g.gs);
 const L=d.group.map(o=>tbTok(o.id)).filter(Boolean);tbGroupShift(L,c-(+t.c||0),r-(+t.r||0));const tk=$('#tbtoks');if(tk)tk._h='';tbAuraDrag(null)}
function tbAuraDrag(id,dx,dy){const sv=$('#tbaura');if(!sv)return;if(id===null){sv.querySelectorAll('[transform]').forEach(e=>e.removeAttribute('transform'));return}
 const e=sv.querySelector('[data-au="'+id+'"]');if(e)e.setAttribute('transform','translate('+dx+' '+dy+')')}
async function tbRemoveMany(L,noAsk){L=L.filter(tbCanRm);if(!L.length)return tbNote('You can remove only your own character token.');if(L.length===1)return tbRemove(L[0],noAsk);
 if(!noAsk&&!await ask('Take '+L.length+' tokens off the map?','Remove'))return;
 const ids=L.map(t=>t.id),set=v=>Promise.all(ids.map(id=>tbSet('tbtoks',id,v?{deleted:true,delAt:Date.now()}:{deleted:false})));
 try{await set(true);tbSel=null;tbTS=[];const op=tbHPush('remove '+ids.length+' tokens',async()=>{await set(false);tbSel=ids[0];tbTS=ids.slice();tbShS=[]},()=>set(true));tbAfter();
  undoBar(ids.length+' tokens removed from the map.',async()=>{tbHDrop(op);await set(false);tbSel=ids[0];tbTS=ids.slice();tbShS=[];tbRedo.push(op);tbAfter()})}catch(e){alert('Could not remove: '+(e.message||e.code))}}
// a batch of field changes on tokens, with undo/redo. fnA(t) returns the fields to set.
async function tbTokEdit(L,fnA,label){const dflt=k=>k==='cnd'?[]:k==='mark'||k==='ac'?'':k==='ar'?0:false;
 const items=L.map(t=>{const a=fnA(t),b={};Object.keys(a).forEach(k=>{const v=t[k]===undefined?dflt(k):t[k];b[k]=Array.isArray(v)?v.slice():v});return {id:t.id,a,b}}).filter(it=>Object.keys(it.a).some(k=>JSON.stringify(it.a[k])!==JSON.stringify(it.b[k])));
 if(!items.length)return;const run=k=>Promise.all(items.map(it=>tbSet('tbtoks',it.id,it[k])));
 try{await run('a')}catch(e){alert('Could not save: '+(e.message||e.code));return}
 tbHPush(label,()=>run('b'),()=>run('a'));tbAfter()}
function tbGrpAct(a){const L=tbSelToks();if(!L.length)return;
 if(a==='copy')return tbTokCopy(false);if(a==='dup')return tbTokPaste(true);if(a==='rm')return tbRemoveMany(L);
 if(!isOwner)return;const n=L.length+' token'+(L.length===1?'':'s');
 if(a==='down'){const v=!L.every(t=>t.mark==='down');return tbTokEdit(L,t=>({mark:v?'down':''}),(v?'mark down ':'mark up ')+n)}
 if(a==='lock'){const v=!L.every(t=>t.lock);return tbTokEdit(L,t=>({lock:v}),(v?'lock ':'unlock ')+n)}
 if(a==='hide'){const v=!L.every(t=>t.hid);return tbTokEdit(L,t=>({hid:v}),(v?'hide ':'show ')+n)}}
// ---- status markers (conditions)
function tbCndToggle(key){const L=tbSelToks().filter(tbCndCan);if(!L.length)return tbNote('Select a token first.');const on=!L.every(t=>tbCndOf(t).includes(key)),nm=(TB_CND.find(c=>c[0]===key)||[0,0,key])[2].toLowerCase();
 tbTokEdit(L,t=>{const a=tbCndOf(t).filter(k=>k!==key);if(on)a.push(key);return {cnd:a}},(on?'add ':'remove ')+nm+(L.length>1?' on '+L.length+' tokens':''))}
function tbCndClear(){const L=tbSelToks().filter(tbCndCan);tbTokEdit(L,t=>({cnd:[]}),'clear markers')}
function tbCndHtml(t,px){const L=tbCndOf(t);if(!L.length)return '';const fs=Math.max(10,Math.round(px*.26)),show=L.slice(0,4),more=L.length-show.length;
 return `<span class="tbcn" style="font-size:${fs}px">${show.map(k=>`<i>${TB_CND.find(c=>c[0]===k)[1]}</i>`).join('')}${more>0?`<i class="tbcm">+${more}</i>`:''}</span>`}
function tbCndPanel(L){const ok=L.filter(tbCndCan);if(!ok.length)return '';const t0=ok[0],names=tbCndOf(t0).map(k=>TB_CND.find(c=>c[0]===k)[2]);
 return `<div class="tbcw"><div class="meta">Status markers (click to switch on or off):</div><div class="tbccs">${TB_CND.map(c=>{const n=ok.filter(t=>tbCndOf(t).includes(c[0])).length;return `<button class="tbcc${n===ok.length?' on':n?' part':''}" data-tbx="cnd:${c[0]}" title="${c[2]}${n&&n<ok.length?' (some of them)':''}">${c[1]}</button>`}).join('')}</div>${names.length&&ok.length===1?`<div class="meta">${esc(names.join(', '))}</div>`:''}${ok.some(t=>tbCndOf(t).length)?'<button class="btn sm" data-tbx="cndclr">Clear markers</button>':''}</div>`}
// ---- auras
function tbAuraPanel(L){const ok=L.filter(tbCndCan);if(!ok.length)return '';const m=tbCur(),su=+m.su||1,un=esc(m.un||'m'),t=ok[0],cur=+t.ar||0,col=tbColOk(t.ac)||'#00f0d0';
 return `<div class="tbcw"><div class="meta">Aura: a ring that follows the token</div><div class="tbvb"><select id="tbaur">${TB_AUR.map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n?n+' sq ('+tbFmt(n*su)+' '+un+')':'Off'}</option>`).join('')}</select><span class="tbsws">${TB_COLS.slice(0,8).map(c=>`<button class="tbswc ${cur&&col.toLowerCase()===c.toLowerCase()?'on':''}" style="background:${c}" data-tbx="aurc:${c.slice(1)}" title="Aura colour"></button>`).join('')}</span></div></div>`}
function tbAuraSet(n,col){const L=tbSelToks().filter(tbCndCan);if(!L.length)return;tbTokEdit(L,t=>{const o={};if(n!=null)o.ar=n;if(col)o.ac=col;if(col&&n==null&&!(+t.ar>0))o.ar=2;if(n&&!tbColOk(t.ac))o.ac='#00f0d0';return o},n===0?'switch off aura':'set aura')}
function tbAuraDraw(m,g,rows){const sv=$('#tbaura');if(!sv)return;sv.setAttribute('width',m.w);sv.setAttribute('height',m.h);
 const h=tbToks(m).filter(t=>(+t.ar||0)>0&&tbSees(t,g,rows)).map(t=>{const sz=Math.max(.5,+t.sz||1),R=(sz/2+Math.min(30,+t.ar))*g.gs,cx=g.ox+((+t.c||0)+sz/2)*g.gs,cy=g.oy+((+t.r||0)+sz/2)*g.gs,col=tbColOk(t.ac)||'#00f0d0',sw=Math.max(2,g.gs*.04);
  return `<circle data-au="${esc(t.id)}" cx="${cx}" cy="${cy}" r="${R}" fill="${col}" fill-opacity=".13" stroke="${col}" stroke-opacity=".9" stroke-width="${sw}" stroke-dasharray="${sw*3} ${sw*2}"/>`}).join('');
 if(sv._h!==h){sv._h=h;sv.innerHTML=h}}
// ---- fog: undo/redo and "reveal around a token"
function tbFogFromStr(s,g){const a=[];for(let r=0;r<g.rows;r++){const u=new Uint8Array(g.cols),str=String((s&&s[r])||'');for(let c=0;c<g.cols&&c<str.length;c++)u[c]=str.charCodeAt(c)===49?1:0;a.push(u)}return a}
async function tbFogCommit(m,before,a,label){const after=tbFogStr(a);await tbFogWrite(m,a);if(before.join('|')===after.join('|'))return;
 const put=s=>tbFogWrite(m,tbFogFromStr(s,tbGeoM(m)));tbHPush(label,()=>put(before),()=>put(after))}
async function tbRevealAround(L,n,val){const m=tbCur();if(!m||!isOwner||!L.length)return;
 if(!tbFogOn(m)){if(!await ask('Fog of war is off for this map. Turn it on first? The whole map starts hidden from the players, then this reveals the area around the token.','Turn on fog'))return;try{await db.doc('tbmaps/'+m.id).update({fog:true});m.fog=true}catch(e){return alert('Could not save: '+(e.message||e.code))}}
 const g=tbGeoM(m),a=tbFogRows(m,g).map(u=>u.slice()),before=tbFogStr(a);
 L.forEach(t=>{const sz=Math.max(.5,+t.sz||1),R=n+sz/2,cx=(+t.c||0)+sz/2,cy=(+t.r||0)+sz/2;
  for(let r=Math.max(0,Math.floor(cy-R-1));r<=Math.min(g.rows-1,Math.ceil(cy+R+1));r++)for(let c=Math.max(0,Math.floor(cx-R-1));c<=Math.min(g.cols-1,Math.ceil(cx+R+1));c++){if(Math.hypot(c+.5-cx,r+.5-cy)<=R+.001)a[r][c]=val?1:0}});
 await tbFogCommit(m,before,a,(val?'reveal ':'hide ')+n+' squares around '+(L.length===1?tbName(L[0]):L.length+' tokens'));tbDraw();tbNote((val?'Revealed ':'Hidden ')+n+' squares around '+(L.length===1?tbName(L[0]):L.length+' tokens')+'.')}
function tbRevealPanel(L){return `<div class="tbcw"><div class="meta">Fog around ${L.length>1?'these tokens':'this token'}:</div><div class="tbvb"><select id="tbrvn">${[1,2,3,4,5,6,8,10,12,15,20].map(n=>`<option value="${n}" ${tbRvN===n?'selected':''}>${n} sq</option>`).join('')}</select><button class="btn sm grn" data-tbx="rvl:1" title="Uncover the squares around the token (key R)">🌫 Reveal</button><button class="btn sm" data-tbx="rvl:0">Cover</button></div></div>`}
// ---- combat: the Initiative tracker on the table
const tbIniOf=t=>{try{return iniList().find(c=>!c.out&&((t.sheet&&c.sheet===t.sheet)||(!t.sheet&&!c.sheet&&String(c.name||'').toLowerCase()===String(t.name||'').toLowerCase())))||null}catch(e){return null}};
const tbTokForIni=(c,m)=>c&&m?tbToks(m).find(t=>(t.sheet&&c.sheet===t.sheet)||(!t.sheet&&!c.sheet&&String(c.name||'').toLowerCase()===String(t.name||'').toLowerCase()))||null:null;
function tbGoIni(id){document.body.classList.remove('menu');thread=null;board='__init';render();if(id){let n=0;const go=()=>{const el=document.querySelector('[data-ir="'+id+'"]');if(el){el.scrollIntoView({block:'center'});el.style.outline='2px solid var(--cy)';setTimeout(()=>{el.style.outline=''},2400)}else if(++n<6)setTimeout(go,150)};setTimeout(go,120)}}
function tbTurnFind(quiet){const m=tbCur(),c=tbIniCur();if(!m||!c)return false;const t=tbTokForIni(c,m);if(!t){if(!quiet)tbNote(c.name+" has no token on this map.");return false}
 const g=tbGeoM(m),rows=tbFogOn(m)?tbFogRows(m,g):null;if(!tbSees(t,g,rows))return false;tbCenter(t);return true}
function tbTurnChk(){let cur='';try{cur=iniM.active?iniM.cur+'|'+(iniM.round||1):''}catch(e){}
 if(tbTurnSig===null){tbTurnSig=cur;return}if(cur===tbTurnSig)return;tbTurnSig=cur;try{if(typeof tbShakeOffer==='function')tbShakeOffer(cur)}catch(e){}if(!cur||!tbFollow)return;const c=tbIniCur();if(c&&tbTurnFind(true))tbNote('⚔ '+c.name+"'s turn")}
function tbTurnHtml(){if(!tbIniOn())return '';const c=tbIniCur(),o=iniOrder(),i=o.findIndex(x=>x.id===iniM.cur),nx=i>=0?o[i+1]:null;
 return `<span>⚔ R${iniM.round||1} · <b>${esc(c?c.name:'?')}</b>${nx?` <span class="meta">→ ${esc(nx.name)}</span>`:''}</span><button class="btn sm" data-tbx="iniprev" title="Back one turn">◀</button><button class="btn sm grn" data-tbx="ininext" title="Next turn">Next ▶</button><button class="btn sm" data-tbx="turnfind" title="Move the view to whoever's turn it is">🎯</button>`}
function tbTurnDraw(){const el=$('#tbturn');if(!el)return;const h=tbTurnHtml();if(el._h!==h){el._h=h;el.innerHTML=h}el.classList.toggle('on',!!h)}
function tbCmbHtml(m){if(!tbIniOn())return `<div class="meta">No fight is running right now.</div><div class="tbvb"><button class="btn sm" data-tbx="iniopen">⚔ Open the Initiative tracker</button></div>`;
 const c=tbIniCur(),t=tbTokForIni(c,m),o=iniOrder(),i=o.findIndex(x=>x.id===iniM.cur);
 return `<div><b style="color:var(--am)">Round ${iniM.round||1}</b> · turn ${i>=0?i+1:'?'} of ${o.length}</div><div style="margin:3px 0"><b>${esc(c?c.name:'?')}</b> is up${c&&!t?' <span class="meta">(no token on this map)</span>':''}</div>
 <div class="tbvb"><button class="btn sm" data-tbx="iniprev">◀ Back</button><button class="btn sm grn" data-tbx="ininext">Next ▶</button><button class="btn sm" data-tbx="turnfind">🎯 Find</button><button class="btn sm" data-tbx="iniopen">Open tracker</button></div>
 <label class="tbck"><input type="checkbox" id="tbft" ${tbFollow?'checked':''}> Move my view to each new turn</label>`}
// ---- GM: look here, and notes pinned to the map
async function tbLookSend(x,y,z,mapId){const m=tbCur();if(!m||!isOwner)return;const ts=Date.now();tbLookMine=ts;tbLookTs=ts;tbPingFx({x,y,by:'Look here'});
 try{await db.doc('tbmeta/look').set({map:mapId||m.id,x:Math.round(x),y:Math.round(y),z:z||0,ts,by:handle||'GM'});tbNote("Sent: everyone's view moves to this spot.")}catch(e){alert('Could not send: '+(e.message||e.code))}}
function tbLookSendView(){const v=$('#tbview');if(!v)return;tbLookSend((v.clientWidth/2-tbV.x)/tbV.z,(v.clientHeight/2-tbV.y)/tbV.z,Math.round(tbV.z*1000)/1000)}
function tbLookChk(){const d=(pm.tbmeta||[]).find(x=>x&&x.id==='look');if(!d||!d.ts||d.ts===tbLookTs)return;if(d.ts===tbLookMine){tbLookTs=d.ts;return}
 const m=tbCur(),v=$('#tbview');if(Date.now()-d.ts>45000||isOwner){tbLookTs=d.ts;return}if(!m||!v||d.map!==m.id)return;tbLookTs=d.ts;
 if(+d.z>0)tbV.z=Math.max(.05,Math.min(5,+d.z));tbV.x=v.clientWidth/2-(+d.x||0)*tbV.z;tbV.y=v.clientHeight/2-(+d.y||0)*tbV.z;tbApply();tbPingFx({x:+d.x||0,y:+d.y||0,by:d.by||'GM'});tbNote('🔭 '+(d.by||'The GM')+': look here')}
const tbNotes=m=>m?(pm.tbmeta||[]).filter(x=>x&&x.kind==='note'&&!x.deleted&&x.map===m.id&&(isOwner||x.shown)).sort((a,b)=>(a.ts||0)-(b.ts||0)):[];
function tbNotesDraw(m){const el=$('#tbnotes');if(!el)return;const h=tbNotes(m).map(n=>`<div class="tbnp ${n.shown?'sh':'hd'}" data-tbn="${esc(n.id)}" style="left:${+n.x||0}px;top:${+n.y||0}px" title="${esc((n.title||'Note')+(n.shown?'':' (only you can see this)'))}">${n.shown?'📌':'🔒'}<span>${esc(n.title||'Note')}</span></div>`).join('');if(el._h!==h){el._h=h;el.innerHTML=h}}
async function tbNoteNew(x,y){const m=tbCur();if(!m||!isOwner)return;const doc={kind:'note',map:m.id,x:Math.round(x),y:Math.round(y),title:'',text:'',shown:false,by:handle||'GM',ts:Date.now()};
 try{const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);tbDraw();tbNoteOpen(r.id,true)}catch(e){alert('Could not add the note: '+(e.message||e.code))}}
function tbNoteOpen(id,isNew){const n=(pm.tbmeta||[]).find(x=>x&&x.id===id&&x.kind==='note'&&!x.deleted);if(!n)return;
 if(!isOwner){if(!n.shown)return;$('#modal').innerHTML=`<div class="modal"><h2>📌 ${esc(n.title||'Note')}</h2><div style="white-space:pre-wrap;margin:8px 0">${esc(n.text||'')}</div><div><button class="btn" id="cx">Close</button>${n.cb&&cbNodes().some(z=>z.id===n.cb)?' <button class="btn" id="tbnc">🕵 Open on the Clue Board</button>':''}</div></div>`;$('#cx').onclick=closeM;{const b=$('#tbnc');if(b)b.onclick=()=>{closeM();cbOpenNote(n.cb)}};return}
 $('#modal').innerHTML=`<div class="modal"><form id="tbnf"><h2>📌 MAP NOTE</h2><div class="hint">A note pinned to this spot on the map. Only you see it until you tick the box below.</div>
 <label>TITLE</label><input name="t" maxlength="60" value="${esc(n.title||'')}" placeholder="e.g. Hidden door, Guard patrol, Read aloud">
 <label>NOTE</label><textarea name="x" rows="5" maxlength="1500" placeholder="What is here? Traps, secrets, what to read to the players…">${esc(n.text||'')}</textarea>
 <label style="display:block;margin-top:8px"><input type="checkbox" name="s" ${n.shown?'checked':''} style="width:auto"> Show this note to the players</label>
 <label>CLUE BOARD NOTE (OPTIONAL)</label><select name="cb"><option value="">None</option>${cbNodes().map(z=>`<option value="${esc(z.id)}" ${n.cb===z.id?'selected':''}>${esc(z.title||'(untitled)')}</option>`).join('')}</select>
 <div style="margin-top:12px"><button class="btn grn" type="submit">Save</button> <button type="button" class="btn" id="cx">${isNew?'Discard':'Cancel'}</button> ${n.cb&&cbNodes().some(z=>z.id===n.cb)?'<button type="button" class="btn" id="tbnc">🕵 Open on the Clue Board</button> ':''}<button type="button" class="btn mg del" id="tbnd" style="float:right">Delete</button></div></form></div>`;
 $('#cx').onclick=()=>{if(isNew&&!n.title&&!n.text){tbSet('tbmeta',n.id,{deleted:true,delAt:Date.now()}).catch(()=>{})}closeM()};
 $('#tbnd').onclick=async()=>{if(!await ask('Delete this note?','Delete'))return;try{await tbSet('tbmeta',n.id,{deleted:true,delAt:Date.now()})}catch(e){alert('Could not delete: '+(e.message||e.code))}closeM()};
 $('#tbnf').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target);try{await tbSet('tbmeta',n.id,{title:String(f.get('t')||'').trim().slice(0,60),text:String(f.get('x')||'').trim().slice(0,1500),shown:!!f.get('s'),cb:String(f.get('cb')||'')})}catch(e){return alert('Could not save: '+(e.message||e.code))}closeM()};{const b=$('#tbnc');if(b)b.onclick=()=>{closeM();cbOpenNote(n.cb)}}}
function tbGmHtml(m){const N=tbNotes(m);
 return `<div class="tbvb"><button class="btn sm ${tbTool==='look'?'on':''}" data-tbx="ptool:${tbTool==='look'?'move':'look'}" title="Click a spot and every player's view moves there (key L)">🔭 Look here</button><button class="btn sm" data-tbx="looksend" title="Move every player's view and zoom to what you are looking at now">📡 Send my view</button><button class="btn sm ${tbTool==='note'?'on':''}" data-tbx="ptool:${tbTool==='note'?'move':'note'}" title="Click the map to pin a note (key N)">📌 Add note</button></div>
 ${tbWallPanel(m)}
 <div class="meta">${tbTool==='look'?'Click anywhere on the map to bring every player there.':tbTool==='note'?'Click the map where the note belongs.':'Notes you pin to the map stay hidden from players until you show them.'}</div>
 ${N.length?N.map(n=>`<div class="tbsr" data-tbnr="${esc(n.id)}"><span>${n.shown?'📌':'🔒'} ${esc(n.title||'Note')}</span><button class="btn sm" data-tbx="noterev:${esc(n.id)}" title="${n.shown?'Hide from players':'Show to players'}">${n.shown?'🙈':'👁'}</button><button class="btn sm" data-tbx="notectr:${esc(n.id)}" title="Move the view here">🎯</button><button class="btn sm" data-tbx="noteopen:${esc(n.id)}" title="Edit">✎</button></div>`).join(''):'<div class="meta">No notes on this map.</div>'}`}
// ---- shared ruler: others see your line while you drag it, and for a few seconds afterwards
function tbRulTx(fin){const R=tbRul,m=tbCur();if(!R||!m||(R.x0===R.x1&&R.y0===R.y1&&!(R.path||[]).length))return;const now=Date.now();if(!fin&&now-tbRulSent<600)return;tbRulSent=now;
 const id='r'+pid(uid||handle||'x'),d={map:m.id,x0:Math.round(R.x0),y0:Math.round(R.y0),x1:Math.round(R.x1),y1:Math.round(R.y1),by:handle||'?',ts:now,live:!fin,rt:tbRoute?1:0,pa:(R.path||[]).slice(0,10).flatMap(a=>[Math.round(a[0]),Math.round(a[1])])};
 try{db.doc('tbping/'+id).set(d).catch(()=>{})}catch(e){}}
function tbRemoteRulers(m,g,k){const me='r'+pid(uid||handle||'x'),now=Date.now();let h='';tbRemShown=false;
 (pm.tbping||[]).forEach(p=>{if(!p||!/^r/.test(String(p.id))||p.id===me||p.map!==m.id)return;const age=now-(+p.ts||0);if(p.live?age>7000:age>9000)return;
  tbRemShown=true;if(p.live&&age<5000)tbFast=now+8000;
  const pa=Array.isArray(p.pa)?p.pa:[],path=[];for(let i=0;i+1<pa.length&&path.length<10;i+=2)path.push([+pa[i]||0,+pa[i+1]||0]);
  const op=p.live?1:Math.max(.25,1-(age/9000)*.75);
  h+=`<g opacity="${op}">`+tbRulSvg({x0:+p.x0,y0:+p.y0,x1:+p.x1,y1:+p.y1,path,rt:!!p.rt},m,g,k,'#00f0d0',esc(p.by||'')+': ')+'</g>'});
 return h}
// ---- timers: turn follow, expiring rulers, quick polling while someone is measuring
setInterval(()=>{try{tbVisChk()}catch(e){}if(!$('#tbroot'))return;const before=tbTurnSig;tbTurnChk();let s='';try{s=iniM.active?iniM.cur+'|'+(iniM.round||1):''}catch(e){}if(tbTurnSig!==before||s!==tbIniSig){tbIniSig=s;tbDraw()}tbTurnDraw();if(tbRemShown&&!tbRul)tbRulDraw();
 if(Date.now()<tbFast&&!document.hidden&&typeof window.__poll==='function')window.__poll()},900);
// ---- looks
{const st=document.createElement('style');st.textContent=`
#tbaura{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.tbcn{position:absolute;left:-12%;right:-12%;top:-14%;display:flex;justify-content:center;pointer-events:none;z-index:3;line-height:1;white-space:nowrap}.tbcn i{font-style:normal;margin:0 -.03em;text-shadow:0 1px 2px #000,0 0 3px #000}.tbcn .tbcm{font-size:.7em;background:#000b;color:#fff;border-radius:3px;padding:0 .25em;align-self:center;margin-left:.15em}
.tbcw{border-top:1px solid var(--line);margin-top:8px;padding-top:6px}
#tbturn{position:absolute;left:8px;top:8px;z-index:8;display:none;gap:6px;align-items:center;background:rgba(5,8,12,.86);border:1px solid #ffd60a;padding:3px 8px;font-size:13px;max-width:calc(100% - 150px);flex-wrap:wrap}#tbturn.on{display:flex}#tbturn .btn{margin:0}
#tbnotes{position:absolute;left:0;top:0}.tbnp{position:absolute;pointer-events:auto;cursor:pointer;transform:translate(-8px,-100%) scale(var(--iz,1));transform-origin:8px 100%;font-size:24px;line-height:1;white-space:nowrap;z-index:5;filter:drop-shadow(0 1px 2px #000)}.tbnp span{font-size:12px;background:#0b1018;color:#fff;border:1px solid #ffd60a;padding:0 5px;margin-left:2px;vertical-align:middle}.tbnp.hd{opacity:.8}.tbnp.hd span{border-style:dashed;border-color:#9aa}
#tbview.tool-select,#tbview.tool-look,#tbview.tool-note{cursor:crosshair}
`;document.head.appendChild(st)}
// ---- the "selected token(s)" panel
function tbSelHtml(m){const L=tbSelToks();
 if(!L.length)return `<div class="meta">Click a token on the map or in the list above to see what you can do with it. To pick several: hold Shift and click them, or drag a box (hold Shift and drag, or use the ⬚ tool).</div>`;
 const B=(a,tx,c,tt)=>`<button class="btn sm ${c||''}" data-tbx="${a}"${tt?` title="${esc(tt)}"`:''}>${tx}</button>`;let head,btns;
 if(L.length===1){const t=L[0],k=TB_K[t.kind]||TB_K.prop,sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null,ci=tbIniOf(t);
  head=`<div><span class="tbk2" style="--k:${tbColOk(t.col)||k[1]}">${k[0]}</span> <b>${esc(tbName(t))}</b>${t.mark==='down'?' <span class="tag" style="color:var(--red);border-color:var(--red)">DOWN</span>':''}${t.lock?' <span class="tag">🔒 locked</span>':''}${t.hid?' <span class="tag" style="color:var(--am);border-color:var(--am)">hidden from players</span>':''}${t.temp?' <span class="meta">(encounter)</span>':''}${t.note?`<div class="meta" style="margin-top:3px">${esc(t.note)}</div>`:''}</div>`;
  btns=(sh&&sxVis(sh)?B('sheet','🧾 Open sheet'):'')+(isOwner||tbCanRm(t)?B('roll','🎲 Roll','','Roll dice for this token'):'')+B('cbpin','🕵 Clue note','','Pin this token to the Clue Board, or open its note')+(ci?B('ini','⚔ In tracker','','Jump to this character in the Initiative tracker')+(isOwner&&tbIniOn()&&iniM.cur!==ci.id?B('turn','▶ Their turn','','Make it this character\'s turn now'):''):'')+
   (isOwner?B('edit','Edit')+B('dup','Copy')+B('down',t.mark==='down'?'Revive':'💀 Down')+B('lock',t.lock?'Unlock':'🔒 Lock')+B('hide',t.hid?'Show':'🙈 Hide')+B('lib','📚 Save')+B('rm','Remove','mg del'):(tbCanRm(t)?B('rm','Remove','mg del'):''))}
 else{head=`<div><b>${L.length} tokens selected</b><div class="meta">${L.slice(0,4).map(t=>esc(tbName(t))).join(', ')}${L.length>4?' and '+(L.length-4)+' more':''}</div></div>`;
  btns=isOwner?B('grp:copy','Copy')+B('grp:dup','Duplicate')+B('grp:down','💀 Down or revive')+B('grp:lock','🔒 Lock or unlock')+B('grp:hide','🙈 Hide or show')+B('grp:rm','Remove','mg del'):(L.some(tbCanRm)?B('grp:rm','Remove mine','mg del'):'')}
 return `<div class="tbtb">${head}<div class="tbac">${btns}</div></div>`+(typeof tbFightPanel==='function'?tbFightPanel(L):'')+(typeof tbStatPanel==='function'?tbStatPanel(L):'')+tbCndPanel(L)+tbHpPanel(L)+tbAuraPanel(L)+tbMovePanel(L)+(typeof tbRngPanel==='function'?tbRngPanel(L):'')+(typeof tbAtkPanel==='function'?tbAtkPanel(L):'')+(typeof tbRigPanel==='function'?tbRigPanel(L):'')+(isOwner?tbVisPanel(L)+tbRevealPanel(L):'')+(L.length>1?`<div class="meta" style="margin-top:6px">Drag any of them to move the whole group. Arrow keys nudge the group.${isOwner?' Ctrl+C and Ctrl+V copy and paste it.':''}</div>`:'')}

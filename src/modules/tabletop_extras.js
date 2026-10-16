// ---- Tabletop extras, part two: health bars, saved views, image layers, fading markers, dice on the table, map export and import.
// Loaded after p53_tbmap.js. GM-only data (views, layers) lives in tbmeta; markers and dice results are short-lived tbping documents.
const TB_MIC=['🎯','🔍','👀','⚠️','❓','✅','🚪','⚔️'];
let tbLyEdit=null,tbLyD=null,tbMicon=tbLS('sr_tbmi','🎯'),tbMlab=tbLS('sr_tbml','');
const tbMetaOf=kind=>(pm.tbmeta||[]).filter(x=>x&&x.kind===kind&&!x.deleted);
// ---- health bars
const tbHpVis=t=>+t.mhp>0&&(isOwner||t.kind==='pc'||!!t.hpv);
const tbHpCan=t=>isOwner||(t.kind==='pc'&&tbCanRm(t));
function tbHpBar(t){if(!tbHpVis(t))return '';const mhp=+t.mhp,hp=Math.max(0,Math.min(mhp,+t.hp||0)),pc=hp/mhp,col=pc>.5?'#39ff14':pc>.25?'#ffb000':'#ff3b3b';
 return `<span class="tbhp" title="Health ${hp} / ${mhp}"><i style="width:${Math.round(pc*100)}%;background:${col}"></i></span><span class="tbhn">${hp}/${mhp}</span>`}
function tbHpPanel(L){const ok=L.filter(tbHpCan);if(!ok.length)return '';const t=ok[0],multi=ok.length>1;
 return `<div class="tbcw"><div class="meta">Health${multi?' (applies to each token)':''}${+t.mhp>0?'':': set a maximum to show a bar'}</div>
 <div class="tbvb">${multi?'':`<input type="number" id="tbhpc" min="0" value="${Math.max(0,+t.hp||0)}" style="width:62px" title="Current health"> <span class="meta">of</span> `}<input type="number" id="tbhpm" min="0" max="999" value="${+t.mhp||0}" style="width:62px" title="Maximum health"> <span class="meta">max</span></div>
 <div class="tbvb">${[-5,-1,1,5].map(n=>`<button class="btn sm" data-tbx="hp:${n}">${n>0?'+'+n:n}</button>`).join('')}<button class="btn sm" data-tbx="hp:full">Full</button></div>
 ${isOwner?`<label class="tbck"><input type="checkbox" id="tbhpv" ${t.hpv?'checked':''}> Show the bar to players</label>`:''}</div>`}
function tbHpAdd(n){const L=tbSelToks().filter(tbHpCan);if(!L.length)return;if(!L.some(t=>+t.mhp>0))return tbNote('Set a maximum health first.');
 const nm=L.length===1?tbName(L[0]):L.length+' tokens';
 tbTokEdit(L.filter(t=>+t.mhp>0),t=>({hp:n==='full'?+t.mhp:Math.max(0,Math.min(+t.mhp,(+t.hp||0)+n))}),n==='full'?'restore '+nm:n<0?'damage '+nm:'heal '+nm);
 if(n!=='full'){const t=L[0];if(L.length===1)tbNote(tbName(t)+': '+Math.max(0,Math.min(+t.mhp,(+t.hp||0)+n))+' / '+t.mhp)}}
function tbHpSet(field,v){const L=tbSelToks().filter(tbHpCan);if(!L.length)return;v=Math.max(0,Math.min(999,Math.round(+v||0)));
 if(field==='mhp')tbTokEdit(L,t=>({mhp:v,hp:+t.mhp>0?Math.min(+t.hp||0,v):v}),'set maximum health');
 else tbTokEdit(L.filter(t=>+t.mhp>0),t=>({hp:Math.min(v,+t.mhp)}),'set health')}
// ---- saved views (GM): jump to them, or send everyone there (switching the map if needed)
const tbViews=()=>tbMetaOf('view').sort((a,b)=>(a.ts||0)-(b.ts||0));
async function tbViewSave(name){const m=tbCur(),v=$('#tbview');if(!m||!v||!isOwner)return;name=String(name||'').trim().slice(0,40)||('View '+(tbViews().length+1));
 const doc={kind:'view',map:m.id,name,x:Math.round((v.clientWidth/2-tbV.x)/tbV.z),y:Math.round((v.clientHeight/2-tbV.y)/tbV.z),z:Math.round(tbV.z*1000)/1000,by:handle||'GM',ts:Date.now()};
 try{const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);const id=r.id,set=d=>tbSet('tbmeta',id,{deleted:d});tbHPush('save view '+name,()=>set(true),()=>set(false));tbNote('Saved "'+name+'".');tbBar()}catch(e){alert('Could not save: '+(e.message||e.code))}}
function tbViewGo(id){const w=tbMetaOf('view').find(x=>x.id===id),v=$('#tbview');if(!w||!v)return;
 if(!tbMaps().some(m=>m.id===w.map))return tbNote('That map is gone.');
 if(!tbCur()||tbCur().id!==w.map){tbVid=w.map;tbGrid=null;tbShown='';tbDraw()}
 tbV.z=Math.max(.05,Math.min(5,+w.z||1));tbV.x=v.clientWidth/2-(+w.x||0)*tbV.z;tbV.y=v.clientHeight/2-(+w.y||0)*tbV.z;tbApply()}
async function tbViewSend(id){const w=tbMetaOf('view').find(x=>x.id===id);if(!w||!isOwner)return;tbViewGo(id);
 try{const act=tbActive();if(!act||act.id!==w.map)await tbSetActive(w.map)}catch(e){}
 tbLookSend(+w.x||0,+w.y||0,+w.z||0,w.map)}
function tbViewDel(id){const w=tbMetaOf('view').find(x=>x.id===id);if(!w)return;const set=d=>tbSet('tbmeta',id,{deleted:d});set(true);tbHPush('delete view '+w.name,()=>set(false),()=>set(true));tbBar()}
// ---- image layers (GM): floor plans, handouts, overlays on top of the map picture
const tbLayers=m=>m?tbMetaOf('layer').filter(l=>l.map===m.id&&tbOk(l.img)).sort((a,b)=>(a.ts||0)-(b.ts||0)):[];
const tbLayer=id=>tbMetaOf('layer').find(l=>l.id===id)||null;
function tbLayersDraw(m){const el=$('#tbly');if(!el)return;const h=tbLayers(m).filter(l=>isOwner||l.shown).map(l=>`<img src="/_blob/${tbOk(l.img)}" alt="" draggable="false" style="position:absolute;max-width:none;left:${+l.x||0}px;top:${+l.y||0}px;width:${+l.w||100}px;height:${+l.h||100}px;opacity:${l.shown?Math.max(.05,Math.min(1,+l.op||1)):Math.min(.35,+l.op||1)};${l.shown?'':'outline:2px dashed #8899aa;'}">`).join('');
 if(el._h!==h){el._h=h;el.innerHTML=h}}
async function tbLyUpload(f){const m=tbCur();if(!f||!m||!isOwner)return;if(!assets)return alert('Uploading is not available right now. Try again in a moment.');tbNote('Uploading the picture…');
 try{const s=await tbShrink(f,2400,.86);if(!s.w||!s.h)throw {message:'That file is not a picture this browser can read.'};const up=await assets.upload(s.blob),w=Math.round(Math.min(m.w*.6,s.w)),h=Math.round(w*s.h/s.w);
  const doc={kind:'layer',map:m.id,name:String(f.name||'Layer').replace(/\.[a-z0-9]+$/i,'').slice(0,40)||'Layer',img:up.id,x:Math.round((m.w-w)/2),y:Math.round((m.h-h)/2),w,h,shown:false,op:1,by:handle||'GM',ts:Date.now()};
  const r=await db.collection('tbmeta').add(doc);tbLoc('tbmeta',r.id,doc);tbLyEdit=r.id;{const id=r.id,set=d=>tbSet('tbmeta',id,{deleted:d});tbHPush('add layer '+doc.name,()=>set(true),()=>set(false))}
  tbNote('Layer added. Drag it into place; it is hidden from players until you show it.');tbDraw()}catch(e){alert('Could not add the picture: '+(e.message||e.code||e))}}
function tbLySet(id,a,label){const l=tbLayer(id);if(!l)return;const b={};Object.keys(a).forEach(k=>{b[k]=l[k]});if(Object.keys(a).every(k=>a[k]===b[k]))return;
 const run=o=>tbSet('tbmeta',id,o);run(a);tbHPush(label,()=>run(b),()=>run(a));tbAfter()}
function tbLyHit(m,p){const l=tbLyEdit?tbLayer(tbLyEdit):null;if(!l||l.map!==m.id)return null;
 if(Math.hypot((l.x+l.w-p.x)*tbV.z,(l.y+l.h-p.y)*tbV.z)<=15)return 'rz';return (p.x>=l.x&&p.x<=l.x+l.w&&p.y>=l.y&&p.y<=l.y+l.h)?'mv':null}
function tbLyDown(m,p,e){const h=tbLyHit(m,p);if(!h)return false;const l=tbLayer(tbLyEdit);tbLyD={id:l.id,mode:h,sx:p.x,sy:p.y,orig:{x:l.x,y:l.y,w:l.w,h:l.h},pid:e.pointerId,moved:false};return true}
function tbLyMove(p){const D=tbLyD,l=D&&tbLayer(D.id),m=tbCur();if(!l||!m)return;D.moved=true;const dx=p.x-D.sx,dy=p.y-D.sy;
 if(D.mode==='mv'){l.x=Math.round(D.orig.x+dx);l.y=Math.round(D.orig.y+dy)}else{const w=Math.max(40,Math.round(D.orig.w+dx));l.w=w;l.h=Math.round(w*D.orig.h/D.orig.w)}
 tbLayersDraw(m);tbRulDraw()}
function tbLyEnd(){const D=tbLyD;tbLyD=null;if(!D)return;const l=tbLayer(D.id);if(!l||!D.moved)return tbRulDraw();const a={x:l.x,y:l.y,w:l.w,h:l.h};Object.assign(l,D.orig);tbLySet(D.id,a,D.mode==='mv'?'move a layer':'resize a layer')}
function tbLySvg(m,g,k){const l=tbLyEdit?tbLayer(tbLyEdit):null;if(!l||l.map!==m.id||!isOwner)return '';
 return `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="none" stroke="#ffd60a" stroke-width="${2*k}" stroke-dasharray="${8*k} ${5*k}"/><circle cx="${l.x+l.w}" cy="${l.y+l.h}" r="${7*k}" fill="#ffd60a" stroke="#000" stroke-width="${2*k}"/>`}
function tbLyPanel(m){const L=tbLayers(m);
 return `<div class="tbcw"><div class="meta"><b>Layers</b>: pictures on top of the map (floor plans, handouts, overlays). Hidden from players until you show them.</div>
 <div class="tbvb"><button class="btn sm grn" data-tbx="lyadd">⬆ Add a picture</button></div>
 ${L.map(l=>`<div class="tbsr${tbLyEdit===l.id?' sel':''}"><span>${l.shown?'👁':'🚫'} ${esc(l.name||'Layer')}</span><button class="btn sm" data-tbx="lyshow:${esc(l.id)}" title="${l.shown?'Hide from players':'Show to players'}">${l.shown?'🙈':'👁'}</button><button class="btn sm ${tbLyEdit===l.id?'on':''}" data-tbx="lyedit:${esc(l.id)}" title="Move and resize on the map">✥</button><button class="btn sm" data-tbx="lysolo:${esc(l.id)}" title="Show only this one">①</button><button class="btn sm" data-tbx="lyrm:${esc(l.id)}" title="Delete">✕</button></div>${tbLyEdit===l.id?`<div class="tbvb"><span class="meta">Opacity</span><input type="range" min="10" max="100" value="${Math.round((+l.op||1)*100)}" data-lyop="${esc(l.id)}" style="flex:1"></div>`:''}`).join('')||'<div class="meta">No layers on this map.</div>'}</div>`}
function tbLyAct(a,x){const l=tbLayer(x),m=tbCur();
 if(a==='lyadd'){const f=$('#tblyf');if(f){f.value='';f.onchange=()=>tbLyUpload(f.files&&f.files[0]);f.click()}return}
 if(!l)return;
 if(a==='lyshow')return tbLySet(x,{shown:!l.shown},l.shown?'hide a layer':'show a layer');
 if(a==='lyedit'){tbLyEdit=tbLyEdit===x?null:x;tbRulDraw();tbBar();return}
 if(a==='lysolo'){const L=tbLayers(m),run=v=>Promise.all(L.map(q=>tbSet('tbmeta',q.id,{shown:v[q.id]}))),b={},n={};L.forEach(q=>{b[q.id]=!!q.shown;n[q.id]=q.id===x});run(n);tbHPush('show one layer',()=>run(b),()=>run(n));tbAfter();return}
 if(a==='lyrm'){const set=d=>tbSet('tbmeta',x,{deleted:d});set(true);if(tbLyEdit===x)tbLyEdit=null;tbHPush('delete a layer',()=>set(false),()=>set(true));tbAfter()}}
// ---- markers anyone can drop ("checking here", "target"); they fade by themselves
async function tbMarkPlace(p){const m=tbCur();if(!m)return;const g=tbGeoM(m),s=tbSnapC(g,p),id='k'+pid(uid||handle||'x'),d={map:m.id,x:Math.round(s.x),y:Math.round(s.y),ic:tbMicon,lb:String(tbMlab||'').slice(0,24),by:handle||'?',ts:Date.now(),ttl:25000};
 try{await db.doc('tbping/'+id).set(d)}catch(e){}tbMarksDraw()}
function tbMarkClear(all){const me='k'+pid(uid||handle||'x');(pm.tbping||[]).forEach(p=>{if(p&&/^k/.test(String(p.id))&&(all?isOwner:p.id===me)){p.ts=0;db.doc('tbping/'+p.id).update({ts:0}).catch(()=>{})}});tbMarksDraw()}
function tbMarksDraw(){const el=$('#tbmarks'),m=tbCur();if(!el)return;const now=Date.now(),g=m?tbGeoM(m):null;let h='';
 if(m)(pm.tbping||[]).forEach(p=>{if(!p||p.map!==m.id)return;const age=now-(+p.ts||0),id=String(p.id);
  if(/^k/.test(id)){const ttl=+p.ttl||25000;if(age<0||age>ttl)return;const op=age>ttl-5000?Math.max(.05,(ttl-age)/5000):1;
   h+=`<div class="tbmk" style="left:${+p.x||0}px;top:${+p.y||0}px;opacity:${op.toFixed(2)}"><b>${esc(p.ic||'🎯')}</b><span>${esc((p.lb?p.lb+' · ':'')+(p.by||''))}</span></div>`}
  else if(/^d/.test(id)){if(age<0||age>9000)return;const t=tbTok(p.tok);if(!t)return;const sz=Math.max(.5,+t.sz||1),op=age>7000?(9000-age)/2000:1;
   h+=`<div class="tbdr ${p.good===true?'ok':p.good===false?'bad':''}" style="left:${g.ox+((+t.c||0)+sz/2)*g.gs}px;top:${g.oy+(+t.r||0)*g.gs}px;opacity:${op.toFixed(2)}">${esc(p.text||'')}</div>`}});
 if(el._h!==h){el._h=h;el.innerHTML=h}}
function tbMarkPanel(){return `<div class="tbcw"><div class="meta">Markers: press 🏷 (key K) and click a square to drop one. It fades after about 25 seconds. You have one at a time.</div>
 <div class="tbsws">${TB_MIC.map(c=>`<button class="tbcc${tbMicon===c?' on':''}" data-tbx="mic:${c}" aria-label="Marker icon ${c}">${c}</button>`).join('')}</div>
 <div class="tbvb"><input id="tbmlb" maxlength="24" placeholder="Label (optional), e.g. checking the door" value="${esc(tbMlab)}" style="flex:1"></div>
 <div class="tbvb"><button class="btn sm" data-tbx="mclr">Clear mine</button>${isOwner?'<button class="btn sm" data-tbx="mclra">Clear all</button>':''}</div></div>`}
// ---- dice rolled from a token: the result floats over it and goes to the table roll log (and Discord)
function tbRollOpen(t){if(!t||!(isOwner||tbCanRm(t)))return;const nm=tbName(t),pc=t.kind==='pc'||!!t.sheet;let post=true;try{post=localStorage.getItem('sr_tbdp')!=='0'}catch(e){}
 const dd=(id,sel)=>`<select id="${id}">${[4,6,8,10,12].map(n=>`<option value="${n}" ${n===sel?'selected':''}>d${n}</option>`).join('')}</select>`;
 $('#modal').innerHTML=`<div class="modal"><form id="tbrf"><h2>🎲 ROLL FOR ${esc(nm.toUpperCase())}</h2>
 <div class="hint">The result floats over the token, goes into the table roll log, and can be posted to Discord. Savage Worlds style, like the Dice Roller.</div>
 <h3 style="margin:8px 0 2px;font-size:14px">TRAIT ROLL</h3><input id="tbrl" placeholder="What is it for? e.g. Shooting" maxlength="40">
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>TRAIT DIE</label>${dd('tbrd',8)}</div><div><label>MODIFIER</label><input type="number" id="tbrm" value="0" style="width:80px"></div><div><label>TARGET #</label><input type="number" id="tbrt" value="4" style="width:80px"></div></div>
 <label class="tbck"><input type="checkbox" id="tbrw" ${pc?'checked':''}> Wild Die (d6)</label>
 <div style="margin:8px 0"><button class="btn grn" type="button" id="tbrgo">Roll trait</button></div>
 <h3 style="margin:8px 0 2px;font-size:14px">DAMAGE ROLL</h3>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div><label>DICE</label><input type="number" id="tbrc" value="2" min="1" max="20" style="width:70px"></div><div><label>DIE</label>${dd('tbrs',6)}</div><div><label>MODIFIER</label><input type="number" id="tbrx" value="0" style="width:80px"></div></div>
 <label class="tbck"><input type="checkbox" id="tbra" checked> Dice ace (explode on the highest number)</label>
 <div style="margin:8px 0"><button class="btn grn" type="button" id="tbrgd">Roll damage</button></div>
 <label class="tbck"><input type="checkbox" id="tbrp" ${post?'checked':''}> Also post to Discord</label>
 <div style="margin-top:10px"><button type="button" class="btn" id="cx">Cancel</button></div></form></div>`;
 $('#cx').onclick=closeM;
 const fin=async(plain,short,good)=>{const p=$('#tbrp').checked;try{localStorage.setItem('sr_tbdp',p?'1':'0')}catch(e){}closeM();
  try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
  const m=tbCur();if(m){const d={map:m.id,tok:t.id,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}tbMarksDraw()}};
 $('#tbrgo').onclick=()=>{const sides=+$('#tbrd').value,mod=parseInt($('#tbrm').value)||0,tn=parseInt($('#tbrt').value)||4,wildOn=$('#tbrw').checked,title=$('#tbrl').value.trim()||'Trait Roll';
  const trait=dxDie(sides,true),wild=wildOn?dxDie(6,true):null,best=wild?Math.max(trait.total,wild.total):trait.total,total=best+mod,crit=wild?(trait.raw===1&&wild.raw===1):false;let line,good;
  if(crit){line='Critical Failure! ⚠️';good=false}else if(total>=tn){const rs=Math.floor((total-tn)/4);line=rs>0?`Success! 🎯 with ${rs} Raise${rs>1?'s':''}! ${'⬆️'.repeat(rs)}`:'Success! 🎯';good=true}else{line='Failure. ❌';good=false}
  const dt=wild?`Trait(d${sides}): ${dxF(trait)} | Wild(d6): ${dxF(wild)}`:`Trait(d${sides}): ${dxF(trait)}`;
  fin(`🎲 **${title}** (d${sides}${wildOn?'+Wild d6':''}${mod?(mod>0?'+'+mod:mod):''}) — ${dt} → **${total}** vs TN ${tn} — ${line}`,`${title}: ${total} vs ${tn} · ${line.replace(/ [^\x00-\x7F]+/g,'').replace(/[^\x00-\x7F]+/g,'')}`,good)};
 $('#tbrgd').onclick=()=>{const sides=+$('#tbrs').value,count=Math.max(1,Math.min(20,parseInt($('#tbrc').value)||1)),mod=parseInt($('#tbrx').value)||0,ace=$('#tbra').checked,dice=Array.from({length:count},()=>dxDie(sides,ace)),sum=dice.reduce((a,d)=>a+d.total,0)+mod,lab=count+'d'+sides+(mod?(mod>0?'+'+mod:mod):'');
  fin(`💥 **Damage Roll** (${lab}) — ${count}d${sides}: ${dice.map(dxF).join(', ')} → **${sum}** total damage`,`Damage ${lab}: ${sum}`,null)}}
// ---- export and import of a whole prepared map (GM)
const tbB64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsDataURL(blob)});
async function tbMapExport(){const m=tbCur();if(!m||!isOwner)return;tbNote('Packing the map…');
 try{const blobs={},want=id=>{id=tbOk(id);if(id)blobs[id]=null;return id},
  toks=tbToks(m).map(t=>{const sh=t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null;return {kind:t.kind==='pc'&&!t.sheet?'pc':t.kind,name:tbName(t),img:want((sh&&sh.img)||t.img),emoji:t.emoji||'',col:t.col||'',sz:t.sz||1,c:t.c||0,r:t.r||0,hid:!!t.hid,lock:!!t.lock,mark:t.mark||'',note:t.note||'',temp:!!t.temp,ar:+t.ar||0,ac:t.ac||'',vr:+t.vr||0,spd:+t.spd||0,hp:+t.hp||0,mhp:+t.mhp||0,hpv:!!t.hpv,cnd:tbCndOf(t)}}),
  lay=tbLayers(m).map(l=>({name:l.name,img:want(l.img),x:l.x,y:l.y,w:l.w,h:l.h,shown:!!l.shown,op:+l.op||1})),mimg=want(m.img),fg=(pm.tbfog||[]).find(f=>f&&f.id===m.id);
  const out={app:'srbbs-map',v:1,exported:new Date().toISOString(),map:{name:m.name,w:m.w,h:m.h,gs:m.gs,gx:m.gx||0,gy:m.gy||0,grid:m.grid!==false,gc:m.gc||'l',su:m.su||1,un:m.un||'m',fog:!!m.fog,av:m.av!==false,img:mimg},
   fog:fg&&Array.isArray(fg.rows)?fg.rows:[],tokens:toks,layers:lay,walls:tbWalls(m).map(w=>({...w})),
   shapes:tbShpAll(m).map(s=>{const o=tbShpPlain(s);o.by=s.by||'';return o}),notes:tbMetaOf('note').filter(n=>n.map===m.id).map(n=>({x:n.x,y:n.y,title:n.title||'',text:n.text||'',shown:!!n.shown})),
   views:tbViews().filter(v=>v.map===m.id).map(v=>({name:v.name,x:v.x,y:v.y,z:v.z})),blobs:{}};
  for(const id of Object.keys(blobs)){const r=await fetch('/_blob/'+id);if(!r.ok)continue;out.blobs[id]=await tbB64(await r.blob())}
  const txt=JSON.stringify(out),url=URL.createObjectURL(new Blob([txt],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(String(m.name||'map').replace(/[^\w\- ]+/g,'').trim()||'map')+'.srmap.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},800);
  tbNote('Exported '+Math.round(txt.length/1024)+' KB.')}catch(e){alert('Could not export: '+(e.message||e))}}
async function tbMapImport(f){if(!f||!isOwner)return;if(!assets)return alert('Uploading is not available right now. Try again in a moment.');if(f.size>90e6)return alert('That file is too large.');
 let d;try{d=JSON.parse(await f.text())}catch(e){return alert('That is not a map file.')}
 if(!d||d.app!=='srbbs-map'||!d.map||!d.map.img||!d.blobs)return alert('That is not a map file exported from here.');
 tbNote('Importing the map…');
 try{const ids={},up=async id=>{if(!id||!d.blobs[id])return '';if(ids[id])return ids[id];const r=await fetch(d.blobs[id]),b=await r.blob(),u=await assets.upload(b);ids[id]=u.id;return u.id};
  const M=d.map,mimg=await up(M.img);if(!mimg)throw {message:'The map picture is missing from the file.'};
  const doc={name:String(M.name||'Imported map').slice(0,60),img:mimg,w:+M.w,h:+M.h,gs:Math.max(8,+M.gs||50),gx:+M.gx||0,gy:+M.gy||0,grid:M.grid!==false,gc:TB_GC[M.gc]?M.gc:'l',su:+M.su||1,un:String(M.un||'m').slice(0,8),fog:!!M.fog,av:M.av!==false,by:handle||'GM',ts:Date.now()};
  if(!(doc.w>0&&doc.h>0))throw {message:'The map size in the file is not valid.'};
  const r=await db.collection('tbmaps').add(doc);tbLoc('tbmaps',r.id,doc);const mid=r.id;
  if(Array.isArray(d.fog)&&d.fog.length)await db.doc('tbfog/'+mid).set({rows:d.fog.map(x=>String(x).replace(/[^01]/g,'')),ts:Date.now(),by:handle||'GM'});
  const now=Date.now();let i=0;
  for(const t of (d.tokens||[]).slice(0,400)){const img=await up(t.img);await db.collection('tbtoks').add({map:mid,kind:TB_K[t.kind]?t.kind:'prop',name:String(t.name||'Token').slice(0,60),img,emoji:String(t.emoji||'').slice(0,8),col:tbColOk(t.col),sheet:'',sz:Math.max(.5,Math.min(8,+t.sz||1)),c:Math.max(0,+t.c||0),r:Math.max(0,+t.r||0),temp:!!t.temp,hid:!!t.hid,lock:!!t.lock,mark:t.mark==='down'?'down':'',note:String(t.note||'').slice(0,200),
    ar:Math.max(0,Math.min(30,+t.ar||0)),ac:tbColOk(t.ac),vr:Math.max(0,Math.min(40,+t.vr||0)),spd:Math.max(0,Math.min(60,+t.spd||0)),hp:Math.max(0,+t.hp||0),mhp:Math.max(0,+t.mhp||0),hpv:!!t.hpv,cnd:(Array.isArray(t.cnd)?t.cnd:[]).filter(k=>TB_CND.some(c=>c[0]===k)),by:handle||'GM',uid:uid||'',ts:now+(i++)})}
  if((d.walls||[]).length)await db.doc('tbmeta/w'+mid).set({kind:'walls',map:mid,items:d.walls.slice(0,1500).map(w=>({x0:+w.x0||0,y0:+w.y0||0,x1:+w.x1||0,y1:+w.y1||0,t:w.t==='d'?'d':'w',...(w.t==='d'?{o:w.o?1:0,l:w.l?1:0}:{})})),ts:now});
  for(const n of (d.notes||[]).slice(0,200))await db.collection('tbmeta').add({kind:'note',map:mid,x:+n.x||0,y:+n.y||0,title:String(n.title||'').slice(0,60),text:String(n.text||'').slice(0,1500),shown:!!n.shown,by:handle||'GM',ts:now+(i++)});
  for(const v of (d.views||[]).slice(0,60))await db.collection('tbmeta').add({kind:'view',map:mid,name:String(v.name||'View').slice(0,40),x:+v.x||0,y:+v.y||0,z:+v.z||1,by:handle||'GM',ts:now+(i++)});
  for(const l of (d.layers||[]).slice(0,40)){const img=await up(l.img);if(img)await db.collection('tbmeta').add({kind:'layer',map:mid,name:String(l.name||'Layer').slice(0,40),img,x:+l.x||0,y:+l.y||0,w:Math.max(20,+l.w||100),h:Math.max(20,+l.h||100),shown:!!l.shown,op:Math.max(.05,Math.min(1,+l.op||1)),by:handle||'GM',ts:now+(i++)})}
  for(const s of (d.shapes||[]).slice(0,300)){if(!TB_SH[s.kind])continue;const o={};TB_SHK.forEach(k=>{if(s[k]!==undefined&&k!=='lock'&&k!=='tok')o[k]=s[k]});if(s.kind==='emanation')o.tok='';await db.collection('tbdraw').add({...o,map:mid,by:String(s.by||handle||'GM'),uid:uid||'',lock:false,ts:now+(i++)})}
  tbVid=mid;tbShown='';tbGrid=null;tbDraw();tbNote('Imported "'+doc.name+'".')}catch(e){alert('Could not import: '+(e.message||e.code||e));tbDraw()}}
// ---- GM panel: views, layers, files
function tbFilesHtml(m){const V=tbViews();
 return `<div class="tbcw"><div class="meta"><b>Saved views</b>: bookmark where you are looking. Go jumps there; the 📡 button also brings every player there (and switches their map).</div>
 <div class="tbvb"><input id="tbvwn" maxlength="40" placeholder="Name, e.g. Loading dock" style="flex:1"><button class="btn sm grn" data-tbx="vwsave">＋ Save this view</button></div>
 ${V.map(v=>{const mm=tbMaps().find(x=>x.id===v.map);return `<div class="tbsr"><span>${esc(v.name||'View')}${mm&&m&&mm.id!==m.id?` <span class="meta">· ${esc(mm.name||'map')}</span>`:''}</span><button class="btn sm" data-tbx="vwgo:${esc(v.id)}">Go</button><button class="btn sm" data-tbx="vwsend:${esc(v.id)}" title="Bring every player here">📡</button><button class="btn sm" data-tbx="vwdel:${esc(v.id)}" title="Delete">✕</button></div>`}).join('')||'<div class="meta">No saved views yet.</div>'}</div>
 ${tbLyPanel(m)}
 <div class="tbcw"><div class="meta"><b>Backup this map</b>: everything on it (picture, grid, fog, tokens, walls, notes, layers, views, shapes) in one file you can keep or load into another campaign.</div>
 <div class="tbvb"><button class="btn sm" data-tbx="mexp">⬇ Export this map</button><button class="btn sm" data-tbx="mimp">⬆ Import a map file</button></div></div>`}
{const st=document.createElement('style');st.textContent=`
.tbhp{position:absolute;left:10%;right:10%;bottom:7%;height:min(40%,max(4px,9%,calc(6px*var(--iz,1))));background:rgba(0,0,0,.75);border:1px solid #000;z-index:3;pointer-events:none;border-radius:2px;overflow:hidden}.tbhp i{display:block;height:100%}.tbhn{display:none;position:absolute;left:50%;bottom:calc(7% + min(40%,max(4px,9%,calc(6px*var(--iz,1))))+2px);transform:translateX(-50%);font:700 calc(11px*var(--iz,1))/1 'Share Tech Mono',monospace;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap;pointer-events:none;z-index:4}#tbtw.lowz .tbhn{display:block}
#tbview.tool-mark{cursor:crosshair}
#tbly{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
#tbmarks{position:absolute;left:0;top:0}
.tbmk{position:absolute;width:0;height:0;pointer-events:none;transition:opacity .9s linear}.tbmk b{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:calc(34px*var(--iz,1));line-height:1;filter:drop-shadow(0 2px 3px #000)}.tbmk span{position:absolute;left:0;top:calc(22px*var(--iz,1));transform:translateX(-50%);white-space:nowrap;background:#0b1018;color:#fff;border:1px solid #ffd60a;font-size:calc(12px*var(--iz,1));padding:0 .4em}
.tbdr{position:absolute;transform:translate(-50%,-100%);margin-top:calc(-6px*var(--iz,1));white-space:nowrap;background:#0b1018;color:#fff;border:2px solid #ffd60a;font-size:calc(14px*var(--iz,1));font-weight:700;padding:calc(2px*var(--iz,1)) calc(8px*var(--iz,1));pointer-events:none;z-index:6;transition:opacity .9s linear;box-shadow:0 2px 8px #000}.tbdr.ok{border-color:#39ff14}.tbdr.bad{border-color:#ff3b3b}
`;document.head.appendChild(st)}
setInterval(()=>{if($('#tbroot'))try{tbMarksDraw()}catch(e){}},1000);

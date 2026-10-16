/* ================= EDGES, HINDRANCES, EFFECTS (rules engine) ================= */
const SW_RANKS=['Novice','Seasoned','Veteran','Heroic','Legendary'],SW_ATTN={agility:'Agility',smarts:'Smarts',spirit:'Spirit',strength:'Strength',vigor:'Vigor'};
const swSlug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const SW_SPEC={pace:'pace',parry:'parry',toughness:'tough',tough:'tough',bennies:'bennies',benny:'bennies','power points':'pp',pp:'pp',cards:'cards','ignore wounds':'ignw','ignore wound':'ignw','max wounds':'wmax',damage:'dmg'};
const SW_SPECN={pace:'Pace',parry:'Parry',tough:'Toughness',bennies:'Bennies',pp:'Power Points',cards:'Action Cards',ignw:'Ignore wound levels',wmax:'Max wounds',dmg:'Damage'};
/* One effect per line, for example:  Notice +2  |  parry +1  |  Persuasion -1 (major -2)  |  Athletics +2 in foot chases  |  Intimidation +2 if has mean|ugly  |  initiative quick */
function fxParseLine(line){line=String(line||'').trim();if(!line)return null;let m=line.match(/^initiative\s+(quick|hesitant)\s*$/i);if(m)return{w:['#ini'],ini:m[1].toLowerCase(),v:0,t:''};
 const L=line.replace(/[−–]/g,'-');m=L.match(/^(.+?)\s+([+-]\s*\d+)(?!\d|d\d)\s*(?:\(\s*major\s*([+-]\s*\d+)\s*\))?\s*(.*)$/i);if(!m)return null;
 const toks=m[1].split('/').map(x=>x.trim().replace(/\s+rolls?$/i,'').trim()).filter(Boolean);if(!toks.length)return null;
 const w=[];for(const t of toks){const l=t.toLowerCase();const dm=t.match(/^(.+?)\s+die(?:\s+steps?)?$/i);if(dm){const b=dm[1].trim(),bl=b.toLowerCase();w.push(bl==='$skill'||bl==='$opt'?'^$opt':SW_ATTN[bl]?'^'+bl:'^'+b);continue}if(l==='all'||l==='all rolls'||l==='any'||l==='*')w.push('*');else if(l==='$skill'||l==='$opt')w.push('$opt');else if(SW_ATTN[l])w.push('@'+l);else if(SW_SPEC[l]!==undefined){if(toks.length>1)return null;w.push('#'+SW_SPEC[l])}else w.push(t)}
 const num=s=>+String(s).replace(/\s+/g,'');let rest=(m[4]||'').trim(),h=null;if(w.length&&w.every(x=>x[0]==='^'))rest=rest.replace(/^steps?\b\s*/i,'');const hm=rest.match(/(?:^|\s)if\s+has\s+(.+)$/i);if(hm){h=hm[1].split(/[|,]/).map(swSlug).filter(Boolean);rest=rest.slice(0,hm.index).trim()}
 const f={w,v:num(m[2]),t:rest.trim()};if(m[3]!==undefined)f.M=num(m[3]);if(h&&h.length)f.h=h;return f}
function fxParse(text){const ok=[],bad=[];String(text||'').split(/\n|;/).forEach(l=>{if(!l.trim())return;const f=fxParseLine(l);if(f)ok.push(f);else bad.push(l.trim())});return{fx:ok,bad}}
const SW_TOKN={pace:'pace',parry:'parry',tough:'toughness',bennies:'bennies',pp:'power points',cards:'cards',ignw:'ignore wounds',wmax:'max wounds',dmg:'damage'};
const fxTok=t=>t[0]==='^'?(t==='^$opt'?'$skill':t.slice(1))+' die':t==='*'?'all rolls':t==='$opt'?'$skill':t[0]==='@'?SW_ATTN[t.slice(1)]+' rolls':t[0]==='#'?(SW_TOKN[t.slice(1)]||t.slice(1)):t;
const fxSgn=n=>(n>=0?'+':'-')+Math.abs(n);
function fxFmt(fx){return (fx||[]).map(f=>f.ini?'initiative '+f.ini:f.w.map(fxTok).join('/')+' '+fxSgn(f.v)+(f.M!==undefined?' (major '+fxSgn(f.M)+')':'')+(f.t?' '+f.t:'')+(f.h?' if has '+f.h.join('|'):'')).join('\n')}
/* requirements, one per line: "Agility d8" / "Fighting d6" / "Edge: Block" / "No hindrance: Hesitant" / "Any of: Athletics d8 | Shooting d8" / "Note: text" */
function swReqParse(text){const q=[],bad=[],one=s=>{s=s.trim();let m;if(!s)return null;if(m=s.match(/^edge\s*:\s*(.+)$/i))return['edge',swSlug(m[1])];if(m=s.match(/^no\s+hindrance\s*:\s*(.+)$/i))return['not',swSlug(m[1])];if(m=s.match(/^note\s*:\s*(.+)$/i))return['txt',m[1].trim()];
  if(m=s.match(/^(.+?)\s+d\s*(4|6|8|10|12)$/i)){const n=m[1].trim(),l=n.toLowerCase();return SW_ATTN[l]?['at',l,+m[2]]:['sk',n,+m[2]]}return null};
 String(text||'').split('\n').forEach(l=>{if(!l.trim())return;let m;if(m=l.match(/^any\s+of\s*:\s*(.+)$/i)){const it=m[1].split('|').map(one);if(it.length&&it.every(Boolean))q.push(['any',it]);else bad.push(l.trim())}else{const it=one(l);if(it)q.push(it);else bad.push(l.trim())}});return{q,bad}}
function swReqFmt(q){const f=it=>it[0]==='at'?SW_ATTN[it[1]]+' d'+it[2]:it[0]==='sk'?it[1]+' d'+it[2]:it[0]==='edge'?'Edge: '+swName(it[1],'E'):it[0]==='not'?'No hindrance: '+swName(it[1],'H'):it[0]==='txt'?'Note: '+it[1]:'';return (q||[]).map(it=>it[0]==='any'?'Any of: '+it[1].map(f).join(' | '):f(it)).join('\n')}
/* the library: built-in data plus anything the GM changed or added (meta/edgelib) */
let swOv={ed:{},hd:{},rm:{}},_swIx=null;
function swIdx(){if(_swIx)return _swIx;const E=new Map(),H=new Map(),mk=(d,isH)=>{const o={...d};o._fx=fxParse(o.f).fx;o.q=o.q||[];if(!isH){o.r=+o.r||0}return o};
 SW_EDGES.forEach(d=>E.set(d.k,mk({...d,...(swOv.ed[d.k]||{})},0)));SW_HIND.forEach(d=>H.set(d.k,mk({...d,...(swOv.hd[d.k]||{})},1)));
 Object.keys(swOv.ed||{}).forEach(k=>{if(!E.has(k)&&swOv.ed[k]&&swOv.ed[k].n)E.set(k,mk({k,c:'Custom',...swOv.ed[k]},0))});Object.keys(swOv.hd||{}).forEach(k=>{if(!H.has(k)&&swOv.hd[k]&&swOv.hd[k].n)H.set(k,mk({k,kd:'M/m',...swOv.hd[k]},1))});
 const hid=k=>!!(swOv.rm&&swOv.rm[k]);const cmp=(a,b)=>String(a.n).localeCompare(b.n);
 return _swIx={E,H,edges:[...E.values()].filter(d=>!hid(d.k)).sort(cmp),hinds:[...H.values()].filter(d=>!hid(d.k)).sort(cmp)}}
const swName=(k,w)=>{const d=swIdx()[w].get(k);return d?d.n:k};
const swEdge=k=>swIdx().E.get(k)||null,swHind=k=>swIdx().H.get(k)||null;
/* effects of the edges and hindrances on a sheet */
const fxTog=new Set();
function fxItems(S){S=S||sh;if(!S)return[];const ix=swIdx(),ed=S.edgeList||[],hd=S.hindList||[],has=new Set([...ed.map(e=>e.k),...hd.map(e=>e.k)]),sup=new Set(),out=[];
 ed.forEach(e=>{const d=ix.E.get(e.k);if(d&&d.sup)d.sup.forEach(x=>sup.add(x))});
 const push=(ent,d,isH)=>(d._fx||[]).forEach((f,i)=>{if(f.h&&!f.h.some(x=>has.has(x)))return;let w=f.w;if(w.includes('$opt')||w.includes('^$opt')){const os=String(ent.opt||'').split(',').map(z=>z.trim()).filter(Boolean);if(!os.length)return;w=w.flatMap(x=>x==='$opt'?os:x==='^$opt'?os.map(z=>'^'+(SW_ATTN[z.toLowerCase()]?z.toLowerCase():z)):[x])}let v=+f.v||0;if(isH&&ent.sev==='M'&&f.M!==undefined)v=+f.M||0;if(!v&&!f.ini)return;out.push({id:ent.id,i,src:d.n||ent.n,w,v,t:f.t||'',ini:f.ini||'',key:ent.id+'|'+(f.t||'')})});
 ed.forEach(e=>{const d=ix.E.get(e.k);if(d&&!sup.has(e.k))push(e,d,false)});hd.forEach(e=>{const d=ix.H.get(e.k);if(d)push(e,d,true)});fxInv(S).forEach(({ent,d})=>push(ent,d,false));coFx(S).forEach(e=>out.push(e));return out}
const fxOn=it=>!it.t||fxTog.has(it.key);
const fxSum=(sp,S)=>fxItems(S).reduce((a,it)=>a+(fxOn(it)&&it.w.includes('#'+sp)?it.v:0),0);
const fxHasIni=(kind,S)=>fxItems(S).some(it=>it.ini===kind);
const swSkm=(x,sk)=>{x=String(x).toLowerCase();sk=String(sk||'').toLowerCase();return sk===x||sk.startsWith(x+' (')};
function fxRoll(S,tr){const out={m:0,why:[]};if(!tr)return out;fxItems(S).forEach(it=>{if(!fxOn(it)||it.ini)return;if(!it.w.some(x=>x==='*'||(tr.at&&x==='@'+tr.at)||(tr.sk&&x[0]!=='#'&&x[0]!=='@'&&x[0]!=='^'&&x!=='*'&&swSkm(x,tr.sk))))return;out.m+=it.v;out.why.push(it.src+' '+fxSgn(it.v))});return out}
function fxDmg(S){const out={m:0,why:[]};fxItems(S).forEach(it=>{if(fxOn(it)&&it.w.includes('#dmg')){out.m+=it.v;out.why.push(it.src+' '+fxSgn(it.v))}});return out}
const SW_DIES=[4,6,8,10,12];
function fxStep(S,tr){const out={n:0,why:[]};if(!tr)return out;fxItems(S).forEach(it=>{if(!fxOn(it)||it.ini)return;if(!it.w.some(x=>x[0]==='^'&&((tr.at&&x==='^'+tr.at)||(tr.sk&&!SW_ATTN[x.slice(1)]&&swSkm(x.slice(1),tr.sk)))))return;out.n+=it.v;out.why.push(it.src+' '+fxSgn(it.v)+' die step'+(Math.abs(it.v)==1?'':'s'))});return out}
function swStepDie(base,n,isAt){base=+base||0;n=+n||0;if(!n)return{d:base||4,x:0,unsk:!base&&!isAt};let i=base?SW_DIES.indexOf(base):-1;if(i<0&&base)i=0;i+=n;if(i<0)return{d:4,x:0,unsk:!isAt};return i>4?{d:12,x:i-4,unsk:false}:{d:SW_DIES[i],x:0,unsk:false}}
const swAtVal=(S,k)=>{const e=swStepDie((S.at[k]||{}).d||4,fxStep(S,{at:k}).n,true);return e.d+e.x};
const swSkVal=(S,nm,b)=>{const st=fxStep(S,{sk:nm}).n;if(!st)return +b||0;const e=swStepDie(b,st,false);return e.unsk?0:e.d+e.x};
const swDieTxt=e=>e.unsk?'unskilled':'d'+e.d+(e.x?'+'+e.x:'');
const shWM=S=>((S||sh)&&(S||sh).drone?Math.max(0,+(S||sh).dwl||0):3)+Math.max(0,fxSum('wmax',S));
const fxLabel=it=>it.w&&it.w.length&&it.w.every(x=>x[0]==='^')?it.w.map(x=>(x==='^$opt'?'chosen skill':SW_ATTN[x.slice(1)]||x.slice(1))+' die').join('/')+' '+fxSgn(it.v)+(Math.abs(it.v)==1?' step':' steps'):it.ini?'Initiative: '+(it.ini==='quick'?'Quick (redraw 5 or lower)':'Hesitant (draw two, keep the lowest)'):it.w.map(x=>x[0]==='#'?SW_SPECN[x.slice(1)]:x==='*'?'All rolls':x[0]==='@'?SW_ATTN[x.slice(1)]+' rolls':x).join('/')+' '+fxSgn(it.v);
/* the toggle chips above the roll box: effects that only apply sometimes */
function fxBar(){const el=$('#fxbar');if(!el||!sh)return;const items=fxItems(sh).filter(it=>it.t),g={};items.forEach(it=>{(g[it.key]=g[it.key]||{src:it.src,t:it.t,k:it.key,l:[]}).l.push(fxLabel(it))});const L=Object.values(g);
 if(!L.length){el.innerHTML='';return}
 el.innerHTML='<div class="meta" style="margin:6px 0 2px" title="Tick the ones that apply to the roll you are about to make. They are added to the roll and to Parry or Toughness when they apply to those.">SITUATIONAL: tick what applies</div>'+L.map(x=>`<label class="fxchip ${fxTog.has(x.k)?'on':''}" title="${esc(x.l.join(', '))}"><input type="checkbox" data-fxt="${esc(x.k)}" ${fxTog.has(x.k)?'checked':''} style="width:auto"> <b>${esc(x.src)}</b> <span class="meta">${esc(x.t)}:</span> ${esc(x.l.join(', '))}</label>`).join('');
 el.querySelectorAll('[data-fxt]').forEach(c=>c.onchange=()=>{c.checked?fxTog.add(c.dataset.fxt):fxTog.delete(c.dataset.fxt);fxBar();shDerive()})}
/* requirements */
const swDie=(S,it)=>{if(it[0]==='at')return +((S.at[it[1]]||{}).d)||0;let b=0;for(const k in S.sk)(S.sk[k]||[]).forEach(x=>{if(String(x.n||'').toLowerCase()===String(it[1]).toLowerCase())b=Math.max(b,+x.d||0)});return b};
function swHasEdge(S,k){return (S.edgeList||[]).some(e=>e.k===k)}
function swReqOk(S,it){switch(it[0]){case'at':case'sk':return swDie(S,it)>=it[2];case'edge':return swHasEdge(S,it[1]);case'not':return!(S.hindList||[]).some(h=>h.k===it[1]);case'any':return it[1].some(x=>swReqOk(S,x));default:return true}}
const swReqTxt=it=>it[0]==='at'?SW_ATTN[it[1]]+' d'+it[2]:it[0]==='sk'?it[1]+' d'+it[2]:it[0]==='edge'?swName(it[1],'E'):it[0]==='not'?'no '+swName(it[1],'H')+' hindrance':it[0]==='txt'?it[1]:it[0]==='any'?it[1].map(swReqTxt).join(' or '):'';
function swMissing(def,S,rankIdx){const m=[];if((+def.r||0)>rankIdx)m.push(SW_RANKS[def.r]+' rank');(def.q||[]).forEach(it=>{if(it[0]!=='txt'&&!swReqOk(S,it))m.push(swReqTxt(it))});return m}
/* advancement */
const advCount=S=>(+(S||sh).advBase||0)+((S||sh).advLog||[]).length,advRank=n=>Math.min(4,Math.floor(n/4)),advOf=n=>advRank(n-1);
const shPPT=()=>Math.max(0,(+sh.ppTotal||0)+fxSum('pp'));
function swHints(){if(!sh)return;swBadges();const set=(id,t)=>{const e=$('#'+id);if(e)e.textContent=t};const fp=fxSum('pace');set('shpace2',fp?'Pace is '+Math.max(0,(+sh.pace||0)+fp)+' with edges, hindrances and gear ('+fxSgn(fp)+')':'');const fb=fxSum('bennies'),b=parseInt(sh.bennies)||0;set('shbn2',fb?fxSgn(fb)+' from edges, hindrances and gear = '+Math.max(0,b+fb)+' per session':'');const fpp=fxSum('pp');set('shpp2',fpp?fxSgn(fpp)+' from edges and gear = '+((+sh.ppTotal||0)+fpp)+' total':'')}

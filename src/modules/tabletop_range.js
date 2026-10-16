// ---- Tabletop: weapon range bands on the ruler, and range rings around a token.
// A weapon's range is three numbers (Short/Medium/Long, like 12/24/48). Past Long it is Extreme, up to four times Long; beyond that it is out of range.
// The numbers count in grid squares (a Savage Worlds inch) unless the GM switches the map to "map units".
const TB_RB=[['Short','#39ff14'],['Medium','#ffd60a'],['Long','#ff9f1c'],['Extreme','#ff3b3b']],TB_RBP=[0,-2,-4,-8];
let tbRingsOn=false;
const tbRWmem=()=>{try{return JSON.parse(localStorage.getItem('sr_tbrw')||'{}')||{}}catch(e){return {}}};
const tbRWset=(id,i)=>{try{const o=tbRWmem();o[id]=i;localStorage.setItem('sr_tbrw',JSON.stringify(o))}catch(e){}};
const tbSheetOf=t=>t&&t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet&&!s.deleted)||null:null;
function tbRngNums(s){const m=String(s==null?'':s).match(/\d+(\.\d+)?/g);return m&&m.length>=3?m.slice(0,3).map(Number):null}
// the weapons a token can use: from its character or drone sheet, or from its own attack profile (cs.w)
function tbWeapons(t){if(!t)return [];const sh=tbSheetOf(t),L=sh?(Array.isArray(sh.weapons)?sh.weapons:[]):((t.cs&&Array.isArray(t.cs.w))?t.cs.w:[]);
 return L.map((w,i)=>w?{i,n:String(w.n||'Weapon'),rs:String(w.rng||''),rng:tbRngNums(w.rng),dmg:String(w.dmg||''),ap:+w.ap||0,sk:String(w.sk||''),rof:String(w.rof||''),mag:+w.mag||0,ammo:w.ammo,raw:w}:null).filter(Boolean)}
function tbWpnPick(t){const L=tbWeapons(t);if(!L.length)return null;const mem=tbRWmem()[t.id],w=L.find(x=>x.i===mem);return w||L.find(x=>x.rng)||L[0]}
const tbRU=(m,sq)=>m&&m.rbu==='mu'?sq*(+m.su||1):sq;
const tbSqOf=(m,u)=>m&&m.rbu==='mu'?u/(+m.su||1):u;
function tbBand(d,rng){if(!rng)return null;const a=rng[0],b=rng[1],c=rng[2],i=d<=a?0:d<=b?1:d<=c?2:3;return {i,name:TB_RB[i][0],pen:TB_RBP[i],col:TB_RB[i][1],out:d>c*4}}
const tbPenTxt=p=>p?'−'+Math.abs(p):'0';
// centre of a token in grid squares, and the distance between two tokens (squares, straight line)
const tbMid=t=>{const sz=Math.max(.5,+t.sz||1);return {x:(+t.c||0)+sz/2,y:(+t.r||0)+sz/2}};
const tbTokDist=(a,b)=>{const p=tbMid(a),q=tbMid(b);return Math.hypot(p.x-q.x,p.y-q.y)};
// which token does the ruler measure from: the one under its first point, else the selected one
function tbRulWho(R,m){const P=tbRulPoly(R)[0],g=tbGeoM(m);if(!P)return null;
 const hit=tbToks(m).find(t=>{const sz=Math.max(.5,+t.sz||1),x=(P.x-g.ox)/g.gs,y=(P.y-g.oy)/g.gs;return x>=(+t.c||0)&&x<=(+t.c||0)+sz&&y>=(+t.r||0)&&y<=(+t.r||0)+sz&&tbWeapons(t).length});
 if(hit)return hit;const s=tbSelToks();return s.length===1&&s[0].map===m.id&&tbWeapons(s[0]).length?s[0]:null}
// the second line under the ruler's distance label
function tbRulExtra(R,P,m,g,k,lm){const t=tbRulWho(R,m);if(!t)return '';const w=tbWpnPick(t);if(!w)return '';
 let sq=0;for(let i=0;i<P.length-1;i++)sq+=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y)/g.gs;const d=tbRU(m,sq);let txt,col;
 if(w.rng){const b=tbBand(d,w.rng);txt=b.out?w.n+': out of range':w.n+': '+b.name+' range ('+tbPenTxt(b.pen)+')';col=b.out?'#ff3b3b':b.col}
 else{const adj=sq<=1.5;txt=w.n+': '+(adj?'in reach':'not adjacent');col=adj?'#39ff14':'#ff9f1c'}
 return `<text x="${lm.x}" y="${lm.y+9*k}" text-anchor="middle" font-size="${14*k}" font-weight="700" fill="${col}" stroke="#000" stroke-width="${4*k}" paint-order="stroke" stroke-linejoin="round">${esc(txt)}</text>`}
// rings around the selected token: Short, Medium and Long for its chosen weapon
function tbRingsSvg(m,g){if(!tbRingsOn||!m)return '';const s=tbSelToks();if(s.length!==1||s[0].map!==m.id)return '';const t=s[0],w=tbWpnPick(t);if(!w||!w.rng)return '';
 const p=tbMid(t),cx=g.ox+p.x*g.gs,cy=g.oy+p.y*g.gs,k=1/Math.max(.25,tbV.z),fs=Math.max(11,g.gs*.24);let h='';
 [0,1,2].forEach(i=>{const R=tbSqOf(m,w.rng[i])*g.gs,col=TB_RB[i][1];
  h+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${i===0?col:'none'}" fill-opacity=".08" stroke="${col}" stroke-width="${Math.max(2,g.gs*.04)}" stroke-dasharray="${g.gs*.3} ${g.gs*.2}" stroke-opacity=".9"/>`;
  h+=`<text x="${cx}" y="${cy-R-4}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${col}" stroke="#000" stroke-width="${fs*.28}" paint-order="stroke" stroke-linejoin="round">${TB_RB[i][0]} ${tbPenTxt(TB_RBP[i])} · ${esc(String(w.rng[i]))}</text>`});
 return h}
// ---- the selected-token panel: pick the weapon the ruler and rings use
function tbRngPanel(L){if(!L||L.length!==1)return '';const t=L[0],ws=tbWeapons(t);if(!ws.length)return '';const w=tbWpnPick(t),m=tbCur(),hasR=ws.some(x=>x.rng);
 return `<div class="tbcw"><div class="meta">Weapon range</div><div class="tbvb"><select id="tbrw" aria-label="Weapon for the ruler and range rings">${ws.map(x=>`<option value="${x.i}" ${w&&w.i===x.i?'selected':''}>${esc(x.n)} (${esc(x.rs||'melee')})</option>`).join('')}</select>${hasR?`<button class="btn sm ${tbRingsOn?'on':''}" data-tbx="rings" title="Draw Short, Medium and Long range rings around this token">◎ Range rings</button>`:''}</div>
 <div class="meta">The ruler (📏) now says Short, Medium, Long or Extreme for this weapon, with the attack penalty.${m&&m.rbu==='mu'?' Ranges count in map units.':' Ranges count in grid squares.'}</div></div>`}
// ---- GM: what the weapon range numbers count in (kept on the map)
function tbRngMsr(m){if(!isOwner||!m)return '';return `<div class="tbvb"><span class="meta">Weapon ranges count in</span><select id="tbrbu"><option value="sq" ${m.rbu==='mu'?'':'selected'}>grid squares</option><option value="mu" ${m.rbu==='mu'?'selected':''}>map units (${esc(m.un||'m')})</option></select></div>`}
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.id)return;
 if(el.id==='tbrw'){const t=tbSelToks()[0];if(t){tbRWset(t.id,+el.value);tbRulDraw();tbRangeDraw()}}
 else if(el.id==='tbrbu'&&isOwner){const m=tbCur();if(!m)return;const v=el.value==='mu'?'mu':'sq';m.rbu=v;db.doc('tbmaps/'+m.id).update({rbu:v}).catch(()=>{});tbRulDraw();tbRangeDraw();tbBar(m)}});
TBX.rings=()=>{tbRingsOn=!tbRingsOn;tbRangeDraw();tbBar(tbCur())};

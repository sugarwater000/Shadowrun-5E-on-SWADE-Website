// ---- GM: add your own ticker lines and weather/traffic parts (stored in meta/flavor, only the GM can change it)
let flv={lines:[],wd:[],ws:[],tr:[],ts:[],mix:1},flPm=null,flCat='SHADOWTALK';
const FL_CAT=['CORP WATCH','SHADOWTALK','WEATHER','TRAFFIC','MARKET','STREET','LOCAL','MATRIX','MAGIC','METAHUMAN','CLASSIFIED','TECH','SPORTS','TRIDEO','HEALTH','LAW','PSA','FOOD','TRANSIT'];
const FL_PARTS=[['wd','PLACES','Redmond Barrens','Districts and neighborhoods. Used for the weather lines and the acid rain index.'],['ws','WEATHER','Acid rain, pH 3.2','What the sky is doing. The temperature is picked for you.'],['tr','ROADS AND ROUTES','Aurora Ave','Roads, bridges, rail lines and ferries.'],['ts','TRAFFIC','Gridlock, Lone Star checkpoint','What is happening on the road.']];
const flClean=s=>String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,200);
function flLoad(d){d=d||{};const a=k=>Array.isArray(d[k])?d[k].map(flClean).filter(Boolean).slice(0,300):[];flv={lines:a('lines'),wd:a('wd'),ws:a('ws'),tr:a('tr'),ts:a('ts'),mix:Math.max(1,Math.min(3,+d.mix||1))}}
const flPerm=n=>{if(!flPm||flPm.n!==n){const r=flRand(Math.floor(Math.random()*4294967296)),d=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[d[i],d[j]]=[d[j],d[i]]}flPm={n,d}}return flPm.d};
// ticker: 4 flavor slots per loop; the GM's lines take 1, 2 or 3 of them (when there are any), in a steady order so the banner does not restart
function flPick(n){const m=flv.lines,k=m.length?Math.min(n,flv.mix):0,out=Array.from({length:n-k},(_,i)=>FLAVOR[flDeck[(flStep*n+i)%flDeck.length]]);
 if(k){const p=flPerm(m.length),r=flRand(flStep*7919+m.length+1);for(let j=0;j<k;j++)out.splice(Math.floor(r()*(out.length+1)),0,m[p[(flStep*k+j)%m.length]])}return out}
// weather and traffic: sometimes pull the GM's part instead of a built-in one
const flPk=(b,c)=>c&&c.length&&Math.random()<[0,.2,.4,.6][flv.mix]?esc(c[Math.floor(Math.random()*c.length)]):b[Math.floor(Math.random()*b.length)];
async function flSave(){const d={...flv,by:handle||'GM',at:Date.now()};try{await db.doc('meta/flavor').set(d)}catch(e){alert('Could not save: '+(e.message||e.code||e))}tickLast='';try{drawTick()}catch(e){}flGm()}
function flGm(){const el=$('#flgm');if(!el)return;
 const lineRow=(t,i)=>`<div style="display:flex;gap:8px;align-items:baseline;margin:2px 0"><span style="flex:1;color:var(--dim)">▒ ${esc(t)}</span><a data-fd="lines:${i}" style="cursor:pointer;color:var(--mg)" title="Remove">✕</a></div>`;
 el.innerHTML=`<div class="hint" style="margin:6px 0 10px">Add your own lines to the scrolling banner and your own places, weather, roads and traffic for the Seattle chip. Yours mix in with the built-in ones, and everyone sees them.</div>
 <label>SCROLLING BANNER LINES (${flv.lines.length})</label>
 <div class="two"><div><label>CATEGORY</label><input id="flc" list="flcats" value="${esc(flCat)}" maxlength="24"><datalist id="flcats">${FL_CAT.map(c=>`<option value="${c}">`).join('')}</datalist></div><div><label>LINE</label><input id="flt" maxlength="200" placeholder="The Ork Underground radio says stay out of the sewers tonight."></div></div>
 <div style="margin:6px 0"><button class="btn grn sm" id="fla">Add line</button></div>
 <details style="margin:6px 0"><summary style="cursor:pointer;color:var(--cy)">Paste several lines at once</summary><div class="hint" style="margin:4px 0">One per line, written like <code>SHADOWTALK: your text</code>. A line with no category gets the one above.</div><textarea id="flbulk" aria-label="Several ticker lines, one per line" style="min-height:90px"></textarea><div style="margin-top:6px"><button class="btn sm" id="flab">Add them all</button></div></details>
 <div id="fllist" style="max-height:200px;overflow-y:auto">${flv.lines.length?flv.lines.map(lineRow).join(''):'<div class="meta">// NO CUSTOM LINES YET.</div>'}</div>
 <label style="margin-top:12px">SEATTLE WEATHER AND TRAFFIC CHIP</label>
 <div class="hint" style="margin:2px 0 8px">The chip builds a line from the parts below, for example <b>☔ Redmond Barrens:</b> Acid rain, pH 3.2, 12°C or <b>🚗 Aurora Ave:</b> Gridlock, Lone Star checkpoint. It picks a place and a weather at random (and a road and a traffic note for traffic lines), so every part you add gets mixed with all the others.</div>
 ${FL_PARTS.map(([k,n,ex,h])=>`<div style="margin:8px 0"><div class="meta"><b>${n}</b> (${flv[k].length}): ${esc(h)}</div><div style="display:flex;gap:8px;margin:3px 0"><input data-fp="${k}" maxlength="120" placeholder="${esc(ex)}" style="flex:1"><button class="btn sm" data-fadd="${k}">Add</button></div><div>${flv[k].map((x,i)=>`<span class="fxtag">${esc(x)} <a data-fd="${k}:${i}" style="cursor:pointer;color:var(--mg)" title="Remove">✕</a></span>`).join('')}</div></div>`).join('')}
 <div class="two" style="margin-top:10px"><div><label>HOW OFTEN YOUR PARTS SHOW UP</label><select id="flmix"><option value="1" ${flv.mix===1?'selected':''}>Now and then</option><option value="2" ${flv.mix===2?'selected':''}>Often</option><option value="3" ${flv.mix===3?'selected':''}>Mostly</option></select></div><div><label>&nbsp;</label><button class="btn" id="flpv">Preview</button></div></div>
 <div id="flpvo" class="meta" style="margin-top:8px"></div>`;
 const add=(k,v)=>{v=flClean(v);if(!v)return false;if(flv[k].some(x=>x.toLowerCase()===v.toLowerCase()))return false;flv[k].push(v);return true};
 const addLine=(raw,def)=>{raw=flClean(raw);if(!raw)return false;const m=/^([A-Za-z][A-Za-z ]{1,22}):\s*(.+)$/.exec(raw);return add('lines',m?m[1].toUpperCase().trim()+': '+m[2]:(flClean(def).toUpperCase()||'STREET')+': '+raw)};
 $('#flc').oninput=()=>{flCat=$('#flc').value};
 $('#fla').onclick=()=>{const t=$('#flt').value,c=$('#flc').value;if(addLine(/^[A-Za-z][A-Za-z ]{1,22}:\s/.test(flClean(t))?t:flClean(c).toUpperCase()+': '+flClean(t),c))flSave();else if(!flClean(t))alert('Type the line first.');else alert('That line is already in the list.')};
 $('#flt').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#fla').click()}};
 $('#flab').onclick=()=>{let n=0;$('#flbulk').value.split('\n').forEach(l=>{if(addLine(l,$('#flc').value))n++});if(n)flSave();else alert('Nothing new to add.')};
 el.querySelectorAll('[data-fadd]').forEach(b=>{const k=b.dataset.fadd,inp=el.querySelector('[data-fp="'+k+'"]');b.onclick=()=>{if(add(k,inp.value))flSave();else if(flClean(inp.value))alert('That one is already in the list.')};inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();b.click()}}});
 el.querySelectorAll('[data-fd]').forEach(a=>a.onclick=()=>{const [k,i]=a.dataset.fd.split(':');flv[k].splice(+i,1);flSave()});
 $('#flmix').onchange=()=>{flv.mix=+$('#flmix').value;flSave()};
 $('#flpv').onclick=()=>{const w=[wxData()[0],wxData()[0],wxData()[0]],t=flPick(4);$('#flpvo').innerHTML='<div>'+w.join('</div><div>')+'</div><div style="margin-top:6px;color:var(--dim)">'+t.map(x=>'▒ '+esc(x)).join('<br>')+'</div>'}}

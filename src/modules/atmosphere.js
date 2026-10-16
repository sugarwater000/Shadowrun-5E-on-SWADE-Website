/* ================= SCENE ATMOSPHERE ================= */
const ATM_MOOD={AAA:'clean',AA:'clean',A:'clean',B:'neon',C:'neon',D:'grit',E:'grit',Z:'danger'};
function atmDistrict(loc){const l=String(loc||'').toLowerCase().trim();if(!l)return null;let best=null;(pm.districts||[]).filter(d=>!d.deleted&&d.name).forEach(d=>{const n=String(d.name).toLowerCase();if(l.includes(n)||(l.length>=4&&n.includes(l))){if(!best||n.length>String(best.name).length)best=d}});return best}
function atmWx(t){t=String(t||'').toLowerCase();if(/acid/.test(t))return 'acid';if(/storm|thunder|downpour|heavy rain|torrential/.test(t))return 'storm';if(/rain|drizzle|shower|wet/.test(t))return 'rain';if(/fog|mist/.test(t))return 'fog';if(/smog|haze|smoke|pollut|ash/.test(t))return 'smog';if(/snow|sleet|flurr/.test(t))return 'snow';return ''}
function atmTime(t){t=String(t||'').toLowerCase();const m=t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);let h=null;if(m){h=+m[1];if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0}else if(/midnight|\bnight|late/.test(t))h=23;else if(/dawn|sunrise|early morning/.test(t))h=6;else if(/dusk|sunset|evening/.test(t))h=18;else if(/noon|midday|afternoon|morning|\bday(time)?\b/.test(t))h=12;if(h==null||h>24)return '';return h>=21||h<5?'night':h<8?'dawn':h<17?'day':'dusk'}
function atmFlavor(t){t=String(t||'').toLowerCase();if(/underground|tunnel|sewer|subway/.test(t))return 'under';if(/barrens|squat|burn|ruin|slum/.test(t))return 'fire';if(/dock|harbor|harbour|port\b|waterfront|pier|ferry|bay\b|everett/.test(t))return 'dock';if(/tacoma|industr|factory|refiner|smokestack|renton/.test(t))return 'smoke';if(/downtown|tower|touristville|neon|corporate|bellevue|arcology/.test(t))return 'neon';return ''}
function atmCompute(){const s=scnD||{};if(!(s.loc||s.time||s.wx)||s.atm==='off')return null;
 const d=atmDistrict(s.loc),o=['matrix','astral','alert'].includes(s.atm)?s.atm:'',img=s.atmImg==='none'?'':(artIs(s.atmImg)?'art:'+artKey(s.atmImg,s):(s.atmImg||(d&&dsImgs(d)[0])||''));
 return {d,preset:o,mood:o?(o==='alert'?'danger':''):(['clean','neon','grit','danger'].includes(s.mood)?s.mood:s.mood==='none'?'':(d?ATM_MOOD[String(d.sec||'').toUpperCase()]||'':'')),img,wx:o?'':atmWx(s.wx),tm:o?'':atmTime(s.time),fl:o?'':atmFlavor((d?d.name+' '+(d.tag||''):'')+' '+(s.loc||''))}}
const atmPage=()=>board==='__tbl'?false:(!(board==='__sheets'||board==='__dice')||!!(scnD&&scnD.atmSheet));
(function(){const st=document.createElement('style');st.id='atmcss';st.textContent=`
#atm{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;opacity:0;visibility:hidden;transition:opacity 1.2s,visibility 0s 1.2s}#atm.on{opacity:1;visibility:visible;transition:opacity 1.2s}
#atm>div{position:absolute;inset:0}
#atm .ai{inset:-24px;background-size:cover;background-position:center;filter:blur(5px) brightness(.42) saturate(1.1);opacity:0;transition:opacity 1.6s}#atm .ai.on{opacity:.62}#atm.lv-subtle .ai.on{opacity:.3}
#atm .am,#atm .at,#atm .afl,#atm .aw,#atm .ap,#atm .alt{opacity:0;transition:opacity 1.6s}
#atm.m-clean .am{opacity:1;background:linear-gradient(180deg,rgba(210,240,255,.10),rgba(120,200,255,.03) 55%,transparent)}
#atm.m-neon .am{opacity:1;background:radial-gradient(ellipse at 15% 0,rgba(255,45,149,.10),transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(0,240,208,.09),transparent 55%)}
#atm.m-grit .am{opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(255,150,40,.09)),radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.45))}
#atm.m-danger .am{opacity:1;background:radial-gradient(ellipse at center,transparent 45%,rgba(255,30,30,.20));animation:atmdg 3.2s ease-in-out infinite}
@keyframes atmdg{50%{filter:brightness(1.7)}}
#atm.t-night .at{opacity:1;background:rgba(4,8,38,.34)}#atm.t-dawn .at{opacity:1;background:linear-gradient(0deg,rgba(255,150,110,.16),rgba(60,70,120,.12))}#atm.t-day .at{opacity:1;background:rgba(255,255,235,.035)}#atm.t-dusk .at{opacity:1;background:linear-gradient(0deg,rgba(255,100,40,.16),rgba(120,50,150,.14))}
#atm.f-neon .afl,#atm.f-dock .afl,#atm.f-smoke .afl,#atm.f-fire .afl,#atm.f-under .afl{opacity:1}
#atm.f-neon .afl{background:linear-gradient(90deg,rgba(255,45,149,.20) 0,transparent 9%,transparent 90%,rgba(0,240,208,.18) 100%);animation:atmfl 6s steps(1) infinite}
@keyframes atmfl{0%,100%{opacity:1}46%{opacity:.55}48%{opacity:1}52%{opacity:.4}54%{opacity:1}}
#atm.f-dock .afl{background:linear-gradient(0deg,rgba(150,190,210,.20),transparent 42%);animation:atmdrift 18s ease-in-out infinite alternate}
@keyframes atmdrift{from{transform:translateX(-3%)}to{transform:translateX(3%)}}
#atm.f-smoke .afl{background:linear-gradient(180deg,rgba(130,95,50,.20),transparent 60%);animation:atmdrift 24s ease-in-out infinite alternate}
#atm.f-fire .afl{background:radial-gradient(ellipse at 50% 112%,rgba(255,120,30,.30),transparent 62%);animation:atmfire 2.4s ease-in-out infinite alternate}
@keyframes atmfire{from{opacity:.65}to{opacity:1}}
#atm.f-under .afl{background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(40,120,90,.10),transparent)}
#atm.w-fog .aw,#atm.w-smog .aw,#atm.w-acid .aw{opacity:1}
#atm.w-fog .aw{background:linear-gradient(180deg,rgba(190,205,215,.13),rgba(190,205,215,.22));animation:atmdrift 20s ease-in-out infinite alternate}
#atm.w-smog .aw{background:linear-gradient(180deg,rgba(150,120,70,.20),rgba(120,100,70,.12));animation:atmdrift 26s ease-in-out infinite alternate}
#atm.w-acid .aw{background:linear-gradient(180deg,rgba(120,255,60,.07),rgba(120,255,60,.12))}
#atm.p-matrix .ap{opacity:1;background:linear-gradient(rgba(0,255,120,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,.13) 1px,transparent 1px),rgba(0,40,15,.25);background-size:48px 48px;animation:atmgrid 7s linear infinite}
@keyframes atmgrid{to{background-position:0 48px,48px 0,0 0}}
#atm.p-astral .ap{opacity:1;background:radial-gradient(ellipse at 20% 30%,rgba(150,80,255,.28),transparent 55%),radial-gradient(ellipse at 80% 70%,rgba(60,90,255,.25),transparent 55%),rgba(20,0,50,.30);animation:atmastral 9s ease-in-out infinite alternate}
@keyframes atmastral{from{filter:hue-rotate(0)}to{filter:hue-rotate(40deg) brightness(1.25)}}
#atm.p-alert .ap{opacity:1;box-shadow:inset 0 0 140px rgba(255,20,20,.45);animation:atmalert 1.6s ease-in-out infinite}
@keyframes atmalert{50%{opacity:.35}}
#atm .alt{background:#fff}#atm .alt.flash{opacity:.18;transition:none}
#atm.lv-subtle .am,#atm.lv-subtle .at,#atm.lv-subtle .afl,#atm.lv-subtle .aw,#atm.lv-subtle .ap{filter:opacity(.55)}
#atmfx{position:fixed;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;opacity:.55}#atmfx.lv-subtle{opacity:.28}
body.atm .post,body.atm .row{background-color:rgba(11,16,24,.82)}
#atmban{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:99998;pointer-events:none;text-align:center;padding:12px 26px;background:rgba(6,8,13,.86);border:1px solid var(--cy);box-shadow:0 0 24px rgba(0,240,208,.35);opacity:0;max-width:92vw}#atmban.on{animation:atmban 4.4s ease both}
#atmban .a1{font-size:11px;letter-spacing:.3em;color:var(--mg)}#atmban .a2{font-family:Orbitron,Impact,sans-serif;font-size:clamp(18px,4vw,30px);letter-spacing:.1em;color:var(--cy);text-shadow:0 0 10px var(--cy);margin:4px 0}#atmban .a3{font-size:12px;color:var(--dim)}
@keyframes atmban{0%{opacity:0;transform:translate(-50%,-10px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){#atm *{animation:none!important}#atmban.on{animation:none;opacity:1}}
`;document.head.appendChild(st)})();
let atmSig='',atmCur=0,atmFx=null,atmLT=null;
function atmRoot(){let r=$('#atm');if(!r){r=document.createElement('div');r.id='atm';r.innerHTML='<div class="ai"></div><div class="ai"></div><div class="am"></div><div class="at"></div><div class="afl"></div><div class="aw"></div><div class="ap"></div><div class="alt"></div>';document.body.appendChild(r)}return r}
function atmStop(){if(atmFx){cancelAnimationFrame(atmFx.raf);atmFx=null}const c=$('#atmfx');if(c){const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);c.style.display='none'}clearTimeout(atmLT)}
function atmStart(mode){if(!mode||reducedMo()){atmStop();return}if(atmFx&&atmFx.mode===mode)return;atmStop();
 let c=$('#atmfx');if(!c){c=document.createElement('canvas');c.id='atmfx';document.body.appendChild(c)}c.style.display='block';
 const ctx=c.getContext('2d'),fit=()=>{c.width=innerWidth;c.height=innerHeight};fit();const ph=innerWidth<700,full=(prefs.atm||'full')==='full';
 const N=Math.round(({rain:140,acid:140,storm:260,snow:90,code:Math.floor(innerWidth/16)})[mode]*(ph?.55:1)*(full?1:.6)),P=[];
 const mk=()=>({x:Math.random()*c.width,y:Math.random()*c.height,v:(mode==='snow'?1+Math.random()*1.5:mode==='code'?3+Math.random()*4:(mode==='storm'?22:15)+Math.random()*8),l:8+Math.random()*10,r:1+Math.random()*2});
 for(let i=0;i<N;i++)P.push(mk());
 if(mode==='code'){P.forEach((p,i)=>{p.x=i*16+4;p.y=Math.random()*c.height})}
 const st={mode,raf:0};atmFx=st;let last=0;
 const loop=t=>{st.raf=requestAnimationFrame(loop);if(document.hidden||t-last<32)return;last=t;if(c.width!==innerWidth||c.height!==innerHeight)fit();ctx.clearRect(0,0,c.width,c.height);
  if(mode==='snow'){ctx.fillStyle='rgba(235,245,255,.8)';P.forEach(p=>{p.y+=p.v;p.x+=Math.sin(p.y/40)*.8;if(p.y>c.height){p.y=-5;p.x=Math.random()*c.width}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.3);ctx.fill()})}
  else if(mode==='code'){ctx.font='14px monospace';P.forEach(p=>{p.y+=p.v*2;if(p.y>c.height+160){p.y=-20;p.v=3+Math.random()*4}for(let k=0;k<9;k++){ctx.fillStyle='rgba(0,255,120,'+(k===0?.95:(.5-k*.05))+')';ctx.fillText(Math.random()<.5?'0':'1',p.x,p.y-k*15)}})}
  else{ctx.strokeStyle=mode==='acid'?'rgba(150,255,80,.6)':'rgba(170,205,255,.6)';ctx.lineWidth=1;ctx.beginPath();P.forEach(p=>{p.y+=p.v;p.x-=p.v*.18;if(p.y>c.height||p.x<-20){p.y=-20;p.x=Math.random()*(c.width+80)}ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.l*.18,p.y-p.l)});ctx.stroke()}};
 st.raf=requestAnimationFrame(loop)}
function atmLightning(on){clearTimeout(atmLT);if(!on||reducedMo()||(prefs.atm||'full')!=='full')return;const go=()=>{const e=$('#atm .alt');if(!e)return;e.classList.add('flash');setTimeout(()=>e.classList.remove('flash'),90);setTimeout(()=>{e.classList.add('flash');setTimeout(()=>e.classList.remove('flash'),70)},190);atmLT=setTimeout(go,6000+Math.random()*12000)};atmLT=setTimeout(go,3000+Math.random()*5000)}
function atmApply(){const lvl=prefs.atm||'full';let st=null;try{if(lvl!=='off'&&atmPage())st=atmCompute()}catch(e){}
 const r=$('#atm');
 if(!st){if(r)r.classList.remove('on');document.body.classList.remove('atm');atmSig='';atmStop();return}
 const root=atmRoot();document.body.classList.add('atm');
 const sig=JSON.stringify([st.preset,st.mood,st.img,st.wx,st.tm,st.fl,lvl,artVer(st.img)]);
 if(sig!==atmSig){atmSig=sig;
  root.className='on lv-'+lvl+(st.mood?' m-'+st.mood:'')+(st.preset?' p-'+st.preset:'')+(st.tm?' t-'+st.tm:'')+(st.fl?' f-'+st.fl:'')+(st.wx?' w-'+st.wx:'');
  const ims=root.querySelectorAll('.ai'),cur=ims[atmCur],isA=artIs(st.img),au=isA?artUri(st.img.slice(4)):'',url=st.img?(isA?(au?'url("'+au+'")':''):"url('/_blob/"+st.img+"')"):'';root.classList.toggle('art',isA);
  if((cur.dataset.u||'')!==url){const nx=ims[1-atmCur];nx.dataset.u=url;nx.style.backgroundImage=url;nx.classList.toggle('on',!!url);cur.classList.remove('on');atmCur=1-atmCur}
  const fxm=st.preset==='matrix'?'code':({rain:'rain',acid:'acid',storm:'storm',snow:'snow'})[st.wx]||'';atmStart(fxm);atmLightning(st.wx==='storm')}}
let atmShown=false;
function atmArrive(old,nw,first){if(!nw||!nw.loc||(prefs.atm||'full')==='off'||nw.atm==='off'||!atmPage())return;
 let last='';try{last=localStorage.getItem('sr_atmloc')||''}catch(e){}
 if(!first&&old&&old.loc===nw.loc)return;if(first&&last===nw.loc)return;
 try{localStorage.setItem('sr_atmloc',nw.loc)}catch(e){}
 const show=()=>{const d=atmDistrict(nw.loc);let b=$('#atmban');if(!b){b=document.createElement('div');b.id='atmban';document.body.appendChild(b)}
  b.className='';b.innerHTML=`<div class="a1">ENTERING</div><div class="a2">${esc(nw.loc)}</div>${d?`<div class="a3">Security ${esc(d.sec||'?')}${d.tag?' · '+esc(d.tag):''}</div>`:''}`;void b.offsetWidth;b.className='on';clearTimeout(b._t);b._t=setTimeout(()=>{b.className=''},4600);
  if(!reducedMo()&&(prefs.atm||'full')==='full'&&prefs.amb!==false){document.body.classList.add('fxglitch');setTimeout(()=>document.body.classList.remove('fxglitch'),700)}};
 first?setTimeout(show,1800):show()}

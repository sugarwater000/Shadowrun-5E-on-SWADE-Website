// ---- Tabletop helpers that other pages need (Clue Board, search, quick switcher). The rest of the Tabletop is a separate file, tabletop.js,
// that is fetched the first time someone opens the Tabletop (see tbLoad). Anything here must not depend on the Tabletop's own code.
let tbVid='';
const tbLS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const tbLSset=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
const tbOk=s=>/^[0-9a-f]{8,64}$/i.test(s||'')?s:'';
const tbColOk=s=>/^#[0-9a-f]{3,8}$/i.test(s||'')?s:'';
const tbMaps=()=>(pm.tbmaps||[]).filter(x=>x&&!x.deleted&&tbOk(x.img)&&+x.w>0&&+x.h>0).sort((a,b)=>(a.ts||0)-(b.ts||0));
const tbActive=()=>{const s=(pm.tbmeta||[]).find(x=>x&&x.id==='state');return tbMaps().find(m=>m.id===(s&&s.active))||null};
function tbCur(){const L=tbMaps(),a=tbActive();if(isOwner)return L.find(m=>m.id===tbVid)||a||L[0]||null;return a}
const tbToks=m=>m?(pm.tbtoks||[]).filter(t=>t&&!t.deleted&&t.map===m.id):[];
const tbTok=id=>(pm.tbtoks||[]).find(t=>t&&t.id===id&&!t.deleted);
const tbName=t=>{const sh=t&&t.sheet?(pm.sheets||[]).find(s=>s&&s.id===t.sheet):null;return (sh&&sh.name)||(t&&t.name)||'?'};
function tbLoc(coll,id,doc){const L=pm[coll]=pm[coll]||[];if(!L.some(x=>x&&x.id===id))L.push({id,...doc})}
async function tbShrink(f,max,q){const typ=/^image\/(jpe?g|png|webp)$/.test(f.type);let b;try{b=await createImageBitmap(f)}catch(e){return {blob:f,w:0,h:0}}
 const k=Math.min(1,max/Math.max(b.width,b.height));if(!typ)return {blob:f,w:b.width,h:b.height};
 const w=Math.max(1,Math.round(b.width*k)),h=Math.max(1,Math.round(b.height*k));
 if(k===1&&f.size<2.5e6)return {blob:f,w:b.width,h:b.height};
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(b,0,0,w,h);const o=await new Promise(res=>c.toBlob(x=>res(x),'image/webp',q||.86));
 if(k<1)return o?{blob:o,w,h}:{blob:f,w:b.width,h:b.height};return {blob:(o&&o.size<f.size)?o:f,w:b.width,h:b.height}}
const TB_VER='@@TBVER@@';
let tbLoadP=null;
// fetch tabletop.js once. Resolves when its code is ready; rejects with a plain message if the file is missing or from an older release.
const tbReady=()=>typeof tbPage==='function'&&window.__tbv===TB_VER;
function tbLoad(){if(tbReady())return Promise.resolve(true);if(tbLoadP)return tbLoadP;
 tbLoadP=new Promise((res,rej)=>{const sc=document.createElement('script');sc.src='/tabletop.js?v='+TB_VER;
  sc.onload=()=>{if(tbReady())res(true);else{tbLoadP=null;sc.remove();rej(new Error(window.__tbv&&window.__tbv!==TB_VER?'old':'bad'))}};
  sc.onerror=()=>{tbLoadP=null;sc.remove();rej(new Error('missing'))};document.head.appendChild(sc)});return tbLoadP}
const tbLoadMsg=e=>{const w=e&&e.message;return w==='old'?'The Tabletop file on the server (tabletop.js) is from an older release than this page. Copy the newest tabletop.js into the public folder, deploy again and press Ctrl+Shift+R.':'The Tabletop code (tabletop.js) did not load. Check that tabletop.js is in the public folder next to index.html, deploy again and press Ctrl+Shift+R. If it is there, reload the page.'};
// the GM's browser also keeps the map's sight and light up to date in the background, so load the Tabletop early when a map uses fog
setInterval(()=>{try{if(isOwner&&!tbReady()&&!tbLoadP&&(pm.tbmaps||[]).some(m=>m&&!m.deleted&&m.fog))tbLoad().catch(()=>{})}catch(e){}},20000);

// Styles shared by the Clue Board and the Tabletop (the Clue Board needs them before the Tabletop file is ever fetched).
{const st=document.createElement('style');st.textContent=`
.tbsws{display:inline-flex;gap:5px;flex-wrap:wrap}.tbswc{width:22px;height:22px;border-radius:50%;border:2px solid #0008;cursor:pointer;padding:0}.tbswc.on{border-color:#fff;box-shadow:0 0 0 2px var(--cy)}
#view:has(#tbroot),#view:has(#cbroot){max-width:none}
#tbroot,#cbroot{position:relative;width:var(--bw,868px);max-width:100%}
#tbroot.tbfull,#cbroot.cbfull{width:auto;max-width:none}
.hwid{position:absolute;top:50px;bottom:10px;right:-15px;width:14px;cursor:ew-resize;display:flex;align-items:center;justify-content:center;touch-action:none;z-index:3}.hwid i{display:block;width:5px;height:70px;border-radius:3px;background:#2c3f55}.hwid:hover i{background:var(--cy)}
.tbfull .hwid,.cbfull .hwid{display:none}
.tbccs{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.tbcc{width:34px;height:34px;padding:0;font-size:18px;line-height:1;background:#0b1018;border:1px solid #2c3f55;color:var(--tx);cursor:pointer}.tbcc:hover{border-color:var(--cy)}.tbcc.on{border-color:var(--cy);background:rgba(0,240,208,.18);box-shadow:0 0 0 1px var(--cy) inset}.tbcc.part{border-style:dashed;border-color:var(--cy)}
@media(max-width:900px){#tbroot,#cbroot{width:auto}.hwid{display:none}}
`;document.head.appendChild(st)}

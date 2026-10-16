// ---- Character sheet portraits feed the Character Directory (only for characters that have a sheet)
function portraitSheet(h){const k=lc(String(h||'').trim());if(!k)return null;return (pm.sheets||[]).find(s=>!s.deleted&&!s.drone&&lc(String(s.handle||s.name||'').trim())===k)||null}
function portraitOf(h){const s=portraitSheet(h);if(s&&/^[0-9a-f]{8,64}$/i.test(s.img||''))return s.img;const p=profs&&profs[pid(h||'')];return p&&/^[0-9a-f]{8,64}$/i.test(p.img||'')?p.img:''}
function portraitFor(pr){const h=(typeof dirH!=='undefined'&&dirH)?dirH:'';return (h&&portraitOf(h))||(pr&&pr.img)||''}
function portraitDirSheets(m){(pm.sheets||[]).filter(s=>!s.deleted&&!s.drone&&(s.handle||s.name)).forEach(s=>{const h=String(s.handle||s.name);if(!m[h]&&!Object.keys(m).some(k=>lc(k)===lc(h)))m[h]={n:0,col:'',aff:'',sig:''}})}
function dirSheetBtn(h){const s=portraitSheet(h);return s?`<button class="btn sm" id="pdsheet" data-sid="${esc(s.id)}">🧾 Open character sheet</button>`:''}
function portraitGoSheet(id){if(typeof shDirty!=='undefined'&&shDirty.size)try{shSave()}catch(e){}board='__sheets';shId=id;sh=null;thread=null;dirH=null;document.body.classList.remove('menu');if($('#sheetroot'))$('#view').innerHTML='';render()}
document.addEventListener('click',e=>{
 const a=e.target.closest&&e.target.closest('.shpdir');
 if(a){const h=a.dataset.pdh;if(typeof shDirty!=='undefined'&&shDirty.size)try{shSave()}catch(x){}board='__dir';dirH=h;sh=null;thread=null;query='';if($('#sheetroot'))$('#view').innerHTML='';render();return}
 const b=e.target.closest&&e.target.closest('#pdsheet');if(b)portraitGoSheet(b.dataset.sid)});

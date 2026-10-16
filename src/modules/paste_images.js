/* Paste and drag-and-drop images into whichever picture field is open */
(function(){
 const css=document.createElement('style');css.textContent='.pstdrop{outline:2px dashed var(--cy,#0ff)!important;outline-offset:-3px;box-shadow:0 0 22px rgba(0,255,255,.35) inset}#psttoast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:100001;background:var(--panel);border:1px solid var(--cy,#0ff);padding:7px 14px;font-size:13px;box-shadow:0 0 14px rgba(0,255,255,.35);pointer-events:none}';document.head.appendChild(css);
 const imgsOf=dt=>Array.from((dt&&dt.files)||[]).filter(f=>/^image\//.test(f.type||''));
 const hasFiles=dt=>!!dt&&Array.from(dt.types||[]).includes('Files');
 function pstToast(t){let e=document.getElementById('psttoast');if(!e){e=document.createElement('div');e.id='psttoast';document.body.appendChild(e)}e.textContent=t;e.style.display='';clearTimeout(pstToast.t);pstToast.t=setTimeout(()=>{e.style.display='none'},2600)}
 function pstTarget(dropped){
  const m=document.querySelector('#modal .modal'),v=document.getElementById('view');
  const okIn=i=>!i.disabled&&(!i.accept||/image/.test(i.accept));
  for(const r of [m,v]){if(!r)continue;
   if(r===v&&document.getElementById('sheetroot')&&!dropped)continue; /* never swap a portrait by accident with a paste */
   const ins=Array.from(r.querySelectorAll('input[type=file]')).filter(okIn);
   if(ins.length)return {inp:ins[0],host:r===m?m:(ins[0].closest('form,.post')||v)}}
  return null}
 function pstGive(files,dropped){
  const t=pstTarget(dropped);
  if(!t){pstToast('There is nowhere to put a picture on this page.');return false}
  const fs=t.inp.multiple?files:files.slice(0,1);
  try{const dt=new DataTransfer();fs.forEach(f=>dt.items.add(f));t.inp.files=dt.files}catch(e){pstToast('This browser will not let me add that picture.');return false}
  t.inp.dispatchEvent(new Event('change',{bubbles:true}));
  pstToast(fs.length>1?'Added '+fs.length+' pictures':'Picture added');return true}
 window.pstGive=pstGive;
 document.addEventListener('paste',e=>{
  const fs=imgsOf(e.clipboardData);if(!fs.length)return;
  if((e.clipboardData.getData('text/plain')||'').trim())return;
  if(!pstTarget(false))return;
  e.preventDefault();pstGive(fs,false)});
 let hl=null;const clr=()=>{if(hl){hl.classList.remove('pstdrop');hl=null}};
 document.addEventListener('dragover',e=>{
  if(!hasFiles(e.dataTransfer))return;e.preventDefault();
  const t=pstTarget(true);const h=t?t.host:null;
  if(h!==hl){clr();if(h){h.classList.add('pstdrop');hl=h}}});
 document.addEventListener('dragleave',e=>{if(!e.relatedTarget)clr()});
 document.addEventListener('drop',e=>{
  if(!hasFiles(e.dataTransfer))return;e.preventDefault();clr();
  const fs=imgsOf(e.dataTransfer);
  if(!fs.length){pstToast('Only pictures can be dropped here.');return}
  pstGive(fs,true)});
})();

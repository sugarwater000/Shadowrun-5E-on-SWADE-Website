// ---- Small shared helpers: a brief message that fades by itself
function flash(msg){let el=document.getElementById('flashmsg');if(!el){el=document.createElement('div');el.id='flashmsg';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}el.textContent=msg;void el.offsetWidth;el.className='on';clearTimeout(el._t);el._t=setTimeout(()=>{el.className=''},3200)}
/* "More" buttons that fold secondary toolbar buttons away on phones */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.mfb');if(!b)return;const f=b.closest('.mfold');if(!f)return;const on=f.classList.toggle('mfo');f.querySelectorAll('.mfb').forEach(x=>{x.textContent=on?'Less ▴':'More ▾';x.setAttribute('aria-expanded',on)})});
/* Accessibility: give icon-only buttons and unlabelled fields a spoken name, from their tooltip, placeholder or nearby label */
(function(){const Q='button:not([aria-label]),[role=button]:not([aria-label]),summary:not([aria-label]),input:not([aria-label]):not([type=hidden]),select:not([aria-label]),textarea:not([aria-label])',pend=new Set();let raf=0;
 const name=e=>{const tag=e.tagName;if(tag==='BUTTON'||e.getAttribute('role')==='button'||tag==='SUMMARY'){if(/[A-Za-z0-9]/.test(e.textContent||''))return '';return e.title||''}
  if(e.id){try{if(document.querySelector('label[for="'+e.id+'"]'))return ''}catch(x){}}if(e.closest('label'))return '';
  if(e.getAttribute('aria-labelledby'))return '';if(e.nextElementSibling&&e.nextElementSibling.tagName==='LABEL'&&(e.type==='checkbox'||e.type==='radio'))return e.nextElementSibling.textContent.trim();return e.title||e.placeholder||(e.previousElementSibling&&e.previousElementSibling.tagName==='LABEL'?e.previousElementSibling.textContent.trim():'')||''};
 const fix=n=>{if(n.nodeType!==1)return;const L=n.matches&&n.matches(Q)?[n]:[];n.querySelectorAll&&n.querySelectorAll(Q).forEach(e=>L.push(e));L.forEach(e=>{const t=name(e);if(t)e.setAttribute('aria-label',String(t).replace(/\s+/g,' ').trim().slice(0,80))})};
 const run=()=>{raf=0;const L=[...pend];pend.clear();L.forEach(n=>{if(n.isConnected)fix(n)})};
 try{new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1)pend.add(n)});if(pend.size&&!raf)raf=requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});fix(document.body)}catch(e){}})();
/* Unsent drafts for pop-up forms: what you typed is kept in this browser while the form is open, so a reload, a phone that
   reclaims the tab or a lost connection does not lose it. Closing the form in the app (save or cancel) clears it. When the same
   form is opened again after an unexpected close, your text is put back. */
(function(){const KEY='sr_md',m=document.getElementById('modal');if(!m)return;let cur=null,tm=0;
 const fields=()=>[...m.querySelectorAll('textarea,input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=password]):not([type=range]):not([type=color]),select')];
 const fk=(e,i)=>e.name||e.id||('#'+i);
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
 const clear=()=>{try{localStorage.removeItem(KEY)}catch(e){}};
 const save=()=>{if(!cur||cur.edit)return;const f={};let n=0;fields().forEach((e,i)=>{const v=String(e.value||'');if(v&&e.tagName!=='SELECT'){f[fk(e,i)]=v.slice(0,6000);if((e.tagName==='TEXTAREA'||/text|search/.test(e.type||'text'))&&v.length>=3)n++}else if(e.tagName==='SELECT'&&v)f[fk(e,i)]=v});
  if(!n){if(cur.saved){clear();cur.saved=0}return}try{localStorage.setItem(KEY,JSON.stringify({k:cur.k,ts:Date.now(),f}));cur.saved=1}catch(e){}};
 const open=()=>{const h=m.querySelector('h2'),fs=fields();if(!h||!fs.length){if(cur&&cur.saved)clear();cur=null;return}const k=(typeof board==='string'?board:'')+'|'+h.textContent.trim().slice(0,60);
  if(cur&&cur.k===k&&cur.el===m.firstElementChild)return;if(cur&&cur.saved)clear();
  const first=fs.find(e=>e.tagName==='TEXTAREA'||/text|search/.test(e.type||'text')),edit=!!(first&&String(first.value||'').trim());cur={k,edit,saved:0,el:m.firstElementChild};
  if(edit)return;const d=get();if(!d||d.k!==k||Date.now()-d.ts>7*864e5)return;
  let n=0;fs.forEach((e,i)=>{const v=d.f[fk(e,i)];if(v!==undefined&&!String(e.value||'').trim()){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));n++}});
  if(n){cur.saved=1;const b=m.querySelector('.box')||m.firstElementChild;if(b)b.insertAdjacentHTML('afterbegin','<div class="meta mdr" style="margin-bottom:6px;color:var(--am)">↺ Your unsent text was put back. <a href="#" class="mdx" style="color:var(--cy)">Start fresh</a></div>');
   const x=m.querySelector('.mdx');if(x)x.onclick=ev=>{ev.preventDefault();fields().forEach((e,i)=>{if(d.f[fk(e,i)]!==undefined&&e.value===d.f[fk(e,i)]){e.value='';e.dispatchEvent(new Event('input',{bubbles:true}))}});clear();cur.saved=0;const r=m.querySelector('.mdr');if(r)r.remove()}}};
 m.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(save,400)},true);m.addEventListener('change',()=>{clearTimeout(tm);tm=setTimeout(save,400)},true);
 try{new MutationObserver(()=>{if(!m.innerHTML.trim()){if(cur&&cur.saved)clear();cur=null;return}clearTimeout(open._t);open._t=setTimeout(open,0)}).observe(m,{childList:true})}catch(e){}})();

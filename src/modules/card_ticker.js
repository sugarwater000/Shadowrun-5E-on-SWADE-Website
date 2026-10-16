// ---- Scrolling banner: new / changed cards (jobs, missions, contacts, map pins, districts, rules, newspaper, Matrix News ...)
const CT_MAX=4,CT_AGE=7*864e5;
function ctItems(){try{const out=[],now=Date.now();
 Object.keys(CU_SRC).forEach(b=>{if(muteB(b)||b==='finds')return; // Finds and Funds (purchases, items, money) never scroll across the banner
  (CU_SRC[b]()||[]).forEach(x=>{if(!x||x.deleted)return;const s=cuStamp(x);if(!s||now-s>CT_AGE)return;out.push({b,x,s})})});
 out.sort((a,b)=>b.s-a.s);
 return out.slice(0,CT_MAX).map(o=>{const B=allBoards().find(z=>z.id===o.b)||{name:o.b},nm=String(B.name||o.b).replace(/^[^A-Za-z0-9]+/,'').toUpperCase(),fresh=o.s===(+o.x.ts||0);
  return `<a data-tc="${esc(o.b)}" style="color:var(--am);cursor:pointer">▶ ${esc(nm)} · ${fresh?'NEW':'UPDATED'}: ${esc(cuTitle(o.x))} [${esc(irl(o.s))}]</a>`})}catch(e){return[]}}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#tickt [data-tc]');if(!a)return;const b=a.dataset.tc;
 board=b;thread=null;if(typeof tabm!=='undefined'&&tabm[b])tabm[b]='cards';render()});
setInterval(()=>{try{drawTick()}catch(e){}},4000);

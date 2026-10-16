/* ================= MOBILE PASS ================= */
(function(){const st=document.createElement('style');st.id='mobcss';st.textContent=`#sheetroot .bar>div:last-child{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:flex-end}#sheetroot .bar>div:last-child>label:not([style*="display: none"]){display:inline-flex!important;align-items:center;gap:6px;margin:0!important;white-space:nowrap}
@media (max-width:700px){
header{padding:6px 10px;gap:4px 8px}h1{font-size:13px;letter-spacing:.04em;flex:1 1 100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hud{gap:4px 8px;width:100%}.hud .hrt{display:none}.hud input#q{min-height:36px;padding:4px 8px}
input[type=checkbox],input[type=radio]{min-height:0!important;width:22px!important;height:22px!important;flex:none}
#sheetroot .bar label:not([style*="display: none"]){display:inline-flex!important;align-items:center;gap:6px;margin:3px 10px 3px 0}
#sheetroot #shbar label{display:inline-flex!important;align-items:center;gap:4px;margin:3px 0;font-size:11px;letter-spacing:.02em;max-width:100%;overflow-wrap:anywhere}
#sheetroot .bar>div:last-child{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center}
.dx-chk{flex-wrap:wrap}.dx-chk label{flex:1 1 auto;min-width:0}
#pinbar .pmod{width:56px;min-height:32px}#pinbar{padding:4px 8px;gap:4px 10px}
.btn.sm{min-height:36px}
.modal{max-width:100vw}.modal .box,.modal form{max-width:calc(100vw - 16px)}
#heatroot .row .btn,#distroot .btn{min-height:38px}#heatroot .htn{flex:1 1 100%}#heatroot .htg{flex:1 1 100%;display:flex;align-items:center;gap:6px;flex-wrap:wrap}#heatroot .htg>span[style*=inline-block]{width:11px!important;height:11px!important;margin-right:1px!important}#heatroot span[style*="width:14px"]{display:none}
#qrp .qrg .qi .btn{min-height:40px}
.row{padding:10px}
h1{cursor:pointer}h1::after{content:' ▾';color:var(--dim)}body.hcol h1::after{content:' ▸'}
body.hcol .hud>*:not(#menuBtn):not(#setBell):not(#setRolls){display:none!important}body.hcol #tick .tkr,body.hcol #scn,body.hcol #rollhud{display:none!important}
}`;document.head.appendChild(st)})();

(function(){const ph=()=>innerWidth<=700,h=document.querySelector('h1');if(!h)return;try{if(ph()&&localStorage.getItem('sr_hcol')==='1')document.body.classList.add('hcol')}catch(e){}
 h.addEventListener('click',()=>{if(!ph())return;const on=document.body.classList.toggle('hcol');try{localStorage.setItem('sr_hcol',on?'1':'')}catch(e){}});
 h.title='Tap to show or hide the top bar controls (phones)'})();

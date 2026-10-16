// ---- Tabletop: Bennies, Soak, and recovering from Shaken at the start of a turn.
// Sheets keep their Bennies in the sheet (bn). A token without a sheet can carry a Benny count of its own (cs.bn); one without a count uses the GM's pool, untracked.
// Every roll uses the sheet's own rules (tbAs) when the token has a sheet, and a plain trait roll from the token's numbers when it does not.
const tbBnOf=t=>{const s=tbSheetOf(t);if(s)return Math.max(0,parseInt(s.bn)||0);const b=t&&t.cs?t.cs.bn:undefined;return(b===undefined||b===null||b==='')?null:Math.max(0,parseInt(b)||0)};
async function tbBnPut(t,n){n=Math.max(0,Math.min(99,n|0));const s=tbSheetOf(t);if(s){s.bn=String(n);await db.doc('sheets/'+s.id).update({bn:String(n)});return}await tbTokEdit([t],tk=>({cs:{...(tk.cs||{}),bn:n}}),'set Bennies')}
// spends one Benny. Returns '' when it worked, otherwise the reason it did not.
async function tbBnSpend(t){const n=tbBnOf(t);if(n===null)return isOwner?'':'Only the GM can spend Bennies for this token.';if(n<=0)return tbName(t)+' has no Bennies left.';await tbBnPut(t,n-1);return ''}
const tbBnTxt=t=>{const n=tbBnOf(t);return n===null?'GM Benny':n+' left'};
const tbBnCan=t=>{const n=tbBnOf(t);return n===null?isOwner:n>0};
// say it in the dice log, and on Discord if the person has that switched on for the Tabletop
async function tbSay(nm,plain,short,good,tokId){let p=true;try{p=localStorage.getItem('sr_tbdp')!=='0'}catch(e){}
 try{await dxRecord(plain,nm)}catch(e){}if(p){try{await dxPost(plain,nm)}catch(e){}}
 const m=tbCur();if(m){const d={map:m.id,tok:tokId,text:short,good,by:handle||'?',ts:Date.now()};try{await db.doc('tbping/d'+pid(uid||handle||'x')).set(d)}catch(e){}try{tbMarksDraw()}catch(e){}}}
// one roll of Vigor or Spirit for a token
function tbAttrRoll(t,key,title,tn){const s=tbSheetOf(t),cs=t.cs||{};
 if(s)return tbAs(s,S=>{coChk();shOpt.mod=0;shOpt.tn=tn;if(key==='spirit')shOpt.pen=true;const a=(S.at&&S.at[key])||{d:4,m:0},p=shPrep(+a.d||4,a.m,title,false,false,key==='vigor'?{at:key,free:1}:{at:key},[]),o={title:p.title,sides:p.sides,mod:p.m,tn,wild:p.wild,ws:p.ws||6},r=shRes(o);
  r.rs=r.ok?Math.floor((r.fin-tn)/4):0;r.crit=/Critical/.test(r.line);return r});
 return tbTraitRoll(title,+(key==='vigor'?cs.vi:cs.sp)||6,0,tn,!!cs.wc)}
const tbWoundsOf=t=>{const s=tbSheetOf(t);if(s)return (+s.wounds||0)+(s.inc?1:0);return +t.mhp>0?Math.max(0,(+t.mhp)-(t.hp==null?+t.mhp:+t.hp)):0};
// ---- Soak: spend a Benny, roll Vigor, each success and raise takes one wound back (never more than cap)
async function tbSoak(tokId,cap){const T=tbTok(tokId);if(!T)return 'That token is gone.';const s=tbSheetOf(T);
 if(!s&&!(+T.mhp>0))return 'This token has no health bar, so there is nothing to Soak. Set one on the token first.';
 if(!tbWoundsOf(T))return 'There are no wounds to Soak.';
 const why=await tbBnSpend(T);if(why)return why;
 const r=tbAttrRoll(T,'vigor','Soak (Vigor, Benny spent)',4),n=r.ok?1+(r.rs||0):0;let got=0,msg;
 if(s){const w0=+s.wounds||0,i0=s.inc?1:0,st0=(s.status||[]).slice();let WM=3;try{WM=shWM(s)}catch(e){}
  const raw0=i0?WM+1:w0;got=Math.min(n,raw0,cap==null?99:cap);const raw=raw0-got,w=Math.min(WM,raw),inc=raw>WM?1:0,st=inc?st0:st0.filter(x=>x!=='Incapacitated');
  if(got){s.wounds=w;s.inc=inc;s.status=st;await db.doc('sheets/'+s.id).update({wounds:w,inc,status:st})}
  const bn1=tbBnOf(T);
  undoBar(tbName(T)+(got?' soaks '+got+' wound'+(got>1?'s':''):': the Soak failed')+'.',async()=>{s.wounds=w0;s.inc=i0;s.status=st0;s.bn=String((bn1||0)+1);await db.doc('sheets/'+s.id).update({wounds:w0,inc:i0,status:st0,bn:String((bn1||0)+1)});try{tbBar()}catch(e){}})}
 else{const hp0=t0=>t0.hp==null?+t0.mhp:+t0.hp,h0=hp0(T),m0=T.mark||'',bn0=tbBnOf(T);got=Math.min(n,(+T.mhp)-h0,cap==null?99:cap);
  if(got)await tbTokEdit([T],t=>{const o={hp:h0+got};if(t.mark==='down')o.mark='';return o},'soak');
  undoBar(tbName(T)+(got?' soaks '+got+' wound'+(got>1?'s':''):': the Soak failed')+'.',async()=>{const k=tbTok(tokId);if(!k)return;await tbTokEdit([k],t=>{const o={hp:h0,mark:m0};if(bn0!==null)o.cs={...(t.cs||{}),bn:bn0};return o},'undo soak')})}
 msg=r.line+(got?' Soaks '+got+' wound'+(got>1?'s':'')+'.':' No wounds soaked.');
 const plain=r.plain+(got?' | Soaks '+got+' wound'+(got>1?'s':''):' | Soak failed');
 await tbSay(tbName(T),'🛡 '+plain,(got?'Soaks '+got:'Soak failed'),got>0,tokId);
 try{tbBar()}catch(e){}
 return msg}
// ---- Shaken: roll Spirit (or spend a Benny) to shake it off
const tbShaken=t=>{const s=tbSheetOf(t);return s?(s.status||[]).includes('Shaken'):(Array.isArray(t.cnd)?t.cnd:[]).includes('stun')};
async function tbShakeClear(t){const s=tbSheetOf(t);
 if(s){const st=(s.status||[]).filter(x=>x!=='Shaken');s.status=st;await db.doc('sheets/'+s.id).update({status:st});return}
 await tbTokEdit([t],tk=>({cnd:(Array.isArray(tk.cnd)?tk.cnd:[]).filter(x=>x!=='stun')}),'recover from Shaken')}
async function tbShakeGo(tokId,mode){const T=tbTok(tokId);if(!T)return 'That token is gone.';if(!tbShaken(T))return tbName(T)+' is not Shaken.';let msg,plain,good;
 if(mode==='b'){const why=await tbBnSpend(T);if(why)return why;await tbShakeClear(T);msg=tbName(T)+' spends a Benny and is no longer Shaken.';plain='😵‍💫 **'+tbName(T)+'** spends a Benny to recover from Shaken.';good=true}
 else{const r=tbAttrRoll(T,'spirit','Recover from Shaken (Spirit)',4);good=r.ok;
  if(r.ok){await tbShakeClear(T);msg=r.line+' '+tbName(T)+' is no longer Shaken and can act normally.'}else msg=r.line+' '+tbName(T)+' is still Shaken: only moving and free actions this turn.';
  plain='😵‍💫 '+r.plain+(r.ok?' | No longer Shaken':' | Still Shaken')}
 await tbSay(tbName(T),plain,good?'Recovers from Shaken':'Still Shaken',good,tokId);try{tbBar()}catch(e){}return msg}
const tbShkMine=t=>{if(!t)return false;const s=tbSheetOf(t);if(s)return s.uid===uid||(isOwner&&!s.uid);return isOwner||tbCanRm(t)};
let tbShk=null,tbShkSeen='';
function tbShakeOffer(sig){const m=tbCur(),c=typeof tbIniCur==='function'?tbIniCur():null;if(!m||!c||!sig)return;const t=tbTokForIni(c,m);if(!t||!tbShkMine(t)||!tbShaken(t))return;
 const k=sig+'|'+t.id;if(tbShkSeen===k)return;tbShkSeen=k;tbShk={tok:t.id,msg:''};tbShkDraw()}
function tbShkDraw(){let el=$('#tbshk');if(!tbShk||!$('#tbroot')){if(el)el.remove();return}const T=tbTok(tbShk.tok);if(!T){tbShk=null;if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='tbshk';document.body.appendChild(el)}
 const still=tbShaken(T),bn=tbBnCan(T);
 el.innerHTML=`<b>😵 ${esc(tbName(T))} ${still?'is Shaken':'shook it off'}</b>${still?`<div class="meta">It is their turn. Roll Spirit (target 4) to recover, or spend a Benny to recover right away.</div>`:''}${tbShk.msg?`<div style="margin:4px 0">${esc(tbShk.msg)}</div>`:''}
 <div class="tbvb">${still?`<button class="btn sm grn" data-tbshk="r">🎲 Roll Spirit</button>${bn?`<button class="btn sm" data-tbshk="b">🎟 Use a Benny (${esc(tbBnTxt(T))})</button>`:''}`:''}<button class="btn sm" data-tbshk="x">${still?'Not now':'Close'}</button></div>`}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-tbshk]');if(!b||!tbShk)return;const a=b.dataset.tbshk;
 if(a==='x'){tbShk=null;tbShkDraw();return}b.disabled=true;
 try{tbShk.msg=await tbShakeGo(tbShk.tok,a)}catch(err){tbShk.msg='Could not do that: '+(err.message||err.code||'')}
 tbShkDraw();const T=tbTok(tbShk&&tbShk.tok);if(T&&!tbShaken(T)){const k=tbShk;setTimeout(()=>{if(tbShk===k){tbShk=null;tbShkDraw()}},7000)}});
setInterval(()=>{try{if(!$('#tbroot')){if(tbShk){tbShk=null;tbShkDraw()}return}if(tbShk)tbShkDraw()}catch(e){}},2000);
// ---- the token panel: Bennies, Soak, recover from Shaken
TBX.bnadj=(x,m,t)=>{const L=tbSelToks();if(L.length!==1)return;const T=L[0],n=tbBnOf(T),d=+x||0;if(d>0&&!isOwner&&!tbSheetOf(T))return;tbBnPut(T,(n==null?0:n)+d).then(()=>{try{tbBar()}catch(e){}}).catch(err=>alert('Could not change Bennies: '+(err.message||err.code||'')))};
TBX.bntrack=()=>{const L=tbSelToks();if(L.length!==1||!isOwner)return;tbBnPut(L[0],2).then(()=>{try{tbBar()}catch(e){}})};
TBX.soak=async()=>{const L=tbSelToks();if(L.length!==1)return;const msg=await tbSoak(L[0].id);tbNote(msg)};
TBX.shake=async(x)=>{const L=tbSelToks();if(L.length!==1)return;const msg=await tbShakeGo(L[0].id,x==='b'?'b':'r');tbNote(msg)};
function tbFightPanel(L){if(!L||L.length!==1)return '';const T=L[0];if(!(isOwner||tbCanRm(T)||tbShkMine(T)))return '';const s=tbSheetOf(T),bn=tbBnOf(T);
 if(T.kind==='prop'||T.kind==='item')return '';
 const w=tbWoundsOf(T),shk=tbShaken(T),bits=[];
 bits.push(bn===null?(isOwner?`<span class="meta">Bennies: GM pool</span> <button class="btn sm" data-tbx="bntrack" title="Give this token a Benny count of its own (2 to start)">Track</button>`:''):`<span>🎟 Bennies <b>${bn}</b></span> <button class="btn sm" data-tbx="bnadj:-1" ${bn?'':'disabled'} title="Spend one">−</button><button class="btn sm" data-tbx="bnadj:1" ${isOwner||s?'':'disabled'} title="Add one">+</button>`);
 const btns=[];if(shk)btns.push(`<button class="btn sm grn" data-tbx="shake:r" title="Roll Spirit, target 4. Success removes Shaken.">😵 Recover from Shaken</button><button class="btn sm" data-tbx="shake:b" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny: no longer Shaken right away">Benny</button>`);
 if(w&&(s||+T.mhp>0))btns.push(`<button class="btn sm" data-tbx="soak" ${tbBnCan(T)?'':'disabled'} title="Spend a Benny and roll Vigor. Each success and raise takes back one wound.">🛡 Soak</button>`);
 return `<div class="tbcw"><div class="tbvb">${bits.join('')}</div>${btns.length?`<div class="tbvb">${btns.join('')}</div>`:''}</div>`}
(function(){const st=document.createElement('style');st.id='tbfightcss';st.textContent=`#tbshk{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:900;max-width:min(520px,calc(100vw - 24px));background:var(--panel,#10121c);border:2px solid var(--am,#ffb000);padding:8px 12px;font-size:13px}`;document.head.appendChild(st)})();

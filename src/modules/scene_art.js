// ---- Scene backdrops: a built-in library of drawn pictures (no downloads, no uploads needed).
// A scene picks one with atmImg = 'art:<key>'. Each picture is drawn the first time it is used and then kept.
function artRng(seed){let a=(seed>>>0)||1;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296}}
const aN=n=>Math.round(n*10)/10;
const artSvg=(defs,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><filter id="gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter><filter id="gs" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter><filter id="gb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>${defs||''}</defs>${body}</svg>`;
// linear gradient, top to bottom (v) or left to right
const aG=(id,stops,v=1)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${v?0:1}" y2="${v?1:0}">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!=null?` stop-opacity="${s[2]}"`:''}/>`).join('')}</linearGradient>`;
const aR=(id,stops,cx=.5,cy=.5,r=.5)=>`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!=null?` stop-opacity="${s[2]}"`:''}/>`).join('')}</radialGradient>`;
// a window pattern: random lit squares on a grid
function aWin(id,seed,col,p,cols=4,rows=5){const r=artRng(seed);let s='';for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)if(r()<p)s+=`<rect x="${4+i*10}" y="${4+j*13}" width="6" height="8" fill="${col}"/>`;return `<pattern id="${id}" width="${cols*10+4}" height="${rows*13+4}" patternUnits="userSpaceOnUse">${s}</pattern>`}
// a row of buildings standing on y0
function aCity(r,y0,hmin,hmax,wmin,wmax,fill,pats,o={}){let s='',x=o.x0==null?-30:o.x0;const x1=o.x1||1640;while(x<x1){const w=wmin+r()*(wmax-wmin),h=hmin+r()*(hmax-hmin);s+=`<rect x="${aN(x)}" y="${aN(y0-h)}" width="${aN(w)}" height="${aN(h+60)}" fill="${fill}"/>`;
  if(pats&&pats.length)s+=`<rect x="${aN(x)}" y="${aN(y0-h)}" width="${aN(w)}" height="${aN(h)}" fill="url(#${pats[Math.floor(r()*pats.length)]})"/>`;
  if(o.ant&&r()<o.ant){const ax=x+w*(.2+r()*.6);s+=`<rect x="${aN(ax)}" y="${aN(y0-h-30-r()*50)}" width="3" height="${aN(40+r()*50)}" fill="${fill}"/>`+(o.led?`<circle cx="${aN(ax+1.5)}" cy="${aN(y0-h-32)}" r="3" fill="${o.led}"/>`:'')}
  if(o.step&&r()<o.step)s+=`<rect x="${aN(x+w*.15)}" y="${aN(y0-h-18)}" width="${aN(w*.7)}" height="20" fill="${fill}"/>`;
  x+=w+r()*(o.gap==null?4:o.gap)}return s}
// a glowing neon bar or box
const aNeon=(x,y,w,h,c,sw=5)=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="${sw+4}" filter="url(#gl)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="${sw}" opacity=".95"/></g>`;
const aGlow=(x,y,rx,ry,c,o)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${o==null?.5:o}" filter="url(#gb)"/>`;
function aRain(r,n,op,x0=0,x1=1600,y0=0,y1=900){let s='';for(let i=0;i<n;i++){const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0),l=16+r()*30;s+=`M${aN(x)} ${aN(y)}l${aN(-l*.16)} ${aN(l)}`}return `<path d="${s}" stroke="#bcd6ff" stroke-width="1.4" opacity="${op}" fill="none"/>`}
function aStars(r,n,y1,op=.8){let s='';for(let i=0;i<n;i++)s+=`<circle cx="${aN(r()*1600)}" cy="${aN(r()*y1)}" r="${aN(.5+r()*1.3)}" fill="#fff" opacity="${aN(op*(.3+r()*.7))}"/>`;return s}
function aPeople(r,y,n,fill,s0=1,xr0=0,xr1=1600){let s='';for(let i=0;i<n;i++){const x=xr0+r()*(xr1-xr0),k=s0*(.7+r()*.6),yy=y+r()*30;s+=`<g fill="${fill}"><circle cx="${aN(x)}" cy="${aN(yy-62*k)}" r="${aN(11*k)}"/><path d="M${aN(x-22*k)} ${aN(yy+70*k)}q${aN(-2*k)} ${aN(-100*k)} ${aN(22*k)} ${aN(-104*k)}q${aN(24*k)} ${aN(4*k)} ${aN(22*k)} ${aN(104*k)}z"/></g>`}return s}
function aGround(y,c1,c2,id){return `<rect x="0" y="${y}" width="1600" height="${900-y}" fill="url(#${id})"/>`}

const ART={};
const artDef=(k,name,tags,fn)=>{ART[k]={n:name,t:tags,f:fn}};

artDef('neon-skyline','Neon city at night','downtown neon night city tower skyline touristville bellevue',()=>{const r=artRng(11);
 return artSvg(aG('sk',[[0,'#07051a'],[.45,'#2a0b52'],[.78,'#8a1a78'],[1,'#ff3d9a']])+aG('fg',[[0,'#05030f',0],[1,'#05030f',1]])+aWin('w1',3,'#ffd27a',.35)+aWin('w2',5,'#9ff6ff',.3)+aWin('w3',9,'#ff7ac8',.28)+aR('hz',[[0,'#ff4fb0',.8],[1,'#ff4fb0',0]]),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,70,380,.7)}<circle cx="1230" cy="170" r="60" fill="#ffd6f0" opacity=".16" filter="url(#gl)"/><circle cx="1230" cy="170" r="30" fill="#ffe9f8" opacity=".35"/>
  <ellipse cx="800" cy="640" rx="900" ry="190" fill="url(#hz)"/>
  ${aCity(r,690,120,330,40,86,'#1c0f3d',['w1','w2','w3'],{ant:.3,led:'#ff3333',gap:6})}
  ${aCity(r,760,150,430,56,120,'#120a2e',['w2','w1','w3'],{ant:.4,led:'#ff3333',step:.3,gap:8})}
  ${aCity(r,860,170,500,70,150,'#090418',['w3','w1','w2'],{ant:.3,led:'#ff2255',step:.3,gap:10})}
  ${aNeon(200,430,0,150,'#ff2d95',6)}${aNeon(1330,360,0,190,'#00f0d0',6)}${aNeon(560,520,70,26,'#ffe14a',4)}${aNeon(960,470,64,24,'#ff2d95',4)}
  <rect x="0" y="840" width="1600" height="60" fill="#05030f"/><rect y="760" width="1600" height="140" fill="url(#fg)"/>`)});

artDef('rain-alley','Rain-slicked alley','alley street rain wet neon slum back',()=>{const r=artRng(21);
 return artSvg(aG('wl',[[0,'#0a0d18'],[1,'#171126']])+aG('wr',[[0,'#0b1020'],[1,'#1b0f26']])+aG('gd',[[0,'#0d0f1c'],[1,'#1c1230']])+aR('end',[[0,'#d9f6ff',1],[.35,'#6fd0ff',.55],[1,'#6fd0ff',0]])+aR('pd',[[0,'#ff2d95',.55],[1,'#ff2d95',0]])+aWin('w1',4,'#ffb866',.3,3,6),
  `<rect width="1600" height="900" fill="#05060d"/>
  <polygon points="0,0 700,300 700,640 0,900" fill="url(#wl)"/><polygon points="1600,0 900,300 900,640 1600,900" fill="url(#wr)"/>
  <polygon points="0,900 700,640 900,640 1600,900" fill="url(#gd)"/><polygon points="700,300 900,300 900,640 700,640" fill="#0e1424"/>
  <ellipse cx="800" cy="470" rx="150" ry="190" fill="url(#end)"/><rect x="778" y="430" width="44" height="160" rx="18" fill="#05060d" opacity=".92"/><circle cx="800" cy="415" r="15" fill="#05060d" opacity=".92"/>
  <g opacity=".9"><polygon points="40,150 330,255 330,500 40,600" fill="url(#w1)"/><polygon points="1560,150 1270,255 1270,500 1560,600" fill="url(#w1)"/></g>
  ${aNeon(1330,205,86,28,'#00f0d0',5)}${aNeon(1350,250,44,150,'#ff2d95',5)}<polygon points="1230,312 1260,300 1260,520 1230,540" fill="#ff2d95" opacity=".16" filter="url(#gs)"/>
  <g stroke="#2b3550" stroke-width="3" fill="none" opacity=".8"><path d="M120 330 L560 410 M120 380 L560 440 M120 440 L560 470"/><path d="M180 330 V560 M300 355 V540 M420 380 V520"/></g>
  <polygon points="120,640 380,600 380,720 120,780" fill="#101a20"/><polygon points="1480,640 1220,600 1220,720 1480,780" fill="#18141c"/>
  <ellipse cx="1000" cy="800" rx="460" ry="60" fill="url(#pd)"/><ellipse cx="600" cy="780" rx="280" ry="38" fill="#00f0d0" opacity=".12" filter="url(#gl)"/>
  <ellipse cx="320" cy="640" rx="90" ry="70" fill="#9bb2c0" opacity=".1" filter="url(#gb)"/><ellipse cx="1260" cy="620" rx="80" ry="70" fill="#9bb2c0" opacity=".1" filter="url(#gb)"/>
  ${aRain(r,260,.22)}<rect width="1600" height="900" fill="#02030a" opacity=".12"/>`)});

artDef('corp-tower','Corporate tower, golden hour','corporate corp tower glass clean arcology plaza office aaa',()=>{const r=artRng(31);
 let g='';for(let i=0;i<24;i++)g+=`<line x1="${600+i*34}" y1="60" x2="${600+i*34}" y2="800" stroke="#fff" stroke-opacity=".12"/>`;for(let j=0;j<26;j++)g+=`<line x1="600" y1="${60+j*29}" x2="1400" y2="${60+j*29}" stroke="#fff" stroke-opacity=".1"/>`;
 return artSvg(aG('sk',[[0,'#14305c'],[.5,'#e07a5f'],[.82,'#ffb36b'],[1,'#ffd9a0']])+aG('tw',[[0,'#8fd8ff',.95],[.5,'#2b6fa8',.95],[1,'#0c2a4a',1]],0)+aG('t2',[[0,'#bdeeff',.9],[1,'#133a5a',1]])+aG('fl',[[0,'#10243a'],[1,'#07101c']])+aWin('w1',6,'#fff0c4',.28),
  `<rect width="1600" height="900" fill="url(#sk)"/><circle cx="360" cy="560" r="130" fill="#fff2cf" opacity=".65" filter="url(#gl)"/><circle cx="360" cy="560" r="70" fill="#fff8e6" opacity=".9"/>
  ${aCity(r,700,90,230,50,100,'#1c3354',['w1'],{gap:6})}
  <polygon points="600,60 1000,10 1400,60 1400,800 600,800" fill="url(#tw)"/><polygon points="1000,10 1400,60 1400,800 1000,800" fill="#000" opacity=".16"/>${g}
  <polygon points="620,70 980,26 980,120 620,150" fill="#fff" opacity=".1"/><path d="M1000 10 V-40" stroke="#bfe" stroke-width="3"/>
  <rect x="1060" y="300" width="170" height="40" fill="#6cf0ff" opacity=".18" filter="url(#gs)"/><polygon points="940,30 1000,0 1060,30 1060,70 1000,98 940,70" fill="none" stroke="#fff" stroke-width="5" opacity=".7" transform="translate(0,150) scale(1)"/>
  <polygon points="1450,330 1600,300 1600,800 1450,800" fill="url(#t2)"/><polygon points="130,420 300,380 300,800 130,800" fill="url(#t2)" opacity=".85"/>
  <rect y="780" width="1600" height="120" fill="url(#fl)"/><g opacity=".5"><rect x="640" y="800" width="720" height="14" fill="#8fd8ff" filter="url(#gs)"/><rect x="1040" y="814" width="260" height="80" fill="#8fd8ff" opacity=".35" filter="url(#gb)"/></g>
  ${aPeople(r,812,7,'#050d18',.55,200,1300)}`)});

artDef('barrens','The Barrens at dusk','barrens burn slum squat ruin fire redmond',()=>{const r=artRng(41);
 let ruins='',x=-40;while(x<1640){const w=80+r()*140,h=120+r()*300,y=760-h;ruins+=`<path d="M${aN(x)} 800 V${aN(y+r()*40)} L${aN(x+w*.2)} ${aN(y-r()*30)} L${aN(x+w*.45)} ${aN(y+30+r()*50)} L${aN(x+w*.7)} ${aN(y-10)} L${aN(x+w)} ${aN(y+40+r()*40)} V800z" fill="#150c0c"/>`;for(let k=0;k<4;k++)ruins+=`<rect x="${aN(x+8+r()*(w-30))}" y="${aN(y+50+r()*(h-80))}" width="${aN(10+r()*16)}" height="${aN(14+r()*18)}" fill="#000" opacity=".7"/>`;x+=w*(.6+r()*.5)}
 let fires='';[[300,810],[820,830],[1240,805],[1500,840]].forEach(f=>{fires+=aGlow(f[0],f[1]-20,120,80,'#ff7a1a',.7)+`<rect x="${f[0]-14}" y="${f[1]-30}" width="28" height="40" fill="#1a0e08"/><path d="M${f[0]-10} ${f[1]-30} q10 -50 20 0 q-4 -16 -10 -34 q-4 20 -10 34z" fill="#ffb347"/>`});
 return artSvg(aG('sk',[[0,'#1a0d12'],[.55,'#6b2a1c'],[.85,'#d2692a'],[1,'#ffb259']])+aG('gd',[[0,'#1a0f0d'],[1,'#0a0504']]),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aGlow(900,560,700,120,'#ff8a2a',.55)}
  <g filter="url(#gb)" opacity=".55"><ellipse cx="260" cy="220" rx="220" ry="70" fill="#2a1a18"/><ellipse cx="620" cy="130" rx="260" ry="60" fill="#2a1a18"/><ellipse cx="1180" cy="190" rx="300" ry="80" fill="#3a2018"/><ellipse cx="1450" cy="100" rx="200" ry="50" fill="#2a1a18"/></g>
  ${ruins}<rect y="790" width="1600" height="110" fill="url(#gd)"/>
  <g stroke="#0c0706" stroke-width="3" opacity=".9"><path d="M0 740 H1600"/>${Array.from({length:30},(_,i)=>`<path d="M${i*56} 700 V800"/>`).join('')}<path d="M0 725 L1600 745" opacity=".6"/></g>
  <polygon points="520,830 620,740 720,830" fill="#241812"/><polygon points="1000,840 1090,760 1180,840" fill="#2a1a14"/>${fires}
  ${aStars(r,25,250,.5)}`)});

artDef('docks','Foggy docks','dock harbor harbour port pier waterfront container crane everett bay ferry',()=>{const r=artRng(51);
 let cont='';const cc=['#3a2230','#22343c','#3b3a22','#2a2a45','#412424'];for(let i=0;i<9;i++)for(let j=0;j<(i%3)+1;j++){const x=40+i*150-(j%2)*20;cont+=`<rect x="${x}" y="${640-j*52}" width="138" height="48" fill="${cc[(i+j*2)%5]}"/><path d="${Array.from({length:8},(_,k)=>`M${x+8+k*17} ${644-j*52}v40`).join('')}" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`}
 let crane=(x,s)=>`<g transform="translate(${x},0) scale(${s})" stroke="#0a1118" stroke-width="9" fill="none"><path d="M0 640 V230 M120 640 V230 M0 230 H520 M0 330 H120 M-60 230 L60 100 L180 230 M400 230 V300"/><path d="M0 330 L120 230 M0 430 L120 330 M0 530 L120 430" stroke-width="5"/></g>`;
 return artSvg(aG('sk',[[0,'#050b14'],[.6,'#12303a'],[1,'#3d6670']])+aG('wt',[[0,'#0e242c'],[1,'#030a10']])+aR('fl',[[0,'#fff6d8',.9],[1,'#fff6d8',0]]),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,50,260,.5)}<circle cx="260" cy="150" r="46" fill="#e8f4ff" opacity=".55"/><circle cx="260" cy="150" r="90" fill="#bfe0ff" opacity=".12" filter="url(#gl)"/>
  ${crane(180,1)}${crane(980,1.1)}<g>${cont}</g><rect y="640" width="1600" height="260" fill="url(#wt)"/>
  <g fill="#ffe9a8">${[130,480,830,1180,1500].map(x=>`<circle cx="${x}" cy="500" r="9"/>`).join('')}</g>${[130,480,830,1180,1500].map(x=>`<ellipse cx="${x}" cy="500" rx="120" ry="90" fill="url(#fl)"/><rect x="${x-6}" y="660" width="12" height="200" fill="#ffe9a8" opacity=".14" filter="url(#gs)"/>`).join('')}
  <path d="M0 700 Q200 690 400 700 T800 700 T1200 700 T1600 700" stroke="#8fb8c2" stroke-opacity=".25" stroke-width="2" fill="none"/><path d="M0 760 Q200 750 400 760 T800 760 T1200 760 T1600 760" stroke="#8fb8c2" stroke-opacity=".18" stroke-width="2" fill="none"/>
  <g filter="url(#gb)" opacity=".26"><ellipse cx="400" cy="650" rx="500" ry="40" fill="#cfe4ea"/><ellipse cx="1200" cy="630" rx="520" ry="40" fill="#cfe4ea"/><ellipse cx="800" cy="730" rx="800" ry="30" fill="#cfe4ea"/></g>`)});

artDef('sewers','Underground tunnels','sewer tunnel underground subway drain utility under',()=>{const r=artRng(61);
 let rings='';for(let i=0;i<9;i++){const k=1-i*.105,w=1500*k,h=780*k,x=800-w/2,y=450-h/2+30;rings+=`<path d="M${aN(x)} ${aN(y+h)} V${aN(y+w*.4)} A${aN(w/2)} ${aN(w*.4)} 0 0 1 ${aN(x+w)} ${aN(y+w*.4)} V${aN(y+h)}z" fill="none" stroke="#0a1814" stroke-width="${aN(26*k)}" opacity="${aN(.9-i*.04)}"/>`}
 return artSvg(aG('bg',[[0,'#050a09'],[1,'#10261f']])+aG('wtr',[[0,'#0c2b26'],[1,'#13463c']])+aR('lt',[[0,'#bfffe0',.9],[.4,'#40e0a0',.35],[1,'#40e0a0',0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/><ellipse cx="800" cy="440" rx="320" ry="260" fill="url(#lt)"/>${rings}
  <polygon points="0,900 600,520 1000,520 1600,900" fill="#0b1512"/><polygon points="540,900 740,560 860,560 1060,900" fill="url(#wtr)"/>
  <g stroke="#9fffd6" stroke-opacity=".28" fill="none" stroke-width="2"><path d="M600 760 q100 -14 200 0 t200 0"/><path d="M660 690 q80 -10 160 0 t140 0"/><path d="M710 630 q60 -8 120 0 t90 0"/></g>
  <g stroke="#2a3a34" stroke-width="22" fill="none"><path d="M0 250 L480 400 L520 520"/><path d="M0 330 L430 450" stroke-width="14"/><path d="M1600 240 L1130 400 L1090 520"/></g>
  <g stroke="#9fb8ae" stroke-opacity=".22" stroke-width="3" fill="none"><path d="M0 245 L480 396"/><path d="M1600 235 L1130 396"/></g>
  <g fill="#ff6a4a"><circle cx="300" cy="360" r="7"/><circle cx="1290" cy="355" r="7"/></g>${aGlow(300,360,60,40,'#ff6a4a',.4)}${aGlow(1290,355,60,40,'#ff6a4a',.4)}
  <g fill="#bfffe0" opacity=".8"><circle cx="760" cy="300" r="3"/><circle cx="770" cy="340" r="2.5"/><circle cx="990" cy="250" r="3"/></g>
  <g filter="url(#gb)" opacity=".4"><ellipse cx="200" cy="760" rx="260" ry="60" fill="#9fffd6"/><ellipse cx="1400" cy="780" rx="260" ry="60" fill="#9fffd6"/></g>`)});

artDef('matrix-grid','Matrix grid','matrix host cyberspace data grid virtual jackpoint',()=>{const r=artRng(71);
 let vl='',hl='';for(let i=-14;i<=14;i++)vl+=`<line x1="${800+i*40}" y1="520" x2="${800+i*210}" y2="900"/>`;[0,12,26,44,68,98,136,184,242,312].forEach(d=>hl+=`<line x1="0" y1="${520+d*1.22}" x2="1600" y2="${520+d*1.22}"/>`);
 let tw='';for(let i=0;i<46;i++){const x=r()*1560,h=40+r()*320,w=14+r()*40,c=['#00f0d0','#39ff14','#00b7ff','#b86bff'][Math.floor(r()*4)];tw+=`<rect x="${aN(x)}" y="${aN(520-h)}" width="${aN(w)}" height="${aN(h)}" fill="${c}" opacity="${aN(.08+r()*.18)}"/><rect x="${aN(x)}" y="${aN(520-h)}" width="${aN(w)}" height="3" fill="${c}" opacity=".8"/>`}
 return artSvg(aG('bg',[[0,'#01040a'],[.58,'#04202a'],[1,'#02070c']])+aR('hz',[[0,'#7dffe6',.85],[1,'#7dffe6',0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/>${aStars(r,60,420,.6)}<ellipse cx="800" cy="520" rx="760" ry="110" fill="url(#hz)"/>${tw}
  <g stroke="#00f0d0" stroke-opacity=".55" stroke-width="1.6">${vl}${hl}</g><rect y="516" width="1600" height="5" fill="#bffff2" opacity=".85"/>
  <g stroke="#00f0d0" fill="#00f0d0" fill-opacity=".05" stroke-width="2.4"><polygon points="300,250 360,220 420,250 420,310 360,340 300,310"/><polygon points="1180,170 1230,146 1280,170 1280,222 1230,246 1180,222"/><polygon points="760,300 800,280 840,300 840,340 800,360 760,340"/></g>
  <g stroke="#00f0d0" stroke-width="1.6" fill="none"><path d="M360 220V280M360 280L300 250M360 280L420 250"/><path d="M1230 146V196M1230 196L1180 170M1230 196L1280 170"/></g>
  <g fill="#39ff14" opacity=".55" font-family="monospace" font-size="18">${Array.from({length:40},(_,i)=>`<text x="${aN(r()*1580)}" y="${aN(40+r()*440)}" opacity="${aN(.2+r()*.5)}">${r()<.5?'0':'1'}</text>`).join('')}</g>`)});

artDef('club','Night club','club bar dance party nightclub rave dj stage',()=>{const r=artRng(81);
 let beams='';const bc=['#ff2d95','#00f0d0','#ffe14a','#b86bff','#3aa0ff'];for(let i=0;i<10;i++){const x=120+i*150+r()*40,c=bc[i%5],tx=x+(r()-.5)*600;beams+=`<polygon points="${aN(x-6)},0 ${aN(x+6)},0 ${aN(tx+90)},700 ${aN(tx-90)},700" fill="${c}" opacity="${aN(.1+r()*.12)}"/>`}
 let wall='';for(let i=0;i<20;i++)for(let j=0;j<5;j++){const c=bc[Math.floor(r()*5)];wall+=`<rect x="${380+i*42}" y="${190+j*42}" width="38" height="38" fill="${c}" opacity="${aN(.15+r()*.55)}"/>`}
 return artSvg(aG('bg',[[0,'#0a0316'],[1,'#1c0a2e']])+aG('stg',[[0,'#1b0d2f'],[1,'#07020f']])+aR('ball',[[0,'#ffffff',1],[1,'#b8a8ff',.0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/>${beams}<g filter="url(#gs)">${wall}</g>
  <rect x="360" y="170" width="880" height="236" fill="none" stroke="#ff2d95" stroke-width="4" filter="url(#gs)"/>
  <rect x="520" y="420" width="560" height="48" fill="url(#stg)"/><rect x="640" y="388" width="320" height="46" fill="#10061c"/><rect x="660" y="372" width="280" height="22" fill="#25103c"/><circle cx="740" cy="360" r="14" fill="#ffd0f0" opacity=".9"/>
  <g><line x1="800" y1="0" x2="800" y2="96" stroke="#aaa" stroke-width="3"/><circle cx="800" cy="130" r="40" fill="url(#ball)"/><circle cx="800" cy="130" r="80" fill="#fff" opacity=".12" filter="url(#gl)"/></g>
  ${aGlow(800,520,640,140,'#ff2d95',.28)}${aGlow(420,600,260,120,'#00f0d0',.22)}${aGlow(1200,600,260,120,'#b86bff',.25)}
  ${aPeople(r,690,26,'#07020d',1.05)}${aPeople(r,780,16,'#040109',1.5)}<g fill="#05010a"><path d="M300 700 q16 -70 30 -40 q10 -70 22 -30 l8 70z" opacity=".0"/></g>
  <g stroke="#fff" stroke-width="2" opacity=".35">${Array.from({length:24},(_,i)=>`<line x1="${aN(r()*1600)}" y1="${aN(560+r()*100)}" x2="${aN(r()*1600)}" y2="${aN(500+r()*60)}" opacity=".3"/>`).join('')}</g>
  <g filter="url(#gb)" opacity=".4"><ellipse cx="800" cy="560" rx="900" ry="80" fill="#d9c0ff"/></g>`)});

artDef('street-market','Night market','market street stalls crowd food lantern chinatown vendors bazaar',()=>{const r=artRng(91);
 let lanterns='',stalls='';for(let i=0;i<22;i++){const x=i*76-10;lanterns+=`<circle cx="${x}" cy="${aN(130+Math.sin(i*.9)*22)}" r="14" fill="${i%3?'#ffb347':'#ff4d4d'}"/><circle cx="${x}" cy="${aN(130+Math.sin(i*.9)*22)}" r="40" fill="${i%3?'#ffb347':'#ff4d4d'}" opacity=".28" filter="url(#gs)"/>`}
 const sc=['#c0392b','#16a085','#d35400','#8e44ad','#2980b9'];for(let i=0;i<7;i++){const x=40+i*230;stalls+=`<polygon points="${x},520 ${x+190},520 ${x+210},470 ${x-20},470" fill="${sc[i%5]}" opacity=".85"/><rect x="${x}" y="520" width="190" height="130" fill="#150c10"/><rect x="${x+10}" y="540" width="170" height="40" fill="#ffd27a" opacity=".5" filter="url(#gs)"/><circle cx="${x+95}" cy="500" r="8" fill="#fff4c4"/>`}
 return artSvg(aG('sk',[[0,'#0a0614'],[1,'#2a1230']])+aG('gd',[[0,'#1d0e18'],[1,'#07030a']])+aWin('w1',7,'#ffcf7a',.3)+aWin('w2',8,'#7af0ff',.2),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aCity(r,500,200,420,90,170,'#12071a',['w1','w2'],{gap:12})}
  ${aNeon(150,160,110,46,'#ff2d95',5)}${aNeon(1330,190,60,200,'#00f0d0',5)}${aNeon(760,220,80,34,'#ffe14a',4)}
  <path d="M-20 130 Q400 190 800 130 T1620 130" stroke="#2a1a14" fill="none" stroke-width="3"/>${lanterns}${stalls}
  <rect y="650" width="1600" height="250" fill="url(#gd)"/>${aGlow(800,700,800,60,'#ffb347',.28)}
  ${aPeople(r,700,22,'#06030a',1.1)}${aPeople(r,790,9,'#030106',1.7)}
  <g filter="url(#gb)" opacity=".35"><ellipse cx="400" cy="480" rx="200" ry="60" fill="#fff"/><ellipse cx="1150" cy="500" rx="220" ry="60" fill="#fff"/></g>`)});

artDef('overpass','Highway overpass','highway overpass freeway road traffic bridge car chase',()=>{const r=artRng(101);
 let tr='';for(let i=0;i<36;i++){const y=660+r()*180,x=r()*1600,l=60+r()*260,c=r()<.5?'#fff2c8':'#ff3b3b';tr+=`<rect x="${aN(x)}" y="${aN(y)}" width="${aN(l)}" height="3" fill="${c}" opacity=".9"/><rect x="${aN(x)}" y="${aN(y-3)}" width="${aN(l)}" height="9" fill="${c}" opacity=".3" filter="url(#gs)"/>`}
 let pil='';for(let i=0;i<5;i++)pil+=`<rect x="${120+i*340}" y="300" width="70" height="520" fill="#0b0d14"/><rect x="${120+i*340-18}" y="290" width="106" height="26" fill="#0e1018"/>`;
 return artSvg(aG('sk',[[0,'#040712'],[.7,'#1b1740'],[1,'#44245a']])+aG('rd',[[0,'#121420'],[1,'#07080e']])+aWin('w1',12,'#ffd27a',.3)+aWin('w2',13,'#9ff6ff',.22),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,50,200,.6)}${aCity(r,520,100,300,50,100,'#120e2c',['w1','w2'],{ant:.3,led:'#ff3333'})}
  <rect y="190" width="1600" height="120" fill="#0a0c14"/><rect y="180" width="1600" height="14" fill="#171a28"/>
  <g>${Array.from({length:14},(_,i)=>`<rect x="${i*122+30}" y="150" width="6" height="40" fill="#0a0c14"/><circle cx="${i*122+33}" cy="150" r="7" fill="#ffb347"/><circle cx="${i*122+33}" cy="150" r="30" fill="#ffb347" opacity=".25" filter="url(#gs)"/>`).join('')}</g>
  ${pil}<rect y="640" width="1600" height="260" fill="url(#rd)"/>
  <g stroke="#e6c14a" stroke-width="4" stroke-dasharray="70 60" opacity=".55"><line x1="0" y1="740" x2="1600" y2="740"/></g>${tr}
  <g fill="#ffb347" opacity=".18" filter="url(#gl)"><rect x="0" y="316" width="1600" height="40"/></g>${aRain(r,80,.1)}`)});

artDef('warehouse','Warehouse interior','warehouse factory interior industrial storage crates smuggler hangar',()=>{const r=artRng(111);
 let cr='';const cc=['#4a3220','#3a2a1c','#2c3a40','#5a3a24'];for(let i=0;i<11;i++)for(let j=0;j<(i%3)+1;j++){const x=30+i*140+r()*20,s=90+r()*30;cr+=`<rect x="${aN(x)}" y="${aN(720-(j+1)*s)}" width="${aN(s)}" height="${aN(s)}" fill="${cc[(i+j)%4]}"/><path d="M${aN(x)} ${aN(720-(j+1)*s)}l${aN(s)} ${aN(s)}M${aN(x+s)} ${aN(720-(j+1)*s)}l${aN(-s)} ${aN(s)}" stroke="#000" stroke-opacity=".35" stroke-width="4"/>`}
 return artSvg(aG('bg',[[0,'#050609'],[1,'#14161c']])+aG('fl',[[0,'#1c1e24'],[1,'#07080b']])+aG('sh',[[0,'#fff6d8',.5],[1,'#fff6d8',0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/>
  <g stroke="#0b0c10" stroke-width="12" fill="none"><path d="M0 40 H1600 M0 120 L400 40 L800 120 L1200 40 L1600 120"/><path d="M400 40 V120 M800 120 V40 M1200 40 V120"/></g>
  ${[200,620,1040,1400].map((x,i)=>`<polygon points="${x},60 ${x+70},60 ${x+330-i*30},760 ${x-150-i*20},760" fill="url(#sh)" opacity=".7"/>`).join('')}
  <rect x="100" y="130" width="1400" height="14" fill="#16181e"/>${[200,700,1200].map(x=>`<rect x="${x}" y="148" width="130" height="14" fill="#fff7dd" opacity=".9"/><rect x="${x-10}" y="160" width="150" height="50" fill="#fff7dd" opacity=".12" filter="url(#gs)"/>`).join('')}
  <rect y="720" width="1600" height="180" fill="url(#fl)"/>${cr}
  <g fill="#0a0b0e"><rect x="1180" y="580" width="150" height="110"/><rect x="1320" y="540" width="14" height="150"/><rect x="1200" y="536" width="110" height="48"/><circle cx="1220" cy="700" r="24"/><circle cx="1300" cy="700" r="24"/></g>
  <g filter="url(#gb)" opacity=".28">${[200,620,1040,1400].map(x=>`<ellipse cx="${x+60}" cy="640" rx="190" ry="90" fill="#fff6d8"/>`).join('')}</g>
  <g fill="#fff" opacity=".5">${Array.from({length:60},(_,i)=>`<circle cx="${aN(r()*1500)}" cy="${aN(120+r()*560)}" r="${aN(.8+r()*1.4)}" opacity="${aN(.15+r()*.5)}"/>`).join('')}</g>`)});

artDef('lab','Research lab','lab laboratory research clinic hospital medical biotech clean',()=>{const r=artRng(121);
 let hx='';for(let i=0;i<12;i++)for(let j=0;j<5;j++){const x=70+i*124+(j%2)*62,y=60+j*100;hx+=`<polygon points="${x},${y} ${x+36},${y-20} ${x+72},${y} ${x+72},${y+42} ${x+36},${y+62} ${x},${y+42}" fill="none" stroke="#7ff" stroke-opacity=".12" stroke-width="2"/>`}
 let tanks='';const tc=['#38ffb8','#3ad0ff','#a37bff'];[240,560,880,1200].forEach((x,i)=>{const c=tc[i%3];tanks+=`<rect x="${x-70}" y="270" width="140" height="400" rx="46" fill="${c}" opacity=".16"/><rect x="${x-70}" y="270" width="140" height="400" rx="46" fill="none" stroke="${c}" stroke-width="4" opacity=".8"/><rect x="${x-60}" y="340" width="120" height="320" rx="38" fill="${c}" opacity=".28"/>${Array.from({length:12},()=>`<circle cx="${aN(x-40+r()*80)}" cy="${aN(360+r()*280)}" r="${aN(2+r()*5)}" fill="#e8ffff" opacity=".6"/>`).join('')}<rect x="${x-90}" y="660" width="180" height="40" fill="#0b1a20"/><rect x="${x-90}" y="250" width="180" height="30" fill="#0b1a20"/>${aGlow(x,470,110,200,c,.3)}`});
 return artSvg(aG('bg',[[0,'#071a22'],[1,'#0d2e38']])+aG('fl',[[0,'#0e3340'],[1,'#04141a']]),
  `<rect width="1600" height="900" fill="url(#bg)"/>${hx}<rect y="690" width="1600" height="210" fill="url(#fl)"/><rect y="688" width="1600" height="4" fill="#9ff" opacity=".4"/>${tanks}
  <rect x="60" y="120" width="1480" height="40" fill="#e8ffff" opacity=".08" filter="url(#gs)"/><g fill="#0b1a20" stroke="#4ff" stroke-opacity=".5" stroke-width="2"><rect x="1360" y="400" width="190" height="130"/><rect x="40" y="410" width="150" height="110"/></g>
  <g stroke="#4ff" stroke-width="3" fill="none" opacity=".8"><path d="M1380 500 l30 -40 l30 20 l40 -50 l30 30 l20 -20"/><path d="M60 495 l30 -30 l30 20 l30 -40"/></g>
  <g filter="url(#gb)" opacity=".4"><ellipse cx="800" cy="760" rx="900" ry="50" fill="#9ff"/></g>`)});

artDef('astral','Astral plane','astral magic ritual spirit mana ghost aura dream',()=>{const r=artRng(131);
 let sw='';for(let i=0;i<9;i++){const y=200+i*60,c=['#b86bff','#6b8bff','#ff6bd6'][i%3];sw+=`<path d="M-50 ${y} C 300 ${y-200} 600 ${y+240} 900 ${y-60} S 1400 ${y+160} 1700 ${y-80}" stroke="${c}" stroke-width="${aN(6+r()*20)}" fill="none" opacity="${aN(.1+r()*.12)}" filter="url(#gs)"/>`}
 return artSvg(aR('n1',[[0,'#a35bff',.7],[1,'#a35bff',0]])+aR('n2',[[0,'#3d6bff',.65],[1,'#3d6bff',0]])+aR('n3',[[0,'#ff5bd0',.5],[1,'#ff5bd0',0]])+aG('sil',[[0,'#1a0a40',.0],[1,'#1a0a40',.8]]),
  `<rect width="1600" height="900" fill="#0a0420"/><ellipse cx="400" cy="300" rx="620" ry="420" fill="url(#n1)"/><ellipse cx="1200" cy="560" rx="700" ry="420" fill="url(#n2)"/><ellipse cx="860" cy="200" rx="480" ry="300" fill="url(#n3)"/>${aStars(r,160,900,.9)}${sw}
  ${aCity(r,900,140,380,50,110,'#150838',null,{gap:6}).replace(/fill="#150838"/g,'fill="#1b0a4a" fill-opacity=".55" stroke="#c9a6ff" stroke-opacity=".5" stroke-width="2"')}
  <g fill="none" stroke="#e6d0ff" stroke-width="2" opacity=".7"><circle cx="800" cy="450" r="90"/><circle cx="800" cy="450" r="140" stroke-dasharray="6 10"/><path d="M800 360 L860 480 L740 480z"/></g>
  <circle cx="800" cy="450" r="40" fill="#fff" opacity=".7" filter="url(#gl)"/><g filter="url(#gl)" opacity=".7"><circle cx="360" cy="640" r="26" fill="#6bffd0"/><circle cx="1230" cy="360" r="32" fill="#ff9ae6"/><circle cx="1330" cy="700" r="20" fill="#9ac0ff"/></g>`)});

artDef('forest','Pine forest at night','forest wild woods salish tir tairngire mountain camp outdoors rural',()=>{const r=artRng(141);
 function pines(y,n,h0,h1,c,op){let s='';for(let i=0;i<n;i++){const x=r()*1700-50,h=h0+r()*(h1-h0),w=h*.34;s+=`<polygon points="${aN(x)},${aN(y-h)} ${aN(x+w)},${aN(y-h*.35)} ${aN(x+w*.55)},${aN(y-h*.35)} ${aN(x+w*.9)},${aN(y)} ${aN(x-w*.9)},${aN(y)} ${aN(x-w*.55)},${aN(y-h*.35)} ${aN(x-w)},${aN(y-h*.35)}" fill="${c}" opacity="${op}"/>`}return s}
 return artSvg(aG('sk',[[0,'#030a14'],[.7,'#0d2a3a'],[1,'#235a62']])+aG('mt',[[0,'#1d3f52'],[1,'#0f2a38']])+aG('gd',[[0,'#05110f'],[1,'#020706']]),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,110,420,.8)}<circle cx="1180" cy="150" r="56" fill="#f2fbff" opacity=".85"/><circle cx="1180" cy="150" r="140" fill="#bfe8ff" opacity=".14" filter="url(#gl)"/>
  <polygon points="-50,640 260,330 420,450 640,260 900,520 1120,340 1400,520 1650,380 1650,700 -50,700" fill="url(#mt)"/><polygon points="640,260 700,330 650,320 610,360 570,318" fill="#e8f6ff" opacity=".6"/>
  ${pines(660,40,160,260,'#0a2330',1)}<g filter="url(#gb)" opacity=".4"><ellipse cx="500" cy="620" rx="600" ry="40" fill="#cfe8f0"/><ellipse cx="1200" cy="660" rx="560" ry="40" fill="#cfe8f0"/></g>
  ${pines(740,34,230,380,'#061a22',1)}${pines(830,24,330,520,'#030f14',1)}<rect y="820" width="1600" height="80" fill="url(#gd)"/>
  ${aGlow(800,800,200,70,'#ff9a3a',.45)}<path d="M770 830 q30 -60 60 0z" fill="#ffb347"/><path d="M780 830 q20 -34 40 0z" fill="#ffe08a"/>`)});

artDef('rooftop','Rooftop at dusk','rooftop roof dusk sunset skyline city high above',()=>{const r=artRng(151);
 return artSvg(aG('sk',[[0,'#1b1040'],[.45,'#8a2f6e'],[.8,'#ff7a45'],[1,'#ffc471']])+aG('rf',[[0,'#171320'],[1,'#07050b']])+aWin('w1',14,'#ffd27a',.3)+aWin('w2',15,'#9ff6ff',.2),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,50,260,.6)}<circle cx="1000" cy="590" r="120" fill="#ffd9a0" opacity=".7" filter="url(#gl)"/><circle cx="1000" cy="590" r="64" fill="#fff0d0"/>
  ${aCity(r,720,60,220,40,90,'#37154a',['w1'],{ant:.3,led:'#ff3333'})}${aCity(r,780,90,320,50,110,'#1f0c34',['w1','w2'],{ant:.4,led:'#ff3333',step:.3})}
  ${aNeon(240,330,0,170,'#00f0d0',6)}
  <g fill="#0a0710"><rect x="1180" y="520" width="14" height="260"/><rect x="1130" y="540" width="110" height="14" transform="rotate(0)"/><rect x="1150" y="560" width="70" height="8"/></g>
  <g fill="#0a0710"><rect x="360" y="620" width="12" height="160"/><rect x="520" y="610" width="12" height="170"/><rect x="340" y="610" width="212" height="60"/><polygon points="340,610 446,560 552,610"/></g>
  <polygon points="0,780 1600,740 1600,900 0,900" fill="url(#rf)"/><rect y="770" width="1600" height="10" fill="#241c30"/>
  <g fill="#0a0710"><rect x="1240" y="700" width="180" height="90"/><rect x="1260" y="680" width="40" height="22"/><rect x="1340" y="680" width="40" height="22"/><rect x="120" y="710" width="140" height="80"/><circle cx="190" cy="750" r="26" fill="#161022"/></g>
  <g stroke="#1b1426" stroke-width="3"><path d="M0 800 H1600"/>${Array.from({length:27},(_,i)=>`<path d="M${i*60} 800 V860"/>`).join('')}</g>
  <path d="M-20 520 q200 30 420 0" stroke="#0a0710" fill="none" stroke-width="2"/>`)});

artDef('flophouse','Cheap coffin motel room','room apartment flop lodge motel coffin hotel bedroom safehouse home',()=>{const r=artRng(161);
 return artSvg(aG('wl',[[0,'#171321'],[1,'#0a0810']])+aG('fl',[[0,'#1a1620'],[1,'#07050a']])+aG('lt',[[0,'#ff2d95',.34],[1,'#00f0d0',.1]],0),
  `<rect width="1600" height="900" fill="url(#wl)"/><rect y="700" width="1600" height="200" fill="url(#fl)"/>
  <rect x="980" y="140" width="380" height="430" fill="#0d1c33"/><g stroke="#05070c" stroke-width="10"><path d="M1170 140 V570 M980 355 H1360"/></g>
  ${aCity(r,560,90,260,26,60,'#0a1326',[],{x0:984,x1:1356}).replace(/<rect/g,'<rect clip-path="url(#cw)"')}
  <clipPath id="cw"><rect x="984" y="144" width="372" height="422"/></clipPath>
  ${aNeon(1200,240,100,40,'#ff2d95',5)}${aNeon(1040,320,50,120,'#00f0d0',5)}
  <polygon points="980,570 1360,570 1500,900 600,900" fill="url(#lt)" opacity=".6"/><polygon points="980,140 1360,140 1600,0 800,0" fill="#ff2d95" opacity=".05"/>
  <rect x="150" y="560" width="520" height="150" rx="10" fill="#1e1830"/><rect x="150" y="520" width="520" height="60" rx="14" fill="#2c2346"/><rect x="170" y="500" width="150" height="50" rx="16" fill="#3a2f5a"/><rect x="130" y="470" width="30" height="270" fill="#120d1c"/>
  <rect x="720" y="560" width="150" height="14" fill="#2a2030"/><rect x="740" y="574" width="12" height="130" fill="#1a1422"/><rect x="838" y="574" width="12" height="130" fill="#1a1422"/>
  <polygon points="760,470 800,470 812,560 748,560" fill="#ffcf7a" opacity=".85"/>${aGlow(780,520,150,110,'#ffcf7a',.4)}<rect x="816" y="545" width="30" height="15" fill="#e8e2d0"/><rect x="826" y="532" width="12" height="14" fill="#c9423a"/>
  <rect x="60" y="130" width="300" height="190" fill="#0e0b16" stroke="#2c2346" stroke-width="3"/><g stroke="#00f0d0" stroke-width="2" fill="none" opacity=".7"><path d="M80 290 l50 -60 l50 30 l60 -80 l60 40"/></g>
  <g filter="url(#gb)" opacity=".3"><ellipse cx="800" cy="640" rx="500" ry="60" fill="#ff2d95"/></g>`)});

artDef('dive-bar','Dive bar','bar tavern pub drinks dive saloon cantina lounge diner',()=>{const r=artRng(171);
 let bt='';const bc=['#4fb88b','#c46a2a','#2d6fb5','#b53a52','#d4b24a','#7c4fb5'];for(let s=0;s<3;s++)for(let i=0;i<22;i++){const x=120+i*62+(r()*8),h=44+r()*26,c=bc[Math.floor(r()*6)];bt+=`<rect x="${aN(x)}" y="${aN(330+s*110-h)}" width="${aN(16+r()*6)}" height="${aN(h)}" rx="4" fill="${c}" opacity=".85"/><rect x="${aN(x+4)}" y="${aN(330+s*110-h-14)}" width="7" height="16" fill="${c}" opacity=".85"/>`}
 return artSvg(aG('bg',[[0,'#1a0d10'],[1,'#3a1a14']])+aG('bar',[[0,'#6a4026'],[.1,'#3a2214'],[1,'#1a0e08']])+aG('fl',[[0,'#1c0e0a'],[1,'#080404']])+aR('sp',[[0,'#ffd27a',.7],[1,'#ffd27a',0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/><rect x="90" y="190" width="1420" height="14" fill="#2a160e"/>${[0,1,2].map(s=>`<rect x="90" y="${336+s*110}" width="1420" height="10" fill="#4a2a18"/>${aGlow(800,332+s*110,700,36,'#ffd27a',.18)}`).join('')}${bt}
  ${aNeon(1160,24,200,70,'#ff2d95',6)}<text x="1260" y="77" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="44" fill="#ff2d95" opacity=".95">OPEN</text>${aNeon(190,24,150,70,'#00f0d0',6)}<text x="265" y="77" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="44" fill="#00f0d0" opacity=".95">BAR</text>
  ${[250,800,1350].map(x=>`<path d="M${x-8} 0 V120" stroke="#222" stroke-width="3"/><polygon points="${x-50},170 ${x+50},170 ${x+22},128 ${x-22},128" fill="#1a0e08"/><polygon points="${x-24},172 ${x+24},172 ${x+190},640 ${x-190},640" fill="url(#sp)" opacity=".45"/>`).join('')}
  <rect y="640" width="1600" height="260" fill="url(#fl)"/><rect x="0" y="560" width="1600" height="120" fill="url(#bar)"/><rect y="560" width="1600" height="8" fill="#a8703c" opacity=".7"/>
  ${[220,560,900,1240,1520].map(x=>`<g fill="#0a0505"><ellipse cx="${x}" cy="760" rx="46" ry="14"/><rect x="${x-5}" y="770" width="10" height="100"/><ellipse cx="${x}" cy="846" rx="40" ry="8"/></g>`).join('')}
  ${aPeople(r,520,3,'#0a0505',1.35,300,1300)}<g fill="#fff5d8" opacity=".5"><circle cx="720" cy="548" r="5"/><circle cx="1010" cy="552" r="5"/></g>`)});

artDef('seattle','Seattle skyline at dusk','seattle skyline needle downtown bay rainier dusk water elliott',()=>{const r=artRng(181);
 return artSvg(aG('sk',[[0,'#0d1236'],[.5,'#5a2a6e'],[.8,'#ee6f6a'],[1,'#ffc28a']])+aG('wt',[[0,'#3a2a4e'],[1,'#080a1c']])+aWin('w1',16,'#ffd27a',.32)+aWin('w2',17,'#9ff6ff',.2),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aStars(r,60,260,.6)}
  <polygon points="-50,640 200,560 340,480 520,540 760,420 940,300 1070,420 1240,520 1450,560 1650,620 1650,660 -50,660" fill="#4a3a66" opacity=".8"/><polygon points="940,300 990,360 960,352 930,378 900,350" fill="#fff0f8" opacity=".6"/>
  ${aCity(r,690,90,260,36,86,'#241447',['w1','w2'],{ant:.3,led:'#ff3333',x0:-30,x1:1640})}
  <g fill="#120a26"><rect x="1198" y="270" width="8" height="440"/><path d="M1130 300 q76 -60 150 0 q-10 26 -76 28 q-66 -2 -74 -28z"/><rect x="1186" y="330" width="32" height="12"/><path d="M1202 270 V220" stroke="#120a26" stroke-width="5"/></g>
  <circle cx="1202" cy="214" r="6" fill="#ff3b3b"/><circle cx="1202" cy="214" r="26" fill="#ff3b3b" opacity=".4" filter="url(#gs)"/>
  <rect y="690" width="1600" height="210" fill="url(#wt)"/><path d="M-20 720 Q200 712 400 720 T800 720 T1200 720 T1620 720" stroke="#ffd0a0" stroke-opacity=".3" stroke-width="2" fill="none"/>
  ${Array.from({length:18},(_,i)=>`<rect x="${aN(r()*1580)}" y="${aN(700+r()*170)}" width="${aN(20+r()*80)}" height="2" fill="${['#ffd27a','#9ff6ff','#ff7ac8'][i%3]}" opacity="${aN(.2+r()*.4)}"/>`).join('')}
  <g fill="#050712"><polygon points="260,830 520,830 560,800 220,800"/><rect x="330" y="760" width="120" height="40"/><rect x="350" y="720" width="80" height="40"/></g><g fill="#ffe9a8"><rect x="340" y="772" width="10" height="8"/><rect x="370" y="772" width="10" height="8"/><rect x="400" y="772" width="10" height="8"/><rect x="360" y="732" width="10" height="8"/><rect x="390" y="732" width="10" height="8"/></g>`)});

artDef('checkpoint','Security checkpoint','checkpoint police lone star knight errant security road barrier raid roadblock cops',()=>{const r=artRng(191);
 return artSvg(aG('sk',[[0,'#05060f'],[1,'#141a2e']])+aG('rd',[[0,'#171b26'],[1,'#080a10']])+aR('rl',[[0,'#ff2d2d',.9],[1,'#ff2d2d',0]])+aR('bl',[[0,'#2d6bff',.9],[1,'#2d6bff',0]])+aWin('w1',18,'#9ff6ff',.2),
  `<rect width="1600" height="900" fill="url(#sk)"/>${aCity(r,560,80,260,50,100,'#0b0f1c',['w1'],{ant:.3,led:'#ff3333'})}
  <polygon points="0,900 640,560 960,560 1600,900" fill="url(#rd)"/><g stroke="#e6c14a" stroke-width="5" stroke-dasharray="40 40" opacity=".5"><line x1="800" y1="570" x2="800" y2="900"/></g>
  ${[[360,640],[620,610],[980,610],[1240,640]].map((b,i)=>`<g><polygon points="${b[0]-80},${b[1]} ${b[0]+80},${b[1]} ${b[0]+60},${b[1]-40} ${b[0]-60},${b[1]-40}" fill="${i%2?'#fff':'#ffcf3a'}" opacity=".85"/><g stroke="#222" stroke-width="8">${[-60,-20,20,60].map(x=>`<line x1="${b[0]+x}" y1="${b[1]-38}" x2="${b[0]+x+16}" y2="${b[1]-2}"/>`).join('')}</g></g>`).join('')}
  <g fill="#05070d"><path d="M240 580 h300 l30 70 h-360z"/><path d="M280 580 l30 -50 h190 l30 50z"/><circle cx="300" cy="660" r="30"/><circle cx="510" cy="660" r="30"/><path d="M1060 580 h300 l30 70 h-360z"/><path d="M1100 580 l30 -50 h190 l30 50z"/><circle cx="1120" cy="660" r="30"/><circle cx="1330" cy="660" r="30"/></g>
  <rect x="330" y="522" width="60" height="12" fill="#ff2d2d"/><rect x="400" y="522" width="60" height="12" fill="#2d6bff"/><rect x="1150" y="522" width="60" height="12" fill="#ff2d2d"/><rect x="1220" y="522" width="60" height="12" fill="#2d6bff"/>
  <ellipse cx="380" cy="520" rx="260" ry="190" fill="url(#rl)" opacity=".55"/><ellipse cx="1240" cy="520" rx="260" ry="190" fill="url(#bl)" opacity=".55"/><ellipse cx="820" cy="540" rx="320" ry="160" fill="url(#rl)" opacity=".25"/>
  ${[560,1040].map(x=>`<rect x="${x}" y="260" width="12" height="320" fill="#0a0c14"/><rect x="${x-60}" y="250" width="132" height="20" fill="#0a0c14"/><ellipse cx="${x+6}" cy="275" rx="150" ry="24" fill="#fff6d8" opacity=".5" filter="url(#gs)"/>`).join('')}
  ${aPeople(r,590,6,'#03040a',.85,700,900)}<g filter="url(#gb)" opacity=".4"><ellipse cx="800" cy="640" rx="800" ry="60" fill="#c8d4f0"/></g>${aRain(r,60,.12)}`)});

artDef('corp-lobby','Corporate lobby','lobby corporate atrium reception office security elevator hq headquarters mall',()=>{const r=artRng(201);
 let col='';for(let i=0;i<7;i++){const x=120+i*220;col+=`<rect x="${x}" y="40" width="46" height="700" fill="url(#cl)"/><rect x="${x+46}" y="40" width="8" height="700" fill="#fff" opacity=".07"/>`}
 return artSvg(aG('bg',[[0,'#0a1d30'],[1,'#143a50']])+aG('cl',[[0,'#5f8aa0'],[.5,'#2a4a5c'],[1,'#0c1c28']],0)+aG('fl',[[0,'#20495c'],[1,'#07141c']])+aR('lg',[[0,'#bfffff',.9],[1,'#bfffff',0]]),
  `<rect width="1600" height="900" fill="url(#bg)"/>${col}<polygon points="0,0 1600,0 1100,120 500,120" fill="#e8ffff" opacity=".08"/>
  ${[300,800,1300].map(x=>`<rect x="${x-90}" y="30" width="180" height="16" fill="#e8ffff" opacity=".85"/><ellipse cx="${x}" cy="60" rx="150" ry="30" fill="#e8ffff" opacity=".22" filter="url(#gs)"/>`).join('')}
  <g transform="translate(800,300)" fill="none" stroke="#6cf0ff" stroke-width="6" opacity=".9"><polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45"/><path d="M0 -50 V50 M-44 -25 L44 25 M44 -25 L-44 25" stroke-width="3" opacity=".7"/></g><circle cx="800" cy="300" r="130" fill="url(#lg)" opacity=".5"/>
  <rect y="720" width="1600" height="180" fill="url(#fl)"/><rect y="718" width="1600" height="3" fill="#aff" opacity=".6"/>
  <g fill="#0b1c26"><rect x="520" y="620" width="560" height="100" rx="8"/></g><rect x="520" y="620" width="560" height="10" fill="#9ff" opacity=".7"/><rect x="600" y="570" width="90" height="50" fill="#0b1c26" stroke="#4ff" stroke-width="2"/>
  ${aPeople(r,590,1,'#04101a',1,800,860)}${[200,1400].map(x=>`<rect x="${x-70}" y="640" width="12" height="80" fill="#9ff" opacity=".8"/><rect x="${x+58}" y="640" width="12" height="80" fill="#9ff" opacity=".8"/><rect x="${x-58}" y="660" width="116" height="4" fill="#ff3b3b" opacity=".85"/>`).join('')}
  <g opacity=".35"><rect x="520" y="740" width="560" height="120" fill="#9ff" filter="url(#gb)"/></g>${aPeople(r,700,5,'#04101a',.9,150,450)}`)});

// ---- helpers used by the scene window and the picker
const artCache={};
// The GM can hide, rename, re-tag or replace the built-in pictures and add their own (collection "artlib").
// A document named after a built-in key is an override; any other document with custom:1 is a picture of the GM's own.
const artOv=k=>(pm.artlib||[]).find(x=>x&&x.id===k&&!x.deleted)||null;
function artItem(k){if(!k)return null;const o=artOv(k);
 if(ART[k])return {k,n:(o&&o.name)||ART[k].n,t:o&&typeof o.tags==='string'?o.tags:ART[k].t,img:(o&&o.img)||'',hide:!!(o&&o.hide),own:0,ov:!!o};
 if(o&&o.custom&&o.img)return {k,n:o.name||'Picture',t:o.tags||'',img:o.img,hide:!!o.hide,own:1,ov:1};return null}
function artAll(){const out=Object.keys(ART).map(artItem);
 (pm.artlib||[]).filter(x=>x&&!x.deleted&&!ART[x.id]&&x.custom&&x.img).sort((a,b)=>(a.ts||0)-(b.ts||0)).forEach(x=>out.push(artItem(x.id)));return out}
function artUri(k){const it=artItem(k);if(!it)return '';if(it.img)return '/_blob/'+it.img;if(!artCache[k]){try{artCache[k]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ART[k].f())}catch(e){artCache[k]=''}}return artCache[k]}
const artIs=v=>typeof v==='string'&&v.slice(0,4)==='art:';
// pick a fitting picture from the place, weather and time words (hidden pictures are never picked)
function artMatch(s){s=s||{};const d=(typeof atmDistrict==='function'?atmDistrict(s.loc):null),pl=((s.loc||'')+' '+(s.note||'')+' '+(d?(d.name||'')+' '+(d.tag||''):'')).toLowerCase(),wx=String(s.wx||'').toLowerCase(),tm=String(s.time||'').toLowerCase();
 const vis=artAll().filter(i=>!i.hide);if(!vis.length)return '';
 let best='',bs=0;vis.forEach(i=>{let n=0;String(i.t||'').toLowerCase().split(/[\s,]+/).forEach(t=>{if(t.length<3)return;if(pl.indexOf(t)>=0)n+=3;if(wx.indexOf(t)>=0)n+=2;if(tm.indexOf(t)>=0)n+=1});if(n>bs){bs=n;best=i.k}});
 if(!best){const t=typeof atmTime==='function'?atmTime(s.time):'';const pref=t==='night'||!t?'neon-skyline':t==='dusk'||t==='dawn'?'rooftop':'corp-tower';best=vis.some(i=>i.k===pref)?pref:vis[0].k}return best}
function artKey(v,s){if(!artIs(v))return '';return v==='art:auto'?artMatch(s):v.slice(4)}
// a signature of the picture behind a key, so a replaced picture refreshes the backdrop
const artVer=v=>{const it=artIs(v)&&v!=='art:auto'?artItem(v.slice(4)):null;return it?it.img:''};
function artSnap(){try{atmApply()}catch(e){}if(typeof board==='string'&&board==='__art'&&typeof artDraw==='function')artDraw()}
// ---- the picker inside the Set the Scene window
const artOpts=cur=>{const L=artAll().filter(i=>!i.hide),mine=L.filter(i=>i.own),bi=L.filter(i=>!i.own);
 let h='<optgroup label="Built-in pictures"><option value="art:auto">✨ Match the place (library picture)</option>'+bi.map(i=>`<option value="art:${esc(i.k)}">${esc(i.n)}</option>`).join('')+'</optgroup>';
 if(mine.length)h+='<optgroup label="Your pictures">'+mine.map(i=>`<option value="art:${esc(i.k)}">${esc(i.n)}</option>`).join('')+'</optgroup>';
 if(cur&&artIs(cur)&&cur!=='art:auto'&&!L.some(i=>'art:'+i.k===cur)){const c=artItem(cur.slice(4));h+=`<option value="${esc(cur)}">${c?esc(c.n)+' (hidden)':'(picture no longer in the library)'}</option>`}
 return h};
function artGallery(){const g=$('#scgal'),sel=$('#scp');if(!g||!sel)return;const N=()=>artAll().filter(i=>!i.hide);
 g.innerHTML=`<details style="margin:6px 0"><summary style="cursor:pointer;color:var(--cy)">🖼 Backdrop gallery (${N().length} pictures)</summary><div class="meta" style="margin:4px 0">Click a picture to use it. Your own upload and the district pictures still work.${isOwner?' <button type="button" class="btn sm" id="scgm">🖼 Manage the library</button>':''}</div><div id="scgg" class="artg"></div></details>`;
 const d=g.querySelector('details'),box=g.querySelector('#scgg');let built=false;
 const mark=()=>{box.querySelectorAll('[data-art]').forEach(b=>b.classList.toggle('on',b.dataset.art===sel.value))};
 const build=()=>{if(built)return;built=true;box.innerHTML=`<button type="button" class="art" data-art="art:auto" title="Pick a picture that fits the place, weather and time"><span class="at2">✨</span><b>Match the place</b></button>`+N().map(i=>`<button type="button" class="art" data-art="art:${esc(i.k)}" title="${esc(i.n)}"><span class="at2" style="background-image:url(&quot;${artUri(i.k)}&quot;)"></span><b>${esc(i.n)}</b></button>`).join('')+`<button type="button" class="art" data-art="" title="Use the district's first picture, if it has one"><span class="at2">∅</span><b>District / none</b></button>`;
  box.onclick=e=>{const b=e.target.closest('[data-art]');if(!b)return;sel.value=b.dataset.art;mark()};mark()};
 d.addEventListener('toggle',()=>{if(d.open)build()});sel.addEventListener('change',()=>{if(built)mark()});if(artIs(sel.value))d.open=true,build();
 const gm=g.querySelector('#scgm');if(gm)gm.onclick=e=>{e.preventDefault();$('#modal').innerHTML='';thread=null;board='__art';render()}}
(function(){const st=document.createElement('style');st.id='artcss';st.textContent=`
#atm.art .ai{filter:blur(1.5px) brightness(.78) saturate(1.1)}#atm.art .ai.on{opacity:.8}#atm.art.lv-subtle .ai.on{opacity:.5}
.artg{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px;max-height:300px;overflow:auto;padding:2px}
.artg .art{display:flex;flex-direction:column;gap:3px;padding:0;border:2px solid var(--line);background:var(--bg,#0a0a12);color:var(--tx);cursor:pointer;text-align:left;font:inherit;font-size:11px}
.artg .art.on{border-color:var(--cy);box-shadow:0 0 10px rgba(0,240,208,.4)}.artg .art:focus-visible{outline:2px solid var(--am)}
.artg .at2{display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background-size:cover;background-position:center;background-color:#10121c;font-size:22px;color:var(--dim)}
.artg .art b{padding:0 4px 4px;font-weight:normal;line-height:1.2}`;document.head.appendChild(st)})();

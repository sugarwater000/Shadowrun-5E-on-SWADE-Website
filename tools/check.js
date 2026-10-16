// Loads every script in the built site and reports syntax errors. No output means everything is fine.
const fs=require('fs'),path=require('path');const pub=path.join(__dirname,'..','public');let bad=0;
const h=fs.readFileSync(path.join(pub,'index.html'),'utf8');
[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((x,i)=>{try{new Function(x[1])}catch(e){bad++;console.log('index.html script',i,e.message)}});
try{new Function(fs.readFileSync(path.join(pub,'tabletop.js'),'utf8'))}catch(e){bad++;console.log('tabletop.js',e.message)}
if(!bad)console.log('syntax ok');process.exit(bad?1:0);

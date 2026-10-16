#!/usr/bin/env python3
"""Build the single-file site from src/.  Usage: python3 build.py [outfile]
Order: shell.html (page + styles) -> main_a.js -> modules (src/modules.txt order) -> main_b.js.
Then tools/build_worker.py writes public/_worker.js.
Afterwards every fixed pixel font size is rewritten to follow the Text size setting, exactly as before."""
import re,sys,os
H=os.path.dirname(os.path.abspath(__file__));S=H+'/src/'
rd=lambda p:open(S+p,encoding='utf-8').read()
def mods_list():
    out=[]
    for l in rd('modules.txt').splitlines():
        t=l.strip()
        if not t or t.startswith('#'):continue
        p=t.split();out.append((p[0],'@lazy' in p[1:]))
    return out
def px(s):
    s=re.sub(r'font-size:\s*(\d+(?:\.\d+)?)px',lambda m:'font-size:calc(%spx*var(--ts,1))'%m.group(1),s)
    return s
def build_both():
    """Returns (index.html text, tabletop.js text). The Tabletop modules (marked @lazy in modules.txt) go into tabletop.js, which the page fetches
    the first time someone opens the Tabletop. A short hash of that file is written into both so a stale tabletop.js is noticed."""
    import hashlib
    shell=rd('shell.html').replace('@@CSS@@',rd('css/app.css'))
    M=mods_list()
    main=rd('main_a.js')+''.join(rd('modules/'+m) for m,lz in M if not lz)+rd('main_b.js')
    lazy=''.join(rd('modules/'+m) for m,lz in M if lz)
    lazy=px(lazy)
    ver=hashlib.sha1(lazy.encode('utf-8')).hexdigest()[:10]
    tb="window.__tbv='%s';\n"%ver+lazy
    s=shell+main+rd('tail.html')
    s=px(s)
    for a,b in (("font:15px/1.5 ","font:calc(15px*var(--ts,1))/1.5 "),("font:11px 'Share Tech Mono'","font:calc(11px*var(--ts,1)) 'Share Tech Mono'")):
        assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
    assert s.count('@@TBVER@@')==1
    s=s.replace('@@TBVER@@',ver)
    return s,tb
def build():
    return build_both()[0]
if __name__=='__main__':
    out=sys.argv[1] if len(sys.argv)>1 else os.path.join(H,'public','index.html')
    s,tb=build_both();open(out,'w',encoding='utf-8').write(s)
    tp=os.path.join(os.path.dirname(out),'tabletop.js');open(tp,'w',encoding='utf-8').write(tb);print('ok',len(s),'->',out,'| tabletop.js',len(tb))
    if len(sys.argv)<=1:
        import subprocess;subprocess.check_call([sys.executable,os.path.join(H,'tools','build_worker.py')])

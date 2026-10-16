#!/usr/bin/env python3
"""Bundles the server code in functions/ into one file, public/_worker.js (Cloudflare Pages "advanced mode").
Usage: python3 tools/build_worker.py   (build.py runs it for you)"""
import os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p):return open(os.path.join(R,p),encoding='utf-8').read()
def wrap(name,src):
    src=re.sub(r'^export (async function|function|const)',r'\1',src,flags=re.M)
    return "const %s = (() => {\n%s\nreturn { onRequest: typeof onRequest!=='undefined'?onRequest:null, onRequestGet: typeof onRequestGet!=='undefined'?onRequestGet:null };\n})();\n"%(name,src.rstrip('\n')+'\n')
HEAD="""// Running the Shadow System: single-file worker (Cloudflare Pages "advanced mode").
// Generated from functions/api/[[path]].js, functions/api/v1/[[path]].js and functions/_blob/[id].js by tools/build_worker.py. Do not edit by hand.
"""
TAIL=""" 
export default {
  async fetch(request, env, ctx) {
    const p = new URL(request.url).pathname;
    const wu = f => ctx.waitUntil(f);
    try {
      if (p === '/api/v1' || p.startsWith('/api/v1/')) return await V1.onRequest({ request, env, waitUntil: wu });
      if (p.startsWith('/api/')) return await MAIN.onRequest({ request, env, waitUntil: wu });
      if (p.startsWith('/_blob/') && request.method === 'GET') return await BLOB.onRequestGet({ request, env, params: { id: p.slice(7) } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error: ' + ((e && e.message) || e) }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    const r = await env.ASSETS.fetch(request);
    // Pictures and fonts that never change under the same name may be kept by the browser for a day; the page itself is always re-checked.
    if (r.status === 200 && request.method === 'GET' && /\\.(jpe?g|png|webp|gif|woff2?)$/i.test(p)) {
      const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=86400, stale-while-revalidate=604800');
      return new Response(r.body, { status: r.status, headers: h });
    }
    return r;
  }
};
"""
out=HEAD+wrap('MAIN',rd('functions/api/[[path]].js'))+wrap('V1',rd('functions/api/v1/[[path]].js'))+wrap('BLOB',rd('functions/_blob/[id].js'))+TAIL.lstrip(' ')
open(os.path.join(R,'public','_worker.js'),'w',encoding='utf-8',newline='\n').write(out)
print('ok',len(out),'-> public/_worker.js')

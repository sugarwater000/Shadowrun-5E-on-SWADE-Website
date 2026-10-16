// Generic document store on D1 + R2 images + presence + Discord webhook.
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const own = (p, email) => !p.startsWith('data/users/') || p.split('/')[2] === email;
const isDiscordHook = u => typeof u === 'string' && /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(u);
let idxOk = false;   // a tiny index on the change time makes "has anything changed?" instant; it is created once, the first time it is needed
const ensureIdx = async DB => { if (idxOk) return true; try { await DB.prepare('CREATE INDEX IF NOT EXISTS docs_upd ON docs(updated)').run(); idxOk = true; } catch (e) { /* older setups just skip the shortcut */ } return idxOk; };

// ---- Link previews: the page title and description of a web address (fetched here so viewers never contact the site)
const unfurlOk = u => {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol) || x.username || x.password) return null;
    if (x.port && x.port !== '80' && x.port !== '443') return null;
    const h = x.hostname.toLowerCase();
    if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[') || /(^|\.)(localhost|local|internal|lan|home|corp|intranet|test|invalid)$/.test(h)) return null;
    return x;
  } catch (e) { return null; }
};
const decEnt = s => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => {
  e = e.toLowerCase();
  if (e[0] === '#') { const c = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ''; }
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e] || m;
});
const tidy = (s, n) => decEnt(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
function parseMeta(html, host) {
  const head = html.slice(0, 250000), metas = {};
  for (const m of head.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const t = m[0], k = (t.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1], c = (t.match(/content\s*=\s*"([^"]*)"/i) || t.match(/content\s*=\s*'([^']*)'/i) || [])[1];
    if (k && c !== undefined && !(k.toLowerCase() in metas)) metas[k.toLowerCase()] = c;
  }
  const title = tidy(metas['og:title'] || metas['twitter:title'] || (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 160);
  const desc = tidy(metas['og:description'] || metas['twitter:description'] || metas['description'], 260);
  const site = tidy(metas['og:site_name'], 60) || host.replace(/^www\./, '');
  return { title, desc, site };
}
const jp = s => { try { return JSON.parse(s); } catch (e) { return null; } };   // never let one bad row break a whole sync
// What happens when a countdown clock fills is only sent to players once the clock is full.
const clkOpen = d => { if (!d || !('secret' in d) || (+d.fill | 0) >= (+d.segs | 0)) return d; const c = { ...d }; delete c.secret; return c; };
const split = s => (s || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);

// --- Optional hardening: verify the Cloudflare Access login token itself ---------------------------
// If TEAM_DOMAIN and POLICY_AUD are set (see README steps), every request must carry a valid, signed
// Access token, so nobody can fake the email header by reaching the site some other way.
let jwks = null, jwksAt = 0;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
async function accessEmail(request, env) {
  const hdr = (request.headers.get('Cf-Access-Authenticated-User-Email') || '').toLowerCase();
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) return hdr;                       // hardening not turned on yet
  try {
    const tok = request.headers.get('Cf-Access-Jwt-Assertion') || '';
    const [h, p, sig] = tok.split('.');
    if (!h || !p || !sig) return '';
    const head = JSON.parse(new TextDecoder().decode(b64u(h))), pay = JSON.parse(new TextDecoder().decode(b64u(p)));
    if (head.alg !== 'RS256') return '';
    if (!jwks || Date.now() - jwksAt > 36e5 || !jwks.keys.some(k => k.kid === head.kid)) {
      jwks = await (await fetch('https://' + env.TEAM_DOMAIN + '/cdn-cgi/access/certs')).json(); jwksAt = Date.now();
    }
    const jwk = jwks.keys.find(k => k.kid === head.kid); if (!jwk) return '';
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(sig), new TextEncoder().encode(h + '.' + p));
    const aud = [].concat(pay.aud || []);
    if (!ok || !aud.includes(env.POLICY_AUD) || !(pay.exp > Date.now() / 1000) || pay.iss !== 'https://' + env.TEAM_DOMAIN) return '';
    return String(pay.email || '').toLowerCase();
  } catch (e) { return ''; }
}

export async function onRequest(ctx) {
  try { return await handle(ctx); }
  catch (e) { return J({ error: 'Server error: ' + ((e && e.message) || e) }, 500); }   // always answer in JSON so the page can show a real message
}

async function handle({ request, env, waitUntil }) {
  const email = await accessEmail(request, env);
  if (!email) return J({ error: 'Not signed in (is Cloudflare Access set up for this address?)' }, 401);
  const DB = env.DB, url = new URL(request.url), route = url.pathname.replace(/^\/api\//, ''), isGM = split(env.OWNER_EMAIL).includes(email);
  const put = (p, d, del) => { const i = p.lastIndexOf('/');
    return DB.prepare('INSERT INTO docs(path,coll,id,data,updated,deleted) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(path) DO UPDATE SET data=excluded.data,updated=excluded.updated,deleted=excluded.deleted')
      .bind(p, p.slice(0, i), p.slice(i + 1), del ? null : JSON.stringify(d), Date.now(), del ? 1 : 0).run(); };

  if (route === 'me') {
    return J({ id: email, isOwner: isGM });
  }

  if (route === 'upload') {
    const ct = (request.headers.get('content-type') || 'application/octet-stream').slice(0, 120);
    if (+(request.headers.get('content-length') || 0) > 25e6) return J({ error: 'File too large (25 MB max).' }, 400);
    let name = 'file';
    try { name = decodeURIComponent(request.headers.get('x-filename') || 'file').slice(0, 200); } catch (e) {}
    const id = crypto.randomUUID().replace(/-/g, '');
    await env.IMAGES.put(id, request.body, { httpMetadata: { contentType: ct }, customMetadata: { name } });
    return J({ id, url: '/_blob/' + id, name, type: ct });
  }

  if (route === 'storage' || route === 'storage-delete') {
    // GM only: what is stored (pictures and files in R2, the database, backups), and which uploaded files nothing refers to any more.
    if (!isGM) return J({ error: 'GM only' }, 403);
    const bb = await request.json().catch(() => ({}));
    const refs = new Map();   // file id -> the first part of the path of a document that mentions it
    let dbBytes = 0, dbDocs = 0;
    const rs = (await DB.prepare("SELECT path,data FROM docs WHERE deleted=0").all()).results;
    for (const r of rs) {
      dbDocs++; const d = r.data || ''; dbBytes += d.length;
      const m = d.match(/[0-9a-f]{32}/g); if (!m) continue;
      const c = r.path.startsWith('data/users/') ? 'private notes' : r.path.split('/')[0];
      for (const id of m) if (!refs.has(id)) refs.set(id, c);
    }
    const OLD = Date.now() - 3600e3;
    if (route === 'storage-delete') {
      const ids = (Array.isArray(bb.ids) ? bb.ids : []).map(String).filter(x => /^[0-9a-f]{32}$/.test(x)).slice(0, 500);
      let n = 0, bytes = 0;
      for (const id of ids) {
        if (refs.has(id)) continue;
        const h = await env.IMAGES.head(id); if (!h || +new Date(h.uploaded) > OLD) continue;
        await env.IMAGES.delete(id); n++; bytes += h.size || 0;
      }
      return J({ deleted: n, bytes });
    }
    const files = []; let cursor;
    do { const l = await env.IMAGES.list({ cursor, include: ['httpMetadata', 'customMetadata'] });
      l.objects.forEach(o => files.push({ id: o.key, size: o.size, up: +new Date(o.uploaded), type: (o.httpMetadata && o.httpMetadata.contentType) || '', name: (o.customMetadata && o.customMetadata.name) || '', used: refs.get(o.key) || '' }));
      cursor = l.truncated ? l.cursor : undefined; } while (cursor);
    let bk = { count: 0, bytes: 0 };
    if (env.BACKUPS) { let c2; do { const l = await env.BACKUPS.list({ prefix: 'backup-', cursor: c2 }); l.objects.forEach(o => { bk.count++; bk.bytes += o.size || 0; }); c2 = l.truncated ? l.cursor : undefined; } while (c2); }
    return J({ files: files.filter(f => f.id.length === 32), db: { docs: dbDocs, bytes: dbBytes }, backups: bk, now: Date.now(), grace: OLD });
  }

  if (route === 'export') {
    if (!isGM) return J({ error: 'GM only' }, 403);
    const rs = (await DB.prepare("SELECT path,data,deleted,updated FROM docs WHERE path NOT LIKE 'data/users/%/notes/%' ORDER BY updated").all()).results;
    return J({ exportedAt: new Date().toISOString(), count: rs.length, docs: rs.map(r => ({ path: r.path, deleted: !!r.deleted, updated: r.updated, data: jp(r.data) })) });
  }
  if (route === 'backups' || route === 'backup-view' || route === 'backup-get') {
    // GM only: look inside the daily backups kept in the BACKUPS R2 bucket, and read out chosen items so the GM can put them back.
    if (!isGM) return J({ error: 'GM only' }, 403);
    if (!env.BACKUPS) return J({ error: 'The backup bucket is not connected to the site yet.', setup: 1 }, 400);
    const bb = await request.json().catch(() => ({}));
    if (route === 'backups') {
      const out = []; let cursor;
      do { const l = await env.BACKUPS.list({ prefix: 'backup-', cursor }); l.objects.forEach(o => out.push({ key: o.key, size: o.size, uploaded: o.uploaded })); cursor = l.truncated ? l.cursor : undefined; } while (cursor);
      out.sort((x, y) => (x.key < y.key ? 1 : -1));
      return J({ backups: out });
    }
    const key = String(bb.key || '');
    if (!/^backup-\d{4}-\d{2}-\d{2}\.json$/.test(key)) return J({ error: 'That is not a backup file name.' }, 400);
    const obj = await env.BACKUPS.get(key); if (!obj) return J({ error: 'That backup was not found.' }, 404);
    const bj = await obj.json().catch(() => null); if (!bj || !Array.isArray(bj.docs)) return J({ error: 'That backup file could not be read.' }, 500);
    const good = bj.docs.filter(d => d && d.path && !d.deleted && d.data && typeof d.data === 'object' && !String(d.path).startsWith('data/users/'));
    if (route === 'backup-get') {
      const want = new Set((Array.isArray(bb.paths) ? bb.paths : []).slice(0, 300).map(String));
      return J({ docs: good.filter(d => want.has(d.path)).map(d => ({ path: d.path, data: d.data })) });
    }
    const cur = new Map(); (await DB.prepare('SELECT path,data,deleted FROM docs').all()).results.forEach(r => cur.set(r.path, r));
    const items = []; let same = 0;
    for (const d of good) {
      const r = cur.get(d.path); let st = 'same';
      if (!r) st = 'missing'; else if (r.deleted) st = 'deleted'; else if (JSON.stringify(jp(r.data)) !== JSON.stringify(d.data)) st = 'changed';
      if (st === 'same') { same++; continue; }
      const x = d.data, lab = String(x.name || x.title || x.handle || x.text || x.item || x.desc || d.path.split('/').pop()).replace(/\s+/g, ' ').slice(0, 90);
      items.push({ p: d.path, c: d.path.split('/')[0], l: lab, st, w: x.by || x.who || '' });
    }
    return J({ exportedAt: bj.exportedAt, total: good.length, same, items: items.slice(0, 6000), cut: items.length > 6000 });
  }
  const b = await request.json().catch(() => ({}));
  if (JSON.stringify(b).length > 262144) return J({ error: 'That entry is too large (256 KB max).' }, 413);
  if (route === 'discord') {
    if (!isGM) return J({ error: 'GM only' }, 403);
    if (!env.DISCORD_WEBHOOK) return J({ error: 'No Discord webhook is set up yet.' }, 400);
    const r = await fetch(env.DISCORD_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: String(b.content || '').slice(0, 1900), allowed_mentions: { parse: [] } }) });
    return r.ok ? J({ ok: 1 }) : J({ error: 'Discord refused the message (' + r.status + ').' }, 502);
  }
  if (route === 'dctest') {
    if (!isGM) return J({ error: 'Only the GM can do this.' }, 403);
    if (!isDiscordHook(b.url)) return J({ error: 'That does not look like a Discord webhook address.' }, 400);
    const nm = b.name ? ' (' + String(b.name).replace(/[@#`]/g, '').slice(0, 60) + ')' : '';
    const msg = '✅ Seattle Matrix BBS is connected to this channel' + nm + '. ' + (b.kind === 'rolls' ? 'Rolls posted with Post to Discord will appear here.' : b.forum ? 'Each conversation will appear here as its own post.' : 'Posts on that board will appear here.');
    let r, kind = 'text';
    if (b.forum) {   // a forum channel needs a post title; a plain text channel refuses one, so fall back to a normal message
      r = await fetch(b.url + '?wait=true', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: msg, thread_name: 'Seattle Matrix BBS connection test', username: 'Seattle Matrix BBS', allowed_mentions: { parse: [] } }) });
      if (r.ok) kind = 'forum';
    }
    if (!r || !r.ok) r = await fetch(b.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: msg, username: 'Seattle Matrix BBS', allowed_mentions: { parse: [] } }) });
    return r.ok ? J({ ok: 1, kind }) : J({ error: 'Discord refused it (' + r.status + '). Check that the address is right and the webhook was not deleted.' }, 502);
  }
  if (route === 'unfurl') {
    const x = unfurlOk(String(b.url || '').slice(0, 2000));
    if (!x) return J({ ok: 0 });
    if (x.hostname === url.hostname) return J({ ok: 0 });
    const ck = (typeof caches !== 'undefined' && caches.default) ? new Request('https://unfurl.cache.invalid/' + encodeURIComponent(x.href)) : null;
    try { if (ck) { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { status: 200, headers: { 'content-type': 'application/json' } }); } } catch (e) { /* no cache available */ }
    const out = async (o, ttl) => { const r = J(o); try { if (ck) waitUntil(caches.default.put(ck, new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + ttl } }))); } catch (e) { } return r; };
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4500);
    try {
      let cur = x, res = null;
      for (let i = 0; i < 4; i++) {
        res = await fetch(cur.href, { redirect: 'manual', signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; SeattleMatrixBBS-LinkPreview/1.0)', accept: 'text/html,application/xhtml+xml' } });
        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get('location'), nx = loc ? unfurlOk(new URL(loc, cur).href) : null;
          if (!nx) return out({ ok: 0 }, 3600);
          cur = nx; res = null; continue;
        }
        break;
      }
      if (!res || !res.ok || !/text\/html|application\/xhtml/i.test(res.headers.get('content-type') || '')) return out({ ok: 0 }, 3600);
      const rd = res.body.getReader(), dec = new TextDecoder('utf-8', { fatal: false });
      let html = '', got = 0;
      while (got < 300000) { const { done, value } = await rd.read(); if (done) break; got += value.length; html += dec.decode(value, { stream: true }); if (/<\/head>/i.test(html)) break; }
      try { rd.cancel(); } catch (e) { }
      const m = parseMeta(html, cur.hostname);
      if (!m.title && !m.desc) return out({ ok: 0 }, 3600);
      return out({ ok: 1, title: m.title, desc: m.desc, site: m.site }, 86400);
    } catch (e) { return J({ ok: 0 }); } finally { clearTimeout(to); }
  }
  if (route === 'roll') {
    // Dice rolls can go to their own Discord channel (DISCORD_ROLLS_WEBHOOK). If that isn't set, they use the main one.
    // The GM normally sets the dice channel in the site (GM Tools, Discord Channels, "Dice rolls"), stored with the other channels as hooks.__rolls.
    let rollsHook = null;
    try { const hr = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind('discordhooks/main').first(); const hk = (hr && hr.data ? (jp(hr.data) || {}).hooks : null) || {}; if (isDiscordHook(hk.__rolls)) rollsHook = hk.__rolls; } catch (e) { /* fall back below */ }
    rollsHook = rollsHook || env.DISCORD_ROLLS_WEBHOOK || env.DISCORD_WEBHOOK;
    if (!rollsHook) return J({ error: 'No Discord channel is set up for dice rolls yet. The GM can add one in GM Tools, Discord Channels.' }, 400);
    const name = String(b.name || email.split('@')[0] || 'Dice Roller').replace(/discord|clyde|[@#:`]/gi, '').trim().slice(0, 80) || 'Dice Roller';
    const r = await fetch(rollsHook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: String(b.content || '').slice(0, 1500), username: name, allowed_mentions: { parse: [] } }) });
    return r.ok ? J({ ok: 1 }) : J({ error: 'Discord refused the message (' + r.status + ').' }, 502);
  }

  if (route === 'sync') {
    // Idle polls are the common case. One cheap look at the newest change in the whole database tells us whether
    // anything at all changed since the page last synced; if not, skip every per-collection query.
    // (Only trusted when that newest change is older than a moment, so two writes in the same millisecond cannot be missed.)
    let gv = 0;
    if (await ensureIdx(DB)) {
      const mr = await DB.prepare('SELECT MAX(updated) AS m FROM docs').first();
      const m0 = (mr && +mr.m) || 0;
      if (m0 && m0 < Date.now() - 1500) {
        if (b.gv && +b.gv === m0) return J({ _same: 1, _gv: m0 });
        gv = m0;
      }
    }
    let shOn = null;
    if (!isGM && (b.items || []).some(it => /^(safehouse|stash)(\/|$)/.test(it.path || ''))) {
      const m = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind('safehouse/main').first(); const md = m && m.data ? jp(m.data) : null; shOn = !!(md && md.enabled === true);
    }
    const one = async it => {
      const p = it.path || '';
      if (!own(p, email) || (!isGM && /^(scenepresets|streetcustom|discordhooks|discordthreads)(\/|$)/.test(p))) return it.t === 'doc' ? { data: null } : { docs: [], since: 0 }; // scene presets are GM prep, never sent to players
      // The team safe house stays invisible to players until the GM switches it on.
      if (!isGM && /^(safehouse|stash)(\/|$)/.test(p) && !shOn) return it.t === 'doc' ? { data: null } : { docs: [], since: 0 };
      if (it.t === 'doc') {
        const r = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(p).first();
        let dd = r && r.data ? jp(r.data) : null;
        if (dd && p.startsWith('sheets/') && !isGM && dd.hidden === true && dd.uid !== email) dd = null;
        // GM-only notes on factions and districts are never sent to players.
        if (dd && !isGM && /^(heat|districts)\//.test(p) && 'secret' in dd) { dd = { ...dd }; delete dd.secret; }
        // Countdown clocks: a GM-only clock is invisible to players, and what happens when a clock fills stays secret until it is full.
        if (dd && !isGM && /^clocks\//.test(p)) dd = dd.hide === true ? null : clkOpen(dd);
        return { data: dd };
      }
      const rs = (await DB.prepare('SELECT id,data,deleted,updated FROM docs WHERE coll=?1 AND updated>=?2 ORDER BY updated').bind(p, it.since || 0).all()).results;
      // A sheet its owner has hidden is shown to nobody but the owner and the GM; everyone else is told it is gone.
      const hid = d => (p === 'sheets' && !isGM && d && d.hidden === true && d.uid !== email) || (p === 'clocks' && !isGM && d && d.hide === true);
      const nosec = d => (!isGM && (p === 'heat' || p === 'districts') && d && 'secret' in d) ? (() => { const c = { ...d }; delete c.secret; return c; })() : d;
      return { docs: rs.map(r => { const d = jp(r.data); return hid(d) ? { id: r.id, deleted: true, data: null } : { id: r.id, deleted: !!r.deleted, data: (p === 'clocks' && !isGM) ? clkOpen(nosec(d)) : nosec(d) }; }), since: rs.length ? rs[rs.length - 1].updated : (it.since || 0) };
    };
    // All the lookups run side by side instead of one after another.
    const items = (b.items || []).slice(0, 80), res = await Promise.all(items.map(one)), out = {};
    items.forEach((it, k) => { out[it.k] = res[k]; });
    out._gv = gv;
    return J(out);
  }

  if (route === 'doc') {
    const p = b.path || '';
    if (!p || !own(p, email)) return J({ error: 'forbidden' }, 403);
    // The edge and hindrance library is one shared list that every player may edit (no special rule needed here).
    // Ticker lines and weather/traffic parts are the GM's to change.
    if (p === 'meta/flavor' && !isGM) return J({ error: 'Only the GM can change the ticker and weather lists.' }, 403);
    if (/^(heat|districts|broadcasts|safehouse|scenepresets|discordhooks|dcnotice|discordthreads|fumble|requests|tbmaps|tbfog|tbmeta|tblib|clocks|streetlog|streetcustom|artlib)(\/|$)/.test(p) && !isGM) return J({ error: 'Only the GM can change this.' }, 403);
    if (p === 'meta/score' && !isGM) return J({ error: 'Only the GM can reset the scoreboard.' }, 403);
    if (p === 'meta/scene' && !isGM) return J({ error: 'Only the GM can change the scene.' }, 403);
    if (p === 'meta/alarm' && !isGM) return J({ error: 'Only the GM can change the alarm level.' }, 403);
    // Channel list: anyone can add a channel, only the GM can delete one.
    if (p === 'meta/boards' && !isGM) {
      const o = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(p).first();
      const cur = o && o.data ? ((jp(o.data) || {}).list || []) : [], nxt = ((b.data || {}).list) || [];
      if (b.del || !cur.every(c => nxt.some(n => n.id === c.id))) return J({ error: 'Only the GM can delete channels.' }, 403);
    }
    // Character sheets: everyone can read and edit them (unless the owner has hidden the sheet). Only the creator or the GM
    // can delete or replace one, hide or unhide it, or change who owns it. Anyone can restore one from the Trash.
    if (p.startsWith('sheets/') && !isGM) {
      const o = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(p).first();
      if (o && o.data) {
        const cur = jp(o.data) || {}, mine = !!cur.uid && cur.uid === email, d = b.data || {}, keys = Object.keys(d);
        if (cur.hidden === true && !mine) return J({ error: 'This sheet is hidden by its owner.' }, 403);
        const restore = !b.del && d.deleted === false && keys.every(k => ['deleted', 'delAt', 'delBy'].includes(k));
        const editOk = !b.del && b.merge && d.deleted !== true && !keys.includes('uid') && !keys.includes('hidden');
        const statusOk = !b.del && b.merge && keys.length === 1 && keys[0] === 'status' && Array.isArray(d.status); // anyone can mark conditions
        if (!mine && !restore && !editOk && !statusOk) return J({ error: "Only the player who created this sheet, or the GM, can delete or replace it." }, 403);
      }
    }
    // Shared custom gear: anyone can add an item, only the person who added it (or the GM) can change or remove it.
    if (p.startsWith('customgear/') && !isGM) {
      const o = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(p).first();
      if (o && o.data) { const cur = jp(o.data) || {}; if (!cur.uid || cur.uid !== email) return J({ error: 'Only the person who added this item, or the GM, can change it.' }, 403); }
    }
    if (b.del) { await put(p, null, true); return J({ ok: 1 }); }
    let d = b.data || {};
    if (b.merge) {
      const o = await DB.prepare('SELECT data,deleted FROM docs WHERE path=?1').bind(p).first();
      // An update must never bring back something that was permanently deleted a moment ago
      // (otherwise a late update leaves an empty ghost entry behind).
      if (o && o.deleted) return J({ ok: 1, skipped: 'deleted' });
      d = { ...((o && o.data && jp(o.data)) || {}), ...d };
    }
    await put(p, d); return J({ ok: 1 });
  }

  if (route === 'add') {
    const coll = b.path || '', d = b.data || {};
    if (!coll || !own(coll, email)) return J({ error: 'forbidden' }, 403);
    if (/^(heat|districts|broadcasts|safehouse|scenepresets|discordhooks|dcnotice|discordthreads|fumble|requests|tbmaps|tbfog|tbmeta|tblib|clocks|streetlog|streetcustom|artlib)(\/|$)/.test(coll) && !isGM) return J({ error: 'Only the GM can change this.' }, 403);
    if (coll === 'customgear') d.uid = email;
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    await put(coll + '/' + id, d);
    // Per-channel Discord mirroring: a post on a board that has its own webhook is sent there in full.
    // Off Screen Scenes and Private Channels are mirrored into Discord FORUM channels: every scene / conversation becomes
    // one forum post (named after it) and each message is added to that post. Dossiers and hidden boards are never sent.
    let mirrored = false;
    const forum = d.board === 'scenes' || d.board === 'dm';
    if (coll === 'posts' && !d.imported && d.board && !d.dossier && !/^(dossiers|__)/.test(String(d.board)) && (forum || (!d.to && !/^dm/.test(String(d.board))))) {
      try {
        const hr = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind('discordhooks/main').first();
        const hooks = (hr && hr.data ? (jp(hr.data) || {}).hooks : null) || {}, hook = hooks[d.board];
        if (isDiscordHook(hook)) {
          const mn = [...String(d.body || '').matchAll(/@\[([^\]]+)\]/g)].map(x => x[1]), ids = [];
          for (const n of [...new Set(mn)].slice(0, 10)) {
            const r = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind('discord/' + n.toLowerCase().replace(/[\/\\?#]/g, '_')).first();
            if (r && r.data) { const x = (jp(r.data) || {}).did; if (/^\d{15,22}$/.test(String(x))) ids.push(String(x)); }
          }
          const body = String(d.body || '').replace(/@\[([^\]]+)\]/g, '@$1').replace(/\+\+(.+?)\+\+/g, '__$1__').replace(/(^|\n)(#{1,2}) /g, '$1### ').replace(/\n---(\n|$)/g, '\n──────\n');
          const imgs = (d.imgs || []).filter(x => /^[0-9a-f]{8,64}$/i.test(String(x))).map(x => url.origin + '/_blob/' + x);
          const who = d.sc ? String(d.sc).slice(0, 60) + ' (' + d.handle + ')' : d.handle, name = String(who || 'Unknown').replace(/discord|clyde|[@#:`]/gi, '').trim().slice(0, 80) || 'Unknown';
          const tail = (imgs.length ? '\n' + imgs.join('\n') : '') + (ids.length ? '\n' + ids.map(i => '<@' + i + '>').join(' ') : '') + '\n🔗 ' + url.origin + '/?p=' + id;
          const fit = (head) => { const room = Math.max(200, 1950 - head.length - tail.length); return (head + (body.length > room ? body.slice(0, room - 1) + '…' : body) + tail).slice(0, 2000); };
          const send = (u, extra, head) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: fit(head), username: name, allowed_mentions: { parse: [], users: ids }, ...extra }) });
          if (!forum) {
            const head = d.op && d.title ? '📝 **' + String(d.title).slice(0, 200) + '**\n' : '';
            waitUntil(send(hook, {}, head).catch(() => {}));
          } else {
            const key = 'discordthreads/' + String(d.thread || id).replace(/[\/\\?#]/g, '_'), lc = x => String(x || '').trim().toLowerCase();
            if (d.op) await put(key, { pending: Date.now() });   // reserve the slot so a quick reply cannot open a second forum post
            waitUntil((async () => {
              const rd = async () => { const r = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(key).first(); return r && r.data ? jp(r.data) : null; };
              let rec = d.op ? { title: d.title, to: d.to, tos: d.tos, oh: d.handle } : await rd();
              if (!d.op) {   // a reply that arrives while the first message is still being sent waits for it (up to ~8 s)
                for (let k = 0; k < 16 && rec && rec.pending && !rec.tid && Date.now() - rec.pending < 9000; k++) { await new Promise(r => setTimeout(r, 500)); rec = await rd(); }
                if (!rec || (!rec.tid && !rec.plain)) {   // nothing recorded yet (conversation started before Discord was connected): rebuild from the first message
                  const o = await DB.prepare("SELECT data FROM docs WHERE coll='posts' AND deleted=0 AND json_extract(data,'$.thread')=?1 AND json_extract(data,'$.op')=1 LIMIT 1").bind(String(d.thread || '')).first();
                  const od = (o && o.data ? jp(o.data) : null) || {};
                  rec = { title: od.title, to: od.to, tos: od.tos, oh: od.handle };
                }
              }
              const dm = d.board === 'dm';
              // who the message is for: in a one-to-one chat the other person, in a group chat everyone else in it
              const mem = [rec.oh, ...(Array.isArray(rec.tos) && rec.tos.length ? rec.tos : [rec.to])].map(x => String(x || '').trim()).filter(Boolean), rest = mem.filter(m => lc(m) !== lc(d.handle));
              const other = dm ? (rest.length && rest.length < mem.length ? rest.join(', ') : (lc(d.handle) === lc(rec.to) ? rec.oh : rec.to)) : '';
              const pre = dm && other ? '✉️ → **' + String(other).replace(/[@#`*]/g, '').slice(0, 60) + '**\n' : '';
              const tname = (dm ? String(rec.oh || '?') + ' → ' + String(rec.to || '?') + ': ' + String(rec.title || 'Private message') : String(rec.title || 'Scene')).replace(/[@#`]/g, '').slice(0, 100);
              const base = { title: rec.title, to: rec.to, tos: rec.tos, oh: rec.oh };
              if (rec.tid) {
                const r = await send(hook + '?thread_id=' + rec.tid, {}, pre);
                if (r.ok) return;
                if (r.status !== 404 && r.status !== 400) return;   // a temporary problem: skip this one message
              } else if (rec.plain) { await send(hook, {}, pre); return; }
              const r = await send(hook + '?wait=true', { thread_name: tname }, pre);
              if (r.ok) { const j = await r.json().catch(() => null); if (j && j.channel_id) await put(key, { ...base, tid: String(j.channel_id) }); return; }
              // not a forum channel (a plain text channel refuses a post title): send ordinary messages with a title line instead
              await put(key, { ...base, plain: 1 });
              await send(hook, {}, (d.op && rec.title ? '📝 **' + String(rec.title).slice(0, 200) + '**\n' : '') + pre);
            })().catch(() => {}));
          }
          mirrored = true;
        }
      } catch (e) { /* fall back to the normal notice */ }
    }
    if (coll === 'posts' && env.DISCORD_WEBHOOK && !d.imported && !mirrored) {
      const mn = [...String(d.body || '').matchAll(/@\[([^\]]+)\]/g)].map(x => x[1]);
      const names = [...new Set([...mn, ...(Array.isArray(d.tos) && d.tos.length ? d.tos.map(String) : d.to ? [d.to] : [])])].slice(0, 10), ids = [];
      for (const n of names) {
        const r = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind('discord/' + n.toLowerCase().replace(/[\/\\?#]/g, '_')).first();
        if (r && r.data) { const x = (jp(r.data) || {}).did; if (/^\d{15,22}$/.test(String(x))) ids.push(String(x)); }
      }
      const msg = `${d.op ? '📝 New thread' : '💬 Reply'}${d.to ? ' (private → ' + d.to + ')' : ''} by **${d.sc ? d.sc + ' (' + d.handle + ')' : d.handle}**${d.title ? ': ' + d.title : ''}${mn.length ? '\nMentions: ' + mn.join(', ') : ''}${ids.length ? '\n' + ids.map(i => '<@' + i + '>').join(' ') : ''}\n${url.origin}/?p=${id}`;
      waitUntil(fetch(env.DISCORD_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: msg.slice(0, 1900), allowed_mentions: { parse: [], users: ids } }) }).catch(() => {}));
    }
    return J({ id });
  }

  if (route === 'presence') {
    if (b.data && JSON.stringify(b.data).length < 2000) await DB.prepare('INSERT INTO presence(email,data,updated) VALUES(?1,?2,?3) ON CONFLICT(email) DO UPDATE SET data=excluded.data,updated=excluded.updated').bind(email, JSON.stringify(b.data), Date.now()).run();
    const rs = (await DB.prepare('SELECT email,data FROM presence WHERE updated>?1').bind(Date.now() - 45000).all()).results;
    return J({ peers: rs.map(r => ({ by: r.email, peer: r.email, presence: jp(r.data) || {} })) });
  }
  return J({ error: 'not found' }, 404);
}

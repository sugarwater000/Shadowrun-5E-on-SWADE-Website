// Read-only public API (v1) for Seattle Matrix BBS.  GET only.  Nothing here can change any data.
//
// Who may call it:
//   1. A program with an API key (set the secret API_KEYS, see API.md), sent as  Authorization: Bearer <key>  or  X-API-Key: <key>
//   2. A signed-in player in a browser (handy for trying it out): just open /api/v1/characters while logged in.
// Never exposed: private session notes and profiles (data/users/*), Discord IDs, and players' email addresses.

const J = (o, s = 200) => new Response(JSON.stringify(o, null, 2), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const lc = s => String(s || '').toLowerCase();

// ---- sign-in check for browser sessions (same rules as the main app) ----
let jwks = null, jwksAt = 0;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
async function accessEmail(request, env) {
  const hdr = lc(request.headers.get('Cf-Access-Authenticated-User-Email'));
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) return hdr;
  try {
    const tok = request.headers.get('Cf-Access-Jwt-Assertion') || '', [h, p, sig] = tok.split('.');
    if (!h || !p || !sig) return '';
    const head = JSON.parse(new TextDecoder().decode(b64u(h))), pay = JSON.parse(new TextDecoder().decode(b64u(p)));
    if (head.alg !== 'RS256') return '';
    if (!jwks || Date.now() - jwksAt > 36e5 || !jwks.keys.some(k => k.kid === head.kid)) { jwks = await (await fetch('https://' + env.TEAM_DOMAIN + '/cdn-cgi/access/certs')).json(); jwksAt = Date.now(); }
    const jwk = jwks.keys.find(k => k.kid === head.kid); if (!jwk) return '';
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(sig), new TextEncoder().encode(h + '.' + p));
    if (!ok || ![].concat(pay.aud || []).includes(env.POLICY_AUD) || !(pay.exp > Date.now() / 1000) || pay.iss !== 'https://' + env.TEAM_DOMAIN) return '';
    return lc(pay.email);
  } catch (e) { return ''; }
}

// ---- API keys: secret API_KEYS = "bot:longrandomkey, other:anotherkey"  (a bare key with no name is called "key1", "key2"...) ----
function sameStr(a, b) { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; }
function keyName(request, env) {
  const h = request.headers.get('authorization') || '', given = (/^Bearer\s+(.+)$/i.exec(h) || [])[1] || request.headers.get('x-api-key') || '';
  if (!given || !env.API_KEYS) return '';
  let found = '';
  String(env.API_KEYS).split(/[\s,;]+/).filter(Boolean).forEach((e, i) => {
    const j = e.indexOf(':'), name = j > 0 ? e.slice(0, j) : 'key' + (i + 1), k = j > 0 ? e.slice(j + 1) : e;
    if (k.length >= 16 && sameStr(given.trim(), k)) found = name;
  });
  return found;
}

// ---- helpers ----
const strip = o => { if (!o || typeof o !== 'object') return o; const c = { ...o }; delete c.uid; delete c.did; delete c.hist; delete c.deleted; delete c.delAt; delete c.delBy; return c; };
async function coll(DB, name, since = 0, keep) {
  const rs = (await DB.prepare('SELECT id,data,updated FROM docs WHERE coll=?1 AND deleted=0 AND updated>?2 ORDER BY updated DESC LIMIT 5000').bind(name, since).all()).results;
  const out = [];
  for (const r of rs) { if (!r.data) continue; let d; try { d = JSON.parse(r.data); } catch (e) { continue; } if (d && d.deleted) continue; if (keep && !keep(d)) continue; out.push({ id: r.id, ...strip(d), updatedAt: r.updated }); }
  return out;
}
async function one(DB, path) { const r = await DB.prepare('SELECT data FROM docs WHERE path=?1 AND deleted=0').bind(path).first(); try { return r && r.data ? JSON.parse(r.data) : null; } catch (e) { return null; } }
const page = (items, q, sortKey, dflt = 50) => {
  const lim = Math.min(200, Math.max(1, parseInt(q.get('limit')) || dflt)), asc = q.get('order') === 'asc';
  items = [...items].sort((a, b) => ((a[sortKey] || 0) - (b[sortKey] || 0)) * (asc ? 1 : -1));
  const total = items.length, got = items.slice(0, lim);
  return { total, count: got.length, items: got, next_since: got.length ? Math.max(...got.map(x => x.updatedAt || 0)) : (+q.get('since') || 0) };
};

// armor + toughness, same rules as the character sheet in the app
const armInfo = x => { const t = String(x.info || ''), m = t.match(/Armor\s*(\+)?\s*(\d+)/); if (!m || !(x.cat === 'Armor' || m[1]) || !(+m[2] > 0)) return null;
  const tail = t.slice(m.index), L = ['Head', 'Torso', 'Arms', 'Legs'].filter(l => new RegExp('\\b' + l + '\\b').test(tail));
  return { v: +m[2], add: !!m[1] || /stacks full value/i.test(t), L: m[1] ? ['Head', 'Torso', 'Arms', 'Legs'] : (L.length ? L : ['Torso', 'Arms', 'Legs']) }; };
function derive(sh, inv, ledger) {
  const half = n => Math.floor((+n || 0) / 2), vig = +((sh.at || {}).vigor || {}).d || 4, fight = +(((sh.sk || {}).agility || []).find(x => x.n === 'Fighting') || {}).d || 0;
  const worn = inv.filter(x => x.worn && armInfo(x)), sum = sh.armStack === 'add', ex = +sh.armor || 0, loc = { Head: 0, Torso: 0, Arms: 0, Legs: 0 };
  Object.keys(loc).forEach(l => { let hi = 0, tot = 0, ad = 0; worn.forEach(x => { const a = armInfo(x); if (!a.L.includes(l)) return; if (a.add) ad += a.v; else { hi = Math.max(hi, a.v); tot += a.v; } }); loc[l] = (sum ? tot : hi) + ad + ex; });
  const base = 2 + half(vig) + (+sh.toughMod || 0), who = lc(sh.handle || sh.name);
  return { toughness: base + loc.Torso, toughnessBase: base, parry: 2 + half(fight) + (+sh.parryMod || 0), armor: loc, wornArmor: worn.map(x => x.name),
    funds: ledger.filter(x => x.type !== 'Item' && lc(x.holder || 'Party') === who).reduce((a, x) => a + (+x.amount || 0), 0) };
}
const equip = x => ({ id: x.id, name: x.name, qty: x.qty || 1, category: x.cat, grade: x.grade || null, worn: !!x.worn, info: x.info || '', note: x.note || '' });

const SIMPLE = { jobs: 'jobs', missions: 'missions', contacts: 'contacts', downtime: 'downtime', events: 'events', ledger: 'ledger', inventory: 'inventory', pins: 'mappins', handouts: 'handouts', npcs: 'npcs', feedback: 'feedback', heat: 'heat', districts: 'districts', broadcasts: 'broadcasts', customgear: 'customgear', safehouse: 'safehouse', stash: 'stash', glossary: 'glossary' };
const ENDPOINTS = ['/api/v1', '/api/v1/clock', '/api/v1/scene', '/api/v1/boards', '/api/v1/posts?board=&thread=&handle=&since=&limit=&order=', '/api/v1/characters', '/api/v1/characters/{id}', '/api/v1/rolls?limit=&since=', '/api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD',
  ...Object.keys(SIMPLE).map(k => '/api/v1/' + k + '?limit=&since=' + (k === 'inventory' ? '&owner=' : ''))];

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return J({ error: 'This API is read-only. Use GET.' }, 405);
  const key = keyName(request, env), email = key ? '' : await accessEmail(request, env);
  if (!key && !email) return J({ error: 'Unauthorized. Send your API key as "Authorization: Bearer <key>" (or sign in through the site in a browser).' }, 401);
  const DB = env.DB, url = new URL(request.url), q = url.searchParams, parts = url.pathname.replace(/^\/api\/v1\/?/, '').split('/').filter(Boolean).map(decodeURIComponent), r = parts[0] || '';
  const since = +q.get('since') || 0;

  if (!r) return J({ name: 'Seattle Matrix BBS read-only API', version: 1, signedInAs: key ? 'API key "' + key + '"' : 'player session', endpoints: ENDPOINTS });
  if (r === 'scene') { const c = (await one(DB, 'meta/scene')) || {}; return J({ location: c.loc || '', time: c.time || '', weather: c.wx || '', note: c.note || '', setBy: c.by || null, setAt: c.at || null }); }
  if (r === 'clock') { const c = (await one(DB, 'meta/clock')) || {}; return J({ gameTime: c.t || null, setAtRealTime: c.at || null, note: 'The in-game clock keeps running from this moment, one game minute per real minute.' }); }

  if (r === 'boards') {
    const custom = ((await one(DB, 'meta/boards')) || {}).list || [], posts = await coll(DB, 'posts'), n = {};
    posts.forEach(p => { n[p.board] = (n[p.board] || 0) + 1; });
    return J({ custom: custom.map(c => ({ id: c.id, name: c.name, group: c.grp })), boardsWithPosts: Object.keys(n).sort().map(id => ({ id, posts: n[id] })) });
  }

  if (r === 'posts') {
    let ps = await coll(DB, 'posts', since);
    if (q.get('board')) ps = ps.filter(p => p.board === q.get('board'));
    if (q.get('thread')) ps = ps.filter(p => p.thread === q.get('thread'));
    if (q.get('handle')) ps = ps.filter(p => lc(p.handle) === lc(q.get('handle')));
    ps.forEach(p => { delete p.hist; delete p.col; });
    return J(page(ps.map(p => ({ ...p, postedAt: p.ts ? new Date(p.ts).toISOString() : null })), q, 'ts'));
  }

  if (r === 'characters') {
    const gm = !!email && String(env.OWNER_EMAIL || '').toLowerCase().split(/[\s,;]+/).filter(Boolean).includes(email);
    const sheets = await coll(DB, 'sheets', 0, d => d.hidden !== true || gm || (!!email && d.uid === email)), inv = await coll(DB, 'inventory'), led = await coll(DB, 'ledger');
    const mine = s => inv.filter(x => lc(x.owner) === lc(s.handle || s.name));
    if (parts[1]) {
      const id = parts[1], s = sheets.find(x => x.id === id) || sheets.find(x => lc(x.name) === lc(id) || lc(x.handle) === lc(id));
      if (!s) return J({ error: 'No such character.' }, 404);
      const eq = mine(s); return J({ ...s, derived: derive(s, eq, led), equipment: eq.map(equip) });
    }
    return J({ count: sheets.length, items: sheets.map(s => ({ id: s.id, name: s.name, handle: s.handle, player: s.player, concept: s.concept, wounds: s.wounds, fatigue: s.fatigue, bennies: s.bennies, derived: derive(s, mine(s), led) })) });
  }

  if (r === 'rolls') {
    const clr = ((await one(DB, 'meta/rolls')) || {}).clearedAt || 0, rs = (await coll(DB, 'rolls', since)).filter(x => (x.ts || 0) > clr);
    return J(page(rs.map(x => ({ id: x.id, who: x.who, roll: String(x.text || '').replace(/\*\*/g, ''), rolledAt: x.ts ? new Date(x.ts).toISOString() : null, ts: x.ts, updatedAt: x.updatedAt })), q, 'ts'));
  }

  if (r === 'calendar') {
    const from = q.get('from') || '', to = q.get('to') || '', day = d => (String(d || '').match(/^\d{4}-\d{2}-\d{2}/) || [''])[0], items = [];
    (await coll(DB, 'events')).forEach(x => items.push({ type: 'event', id: x.id, title: x.title, date: x.date, note: x.note || '' }));
    (await coll(DB, 'jobs')).filter(x => x.deadline && x.status !== 'Done' && x.status !== 'Failed').forEach(x => items.push({ type: 'job deadline', id: x.id, title: x.title, date: x.deadline }));
    (await coll(DB, 'mappins')).filter(x => x.date).forEach(x => items.push({ type: 'map pin', id: x.id, title: x.title, date: x.date, note: x.note || '' }));
    const out = items.filter(x => { const d = day(x.date); return (!from && !to) || (d && (!from || d >= from) && (!to || d <= to)); }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return J({ count: out.length, items: out });
  }

  if (SIMPLE[r]) {
    if (r === 'safehouse' || r === 'stash') { const m = await one(DB, 'safehouse/main'); if (!m || m.enabled !== true) return J(page([], q, 'updatedAt')); } // hidden until the GM enables it
    let rs = await coll(DB, SIMPLE[r], since);
    if (r === 'inventory' && q.get('owner')) rs = rs.filter(x => lc(x.owner) === lc(q.get('owner')));
    if (r === 'heat' || r === 'districts') rs = rs.map(x => { const c = { ...x }; delete c.secret; return c; });
    return J(page(rs, q, 'updatedAt'));
  }
  return J({ error: 'Not found. See /api/v1 for the list of endpoints.' }, 404);
}

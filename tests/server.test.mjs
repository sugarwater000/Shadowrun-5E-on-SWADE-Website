// Runs the REAL built _worker.js against a REAL SQLite database (node:sqlite) with the real schema.sql.
// usage: node tests/server.test.mjs   (needs Node 22.5 or newer)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const [wpath, spath, bpath] = [path.join(root, 'public', '_worker.js'), path.join(root, 'schema.sql'), path.join(root, 'backup-worker', 'src', 'index.js')];
const loadEsm = async p => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(p, 'utf8')).toString('base64'));
const worker = (await loadEsm(wpath)).default;
const sql = new DatabaseSync(':memory:'); sql.exec(fs.readFileSync(spath, 'utf8'));
const D1 = { prepare: q => { const st = sql.prepare(q); const mk = args => ({
  bind: (...a) => mk(a),
  run: async () => { st.run(...args); return { success: true }; },
  first: async () => st.get(...args) || null,
  all: async () => ({ results: st.all(...args) }) }); return mk([]); }, exec: async q => sql.exec(q) };
const bucket = () => { const m = new Map(); return { m,
  put: async (k, body, o) => { const buf = body && body.getReader ? Buffer.from(await new Response(body).arrayBuffer()) : Buffer.from(body || ''); m.set(k, { buf, o, uploaded: new Date() }); },
  get: async k => { const r = m.get(k); return r ? { body: new Response(r.buf).body, httpMetadata: r.o && r.o.httpMetadata, size: r.buf.length, text: async () => r.buf.toString('utf8'), json: async () => JSON.parse(r.buf.toString('utf8')), writeHttpMetadata(h) { if (r.o && r.o.httpMetadata) h.set('content-type', r.o.httpMetadata.contentType); } } : null; },
  head: async k => { const r = m.get(k); return r ? { size: r.buf.length, uploaded: r.uploaded } : null; },
  delete: async k => { m.delete(k); },
  list: async () => ({ objects: [...m].map(([key, r]) => ({ key, size: r.buf.length, uploaded: r.uploaded, httpMetadata: r.o && r.o.httpMetadata, customMetadata: r.o && r.o.customMetadata })), truncated: false }) }; };
const IMAGES = bucket(), BACKUPS = bucket();
const env = { DB: D1, IMAGES, BACKUPS, OWNER_EMAIL: 'gm@x.com', ASSETS: { fetch: async () => new Response('<html>site</html>', { headers: { 'content-type': 'text/html' } }) } };
const sent = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => { sent.push({ u: String(u), b: o && o.body ? JSON.parse(o.body) : null }); return new Response(JSON.stringify({ channel_id: '777' }), { status: 200 }); };
const api = async (email, route, body, extra = {}) => { const r = await worker.fetch(new Request('https://site.test/api/' + route, { method: 'POST', headers: { 'content-type': 'application/json', ...(email ? { 'Cf-Access-Authenticated-User-Email': email } : {}), ...extra }, body: JSON.stringify(body || {}) }), env, { waitUntil: p => p && p.catch && p.catch(() => {}) }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j }; };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); };
const ok = (c, m) => { if (!c) throw new Error(m); };
const G = 'gm@x.com', A = 'ann@x.com', B = 'bob@x.com';
// the page itself is served
let r = await worker.fetch(new Request('https://site.test/'), env, { waitUntil() {} }); ok((await r.text()).includes('site'), 'static asset passthrough');
// login required
eq((await api('', 'me')).s, 401, 'no login');
eq((await api(G, 'me')).j, { id: G, isOwner: true }, 'gm me'); eq((await api(A, 'me')).j.isOwner, false, 'player me');
// documents
eq((await api(A, 'doc', { path: 'sheets/s1', data: { name: 'Ann Fox', uid: A } })).s, 200, 'player creates own sheet');
eq((await api(B, 'doc', { path: 'sheets/s1', data: { name: 'Hijack', uid: B } })).s, 403, 'other player cannot replace');
eq((await api(B, 'doc', { path: 'sheets/s1', data: { hp: 3 }, merge: true })).s, 200, 'other player can edit by merge');
eq((await api(A, 'doc', { path: 'tbmaps/m1', data: { name: 'x' } })).s, 403, 'player cannot write GM-only collection');
eq((await api(G, 'doc', { path: 'tbmaps/m1', data: { name: 'Warehouse' } })).s, 200, 'gm writes map');
eq((await api(A, 'doc', { path: 'data/users/bob@x.com/prefs', data: { x: 1 } })).s, 403, "cannot write someone's private doc");
eq((await api(A, 'doc', { path: 'data/users/ann@x.com/prefs', data: { x: 1 } })).s, 200, 'own private doc');
let a1 = await api(A, 'add', { path: 'posts', data: { board: 'pub-general', op: true, thread: 't1', title: 'Hello', handle: 'Ann', body: 'hi', ts: 1 } }); ok(/^[0-9a-f]{20}$/.test(a1.j.id), 'add id');
// sync: collection, doc, since, deletions, privacy
let s = await api(B, 'sync', { items: [{ t: 'coll', k: 'posts', path: 'posts' }, { t: 'doc', k: 'sh', path: 'sheets/s1' }, { t: 'doc', k: 'priv', path: 'data/users/ann@x.com/prefs' }, { t: 'coll', k: 'maps', path: 'tbmaps' }] });
eq(s.j.posts.docs.length, 1, 'sync posts'); eq(s.j.sh.data.name, 'Ann Fox', 'sync doc'); eq(s.j.priv.data, null, "other player cannot read private doc"); eq(s.j.maps.docs.length, 1, 'maps readable');
eq(s.j.sh.data.hp, 3, 'merge kept both');
await api(A, 'doc', { path: 'posts/' + a1.j.id, del: true });
s = await api(B, 'sync', { items: [{ t: 'coll', k: 'posts', path: 'posts', since: 0 }] }); eq(s.j.posts.docs[0].deleted, true, 'deletion synced');
// hidden sheet
await api(A, 'doc', { path: 'sheets/s2', data: { name: 'Secret', uid: A, hidden: true } });
s = await api(B, 'sync', { items: [{ t: 'coll', k: 'sheets', path: 'sheets' }] }); ok(s.j.sheets.docs.find(d => d.id === 's2').deleted, 'hidden sheet hidden from others');
s = await api(A, 'sync', { items: [{ t: 'coll', k: 'sheets', path: 'sheets' }] }); ok(!s.j.sheets.docs.find(d => d.id === 's2').deleted, 'owner sees own hidden sheet');
// the quick "nothing changed" shortcut (needs a quiet moment, as in real life)
await new Promise(r => setTimeout(r, 1700));
s = await api(A, 'sync', { items: [{ t: 'coll', k: 'posts', path: 'posts' }] }); ok(s.j._gv > 0, 'gv given'); const gv = s.j._gv;
s = await api(A, 'sync', { gv, items: [{ t: 'coll', k: 'posts', path: 'posts' }] }); eq(s.j._same, 1, 'unchanged shortcut');
// uploads and pictures
const png = Buffer.from('89504e470d0a1a0a', 'hex');
r = await worker.fetch(new Request('https://site.test/api/upload', { method: 'POST', headers: { 'content-type': 'image/png', 'x-filename': 'a.png', 'Cf-Access-Authenticated-User-Email': A }, body: png }), env, { waitUntil() {} }); const up = await r.json(); ok(/^[0-9a-f]{32}$/.test(up.id) && up.url === '/_blob/' + up.id, 'upload ' + JSON.stringify(up));
r = await worker.fetch(new Request('https://site.test' + up.url, { headers: { 'Cf-Access-Authenticated-User-Email': A } }), env, { waitUntil() {} }); ok(r.status === 200 && r.headers.get('content-type') === 'image/png' && Buffer.from(await r.arrayBuffer()).equals(png), 'blob served');
// storage panel (GM only) sees the file as unused, then deletes it only when old enough (it is new, so kept)
eq((await api(A, 'storage')).s, 403, 'storage GM only'); const st = await api(G, 'storage'); ok(st.j.files.some(f => f.id === up.id), 'storage lists file');
eq((await api(G, 'storage-delete', { ids: [up.id] })).j.deleted, 0, 'new files are never deleted');
// presence
eq((await api(A, 'presence', { data: { board: 'x' } })).j.peers.length, 1, 'presence');
// export / backups routes answer
ok((await api(G, 'export')).s === 200, 'export'); ok([200, 400].includes((await api(G, 'backups')).s), 'backups list');
// discord: dice rolls and the forum mirror (webhook stored by the GM in the site)
await api(G, 'doc', { path: 'discordhooks/main', data: { hooks: { __rolls: 'https://discord.com/api/webhooks/1/aaa', dm: 'https://discord.com/api/webhooks/2/bbb' } } });
sent.length = 0; eq((await api(A, 'roll', { content: '🎲 x', name: 'Ann' })).s, 200, 'roll'); eq(sent[0].u, 'https://discord.com/api/webhooks/1/aaa', 'roll hook'); eq(sent[0].b.username, 'Ann', 'roll name');
sent.length = 0; await api(A, 'add', { path: 'posts', data: { board: 'dm', op: true, thread: 'g1', title: 'Plan', to: 'Bob, Cat', tos: ['Bob', 'Cat'], handle: 'Ann', body: 'hi', ts: 2 } }); await new Promise(r => setTimeout(r, 300));
ok(sent.some(x => x.u.endsWith('?wait=true') && x.b.thread_name === 'Ann → Bob, Cat: Plan'), 'forum post made ' + JSON.stringify(sent.map(x => x.u)));
eq((await api(A, 'dctest', { url: 'https://discord.com/api/webhooks/1/aaa' })).s, 403, 'dctest GM only'); eq((await api(G, 'dctest', { url: 'https://evil.example/x' })).s, 400, 'dctest rejects non-discord addresses');
// link preview refuses private addresses
for (const u of ['http://localhost/x', 'http://127.0.0.1/x', 'http://192.168.1.5/x', 'http://[::1]/x', 'ftp://example.com/x']) eq((await api(A, 'unfurl', { url: u })).j.ok, 0, 'unfurl blocks ' + u);


// daily backup worker + restore listing, real SQLite
{
  const { runBackup } = await loadEsm(bpath);
  const benv = { DB: D1, BACKUPS, KEEP_DAYS: '2' };
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) await runBackup(benv, new Date(d + 'T10:00:00Z'));
  const l = await api(G, 'backups'); eq(l.j.backups.map(b => b.key), ['backup-2026-10-03.json', 'backup-2026-10-02.json'], 'retention keeps newest 2');
  const view = await api(G, 'backup-view', { key: 'backup-2026-10-03.json' }); eq(view.s, 200, 'backup-view'); ok(JSON.stringify(view.j).length > 2, 'backup-view answers'); ok((await (await BACKUPS.get('backup-2026-10-03.json')).text()).includes('tbmaps/m1'), 'backup holds the data');
  ok(!JSON.stringify(JSON.parse(await (await BACKUPS.get('backup-2026-10-03.json')).text())).includes('data/users/ann@x.com/notes'), 'private notes are not backed up');
  eq((await api(A, 'backups')).s, 403, 'backups GM only');
}
// read-only API (v1) on real SQLite
env.API_KEYS = 'bot:' + 'k'.repeat(32);
const v1 = async (p, key = 'k'.repeat(32), method = 'GET') => { const r = await worker.fetch(new Request('https://site.test/api/v1' + p, { method, headers: key ? { authorization: 'Bearer ' + key } : {} }), env, { waitUntil() {} }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j }; };
eq((await v1('', null)).s, 401, 'v1 needs key'); eq((await v1('', 'wrong'.repeat(8))).s, 401, 'v1 wrong key'); eq((await v1('/posts', undefined, 'POST')).s, 405, 'v1 read only');
ok((await v1('')).s === 200, 'v1 index');
const chars = await v1('/characters'); eq(chars.s, 200, 'v1 characters'); ok(JSON.stringify(chars.j).includes('Ann Fox'), 'v1 lists sheet'); ok(!JSON.stringify(chars.j).includes('Secret'), 'v1 hides hidden sheets');
for (const p of ['/posts', '/rolls', '/scene', '/jobs', '/clock', '/boards', '/districts', '/heat', '/glossary']) eq((await v1(p)).s, 200, 'v1 ' + p);
eq((await v1('/nope')).s, 404, 'v1 404');
globalThis.fetch = realFetch;
console.log('SQLITE INTEGRATION OK (' + path.basename(wpath) + ')');

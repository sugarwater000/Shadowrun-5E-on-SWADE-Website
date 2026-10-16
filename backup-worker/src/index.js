// Daily backup of the Seattle Matrix BBS database into a private R2 bucket.
// Runs on a Cron Trigger (see wrangler.toml). Keeps the newest KEEP_DAYS days.
const PREFIX = 'backup-';

export async function runBackup(env, now = new Date()) {
  const keep = Math.max(1, parseInt(env.KEEP_DAYS || '30', 10) || 30);
  // Same rows and shape as the in-app Backup button, so the file can be restored from the app.
  const rs = (await env.DB.prepare(
    "SELECT path,data,deleted,updated FROM docs WHERE path NOT LIKE 'data/users/%/notes/%' ORDER BY updated"
  ).all()).results;
  const jp = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  const body = JSON.stringify({
    exportedAt: now.toISOString(),
    count: rs.length,
    docs: rs.map(r => ({ path: r.path, deleted: !!r.deleted, updated: r.updated, data: jp(r.data) }))
  });
  const key = PREFIX + now.toISOString().slice(0, 10) + '.json';
  await env.BACKUPS.put(key, body, { httpMetadata: { contentType: 'application/json' } });

  // Delete anything older than the newest `keep` daily files.
  const names = [];
  let cursor;
  do {
    const l = await env.BACKUPS.list({ prefix: PREFIX, cursor });
    l.objects.forEach(o => names.push(o.key));
    cursor = l.truncated ? l.cursor : undefined;
  } while (cursor);
  names.sort();
  const old = names.slice(0, Math.max(0, names.length - keep));
  for (const k of old) await env.BACKUPS.delete(k);
  return { key, docs: rs.length, bytes: body.length, kept: names.length - old.length, removed: old.length };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBackup(env, new Date(event.scheduledTime || Date.now())).then(r => console.log('backup ok', JSON.stringify(r))));
  },
  async fetch() { return new Response('Not found', { status: 404 }); }
};

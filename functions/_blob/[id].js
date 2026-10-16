export async function onRequestGet({ params, env }) {
  if (!/^[0-9a-f]{32}$/.test(params.id)) return new Response('Not found', { status: 404 });
  const o = await env.IMAGES.get(params.id);
  if (!o) return new Response('Not found', { status: 404 });
  const ct = (o.httpMetadata && o.httpMetadata.contentType) || 'application/octet-stream';
  const name = ((o.customMetadata && o.customMetadata.name) || 'file').replace(/[\r\n"\\]/g, '_');
  const inline = /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/.test(ct);
  return new Response(o.body, { headers: {
    'content-type': inline ? ct : 'application/octet-stream',
    'content-disposition': (inline ? 'inline' : 'attachment') + '; filename="' + name + '"',
    'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' } });
}

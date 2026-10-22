import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(new URL('./dist/', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html');
    if (path !== root && !path.startsWith(root + sep)) throw new Error('outside root');
    const target = (await stat(path)).isDirectory() ? resolve(path, 'index.html') : path;
    response.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream' });
    response.end(await readFile(target));
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173/'));

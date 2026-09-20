import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/api.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const port = Number(process.env.PORT ?? 4173);

await loadLocalEnv();

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  if (await handleApiRequest(req, res)) return;
  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`BioChem Arena server listening on http://localhost:${port}`);
});

async function loadLocalEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;

  const text = await readFile(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const requestedPath = decodeURIComponent(url.pathname);
  const normalized = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const absolute = resolve(dist, `.${normalized}`);
  const distRoot = resolve(dist);

  if (!absolute.startsWith(distRoot)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  let file = absolute;
  if (!existsSync(file) || requestedPath === '/') {
    file = join(dist, 'index.html');
  }

  if (!existsSync(file)) {
    res.statusCode = 404;
    res.end('Run npm run build before starting the production server.');
    return;
  }

  res.setHeader('content-type', mimeTypes[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}

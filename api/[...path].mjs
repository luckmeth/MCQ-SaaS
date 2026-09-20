import { handleApiRequest } from '../server/api.mjs';

/**
 * Vercel serverless entry point for every /api/* route.
 *
 * The routing and SQL live in server/api.mjs so that all three ways of running
 * this app - `vite dev` middleware, `node server.mjs`, and Vercel - share one
 * implementation. This file only adapts Vercel's request shape to it.
 */
export default async function handler(req, res) {
  const handled = await handleApiRequest(req, res, resolvePath(req));
  if (!handled) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Not found.' }));
  }
}

/**
 * Prefer the real request pathname: it keeps percent-encoding intact, which
 * matters for pack ids in /api/packs/:id. Vercel's parsed catch-all segments
 * are the fallback for the case where req.url has already been rewritten.
 */
function resolvePath(req) {
  const pathname = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;
  if (pathname.startsWith('/api/')) return pathname;

  const segments = req.query?.path;
  if (Array.isArray(segments) && segments.length > 0) {
    return `/api/${segments.map(encodeURIComponent).join('/')}`;
  }
  if (typeof segments === 'string' && segments) {
    return `/api/${encodeURIComponent(segments)}`;
  }

  return pathname;
}

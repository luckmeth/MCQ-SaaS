import { handleApiRequest } from './api.mjs';

/**
 * Adapt Vercel's function signature to the shared router in server/api.mjs.
 *
 * Every file under api/ already knows its own route, so it passes an explicit
 * path instead of relying on req.url. Vercel's zero-config api/ directory did
 * not route a `[...path]` catch-all past the first segment - /api/packs reached
 * the function while /api/packs/:id returned the platform's HTML 404 - so each
 * route gets its own file and states its path outright.
 */
export function createHandler(buildPath) {
  return async function handler(req, res) {
    const handled = await handleApiRequest(req, res, buildPath(req));
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found.' }));
    }
  };
}

/**
 * Read one dynamic segment (such as [id]) from Vercel's parsed query, and
 * re-encode it: the router decodes the path it is handed.
 */
export function segment(req, name) {
  const value = req.query?.[name];
  const single = Array.isArray(value) ? value[0] : value;
  return encodeURIComponent(single ?? '');
}

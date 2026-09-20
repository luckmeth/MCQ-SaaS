import { createHandler, segment } from '../../server/vercel.mjs';

export default createHandler((req) => `/api/packs/${segment(req, 'id')}`);

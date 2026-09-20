import { createHandler } from '../server/vercel.mjs';

export default createHandler(() => '/api/health');

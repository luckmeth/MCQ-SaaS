import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error server API is plain ESM used by both Vite and Node.
import { handleApiRequest } from './server/api.mjs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.DATABASE_URL ??= env.DATABASE_URL;

  return {
    plugins: [
      react(),
      {
        name: 'neon-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (await handleApiRequest(req, res)) return;
            next();
          });
        },
      },
    ],
  };
});

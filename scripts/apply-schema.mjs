import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from '@neondatabase/serverless';

const root = fileURLToPath(new URL('..', import.meta.url));

await loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Link Neon or add it to .env first.');
}

const sql = await readFile(join(root, 'neon', 'schema.sql'), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log('Applied Neon database schema.');
} finally {
  await pool.end();
}

async function loadLocalEnv() {
  const text = await readFile(join(root, '.env'), 'utf8').catch(() => '');
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

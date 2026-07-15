import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Single shared Supabase client for the app.
 *
 * Configuration comes from Vite env vars (see `.env` / `.env.example`):
 *   VITE_SUPABASE_URL       — your project URL
 *   VITE_SUPABASE_ANON_KEY  — the publishable / anon key (safe in the browser)
 *
 * If either is missing we export `null` instead of throwing, so the app can
 * still run against the built-in pack and degrade gracefully.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null;

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
      'imported packs will not be persisted. Copy .env.example to .env to enable.',
  );
}

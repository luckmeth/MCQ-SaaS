-- ============================================================================
-- Ena's BioChem Arena — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this ONCE in your Supabase project:
--   Dashboard  ->  SQL Editor  ->  New query  ->  paste this  ->  Run
--
-- It creates two tables that hold every imported question pack and all of its
-- question details:
--   * packs      — one row per imported "cartridge"
--   * questions  — one row per question, linked to its pack
--
-- The built-in 500-question bank is NOT stored here; only user-imported packs.
-- ============================================================================

-- One row per imported pack ---------------------------------------------------
create table if not exists public.packs (
  id          text primary key,            -- slug assigned on import
  name        text not null,
  description text,
  author      text,
  builtin     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- One row per question, cascade-deleted with its pack -------------------------
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  pack_id       text not null references public.packs(id) on delete cascade,
  position      integer not null,          -- order within the pack (0-based)
  question      text not null,
  options       jsonb not null,            -- array of option strings
  correct_index integer not null,          -- 0-based index into options
  difficulty    text not null default 'medium',
  topic         text not null default 'General',
  explanation   text
);

create index if not exists questions_pack_id_idx on public.questions (pack_id);

-- Row Level Security ----------------------------------------------------------
-- This app ships a public (publishable/anon) key and has no user login, so the
-- pack library is shared and world-readable/writable. If you later add auth,
-- tighten these policies to scope packs per user.
alter table public.packs     enable row level security;
alter table public.questions enable row level security;

-- packs
drop policy if exists "packs_public_read"   on public.packs;
drop policy if exists "packs_public_write"  on public.packs;
drop policy if exists "packs_public_delete" on public.packs;
create policy "packs_public_read"   on public.packs for select using (true);
create policy "packs_public_write"  on public.packs for insert with check (true);
create policy "packs_public_update" on public.packs for update using (true) with check (true);
create policy "packs_public_delete" on public.packs for delete using (true);

-- questions
drop policy if exists "questions_public_read"   on public.questions;
drop policy if exists "questions_public_write"  on public.questions;
drop policy if exists "questions_public_delete" on public.questions;
create policy "questions_public_read"   on public.questions for select using (true);
create policy "questions_public_write"  on public.questions for insert with check (true);
create policy "questions_public_delete" on public.questions for delete using (true);

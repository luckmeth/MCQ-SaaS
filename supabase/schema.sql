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
  explanation   text,
  image         text,                      -- optional figure: https:// or data: URI
  image_alt     text                       -- optional caption / alt text
);

-- Backfill the image columns for projects created before they existed.
alter table public.questions add column if not exists image     text;
alter table public.questions add column if not exists image_alt text;

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
drop policy if exists "packs_public_update" on public.packs;
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

-- ============================================================================
-- Quiz attempts — student name + results history
-- ----------------------------------------------------------------------------
-- Safe to run again even if you already applied the sections above: every
-- statement here is idempotent (CREATE TABLE IF NOT EXISTS / DROP POLICY IF
-- EXISTS + CREATE POLICY), so re-running this whole file won't touch existing
-- packs/questions rows.
-- ============================================================================

-- One row per completed quiz. `pack_id` is deliberately NOT a foreign key: the
-- built-in bank ('builtin') is never stored in `packs`, and history should
-- keep making sense even after an imported pack is deleted — so `pack_name`
-- is kept as plain text too, not looked up via a join.
create table if not exists public.attempts (
  id               uuid primary key default gen_random_uuid(),
  student_name     text not null,
  pack_id          text not null,
  pack_name        text not null,
  total            integer not null,
  correct          integer not null,
  wrong            integer not null,
  skipped          integer not null,
  percentage       integer not null,
  duration_seconds integer not null,
  created_at       timestamptz not null default now()
);

create index if not exists attempts_created_at_idx on public.attempts (created_at desc);
create index if not exists attempts_student_name_idx on public.attempts (lower(student_name));

-- Attempts are an append-only log from the client: readable and insertable,
-- but not updatable/deletable, so history can't be tampered with after the fact.
alter table public.attempts enable row level security;

drop policy if exists "attempts_public_read"  on public.attempts;
drop policy if exists "attempts_public_write" on public.attempts;
create policy "attempts_public_read"  on public.attempts for select using (true);
create policy "attempts_public_write" on public.attempts for insert with check (true);

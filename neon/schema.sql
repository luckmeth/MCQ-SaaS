create extension if not exists pgcrypto;

create table if not exists public.packs (
  id          text primary key,
  name        text not null,
  description text,
  author      text,
  builtin     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  pack_id       text not null references public.packs(id) on delete cascade,
  position      integer not null,
  question      text not null,
  options       jsonb not null,
  correct_index integer not null,
  difficulty    text not null default 'medium',
  topic         text not null default 'General',
  explanation   text,
  image         text,
  image_alt     text
);

alter table public.questions add column if not exists image     text;
alter table public.questions add column if not exists image_alt text;

create index if not exists questions_pack_id_idx on public.questions (pack_id);

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

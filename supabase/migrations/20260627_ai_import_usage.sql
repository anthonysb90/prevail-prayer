-- Monthly usage ledger for AI prayer-list import.
-- Photo scans are Pro-gated and hard-capped (5/mo). Text imports are free but
-- soft-capped to prevent abuse. Only the service role (edge function) writes;
-- users may read their own row to display "X of 5 left".
-- Run in the Supabase SQL editor. Idempotent.

create table if not exists public.ai_import_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,                       -- 'YYYY-MM' (UTC)
  photo_scans int not null default 0,
  text_imports int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table public.ai_import_usage enable row level security;

drop policy if exists "ai usage read own" on public.ai_import_usage;
create policy "ai usage read own" on public.ai_import_usage for select to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policy: only the service role (edge function) mutates.

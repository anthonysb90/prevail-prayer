-- In-app feedback: users submit bug reports and feature ideas from Settings.
-- The admin reviews them and updates status. Users can insert and read their
-- own; only the service role (admin app) reads everything.

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug','feature')),
  message text not null,
  email text,
  display_name text,
  app_version text,
  platform text,
  status text not null default 'new' check (status in ('new','planned','in_progress','done','dismissed')),
  admin_note text,
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_status_idx on public.app_feedback(status);
create index if not exists app_feedback_created_idx on public.app_feedback(created_at desc);

alter table public.app_feedback enable row level security;

-- A signed-in user can submit feedback and see their own submissions.
drop policy if exists "app_feedback insert own" on public.app_feedback;
create policy "app_feedback insert own" on public.app_feedback
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "app_feedback read own" on public.app_feedback;
create policy "app_feedback read own" on public.app_feedback
  for select to authenticated
  using (auth.uid() = user_id);
-- No update/delete policy: status changes happen via the service role (admin app).

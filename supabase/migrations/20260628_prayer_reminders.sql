-- Per-prayer reminders. The schedule config mirrors the on-device local
-- notification so reminders can be listed, edited, toggled, and re-scheduled
-- after a reinstall. The notification body carries the request's own text.

create table if not exists public.prayer_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prayer_id uuid not null references public.prayer_requests(id) on delete cascade,
  schedule_type text not null check (schedule_type in ('once','daily','weekly')),
  fire_at timestamptz,            -- for one-time reminders
  weekday int check (weekday between 1 and 7),  -- 1=Sun … 7=Sat, for weekly
  hour int not null check (hour between 0 and 23),
  minute int not null check (minute between 0 and 59),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists prayer_reminders_prayer_idx on public.prayer_reminders(prayer_id);
create index if not exists prayer_reminders_user_idx on public.prayer_reminders(user_id);

alter table public.prayer_reminders enable row level security;

drop policy if exists "prayer_reminders owner" on public.prayer_reminders;
create policy "prayer_reminders owner" on public.prayer_reminders
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

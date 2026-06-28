-- Admin power features: audit log, roles, notification history/scheduling, throttle.
-- Run in the Supabase SQL editor. Idempotent. All tables are service-role only
-- (RLS enabled, no policies) — the admin app reads/writes them via the service key.

-- 1) Audit log of sensitive admin actions.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;

-- 2) Roles. Keep is_admin for backward compatibility; admin_role refines access.
--    'admin' = full access, 'editor' = content (devotions/music) only.
alter table public.profiles add column if not exists admin_role text;
-- Existing admins default to the full 'admin' role.
update public.profiles set admin_role = 'admin' where is_admin = true and admin_role is null;

-- 3) Sent push history.
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  segment text,
  sent_count integer not null default 0,
  sent_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists notification_log_created_idx on public.notification_log (created_at desc);
alter table public.notification_log enable row level security;

-- 4) Scheduled pushes (sent later by a cron job / edge function).
create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  segment text not null default 'all',
  send_at timestamptz not null,
  status text not null default 'pending', -- pending | sent | canceled | failed
  sent_at timestamptz,
  sent_count integer,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists scheduled_notifications_due_idx on public.scheduled_notifications (status, send_at);
alter table public.scheduled_notifications enable row level security;

-- 5) Lightweight throttle for the public /contribute page (per IP).
create table if not exists public.contribute_attempts (
  id bigint generated always as identity primary key,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists contribute_attempts_ip_time_idx on public.contribute_attempts (ip, created_at desc);
alter table public.contribute_attempts enable row level security;

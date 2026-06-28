-- Community devotion submissions + admin-settable contributor password.
-- Run in the Supabase SQL editor. Idempotent.

-- Attribute/flag devotions submitted by outside contributors (always created
-- unpublished; an admin approves before they go live).
alter table public.devotions add column if not exists submitted_by text;

-- Key/value settings used by the admin. Holds the contributor-page password
-- (stored as a SHA-256 hash under key 'devotion_submit_password_sha256').
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Only the service-role key (admin server actions) may read/write these.
alter table public.app_settings enable row level security;

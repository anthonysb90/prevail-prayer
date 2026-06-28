-- Track each device's app version on its push-token row, so the admin can see
-- the version distribution and notify users on outdated builds.
-- Run in the Supabase SQL editor. Idempotent.

alter table public.user_push_tokens add column if not exists app_version text;
alter table public.user_push_tokens add column if not exists app_build text;

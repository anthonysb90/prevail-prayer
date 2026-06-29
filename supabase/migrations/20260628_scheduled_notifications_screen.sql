-- Deep-link target for a scheduled push (e.g. "/devotions" or "upgrade").
-- NULL means "just open the app".
alter table public.scheduled_notifications
  add column if not exists screen text;

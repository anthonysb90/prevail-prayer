-- Auto-publish scheduled devotions.
--
-- The app only shows devotions where is_published = true (see hooks/useDevotions.ts).
-- A scheduled devotion is is_published = false with scheduled_for set, so without
-- this job a "scheduled" devotion would never go live. This runs in the database
-- every 5 minutes and flips any devotion whose scheduled_for has passed to published.
--
-- Requires pg_cron + pg_net (already enabled for the birthday cron).

-- 1. The publisher: mark due devotions live, dating them to their scheduled time.
create or replace function public.publish_due_devotions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.devotions
     set is_published = true,
         published_at = coalesce(published_at, scheduled_for, now())
   where is_published = false
     and scheduled_for is not null
     and scheduled_for <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- 2. Schedule it every 5 minutes (replace any existing job of the same name).
do $$
begin
  perform cron.unschedule('publish-due-devotions');
exception when others then
  null; -- no existing job
end $$;

select cron.schedule(
  'publish-due-devotions',
  '*/5 * * * *',
  $$ select public.publish_due_devotions(); $$
);

-- 3. Catch anything already due right now.
select public.publish_due_devotions();

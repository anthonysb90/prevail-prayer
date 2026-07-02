-- Security hardening 2026-07-01
-- 1) Lock down SECURITY DEFINER RPCs so only the service role (edge functions /
--    cron) can call them. Previously the default PUBLIC execute grant let any
--    anonymous caller invoke claim_birthday_greetings() and read every
--    birthday user's push token, name, platform, and subscription status — and
--    calling it marked those users greeted, silently breaking the real job.
revoke execute on function public.claim_birthday_greetings() from public, anon, authenticated;
revoke execute on function public.publish_due_devotions() from public, anon, authenticated;
grant execute on function public.claim_birthday_greetings() to service_role;
grant execute on function public.publish_due_devotions() to service_role;

-- 2) Recreate the profile-column protection trigger function and extend it to
--    cover every privileged column, not just the original three. Non-service
--    callers can never change these via a client UPDATE; the admin app / edge
--    functions (service_role) still can.
create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() ->> 'role'), '') = 'service_role' then
    return new;
  end if;
  new.is_admin                := old.is_admin;
  new.admin_role              := old.admin_role;
  new.subscription_status     := old.subscription_status;
  new.subscription_plan       := old.subscription_plan;
  new.subscription_expires_at := old.subscription_expires_at;
  new.trial_started_at        := old.trial_started_at;
  new.comp_until              := old.comp_until;
  return new;
end;
$$;

-- Ensure the trigger is attached (idempotent).
drop trigger if exists trg_protect_privileged_profile_columns on public.profiles;
create trigger trg_protect_privileged_profile_columns
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_columns();

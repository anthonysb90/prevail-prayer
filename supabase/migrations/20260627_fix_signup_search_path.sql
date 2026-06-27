-- Fix: "Database error saving new user" on sign up.
--
-- handle_new_user() is SECURITY DEFINER and references `profiles` UNqualified,
-- but had no search_path pinned. It therefore inherited the CALLER's search_path.
-- GoTrue inserts new auth.users rows as role `supabase_auth_admin`, whose
-- search_path is `auth` (no `public`), so inside the trigger `profiles` resolved
-- to `auth.profiles` (which doesn't exist) and the whole signup transaction failed.
-- (It worked when run as `postgres` because that role's search_path includes public.)
--
-- The birthday-feature rewrite of handle_new_user dropped the search_path pin.
-- Pinning it to `public` makes the table resolve correctly for every caller.
alter function public.handle_new_user() set search_path = public;

-- Same latent risk on the cron RPC (references profiles / birthday_greetings_log
-- unqualified). Currently only called by the service role, but pin it for safety.
alter function public.claim_birthday_greetings() set search_path = public;

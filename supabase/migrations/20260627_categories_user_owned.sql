-- Let users create their own prayer categories while still seeing the shared
-- default ones (user_id is null). Service role (admin) bypasses RLS.
-- Run in the Supabase SQL editor. Idempotent.

alter table public.categories enable row level security;

drop policy if exists "categories select visible" on public.categories;
create policy "categories select visible" on public.categories for select to authenticated
  using (user_id is null or user_id = auth.uid());

drop policy if exists "categories insert own" on public.categories;
create policy "categories insert own" on public.categories for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "categories delete own" on public.categories;
create policy "categories delete own" on public.categories for delete to authenticated
  using (user_id = auth.uid());

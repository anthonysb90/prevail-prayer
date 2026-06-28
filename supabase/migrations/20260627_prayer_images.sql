-- Photos on prayer requests + a custom prayer-list background. Both are private
-- to the owner (private bucket + per-user folder access via signed URLs).
-- Run in the Supabase SQL editor. Idempotent.

alter table public.prayer_requests add column if not exists image_path text;
alter table public.profiles add column if not exists prayer_bg_path text;

-- Private bucket. Objects are stored under "<user_id>/..." so policies can scope
-- access to the owner. Images are read via short-lived signed URLs.
insert into storage.buckets (id, name, public) values ('prayer-images', 'prayer-images', false)
on conflict (id) do nothing;

drop policy if exists "prayer images read own" on storage.objects;
create policy "prayer images read own" on storage.objects for select to authenticated
  using (bucket_id = 'prayer-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "prayer images insert own" on storage.objects;
create policy "prayer images insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'prayer-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "prayer images update own" on storage.objects;
create policy "prayer images update own" on storage.objects for update to authenticated
  using (bucket_id = 'prayer-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "prayer images delete own" on storage.objects;
create policy "prayer images delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'prayer-images' and (storage.foldername(name))[1] = auth.uid()::text);

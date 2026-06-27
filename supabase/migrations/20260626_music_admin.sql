-- Music: admin-managed library + offline downloads
-- Run in the Supabase SQL editor. Idempotent — safe to run more than once.

-- 1) bundle_key maps a row to a built-in (bundled) audio asset shipped in the app.
alter table public.music_tracks add column if not exists bundle_key text;

-- Unique index on bundle_key. NOT partial: Postgres treats multiple NULLs as
-- distinct (so uploaded tracks with null keys are fine), and a non-partial
-- index is required for the ON CONFLICT (bundle_key) inference below.
drop index if exists music_tracks_bundle_key_key;
create unique index if not exists music_tracks_bundle_key_uidx
  on public.music_tracks (bundle_key);

-- 2) Seed the 3 built-in tracks (idempotent by bundle_key). file_url stays null:
--    the app plays these from the bundled asset, identified by bundle_key.
insert into public.music_tracks (title, artist, file_url, is_bundled, is_available, sort_order, bundle_key)
values
  ('Morning Still', null, null, true, true, 0, 'morning-still'),
  ('Deep Waters',   null, null, true, true, 1, 'deep-waters'),
  ('Holy Grace',    null, null, true, true, 2, 'holy-ground')
on conflict (bundle_key) do nothing;

-- 3) App read access: any user may list AVAILABLE tracks. (Admin reads ALL rows
--    server-side via the service-role key, so hidden tracks stay manageable.)
alter table public.music_tracks enable row level security;
drop policy if exists "music read available" on public.music_tracks;
create policy "music read available" on public.music_tracks
  for select to anon, authenticated using (is_available = true);

-- 4) Public storage bucket for uploaded audio. Writes happen server-side via the
--    service-role key (bypasses RLS), so only a public READ policy is needed.
insert into storage.buckets (id, name, public)
values ('music', 'music', true)
on conflict (id) do nothing;

drop policy if exists "music public read" on storage.objects;
create policy "music public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'music');

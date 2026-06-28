-- Editable marketing-site content blocks (Markdown), rendered live on the static
-- site via the public anon key (same pattern the homepage uses for devotions).
-- Empty body => the page keeps its built-in static text as a fallback.
-- Only the service role (admin app) writes. Run in the Supabase SQL editor. Idempotent.

create table if not exists public.site_content (
  slug text primary key,
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "site content public read" on public.site_content;
create policy "site content public read" on public.site_content for select to anon, authenticated using (true);
-- No insert/update/delete policy: only the service role (admin) mutates.

insert into public.site_content (slug, body) values
  ('privacy', ''), ('support', ''), ('contact', ''), ('terms', '')
on conflict (slug) do nothing;

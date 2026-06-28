-- Self-tracked AI cost: the import edge function logs each call's tokens and
-- computed cost here, using editable per-model prices. No admin key required.
-- Run in the Supabase SQL editor. Idempotent.

create table if not exists public.ai_model_prices (
  model text primary key,            -- match key, e.g. 'claude-3-5-sonnet' (matched as a substring of the model id)
  label text,
  input_per_mtok numeric not null,   -- USD per 1M input tokens
  output_per_mtok numeric not null,  -- USD per 1M output tokens
  updated_at timestamptz not null default now()
);

insert into public.ai_model_prices (model, label, input_per_mtok, output_per_mtok) values
  ('claude-3-5-sonnet', 'Sonnet — photo import', 3, 15),
  ('claude-3-5-haiku',  'Haiku — text import',   0.8, 4)
on conflict (model) do nothing;

alter table public.ai_model_prices enable row level security;
drop policy if exists "ai prices read" on public.ai_model_prices;
create policy "ai prices read" on public.ai_model_prices for select to authenticated using (true);
-- Only the service role (admin app / edge function) writes.

create table if not exists public.ai_cost_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  mode text,                         -- 'photo' | 'text'
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_cost_log_created_idx on public.ai_cost_log(created_at);
alter table public.ai_cost_log enable row level security;
-- No anon/authenticated policy: only the service role reads/writes (admin app + edge function).

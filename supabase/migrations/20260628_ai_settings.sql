-- AI model settings: a single row that tells the import edge function which
-- Anthropic model to use for photo (vision) vs pasted text. Admin-editable so
-- models can be swapped as cheaper ones ship, without redeploying the function.

create table if not exists public.ai_settings (
  id integer primary key default 1,
  vision_model text not null default 'claude-sonnet-4-6',
  text_model   text not null default 'claude-haiku-4-5-20251001',
  updated_at   timestamptz not null default now(),
  constraint ai_settings_singleton check (id = 1)
);

-- Seed the singleton row with the current defaults.
insert into public.ai_settings (id, vision_model, text_model)
values (1, 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001')
on conflict (id) do nothing;

-- Read/written only by the service role (edge function + admin). Enable RLS
-- with no public policies so anon/auth clients can't touch it.
alter table public.ai_settings enable row level security;

-- Multi-provider AI import: the import edge function can call Anthropic (Claude)
-- or Google (Gemini). The provider for each mode is stored alongside the model
-- in ai_settings; the admin selector infers provider from the chosen model id.

alter table public.ai_settings
  add column if not exists vision_provider text not null default 'anthropic',
  add column if not exists text_provider   text not null default 'anthropic';

-- Add Gemini models as selectable, priced options (USD per 1M tokens).
insert into public.ai_model_prices (model, label, input_per_mtok, output_per_mtok) values
  ('gemini-2.5-flash',      'Gemini 2.5 Flash',      0.30, 2.50),
  ('gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite', 0.10, 0.40)
on conflict (model) do nothing;

-- Move ai_model_prices to real, full model ids. The admin "Models in use"
-- selector now stores these exact ids in ai_settings and the edge function
-- calls the API with them, so the price-row key must be the real model id
-- (cost matching uses model.includes(row.model), which still matches exactly).

-- Rename the old 3.5 placeholder rows to the current models + correct prices.
update public.ai_model_prices
  set model = 'claude-sonnet-4-6', label = 'Sonnet 4.6', input_per_mtok = 3, output_per_mtok = 15, updated_at = now()
  where model = 'claude-3-5-sonnet';

update public.ai_model_prices
  set model = 'claude-haiku-4-5-20251001', label = 'Haiku 4.5', input_per_mtok = 1, output_per_mtok = 5, updated_at = now()
  where model = 'claude-3-5-haiku';

-- Ensure the current models exist regardless of prior state, plus Opus as an
-- option admins can select for photo scans.
insert into public.ai_model_prices (model, label, input_per_mtok, output_per_mtok) values
  ('claude-sonnet-4-6',          'Sonnet 4.6', 3, 15),
  ('claude-haiku-4-5-20251001',  'Haiku 4.5',  1, 5),
  ('claude-opus-4-8',            'Opus 4.8',   5, 25)
on conflict (model) do nothing;

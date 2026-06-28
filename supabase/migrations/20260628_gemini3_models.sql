-- Add Gemini 3 models as selectable, priced options (USD per 1M tokens, base
-- context tier). Both are vision-capable, so either can be chosen for photo
-- scans under "Models in use". The admin selector and the import function's
-- cost matching both read ai_model_prices, so no function redeploy is needed.

insert into public.ai_model_prices (model, label, input_per_mtok, output_per_mtok) values
  ('gemini-3-pro-preview',   'Gemini 3 Pro',   2.00, 12.00),
  ('gemini-3-flash-preview', 'Gemini 3 Flash', 0.50, 3.00)
on conflict (model) do nothing;

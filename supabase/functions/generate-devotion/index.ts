// Supabase Edge Function: generate-devotion
// Drafts a new devotion from a free-text prompt (topic / verse / idea), using
// already-published devotions as style examples. Returns structured JSON for the
// admin to review and edit. Logs estimated cost to ai_cost_log (mode='devotion').
//
// Called server-to-server by the admin (service-role Bearer). Reads the text
// provider/model from ai_settings; keys from ANTHROPIC_API_KEY / GEMINI_API_KEY.

import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_VERSION = "2023-06-01";

interface Usage { input: number; output: number }
interface ModelResult { ok: boolean; status: number; text: string; usage: Usage; raw: unknown }

async function callAnthropic(model: string, system: string, user: string, key: string): Promise<ModelResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 2000, system, messages: [{ role: "user", content: user }] }),
  });
  const raw = await res.json().catch(() => ({}));
  const text = (raw?.content?.[0]?.text as string) ?? "";
  return { ok: res.ok, status: res.status, text, usage: { input: raw?.usage?.input_tokens ?? 0, output: raw?.usage?.output_tokens ?? 0 }, raw };
}

async function callGemini(model: string, system: string, user: string, key: string): Promise<ModelResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: user }] }] }),
  });
  const raw = await res.json().catch(() => ({}));
  const parts = raw?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
  return { ok: res.ok, status: res.status, text, usage: { input: raw?.usageMetadata?.promptTokenCount ?? 0, output: raw?.usageMetadata?.candidatesTokenCount ?? 0 }, raw };
}

function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  t = t.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

const PRICE_DEFAULTS: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4": { in: 3, out: 15 }, "claude-haiku-4": { in: 1, out: 5 }, "claude-opus-4": { in: 15, out: 75 },
  "gemini-3.1-pro": { in: 2, out: 12 }, "gemini-3-flash": { in: 0.5, out: 3 }, "gemini-3.5-flash": { in: 1.5, out: 9 },
  "gemini-2.5-flash": { in: 0.3, out: 2.5 }, "gemini-2.5-flash-lite": { in: 0.1, out: 0.4 },
};

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let prompt = "";
  try { prompt = (await req.json())?.prompt ?? ""; } catch { /* ignore */ }
  if (!prompt.trim()) return Response.json({ error: "Missing prompt." }, { status: 400 });

  const { data: settings } = await supabase.from("ai_settings").select("text_provider, text_model").maybeSingle();
  const provider = (settings?.text_provider as string) ?? "anthropic";
  const model = (settings?.text_model as string) ?? "claude-sonnet-4-6";
  const key = provider === "gemini" ? Deno.env.get("GEMINI_API_KEY") : Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return Response.json({ error: `${provider} API key is not set in function secrets.` }, { status: 500 });

  const { data: examples } = await supabase
    .from("devotions")
    .select("title, scripture_reference, scripture_text, body, closing_prayer")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(4);

  const exampleText = (examples ?? []).map((e: Record<string, string>, i: number) =>
    `EXAMPLE ${i + 1}\nTitle: ${e.title}\nScripture: ${e.scripture_reference}\n${e.scripture_text}\n\n${e.body}\n\nClosing Prayer: ${e.closing_prayer}`
  ).join("\n\n----------\n\n");

  const system =
    "You write daily devotionals for the Prevail Prayer app. Voice: clear, warm, practical, ministry-centered, and biblically grounded. " +
    "Short readable paragraphs, no run-on sentences, minimal flourish. Scripture quotations use the KJV. " +
    "Return ONLY a valid JSON object (no markdown, no commentary) with EXACTLY these keys: " +
    "title (string), scripture_reference (string, e.g. \"Philippians 4:6-7\"), scripture_text (string, the KJV verse text), " +
    "body (string, 3-5 short paragraphs separated by blank lines), closing_prayer (string, 2-4 sentences), " +
    "questions (array of 2-3 short reflection questions as strings).";

  const user =
    `Write a brand-new devotion for this request: "${prompt}".\n\n` +
    (exampleText ? `Match the voice, length, and structure of these published devotions:\n\n${exampleText}\n\n` : "") +
    "Return ONLY the JSON object described in the instructions.";

  const r = provider === "gemini"
    ? await callGemini(model, system, user, key)
    : await callAnthropic(model, system, user, key);

  if (!r.ok) return Response.json({ error: `Model error ${r.status}.`, detail: r.raw }, { status: 502 });

  const json = extractJson(r.text);
  if (!json || !json.title || !json.body) {
    return Response.json({ error: "Could not parse a devotion from the model output.", text: r.text.slice(0, 500) }, { status: 502 });
  }

  // Cost logging (best-effort).
  try {
    const { data: prices } = await supabase.from("ai_model_prices").select("model, input_per_mtok, output_per_mtok");
    let inRate = 0, outRate = 0;
    const row = (prices ?? []).find((p: { model: string }) => model.includes(p.model));
    if (row) { inRate = Number(row.input_per_mtok); outRate = Number(row.output_per_mtok); }
    else { const k = Object.keys(PRICE_DEFAULTS).find((kk) => model.includes(kk)); if (k) { inRate = PRICE_DEFAULTS[k].in; outRate = PRICE_DEFAULTS[k].out; } }
    const cost = (r.usage.input / 1e6) * inRate + (r.usage.output / 1e6) * outRate;
    await supabase.from("ai_cost_log").insert({ mode: "devotion", model, input_tokens: r.usage.input, output_tokens: r.usage.output, cost_usd: cost });
  } catch { /* ignore cost-log failures */ }

  return Response.json({ devotion: json });
});

// Supabase Edge Function: import-prayer-list
// Turns a photographed church prayer list (or pasted text) into structured
// prayer requests using the Anthropic API. The caller reviews and edits the
// results in-app before anything is saved.
//
// Modes:
//   - "photo": Pro-only. Hard-capped per month by tier — TRIAL_PHOTO_CAP during
//              the free trial, PHOTO_CAP for paid/comped. Uses a vision model.
//   - "text":  free, soft-capped at TEXT_CAP/month + length guard. Cheap model.
//
// Pro is verified server-side (the client's word isn't trusted): admin "comp"
// (profiles.comp_until) OR an active RevenueCat entitlement. Trial vs paid is
// read from the RevenueCat entitlement's period_type.
//
// Required secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (provided by the platform)
//   ANTHROPIC_API_KEY                        (your Anthropic API key)
//   REVENUECAT_SECRET_KEY                    (RevenueCat secret API key; needed
//                                             to verify non-comped Pro users)
// Optional:
//   ANTHROPIC_VISION_MODEL  (default "claude-3-5-sonnet-latest")
//   ANTHROPIC_TEXT_MODEL    (default "claude-3-5-haiku-latest")
//
// Deploy with JWT verification ON (default) so only signed-in users can call it.

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENTITLEMENT_ID = "Prevail Prayer Pro";
const PHOTO_CAP = 5;         // paid / comped photo scans per month
const TRIAL_PHOTO_CAP = 2;   // photo scans during the free trial
const TEXT_CAP = 60;         // free text imports per month (abuse guard)
const MAX_IMAGES = 3;        // images per scan (a list can span pages)
const MAX_TEXT_CHARS = 6000;
const MAX_ITEMS = 100;

interface ImageInput { data: string; media_type: string; }
type Tier = "comp" | "paid" | "trial" | "none";

const PROMPT = [
  "You are reading a church prayer list. Extract every distinct prayer request.",
  "Each person or item on the list is one request.",
  "For each, return a short `title` (the person or subject, e.g. \"John Smith\" or \"The Johnson family\")",
  "and a `description` (the specific need or details, e.g. \"recovering from surgery\"). If there are no",
  "details, use an empty string for description.",
  "Ignore headings, dates, page numbers, church name, and decorative text.",
  "Do not invent people or details that are not present.",
  "Respond with ONLY a JSON object of the form {\"items\":[{\"title\":\"...\",\"description\":\"...\"}]} and nothing else.",
].join(" ");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated." }, 401);

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return json({ error: "AI import is not configured yet. (Missing ANTHROPIC_API_KEY.)" }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Not authenticated." }, 401);
    const userId = userData.user.id;

    const payload = await req.json().catch(() => ({}));
    const mode: string = payload?.mode === "text" ? "text" : "photo";
    const period = new Date().toISOString().slice(0, 7); // 'YYYY-MM' UTC

    // ---- Pro gate + per-tier cap (photo only) ------------------------------
    const claimPremium = payload?.premium === true;
    const claimTrial = payload?.trial === true;
    let photoCap = PHOTO_CAP;
    if (mode === "photo") {
      const tier = await callerTier(admin, userId, claimPremium, claimTrial);
      if (tier === "none") return json({ error: "Photo import is a Pro feature.", code: "not_pro" }, 403);
      photoCap = tier === "trial" ? TRIAL_PHOTO_CAP : PHOTO_CAP;
    }

    // ---- Quota -------------------------------------------------------------
    const { data: usageRow } = await admin
      .from("ai_import_usage")
      .select("photo_scans, text_imports")
      .eq("user_id", userId)
      .eq("period", period)
      .maybeSingle();

    const photoUsed = usageRow?.photo_scans ?? 0;
    const textUsed = usageRow?.text_imports ?? 0;

    if (mode === "photo" && photoUsed >= photoCap) {
      return json({ error: `You've used all ${photoCap} photo scans this month.`, code: "quota", remaining: { photo: 0, photoCap } }, 429);
    }
    if (mode === "text" && textUsed >= TEXT_CAP) {
      return json({ error: "You've reached this month's text import limit.", code: "quota" }, 429);
    }

    // ---- Build the Anthropic request --------------------------------------
    let model: string;
    const content: unknown[] = [];

    if (mode === "photo") {
      const images: ImageInput[] = Array.isArray(payload?.images) ? payload.images.slice(0, MAX_IMAGES) : [];
      if (images.length === 0) return json({ error: "No images provided." }, 400);
      model = Deno.env.get("ANTHROPIC_VISION_MODEL") || "claude-3-5-sonnet-latest";
      for (const img of images) {
        if (!img?.data) continue;
        content.push({ type: "image", source: { type: "base64", media_type: img.media_type || "image/jpeg", data: img.data } });
      }
      content.push({ type: "text", text: PROMPT });
    } else {
      const text: string = typeof payload?.text === "string" ? payload.text.slice(0, MAX_TEXT_CHARS).trim() : "";
      if (!text) return json({ error: "No text provided." }, 400);
      model = Deno.env.get("ANTHROPIC_TEXT_MODEL") || "claude-3-5-haiku-latest";
      content.push({ type: "text", text: PROMPT + "\n\nHere is the list:\n\n" + text });
    }

    // ---- Call Anthropic ----------------------------------------------------
    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: "user", content }] }),
    });

    if (!aiResp.ok) {
      const detail = await aiResp.text().catch(() => "");
      console.error("Anthropic error", aiResp.status, detail);
      return json({ error: "The AI couldn't read that. Please try a clearer photo or paste the text." }, 502);
    }

    const aiJson = await aiResp.json();
    const rawText: string = (aiJson?.content ?? []).map((b: { text?: string }) => b?.text ?? "").join("").trim();
    const items = parseItems(rawText);
    if (items.length === 0) {
      return json({ error: "No prayer requests were found. Try a clearer image or paste the text.", items: [] }, 200);
    }

    // ---- Record usage (best effort, after a successful extraction) ---------
    await admin.from("ai_import_usage").upsert(
      {
        user_id: userId,
        period,
        photo_scans: photoUsed + (mode === "photo" ? 1 : 0),
        text_imports: textUsed + (mode === "text" ? 1 : 0),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period" },
    );

    // Self-tracked AI cost (best effort; never blocks the response).
    await logAiCost(admin, userId, mode, aiJson);

    const remaining = mode === "photo"
      ? { photo: Math.max(0, photoCap - (photoUsed + 1)), photoCap }
      : { photo: Math.max(0, PHOTO_CAP - photoUsed), photoCap: PHOTO_CAP };

    return json({ items, remaining });
  } catch (e) {
    console.error("import-prayer-list failure", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});

// Caller tier: admin comp (paid-equivalent), an active RevenueCat entitlement
// (trial vs paid via period_type), or none.
async function callerTier(
  admin: ReturnType<typeof createClient>,
  userId: string,
  claimPremium: boolean,
  claimTrial: boolean,
): Promise<Tier> {
  const { data: profile } = await admin.from("profiles").select("comp_until").eq("id", userId).maybeSingle();
  const compUntil = profile?.comp_until ? new Date(profile.comp_until).getTime() : 0;
  if (compUntil > Date.now()) return "comp";

  // Prefer RevenueCat when it can give a definitive answer.
  const rcKey = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (rcKey) {
    try {
      const resp = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${rcKey}` },
      });
      if (resp.ok) {
        const body = await resp.json();
        const ent = body?.subscriber?.entitlements?.[ENTITLEMENT_ID];
        const active = ent && (!ent.expires_date || new Date(ent.expires_date).getTime() > Date.now());
        if (active) return ent.period_type === "trial" ? "trial" : "paid";
      }
    } catch (_e) {
      // fall through to the client's claim
    }
  }

  // Fallback: trust the app's own subscription state (it already gates the UI).
  if (claimPremium) return claimTrial ? "trial" : "paid";
  return "none";
}

// Fallback prices (USD per 1M tokens) if a model has no ai_model_prices row.
const PRICE_DEFAULTS: { key: string; in: number; out: number }[] = [
  { key: "claude-3-5-sonnet", in: 3, out: 15 },
  { key: "claude-3-5-haiku", in: 0.8, out: 4 },
];

// Record one call's token cost into ai_cost_log using editable per-model prices.
async function logAiCost(
  admin: ReturnType<typeof createClient>,
  userId: string,
  mode: string,
  aiJson: { usage?: { input_tokens?: number; output_tokens?: number }; model?: string },
): Promise<void> {
  try {
    const inTok = aiJson?.usage?.input_tokens ?? 0;
    const outTok = aiJson?.usage?.output_tokens ?? 0;
    const model = aiJson?.model ?? (mode === "text" ? "claude-3-5-haiku" : "claude-3-5-sonnet");

    let inPrice = 0;
    let outPrice = 0;
    const { data: rows } = await admin.from("ai_model_prices").select("model, input_per_mtok, output_per_mtok");
    const match = (rows ?? []).find((r: { model: string }) => model.includes(r.model));
    if (match) {
      inPrice = Number(match.input_per_mtok);
      outPrice = Number(match.output_per_mtok);
    } else {
      const d = PRICE_DEFAULTS.find((p) => model.includes(p.key));
      if (d) { inPrice = d.in; outPrice = d.out; }
    }

    const cost = (inTok / 1e6) * inPrice + (outTok / 1e6) * outPrice;
    await admin.from("ai_cost_log").insert({
      user_id: userId,
      mode,
      model,
      input_tokens: inTok,
      output_tokens: outTok,
      cost_usd: Number(cost.toFixed(6)),
    });
  } catch (e) {
    console.error("logAiCost failed", e);
  }
}

function parseItems(raw: string): { title: string; description: string }[] {
  let text = raw.trim();
  // Strip ```json fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the first {...} block.
  if (!text.startsWith("{")) {
    const brace = text.indexOf("{");
    if (brace >= 0) text = text.slice(brace);
  }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return []; }
  const arr = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(arr)) return [];
  const out: { title: string; description: string }[] = [];
  for (const it of arr) {
    const title = String((it as { title?: unknown })?.title ?? "").trim().slice(0, 120);
    const description = String((it as { description?: unknown })?.description ?? "").trim().slice(0, 600);
    if (title) out.push({ title, description });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

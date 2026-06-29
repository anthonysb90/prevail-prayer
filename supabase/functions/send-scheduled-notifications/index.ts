// Supabase Edge Function: send-scheduled-notifications
// Fires due rows in scheduled_notifications (status='pending', send_at <= now()).
// Resolves the segment's push tokens, sends via Expo, marks the row 'sent', and
// logs to notification_log.
//
// Deploy:  supabase functions deploy send-scheduled-notifications --no-verify-jwt
// Schedule (run every 5 min) with pg_cron + pg_net — see the SQL note in the repo.
// Protect with a shared secret in the `x-cron-secret` header.

import { createClient } from "jsr:@supabase/supabase-js@2";

const DAY = 86400000;

function segmentMatch(row: any, segment: string, usedPremium: boolean): boolean {
  const now = Date.now();
  const comped = !!row.comp_until && new Date(row.comp_until).getTime() > now;
  const premium = row.subscription_status === "premium" || comped;
  const la = row.last_active_at ?? row.last_prayer_date;
  const lastActive = la ? new Date(la).getTime() : null;
  const bd = row.birthday ? new Date(row.birthday) : null;
  const bdMonth = bd && !isNaN(bd.getTime()) ? bd.getMonth() + 1 : null;
  switch (segment) {
    case "all": return true;
    case "premium": return premium;
    case "trial": return row.subscription_status === "trial" && !comped;
    case "free": return !premium && row.subscription_status !== "trial";
    case "active7": return lastActive != null && now - lastActive <= 7 * DAY;
    case "inactive14": return lastActive == null || now - lastActive > 14 * DAY;
    case "streak7": return (row.prayer_streak ?? 0) >= 7;
    case "birthday_month": return bdMonth === new Date().getMonth() + 1;
    case "premium_unused": return (premium || row.subscription_status === "trial") && !usedPremium;
    default: return false;
  }
}

async function sendExpo(tokens: string[], title: string, body: string, screen?: string): Promise<number> {
  const list = tokens.filter(Boolean);
  if (!list.length) return 0;
  const messages = list.map((to) => ({ to, title, body, sound: "default", data: { screen: screen || "/notifications" } }));
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(batch),
    });
    if (res.ok) sent += batch.length;
  }
  return sent;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: due } = await supabase
    .from("scheduled_notifications")
    .select("id, title, body, segment, send_at, screen")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .limit(50);

  if (!due || due.length === 0) return Response.json({ processed: 0 });

  const [{ data: profiles }, { data: tokenRows }, dResp, jEnt, favs, sessions] = await Promise.all([
    supabase.from("profiles").select("id, subscription_status, comp_until, prayer_streak, last_active_at, last_prayer_date, birthday"),
    supabase.from("user_push_tokens").select("user_id, expo_push_token"),
    supabase.from("devotion_responses").select("user_id"),
    supabase.from("journal_entries").select("user_id"),
    supabase.from("user_favorite_verses").select("user_id"),
    supabase.from("prayer_sessions").select("user_id"),
  ]);
  const tokensByUser = new Map<string, string[]>();
  for (const t of tokenRows ?? []) {
    if (!t.expo_push_token) continue;
    const arr = tokensByUser.get(t.user_id) ?? [];
    arr.push(t.expo_push_token);
    tokensByUser.set(t.user_id, arr);
  }
  const usedPremium = new Set<string>();
  for (const set of [dResp, jEnt, favs, sessions]) {
    for (const r of (set?.data ?? []) as { user_id: string | null }[]) {
      if (r.user_id) usedPremium.add(r.user_id);
    }
  }

  let processed = 0;
  for (const job of due) {
    const tokens: string[] = [];
    for (const p of profiles ?? []) {
      if (!segmentMatch(p, job.segment, usedPremium.has(p.id))) continue;
      const t = tokensByUser.get(p.id);
      if (t) tokens.push(...t);
    }
    const sent = await sendExpo(tokens, job.title, job.body ?? "", job.screen ?? undefined);
    await supabase.from("scheduled_notifications").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: sent }).eq("id", job.id);
    await supabase.from("notification_log").insert({ title: job.title, body: job.body, segment: job.segment, sent_count: sent });
    processed++;
  }

  return Response.json({ processed });
});

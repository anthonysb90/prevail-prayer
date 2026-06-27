// Supabase Edge Function: delete-account
// In-app account deletion (Apple Guideline 5.1.1(v) / Google Play Data deletion).
// The signed-in user calls this; we retain only their email address (per product
// decision) and permanently delete the auth user. All personal data cascades on
// the auth.users delete (profiles, prayer requests, journal, etc.).
//
// Deploy with JWT verification ON (default) so only authenticated users can call
// it. The caller's access token identifies which account to delete — a user can
// only ever delete their own.

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Not authenticated." }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Identify the caller from their token; this is the only account they can delete.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Not authenticated." }, 401);
  const user = userData.user;

  // Retain the email address on file (per product decision), then delete.
  if (user.email) {
    await admin.from("deleted_emails").insert({ user_id: user.id, email: user.email });
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true });
});

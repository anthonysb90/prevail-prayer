// Supabase Edge Function: birthday-greetings
// Runs daily (via pg_cron). Finds users whose birthday is today, sends each an
// Expo push notification. Pro users get a warm greeting; non-Pro users get a
// greeting plus a birthday upgrade offer (deep-links to the birthday paywall).
//
// Idempotent: claim_birthday_greetings() records who was greeted today and only
// returns users not yet greeted, so repeated invocations never double-send.
//
// Deploy with: supabase functions deploy birthday-greetings --no-verify-jwt
// Protected by a shared secret in the `x-birthday-secret` header.

import { createClient } from "jsr:@supabase/supabase-js@2";

interface Target {
  user_id: string;
  expo_push_token: string;
  platform: string | null;
  is_pro: boolean;
  display_name: string | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: { type: "birthday"; offer: boolean };
}

Deno.serve(async (req: Request) => {
  // Lightweight auth: the daily cron passes a shared secret.
  const secret = Deno.env.get("BIRTHDAY_CRON_SECRET");
  if (secret && req.headers.get("x-birthday-secret") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("claim_birthday_greetings");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const targets = (data ?? []) as Target[];
  const messages: ExpoMessage[] = targets
    .filter((t) => !!t.expo_push_token)
    .map((t) => {
      const name = t.display_name ? `, ${t.display_name}` : "";
      if (t.is_pro) {
        return {
          to: t.expo_push_token,
          title: `Happy Birthday${name}! 🎉`,
          body: "The whole Prevail Prayer family is praying a blessing over your new year. We're so glad you're here.",
          sound: "default",
          data: { type: "birthday", offer: false },
        };
      }
      return {
        to: t.expo_push_token,
        title: `Happy Birthday${name}! 🎂`,
        body: "Celebrate with a gift from us — your first year of Prevail Pro at a special birthday price. Tap to unwrap it.",
        sound: "default",
        data: { type: "birthday", offer: true },
      };
    });

  // Expo accepts up to 100 messages per request.
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
  }

  return new Response(JSON.stringify({ targets: targets.length, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});

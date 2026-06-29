/**
 * PostHog analytics (env-keyed, safe no-op until configured).
 *
 *   EXPO_PUBLIC_POSTHOG_KEY   project API key (phc_...)
 *   EXPO_PUBLIC_POSTHOG_HOST  defaults to https://us.i.posthog.com
 *
 * If the key is unset the client is null and every call is a no-op, so the
 * app runs fine before PostHog is wired up.
 */
import PostHog from "posthog-react-native";

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let client: PostHog | null = null;
try {
  if (KEY) {
    // captureAppLifecycleEvents powers session length + "Application Opened/Backgrounded".
    client = new PostHog(KEY, { host: HOST, captureAppLifecycleEvents: true });
  }
} catch {
  client = null;
}

export const analytics = {
  enabled: !!client,
  capture(event: string, properties?: Record<string, any>) {
    try { client?.capture(event, properties); } catch {}
  },
  identify(distinctId: string, properties?: Record<string, any>) {
    try { client?.identify(distinctId, properties); } catch {}
  },
  /** Update person properties on the currently identified user (no event of interest). */
  setPersonProperties(properties: Record<string, any>) {
    try { client?.capture("$set", { $set: properties }); } catch {}
  },
  /** Record a screen view (helps with "what are people using" funnels). */
  screen(name: string, properties?: Record<string, any>) {
    try { client?.screen(name, properties); } catch {}
  },
  reset() {
    try { client?.reset(); } catch {}
  },
};

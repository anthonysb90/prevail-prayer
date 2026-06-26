import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

/**
 * Apple Sign In — temporarily disabled. Re-enable by:
 *  1) npx expo install expo-apple-authentication
 *  2) app.json: ios.usesAppleSignIn = true + add the expo-apple-authentication plugin
 *  3) Apple Developer: enable "Sign In with Apple" on the App ID + regenerate provisioning
 *  4) restore the implementation below and set APPLE_SIGNIN_ENABLED = true in login.tsx
 */
export async function signInWithApple() {
  throw new Error("Apple Sign In is not configured yet.");
}

/**
 * Sign in with Google via Supabase OAuth (PKCE) + a web auth session.
 * Requires the Google provider enabled in Supabase (Web client ID + secret)
 * and prevailprayer:// allowed as a redirect.
 */
export async function signInWithGoogle() {
  const redirectTo = "prevailprayer://";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Could not start Google sign-in.");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) return;
  const code = new URL(result.url).searchParams.get("code");
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
  }
}

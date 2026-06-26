import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";

/**
 * Sign in with Apple — native iOS flow.
 * The native Apple button returns an identity token (JWT) which Supabase
 * verifies against Apple's public keys. Requires:
 *  - "Sign In with Apple" capability enabled on App ID com.missionusa.prevailprayer
 *  - app.json: ios.usesAppleSignIn = true + expo-apple-authentication plugin
 *  - Supabase Apple provider enabled with the bundle ID in Authorized Client IDs
 * No client secret is needed for the native flow.
 */
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error("No identity token returned from Apple.");
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only returns the full name on the very first sign-in. If present,
  // store it on the profile so the user has a display name. Best-effort:
  // never let a failed profile update break a successful sign-in.
  const fullName = credential.fullName;
  const displayName = [fullName?.givenName, fullName?.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const userId = data?.user?.id;
  if (displayName && userId) {
    try {
      await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);
    } catch {
      // ignore — sign-in already succeeded
    }
  }
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

import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

/**
 * Sign in with Apple (iOS). Requires:
 *  - expo-apple-authentication (native; in a build, not Expo Go)
 *  - Apple provider enabled in Supabase Auth with your Service ID
 *  - app.json: ios.usesAppleSignIn = true + the expo-apple-authentication plugin
 */
export async function signInWithApple() {
  if (Platform.OS !== "ios") throw new Error("Apple Sign In is available on iOS.");
  const AppleAuthentication = await import("expo-apple-authentication");
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) throw new Error("Apple Sign In isn't available on this device.");
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error("No identity token from Apple.");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
  // Capture the name on first sign-in (Apple only returns it once).
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
  if (fullName) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ display_name: fullName }).eq("id", user.id);
  }
}

/**
 * Sign in with Google via Supabase OAuth (PKCE) + a web auth session.
 * Requires:
 *  - Google provider enabled in Supabase Auth (Web client ID + secret)
 *  - Authorized redirect to prevailprayer:// in Supabase
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
  if (result.type !== "success" || !result.url) return; // user cancelled
  const code = new URL(result.url).searchParams.get("code");
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
  }
}

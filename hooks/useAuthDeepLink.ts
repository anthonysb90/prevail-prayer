import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

/**
 * Supabase auth emails (signup confirmation, password recovery) redirect back
 * into the app via the `prevailprayer://` scheme. lib/supabase.ts configures
 * `flowType: "pkce"`, so those links land here as e.g.
 *   prevailprayer://reset?code=xxxxxxxx-xxxx-...
 * not as access/refresh tokens in a URL hash (that's the older implicit-flow
 * shape). The client already generated and stored a PKCE code_verifier when
 * signUp()/resetPasswordForEmail() was first called, so exchangeCodeForSession
 * just needs the incoming URL to complete the handshake and establish a
 * session — onAuthStateChange then fires (as PASSWORD_RECOVERY for a reset
 * link, SIGNED_IN for a confirmation link), which app/_layout.tsx already
 * listens for. Before this hook existed, nothing was feeding these incoming
 * URLs to Supabase at all, so tapping the email link opened the app and did
 * nothing.
 */
export function useAuthDeepLink() {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes("code=")) return;
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) {
        console.warn("Failed to establish session from auth link:", error.message);
      }
    };

    // Cold start: app was opened directly via the link.
    Linking.getInitialURL().then(handleUrl);

    // Warm start: app was already running in the background.
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    return () => subscription.remove();
  }, []);
}

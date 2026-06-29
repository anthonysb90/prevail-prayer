import { create } from "zustand";
import { Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { analytics } from "@/lib/analytics";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    // Retry a few times: on a cold relaunch (especially after iOS killed the app
    // in the background) the first request can fail before the network is ready.
    // A silent failure here left the user with no profile — generic greeting and,
    // worse, an unrecognized trial (so they were wrongly asked to pay).
    let data: Profile | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (!res.error && res.data) { data = res.data as Profile; break; }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }

    if (data) {
      const profile = data;
      set({ profile });
      let timezone: string | undefined;
      try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
      const p = profile as Record<string, any>;
      const comped = !!p.comp_until && new Date(p.comp_until).getTime() > Date.now();
      analytics.identify(userId, {
        email: p.email ?? undefined,
        name: p.full_name ?? p.name ?? undefined,
        subscription_status: profile.subscription_status,
        is_premium: profile.subscription_status === "premium" || comped,
        comped,
        account_created: p.created_at ?? undefined,
        platform: Platform.OS,
        timezone,
      });
    }
  },

  signOut: async () => {
    analytics.reset();
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));

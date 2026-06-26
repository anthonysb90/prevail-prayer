import { create } from "zustand";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type ThemePref = "system" | "light" | "dark";
const STORAGE_KEY = "prevail.theme_pref";

interface ThemeState {
  pref: ThemePref;
  systemScheme: "light" | "dark";
  isDark: boolean;
  hydrate: (profilePref?: ThemePref | null) => Promise<void>;
  setSystemScheme: (scheme: "light" | "dark") => void;
  setPref: (pref: ThemePref, userId?: string | null) => Promise<void>;
}

function resolveIsDark(pref: ThemePref, systemScheme: "light" | "dark") {
  return pref === "dark" || (pref === "system" && systemScheme === "dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  pref: "system",
  systemScheme: Appearance.getColorScheme() === "dark" ? "dark" : "light",
  isDark: Appearance.getColorScheme() === "dark",

  hydrate: async (profilePref) => {
    let pref: ThemePref = "system";
    try {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemePref | null;
      if (stored) pref = stored;
    } catch {}
    // A saved server preference wins if present.
    if (profilePref) pref = profilePref;
    const systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
    set({ pref, systemScheme, isDark: resolveIsDark(pref, systemScheme) });
  },

  setSystemScheme: (scheme) =>
    set((s) => ({ systemScheme: scheme, isDark: resolveIsDark(s.pref, scheme) })),

  setPref: async (pref, userId) => {
    set((s) => ({ pref, isDark: resolveIsDark(pref, s.systemScheme) }));
    try { await AsyncStorage.setItem(STORAGE_KEY, pref); } catch {}
    if (userId) {
      supabase.from("profiles").update({ theme_pref: pref }).eq("id", userId).then(() => {});
    }
  },
}));

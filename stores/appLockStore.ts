import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "prevail.biometric_lock";

interface AppLockState {
  enabled: boolean;   // user turned Face ID lock on (persisted)
  unlocked: boolean;  // unlocked for this foreground session (in-memory)
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (v: boolean) => Promise<void>;
  setUnlocked: (v: boolean) => void;
}

export const useAppLockStore = create<AppLockState>((set) => ({
  enabled: false,
  unlocked: false,
  hydrated: false,
  hydrate: async () => {
    let enabled = false;
    try { enabled = (await AsyncStorage.getItem(KEY)) === "1"; } catch {}
    // If lock is on, start locked (must authenticate); if off, always unlocked.
    set({ enabled, unlocked: !enabled, hydrated: true });
  },
  setEnabled: async (v) => {
    set({ enabled: v, unlocked: true });
    try { await AsyncStorage.setItem(KEY, v ? "1" : "0"); } catch {}
  },
  setUnlocked: (v) => set({ unlocked: v }),
}));

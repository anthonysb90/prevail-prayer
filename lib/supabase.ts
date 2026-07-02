import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore refuses values larger than 2048 bytes (a warning on iOS, a hard
// failure on some Android devices). A Supabase session with a PKCE + provider
// token can exceed that, which silently fails to persist and logs the user out
// at random. This adapter transparently splits large values into <2KB chunks,
// all still kept in the device keychain. Existing single-key sessions are read
// back via a fallback so nobody is signed out by the upgrade.
const CHUNK_SIZE = 1800;
const countKey = (key: string) => `${key}.__chunks`;

const isWeb = Platform.OS === "web";
// Guard: with web.output "static", module code can evaluate where there is no
// window/localStorage. Fall back to a no-op store in that case.
const hasLocalStorage = typeof window !== "undefined" && !!window.localStorage;

async function removeChunks(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(countKey(key));
  if (countRaw == null) return;
  const count = parseInt(countRaw, 10);
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}.${i}`).catch(() => {});
  }
  await SecureStore.deleteItemAsync(countKey(key)).catch(() => {});
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) return hasLocalStorage ? window.localStorage.getItem(key) : null;

    const countRaw = await SecureStore.getItemAsync(countKey(key));
    if (countRaw == null) {
      // Not chunked (or written by an older build) — read the plain key.
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(countRaw, 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part == null) return null; // corrupt/partial — treat as absent
      parts.push(part);
    }
    return parts.join("");
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      if (hasLocalStorage) window.localStorage.setItem(key, value);
      return;
    }
    // Clear any previous representation (plain key or a longer chunk set).
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key).catch(() => {});

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(countKey(key), String(count));
  },

  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      if (hasLocalStorage) window.localStorage.removeItem(key);
      return;
    }
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

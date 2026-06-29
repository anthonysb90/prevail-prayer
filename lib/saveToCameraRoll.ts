// Saves an image (by file URI) to the device camera roll.
// Requires expo-media-library:  npx expo install expo-media-library
// Best-effort: never throws, so a denied permission won't break the import flow.

// @ts-ignore - resolved at build time once expo-media-library is installed
import * as MediaLibrary from "expo-media-library";

export async function saveToCameraRoll(uri: string): Promise<boolean> {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted && perm.status !== "granted") return false;
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch (e) {
    console.warn("saveToCameraRoll failed:", e);
    return false;
  }
}

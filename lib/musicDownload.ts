import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline downloads for uploaded (streamed) tracks. Bundled tracks are already
 * on-device and never need this. A small AsyncStorage registry maps a track id
 * to its saved file uri so the timer can play it without a network connection.
 */

const DIR = (FileSystem.documentDirectory ?? "") + "music/";
const REG_KEY = "prevail.downloaded_tracks";

type Registry = Record<string, string>; // trackId -> local file uri

async function readReg(): Promise<Registry> {
  try {
    const raw = await AsyncStorage.getItem(REG_KEY);
    return raw ? (JSON.parse(raw) as Registry) : {};
  } catch {
    return {};
  }
}

async function writeReg(reg: Registry): Promise<void> {
  try { await AsyncStorage.setItem(REG_KEY, JSON.stringify(reg)); } catch {}
}

async function ensureDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {}
}

function extFromUrl(url: string): string {
  const clean = url.split("?")[0];
  const m = clean.match(/\.(mp3|m4a|aac|wav)$/i);
  return m ? m[0].toLowerCase() : ".mp3";
}

/** Returns id -> local uri for tracks whose files still exist on disk. */
export async function getDownloadedMap(): Promise<Registry> {
  const reg = await readReg();
  const out: Registry = {};
  for (const [id, uri] of Object.entries(reg)) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) out[id] = uri;
    } catch {}
  }
  if (Object.keys(out).length !== Object.keys(reg).length) await writeReg(out);
  return out;
}

/** Download a track for offline use. Returns the local uri, or null on failure. */
export async function downloadTrack(id: string, url: string): Promise<string | null> {
  await ensureDir();
  const target = DIR + id + extFromUrl(url);
  try {
    const res = await FileSystem.downloadAsync(url, target);
    if (res.status !== 200) {
      await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
      return null;
    }
    const reg = await readReg();
    reg[id] = res.uri;
    await writeReg(reg);
    return res.uri;
  } catch {
    return null;
  }
}

/** Remove a downloaded track from disk. */
export async function removeDownload(id: string): Promise<void> {
  const reg = await readReg();
  const uri = reg[id];
  if (uri) {
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    delete reg[id];
    await writeReg(reg);
  }
}

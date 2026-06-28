import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";

/**
 * Private images for prayer requests and the prayer-list background.
 * Stored under "<userId>/..." in the private `prayer-images` bucket, so RLS
 * scopes access to the owner. Reads go through short-lived signed URLs.
 */

const BUCKET = "prayer-images";
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function b64ToBytes(b64: string): Uint8Array {
  const s = b64.replace(/\s/g, "");
  const idx = (ch: string) => (ch === "=" ? 64 : B64.indexOf(ch));
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const c0 = idx(s[i]); const c1 = idx(s[i + 1]); const c2 = idx(s[i + 2] ?? "="); const c3 = idx(s[i + 3] ?? "=");
    const n = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);
    out.push((n >> 16) & 255);
    if (c2 !== 64) out.push((n >> 8) & 255);
    if (c3 !== 64) out.push(n & 255);
  }
  return new Uint8Array(out);
}

function extFromUri(uri: string): string {
  const m = uri.split("?")[0].match(/\.(jpg|jpeg|png|heic|heif|webp)$/i);
  const e = m ? m[0].toLowerCase() : ".jpg";
  return e === ".jpeg" ? ".jpg" : e;
}
function contentType(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".heic" || ext === ".heif") return "image/heic";
  return "image/jpeg";
}

/** Upload a local image (file:// uri) to the owner's folder; returns the storage path. */
export async function uploadPrayerImage(userId: string, localUri: string, prefix = ""): Promise<string | null> {
  try {
    const ext = extFromUri(localUri);
    const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: "base64" });
    const bytes = b64ToBytes(b64);
    const path = `${userId}/${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: contentType(ext), upsert: false });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

/** A short-lived signed URL for displaying a stored image. */
export async function signPrayerImage(path: string, expiresSeconds = 3600): Promise<string | null> {
  try {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresSeconds);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function removePrayerImage(path: string): Promise<void> {
  try { await supabase.storage.from(BUCKET).remove([path]); } catch {}
}

import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

export interface ImportItem {
  title: string;
  description: string;
}
export interface ImportResult {
  items: ImportItem[];
  remaining?: { photo: number; photoCap: number };
  error?: string;
  code?: string;
}
/** The app's own view of the caller's status. NOTE: the server no longer
 *  trusts these fields — it verifies comp/RevenueCat/trial entirely
 *  server-side. Still sent for backward compatibility with older function
 *  deployments; safe to remove once the updated function is live. */
export interface ImportClaim {
  premium: boolean;
  trial: boolean;
}

const TIMEOUT_MS = 90000;

function mediaTypeFromUri(uri: string): string {
  const u = uri.split("?")[0].toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".heic") || u.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

/**
 * Read a picked image as base64, re-encoding to JPEG first. iOS photos are often
 * HEIC, which Anthropic's API rejects (it only accepts jpeg/png/gif/webp).
 * Transcoding to JPEG makes every provider accept the image and shrinks the
 * payload. Falls back to the raw bytes if manipulation fails.
 */
async function readImageAsJpeg(uri: string): Promise<{ data: string; media_type: string }> {
  try {
    // Downscale to ~1500px wide before encoding. A raw phone photo is ~4000px /
    // several MB; text stays perfectly legible at 1500px, and the smaller payload
    // makes BOTH the upload and the AI vision pass dramatically faster.
    const context = ImageManipulator.manipulate(uri).resize({ width: 1500 });
    const rendered = await context.renderAsync();
    const out = await rendered.saveAsync({ compress: 0.55, format: SaveFormat.JPEG, base64: true });
    if (out.base64) return { data: out.base64, media_type: "image/jpeg" };
  } catch (_e) {
    // fall through to the raw read below
  }
  const data = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  return { data, media_type: mediaTypeFromUri(uri) };
}

async function readError(error: unknown): Promise<{ error?: string; code?: string; remaining?: ImportResult["remaining"] }> {
  try {
    const ctx = (error as { context?: { json?: () => Promise<unknown> } })?.context;
    const body = ctx?.json ? ((await ctx.json()) as { error?: string; code?: string; remaining?: ImportResult["remaining"] }) : null;
    if (body?.error) return { error: body.error, code: body.code, remaining: body.remaining };
  } catch {
    // fall through
  }
  const msg = (error as { message?: string })?.message ?? "Import failed. Please try again.";
  return { error: msg };
}

async function invokeImport(body: Record<string, unknown>): Promise<{ data: ImportResult | null; error: unknown }> {
  const timeout = new Promise<{ data: null; error: unknown }>((_, reject) =>
    setTimeout(() => reject(new Error("This is taking too long. Try fewer or clearer photos, or paste the text instead.")), TIMEOUT_MS)
  );
  return (await Promise.race([
    supabase.functions.invoke("import-prayer-list", { body }) as Promise<{ data: ImportResult | null; error: unknown }>,
    timeout,
  ]));
}

/** Pro-only: send up to 3 photos of a prayer list for AI extraction. */
export async function importFromPhotos(uris: string[], claim: ImportClaim): Promise<ImportResult> {
  try {
    const images: { data: string; media_type: string }[] = [];
    for (const uri of uris.slice(0, 3)) {
      images.push(await readImageAsJpeg(uri));
    }
    const { data, error } = await invokeImport({ mode: "photo", images, premium: claim.premium, trial: claim.trial });
    if (error) return { items: [], ...(await readError(error)) };
    return (data as ImportResult) ?? { items: [] };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : "Import failed. Please try again." };
  }
}

/** Free: send pasted text of a prayer list for AI structuring. */
export async function importFromText(text: string, claim: ImportClaim): Promise<ImportResult> {
  try {
    const { data, error } = await invokeImport({ mode: "text", text, premium: claim.premium, trial: claim.trial });
    if (error) return { items: [], ...(await readError(error)) };
    return (data as ImportResult) ?? { items: [] };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : "Import failed. Please try again." };
  }
}

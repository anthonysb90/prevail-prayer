import * as FileSystem from "expo-file-system/legacy";
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
/** The app's own view of the caller's status, used as a fallback when the
 *  server can't verify the subscription via RevenueCat. */
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
      const data = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      images.push({ data, media_type: mediaTypeFromUri(uri) });
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

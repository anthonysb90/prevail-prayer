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

function mediaTypeFromUri(uri: string): string {
  const u = uri.split("?")[0].toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".heic") || u.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

async function readError(error: unknown): Promise<{ error?: string; code?: string; remaining?: ImportResult["remaining"] }> {
  // supabase-js puts the failed Response on error.context for non-2xx replies.
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

/** Pro-only: send up to 3 photos of a prayer list for AI extraction. */
export async function importFromPhotos(uris: string[]): Promise<ImportResult> {
  const images: { data: string; media_type: string }[] = [];
  for (const uri of uris.slice(0, 3)) {
    const data = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    images.push({ data, media_type: mediaTypeFromUri(uri) });
  }
  const { data, error } = await supabase.functions.invoke("import-prayer-list", { body: { mode: "photo", images } });
  if (error) return { items: [], ...(await readError(error)) };
  return data as ImportResult;
}

/** Free: send pasted text of a prayer list for AI structuring. */
export async function importFromText(text: string): Promise<ImportResult> {
  const { data, error } = await supabase.functions.invoke("import-prayer-list", { body: { mode: "text", text } });
  if (error) return { items: [], ...(await readError(error)) };
  return data as ImportResult;
}

import { supabase } from "@/lib/supabase";

/** A row from the admin-managed music_tracks table (available tracks only). */
export interface MusicTrackRow {
  id: string;
  title: string;
  artist: string | null;
  file_url: string | null;
  is_bundled: boolean;
  sort_order: number;
  bundle_key: string | null;
}

/**
 * Built-in audio shipped inside the binary, keyed by music_tracks.bundle_key.
 * Bundled tracks play instantly and work offline; uploaded tracks stream from
 * Supabase Storage (and can be downloaded for offline use — see musicDownload).
 */
export const BUNDLED_ASSETS: Record<string, number> = {
  "morning-still": require("@/assets/audio/ambient-morning.mp3"),
  "deep-waters": require("@/assets/audio/ambient-waters.mp3"),
  "holy-ground": require("@/assets/audio/ambient-holy.mp3"),
};

/** True when a track can actually be played on this build. */
export function isPlayable(t: MusicTrackRow): boolean {
  if (t.is_bundled) return !!(t.bundle_key && BUNDLED_ASSETS[t.bundle_key]);
  return !!t.file_url;
}

/** Fetch the admin-curated, available tracks the app can play, in order. */
export async function fetchAvailableTracks(): Promise<MusicTrackRow[]> {
  const { data, error } = await supabase
    .from("music_tracks")
    .select("id,title,artist,file_url,is_bundled,sort_order,bundle_key")
    .eq("is_available", true)
    .order("sort_order");
  if (error || !data) return [];
  return (data as MusicTrackRow[]).filter(isPlayable);
}

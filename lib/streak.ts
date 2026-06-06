import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabase";

/**
 * Call after a prayer timer session completes.
 * - Same day: no-op (streak already counted today)
 * - Yesterday: increment streak by 1
 * - Older than yesterday: reset streak to 1
 */
export async function updatePrayerStreak(userId: string): Promise<void> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("prayer_streak, last_prayer_date")
      .eq("id", userId)
      .single();

    if (error || !profile) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const lastDate = profile.last_prayer_date;

    // Already counted today — nothing to do
    if (lastDate === today) return;

    const newStreak =
      lastDate === yesterday
        ? (profile.prayer_streak ?? 0) + 1
        : 1; // missed a day — reset

    await supabase
      .from("profiles")
      .update({ prayer_streak: newStreak, last_prayer_date: today })
      .eq("id", userId);
  } catch {
    // Non-critical — don't surface streak errors to user
  }
}

/**
 * Log a completed prayer session and return the total completed count.
 */
export async function logPrayerSession(
  userId: string,
  durationSeconds: number,
  ambientTrack: string
): Promise<number> {
  try {
    await supabase.from("prayer_sessions").insert({
      user_id: userId,
      duration_seconds: durationSeconds,
      ambient_track: ambientTrack,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    const { count } = await supabase
      .from("prayer_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    return count ?? 0;
  } catch {
    return 0;
  }
}

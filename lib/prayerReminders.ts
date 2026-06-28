import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { scheduleLocalReminder, cancelReminder } from "@/lib/notifications";

/**
 * Per-prayer reminders. Each reminder is a local (on-device) notification so it
 * fires on time even offline and carries the request's own text. The schedule
 * config is mirrored to the `prayer_reminders` table so it can be listed,
 * edited, and re-scheduled (e.g. after a reinstall).
 */

export type ReminderSchedule = "once" | "daily" | "weekly";

export interface PrayerReminder {
  id: string;
  user_id: string;
  prayer_id: string;
  schedule_type: ReminderSchedule;
  fire_at: string | null; // ISO, for one-time
  weekday: number | null; // 1=Sun … 7=Sat, for weekly
  hour: number;
  minute: number;
  enabled: boolean;
  created_at: string;
}

export interface NewReminder {
  prayerId: string;
  scheduleType: ReminderSchedule;
  fireAt?: Date; // for "once"
  weekday?: number; // 1=Sun … 7=Sat, for "weekly"
  hour: number;
  minute: number;
}

const idFor = (reminderId: string) => `prayer_rem_${reminderId}`;

function buildContent(title: string, detail?: string | null): { title: string; body: string } {
  const body = detail?.trim()
    ? detail.trim()
    : "A request on your prayer list. Take a moment to lift it up.";
  return { title: `Pray: ${title}`, body };
}

function triggerFor(r: Pick<PrayerReminder, "schedule_type" | "fire_at" | "weekday" | "hour" | "minute">): Notifications.NotificationTriggerInput {
  if (r.schedule_type === "once") {
    return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(r.fire_at as string) };
  }
  if (r.schedule_type === "weekly") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: r.weekday ?? 1,
      hour: r.hour,
      minute: r.minute,
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute };
}

async function scheduleLocal(r: PrayerReminder, title: string, detail?: string | null): Promise<void> {
  const content = buildContent(title, detail);
  await scheduleLocalReminder({
    title: content.title,
    body: content.body,
    trigger: triggerFor(r),
    identifier: idFor(r.id),
  });
}

export async function listReminders(prayerId: string): Promise<PrayerReminder[]> {
  const { data } = await supabase
    .from("prayer_reminders")
    .select("*")
    .eq("prayer_id", prayerId)
    .order("created_at", { ascending: false });
  return (data as PrayerReminder[]) ?? [];
}

export async function createReminder(
  userId: string,
  input: NewReminder,
  prayerTitle: string,
  prayerDetail?: string | null,
): Promise<PrayerReminder> {
  const row = {
    user_id: userId,
    prayer_id: input.prayerId,
    schedule_type: input.scheduleType,
    fire_at: input.scheduleType === "once" && input.fireAt ? input.fireAt.toISOString() : null,
    weekday: input.scheduleType === "weekly" ? input.weekday ?? 1 : null,
    hour: input.hour,
    minute: input.minute,
    enabled: true,
  };
  const { data, error } = await supabase.from("prayer_reminders").insert(row).select().single();
  if (error) throw error;
  const reminder = data as PrayerReminder;
  await scheduleLocal(reminder, prayerTitle, prayerDetail);
  return reminder;
}

export async function setReminderEnabled(
  reminder: PrayerReminder,
  enabled: boolean,
  prayerTitle: string,
  prayerDetail?: string | null,
): Promise<void> {
  await supabase.from("prayer_reminders").update({ enabled }).eq("id", reminder.id);
  await cancelReminder(idFor(reminder.id));
  if (enabled) await scheduleLocal({ ...reminder, enabled }, prayerTitle, prayerDetail);
}

export async function deleteReminder(reminder: PrayerReminder): Promise<void> {
  await cancelReminder(idFor(reminder.id));
  await supabase.from("prayer_reminders").delete().eq("id", reminder.id);
}

/** Re-schedule all of the user's enabled reminders (e.g. after a reinstall). */
export async function rescheduleAllReminders(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("prayer_reminders")
      .select("*, prayer:prayer_requests(title, description)")
      .eq("user_id", userId)
      .eq("enabled", true);
    const now = Date.now();
    for (const row of (data ?? []) as (PrayerReminder & { prayer?: { title: string; description: string | null } })[]) {
      // Skip one-time reminders that have already passed.
      if (row.schedule_type === "once" && row.fire_at && new Date(row.fire_at).getTime() < now) continue;
      await cancelReminder(idFor(row.id));
      await scheduleLocal(row, row.prayer?.title ?? "Your prayer request", row.prayer?.description);
    }
  } catch (e) {
    console.warn("rescheduleAllReminders failed", e);
  }
}

/** Human-readable summary used in lists. */
export function reminderLabel(r: PrayerReminder): string {
  const h12 = ((r.hour + 11) % 12) + 1;
  const period = r.hour >= 12 ? "PM" : "AM";
  const time = `${h12}:${r.minute.toString().padStart(2, "0")} ${period}`;
  if (r.schedule_type === "once") {
    if (!r.fire_at) return `Once at ${time}`;
    const d = new Date(r.fire_at);
    return `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at ${time}`;
  }
  if (r.schedule_type === "weekly") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Every ${days[(r.weekday ?? 1) - 1]} at ${time}`;
  }
  return `Every day at ${time}`;
}

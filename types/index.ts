// ─── Auth ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  walk_with_god: string[] | null;
  theme_pref: "system" | "light" | "dark";
  prayer_streak: number;
  last_prayer_date: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Prayer Requests ─────────────────────────────────────────────────────────

export type PrayerStatus = "active" | "answered" | "completed" | "ongoing";

export interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: PrayerStatus;
  is_urgent: boolean;
  answer_notes: string | null;
  answered_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  color_bg: string;
  color_border: string;
  icon: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export type ReminderType = "specific" | "general";
export type RecurrenceType = "once" | "daily" | "weekly";

export interface Reminder {
  id: string;
  user_id: string;
  prayer_request_id: string | null;
  reminder_type: ReminderType;
  recurrence_type: RecurrenceType;
  days_of_week: number[] | null;
  reminder_time: string; // "HH:MM:SS"
  is_active: boolean;
  created_at: string;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  user_id: string;
  prayer_request_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  prayer_request?: PrayerRequest;
}

// ─── Scripture ───────────────────────────────────────────────────────────────

export type ScriptureTopic =
  | "Prayer"
  | "Faith"
  | "Healing"
  | "Peace"
  | "Guidance"
  | "Trust"
  | "Praise"
  | "Warfare"
  | "Salvation"
  | "Hope";

export interface ScriptureVerse {
  id: string;
  reference: string;
  verse_text: string;
  topic: ScriptureTopic;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Prayer Sessions ─────────────────────────────────────────────────────────

export interface PrayerSession {
  id: string;
  user_id: string;
  duration_seconds: number;
  ambient_track: string | null;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

// ─── Support ─────────────────────────────────────────────────────────────────

export type SupportAction = "dismissed" | "supported" | "rated" | "shared";

export interface SupportInteraction {
  id: string;
  user_id: string;
  action: SupportAction;
  shown_at: string;
}

// ─── Timer ───────────────────────────────────────────────────────────────────

export type AmbientTrack =
  | "morning-still"
  | "deep-waters"
  | "holy-ground"
  | "silence";

export type BellInterval = "off" | "5min" | "10min" | "end-only";

export interface TimerSettings {
  duration_seconds: number;
  ambient_track: AmbientTrack;
  bell_interval: BellInterval;
}

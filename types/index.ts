// ─── Auth ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  phone: string | null;
  zip_code: string | null;
  walk_with_god: string[] | null;
  theme_pref: "system" | "light" | "dark";
  prayer_streak: number;
  last_prayer_date: string | null;
  subscription_status: "free" | "trial" | "premium" | "expired";
  is_admin: boolean;
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

// ─── Devotions ───────────────────────────────────────────────────────────────

export interface Devotion {
  id: string;
  title: string;
  image_url: string | null;
  scripture_reference: string | null;
  scripture_text: string | null;
  body: string;
  closing_prayer: string | null;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  questions?: DevotionQuestion[];
}

export interface DevotionQuestion {
  id: string;
  devotion_id: string;
  question_text: string;
  sort_order: number;
  created_at: string;
}

export interface DevotionResponse {
  id: string;
  devotion_id: string;
  user_id: string;
  journal_entry_id: string | null;
  responses: Array<{ question_id: string; question_text: string; answer: string }>;
  created_at: string;
}

// ─── Music ───────────────────────────────────────────────────────────────────

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  file_url: string | null;
  cover_art_url: string | null;
  duration_seconds: number | null;
  is_bundled: boolean;
  is_available: boolean;
  sort_order: number;
  file_size_bytes: number | null;
  created_at: string;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export type AnnouncementType = "info" | "prayer" | "emergency" | "update";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  sent_at: string | null;
  sent_by: string | null;
  created_at: string;
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

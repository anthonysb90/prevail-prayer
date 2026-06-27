import { Profile } from "@/types";

/** Length of the free, no-card trial granted to every new user at signup. */
export const TRIAL_DAYS = 14;

/**
 * A user is in their free trial when the backend marked them "trial" and it has
 * been fewer than TRIAL_DAYS since the account was created. We derive the end
 * from created_at so no extra column or scheduled job is required — the client
 * simply stops treating them as premium once the window passes.
 */
export function trialEndsAt(profile?: Profile | null): Date | null {
  if (!profile?.created_at) return null;
  const start = new Date(profile.created_at).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function isTrialActive(profile?: Profile | null): boolean {
  if (!profile || profile.subscription_status !== "trial") return false;
  const ends = trialEndsAt(profile);
  return !!ends && Date.now() < ends.getTime();
}

/**
 * True when an admin has gifted ("comped") this user Pro and it hasn't expired.
 * comp_until holds the expiry; a far-future date (set by the admin "Lifetime"
 * option) effectively never expires.
 */
export function isComped(profile?: Profile | null): boolean {
  if (!profile?.comp_until) return false;
  const until = new Date(profile.comp_until).getTime();
  return !Number.isNaN(until) && Date.now() < until;
}

/**
 * Human-friendly label for an active gift, e.g. "Yours for life" or
 * "active through June 26, 2027". Returns null when not comped.
 */
export function compExpiryLabel(profile?: Profile | null): string | null {
  if (!isComped(profile) || !profile?.comp_until) return null;
  const d = new Date(profile.comp_until);
  if (d.getFullYear() >= 2999) return "Yours for life";
  return `active through ${d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`;
}

/** Whole days remaining in the trial (0 once expired). For UI banners. */
export function trialDaysLeft(profile?: Profile | null): number {
  const ends = trialEndsAt(profile);
  if (!ends) return 0;
  const ms = ends.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

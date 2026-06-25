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

/** Whole days remaining in the trial (0 once expired). For UI banners. */
export function trialDaysLeft(profile?: Profile | null): number {
  const ends = trialEndsAt(profile);
  if (!ends) return 0;
  const ms = ends.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Birthday helpers — collected as MM/DD/YYYY in the UI, stored as ISO YYYY-MM-DD.
 * A lightweight masked text input is used instead of a native date picker
 * (the native spinner rendered poorly on this project's screens).
 */

/** Format raw keystrokes into an MM/DD/YYYY mask. */
export function formatBirthdayInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export interface BirthdayParseResult {
  iso: string | null; // "YYYY-MM-DD" when valid
  error: string | null;
}

/**
 * Validate an MM/DD/YYYY string and convert to ISO YYYY-MM-DD.
 * Rejects impossible dates, future dates, and implausible years.
 */
export function parseBirthday(masked: string): BirthdayParseResult {
  const d = masked.replace(/\D/g, "");
  if (d.length !== 8) return { iso: null, error: "Enter your birthday as MM/DD/YYYY." };

  const month = parseInt(d.slice(0, 2), 10);
  const day = parseInt(d.slice(2, 4), 10);
  const year = parseInt(d.slice(4), 10);

  const nowYear = new Date().getFullYear();
  if (year < 1900 || year > nowYear) return { iso: null, error: "Please enter a valid year." };
  if (month < 1 || month > 12) return { iso: null, error: "Please enter a valid month." };
  if (day < 1 || day > 31) return { iso: null, error: "Please enter a valid day." };

  // Confirm the calendar date actually exists (e.g. reject 02/30).
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return { iso: null, error: "That date doesn't exist. Please check it." };
  }
  if (dt.getTime() > Date.now()) return { iso: null, error: "Birthday can't be in the future." };

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { iso, error: null };
}

/** Convert a stored ISO YYYY-MM-DD back to an MM/DD/YYYY display string. */
export function isoToMasked(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${m[2]}/${m[3]}/${m[1]}`;
}

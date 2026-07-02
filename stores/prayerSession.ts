import { create } from "zustand";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { BellInterval } from "@/types";
import { logPrayerSession, updatePrayerStreak } from "@/lib/streak";
import { analytics } from "@/lib/analytics";

/** A playable ambient source: bundled asset (require -> number), a remote/local
 *  URI, or null for silence. */
export type AmbientSource = number | { uri: string } | null;

const CHIME = require("@/assets/audio/chime.mp3");

const TARGET_VOLUME = 0.6;
const CROSSFADE_MS = 500;
const FADE_IN_MS = 900;
const FADE_OUT_END_MS = 1400;
const FADE_OUT_STOP_MS = 400;
const STEP_MS = 40;
const TICK_MS = 250; // finer than 1s so the wall-clock display stays smooth
// End a session early and you still get credit if you prayed at least this long.
const PARTIAL_MIN_SECONDS = 180;

// Keep the screen awake only while a session is actively running. Guarded so a
// double activate/deactivate never throws.
const KEEP_AWAKE_TAG = "prayer-session";
function keepAwakeOn() { activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {}); }
function keepAwakeOff() { try { deactivateKeepAwake(KEEP_AWAKE_TAG); } catch {} }

// ── Module-level audio + timer (kept out of React state to avoid re-renders) ──
let ambient: AudioPlayer | null = null;
let chime: AudioPlayer | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let fadeToken = 0;
let lastBellMark = -1;
let audioModeSet = false;
let sessionUserId: string | null = null;

// Wall-clock anchor: the timestamp (ms) at which the running session should hit
// zero. Derived remaining = round((endsAt - now)/1000). This survives JS timer
// suspension (screen lock / backgrounding) and never drifts, unlike counting
// down by 1 each tick.
let endsAt = 0;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number) => Math.max(0, Math.min(1, v));

async function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "mixWithOthers",
  }).catch(() => {});
}

function ensureChime() {
  if (chime) return;
  try {
    chime = createAudioPlayer(CHIME);
    chime.volume = 0.8;
  } catch {}
}

function playChime() {
  ensureChime();
  if (!chime) return;
  try { chime.seekTo(0); chime.play(); } catch {}
}

async function ramp(player: AudioPlayer, from: number, to: number, ms: number, alive: () => boolean) {
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    if (!alive()) return;
    const v = from + (to - from) * (i / steps);
    try { player.volume = clamp(v); } catch {}
    await sleep(STEP_MS);
  }
}

function removePlayer(p: AudioPlayer | null) {
  if (!p) return;
  try { p.remove(); } catch {}
}

/** Load + crossfade to a new source. If running, the new track fades in while
 *  the old fades out (0.5s). If idle, just swaps silently. */
async function loadSource(source: AmbientSource, running: boolean) {
  const token = ++fadeToken;
  const alive = () => fadeToken === token;
  const previous = ambient;

  if (!source) {
    if (previous) { await ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive); removePlayer(previous); }
    if (alive()) ambient = null;
    return;
  }

  let sound: AudioPlayer;
  try {
    sound = createAudioPlayer(source);
    sound.loop = true;
    sound.volume = 0;
  } catch {
    return;
  }
  if (!alive()) { removePlayer(sound); return; }
  ambient = sound;
  if (running) { try { sound.play(); } catch {} }

  if (running) {
    const fadeIn = ramp(sound, 0, TARGET_VOLUME, CROSSFADE_MS, alive);
    const fadeOut = previous
      ? ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive).then(() => removePlayer(previous))
      : Promise.resolve();
    await Promise.all([fadeIn, fadeOut]);
  } else if (previous) {
    removePlayer(previous);
  }
}

function clearTick() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

function maybeBell(elapsed: number, bell: BellInterval) {
  if (bell === "5min") {
    const mark = Math.floor(elapsed / 300);
    if (mark > 0 && mark !== lastBellMark) { lastBellMark = mark; playChime(); }
  } else if (bell === "10min") {
    const mark = Math.floor(elapsed / 600);
    if (mark > 0 && mark !== lastBellMark) { lastBellMark = mark; playChime(); }
  }
}

function startTick() {
  clearTick();
  intervalId = setInterval(() => {
    const s = usePrayerSession.getState();
    if (!s.running) return;
    // Derive remaining from the wall clock instead of decrementing. If JS was
    // suspended (lock/background), this catches up to the true value on resume.
    const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    if (remaining <= 0) {
      usePrayerSession.setState({ remaining: 0 });
      void completeSession();
      return;
    }
    if (remaining !== s.remaining) usePrayerSession.setState({ remaining });
    maybeBell(s.duration - remaining, s.bellInterval);
  }, TICK_MS);
}

async function completeSession() {
  clearTick();
  keepAwakeOff();
  const s = usePrayerSession.getState();
  usePrayerSession.setState({ running: false, completed: true });

  if (s.bellInterval !== "off") playChime();

  // Gentle fade out + stop the music.
  const token = ++fadeToken;
  const alive = () => fadeToken === token;
  if (ambient) {
    const a = ambient;
    await ramp(a, TARGET_VOLUME, 0, FADE_OUT_END_MS, alive);
    if (alive()) { try { a.pause(); } catch {} }
  }

  // Record the session (full duration was prayed).
  if (sessionUserId) {
    try {
      await logPrayerSession(sessionUserId, s.duration, s.trackId);
      await updatePrayerStreak(sessionUserId);
      analytics.capture("prayer_session_completed", { duration_seconds: s.duration, track: s.trackId, bell: s.bellInterval });
    } catch {}
  }
}

interface PrayerSessionState {
  active: boolean;     // a session has been started (running, paused, or just completed)
  running: boolean;
  completed: boolean;
  duration: number;    // seconds
  remaining: number;   // seconds
  bellInterval: BellInterval;
  trackId: string;     // stable id of the selected track (for logging / mini-player)
  trackTitle: string;
  source: AmbientSource;

  setDuration: (d: number) => void;
  setBell: (b: BellInterval) => void;
  selectTrack: (trackId: string, source: AmbientSource, title: string) => void;
  start: (userId: string | null) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export const usePrayerSession = create<PrayerSessionState>((set, get) => ({
  active: false,
  running: false,
  completed: false,
  duration: 300,
  remaining: 300,
  bellInterval: "end-only",
  trackId: "silence",
  trackTitle: "Silence",
  source: null,

  setDuration: (d) => {
    if (get().running) return;
    set({ duration: d, remaining: d });
  },

  setBell: (b) => set({ bellInterval: b }),

  selectTrack: (trackId, source, title) => {
    set({ trackId, source, trackTitle: title });
    // Live crossfade only while a session is actively playing.
    if (get().active && get().running) void loadSource(source, true);
  },

  start: async (userId) => {
    await ensureAudioMode();
    ensureChime();
    sessionUserId = userId;
    lastBellMark = -1;
    const { duration, source } = get();
    endsAt = Date.now() + duration * 1000;
    set({ active: true, running: true, completed: false, remaining: duration });
    keepAwakeOn();
    await loadSource(source, true);
    // Fade in (loadSource created at vol 0 and started playing).
    if (ambient) {
      const token = ++fadeToken;
      const alive = () => fadeToken === token;
      void ramp(ambient, 0, TARGET_VOLUME, FADE_IN_MS, alive);
    }
    startTick();
  },

  pause: async () => {
    if (!get().running) return;
    // Freeze remaining from the wall clock, then stop the clock.
    const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    set({ running: false, remaining });
    clearTick();
    keepAwakeOff();
    if (ambient) {
      const a = ambient;
      const token = ++fadeToken;
      const alive = () => fadeToken === token;
      await ramp(a, TARGET_VOLUME, 0, FADE_OUT_STOP_MS, alive);
      if (alive()) { try { a.pause(); } catch {} }
    }
  },

  resume: async () => {
    if (get().running || get().completed) return;
    // Re-anchor the wall clock to the frozen remaining.
    endsAt = Date.now() + get().remaining * 1000;
    set({ running: true });
    keepAwakeOn();
    if (ambient) {
      const a = ambient;
      const token = ++fadeToken;
      const alive = () => fadeToken === token;
      try { a.play(); } catch {}
      void ramp(a, 0, TARGET_VOLUME, FADE_IN_MS, alive);
    }
    startTick();
  },

  stop: async () => {
    const s = get();
    // How much was actually prayed. If still running, read the live wall clock.
    const remaining = s.running ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : s.remaining;
    const elapsed = s.duration - remaining;
    const shouldLog = s.active && !s.completed && elapsed >= PARTIAL_MIN_SECONDS;

    clearTick();
    keepAwakeOff();
    fadeToken++;
    if (ambient) { const a = ambient; ambient = null; try { a.pause(); } catch {} removePlayer(a); }
    set({ active: false, running: false, completed: false, remaining: s.duration });

    // Credit a partial session so ending early still counts toward the streak.
    if (shouldLog && sessionUserId) {
      const uid = sessionUserId;
      try {
        await logPrayerSession(uid, elapsed, s.trackId);
        await updatePrayerStreak(uid);
        analytics.capture("prayer_session_partial", { duration_seconds: elapsed, track: s.trackId, bell: s.bellInterval });
      } catch {}
    }
  },

  reset: () => {
    keepAwakeOff();
    set({ active: false, running: false, completed: false, remaining: get().duration });
  },
}));

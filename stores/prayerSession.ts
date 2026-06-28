import { create } from "zustand";
import { Audio } from "expo-av";
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

// ── Module-level audio + timer (kept out of React state to avoid re-renders) ──
let ambient: Audio.Sound | null = null;
let chime: Audio.Sound | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let fadeToken = 0;
let lastBellMark = -1;
let audioModeSet = false;
let sessionUserId: string | null = null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number) => Math.max(0, Math.min(1, v));

async function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
  }).catch(() => {});
}

async function ensureChime() {
  if (chime) return;
  try {
    const { sound } = await Audio.Sound.createAsync(CHIME, { volume: 0.8 });
    chime = sound;
  } catch {}
}

async function playChime() {
  await ensureChime();
  if (!chime) return;
  try { await chime.setPositionAsync(0); await chime.playAsync(); } catch {}
}

async function ramp(sound: Audio.Sound, from: number, to: number, ms: number, alive: () => boolean) {
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    if (!alive()) return;
    const v = from + (to - from) * (i / steps);
    try { await sound.setVolumeAsync(clamp(v)); } catch {}
    await sleep(STEP_MS);
  }
}

/** Load + crossfade to a new source. If running, the new track fades in while
 *  the old fades out (0.5s). If idle, just swaps silently. */
async function loadSource(source: AmbientSource, running: boolean) {
  const token = ++fadeToken;
  const alive = () => fadeToken === token;
  const previous = ambient;

  if (!source) {
    if (previous) { await ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive); await previous.unloadAsync().catch(() => {}); }
    if (alive()) ambient = null;
    return;
  }

  const { sound } = await Audio.Sound.createAsync(source, { isLooping: true, volume: 0, shouldPlay: running });
  if (!alive()) { await sound.unloadAsync().catch(() => {}); return; }
  ambient = sound;

  if (running) {
    const fadeIn = ramp(sound, 0, TARGET_VOLUME, CROSSFADE_MS, alive);
    const fadeOut = previous ? ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive).then(() => previous.unloadAsync().catch(() => {})) : Promise.resolve();
    await Promise.all([fadeIn, fadeOut]);
  } else if (previous) {
    await previous.unloadAsync().catch(() => {});
  }
}

function clearTick() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

function maybeBell(elapsed: number, bell: BellInterval) {
  if (bell === "5min") {
    const mark = Math.floor(elapsed / 300);
    if (mark > 0 && mark !== lastBellMark) { lastBellMark = mark; void playChime(); }
  } else if (bell === "10min") {
    const mark = Math.floor(elapsed / 600);
    if (mark > 0 && mark !== lastBellMark) { lastBellMark = mark; void playChime(); }
  }
}

function startTick() {
  clearTick();
  intervalId = setInterval(() => {
    const s = usePrayerSession.getState();
    if (!s.running) return;
    const next = s.remaining - 1;
    if (next <= 0) {
      usePrayerSession.setState({ remaining: 0 });
      void completeSession();
      return;
    }
    usePrayerSession.setState({ remaining: next });
    maybeBell(s.duration - next, s.bellInterval);
  }, 1000);
}

async function completeSession() {
  clearTick();
  const s = usePrayerSession.getState();
  usePrayerSession.setState({ running: false, completed: true });

  if (s.bellInterval !== "off") void playChime();

  // Gentle fade out + stop the music.
  const token = ++fadeToken;
  const alive = () => fadeToken === token;
  if (ambient) {
    const a = ambient;
    await ramp(a, TARGET_VOLUME, 0, FADE_OUT_END_MS, alive);
    if (alive()) { try { await a.pauseAsync(); } catch {} }
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
    void ensureChime();
    sessionUserId = userId;
    lastBellMark = -1;
    const { duration, source } = get();
    set({ active: true, running: true, completed: false, remaining: duration });
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
    set({ running: false });
    clearTick();
    if (ambient) {
      const a = ambient;
      const token = ++fadeToken;
      const alive = () => fadeToken === token;
      await ramp(a, TARGET_VOLUME, 0, FADE_OUT_STOP_MS, alive);
      if (alive()) { try { await a.pauseAsync(); } catch {} }
    }
  },

  resume: async () => {
    if (get().running || get().completed) return;
    set({ running: true });
    if (ambient) {
      const a = ambient;
      const token = ++fadeToken;
      const alive = () => fadeToken === token;
      try { await a.playAsync(); } catch {}
      void ramp(a, 0, TARGET_VOLUME, FADE_IN_MS, alive);
    }
    startTick();
  },

  stop: async () => {
    clearTick();
    fadeToken++;
    if (ambient) { const a = ambient; ambient = null; try { await a.stopAsync(); } catch {} await a.unloadAsync().catch(() => {}); }
    set({ active: false, running: false, completed: false, remaining: get().duration });
  },

  reset: () => {
    set({ active: false, running: false, completed: false, remaining: get().duration });
  },
}));

import { useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { BellInterval } from "@/types";

const CHIME = require("@/assets/audio/chime.mp3");

const TARGET_VOLUME = 0.6;
const CROSSFADE_MS = 500;  // user changes track → 0.5s crossfade
const FADE_IN_MS = 900;    // session starts → ease the track in
const FADE_OUT_END_MS = 1400; // timer ends before the song does → gentle fade out
const FADE_OUT_STOP_MS = 400;  // manual pause → quick fade out
const STEP_MS = 40;

/** A playable ambient source: a bundled asset (require -> number), a remote or
 *  local file URI, or null for silence. `sourceId` is a stable string so the
 *  loader only swaps audio when the real selection changes. */
export type AmbientSource = number | { uri: string } | null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Ramp a sound's volume from -> to over `ms`, bailing out if no longer current. */
async function ramp(sound: Audio.Sound, from: number, to: number, ms: number, alive: () => boolean) {
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    if (!alive()) return;
    const v = from + (to - from) * (i / steps);
    try { await sound.setVolumeAsync(clamp(v)); } catch {}
    await sleep(STEP_MS);
  }
}

export function useAmbientAudio(
  sourceId: string,
  source: AmbientSource,
  bellInterval: BellInterval,
  running: boolean,
  remaining: number,
  totalDuration: number
) {
  const ambientRef = useRef<Audio.Sound | null>(null);
  const chimeRef = useRef<Audio.Sound | null>(null);
  const lastBellAt = useRef<number>(-1);
  const fadeToken = useRef<number>(0); // bumped to cancel any in-flight fade
  const endedRef = useRef<boolean>(false); // true when the timer reached 0

  // ── Audio mode once ────────────────────────────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    }).catch(() => {});
  }, []);

  // ── Chime once ───────────────────────────────────────────────────────────--
  useEffect(() => {
    let sound: Audio.Sound | null = null;
    Audio.Sound.createAsync(CHIME, { volume: 0.8 })
      .then(({ sound: s }) => { sound = s; chimeRef.current = s; })
      .catch(() => {});
    return () => { sound?.unloadAsync().catch(() => {}); };
  }, []);

  // ── Unload ambient on unmount ───────────────────────────────────────────────
  useEffect(() => () => { ambientRef.current?.unloadAsync().catch(() => {}); }, []);

  // ── Swap ambient track with a crossfade when the selection changes ──────────
  useEffect(() => {
    const token = ++fadeToken.current;
    const alive = () => fadeToken.current === token;
    const previous = ambientRef.current;

    async function swap() {
      // Silence: fade the previous track out and stop.
      if (!source) {
        if (previous) {
          await ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive);
          await previous.unloadAsync().catch(() => {});
        }
        if (alive()) ambientRef.current = null;
        return;
      }

      // Create the new track silent; play immediately only if a session is live.
      const { sound } = await Audio.Sound.createAsync(source, {
        isLooping: true,
        volume: 0,
        shouldPlay: running,
      });
      if (!alive()) { await sound.unloadAsync().catch(() => {}); return; }
      ambientRef.current = sound;

      if (running) {
        // Crossfade: new track in while the old one fades out.
        const fadeIn = ramp(sound, 0, TARGET_VOLUME, CROSSFADE_MS, alive);
        const fadeOut = previous
          ? ramp(previous, TARGET_VOLUME, 0, CROSSFADE_MS, alive).then(() => previous.unloadAsync().catch(() => {}))
          : Promise.resolve();
        await Promise.all([fadeIn, fadeOut]);
      } else if (previous) {
        await previous.unloadAsync().catch(() => {});
      }
    }

    swap().catch(() => {});
    // Only re-run when the actual selection changes; `source`/`running` are read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  // ── Fade in on start, fade out on pause/end ─────────────────────────────────
  useEffect(() => {
    const s = ambientRef.current;
    if (!s) return;
    const token = ++fadeToken.current;
    const alive = () => fadeToken.current === token;

    (async () => {
      if (running) {
        try { await s.playAsync(); } catch {}
        await ramp(s, 0, TARGET_VOLUME, FADE_IN_MS, alive);
      } else {
        await ramp(s, TARGET_VOLUME, 0, endedRef.current ? FADE_OUT_END_MS : FADE_OUT_STOP_MS, alive);
        if (alive()) { try { await s.pauseAsync(); } catch {} }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ── Bell logic ─────────────────────────────────────────────────────────────
  const playChime = useCallback(async () => {
    const s = chimeRef.current;
    if (!s) return;
    try {
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch {}
  }, []);

  useEffect(() => {
    if (!running) return;

    if (remaining === 0) {
      endedRef.current = true; // makes the next pause a gentle, longer fade-out
      if (bellInterval !== "off") playChime();
      return;
    }

    const elapsed = totalDuration - remaining;
    if (bellInterval === "5min") {
      const mark = Math.floor(elapsed / 300);
      if (mark > 0 && mark !== lastBellAt.current) { lastBellAt.current = mark; playChime(); }
    } else if (bellInterval === "10min") {
      const mark = Math.floor(elapsed / 600);
      if (mark > 0 && mark !== lastBellAt.current) { lastBellAt.current = mark; playChime(); }
    }
  }, [remaining, running, bellInterval, totalDuration, playChime]);

  // Reset trackers when a session (re)starts.
  useEffect(() => {
    if (running) { lastBellAt.current = -1; endedRef.current = false; }
  }, [running]);
}

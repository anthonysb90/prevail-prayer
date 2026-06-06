import { useEffect, useRef, useCallback } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { AmbientTrack, BellInterval } from "@/types";

const TRACK_MAP: Record<AmbientTrack, any> = {
  "morning-still": require("@/assets/audio/ambient-morning.mp3"),
  "deep-waters":   require("@/assets/audio/ambient-waters.mp3"),
  "holy-ground":   require("@/assets/audio/ambient-holy.mp3"),
  "silence":       null,
};

const CHIME = require("@/assets/audio/chime.mp3");

export function useAmbientAudio(
  track: AmbientTrack,
  bellInterval: BellInterval,
  running: boolean,
  remaining: number,
  totalDuration: number
) {
  const ambientRef = useRef<Audio.Sound | null>(null);
  const chimeRef   = useRef<Audio.Sound | null>(null);
  const lastBellAt = useRef<number>(-1);

  // ── Set audio mode once ────────────────────────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    }).catch(() => {});
  }, []);

  // ── Load chime once ────────────────────────────────────────────────────────
  useEffect(() => {
    let sound: Audio.Sound | null = null;
    Audio.Sound.createAsync(CHIME, { volume: 0.8 })
      .then(({ sound: s }) => { sound = s; chimeRef.current = s; })
      .catch(() => {});
    return () => { sound?.unloadAsync().catch(() => {}); };
  }, []);

  // ── Load/unload ambient track when track selection changes ─────────────────
  useEffect(() => {
    let sound: Audio.Sound | null = null;

    async function load() {
      // Unload previous
      if (ambientRef.current) {
        await ambientRef.current.unloadAsync().catch(() => {});
        ambientRef.current = null;
      }

      const src = TRACK_MAP[track];
      if (!src) return; // "silence" track — no audio

      const { sound: s } = await Audio.Sound.createAsync(
        src,
        { isLooping: true, volume: 0.6, shouldPlay: running }
      );
      sound = s;
      ambientRef.current = s;
    }

    load().catch(() => {});

    return () => {
      sound?.unloadAsync().catch(() => {});
    };
  }, [track]);

  // ── Play / pause ambient when running changes ──────────────────────────────
  useEffect(() => {
    const s = ambientRef.current;
    if (!s) return;
    if (running) {
      s.playAsync().catch(() => {});
    } else {
      s.pauseAsync().catch(() => {});
    }
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

    // At end
    if (remaining === 0) {
      if (bellInterval !== "off") playChime();
      return;
    }

    const elapsed = totalDuration - remaining;

    if (bellInterval === "5min") {
      const mark = Math.floor(elapsed / 300);
      if (mark > 0 && mark !== lastBellAt.current) {
        lastBellAt.current = mark;
        playChime();
      }
    } else if (bellInterval === "10min") {
      const mark = Math.floor(elapsed / 600);
      if (mark > 0 && mark !== lastBellAt.current) {
        lastBellAt.current = mark;
        playChime();
      }
    }
  }, [remaining, running, bellInterval, totalDuration, playChime]);

  // Reset bell tracker when session restarts
  useEffect(() => {
    if (running) lastBellAt.current = -1;
  }, [running]);
}

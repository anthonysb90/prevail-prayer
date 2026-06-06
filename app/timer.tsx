import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { AmbientTrack, BellInterval } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { logPrayerSession, updatePrayerStreak } from "@/lib/streak";
import { useSupportPrompt } from "@/hooks/useSupportPrompt";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";

// ─── Config ───────────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: "5 min",  seconds: 300  },
  { label: "10 min", seconds: 600  },
  { label: "15 min", seconds: 900  },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

const TRACKS: { id: AmbientTrack; label: string }[] = [
  { id: "morning-still", label: "Morning Still"  },
  { id: "deep-waters",   label: "Deep Waters"    },
  { id: "holy-ground",   label: "Holy Grace"     },
  { id: "silence",       label: "Silence"         },
];

const BELL_OPTIONS: { id: BellInterval; label: string }[] = [
  { id: "off",      label: "Off"          },
  { id: "5min",     label: "Every 5 min"  },
  { id: "10min",    label: "Every 10 min" },
  { id: "end-only", label: "At End"       },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

// ─── Timer content ────────────────────────────────────────────────────────────

function TimerContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { checkAndShow } = useSupportPrompt();

  const [duration, setDuration] = useState(300);
  const [track, setTrack] = useState<AmbientTrack>("morning-still");
  const [bellInterval, setBellInterval] = useState<BellInterval>("end-only");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── Ambient audio + chime managed by hook ────────────────────────────────────
  useAmbientAudio(track, bellInterval, running, remaining, duration);

  useEffect(() => { setRemaining(duration); }, [duration]);

  // ── Timer tick ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // ── Session complete ─────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const sessionCount = await logPrayerSession(user.id, elapsed, track);
      await updatePrayerStreak(user.id);
      qc.invalidateQueries({ queryKey: ["prayer_requests", user.id, "counts"] });
      await checkAndShow("session_completed", sessionCount);
    } catch {}
    setSaving(false);
    setCompleted(true);
  };

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setRemaining(duration);
    setCompleted(false);
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    if (startTimeRef.current > 0) {
      Alert.alert(
        "End Session?",
        "Do you want to end your prayer time early?",
        [
          { text: "Keep Praying", style: "cancel", onPress: () => {
            setRunning(true);
          }},
          { text: "End", style: "destructive" },
        ]
      );
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />

      <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => { setRunning(false); router.back(); }}>
          <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: "#FFFFFF", fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }}>
          Prayer Timer
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Timer display */}
      <View style={{ alignItems: "center", paddingVertical: 40 }}>
        {completed ? (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={64} color="#F5B942" />
            <Text style={{ color: "#FFFFFF", fontFamily: "PlayfairDisplay-Bold", fontSize: 28, marginTop: 16 }}>
              Amen.
            </Text>
            <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Regular", fontSize: 14, marginTop: 8 }}>
              {saving ? "Saving session..." : "Session complete"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ color: "#FFFFFF", fontFamily: "PlayfairDisplay-Bold", fontSize: 72, letterSpacing: -2 }}>
              {formatTime(remaining)}
            </Text>
            <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Regular", fontSize: 14, marginTop: 8 }}>
              {running ? "Praying..." : "Ready to pray"}
            </Text>
          </>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        {/* Duration */}
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Duration</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.seconds}
              onPress={() => { if (!running) { setDuration(d.seconds); setRemaining(d.seconds); } }}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: duration === d.seconds ? "#F5B942" : "#1A1A1A", opacity: running ? 0.5 : 1 }}
            >
              <Text style={{ color: duration === d.seconds ? "#FFFFFF" : "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 14 }}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ambient sound */}
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Ambient Sound</Text>
        {TRACKS.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => { if (!running) setTrack(t.id); }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 8, opacity: running ? 0.5 : 1 }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-Regular", fontSize: 15 }}>{t.label}</Text>
            {track === t.id && <Ionicons name="checkmark" size={18} color="#F5B942" />}
          </TouchableOpacity>
        ))}

        {/* Bell interval */}
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Bell Interval</Text>
        {BELL_OPTIONS.map((b) => (
          <TouchableOpacity
            key={b.id}
            onPress={() => { if (!running) setBellInterval(b.id); }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 8, opacity: running ? 0.5 : 1 }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-Regular", fontSize: 15 }}>{b.label}</Text>
            {bellInterval === b.id && <Ionicons name="checkmark" size={18} color="#F5B942" />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 44 }}>
        {completed ? (
          <TouchableOpacity
            onPress={() => { setCompleted(false); setRemaining(duration); }}
            style={{ backgroundColor: "#1A1A1A", borderRadius: 100, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A" }}
          >
            <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-SemiBold", fontSize: 16 }}>Pray Again</Text>
          </TouchableOpacity>
        ) : !running ? (
          <TouchableOpacity
            onPress={handleStart}
            style={{ backgroundColor: "#F5B942", borderRadius: 100, paddingVertical: 18, alignItems: "center" }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-SemiBold", fontSize: 16 }}>Start Prayer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStop}
            style={{ backgroundColor: "#1A1A1A", borderRadius: 100, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A" }}
          >
            <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-SemiBold", fontSize: 16 }}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TimerScreen() {
  return (
    <PremiumGate
      feature="Prayer Timer"
      description="Set a prayer duration, choose peaceful ambient music, and focus on God without distraction."
      icon="timer-outline"
    >
      <TimerContent />
    </PremiumGate>
  );
}

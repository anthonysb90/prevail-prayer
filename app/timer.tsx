import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { AmbientTrack, BellInterval } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { logPrayerSession, updatePrayerStreak } from "@/lib/streak";
import { useSupportPrompt } from "@/hooks/useSupportPrompt";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const DURATIONS = [
  { label: "5 min", seconds: 300 }, { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 }, { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];
const TRACKS: { id: AmbientTrack; label: string }[] = [
  { id: "morning-still", label: "Morning Still" }, { id: "deep-waters", label: "Deep Waters" },
  { id: "holy-ground", label: "Holy Grace" }, { id: "silence", label: "Silence" },
];
const BELL_OPTIONS: { id: BellInterval; label: string }[] = [
  { id: "off", label: "Off" }, { id: "5min", label: "Every 5 min" },
  { id: "10min", label: "Every 10 min" }, { id: "end-only", label: "At End" },
];
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

const label = {
  color: Theme.darkMuted, fontFamily: Theme.font.sansBold as string, fontSize: 12,
  textTransform: "uppercase" as const, letterSpacing: 1.2, marginBottom: 10,
};

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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useAmbientAudio(track, bellInterval, running, remaining, duration);
  useEffect(() => { setRemaining(duration); }, [duration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); setRunning(false); handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

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
  const handleStart = () => { startTimeRef.current = Date.now(); setRemaining(duration); setCompleted(false); setRunning(true); };
  const handleStop = () => {
    setRunning(false);
    if (startTimeRef.current > 0) {
      Alert.alert("End Session?", "Do you want to end your prayer time early?", [
        { text: "Keep Praying", style: "cancel", onPress: () => setRunning(true) },
        { text: "End", style: "destructive" },
      ]);
    }
  };

  const rowStyle = (on: boolean) => ({
    flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const,
    backgroundColor: Theme.darkSurface, borderRadius: Theme.radius.inner,
    borderWidth: 1, borderColor: on ? Theme.accentOnDark : Theme.darkBorder,
    padding: 16, marginBottom: 8, opacity: running ? 0.5 : 1,
  });

  return (
    <View style={{ flex: 1, backgroundColor: Theme.dark }}>
      <StatusBar style="light" />
      <View style={{ paddingTop: 60, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity onPress={() => { setRunning(false); router.back(); }}><Icon name="down" size={24} color={Theme.darkText} /></TouchableOpacity>
        <Text style={{ color: Theme.darkText, fontFamily: Theme.font.serif, fontSize: 20 }}>Prayer Timer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ alignItems: "center", paddingVertical: 36 }}>
        {completed ? (
          <View style={{ alignItems: "center" }}>
            <Icon name="check" size={60} color={Theme.accentOnDark} sw={2} />
            <Text style={{ color: Theme.darkText, fontFamily: Theme.font.serif, fontSize: 30, marginTop: 14 }}>Amen.</Text>
            <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sans, fontSize: 14, marginTop: 8 }}>
              {saving ? "Saving session..." : "Session complete"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ color: Theme.darkText, fontFamily: Theme.font.serif, fontSize: 72, letterSpacing: -1 }}>{formatTime(remaining)}</Text>
            <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sans, fontSize: 14, marginTop: 8 }}>{running ? "Praying..." : "Ready to pray"}</Text>
          </>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32 }}>
        <Text style={label}>Duration</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {DURATIONS.map((d) => {
            const on = duration === d.seconds;
            return (
              <TouchableOpacity
                key={d.seconds}
                onPress={() => { if (!running) { setDuration(d.seconds); setRemaining(d.seconds); } }}
                style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: Theme.radius.pill, backgroundColor: on ? Theme.primary : Theme.darkSurface, opacity: running ? 0.5 : 1 }}
              >
                <Text style={{ color: on ? "#FFFFFF" : Theme.darkMuted, fontFamily: Theme.font.sansMed, fontSize: 14 }}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={label}>Ambient Sound</Text>
        {TRACKS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => { if (!running) setTrack(t.id); }} style={rowStyle(track === t.id)}>
            <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 15 }}>{t.label}</Text>
            {track === t.id && <Icon name="check" size={18} color={Theme.accentOnDark} />}
          </TouchableOpacity>
        ))}

        <Text style={[label, { marginTop: 8 }]}>Bell Interval</Text>
        {BELL_OPTIONS.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => { if (!running) setBellInterval(b.id); }} style={rowStyle(bellInterval === b.id)}>
            <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 15 }}>{b.label}</Text>
            {bellInterval === b.id && <Icon name="check" size={18} color={Theme.accentOnDark} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 22, paddingBottom: 44 }}>
        {completed ? (
          <TouchableOpacity onPress={() => { setCompleted(false); setRemaining(duration); }} style={{ backgroundColor: Theme.darkSurface, borderRadius: Theme.radius.pill, paddingVertical: 17, alignItems: "center", borderWidth: 1, borderColor: Theme.darkBorder }}>
            <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sansSemi, fontSize: 16 }}>Pray Again</Text>
          </TouchableOpacity>
        ) : !running ? (
          <TouchableOpacity onPress={handleStart} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 17, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: Theme.font.sansSemi, fontSize: 16 }}>Start Prayer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStop} style={{ backgroundColor: Theme.darkSurface, borderRadius: Theme.radius.pill, paddingVertical: 17, alignItems: "center", borderWidth: 1, borderColor: Theme.darkBorder }}>
            <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sansSemi, fontSize: 16 }}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TimerScreen() {
  return (
    <PremiumGate feature="Prayer Timer" description="Set a prayer duration, choose peaceful ambient music, and focus on God without distraction." icon="timer-outline">
      <TimerContent />
    </PremiumGate>
  );
}

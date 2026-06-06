import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { AmbientTrack, BellInterval } from "@/types";

const DURATIONS = [
  { label: "5 min", seconds: 300 }, { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 }, { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

const TRACKS: { id: AmbientTrack; label: string }[] = [
  { id: "morning-still", label: "Morning Still" },
  { id: "deep-waters", label: "Deep Waters" },
  { id: "holy-ground", label: "Holy Ground" },
  { id: "silence", label: "Silence" },
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

function TimerContent() {
  const router = useRouter();
  const [duration, setDuration] = useState(300);
  const [track, setTrack] = useState<AmbientTrack>("morning-still");
  const [bellInterval, setBellInterval] = useState<BellInterval>("end-only");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setRemaining(duration); }, [duration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) { setRunning(false); clearInterval(intervalRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />
      <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: "#FFFFFF", fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }}>Prayer Timer</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={{ alignItems: "center", paddingVertical: 40 }}>
        <Text style={{ color: "#FFFFFF", fontFamily: "PlayfairDisplay-Bold", fontSize: 72, letterSpacing: -2 }}>
          {formatTime(remaining)}
        </Text>
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Regular", fontSize: 14, marginTop: 8 }}>
          {running ? "Praying..." : "Ready to pray"}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Duration</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {DURATIONS.map((d) => (
            <TouchableOpacity key={d.seconds} onPress={() => { setDuration(d.seconds); setRemaining(d.seconds); }}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: duration === d.seconds ? "#F5B942" : "#1A1A1A" }}>
              <Text style={{ color: duration === d.seconds ? "#FFFFFF" : "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 14 }}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Ambient Sound</Text>
        {TRACKS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setTrack(t.id)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 8 }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-Regular", fontSize: 15 }}>{t.label}</Text>
            {track === t.id && <Ionicons name="checkmark" size={18} color="#F5B942" />}
          </TouchableOpacity>
        ))}
        <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Bell Interval</Text>
        {BELL_OPTIONS.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => setBellInterval(b.id)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 8 }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-Regular", fontSize: 15 }}>{b.label}</Text>
            {bellInterval === b.id && <Ionicons name="checkmark" size={18} color="#F5B942" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {!running ? (
          <TouchableOpacity onPress={() => { setRemaining(duration); setRunning(true); }}
            style={{ backgroundColor: "#F5B942", borderRadius: 100, paddingVertical: 18, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-SemiBold", fontSize: 16 }}>Start Prayer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setRunning(false)}
            style={{ backgroundColor: "#1A1A1A", borderRadius: 100, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A" }}>
            <Text style={{ color: "#9A9A9A", fontFamily: "DMSans-SemiBold", fontSize: 16 }}>Stop</Text>
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

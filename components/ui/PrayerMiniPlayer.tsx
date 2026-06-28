import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePrayerSession } from "@/stores/prayerSession";
import { useTheme } from "@/hooks/useTheme";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Floating control shown while a prayer session is playing and the user has
 * navigated away from the timer (e.g. praying through their list). Tap to
 * reopen the timer; the play/pause toggles the session without leaving the page.
 */
export function PrayerMiniPlayer() {
  const Theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { active, running, completed, remaining, trackTitle, pause, resume } = usePrayerSession();

  const onTimer = (segments as string[]).includes("timer");
  const inAuth = segments[0] === "(auth)";
  if (!active || completed || onTimer || inAuth) return null;

  return (
    <View style={{ position: "absolute", left: 14, right: 14, bottom: 96 }} pointerEvents="box-none">
      <View
        style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: Theme.primary, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16,
          shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
        }}
      >
        <TouchableOpacity onPress={() => router.push("/timer")} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }} activeOpacity={0.85}>
          <Ionicons name="timer-outline" size={22} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: "#FFFFFF", fontFamily: Theme.font.sansSemi, fontSize: 14 }}>
              {trackTitle === "Silence" ? "Prayer Timer" : trackTitle}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: Theme.font.sans, fontSize: 12, marginTop: 1 }}>
              {fmt(remaining)} remaining{running ? "" : " · paused"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (running ? pause() : resume())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 8 }}
        >
          <Ionicons name={running ? "pause" : "play"} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

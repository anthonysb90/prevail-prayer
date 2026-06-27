import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { BellInterval } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { logPrayerSession, updatePrayerStreak } from "@/lib/streak";
import { useSupportPrompt } from "@/hooks/useSupportPrompt";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { fetchAvailableTracks, BUNDLED_ASSETS, MusicTrackRow } from "@/lib/music";
import { getDownloadedMap, downloadTrack, removeDownload } from "@/lib/musicDownload";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";

const DURATIONS = [
  { label: "5 min", seconds: 300 }, { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 }, { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];
const BELL_OPTIONS: { id: BellInterval; label: string }[] = [
  { id: "off", label: "Off" }, { id: "5min", label: "Every 5 min" },
  { id: "10min", label: "Every 10 min" }, { id: "end-only", label: "At End" },
];

const SILENCE = "silence";

type Guidance = "off" | "acts" | "scripture";
const GUIDANCE_OPTIONS: { id: Guidance; label: string }[] = [
  { id: "off", label: "None" }, { id: "acts", label: "ACTS" }, { id: "scripture", label: "Scripture" },
];
const ACTS = [
  { name: "Adoration", prompt: "Praise God for who He is — His holiness, power, and love. Worship before you ask.", verse: "“Holy, holy, holy, is the LORD of hosts.” — Isaiah 6:3" },
  { name: "Confession", prompt: "Bring your sins honestly before God. Agree with Him, and receive His mercy.", verse: "“If we confess our sins, he is faithful and just to forgive us.” — 1 John 1:9" },
  { name: "Thanksgiving", prompt: "Thank God for His gifts, His answers, and His daily faithfulness to you.", verse: "“In every thing give thanks.” — 1 Thessalonians 5:18" },
  { name: "Supplication", prompt: "Bring your requests and the needs of others before the Lord.", verse: "“Let your requests be made known unto God.” — Philippians 4:6" },
];
const SCRIPTURE_PROMPTS = [
  "“Be still, and know that I am God.” — Psalm 46:10",
  "“The LORD is my shepherd; I shall not want.” — Psalm 23:1",
  "“Cast all your care upon him; for he careth for you.” — 1 Peter 5:7",
  "“Trust in the LORD with all thine heart.” — Proverbs 3:5",
  "“My grace is sufficient for thee.” — 2 Corinthians 12:9",
  "“They that wait upon the LORD shall renew their strength.” — Isaiah 40:31",
];
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

const mkLabel = (Theme: AppTheme) => ({
  color: Theme.darkMuted, fontFamily: Theme.font.sansBold as string, fontSize: 12,
  textTransform: "uppercase" as const, letterSpacing: 1.2, marginBottom: 10,
});

function TimerContent() {
  const Theme = useTheme();
  const label = mkLabel(Theme);
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { checkAndShow } = useSupportPrompt();

  const [duration, setDuration] = useState(300);
  const [bellInterval, setBellInterval] = useState<BellInterval>("end-only");
  const [guidance, setGuidance] = useState<Guidance>("off");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin-managed music
  const [tracks, setTracks] = useState<MusicTrackRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>(SILENCE);
  const [downloads, setDownloads] = useState<Record<string, string>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load the available tracks + any offline downloads once.
  useEffect(() => {
    let active = true;
    fetchAvailableTracks().then((rows) => {
      if (!active) return;
      setTracks(rows);
      if (rows.length > 0) setSelectedId(rows[0].id);
    });
    getDownloadedMap().then((m) => { if (active) setDownloads(m); });
    return () => { active = false; };
  }, []);

  // Resolve the playable source for the current selection.
  const { source, sourceId } = useMemo<{ source: number | { uri: string } | null; sourceId: string }>(() => {
    if (selectedId === SILENCE) return { source: null, sourceId: SILENCE };
    const t = tracks.find((x) => x.id === selectedId);
    if (!t) return { source: null, sourceId: SILENCE };
    if (t.is_bundled && t.bundle_key && BUNDLED_ASSETS[t.bundle_key]) {
      return { source: BUNDLED_ASSETS[t.bundle_key], sourceId: "bundle:" + t.bundle_key };
    }
    const local = downloads[t.id];
    if (local) return { source: { uri: local }, sourceId: "local:" + t.id };
    if (t.file_url) return { source: { uri: t.file_url }, sourceId: "remote:" + t.id };
    return { source: null, sourceId: SILENCE };
  }, [selectedId, tracks, downloads]);

  useAmbientAudio(sourceId, source, bellInterval, running, remaining, duration);
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
      const sessionCount = await logPrayerSession(user.id, elapsed, selectedId);
      await updatePrayerStreak(user.id);
      analytics.capture("prayer_session_completed", { duration_seconds: elapsed, track: selectedId, bell: bellInterval, guidance });
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

  const handleDownload = (t: MusicTrackRow) => {
    if (!t.file_url) return;
    setDownloadingId(t.id);
    downloadTrack(t.id, t.file_url).then((uri) => {
      if (uri) setDownloads((d) => ({ ...d, [t.id]: uri }));
      else Alert.alert("Download failed", "Could not download this track. Please try again.");
      setDownloadingId(null);
    });
  };
  const handleRemoveDownload = (t: MusicTrackRow) => {
    removeDownload(t.id).then(() => setDownloads((d) => { const n = { ...d }; delete n[t.id]; return n; }));
  };

  const rowStyle = (on: boolean) => ({
    flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const,
    backgroundColor: Theme.darkSurface, borderRadius: Theme.radius.inner,
    borderWidth: 1, borderColor: on ? Theme.accentOnDark : Theme.darkBorder,
    padding: 16, marginBottom: 8,
  });

  const elapsed = Math.max(0, duration - remaining);
  const actsIdx = Math.min(ACTS.length - 1, Math.floor((elapsed / Math.max(1, duration)) * ACTS.length));
  const scrIdx = Math.min(SCRIPTURE_PROMPTS.length - 1, Math.floor((elapsed / Math.max(1, duration)) * SCRIPTURE_PROMPTS.length));

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
            {running && guidance === "acts" ? (
              <View style={{ alignItems: "center", marginTop: 16, paddingHorizontal: 30 }}>
                <Text style={{ color: Theme.accentOnDark, fontFamily: Theme.font.sansBold, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {ACTS[actsIdx].name} · {actsIdx + 1} of 4
                </Text>
                <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 10 }}>{ACTS[actsIdx].prompt}</Text>
                <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.serifReg, fontStyle: "italic", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 }}>{ACTS[actsIdx].verse}</Text>
              </View>
            ) : running && guidance === "scripture" ? (
              <View style={{ alignItems: "center", marginTop: 16, paddingHorizontal: 30 }}>
                <Text style={{ color: Theme.accentOnDark, fontFamily: Theme.font.sansBold, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" }}>Meditate</Text>
                <Text style={{ color: Theme.darkText, fontFamily: Theme.font.serifReg, fontStyle: "italic", fontSize: 19, lineHeight: 28, textAlign: "center", marginTop: 12 }}>{SCRIPTURE_PROMPTS[scrIdx]}</Text>
              </View>
            ) : (
              <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sans, fontSize: 14, marginTop: 8 }}>{running ? "Praying..." : "Ready to pray"}</Text>
            )}
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
        {tracks.map((t) => {
          const on = selectedId === t.id;
          const dl = !!downloads[t.id];
          const downloading = downloadingId === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => setSelectedId(t.id)} style={rowStyle(on)}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 15 }}>{t.title}</Text>
                {t.artist ? <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sans, fontSize: 12, marginTop: 2 }}>{t.artist}</Text> : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {!t.is_bundled && (
                  downloading ? (
                    <ActivityIndicator size="small" color={Theme.accentOnDark} />
                  ) : dl ? (
                    <TouchableOpacity onPress={() => handleRemoveDownload(t)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ color: Theme.accentOnDark, fontFamily: Theme.font.sansMed, fontSize: 12 }}>Saved</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => handleDownload(t)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sansMed, fontSize: 12 }}>Download</Text>
                    </TouchableOpacity>
                  )
                )}
                {on && <Icon name="check" size={18} color={Theme.accentOnDark} />}
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={() => setSelectedId(SILENCE)} style={rowStyle(selectedId === SILENCE)}>
          <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 15 }}>Silence</Text>
          {selectedId === SILENCE && <Icon name="check" size={18} color={Theme.accentOnDark} />}
        </TouchableOpacity>

        <Text style={[label, { marginTop: 8 }]}>Bell Interval</Text>
        {BELL_OPTIONS.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => setBellInterval(b.id)} style={rowStyle(bellInterval === b.id)}>
            <Text style={{ color: Theme.darkText, fontFamily: Theme.font.sans, fontSize: 15 }}>{b.label}</Text>
            {bellInterval === b.id && <Icon name="check" size={18} color={Theme.accentOnDark} />}
          </TouchableOpacity>
        ))}

        <Text style={[label, { marginTop: 8 }]}>Guided Prayer</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
          {GUIDANCE_OPTIONS.map((g) => {
            const on = guidance === g.id;
            return (
              <TouchableOpacity key={g.id} onPress={() => setGuidance(g.id)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: Theme.radius.inner, alignItems: "center", backgroundColor: on ? Theme.primary : Theme.darkSurface, borderWidth: 1, borderColor: on ? Theme.accentOnDark : Theme.darkBorder }}>
                <Text style={{ color: on ? "#FFFFFF" : Theme.darkMuted, fontFamily: Theme.font.sansMed, fontSize: 14 }}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ color: Theme.darkMuted, fontFamily: Theme.font.sans, fontSize: 12, lineHeight: 18 }}>
          ACTS guides you through Adoration, Confession, Thanksgiving, and Supplication. Scripture cycles verses to meditate on. Prompts advance automatically as you pray.
        </Text>
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

import { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share, Platform } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";

interface Testimony { id: string; kind: "answered" | "praise"; title: string; text: string; date: string | null; }

const GRADIENTS: [string, string][] = [
  ["#6E66D6", "#4A43B0"], ["#3FB27F", "#2E7D5B"], ["#E8A830", "#C2410C"],
  ["#7C74E6", "#9C27B0"], ["#2196F3", "#4A43B0"], ["#E0556B", "#9C27B0"],
];

function TestimonyCard({ t, index, onShared }: { t: Testimony; index: number; onShared: () => void }) {
  const Theme = useTheme();
  const ref = useRef<View>(null);
  const [g1, g2] = GRADIENTS[index % GRADIENTS.length];
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: "png", quality: 1 });
      analytics.capture("testimony_shared", { kind: t.kind });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share this testimony" });
      else await Share.share({ url: uri });
      onShared();
    } catch {}
    setBusy(false);
  };

  return (
    <View style={{ marginBottom: 18 }}>
      {/* Captured area */}
      <View ref={ref} collapsable={false} style={{ borderRadius: 24, overflow: "hidden", backgroundColor: g1 }}>
        <View style={{ padding: 28, backgroundColor: g1, borderRadius: 24 }}>
          <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: g2, opacity: 0.6 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Icon name={t.kind === "answered" ? "check" : "sparkle"} size={16} color="#FFFFFF" />
            <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, letterSpacing: 1.5, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
              {t.kind === "answered" ? "Answered Prayer" : "Praise Report"}
            </Text>
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 24, color: "#FFFFFF", lineHeight: 31, marginBottom: 12 }}>{t.title}</Text>
          {!!t.text && <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 17, color: "rgba(255,255,255,0.92)", lineHeight: 26 }}>{t.text}</Text>}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Prevail Prayer</Text>
            {t.date && <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{format(new Date(t.date), "MMM d, yyyy")}</Text>}
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={share} disabled={busy} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, paddingVertical: 10 }}>
        <Icon name="share" size={16} color={Theme.primary} />
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: Theme.primary }}>{busy ? "Preparing…" : "Share this testimony"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TestimoniesScreen() {
  const Theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: answered }, { data: praises }] = await Promise.all([
        supabase.from("prayer_requests").select("id,title,answer_notes,answered_at").eq("user_id", user.id).eq("status", "answered").order("answered_at", { ascending: false }),
        supabase.from("prayer_updates").select("id,note,created_at,prayer_requests(title)").eq("user_id", user.id).eq("is_praise", true).order("created_at", { ascending: false }),
      ]);
      const a: Testimony[] = (answered ?? []).map((p: any) => ({ id: "a_" + p.id, kind: "answered", title: p.title, text: p.answer_notes ?? "God answered this prayer.", date: p.answered_at }));
      const pr: Testimony[] = (praises ?? []).map((u: any) => ({ id: "p_" + u.id, kind: "praise", title: u.prayer_requests?.title ?? "A praise report", text: u.note, date: u.created_at }));
      const all = [...a, ...pr].sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));
      setItems(all); setLoading(false);
    })();
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 22, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
        <View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Answered Prayers</Text>
          {items.length > 0 && <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginTop: 2 }}>{items.length} testimon{items.length === 1 ? "y" : "ies"} of God's faithfulness</Text>}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={Theme.primary} /></View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
          <Icon name="sparkle" size={44} color={Theme.textFaint} />
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", marginTop: 14, lineHeight: 22 }}>
            No testimonies yet. Mark a prayer as answered, or add a praise report to a request, and it will appear here to share.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
          {items.map((t, i) => <TestimonyCard key={t.id} t={t} index={i} onShared={() => {}} />)}
        </ScrollView>
      )}
    </View>
  );
}

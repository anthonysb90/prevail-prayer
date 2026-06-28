import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { importFromPhotos, importFromText, ImportItem } from "@/lib/importPrayers";
import { useBulkCreatePrayers } from "@/hooks/usePrayers";
import { isTrialActive, isComped } from "@/lib/trial";
import { analytics } from "@/lib/analytics";

type Tab = "photo" | "text";
type Row = { id: string; title: string; description: string };

const rid = () => Math.random().toString(36).slice(2);

export default function ImportScreen() {
  const Theme = useTheme();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { isPremium, showPaywall } = useSubscriptionStore();
  const bulkCreate = useBulkCreatePrayers();
  // Trial members get fewer scans than paid (trials are free, so they're the cost).
  const isTrial = isTrialActive(profile) && !isComped(profile);
  const cap = isTrial ? 2 : 5;
  // The server prefers RevenueCat; this is the fallback when it can't verify.
  const claim = { premium: isPremium, trial: isTrial };

  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === "text" ? "text" : "photo");
  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [photoLeft, setPhotoLeft] = useState<number | null>(null);

  const fieldLabel = mkFieldLabel(Theme);
  const inputStyle = mkInputStyle(Theme);

  useEffect(() => {
    if (!user) return;
    const period = new Date().toISOString().slice(0, 7);
    supabase
      .from("ai_import_usage")
      .select("photo_scans")
      .eq("user_id", user.id)
      .eq("period", period)
      .maybeSingle()
      .then(({ data }) => setPhotoLeft(Math.max(0, cap - (data?.photo_scans ?? 0))));
  }, [user, cap]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Photo access needed", "Allow photo access in Settings to import from a picture."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 3, quality: 0.45,
    });
    if (!res.canceled) setImages(res.assets.map((a) => a.uri).slice(0, 3));
  };

  const handleExtract = async (mode: Tab) => {
    setBusy(true);
    try {
      const result = mode === "photo" ? await importFromPhotos(images, claim) : await importFromText(text, claim);
      if (result.error) {
        if (result.code === "not_pro") { showPaywall(); return; }
        Alert.alert("Couldn't import", result.error);
        return;
      }
      if (!result.items || result.items.length === 0) {
        Alert.alert("Nothing found", "No prayer requests were found. Try a clearer photo or paste the text.");
        return;
      }
      if (typeof result.remaining?.photo === "number") setPhotoLeft(result.remaining.photo);
      setRows(result.items.map((it: ImportItem) => ({ id: rid(), title: it.title, description: it.description })));
      analytics.capture("prayer_import_extracted", { mode, count: result.items.length });
    } catch (e: any) {
      Alert.alert("Couldn't import", e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddAll = async () => {
    if (!rows) return;
    const items = rows.filter((r) => r.title.trim()).map((r) => ({ title: r.title, description: r.description }));
    if (items.length === 0) { Alert.alert("Nothing to add", "Add at least one request, or go back."); return; }
    try {
      const n = await bulkCreate.mutateAsync(items);
      analytics.capture("prayer_import_saved", { count: n });
      Alert.alert("Added to your list", `${n} prayer ${n === 1 ? "request" : "requests"} added.`);
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.message ?? "Please try again.");
    }
  };

  // ---- Review mode ---------------------------------------------------------
  if (rows) {
    const keep = rows.filter((r) => r.title.trim()).length;
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={headerRow}>
          <TouchableOpacity onPress={() => setRows(null)}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>Review ({keep})</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 22 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, marginBottom: 16, lineHeight: 21 }}>
            Edit anything that looks off, remove rows you don't want, then add them to your list.
          </Text>
          {rows.map((r) => (
            <View key={r.id} style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.inner, borderWidth: 1, borderColor: Theme.cardBorder, padding: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={r.title}
                  onChangeText={(t) => setRows((prev) => prev!.map((x) => (x.id === r.id ? { ...x, title: t } : x)))}
                  placeholder="Name or subject" placeholderTextColor={Theme.textFaint}
                  style={{ flex: 1, fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.text }}
                />
                <TouchableOpacity onPress={() => setRows((prev) => prev!.filter((x) => x.id !== r.id))} style={{ paddingLeft: 10 }}>
                  <Icon name="trash" size={18} color={Theme.textFaint} />
                </TouchableOpacity>
              </View>
              <TextInput
                value={r.description}
                onChangeText={(t) => setRows((prev) => prev!.map((x) => (x.id === r.id ? { ...x, description: t } : x)))}
                placeholder="Details (optional)" placeholderTextColor={Theme.textFaint}
                multiline
                style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, marginTop: 6, lineHeight: 20 }}
              />
            </View>
          ))}
        </ScrollView>
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, paddingBottom: 34, backgroundColor: Theme.bg, borderTopWidth: 1, borderTopColor: Theme.cardBorder }}>
          <TouchableOpacity onPress={handleAddAll} disabled={bulkCreate.isPending || keep === 0} style={{ backgroundColor: keep === 0 ? Theme.cardBorder : Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center" }}>
            {bulkCreate.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{`Add ${keep} to my list`}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---- Input mode ----------------------------------------------------------
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={headerRow}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="x" size={24} color={Theme.text} /></TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>Import Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 22, marginBottom: 18 }}>
        <Pill label="From photo" on={tab === "photo"} onPress={() => setTab("photo")} Theme={Theme} />
        <Pill label="Paste text" on={tab === "text"} onPress={() => setTab("text")} Theme={Theme} />
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 22 }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {tab === "photo" ? (
          !isPremium ? (
            <LockedPhoto Theme={Theme} onUnlock={() => showPaywall()} />
          ) : (
            <View>
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, lineHeight: 21, marginBottom: 4 }}>
                Snap a church prayer list (printed, on a screen, or handwritten). AI reads it and turns each person into a request you can review before saving.
              </Text>
              <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginBottom: 16 }}>
                {photoLeft === null ? " " : `${photoLeft} of ${cap} scans left this month`}
              </Text>

              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, marginHorizontal: -4 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                  {images.map((uri) => (
                    <Image key={uri} source={{ uri }} style={{ width: 96, height: 124, borderRadius: 12, backgroundColor: Theme.card }} />
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity onPress={pickImages} style={dashed(Theme)}>
                <Icon name="image" size={18} color={Theme.primary} />
                <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.primary }}>
                  {images.length > 0 ? "Choose different photos" : "Choose up to 3 photos"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExtract("photo")}
                disabled={busy || images.length === 0 || photoLeft === 0}
                style={{ backgroundColor: images.length === 0 || photoLeft === 0 ? Theme.cardBorder : Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center", marginTop: 18 }}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{photoLeft === 0 ? "No scans left this month" : "Scan list"}</Text>}
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, lineHeight: 21, marginBottom: 16 }}>
              Paste a prayer list as text (from a bulletin, email, or notes). AI structures it into requests you can review. Free, no scan limit.
            </Text>
            <Text style={fieldLabel}>Prayer list text</Text>
            <TextInput
              value={text} onChangeText={setText}
              placeholder={"e.g.\nJohn Smith - recovering from surgery\nThe Johnson family\nSis. Mary - traveling this week"}
              placeholderTextColor={Theme.textFaint}
              multiline
              style={[inputStyle, { minHeight: 200, textAlignVertical: "top" }] as any}
            />
            <TouchableOpacity
              onPress={() => handleExtract("text")}
              disabled={busy || !text.trim()}
              style={{ backgroundColor: !text.trim() ? Theme.cardBorder : Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center", marginTop: 6 }}
            >
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Extract requests</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Pill({ label, on, onPress, Theme }: { label: string; on: boolean; onPress: () => void; Theme: AppTheme }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: Theme.radius.pill, backgroundColor: on ? Theme.primary : Theme.card, borderWidth: 1, borderColor: on ? Theme.primary : Theme.cardBorder }}>
      <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: on ? "#FFFFFF" : Theme.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );
}

function LockedPhoto({ Theme, onUnlock }: { Theme: AppTheme; onUnlock: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 24, paddingHorizontal: 8 }}>
      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Icon name="image" size={28} color={Theme.primary} />
      </View>
      <Text style={{ fontFamily: Theme.font.serif, fontSize: 21, color: Theme.text, textAlign: "center", marginBottom: 10 }}>Photo import is Premium</Text>
      <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 22 }}>
        Snap a church prayer list and let AI add everyone to your list. Pro members get 5 scans a month. Pasting text is always free.
      </Text>
      <TouchableOpacity onPress={onUnlock} style={{ backgroundColor: Theme.primary, borderRadius: 100, paddingVertical: 15, paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: "#FFFFFF" }}>Unlock Premium</Text>
      </TouchableOpacity>
    </View>
  );
}

const headerRow = { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const };
const mkFieldLabel = (Theme: AppTheme) => ({ fontFamily: Theme.font.sansBold as string, fontSize: 12, color: Theme.primary, textTransform: "uppercase" as const, letterSpacing: 1.5, marginBottom: 10 });
const mkInputStyle = (Theme: AppTheme) => ({ backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Theme.font.sans, fontSize: 15, color: Theme.text, marginBottom: 14 } as const);
const dashed = (Theme: AppTheme) => ({ flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, borderWidth: 1, borderColor: Theme.cardBorder, borderStyle: "dashed" as const, borderRadius: Theme.radius.inner, paddingVertical: 18, backgroundColor: Theme.card });

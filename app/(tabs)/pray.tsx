import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, ScrollView, Image, StyleSheet, Modal, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { usePrayerList } from "@/hooks/usePrayers";
import { PrayerListItem } from "@/components/prayer/PrayerListItem";
import { PrayerRequest, Category } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import { useSignedImage } from "@/hooks/useSignedImage";
import { supabase } from "@/lib/supabase";
import { uploadPrayerImage, removePrayerImage } from "@/lib/prayerImages";
import { exportPrayerListPdf } from "@/lib/exportPrayerListPdf";
import { PrivacyNote } from "@/components/ui/PrivacyNote";

export default function PrayScreen() {
    const Theme = useTheme();
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuthStore();
  const { data: bgUrl } = useSignedImage(profile?.prayer_bg_path);
  const { data: prayers = [], isLoading, refetch } = usePrayerList();
  const [filter, setFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgBusy, setBgBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleChangeBackground = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Photo access needed", "Allow photo access in Settings to choose a background."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setBgBusy(true);
    try {
      const oldPath = profile?.prayer_bg_path ?? null;
      const newPath = await uploadPrayerImage(user.id, res.assets[0].uri, "bg-");
      if (!newPath) { Alert.alert("Couldn't set background", "Please try again."); return; }
      const { error } = await supabase.from("profiles").update({ prayer_bg_path: newPath }).eq("id", user.id);
      if (error) { Alert.alert("Error", error.message); return; }
      if (oldPath) await removePrayerImage(oldPath);
      await fetchProfile(user.id);
    } finally {
      setBgBusy(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!user) return;
    setBgBusy(true);
    try {
      const oldPath = profile?.prayer_bg_path ?? null;
      const { error } = await supabase.from("profiles").update({ prayer_bg_path: null }).eq("id", user.id);
      if (error) { Alert.alert("Error", error.message); return; }
      if (oldPath) await removePrayerImage(oldPath);
      await fetchProfile(user.id);
    } finally {
      setBgBusy(false);
    }
  };

  const handleExportPdf = async () => {
    if (!user) return;
    setExporting(true);
    try { await exportPrayerListPdf(user.id, profile?.display_name || "Friend"); }
    catch (e: any) { Alert.alert("Export failed", e.message ?? "Please try again."); }
    setExporting(false);
  };

  const tags = useMemo(() => {
    const set = new Set<string>();
    prayers.forEach((p: PrayerRequest) => p.categories?.forEach((c: Category) => set.add(c.name)));
    return Array.from(set);
  }, [prayers]);

  const filtered = filter
    ? prayers.filter((p: PrayerRequest) => p.categories?.some((c: Category) => c.name === filter))
    : prayers;

  const urgent = filtered.filter((p: PrayerRequest) => p.is_urgent);
  const active = filtered.filter((p: PrayerRequest) => !p.is_urgent && p.status === "active");
  const ongoing = filtered.filter((p: PrayerRequest) => !p.is_urgent && p.status === "ongoing");

  const sections = [
    ...(urgent.length ? [{ title: "Urgent", urgent: true, data: urgent }] : []),
    ...(active.length ? [{ title: "Praying now", urgent: false, data: active }] : []),
    ...(ongoing.length ? [{ title: "Ongoing", urgent: false, data: ongoing }] : []),
  ];

  const inPrayer = urgent.length + active.length + ongoing.length;

  return (
    <View style={{ flex: 1, backgroundColor: Theme.dark }}>
      {bgUrl ? (
        <>
          <Image source={{ uri: bgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(16,16,26,0.80)" }]} />
        </>
      ) : null}
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 22, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text
              style={{
                fontFamily: Theme.font.sansBold,
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: Theme.accentOnDark,
                marginBottom: 4,
              }}
            >
              {inPrayer} in prayer
            </Text>
            <Text style={{ fontFamily: Theme.font.serif, fontSize: 30, color: Theme.darkText }}>
              Prayer List
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.85}
              style={{
                width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Icon name="gear" size={18} color={Theme.darkText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/timer")}
              activeOpacity={0.85}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: Theme.primary,
                borderRadius: Theme.radius.pill,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <Icon name="pray" size={17} color="#FFFFFF" />
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: "#FFFFFF" }}>Pray</Text>
            </TouchableOpacity>
          </View>
        </View>

        <PrivacyNote
          dark
          text="Completely private. No one else can see your prayer list — only you."
          style={{ marginTop: 10 }}
        />

        {/* Filter chips */}
        {tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16, marginHorizontal: -22 }}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 8 }}
          >
            <Chip label="All" on={!filter} onPress={() => setFilter(null)} />
            {tags.map((t) => (
              <Chip key={t} label={t} on={filter === t} onPress={() => setFilter(t)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Theme.accentOnDark} />
        </View>
      ) : sections.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="list" size={44} color={Theme.darkBorder} />
          <Text
            style={{
              fontFamily: Theme.font.sans,
              fontSize: 15,
              color: Theme.darkMuted,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 22,
            }}
          >
            {filter ? "Nothing here under this filter." : "Your prayer list is empty.\nAdd a request to begin."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(item) => (item as PrayerRequest).id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }: any) => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 14, marginBottom: 10 }}>
              {section.urgent && <Icon name="flame" size={14} color={Theme.urgent} />}
              <Text
                style={{
                  fontFamily: Theme.font.sansBold,
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: section.urgent ? Theme.urgent : Theme.darkMuted,
                }}
              >
                {section.title}
              </Text>
              <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.darkBorder }}>
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <PrayerListItem prayer={item as PrayerRequest} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable onPress={closeMenu} style={{ flex: 1, backgroundColor: "rgba(16,16,26,0.55)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: Theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 40, paddingHorizontal: 18 }}
          >
            <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: Theme.cardBorder, marginBottom: 14 }} />
            <SheetOption
              Theme={Theme}
              icon="image"
              title={profile?.prayer_bg_path ? "Change background" : "Set background photo"}
              subtitle="Personalize your prayer list"
              busy={bgBusy}
              onPress={() => { closeMenu(); handleChangeBackground(); }}
            />
            {profile?.prayer_bg_path ? (
              <SheetOption
                Theme={Theme}
                icon="x"
                title="Remove background"
                subtitle="Back to the default look"
                danger
                onPress={() => { closeMenu(); handleRemoveBackground(); }}
              />
            ) : null}
            <SheetOption
              Theme={Theme}
              icon="download"
              title="Export as PDF"
              subtitle="A beautiful copy of your whole list"
              busy={exporting}
              onPress={() => { closeMenu(); handleExportPdf(); }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetOption({
  Theme, icon, title, subtitle, onPress, busy, danger,
}: { Theme: AppTheme; icon: string; title: string; subtitle: string; onPress: () => void; busy?: boolean; danger?: boolean }) {
  const tint = danger ? Theme.urgent : Theme.primary;
  return (
    <TouchableOpacity onPress={onPress} disabled={busy} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: danger ? "rgba(224,85,107,0.12)" : Theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
        {busy ? <ActivityIndicator color={tint} /> : <Icon name={icon} size={22} color={tint} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: danger ? Theme.urgent : Theme.text }}>{title}</Text>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textMuted, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Icon name="right" size={18} color={Theme.textFaint} />
    </TouchableOpacity>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
    const Theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: on ? Theme.darkText : "rgba(255,255,255,0.06)",
        borderRadius: Theme.radius.pill,
        paddingVertical: 7,
        paddingHorizontal: 14,
      }}
    >
      <Text
        style={{
          fontFamily: Theme.font.sansSemi,
          fontSize: 13,
          color: on ? Theme.dark : Theme.darkMuted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

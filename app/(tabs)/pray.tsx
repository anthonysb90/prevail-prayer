import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePrayerList } from "@/hooks/usePrayers";
import { PrayerListItem } from "@/components/prayer/PrayerListItem";
import { PrayerRequest, Category } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function PrayScreen() {
  const router = useRouter();
  const { data: prayers = [], isLoading, refetch } = usePrayerList();
  const [filter, setFilter] = useState<string | null>(null);

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
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
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

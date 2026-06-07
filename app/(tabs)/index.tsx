import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import {
  useActivePrayers, useOngoingPrayers,
  useAnsweredPrayers, usePrayerCounts,
} from "@/hooks/usePrayers";
import { useLatestDevotion, useDevotions } from "@/hooks/useDevotions";
import { PrayerCard } from "@/components/prayer/PrayerCard";
import { PrayerRequest } from "@/types";
import { FEATURED_VERSES } from "@/constants/verses";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { VerseBlock, SectionHeader, RoundButton } from "@/components/ui/atoms";

function getRandomVerse() {
  return FEATURED_VERSES[Math.floor(Math.random() * FEATURED_VERSES.length)];
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Devotion hero ────────────────────────────────────────────────────────────
function DevotionHero() {
  const router = useRouter();
  const { data: devotion, isLoading } = useLatestDevotion();
  const { isPremium, showPaywall } = useSubscriptionStore();

  if (isLoading || !devotion) return null;

  const onPress = () => {
    if (!isPremium) return showPaywall();
    router.push(`/devotions/${devotion.id}`);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginHorizontal: 22, marginBottom: 16 }}>
      <View
        style={{
          borderRadius: Theme.radius.card,
          overflow: "hidden",
          backgroundColor: Theme.card,
          borderWidth: 1,
          borderColor: Theme.cardBorder,
          ...Theme.shadow,
        }}
      >
        {/* Image / colored band */}
        <View style={{ height: 132, backgroundColor: "#C7C4E2" }}>
          {devotion.image_url ? (
            <Image source={{ uri: devotion.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Icon name="cross" size={34} color="rgba(255,255,255,0.85)" />
            </View>
          )}
          {/* Badge */}
          <View
            style={{
              position: "absolute", top: 14, left: 14,
              flexDirection: "row", alignItems: "center", gap: 5,
              backgroundColor: "rgba(20,18,32,0.55)",
              borderRadius: Theme.radius.pill, paddingHorizontal: 11, paddingVertical: 5,
            }}
          >
            <Icon name="sparkle" size={13} color="#FFFFFF" />
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 12, color: "#FFFFFF" }}>
              Today's Devotion
            </Text>
          </View>
          {!isPremium && (
            <View
              style={{
                position: "absolute", top: 14, right: 14,
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: "rgba(20,18,32,0.55)",
                borderRadius: Theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5,
              }}
            >
              <Icon name="lock" size={12} color="#FFFFFF" />
              <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: "#FFFFFF" }}>Premium</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={{ padding: 18 }}>
          {devotion.scripture_reference && (
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary, marginBottom: 6 }}>
              {devotion.scripture_reference}
            </Text>
          )}
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 21, color: Theme.text, lineHeight: 27 }} numberOfLines={2}>
            {devotion.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: isPremium ? Theme.primary : Theme.textMuted }}>
              {isPremium ? "Read · 5 min" : "Subscribe to read"}
            </Text>
            <Icon name={isPremium ? "right" : "lock"} size={15} color={isPremium ? Theme.primary : Theme.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [verse, setVerse] = useState(getRandomVerse);

  const { data: active = [],   refetch: refetchActive  } = useActivePrayers();
  const { data: ongoing = [],  refetch: refetchOngoing } = useOngoingPrayers();
  const { data: answered = [], refetch: refetchAnswered } = useAnsweredPrayers();
  const { data: counts,        refetch: refetchCounts  } = usePrayerCounts();
  const { refetch: refetchDevotion } = useLatestDevotion();
  const { data: devotions = [] } = useDevotions();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setVerse(getRandomVerse());
    await Promise.all([refetchActive(), refetchOngoing(), refetchAnswered(), refetchCounts(), refetchDevotion()]);
    setRefreshing(false);
  }, []);

  const rollVerse = () => setVerse(getRandomVerse());
  const name = (profile?.display_name ?? "Friend").split(" ")[0];
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Theme.bg }}
      contentContainerStyle={{ paddingBottom: 36 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 62, paddingHorizontal: 22, paddingBottom: 18,
          flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textFaint, marginBottom: 3 }}>
            {today}
          </Text>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 28, color: Theme.text }}>
            {getGreeting()}, {name}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <RoundButton name="bell" onPress={() => router.push("/notifications")} dot />
          <RoundButton name="gear" onPress={() => router.push("/settings")} />
        </View>
      </View>

      {/* Devotion */}
      <DevotionHero />
      {devotions.length > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/devotions")}
          style={{ paddingHorizontal: 22, marginBottom: 18, alignItems: "flex-end" }}
        >
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}>
            See all devotions →
          </Text>
        </TouchableOpacity>
      )}

      {/* Verse */}
      <View style={{ marginHorizontal: 22, marginBottom: 26 }}>
        <VerseBlock text={`"${verse.verse_text}"`} reference={verse.reference} onRefresh={rollVerse} />
      </View>

      {/* Prayer Requests */}
      <View style={{ marginHorizontal: 22, marginBottom: 24 }}>
        <SectionHeader
          title="Prayer Requests"
          count={counts?.active ?? active.length}
          onAll={() => router.push("/(tabs)/pray")}
          onAdd={() => router.push("/prayer/new")}
        />
        {active.length === 0 ? (
          <Empty text="No active requests yet." action="Add your first prayer" onPress={() => router.push("/prayer/new")} />
        ) : (
          active.slice(0, 3).map((p: PrayerRequest) => <PrayerCard key={p.id} prayer={p} />)
        )}
      </View>

      {/* Ongoing Needs */}
      {ongoing.length > 0 && (
        <View style={{ marginHorizontal: 22, marginBottom: 24 }}>
          <SectionHeader title="Ongoing Needs" count={ongoing.length} onAll={() => router.push("/(tabs)/pray")} />
          {ongoing.slice(0, 2).map((p: PrayerRequest) => <PrayerCard key={p.id} prayer={p} compact />)}
        </View>
      )}

      {/* Answered Prayers */}
      {answered.length > 0 && (
        <View style={{ marginHorizontal: 22 }}>
          <SectionHeader title="Answered Prayers" count={answered.length} onAll={() => router.push("/(tabs)/pray")} />
          {answered.slice(0, 2).map((p: PrayerRequest) => <PrayerCard key={p.id} prayer={p} compact />)}
        </View>
      )}
    </ScrollView>
  );
}

function Empty({ text, action, onPress }: { text: string; action?: string; onPress?: () => void }) {
  return (
    <View
      style={{
        backgroundColor: Theme.card, borderRadius: Theme.radius.card,
        borderWidth: 1, borderColor: Theme.cardBorder,
        padding: 22, alignItems: "center", ...Theme.shadow,
      }}
    >
      <Icon name="plus" size={26} color={Theme.textFaint} />
      <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, textAlign: "center", marginTop: 10 }}>
        {text}
      </Text>
      {action && onPress && (
        <TouchableOpacity onPress={onPress} style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: Theme.primary }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

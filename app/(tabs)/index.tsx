import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import {
  useActivePrayers, useOngoingPrayers,
  useAnsweredPrayers, usePrayerCounts,
} from "@/hooks/usePrayers";
import { useLatestDevotion } from "@/hooks/useDevotions";
import { PrayerCard } from "@/components/prayer/PrayerCard";
import { FEATURED_VERSES } from "@/constants/verses";

function getRandomVerse() {
  return FEATURED_VERSES[Math.floor(Math.random() * FEATURED_VERSES.length)];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Devotion Card ────────────────────────────────────────────────────────────

function DevotionCard() {
  const router = useRouter();
  const { data: devotion, isLoading } = useLatestDevotion();
  const { isPremium, showPaywall } = useSubscriptionStore();

  if (isLoading || !devotion) return null;

  const handlePress = () => {
    if (!isPremium) {
      showPaywall();
      return;
    }
    router.push(`/devotions/${devotion.id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.88}
      style={{ marginHorizontal: 24, marginBottom: 24 }}
    >
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#1A1A1A",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {/* Hero image */}
        {devotion.image_url ? (
          <Image
            source={{ uri: devotion.image_url }}
            style={{ width: "100%", height: 160 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              height: 100,
              backgroundColor: "#2A2A2A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="book-outline" size={36} color="#F5B942" />
          </View>
        )}

        {/* Overlay gradient feel */}
        <View style={{ padding: 18 }}>
          {/* Label row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5B942",
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="sunny-outline" size={12} color="#FFFFFF" />
              <Text
                style={{
                  fontFamily: "DMSans-SemiBold",
                  fontSize: 11,
                  color: "#FFFFFF",
                  marginLeft: 5,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Today's Devotion
              </Text>
            </View>

            {!isPremium && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="lock-closed" size={11} color="#9A9A9A" />
                <Text
                  style={{
                    fontFamily: "DMSans-Medium",
                    fontSize: 11,
                    color: "#9A9A9A",
                    marginLeft: 4,
                  }}
                >
                  Premium
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: "PlayfairDisplay-Bold",
              fontSize: 20,
              color: "#FFFFFF",
              lineHeight: 27,
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {devotion.title}
          </Text>

          {/* Scripture reference */}
          {devotion.scripture_reference && (
            <Text
              style={{
                fontFamily: "DMSans-Regular",
                fontSize: 13,
                color: "#9A9A9A",
                marginBottom: 14,
                fontStyle: "italic",
              }}
            >
              {devotion.scripture_reference}
            </Text>
          )}

          {/* CTA */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans-SemiBold",
                fontSize: 14,
                color: isPremium ? "#F5B942" : "#9A9A9A",
              }}
            >
              {isPremium ? "Read now" : "Subscribe to read"}
            </Text>
            <Ionicons
              name={isPremium ? "arrow-forward-circle" : "lock-closed-outline"}
              size={20}
              color={isPremium ? "#F5B942" : "#9A9A9A"}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [verse, setVerse] = useState(getRandomVerse);

  const { data: active = [],   refetch: refetchActive  } = useActivePrayers();
  const { data: ongoing = [],  refetch: refetchOngoing } = useOngoingPrayers();
  const { data: answered = [], refetch: refetchAnswered } = useAnsweredPrayers();
  const { data: counts,        refetch: refetchCounts  } = usePrayerCounts();
  const {                      refetch: refetchDevotion } = useLatestDevotion();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setVerse(getRandomVerse());
    await Promise.all([
      refetchActive(), refetchOngoing(),
      refetchAnswered(), refetchCounts(), refetchDevotion(),
    ]);
    setRefreshing(false);
  }, []);

  const name = profile?.display_name ?? "Friend";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F0E8" }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5B942" />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 64,
          paddingHorizontal: 24,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 14, color: "#8A8A8A" }}>
            {getGreeting()},
          </Text>
          <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28, color: "#1A1A1A" }}>
            {name}.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "#FFFFFF",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "#FFFFFF",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Devotion card */}
      <DevotionCard />

      {/* Daily Verse */}
      <View
        style={{
          marginHorizontal: 24, marginBottom: 20,
          backgroundColor: "#F5B942", borderRadius: 20, padding: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans-SemiBold", fontSize: 10, color: "rgba(255,255,255,0.8)",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
          }}
        >
          Today's Verse
        </Text>
        <Text
          style={{
            fontFamily: "PlayfairDisplay-SemiBold", fontSize: 15,
            color: "#FFFFFF", lineHeight: 24, fontStyle: "italic", marginBottom: 10,
          }}
        >
          "{verse.verse_text}"
        </Text>
        <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
          — {verse.reference}
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 24, marginBottom: 28 }}>
        {[
          { label: "Active",   value: String(counts?.active ?? 0),   icon: "time-outline" },
          { label: "Answered", value: String(counts?.answered ?? 0), icon: "checkmark-circle-outline" },
          { label: "Streak",   value: (profile?.prayer_streak ?? 0) + "d", icon: "flame-outline" },
        ].map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16,
              padding: 14, alignItems: "center",
            }}
          >
            <Ionicons name={stat.icon as any} size={20} color="#F5B942" />
            <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20, color: "#1A1A1A", marginTop: 4 }}>
              {stat.value}
            </Text>
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#8A8A8A", marginTop: 2 }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Active Requests */}
      <SectionHeader title="Active Requests" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
        {active.length === 0 ? (
          <EmptyCard
            text="No active requests yet."
            action="Add your first prayer"
            onPress={() => router.push("/prayer/new")}
          />
        ) : (
          <>
            {active.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)}
            {active.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/pray")} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5B942" }}>
                  +{active.length - 3} more
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Ongoing Needs */}
      <SectionHeader title="Ongoing Needs" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
        {ongoing.length === 0 ? (
          <EmptyCard
            text="No ongoing requests."
            action="Add an ongoing need"
            onPress={() => router.push("/prayer/new")}
          />
        ) : (
          <>
            {ongoing.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)}
            {ongoing.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/pray")} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5B942" }}>
                  +{ongoing.length - 3} more
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Answered Prayers */}
      <SectionHeader title="Answered Prayers" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View style={{ marginHorizontal: 24 }}>
        {answered.length === 0 ? (
          <EmptyCard text="No answered prayers recorded yet." />
        ) : (
          answered.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 24, marginBottom: 10,
      }}
    >
      <Text style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 18, color: "#1A1A1A" }}>
        {title}
      </Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5B942" }}>
            See all
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyCard({ text, action, onPress }: { text: string; action?: string; onPress?: () => void }) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, alignItems: "center",
      }}
    >
      <Ionicons name="add-circle-outline" size={28} color="#EDE5D8" />
      <Text
        style={{
          fontFamily: "DMSans-Regular", fontSize: 13, color: "#8A8A8A",
          textAlign: "center", marginTop: 8,
        }}
      >
        {text}
      </Text>
      {action && onPress && (
        <TouchableOpacity onPress={onPress} style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 13, color: "#F5B942" }}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

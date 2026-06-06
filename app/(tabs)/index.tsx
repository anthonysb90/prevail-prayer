import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useActivePrayers, useOngoingPrayers, useAnsweredPrayers, usePrayerCounts } from "@/hooks/usePrayers";
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

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [verse, setVerse] = useState(getRandomVerse);

  const { data: active = [], refetch: refetchActive, isLoading: loadingActive } = useActivePrayers();
  const { data: ongoing = [], refetch: refetchOngoing } = useOngoingPrayers();
  const { data: answered = [], refetch: refetchAnswered } = useAnsweredPrayers();
  const { data: counts, refetch: refetchCounts } = usePrayerCounts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setVerse(getRandomVerse());
    await Promise.all([refetchActive(), refetchOngoing(), refetchAnswered(), refetchCounts()]);
    setRefreshing(false);
  }, []);

  const name = profile?.display_name ?? "Friend";

  return (
    <ScrollView
      className="flex-1 bg-cream-100"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5B942" />
      }
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-charcoal-400 text-sm" style={{ fontFamily: "DMSans-Regular" }}>
            {getGreeting()},
          </Text>
          <Text className="text-charcoal-900" style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }}>
            {name}.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="settings-outline" size={22} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Daily Verse */}
      <View className="mx-6 mb-6 bg-amber-400 rounded-2xl p-5">
        <Text className="text-white text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: "DMSans-SemiBold" }}>
          Today's Verse
        </Text>
        <Text className="text-white text-base leading-6 mb-3" style={{ fontFamily: "DMSans-Regular" }}>
          "{verse.verse_text}"
        </Text>
        <Text className="text-white text-sm" style={{ fontFamily: "DMSans-SemiBold" }}>
          — {verse.reference}
        </Text>
      </View>

      {/* Stats */}
      <View className="mx-6 mb-6 flex-row gap-3">
        {[
          { label: "Active", value: String(counts?.active ?? 0), icon: "time-outline" },
          { label: "Answered", value: String(counts?.answered ?? 0), icon: "checkmark-circle-outline" },
          { label: "Streak", value: (profile?.prayer_streak ?? 0) + "d", icon: "flame-outline" },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 bg-white rounded-2xl p-4 items-center">
            <Ionicons name={stat.icon as any} size={20} color="#F5B942" />
            <Text className="text-charcoal-900 text-xl mt-1" style={{ fontFamily: "PlayfairDisplay-Bold" }}>
              {stat.value}
            </Text>
            <Text className="text-charcoal-400 text-xs mt-0.5" style={{ fontFamily: "DMSans-Regular" }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Active Requests */}
      <SectionHeader title="Active Requests" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View className="mx-6 mb-6">
        {active.length === 0 ? (
          <EmptyCard text="No active requests yet." action="Add your first prayer" onPress={() => router.push("/prayer/new")} />
        ) : (
          <>
            {active.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)}
            {active.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/pray")} className="items-center py-2">
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
      <View className="mx-6 mb-6">
        {ongoing.length === 0 ? (
          <EmptyCard text="No ongoing requests." action="Add an ongoing need" onPress={() => router.push("/prayer/new")} />
        ) : (
          <>
            {ongoing.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)}
            {ongoing.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/pray")} className="items-center py-2">
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
      <View className="mx-6">
        {answered.length === 0 ? (
          <EmptyCard text="No answered prayers recorded yet." action={undefined} onPress={undefined} />
        ) : (
          answered.slice(0, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View className="mx-6 mb-3 flex-row items-center justify-between">
      <Text className="text-charcoal-900" style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 18 }}>
        {title}
      </Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text className="text-amber-500 text-sm" style={{ fontFamily: "DMSans-Medium" }}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyCard({ text, action, onPress }: { text: string; action?: string; onPress?: () => void }) {
  return (
    <View className="bg-white rounded-2xl p-5 items-center">
      <Ionicons name="add-circle-outline" size={28} color="#EDE5D8" />
      <Text className="text-charcoal-400 text-sm mt-2 text-center" style={{ fontFamily: "DMSans-Regular" }}>
        {text}
      </Text>
      {action && onPress && (
        <TouchableOpacity onPress={onPress} className="mt-3">
          <Text className="text-amber-500 text-sm" style={{ fontFamily: "DMSans-SemiBold" }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

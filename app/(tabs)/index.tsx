import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setVerse(getRandomVerse());
    setTimeout(() => setRefreshing(false), 600);
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
          <Text
            className="text-charcoal-400 text-sm"
            style={{ fontFamily: "DMSans-Regular" }}
          >
            {getGreeting()},
          </Text>
          <Text
            className="text-charcoal-900"
            style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }}
          >
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

      {/* Daily Verse Card */}
      <View className="mx-6 mb-6 bg-amber-400 rounded-2xl p-5">
        <Text
          className="text-white text-xs mb-2 uppercase tracking-widest"
          style={{ fontFamily: "DMSans-SemiBold" }}
        >
          Today's Verse
        </Text>
        <Text
          className="text-white text-base leading-6 mb-3"
          style={{ fontFamily: "DMSans-Regular" }}
        >
          "{verse.verse_text}"
        </Text>
        <Text
          className="text-white text-sm"
          style={{ fontFamily: "DMSans-SemiBold" }}
        >
          — {verse.reference}
        </Text>
      </View>

      {/* Stats Row */}
      <View className="mx-6 mb-6 flex-row gap-3">
        {[
          { label: "Active", value: "0", icon: "time-outline" },
          { label: "Answered", value: "0", icon: "checkmark-circle-outline" },
          { label: "Streak", value: `${profile?.prayer_streak ?? 0}d`, icon: "flame-outline" },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 bg-white rounded-2xl p-4 items-center">
            <Ionicons name={stat.icon as any} size={20} color="#F5B942" />
            <Text
              className="text-charcoal-900 text-xl mt-1"
              style={{ fontFamily: "PlayfairDisplay-Bold" }}
            >
              {stat.value}
            </Text>
            <Text
              className="text-charcoal-400 text-xs mt-0.5"
              style={{ fontFamily: "DMSans-Regular" }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Section: Active Requests */}
      <SectionHeader
        title="Active Requests"
        onSeeAll={() => router.push("/(tabs)/pray")}
      />
      <View className="mx-6 bg-white rounded-2xl p-5 mb-6">
        <EmptyState
          icon="add-circle-outline"
          text="No active requests yet."
          action="Add your first prayer"
          onPress={() => router.push("/prayer/new")}
        />
      </View>

      {/* Section: Ongoing Needs */}
      <SectionHeader title="Ongoing Needs" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View className="mx-6 bg-white rounded-2xl p-5 mb-6">
        <EmptyState
          icon="refresh-outline"
          text="No ongoing requests."
          action="Add an ongoing need"
          onPress={() => router.push("/prayer/new")}
        />
      </View>

      {/* Section: Answered Prayers */}
      <SectionHeader title="Answered Prayers" onSeeAll={() => router.push("/(tabs)/pray")} />
      <View className="mx-6 bg-white rounded-2xl p-5">
        <EmptyState
          icon="heart-outline"
          text="No answered prayers recorded yet."
          action={undefined}
          onPress={undefined}
        />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View className="mx-6 mb-3 flex-row items-center justify-between">
      <Text
        className="text-charcoal-900"
        style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 18 }}
      >
        {title}
      </Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text className="text-amber-500 text-sm" style={{ fontFamily: "DMSans-Medium" }}>
          See all
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({
  icon, text, action, onPress,
}: {
  icon: string; text: string; action?: string; onPress?: () => void;
}) {
  return (
    <View className="items-center py-4">
      <Ionicons name={icon as any} size={32} color="#EDE5D8" />
      <Text
        className="text-charcoal-400 text-sm mt-2 text-center"
        style={{ fontFamily: "DMSans-Regular" }}
      >
        {text}
      </Text>
      {action && onPress && (
        <TouchableOpacity onPress={onPress} className="mt-3">
          <Text className="text-amber-500 text-sm" style={{ fontFamily: "DMSans-SemiBold" }}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

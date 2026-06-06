import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useDevotions } from "@/hooks/useDevotions";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { Devotion } from "@/types";

function DevotionRow({ devotion }: { devotion: Devotion }) {
  const router = useRouter();
  const { isPremium, showPaywall } = useSubscriptionStore();

  const handlePress = () => {
    if (!isPremium) { showPaywall(); return; }
    router.push(`/devotions/${devotion.id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        marginBottom: 12,
        overflow: "hidden",
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Thumbnail */}
      {devotion.image_url ? (
        <Image
          source={{ uri: devotion.image_url }}
          style={{ width: 90, height: 90 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 90, height: 90,
            backgroundColor: "#2A2A2A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="book-outline" size={28} color="#F5B942" />
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1, padding: 14, justifyContent: "center" }}>
        {devotion.published_at && (
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#8A8A8A", marginBottom: 4 }}>
            {format(new Date(devotion.published_at), "MMMM d, yyyy")}
          </Text>
        )}
        <Text
          style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 16, color: "#1A1A1A", lineHeight: 22, marginBottom: 4 }}
          numberOfLines={2}
        >
          {devotion.title}
        </Text>
        {devotion.scripture_reference && (
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#F5B942", fontStyle: "italic" }}>
            {devotion.scripture_reference}
          </Text>
        )}
      </View>

      <View style={{ justifyContent: "center", paddingRight: 14 }}>
        <Ionicons
          name={isPremium ? "chevron-forward" : "lock-closed-outline"}
          size={18}
          color="#8A8A8A"
        />
      </View>
    </TouchableOpacity>
  );
}

export default function DevotionsArchiveScreen() {
  const router = useRouter();
  const { data: devotions = [], isLoading, refetch } = useDevotions();

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <View style={{
        paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26, color: "#1A1A1A" }}>
            Devotions
          </Text>
          {devotions.length > 0 && (
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#8A8A8A", marginTop: 2 }}>
              {devotions.length} {devotions.length === 1 ? "devotion" : "devotions"}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#F5B942" />
        </View>
      ) : devotions.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="book-outline" size={48} color="#EDE5D8" />
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#8A8A8A", textAlign: "center", marginTop: 16, lineHeight: 22 }}>
            No devotions published yet.{"
"}Check back soon.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#F5B942" />
          }
        >
          {devotions.map((d) => (
            <DevotionRow key={d.id} devotion={d} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

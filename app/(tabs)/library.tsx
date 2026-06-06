import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { VERSE_TOPICS } from "@/constants/verses";
import { ScriptureTopic } from "@/types";

const TOPIC_ICONS: Record<ScriptureTopic, string> = {
  Prayer: "chatbubble-ellipses-outline", Faith: "shield-outline",
  Healing: "medkit-outline", Peace: "leaf-outline", Guidance: "compass-outline",
  Trust: "heart-outline", Praise: "musical-notes-outline", Warfare: "flash-outline",
  Salvation: "star-outline", Hope: "sunny-outline",
};

const TOPIC_COLORS: Record<ScriptureTopic, { bg: string; icon: string }> = {
  Prayer:   { bg: "#E3F2FD", icon: "#2196F3" },
  Faith:    { bg: "#FFF8E1", icon: "#FFC107" },
  Healing:  { bg: "#FCE4EC", icon: "#E91E63" },
  Peace:    { bg: "#E8F5E9", icon: "#4CAF50" },
  Guidance: { bg: "#E0F7FA", icon: "#00BCD4" },
  Trust:    { bg: "#FCE4EC", icon: "#E91E63" },
  Praise:   { bg: "#FFF8E1", icon: "#FF9800" },
  Warfare:  { bg: "#EDE7F6", icon: "#673AB7" },
  Salvation:{ bg: "#FBE9E7", icon: "#FF5722" },
  Hope:     { bg: "#FFF9C4", icon: "#F9A825" },
};

function LibraryContent() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream-100">
      <View className="px-6 pt-16 pb-6">
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }} className="text-charcoal-900">
          Scripture Library
        </Text>
        <Text className="text-charcoal-400 text-sm mt-1" style={{ fontFamily: "DMSans-Regular" }}>
          KJV — tap a topic to read
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {VERSE_TOPICS.map((topic) => {
            const colors = TOPIC_COLORS[topic];
            return (
              <TouchableOpacity
                key={topic}
                onPress={() => router.push(`/library/${encodeURIComponent(topic)}`)}
                style={{
                  width: "47%",
                  backgroundColor: colors.bg,
                  borderRadius: 18,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 13,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    alignItems: "center", justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Ionicons name={TOPIC_ICONS[topic] as any} size={24} color={colors.icon} />
                </View>
                <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 18, color: "#1A1A1A" }}>
                  {topic}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#4A4A4A" }}>
                    View verses
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#4A4A4A" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function LibraryScreen() {
  return (
    <PremiumGate
      feature="Scripture Library"
      description="60+ KJV verses organized across 10 topics. Save your favorites and let Scripture fuel your prayer life."
      icon="library-outline"
    >
      <LibraryContent />
    </PremiumGate>
  );
}

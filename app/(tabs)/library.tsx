import { View, Text, ScrollView, TouchableOpacity } from "react-native";
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

const TOPIC_COLORS: Record<ScriptureTopic, string> = {
  Prayer: "#E3F2FD", Faith: "#FFF8E1", Healing: "#FCE4EC", Peace: "#E8F5E9",
  Guidance: "#E0F7FA", Trust: "#FCE4EC", Praise: "#FFF8E1", Warfare: "#EDE7F6",
  Salvation: "#FBE9E7", Hope: "#FFF9C4",
};

function LibraryContent() {
  return (
    <View className="flex-1 bg-cream-100">
      <View className="px-6 pt-16 pb-6">
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }} className="text-charcoal-900">
          Scripture Library
        </Text>
        <Text className="text-charcoal-400 text-sm mt-1" style={{ fontFamily: "DMSans-Regular" }}>
          KJV — organized by topic
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {VERSE_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={{ width: "47%", backgroundColor: TOPIC_COLORS[topic], borderRadius: 16, padding: 20 }}
              activeOpacity={0.8}
            >
              <Ionicons name={TOPIC_ICONS[topic] as any} size={28} color="#1A1A1A" />
              <Text style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 18, color: "#1A1A1A", marginTop: 12 }}>
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function LibraryScreen() {
  return (
    <PremiumGate
      feature="Scripture Library"
      description="60+ KJV verses organized across 10 topics including Prayer, Healing, Warfare, Peace, and more. Save your favorites."
      icon="library-outline"
    >
      <LibraryContent />
    </PremiumGate>
  );
}

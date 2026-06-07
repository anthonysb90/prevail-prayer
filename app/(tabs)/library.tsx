import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { VERSE_TOPICS } from "@/constants/verses";
import { ScriptureTopic } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const TOPIC_ICONS: Record<ScriptureTopic, string> = {
  Prayer: "pray", Faith: "cross", Healing: "heart", Peace: "moon", Guidance: "search",
  Trust: "check", Praise: "note", Warfare: "flame", Salvation: "sun", Hope: "sparkle",
};

function LibraryContent() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 62, paddingBottom: 18 }}>
        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textFaint, marginBottom: 3 }}>
          Verses for prayer · KJV
        </Text>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 28, color: Theme.text }}>Scripture</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {VERSE_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic}
              onPress={() => router.push(`/library/${encodeURIComponent(topic)}`)}
              activeOpacity={0.85}
              style={{
                width: "47.5%",
                backgroundColor: Theme.card,
                borderRadius: Theme.radius.card,
                borderWidth: 1,
                borderColor: Theme.cardBorder,
                padding: 18,
                ...Theme.shadow,
              }}
            >
              <View
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: Theme.primarySoft,
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Icon name={TOPIC_ICONS[topic]} size={22} color={Theme.primary} />
              </View>
              <Text style={{ fontFamily: Theme.font.serif, fontSize: 19, color: Theme.text }}>{topic}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.primary }}>View verses</Text>
                <Icon name="right" size={13} color={Theme.primary} />
              </View>
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
      description="60+ KJV verses organized across 10 topics. Save your favorites and let Scripture fuel your prayer life."
      icon="library-outline"
    >
      <LibraryContent />
    </PremiumGate>
  );
}

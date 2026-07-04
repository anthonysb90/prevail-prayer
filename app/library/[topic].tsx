import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVersesByTopic, useFavoriteVerseIds, useToggleFavorite } from "@/hooks/useScripture";
import { ScriptureVerse } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";

export default function TopicScreen() {
  const Theme = useTheme();
  const router = useRouter();
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const { data: verses = [], isLoading } = useVersesByTopic(topic);
  const { data: favoriteIds = [] } = useFavoriteVerseIds();
  const toggleFavorite = useToggleFavorite();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 64,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Theme.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Scripture
          </Text>
          <Text
            style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}
          >
            {topic}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text
            style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint, marginBottom: 20 }}
          >
            {verses.length} {verses.length === 1 ? "verse" : "verses"} · King James Version
          </Text>

          {verses.map((verse: ScriptureVerse) => {
            const isFavorited = favoriteIds.includes(verse.id);
            return (
              <VerseCard
                key={verse.id}
                Theme={Theme}
                verse={verse}
                isFavorited={isFavorited}
                onToggleFavorite={() =>
                  toggleFavorite.mutate({ verseId: verse.id, isFavorited })
                }
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function VerseCard({
  Theme,
  verse,
  isFavorited,
  onToggleFavorite,
}: {
  Theme: AppTheme;
  verse: ScriptureVerse;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: Theme.card,
        borderRadius: 18,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Reference + favorite */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: Theme.primarySoft,
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}
          >
            {verse.reference}
          </Text>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={22}
            color={isFavorited ? Theme.urgent : Theme.textFaint}
          />
        </TouchableOpacity>
      </View>

      {/* Verse text */}
      <Text
        style={{
          fontFamily: Theme.font.serifMed,
          fontSize: 16,
          color: Theme.text,
          lineHeight: 26,
          fontStyle: "italic",
        }}
      >
        "{verse.verse_text}"
      </Text>
    </View>
  );
}

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVersesByTopic, useFavoriteVerseIds, useToggleFavorite } from "@/hooks/useScripture";
import { ScriptureVerse } from "@/types";

export default function TopicScreen() {
  const router = useRouter();
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const { data: verses = [], isLoading } = useVersesByTopic(topic);
  const { data: favoriteIds = [] } = useFavoriteVerseIds();
  const toggleFavorite = useToggleFavorite();

  return (
    <View style={{ flex: 1, backgroundColor: "#F1EFF9" }}>
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color="#5A5666" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 12, color: "#9794A4", textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Scripture
          </Text>
          <Text
            style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 26, color: "#1D1B26" }}
          >
            {topic}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#5B53C6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text
            style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 13, color: "#9794A4", marginBottom: 20 }}
          >
            {verses.length} {verses.length === 1 ? "verse" : "verses"} · King James Version
          </Text>

          {verses.map((verse: ScriptureVerse) => {
            const isFavorited = favoriteIds.includes(verse.id);
            return (
              <VerseCard
                key={verse.id}
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
  verse,
  isFavorited,
  onToggleFavorite,
}: {
  verse: ScriptureVerse;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 20,
        marginBottom: 12,
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
            backgroundColor: "#ECEAFA",
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 13, color: "#5B53C6" }}
          >
            {verse.reference}
          </Text>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} style={{ padding: 4 }}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={22}
            color={isFavorited ? "#E0556B" : "#9794A4"}
          />
        </TouchableOpacity>
      </View>

      {/* Verse text */}
      <Text
        style={{
          fontFamily: "Newsreader_500Medium",
          fontSize: 16,
          color: "#1D1B26",
          lineHeight: 26,
          fontStyle: "italic",
        }}
      >
        "{verse.verse_text}"
      </Text>
    </View>
  );
}

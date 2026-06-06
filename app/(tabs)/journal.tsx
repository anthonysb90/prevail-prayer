import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { JournalCard } from "@/components/journal/JournalCard";
import { useJournalEntries } from "@/hooks/useJournal";

function JournalContent() {
  const router = useRouter();
  const { data: entries = [], isLoading, refetch } = useJournalEntries();

  return (
    <View className="flex-1 bg-cream-100">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }} className="text-charcoal-900">
          Prayer Journal
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/journal/new")}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "#F5B942",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F5B942" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="book-outline" size={48} color="#EDE5D8" />
          <Text className="text-charcoal-400 text-base text-center mt-4 leading-6" style={{ fontFamily: "DMSans-Regular" }}>
            Your journal is empty.{"\n"}Start writing about what God is doing.
          </Text>
          <TouchableOpacity
            className="mt-6 bg-amber-400 rounded-full py-3 px-7"
            onPress={() => router.push("/journal/new")}
          >
            <Text className="text-white" style={{ fontFamily: "DMSans-SemiBold" }}>
              Write First Entry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#F5B942" />
          }
        >
          <Text className="text-charcoal-400 text-sm mb-4" style={{ fontFamily: "DMSans-Regular" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Text>
          {entries.map((entry) => (
            <JournalCard key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function JournalScreen() {
  return (
    <PremiumGate
      feature="Prayer Journal"
      description="Record your reflections, answered prayers, and what God is speaking to you. Linked directly to your prayer requests."
      icon="book-outline"
    >
      <JournalContent />
    </PremiumGate>
  );
}

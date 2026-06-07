import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { JournalCard } from "@/components/journal/JournalCard";
import { useJournalEntries } from "@/hooks/useJournal";
import { JournalEntry } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

function JournalContent() {
  const router = useRouter();
  const { data: entries = [], isLoading, refetch } = useJournalEntries();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View
        style={{
          paddingHorizontal: 22, paddingTop: 62, paddingBottom: 8,
          flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textFaint, marginBottom: 3 }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Text>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 28, color: Theme.text }}>Journal</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/journal/new")}
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: Theme.primary,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="plus" size={20} color="#FFFFFF" sw={2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Theme.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="journal" size={44} color={Theme.textFaint} />
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", marginTop: 14, lineHeight: 22 }}>
            Your journal is empty.{"\n"}Start writing about what God is doing.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/journal/new")}
            style={{ marginTop: 22, backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 13, paddingHorizontal: 26 }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: Theme.font.sansSemi, fontSize: 15 }}>Write First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Theme.primary} />}
        >
          <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 16, color: Theme.textMuted, marginBottom: 16, lineHeight: 23 }}>
            A quiet place to reflect, record, and remember what He's doing.
          </Text>
          {entries.map((entry: JournalEntry) => (
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

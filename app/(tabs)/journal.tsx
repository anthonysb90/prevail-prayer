import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumGate } from "@/components/ui/PremiumGate";

function JournalContent() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-cream-100">
      <View className="px-6 pt-16 pb-4">
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28 }} className="text-charcoal-900">
          Prayer Journal
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="book-outline" size={48} color="#EDE5D8" />
        <Text className="text-charcoal-400 text-base text-center mt-4" style={{ fontFamily: "DMSans-Regular" }}>
          Your journal entries will appear here.
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

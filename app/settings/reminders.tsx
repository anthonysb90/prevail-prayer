import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumGate } from "@/components/ui/PremiumGate";

function RemindersContent() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream-100">
      <View className="px-6 pt-16 pb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26 }}
          className="text-charcoal-900"
        >
          General Reminders
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text
          className="text-charcoal-400 text-sm mb-6"
          style={{ fontFamily: "DMSans-Regular" }}
        >
          Set daily or weekly reminders to pray. These are not tied to a
          specific request — just a nudge to open your prayer list.
        </Text>

        <View className="bg-white rounded-2xl p-5 items-center">
          <Ionicons name="notifications-outline" size={32} color="#EDE5D8" />
          <Text
            className="text-charcoal-400 text-sm text-center mt-3"
            style={{ fontFamily: "DMSans-Regular" }}
          >
            No general reminders yet.
          </Text>
          <TouchableOpacity className="mt-4 bg-amber-400 rounded-full py-3 px-6">
            <Text
              className="text-white text-sm"
              style={{ fontFamily: "DMSans-SemiBold" }}
            >
              Add Reminder
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function RemindersScreen() {
  return (
    <PremiumGate
      feature="Prayer Reminders"
      description="Schedule daily or weekly reminders to pray. Never miss your time with God because life got busy."
      icon="notifications-outline"
    >
      <RemindersContent />
    </PremiumGate>
  );
}

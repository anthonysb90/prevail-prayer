import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const rows = [
    { label: "General Reminders", icon: "notifications-outline", onPress: () => router.push("/settings/reminders") },
    { label: "Account",           icon: "person-outline",        onPress: () => router.push("/settings/account") },
    { label: "Theme",             icon: "moon-outline",          onPress: () => {} },
    { label: "Rate the App",      icon: "star-outline",          onPress: () => {} },
    { label: "Share with a Friend", icon: "share-social-outline",onPress: () => {} },
    { label: "Support Prevail Prayer", icon: "heart-outline",    onPress: () => {} },
  ];

  return (
    <View className="flex-1 bg-cream-100">
      <View className="px-6 pt-16 pb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26 }} className="text-charcoal-900">
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        {/* Profile card */}
        <View className="bg-white rounded-2xl p-5 mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-amber-400 items-center justify-center mr-4">
            <Text className="text-white text-xl">🙏</Text>
          </View>
          <View>
            <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }} className="text-charcoal-900">
              {profile?.display_name ?? "Friend"}
            </Text>
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 13 }} className="text-charcoal-400">
              Prevail Prayer
            </Text>
          </View>
        </View>

        {/* Settings rows */}
        <View className="bg-white rounded-2xl overflow-hidden mb-6">
          {rows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              className={`flex-row items-center px-5 py-4 ${i < rows.length - 1 ? "border-b border-cream-200" : ""}`}
              onPress={row.onPress}
            >
              <Ionicons name={row.icon as any} size={20} color="#8A8A8A" />
              <Text style={{ fontFamily: "DMSans-Regular", fontSize: 15 }} className="text-charcoal-900 ml-4 flex-1">
                {row.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="bg-white rounded-2xl py-4 items-center"
          onPress={signOut}
        >
          <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 15 }} className="text-urgent">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

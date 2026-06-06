import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function PersonalizeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream-100 px-6 pt-16 pb-10 items-center justify-center">
      <View className="w-20 h-20 rounded-3xl bg-amber-400 items-center justify-center mb-8">
        <Text className="text-4xl">🙏</Text>
      </View>

      <Text
        className="text-charcoal-900 text-center mb-4"
        style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 32 }}
      >
        You're all set.
      </Text>

      <Text
        className="text-charcoal-600 text-center text-base leading-6 mb-12"
        style={{ fontFamily: "DMSans-Regular" }}
      >
        Prevail Prayer is ready for you. Add your first prayer request and begin.
      </Text>

      <TouchableOpacity
        className="bg-amber-400 rounded-full py-4 px-10 items-center"
        onPress={() => router.replace("/(tabs)")}
        activeOpacity={0.85}
      >
        <Text className="text-white text-base" style={{ fontFamily: "DMSans-SemiBold" }}>
          Start Praying
        </Text>
      </TouchableOpacity>
    </View>
  );
}

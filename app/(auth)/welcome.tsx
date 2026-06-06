import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream-100">
      <StatusBar style="dark" />

      {/* Top section */}
      <View className="flex-1 items-center justify-center px-8 pt-20">
        {/* App icon placeholder */}
        <View className="w-24 h-24 rounded-3xl bg-amber-400 items-center justify-center mb-8 shadow-lg">
          <Text className="text-white text-4xl">🙏</Text>
        </View>

        <Text
          className="text-charcoal-900 text-center mb-3"
          style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 40 }}
        >
          Prevail Prayer
        </Text>

        <Text
          className="text-charcoal-600 text-center text-base leading-6 px-4"
          style={{ fontFamily: "DMSans-Regular" }}
        >
          "The effectual fervent prayer of a righteous man availeth much."
        </Text>

        <Text
          className="text-charcoal-400 text-sm mt-2"
          style={{ fontFamily: "DMSans-Medium" }}
        >
          — James 5:16
        </Text>
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-12 gap-3">
        <TouchableOpacity
          className="bg-amber-400 rounded-full py-4 items-center"
          onPress={() => router.push("/(auth)/signup")}
          activeOpacity={0.85}
        >
          <Text
            className="text-white text-base"
            style={{ fontFamily: "DMSans-SemiBold" }}
          >
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-cream-200 rounded-full py-4 items-center bg-white"
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text
            className="text-charcoal-900 text-base"
            style={{ fontFamily: "DMSans-SemiBold" }}
          >
            I Already Have an Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

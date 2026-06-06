import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

const OPTIONS = [
  "I feel far from God",
  "I'm struggling but hanging on",
  "I'm hungry for more of Him",
  "I feel grateful and hopeful",
];

export default function WalkScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  return (
    <View className="flex-1 bg-cream-100 px-6 pt-16 pb-10">
      <TouchableOpacity onPress={() => router.push("/(tabs)")} className="self-end mb-8">
        <Text className="text-charcoal-400 text-base" style={{ fontFamily: "DMSans-Medium" }}>
          Skip
        </Text>
      </TouchableOpacity>

      <Text
        className="text-charcoal-900 text-center mb-3"
        style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 32 }}
      >
        How's your walk with the Lord these days?
      </Text>

      <Text
        className="text-charcoal-400 text-center text-sm mb-10"
        style={{ fontFamily: "DMSans-Regular" }}
      >
        Your answers help us personalize Prevail Prayer for you.
      </Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {OPTIONS.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                className={`rounded-2xl px-5 py-4 flex-row items-center justify-between border ${
                  isSelected
                    ? "bg-charcoal-900 border-charcoal-900"
                    : "bg-white border-cream-200"
                }`}
                onPress={() => toggle(option)}
                activeOpacity={0.85}
              >
                <Text
                  className={`text-base flex-1 ${isSelected ? "text-white" : "text-charcoal-900"}`}
                  style={{ fontFamily: "DMSans-Regular" }}
                >
                  {option}
                </Text>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected
                      ? "border-amber-400 bg-amber-400"
                      : "border-cream-200"
                  }`}
                >
                  {isSelected && (
                    <Text className="text-white text-xs">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        className="bg-amber-400 rounded-full py-4 items-center mt-6"
        onPress={() => router.push("/(onboarding)/personalize")}
        activeOpacity={0.85}
      >
        <Text className="text-white text-base" style={{ fontFamily: "DMSans-SemiBold" }}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

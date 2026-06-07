import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

const OPTIONS = [
  "I feel far from God",
  "I'm struggling but hanging on",
  "I'm hungry for more of Him",
  "I feel grateful and hopeful",
];

export default function WalkScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleContinue = async () => {
    if (!user) { router.push("/(onboarding)/personalize"); return; }
    setSaving(true);

    if (selected.length > 0) {
      await supabase
        .from("profiles")
        .update({ walk_with_god: selected })
        .eq("id", user.id);

      await fetchProfile(user.id);
    }

    setSaving(false);
    router.push("/(onboarding)/personalize");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F1EFF9", paddingHorizontal: 24 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)")}
        style={{ alignSelf: "flex-end", paddingTop: 64, paddingBottom: 24 }}
      >
        <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 15, color: "#9794A4" }}>
          Skip
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: "Newsreader_600SemiBold",
          fontSize: 30,
          color: "#1D1B26",
          textAlign: "center",
          lineHeight: 38,
          marginBottom: 10,
        }}
      >
        How's your walk with the Lord these days?
      </Text>

      <Text
        style={{
          fontFamily: "HankenGrotesk_400Regular",
          fontSize: 14,
          color: "#9794A4",
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 20,
        }}
      >
        Your answers help us personalize Prevail Prayer for you.
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ gap: 10 }}>
          {OPTIONS.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={{
                  borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18,
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: isSelected ? "#1D1B26" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isSelected ? "#1D1B26" : "#E7E5EF",
                }}
                onPress={() => toggle(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    fontFamily: "HankenGrotesk_400Regular",
                    fontSize: 15,
                    flex: 1,
                    color: isSelected ? "#FFFFFF" : "#1D1B26",
                    lineHeight: 21,
                  }}
                >
                  {option}
                </Text>
                <View
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? "#5B53C6" : "#E7E5EF",
                    backgroundColor: isSelected ? "#5B53C6" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                  }}
                >
                  {isSelected && (
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "HankenGrotesk_600SemiBold" }}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{
          backgroundColor: "#5B53C6",
          borderRadius: 100, paddingVertical: 18,
          alignItems: "center", marginBottom: 44, marginTop: 16,
          opacity: saving ? 0.7 : 1,
        }}
        onPress={handleContinue}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

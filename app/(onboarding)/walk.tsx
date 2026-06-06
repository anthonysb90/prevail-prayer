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
    <View style={{ flex: 1, backgroundColor: "#F5F0E8", paddingHorizontal: 24 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)")}
        style={{ alignSelf: "flex-end", paddingTop: 64, paddingBottom: 24 }}
      >
        <Text style={{ fontFamily: "DMSans-Medium", fontSize: 15, color: "#8A8A8A" }}>
          Skip
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: "PlayfairDisplay-Bold",
          fontSize: 30,
          color: "#1A1A1A",
          textAlign: "center",
          lineHeight: 38,
          marginBottom: 10,
        }}
      >
        How's your walk with the Lord these days?
      </Text>

      <Text
        style={{
          fontFamily: "DMSans-Regular",
          fontSize: 14,
          color: "#8A8A8A",
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
                  backgroundColor: isSelected ? "#1A1A1A" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isSelected ? "#1A1A1A" : "#EDE5D8",
                }}
                onPress={() => toggle(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    fontFamily: "DMSans-Regular",
                    fontSize: 15,
                    flex: 1,
                    color: isSelected ? "#FFFFFF" : "#1A1A1A",
                    lineHeight: 21,
                  }}
                >
                  {option}
                </Text>
                <View
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? "#F5B942" : "#EDE5D8",
                    backgroundColor: isSelected ? "#F5B942" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                  }}
                >
                  {isSelected && (
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "DMSans-SemiBold" }}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{
          backgroundColor: "#F5B942",
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
          <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16, color: "#FFFFFF" }}>
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

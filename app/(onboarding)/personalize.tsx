import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

// Format a digit string as (XXX) XXX-XXXX as the user types
function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PersonalizeScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();

  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;
  const zipValid = zip.length === 0 || zip.length === 5;
  const canContinue = phoneValid && zipValid;

  const save = async (skip: boolean) => {
    if (!user) {
      router.replace("/(tabs)");
      return;
    }
    setSaving(true);

    if (!skip) {
      const updates: Record<string, string | null> = {};
      if (phoneDigits.length === 10) updates.phone = phoneDigits;
      if (zip.length === 5) updates.zip_code = zip;

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", user.id);
        await fetchProfile(user.id);
      }
    }

    setSaving(false);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-10">
          <View className="w-16 h-16 rounded-3xl bg-amber-400 items-center justify-center mb-8">
            <Text className="text-3xl">🙏</Text>
          </View>

          <Text
            className="text-charcoal-900 mb-3"
            style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 30 }}
          >
            One last thing.
          </Text>

          <Text
            className="text-charcoal-600 text-base leading-6 mb-10"
            style={{ fontFamily: "DMSans-Regular" }}
          >
            This helps your church stay connected with you. It's optional, and you can always add it later in Settings.
          </Text>

          {/* Phone */}
          <View className="mb-5">
            <Text
              className="text-charcoal-600 text-sm mb-2"
              style={{ fontFamily: "DMSans-Medium" }}
            >
              Phone Number
            </Text>
            <TextInput
              className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900"
              style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
              placeholder="(555) 123-4567"
              placeholderTextColor="#8A8A8A"
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              keyboardType="phone-pad"
            />
            {!phoneValid && (
              <Text className="text-red-500 text-xs mt-1" style={{ fontFamily: "DMSans-Regular" }}>
                Enter a complete 10-digit phone number.
              </Text>
            )}
          </View>

          {/* Zip */}
          <View className="mb-10">
            <Text
              className="text-charcoal-600 text-sm mb-2"
              style={{ fontFamily: "DMSans-Medium" }}
            >
              Zip Code
            </Text>
            <TextInput
              className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900"
              style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
              placeholder="30223"
              placeholderTextColor="#8A8A8A"
              value={zip}
              onChangeText={(t) => setZip(t.replace(/\D/g, "").slice(0, 5))}
              keyboardType="number-pad"
              maxLength={5}
            />
            {!zipValid && (
              <Text className="text-red-500 text-xs mt-1" style={{ fontFamily: "DMSans-Regular" }}>
                Enter a 5-digit zip code.
              </Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-amber-400 rounded-full py-4 items-center"
            style={{ opacity: canContinue && !saving ? 1 : 0.6 }}
            onPress={() => save(false)}
            disabled={!canContinue || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base" style={{ fontFamily: "DMSans-SemiBold" }}>
                Start Praying
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => save(true)}
            disabled={saving}
          >
            <Text
              className="text-charcoal-600 text-sm"
              style={{ fontFamily: "DMSans-Regular" }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

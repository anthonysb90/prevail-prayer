import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const input = {
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
} as const;
const lbl = { fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 };

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
    if (!user) return router.replace("/(tabs)");
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <Icon name="cross" size={30} color="#FFFFFF" />
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 30, color: Theme.text, marginBottom: 12 }}>One last thing.</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, lineHeight: 24, marginBottom: 32 }}>
            This helps your church stay connected with you. It's optional, and you can always add it later in Settings.
          </Text>

          <View style={{ marginBottom: 18 }}>
            <Text style={lbl}>Phone Number</Text>
            <TextInput style={input as any} placeholder="(555) 123-4567" placeholderTextColor={Theme.textFaint} value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" />
            {!phoneValid && <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.urgent, marginTop: 4 }}>Enter a complete 10-digit phone number.</Text>}
          </View>
          <View style={{ marginBottom: 32 }}>
            <Text style={lbl}>Zip Code</Text>
            <TextInput style={input as any} placeholder="30223" placeholderTextColor={Theme.textFaint} value={zip} onChangeText={(t) => setZip(t.replace(/\D/g, "").slice(0, 5))} keyboardType="number-pad" maxLength={5} />
            {!zipValid && <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.urgent, marginTop: 4 }}>Enter a 5-digit zip code.</Text>}
          </View>

          <TouchableOpacity onPress={() => save(false)} disabled={!canContinue || saving} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center", opacity: canContinue && !saving ? 1 : 0.6 }}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Start Praying</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => save(true)} disabled={saving} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { BrandMark } from "@/components/ui/BrandMark";

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PersonalizeScreen() {
    const Theme = useTheme();
  const input = {
    backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
  } as const;
  const lbl = { fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 };
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuthStore();
  const nameParts = (profile?.display_name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, setFirst] = useState(nameParts[0] ?? "");
  const [last, setLast] = useState(nameParts.slice(1).join(" "));
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;
  const zipValid = zip.length === 0 || zip.length === 5;
  const nameValid = first.trim().length > 0 && last.trim().length > 0;
  const canContinue = nameValid && phoneValid && zipValid;

  const save = async (skip: boolean) => {
    if (!user) return router.replace("/(tabs)");
    setSaving(true);
    const fullName = `${first.trim()} ${last.trim()}`.replace(/\s+/g, " ").trim();
    const updates: Record<string, string | null> = {};
    if (fullName) updates.display_name = fullName;
    if (!skip) {
      if (phoneDigits.length === 10) updates.phone = phoneDigits;
      if (zip.length === 5) updates.zip_code = zip;
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", user.id);
      await fetchProfile(user.id);
    }
    setSaving(false);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <BrandMark size={30} />
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 30, color: Theme.text, marginBottom: 12 }}>One last thing.</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, lineHeight: 24, marginBottom: 32 }}>
            Tell us your name so we can personalize your experience. Phone and zip are optional and help us stay connected with you.
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={lbl}>First Name</Text>
              <TextInput style={input as any} placeholder="First" placeholderTextColor={Theme.textFaint} value={first} onChangeText={setFirst} autoCapitalize="words" autoComplete="name-given" textContentType="givenName" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={lbl}>Last Name</Text>
              <TextInput style={input as any} placeholder="Last" placeholderTextColor={Theme.textFaint} value={last} onChangeText={setLast} autoCapitalize="words" autoComplete="name-family" textContentType="familyName" />
            </View>
          </View>

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
          <TouchableOpacity onPress={() => save(true)} disabled={saving || !nameValid} style={{ marginTop: 18, alignItems: "center", opacity: nameValid && !saving ? 1 : 0.5 }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted }}>Skip contact info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

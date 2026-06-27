import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";
import { formatBirthdayInput, parseBirthday } from "@/lib/birthday";

const KEY = "prevail.birthday_prompt_dismissed";
const DAYS_BEFORE_PROMPT = 1;

/**
 * Asks for a birthday when the profile doesn't have one yet — covers users who
 * skipped the optional signup field and Apple/Google sign-ins (which never see it).
 * Shown once; dismissal is remembered locally.
 */
export function BirthdayPromptModal() {
  const Theme = useTheme();
  const { user, profile, fetchProfile } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user || !profile) return;
      if (profile.birthday) return; // already have it
      if (!profile.created_at) return;
      const days = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
      if (days < DAYS_BEFORE_PROMPT) return;
      const dismissed = await AsyncStorage.getItem(KEY);
      if (dismissed) return;
      setVisible(true);
      analytics.capture("birthday_prompt_shown");
    })();
  }, [user, profile]);

  const dismiss = async () => {
    setVisible(false);
    try { await AsyncStorage.setItem(KEY, "1"); } catch {}
  };

  const save = async () => {
    const parsed = parseBirthday(birthday);
    if (parsed.error) { Alert.alert("Birthday", parsed.error); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ birthday: parsed.iso }).eq("id", user.id);
    setSaving(false);
    if (error) { Alert.alert("Error", error.message); return; }
    await fetchProfile(user.id);
    analytics.capture("birthday_prompt_saved");
    await dismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <View style={{ backgroundColor: Theme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44 }}>
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center" }}>
              <Icon name="cake" size={26} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.text, textAlign: "center", marginBottom: 8 }}>When's your birthday?</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 22 }}>
            Add your birthday so we can celebrate it with you each year. Optional, and never shared.
          </Text>
          <TextInput
            value={birthday}
            onChangeText={(t) => setBirthday(formatBirthdayInput(t))}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={Theme.textFaint}
            style={{ backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text, marginBottom: 16 }}
          />
          <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{saving ? "Saving..." : "Save my birthday"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} style={{ alignItems: "center", paddingTop: 14 }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textFaint }}>Not now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

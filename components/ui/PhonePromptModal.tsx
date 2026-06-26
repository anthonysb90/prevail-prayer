import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";

const KEY = "prevail.phone_prompt_dismissed";
const DAYS_BEFORE_PROMPT = 5;

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function PhonePromptModal() {
  const Theme = useTheme();
  const { user, profile, fetchProfile } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user || !profile) return;
      if (profile.phone) return;                 // already have it
      if (!profile.created_at) return;
      const days = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
      if (days < DAYS_BEFORE_PROMPT) return;
      const dismissed = await AsyncStorage.getItem(KEY);
      if (dismissed) return;
      setVisible(true);
      analytics.capture("phone_prompt_shown");
    })();
  }, [user, profile]);

  const dismiss = async () => {
    setVisible(false);
    try { await AsyncStorage.setItem(KEY, "1"); } catch {}
  };

  const save = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { Alert.alert("Phone number", "Please enter a valid 10-digit number."); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ phone: digits }).eq("id", user.id);
    setSaving(false);
    if (error) { Alert.alert("Error", error.message); return; }
    await fetchProfile(user.id);
    analytics.capture("phone_prompt_saved");
    await dismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View style={{ backgroundColor: Theme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44 }}>
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={26} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.text, textAlign: "center", marginBottom: 8 }}>Stay connected</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 22 }}>
            Add your phone number so your church can reach you for prayer, encouragement, and important updates. Optional, and never shared.
          </Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            keyboardType="phone-pad"
            placeholder="(555) 123-4567"
            placeholderTextColor={Theme.textFaint}
            style={{ backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text, marginBottom: 16 }}
          />
          <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{saving ? "Saving..." : "Add my number"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} style={{ alignItems: "center", paddingTop: 14 }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textFaint }}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

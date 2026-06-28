import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Application from "expo-application";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";

type FeedbackType = "bug" | "feature";

export default function FeedbackScreen() {
  const Theme = useTheme();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const text = message.trim();
    if (text.length < 5) {
      Alert.alert("A little more detail", "Please describe the bug or idea so we can act on it.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("app_feedback").insert({
      user_id: user?.id ?? null,
      type,
      message: text,
      email: user?.email ?? null,
      display_name: profile?.display_name ?? null,
      app_version: Application.nativeApplicationVersion ?? null,
      platform: Platform.OS,
    });
    setSending(false);
    if (error) {
      Alert.alert("Couldn't send", "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Icon name="check" size={32} color={Theme.primary} />
        </View>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 24, color: Theme.text, textAlign: "center", marginBottom: 10 }}>Thank you</Text>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 30 }}>
          Your {type === "bug" ? "bug report" : "idea"} went straight to our team. We read every one.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, paddingHorizontal: 40 }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 22, paddingTop: 62, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="left" size={22} color={Theme.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Send Feedback</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, lineHeight: 22, marginBottom: 22 }}>
          Found a bug or have an idea to make Prevail better? Tell us. It goes straight to our team.
        </Text>

        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Type</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          {([
            { id: "bug" as const, label: "Report a bug", icon: "flame" },
            { id: "feature" as const, label: "Suggest an idea", icon: "sparkle" },
          ]).map((opt) => {
            const on = type === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setType(opt.id)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: Theme.radius.pill, backgroundColor: on ? Theme.primary : Theme.card, borderWidth: 1, borderColor: on ? Theme.primary : Theme.cardBorder }}
              >
                <Icon name={opt.icon} size={17} color={on ? "#FFFFFF" : Theme.textMuted} />
                <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: on ? "#FFFFFF" : Theme.textMuted }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          {type === "bug" ? "What happened?" : "Your idea"}
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={type === "bug"
            ? "Describe what went wrong and what you expected to happen."
            : "Describe the feature or improvement you'd love to see."}
          placeholderTextColor={Theme.textFaint}
          multiline
          style={{ backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.card, padding: 16, minHeight: 150, textAlignVertical: "top", fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text, marginBottom: 22 }}
        />

        <TouchableOpacity onPress={handleSend} disabled={sending} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Send</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

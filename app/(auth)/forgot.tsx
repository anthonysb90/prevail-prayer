import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const mkInput = (Theme: AppTheme) => ({
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
} as const);
const mkLbl = (Theme: AppTheme) => ({ fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 });

export default function ForgotPasswordScreen() {
    const Theme = useTheme();
    const input = mkInput(Theme);
    const lbl = mkLbl(Theme);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert("Please enter your email.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "prevailprayer://reset",
    });
    setLoading(false);
    if (error) return Alert.alert("Could not send reset email", error.message);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, paddingHorizontal: 28, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon name="bell" size={32} color={Theme.primary} />
        </View>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text, textAlign: "center", marginBottom: 12 }}>
          Check your email
        </Text>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          If an account exists for{"\n"}
          <Text style={{ fontFamily: Theme.font.sansSemi, color: Theme.text }}>{email}</Text>,{"\n"}
          we sent a link to reset your password.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, paddingHorizontal: 40, alignItems: "center" }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Back to Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="left" size={18} color={Theme.textMuted} />
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: Theme.textMuted }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 32, color: Theme.text, marginBottom: 6 }}>Reset Password</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, marginBottom: 36 }}>
            Enter your email and we'll send you a link to set a new password.
          </Text>
          <View style={{ marginBottom: 30 }}>
            <Text style={lbl}>Email</Text>
            <TextInput style={input as any} placeholder="your@email.com" placeholderTextColor={Theme.textFaint} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{loading ? "Sending..." : "Send Reset Link"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

export default function ResetPasswordScreen() {
    const Theme = useTheme();
    const input = mkInput(Theme);
    const lbl = mkLbl(Theme);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (password.length < 8) return Alert.alert("Password", "Use at least 8 characters.");
    if (password !== confirm) return Alert.alert("Passwords don't match", "Please re-enter your new password.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return Alert.alert("Could not update password", error.message);
    Alert.alert("Password updated", "You can now use your new password.");
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
            <Icon name="lock" size={28} color={Theme.primary} />
          </View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 32, color: Theme.text, marginBottom: 6 }}>Set New Password</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, marginBottom: 36 }}>
            Choose a new password for your account.
          </Text>
          <View style={{ gap: 16, marginBottom: 30 }}>
            <View>
              <Text style={lbl}>New Password</Text>
              <TextInput style={input as any} placeholder="At least 8 characters" placeholderTextColor={Theme.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <View>
              <Text style={lbl}>Confirm Password</Text>
              <TextInput style={input as any} placeholder="Re-enter password" placeholderTextColor={Theme.textFaint} value={confirm} onChangeText={setConfirm} secureTextEntry />
            </View>
          </View>
          <TouchableOpacity onPress={handleUpdate} disabled={loading} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{loading ? "Updating..." : "Update Password"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

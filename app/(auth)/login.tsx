import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const input = {
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
} as const;
const lbl = { fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 };

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Please enter your email and password.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Login failed", error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="left" size={18} color={Theme.textMuted} />
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: Theme.textMuted }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 32, color: Theme.text, marginBottom: 6 }}>Welcome Back</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, marginBottom: 36 }}>Continue your prayer journey.</Text>

          <View style={{ gap: 16, marginBottom: 30 }}>
            <View>
              <Text style={lbl}>Email</Text>
              <TextInput style={input as any} placeholder="your@email.com" placeholderTextColor={Theme.textFaint} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View>
              <Text style={lbl}>Password</Text>
              <TextInput style={input as any} placeholder="Your password" placeholderTextColor={Theme.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{loading ? "Logging in..." : "Log In"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted }}>
              Don't have an account? <Text style={{ fontFamily: Theme.font.sansSemi, color: Theme.primary }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

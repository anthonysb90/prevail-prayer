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
import { analytics } from "@/lib/analytics";

const mkInput = (Theme: AppTheme) => ({
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
} as const);
const mkLbl = (Theme: AppTheme) => ({ fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 });

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function SignupScreen() {
    const Theme = useTheme();
    const input = mkInput(Theme);
    const lbl = mkLbl(Theme);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");

  const handleSignUp = async () => {
    if (!displayName.trim() || !email || !password) {
      return Alert.alert("Please fill in all fields.");
    }
    if (phoneDigits.length !== 10) {
      return Alert.alert("Phone number", "Please enter a valid 10-digit phone number.");
    }
    if (zip.length !== 5) {
      return Alert.alert("Zip code", "Please enter a valid 5-digit zip code.");
    }
    if (password.length < 8) {
      return Alert.alert("Password", "Password must be at least 8 characters.");
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          phone: phoneDigits,
          zip_code: zip,
        },
      },
    });
    if (error) {
      Alert.alert("Sign up failed", error.message);
      setLoading(false);
      return;
    }
    // If email confirmation is required, there is no session yet — show a
    // "check your email" message. If confirmation is off, a session exists
    // and the auth guard will route into onboarding automatically.
    analytics.capture("user_signed_up", { needs_email_confirm: !data.session });
    if (data.session) {
      router.replace("/(onboarding)/walk");
    } else {
      setConfirmSent(true);
    }
    setLoading(false);
  };

  if (confirmSent) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, paddingHorizontal: 28, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon name="bell" size={32} color={Theme.primary} />
        </View>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text, textAlign: "center", marginBottom: 12 }}>
          Check your email
        </Text>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          We sent a confirmation link to{"\n"}
          <Text style={{ fontFamily: Theme.font.sansSemi, color: Theme.text }}>{email}</Text>.{"\n"}
          Tap the link to activate your account, then come back and log in.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, paddingHorizontal: 40, alignItems: "center" }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Go to Log In</Text>
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
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 32, color: Theme.text, marginBottom: 6 }}>Create Account</Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textMuted, marginBottom: 36 }}>Start your prayer journey today.</Text>

          <View style={{ gap: 16, marginBottom: 30 }}>
            <View>
              <Text style={lbl}>Your Name</Text>
              <TextInput style={input as any} placeholder="What should we call you?" placeholderTextColor={Theme.textFaint} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
            </View>
            <View>
              <Text style={lbl}>Email</Text>
              <TextInput style={input as any} placeholder="your@email.com" placeholderTextColor={Theme.textFaint} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View>
              <Text style={lbl}>Phone Number</Text>
              <TextInput style={input as any} placeholder="(555) 123-4567" placeholderTextColor={Theme.textFaint} value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" />
            </View>
            <View>
              <Text style={lbl}>Zip Code</Text>
              <TextInput style={input as any} placeholder="30223" placeholderTextColor={Theme.textFaint} value={zip} onChangeText={(t) => setZip(t.replace(/\D/g, "").slice(0, 5))} keyboardType="number-pad" maxLength={5} />
            </View>
            <View>
              <Text style={lbl}>Password</Text>
              <TextInput style={input as any} placeholder="At least 8 characters" placeholderTextColor={Theme.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{loading ? "Creating Account..." : "Create Account"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted }}>
              Already have an account? <Text style={{ fontFamily: Theme.font.sansSemi, color: Theme.primary }}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

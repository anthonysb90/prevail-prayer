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
import { signInWithApple, signInWithGoogle } from "@/lib/socialAuth";
import { formatBirthdayInput, parseBirthday } from "@/lib/birthday";

// Mirrors login.tsx: Apple Sign In is enabled now that the App ID capability +
// Supabase Apple provider are configured.
const APPLE_SIGNIN_ENABLED = true;

const mkInput = (Theme: AppTheme) => ({
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text,
} as const);
const mkLbl = (Theme: AppTheme) => ({ fontFamily: Theme.font.sansMed as string, fontSize: 13, color: Theme.textMuted, marginBottom: 6 });

export default function SignupScreen() {
  const Theme = useTheme();
  const input = mkInput(Theme);
  const lbl = mkLbl(Theme);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleApple = async () => { try { await signInWithApple(); } catch (e: any) { if (e?.code !== "ERR_REQUEST_CANCELED") Alert.alert("Apple Sign In", e?.message ?? "Could not sign in."); } };
  const handleGoogle = async () => { try { await signInWithGoogle(); } catch (e: any) { Alert.alert("Google Sign In", e?.message ?? "Could not sign in."); } };

  const handleSignUp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!displayName.trim() || !cleanEmail || !password) {
      return Alert.alert("Please fill in all fields.");
    }
    if (password.length < 8) {
      return Alert.alert("Password", "Password must be at least 8 characters.");
    }
    // Birthday is optional. If provided, it must be valid.
    let birthdayIso: string | null = null;
    if (birthday.trim()) {
      const parsed = parseBirthday(birthday);
      if (parsed.error) return Alert.alert("Birthday", parsed.error);
      birthdayIso = parsed.iso;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { display_name: displayName.trim(), birthday: birthdayIso } },
    });
    if (error) {
      // Supabase's built-in mailer is rate-limited; surface that plainly
      // instead of its raw "email rate limit exceeded" message.
      if (error.status === 429 || /rate limit/i.test(error.message)) {
        Alert.alert(
          "Too many signups right now",
          "Our email system is temporarily limiting new confirmations. Please try again in a few minutes."
        );
      } else {
        Alert.alert("Sign up failed", error.message);
      }
      setLoading(false);
      return;
    }
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
              <Text style={lbl}>Birthday <Text style={{ color: Theme.textFaint }}>(optional)</Text></Text>
              <TextInput style={input as any} placeholder="MM/DD/YYYY" placeholderTextColor={Theme.textFaint} value={birthday} onChangeText={(t) => setBirthday(formatBirthdayInput(t))} keyboardType="number-pad" maxLength={10} />
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, marginTop: 6 }}>So we can celebrate your birthday with you.</Text>
            </View>
            <View>
              <Text style={lbl}>Email</Text>
              <TextInput style={input as any} placeholder="your@email.com" placeholderTextColor={Theme.textFaint} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" />
            </View>
            <View>
              <Text style={lbl}>Password</Text>
              <TextInput style={input as any} placeholder="At least 8 characters" placeholderTextColor={Theme.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>{loading ? "Creating Account..." : "Create Account"}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: Theme.cardBorder }} />
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textFaint }}>or sign up with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Theme.cardBorder }} />
          </View>

          {APPLE_SIGNIN_ENABLED && Platform.OS === "ios" && (
            <TouchableOpacity onPress={handleApple} activeOpacity={0.85} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#000000", borderRadius: Theme.radius.pill, paddingVertical: 15, marginBottom: 12 }}>
              <Icon name="apple" size={18} color="#FFFFFF" />
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleGoogle} activeOpacity={0.85} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.pill, paddingVertical: 15 }}>
            <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 18, color: "#4285F4" }}>G</Text>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.text }}>Continue with Google</Text>
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

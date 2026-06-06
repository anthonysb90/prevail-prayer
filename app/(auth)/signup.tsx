import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      Alert.alert("Please fill in all fields.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert("Sign up failed", error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: displayName,
      });
      router.replace("/(onboarding)/walk");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-10">
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <Text className="text-charcoal-600 text-base" style={{ fontFamily: "DMSans-Medium" }}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            className="text-charcoal-900 mb-2"
            style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 32 }}
          >
            Create Account
          </Text>
          <Text
            className="text-charcoal-600 mb-10 text-base"
            style={{ fontFamily: "DMSans-Regular" }}
          >
            Start your prayer journey today.
          </Text>

          {/* Fields */}
          <View className="gap-4 mb-8">
            <View>
              <Text className="text-charcoal-600 text-sm mb-2" style={{ fontFamily: "DMSans-Medium" }}>
                Your Name
              </Text>
              <TextInput
                className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900"
                style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
                placeholder="What should we call you?"
                placeholderTextColor="#8A8A8A"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-charcoal-600 text-sm mb-2" style={{ fontFamily: "DMSans-Medium" }}>
                Email
              </Text>
              <TextInput
                className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900"
                style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
                placeholder="your@email.com"
                placeholderTextColor="#8A8A8A"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-charcoal-600 text-sm mb-2" style={{ fontFamily: "DMSans-Medium" }}>
                Password
              </Text>
              <TextInput
                className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900"
                style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
                placeholder="At least 8 characters"
                placeholderTextColor="#8A8A8A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-amber-400 rounded-full py-4 items-center"
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base" style={{ fontFamily: "DMSans-SemiBold" }}>
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-charcoal-600 text-sm" style={{ fontFamily: "DMSans-Regular" }}>
              Already have an account?{" "}
              <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold" }}>
                Log in
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

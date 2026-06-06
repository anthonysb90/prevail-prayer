import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Please enter your email and password.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert("Login failed", error.message);
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
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <Text className="text-charcoal-600 text-base" style={{ fontFamily: "DMSans-Medium" }}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            className="text-charcoal-900 mb-2"
            style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 32 }}
          >
            Welcome Back
          </Text>
          <Text
            className="text-charcoal-600 mb-10 text-base"
            style={{ fontFamily: "DMSans-Regular" }}
          >
            Continue your prayer journey.
          </Text>

          <View className="gap-4 mb-8">
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
                placeholder="Your password"
                placeholderTextColor="#8A8A8A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-amber-400 rounded-full py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base" style={{ fontFamily: "DMSans-SemiBold" }}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text className="text-charcoal-600 text-sm" style={{ fontFamily: "DMSans-Regular" }}>
              Don't have an account?{" "}
              <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold" }}>
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

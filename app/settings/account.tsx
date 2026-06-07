import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, fetchProfile, signOut } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(
    profile?.phone ? formatPhone(profile.phone) : ""
  );
  const [zip, setZip] = useState(profile?.zip_code ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;
  const zipValid = zip.length === 0 || zip.length === 5;

  const hasChanges =
    displayName.trim() !== (profile?.display_name ?? "") ||
    phoneDigits !== (profile?.phone ?? "") ||
    zip !== (profile?.zip_code ?? "");

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    if (!phoneValid || !zipValid) {
      Alert.alert("Check your details", "Phone must be 10 digits and zip must be 5 digits.");
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        phone: phoneDigits.length === 10 ? phoneDigits : null,
        zip_code: zip.length === 5 ? zip : null,
      })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await fetchProfile(user.id);
      Alert.alert("Saved", "Your profile has been updated.");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            await signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your prayer data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Contact Support",
              "To delete your account, email support@prevailprayer.com with your registered email address."
            ),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <View style={{
        paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26, color: "#1A1A1A" }}>
          Account
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
        {/* Profile section */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <Text style={{
            fontFamily: "DMSans-Medium", fontSize: 11, color: "#8A8A8A",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16,
          }}>
            Profile
          </Text>

          <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#4A4A4A", marginBottom: 6 }}>
            Display Name
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            style={{
              backgroundColor: "#F5F0E8",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontFamily: "DMSans-Regular", fontSize: 16, color: "#1A1A1A",
              marginBottom: 16,
            }}
            placeholder="Your name"
            placeholderTextColor="#8A8A8A"
          />

          <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#4A4A4A", marginBottom: 6 }}>
            Phone Number
          </Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            keyboardType="phone-pad"
            style={{
              backgroundColor: "#F5F0E8",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontFamily: "DMSans-Regular", fontSize: 16, color: "#1A1A1A",
              marginBottom: 16,
            }}
            placeholder="(555) 123-4567"
            placeholderTextColor="#8A8A8A"
          />

          <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#4A4A4A", marginBottom: 6 }}>
            Zip Code
          </Text>
          <TextInput
            value={zip}
            onChangeText={(t) => setZip(t.replace(/\D/g, "").slice(0, 5))}
            keyboardType="number-pad"
            maxLength={5}
            style={{
              backgroundColor: "#F5F0E8",
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontFamily: "DMSans-Regular", fontSize: 16, color: "#1A1A1A",
              marginBottom: 16,
            }}
            placeholder="30223"
            placeholderTextColor="#8A8A8A"
          />

          <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#4A4A4A", marginBottom: 6 }}>
            Email
          </Text>
          <View style={{
            backgroundColor: "#F5F0E8", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
          }}>
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 16, color: "#8A8A8A" }}>
              {user?.email ?? "—"}
            </Text>
          </View>
        </View>

        {/* Save button */}
        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: "#F5B942", borderRadius: 100, paddingVertical: 16,
              alignItems: "center", marginBottom: 20,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <Text style={{
            fontFamily: "DMSans-Medium", fontSize: 11, color: "#8A8A8A",
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16,
          }}>
            Prayer Stats
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {[
              { label: "Prayer Streak", value: `${profile?.prayer_streak ?? 0} days` },
              { label: "Subscription", value: profile?.subscription_status ?? "Free" },
            ].map((s) => (
              <View key={s.label} style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 22, color: "#1A1A1A" }}>
                  {s.value}
                </Text>
                <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#8A8A8A", marginTop: 2 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Danger zone */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
              paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F5F0E8",
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#E53E3E" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 15, color: "#E53E3E", flex: 1 }}>
              {signingOut ? "Signing out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}
          >
            <Ionicons name="trash-outline" size={20} color="#8A8A8A" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#8A8A8A", flex: 1 }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#8A8A8A", textAlign: "center" }}>
          Prevail Prayer v1.0.0{"\n"}support@prevailprayer.com
        </Text>
      </ScrollView>
    </View>
  );
}

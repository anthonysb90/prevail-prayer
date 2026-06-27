import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { pickAndUploadAvatar } from "@/lib/avatar";
import { useTheme } from "@/hooks/useTheme";
import { exportMyData } from "@/lib/exportData";
import { formatBirthdayInput, parseBirthday, isoToMasked } from "@/lib/birthday";
import { compExpiryLabel } from "@/lib/trial";
import { Icon } from "@/components/ui/Icon";

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AccountScreen() {
  const Theme = useTheme();
  const router = useRouter();
  const { user, profile, fetchProfile, signOut } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ? formatPhone(profile.phone) : "");
  const [birthday, setBirthday] = useState(isoToMasked(profile?.birthday));
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exporting, setExporting] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;
  const hasChanges =
    displayName.trim() !== (profile?.display_name ?? "") ||
    phoneDigits !== (profile?.phone ?? "") ||
    birthday !== isoToMasked(profile?.birthday);

  const cardStyle = { backgroundColor: Theme.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Theme.cardBorder } as const;
  const fieldStyle = { backgroundColor: Theme.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text, marginBottom: 16 } as const;
  const labelStyle = { fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textMuted, marginBottom: 6 } as const;

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    if (!phoneValid) { Alert.alert("Check your details", "Phone must be 10 digits."); return; }
    let birthdayIso: string | null = null;
    if (birthday.trim()) {
      const parsed = parseBirthday(birthday);
      if (parsed.error) { Alert.alert("Birthday", parsed.error); return; }
      birthdayIso = parsed.iso;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      phone: phoneDigits.length === 10 ? phoneDigits : null,
      birthday: birthdayIso,
    }).eq("id", user.id);
    if (error) Alert.alert("Error", error.message);
    else { await fetchProfile(user.id); Alert.alert("Saved", "Your profile has been updated."); }
    setSaving(false);
  };

  const handleChangeAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(user.id);
      if (url) await fetchProfile(user.id);
    } catch (e: any) { Alert.alert("Could not update photo", e.message ?? "Please try again."); }
    setUploadingAvatar(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportMyData(user!.id, displayName || "Friend"); }
    catch (e: any) { Alert.alert("Export failed", e.message ?? "Please try again."); }
    setExporting(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); } },
    ]);
  };

  const handleCloseAccount = () => {
    Alert.alert(
      "Close Account",
      "Your account will be closed and you'll be signed out. We keep your email and records on file for ministry follow-up; you can reopen by contacting support. Export your data first if you'd like a copy.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Account", style: "destructive",
          onPress: async () => {
            if (!user) return;
            await supabase.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", user.id);
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color={Theme.textMuted} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
        {/* Profile */}
        <View style={cardStyle}>
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 11, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Profile</Text>
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Theme.primarySoft }} />
              ) : (
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: Theme.font.serif, fontSize: 34, color: Theme.primary }}>{(displayName.trim().charAt(0) || "?").toUpperCase()}</Text>
                </View>
              )}
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Theme.card }}>
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}>{uploadingAvatar ? "Uploading..." : profile?.avatar_url ? "Change Photo" : "Add Photo"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={labelStyle}>Display Name</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} style={fieldStyle} placeholder="Your name" placeholderTextColor={Theme.textFaint} />

          <Text style={labelStyle}>Phone Number</Text>
          <TextInput value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" style={fieldStyle} placeholder="(555) 123-4567" placeholderTextColor={Theme.textFaint} />

          <Text style={labelStyle}>Birthday</Text>
          <TextInput value={birthday} onChangeText={(t) => setBirthday(formatBirthdayInput(t))} keyboardType="number-pad" maxLength={10} style={fieldStyle} placeholder="MM/DD/YYYY" placeholderTextColor={Theme.textFaint} />

          <Text style={labelStyle}>Email</Text>
          <View style={{ backgroundColor: Theme.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 16, color: Theme.textFaint }}>{user?.email ?? "—"}</Text>
          </View>
        </View>

        {hasChanges && (
          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center", marginBottom: 20 }}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Save Changes</Text>}
          </TouchableOpacity>
        )}

        {compExpiryLabel(profile) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Theme.primarySoft, borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <Icon name="sparkle" size={22} color={Theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text }}>Pro — gifted by Prevail Prayer</Text>
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textMuted, marginTop: 2 }}>{compExpiryLabel(profile)}</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={cardStyle}>
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 11, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Prayer Stats</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {[{ label: "Prayer Streak", value: `${profile?.prayer_streak ?? 0} days` }, { label: "Subscription", value: profile?.subscription_status ?? "Free" }].map((s) => (
              <View key={s.label} style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.text }}>{s.value}</Text>
                <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Your data */}
        <View style={{ backgroundColor: Theme.card, borderRadius: 20, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: Theme.cardBorder }}>
          <TouchableOpacity onPress={handleExport} disabled={exporting} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}>
            <Ionicons name="download-outline" size={20} color={Theme.primary} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text, flex: 1 }}>{exporting ? "Preparing PDF..." : "Export my data (PDF)"}</Text>
            <Ionicons name="chevron-forward" size={16} color={Theme.textFaint} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={{ backgroundColor: Theme.card, borderRadius: 20, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: Theme.cardBorder }}>
          <TouchableOpacity onPress={handleSignOut} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.bg }}>
            <Ionicons name="log-out-outline" size={20} color={Theme.urgent} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.urgent, flex: 1 }}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCloseAccount} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}>
            <Ionicons name="close-circle-outline" size={20} color={Theme.textFaint} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, flex: 1 }}>Close Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, textAlign: "center" }}>
          Prevail Prayer v1.0.0{"\n"}support@prevailprayer.com
        </Text>
      </ScrollView>
    </View>
  );
}

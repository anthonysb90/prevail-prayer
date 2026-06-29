import { View, Text, TouchableOpacity, ScrollView, Image, Share, Linking, Alert, Platform, Switch } from "react-native";
import { useState, useEffect } from "react";
import * as StoreReview from "expo-store-review";
import { useAppLockStore } from "@/stores/appLockStore";
import { isBiometricAvailable, getBiometricLabel, authenticate } from "@/lib/biometrics";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";

const APP_STORE_URL = "https://apps.apple.com/app/id6778065935";
const DONATION_URL = "https://prevailprayer.com/support";
const SHARE_MESSAGE =
  "I've been using Prevail Prayer to track my prayer requests and grow in prayer. Check it out: https://prevailprayer.com";

export default function SettingsScreen() {
    const Theme = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const { enabled: lockEnabled, setEnabled: setLockEnabled, hydrate: hydrateLock } = useAppLockStore();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID");

  useEffect(() => {
    hydrateLock();
    isBiometricAvailable().then(setBioAvailable);
    getBiometricLabel().then(setBioLabel);
  }, []);

  const toggleLock = async (next: boolean) => {
    if (next) {
      const ok = await authenticate(`Enable ${bioLabel} lock`);
      if (!ok) return;
      await setLockEnabled(true);
    } else {
      await setLockEnabled(false);
    }
  };

  const handleRate = async () => {
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
        return;
      }
    } catch {}
    Linking.openURL(`${APP_STORE_URL}?action=write-review`).catch(() =>
      Alert.alert("Could not open the App Store")
    );
  };

  const handleShare = () => {
    Share.share({ message: SHARE_MESSAGE }).catch(() => {});
  };

  const handleSupport = () => {
    Linking.openURL(DONATION_URL).catch(() =>
      Alert.alert("Could not open link", "Visit prevailprayer.com/support")
    );
  };

  const rows = [
    { label: "General Reminders", icon: "bell", onPress: () => router.push("/settings/reminders") },
    { label: "Account", icon: "user", onPress: () => router.push("/settings/account") },
    { label: "Devotions", icon: "book", onPress: () => router.push("/devotions") },
    { label: "Theme", icon: "moon", onPress: () => router.push("/settings/theme") },
    { label: "Send Feedback", icon: "quote", onPress: () => router.push("/settings/feedback") },
    { label: "Rate the App", icon: "sparkle", onPress: handleRate },
    { label: "Share with a Friend", icon: "share", onPress: handleShare },
    { label: "Support Prevail Prayer", icon: "heart", onPress: handleSupport },
  ];

  const name = profile?.display_name ?? "Friend";
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 62, paddingBottom: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="left" size={22} color={Theme.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        {/* Profile */}
        <View
          style={{
            backgroundColor: Theme.card, borderRadius: Theme.radius.card,
            borderWidth: 1, borderColor: Theme.cardBorder,
            padding: 18, marginBottom: 22, flexDirection: "row", alignItems: "center", gap: 14,
            ...Theme.shadow,
          }}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Theme.primarySoft }} />
          ) : (
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.primary }}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 17, color: Theme.text }}>{name}</Text>
              {isPremium && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Theme.primary, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Icon name="sparkle" size={11} color="#FFFFFF" />
                  <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 10, color: "#FFFFFF", letterSpacing: 0.5 }}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint, marginTop: 2 }}>
              {isPremium ? "Premium member" : "Prevail Prayer"}
            </Text>
          </View>
        </View>

        {/* Rows */}
        <View
          style={{
            backgroundColor: Theme.card, borderRadius: Theme.radius.card,
            borderWidth: 1, borderColor: Theme.cardBorder, overflow: "hidden", marginBottom: 22,
            ...Theme.shadow,
          }}
        >
          {rows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 18, paddingVertical: 16,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: Theme.cardBorder,
              }}
            >
              <Icon name={row.icon} size={20} color={Theme.textMuted} />
              <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: Theme.text, flex: 1 }}>{row.label}</Text>
              <Icon name="right" size={16} color={Theme.textFaint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Security / biometric lock */}
        {bioAvailable && (
          <View
            style={{
              backgroundColor: Theme.card, borderRadius: Theme.radius.card,
              borderWidth: 1, borderColor: Theme.cardBorder, marginBottom: 22,
              paddingHorizontal: 18, paddingVertical: 16,
              flexDirection: "row", alignItems: "center", gap: 14,
              ...Theme.shadow,
            }}
          >
            <Icon name="lock" size={20} color={Theme.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: Theme.text }}>{bioLabel} Lock</Text>
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, marginTop: 2 }}>
                Require {bioLabel} to open the app
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={toggleLock}
              trackColor={{ false: Theme.cardBorder, true: Theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.8}
          style={{
            backgroundColor: Theme.card, borderRadius: Theme.radius.card,
            borderWidth: 1, borderColor: Theme.cardBorder, paddingVertical: 16, alignItems: "center",
            ...Theme.shadow,
          }}
        >
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.urgent }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 13, color: Theme.textFaint, textAlign: "center", marginTop: 24 }}>
          Prevail · v1.0 — "Continue steadfastly in prayer."
        </Text>
      </ScrollView>
    </View>
  );
}

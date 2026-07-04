import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/stores/authStore";
import { isTrialActive, trialDaysLeft } from "@/lib/trial";
import { Icon } from "@/components/ui/Icon";
import { BrandMark } from "@/components/ui/BrandMark";

const SEEN_KEY = "trial_welcome_seen_v1";

const TRIAL_FEATURES = [
  { icon: "book-outline", label: "Prayer Journal" },
  { icon: "timer-outline", label: "Prayer Timer & music" },
  { icon: "library-outline", label: "Scripture Library" },
  { icon: "sparkles-outline", label: "Daily Devotions" },
  { icon: "notifications-outline", label: "Prayer Reminders" },
];

/**
 * Shown once, the first time a brand-new user (in their free trial) opens the
 * app, letting them know their 14-day premium trial is active. Dismissal is
 * persisted so it never reappears.
 */
export function TrialWelcomeModal() {
  const { profile } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    async function maybeShow() {
      if (!isTrialActive(profile)) return;
      try {
        const seen = await SecureStore.getItemAsync(SEEN_KEY);
        if (active && !seen) setVisible(true);
      } catch {
        // If storage is unavailable, fail closed (don't nag repeatedly).
      }
    }
    maybeShow();
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.subscription_status]);

  const dismiss = async () => {
    setVisible(false);
    try {
      await SecureStore.setItemAsync(SEEN_KEY, "1");
    } catch {}
  };

  const days = trialDaysLeft(profile);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={dismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(29,27,38,0.55)",
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingVertical: 40,
        }}
      >
        {/* Scrollable so the dismiss button stays reachable at large text sizes / zoom. */}
        <ScrollView
          style={{ flexGrow: 0, maxHeight: "100%", borderRadius: 28 }}
          contentContainerStyle={{ flexGrow: 0 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <View style={{ backgroundColor: "#F1EFF9", borderRadius: 28, overflow: "hidden" }}>
          {/* Indigo header */}
          <View style={{ backgroundColor: "#5B53C6", alignItems: "center", paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <BrandMark size={34} />
            </View>
            <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 26, color: "#FFFFFF", textAlign: "center" }}>
              Your trial is on us
            </Text>
            <Text
              style={{
                fontFamily: "HankenGrotesk_500Medium",
                fontSize: 15,
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {days} days of Prevail Premium, free
            </Text>
          </View>

          {/* Body */}
          <View style={{ padding: 24 }}>
            <Text
              style={{
                fontFamily: "HankenGrotesk_400Regular",
                fontSize: 14,
                color: "#5A5666",
                textAlign: "center",
                lineHeight: 21,
                marginBottom: 18,
              }}
            >
              Everything is unlocked for the next two weeks. Explore it all, no card required.
            </Text>

            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 22 }}>
              {TRIAL_FEATURES.map((f, i) => (
                <View
                  key={f.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 11,
                    paddingHorizontal: 8,
                    borderBottomWidth: i < TRIAL_FEATURES.length - 1 ? 1 : 0,
                    borderBottomColor: "#EFEDF6",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: "#ECEAFA",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={f.icon as any} size={18} color="#5B53C6" />
                  </View>
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 15, color: "#1D1B26", flex: 1 }}>
                    {f.label}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="#3FB27F" />
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={dismiss}
              activeOpacity={0.85}
              style={{ backgroundColor: "#5B53C6", borderRadius: 100, paddingVertical: 17, alignItems: "center" }}
            >
              <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                Start praying
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: "HankenGrotesk_400Regular",
                fontSize: 12,
                color: "#9794A4",
                textAlign: "center",
                marginTop: 14,
              }}
            >
              After your trial, keep Premium from $2.99/mo. No charge until you choose a plan.
            </Text>
          </View>
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

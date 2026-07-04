import { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import { CURRENT_RELEASE, WHATS_NEW_STORAGE_KEY } from "@/constants/changelog";

/**
 * Shows the latest release highlights once, the first time a user opens the app
 * after it updates to a new changelog version. Dismissal is remembered per
 * version in AsyncStorage. Mounted globally; self-gates on auth + seen-state.
 */
export function WhatsNewModal() {
  const Theme = useTheme();
  const { user } = useAuthStore();
  const { height: screenHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    AsyncStorage.getItem(WHATS_NEW_STORAGE_KEY).then((seen) => {
      if (alive && seen !== CURRENT_RELEASE.version) setVisible(true);
    });
    return () => { alive = false; };
  }, [user]);

  const dismiss = async () => {
    setVisible(false);
    try { await AsyncStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_RELEASE.version); } catch {}
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: "rgba(16,16,26,0.55)", alignItems: "center", justifyContent: "center", padding: 28 }}>
        <View style={{ width: "100%", maxWidth: 420, backgroundColor: Theme.card, borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: Theme.primary, paddingTop: 26, paddingBottom: 22, paddingHorizontal: 24, alignItems: "center" }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="sparkle" size={26} color="#FFFFFF" />
            </View>
            <Text style={{ fontFamily: Theme.font.serif, fontSize: 24, color: "#FFFFFF" }}>{CURRENT_RELEASE.title}</Text>
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>Version {CURRENT_RELEASE.version}</Text>
          </View>

          <ScrollView style={{ maxHeight: Math.min(screenHeight * 0.45, 420) }} contentContainerStyle={{ padding: 22 }}>
            {CURRENT_RELEASE.highlights.map((h, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <Icon name="check" size={13} color={Theme.primary} />
                </View>
                <Text style={{ flex: 1, fontFamily: Theme.font.sans, fontSize: 15, color: Theme.text, lineHeight: 22 }}>{h}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ padding: 22, paddingTop: 6 }}>
            <TouchableOpacity onPress={dismiss} style={{ backgroundColor: Theme.primary, borderRadius: 100, paddingVertical: 15, alignItems: "center" }}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

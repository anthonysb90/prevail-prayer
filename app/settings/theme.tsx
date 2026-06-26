import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useThemeStore, ThemePref } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";

const OPTIONS: { id: ThemePref; label: string; subtitle: string; icon: string }[] = [
  { id: "system", label: "Automatic", subtitle: "Match my device setting", icon: "gear" },
  { id: "light", label: "Light", subtitle: "Always light", icon: "sparkle" },
  { id: "dark", label: "Dark", subtitle: "Always dark", icon: "moon" },
];

export default function ThemeScreen() {
  const router = useRouter();
  const Theme = useTheme();
  const { pref, setPref } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 62, paddingBottom: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="left" size={22} color={Theme.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Theme</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <View style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder, overflow: "hidden", ...Theme.shadow }}>
          {OPTIONS.map((opt, i) => {
            const active = pref === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setPref(opt.id, user?.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  paddingHorizontal: 18, paddingVertical: 16,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: Theme.cardBorder,
                }}
              >
                <Icon name={opt.icon} size={20} color={active ? Theme.primary : Theme.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text }}>{opt.label}</Text>
                  <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint, marginTop: 2 }}>{opt.subtitle}</Text>
                </View>
                {active && <Icon name="check" size={18} color={Theme.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint, textAlign: "center", marginTop: 18, lineHeight: 19 }}>
          Your choice is saved to your account and applies across your devices.
        </Text>
      </ScrollView>
    </View>
  );
}

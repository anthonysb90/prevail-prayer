import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const rows = [
    { label: "General Reminders", icon: "bell", onPress: () => router.push("/settings/reminders") },
    { label: "Account", icon: "user", onPress: () => router.push("/settings/account") },
    { label: "Theme", icon: "moon", onPress: () => {} },
    { label: "Rate the App", icon: "sparkle", onPress: () => {} },
    { label: "Share with a Friend", icon: "share", onPress: () => {} },
    { label: "Support Prevail Prayer", icon: "heart", onPress: () => {} },
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
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.primary }}>{initial}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 17, color: Theme.text }}>{name}</Text>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint, marginTop: 2 }}>Prevail Prayer</Text>
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

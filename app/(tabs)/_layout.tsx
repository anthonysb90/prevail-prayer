import { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";

function Tab({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return <Icon name={name} size={24} color={color} sw={focused ? 2 : 1.7} />;
}

export default function TabLayout() {
  const Theme = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (route: string) => {
    setMenuOpen(false);
    router.push(route as never);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Theme.card,
            borderTopColor: Theme.cardBorder,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: Theme.primary,
          tabBarInactiveTintColor: Theme.textFaint,
          tabBarLabelStyle: {
            fontFamily: Theme.font.sansSemi,
            fontSize: 11,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => <Tab name="home" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="pray"
          options={{
            title: "Prayer List",
            tabBarIcon: ({ color, focused }) => <Tab name="list" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarIcon: () => (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  shadowColor: Theme.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Icon name="plus" size={26} color="#FFFFFF" sw={2} />
              </View>
            ),
            tabBarButton: (props) => (
              <TouchableOpacity
                {...(props as any)}
                onPress={() => setMenuOpen(true)}
                style={{ flex: 1, alignItems: "center" }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color, focused }) => <Tab name="journal" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Scripture",
            tabBarIcon: ({ color, focused }) => <Tab name="book" color={color} focused={focused} />,
          }}
        />
      </Tabs>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable onPress={() => setMenuOpen(false)} style={{ flex: 1, backgroundColor: "rgba(16,16,26,0.45)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: Theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 40, paddingHorizontal: 18 }}
          >
            <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: Theme.cardBorder, marginBottom: 14 }} />
            <AddOption Theme={Theme} icon="plus" title="New prayer request" subtitle="Add one request yourself" onPress={() => go("/prayer/new")} />
            <AddOption Theme={Theme} icon="image" title="Import from photo" subtitle="Snap a church prayer list — AI reads it" onPress={() => go("/prayer/import?tab=photo")} />
            <AddOption Theme={Theme} icon="note" title="Import from text" subtitle="Paste a list — free, no scan limit" onPress={() => go("/prayer/import?tab=text")} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function AddOption({
  Theme, icon, title, subtitle, onPress,
}: { Theme: AppTheme; icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} color={Theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.text }}>{title}</Text>
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textMuted, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Icon name="right" size={18} color={Theme.textFaint} />
    </TouchableOpacity>
  );
}

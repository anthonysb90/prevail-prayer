import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Theme } from "@/constants/theme";

function Tab({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return <Icon name={name} size={24} color={color} sw={focused ? 2 : 1.7} />;
}

export default function TabLayout() {
  const router = useRouter();

  return (
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
              onPress={() => router.push("/prayer/new")}
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
  );
}

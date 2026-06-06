import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { AnnouncementType } from "@/types";

const TYPE_CONFIG: Record<AnnouncementType, { color: string; bg: string; icon: string; label: string }> = {
  info:      { color: "#2196F3", bg: "#E3F2FD", icon: "information-circle-outline", label: "Info" },
  prayer:    { color: "#9C27B0", bg: "#F3E5F5", icon: "hand-right-outline",          label: "Prayer Need" },
  emergency: { color: "#E53E3E", bg: "#FFEBEE", icon: "alert-circle-outline",        label: "Emergency" },
  update:    { color: "#4CAF50", bg: "#E8F5E9", icon: "checkmark-circle-outline",    label: "Update" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: announcements = [], isLoading, refetch } = useAnnouncements();

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26, color: "#1A1A1A" }}>
          Notifications
        </Text>
      </View>

      {announcements.length === 0 && !isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="notifications-outline" size={48} color="#EDE5D8" />
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#8A8A8A", textAlign: "center", marginTop: 16 }}>
            No announcements yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#F5B942" />}
        >
          {announcements.map((item) => {
            const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info;
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: cfg.color,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ backgroundColor: cfg.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                    <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 11, color: cfg.color, marginLeft: 4 }}>
                      {cfg.label}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#8A8A8A", marginLeft: "auto" }}>
                    {item.sent_at ? format(new Date(item.sent_at), "MMM d, yyyy") : ""}
                  </Text>
                </View>
                <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16, color: "#1A1A1A", marginBottom: 6 }}>
                  {item.title}
                </Text>
                <Text style={{ fontFamily: "DMSans-Regular", fontSize: 14, color: "#4A4A4A", lineHeight: 21 }}>
                  {item.body}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

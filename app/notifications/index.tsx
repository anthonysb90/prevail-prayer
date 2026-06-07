import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { AnnouncementType } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const TYPE_CONFIG: Record<AnnouncementType, { color: string; bg: string; icon: string; label: string }> = {
  info:      { color: Theme.primary, bg: Theme.primarySoft, icon: "sparkle", label: "Info" },
  prayer:    { color: "#7A5BD0",     bg: "#EEEAFB",         icon: "pray",    label: "Prayer Need" },
  emergency: { color: Theme.urgent,  bg: "#FBEAEE",         icon: "flame",   label: "Emergency" },
  update:    { color: Theme.success, bg: "#ECF8F2",         icon: "check",   label: "Update" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: announcements = [], isLoading, refetch } = useAnnouncements();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 22, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Notifications</Text>
      </View>

      {announcements.length === 0 && !isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="bell" size={44} color={Theme.textFaint} />
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", marginTop: 14 }}>No announcements yet.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Theme.primary} />}
        >
          {announcements.map((item: any) => {
            const cfg = TYPE_CONFIG[(item.type as AnnouncementType)] ?? TYPE_CONFIG.info;
            return (
              <View key={item.id} style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder, padding: 18, marginBottom: 11, ...Theme.shadow }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ backgroundColor: cfg.bg, borderRadius: Theme.radius.pill, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Icon name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 12, color: cfg.color }}>{cfg.label}</Text>
                  </View>
                  <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginLeft: "auto" }}>
                    {item.sent_at ? format(new Date(item.sent_at), "MMM d, yyyy") : ""}
                  </Text>
                </View>
                <Text style={{ fontFamily: Theme.font.serif, fontSize: 18, color: Theme.text, marginBottom: 6 }}>{item.title}</Text>
                <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, lineHeight: 21 }}>{item.body}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

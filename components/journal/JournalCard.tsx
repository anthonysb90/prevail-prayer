import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { JournalEntry } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export function JournalCard({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const displayTitle =
    entry.title?.trim() || entry.body.split("\n")[0].substring(0, 60) || "Untitled Entry";
  const preview = entry.title
    ? entry.body.substring(0, 90)
    : entry.body.substring(displayTitle.length).trim().substring(0, 90);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/journal/${entry.id}`)}
      activeOpacity={0.85}
      style={{
        backgroundColor: Theme.card,
        borderRadius: Theme.radius.card,
        borderWidth: 1,
        borderColor: Theme.cardBorder,
        padding: 18,
        marginBottom: 11,
        ...Theme.shadow,
      }}
    >
      <Text
        style={{
          fontFamily: Theme.font.sansMed,
          fontSize: 12,
          color: Theme.textFaint,
          marginBottom: 6,
        }}
      >
        {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
      </Text>
      <Text
        style={{ fontFamily: Theme.font.serif, fontSize: 18, color: Theme.text, lineHeight: 25, marginBottom: preview ? 6 : 0 }}
        numberOfLines={2}
      >
        {displayTitle}
      </Text>
      {preview ? (
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textMuted, lineHeight: 20 }} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
      {(entry as any).prayer_requests && (
        <View
          style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            marginTop: 12, paddingTop: 12,
            borderTopWidth: 1, borderTopColor: Theme.cardBorder,
          }}
        >
          <Icon name="pray" size={13} color={Theme.primary} />
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.primary }} numberOfLines={1}>
            {(entry as any).prayer_requests.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

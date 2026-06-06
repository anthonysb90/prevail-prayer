import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { JournalEntry } from "@/types";

interface JournalCardProps {
  entry: JournalEntry;
}

export function JournalCard({ entry }: JournalCardProps) {
  const router = useRouter();

  // Use title if set, otherwise first line of body
  const displayTitle =
    entry.title?.trim() ||
    entry.body.split("\n")[0].substring(0, 60) ||
    "Untitled Entry";

  // Preview: second line or body after first sentence
  const preview = entry.title
    ? entry.body.substring(0, 80)
    : entry.body.substring(displayTitle.length).trim().substring(0, 80);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/journal/${entry.id}`)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
      activeOpacity={0.8}
    >
      {/* Date */}
      <Text
        style={{
          fontFamily: "DMSans-Regular",
          fontSize: 11,
          color: "#8A8A8A",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
      </Text>

      {/* Title */}
      <Text
        style={{
          fontFamily: "PlayfairDisplay-SemiBold",
          fontSize: 17,
          color: "#1A1A1A",
          marginBottom: preview ? 6 : 0,
          lineHeight: 24,
        }}
        numberOfLines={2}
      >
        {displayTitle}
      </Text>

      {/* Preview */}
      {preview ? (
        <Text
          style={{
            fontFamily: "DMSans-Regular",
            fontSize: 13,
            color: "#4A4A4A",
            lineHeight: 19,
          }}
          numberOfLines={2}
        >
          {preview}
        </Text>
      ) : null}

      {/* Linked prayer request */}
      {(entry as any).prayer_requests && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#F5F0E8",
          }}
        >
          <Ionicons name="link-outline" size={13} color="#8A8A8A" />
          <Text
            style={{
              fontFamily: "DMSans-Medium",
              fontSize: 12,
              color: "#8A8A8A",
              marginLeft: 5,
            }}
            numberOfLines={1}
          >
            {(entry as any).prayer_requests.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

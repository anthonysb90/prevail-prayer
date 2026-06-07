import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { PrayerRequest } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/atoms";

interface PrayerCardProps {
  prayer: PrayerRequest;
  compact?: boolean;
}

export function PrayerCard({ prayer, compact }: PrayerCardProps) {
  const router = useRouter();
  const cats = prayer.categories ?? [];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/prayer/${prayer.id}`)}
      activeOpacity={0.85}
      style={{
        backgroundColor: Theme.card,
        borderRadius: Theme.radius.card,
        borderWidth: 1,
        borderColor: Theme.cardBorder,
        padding: compact ? 15 : 17,
        marginBottom: 11,
        ...Theme.shadow,
      }}
    >
      {/* Title row */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 7 }}>
          {prayer.is_urgent && <Icon name="flame" size={16} color={Theme.urgent} />}
          <Text
            style={{
              fontFamily: Theme.font.serif,
              fontSize: compact ? 16 : 17,
              color: Theme.text,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {prayer.title}
          </Text>
        </View>
        <View style={{ marginTop: 3, marginLeft: 8 }}>
          <Icon name="right" size={17} color={Theme.textFaint} />
        </View>
      </View>

      {/* Description */}
      {prayer.description && !compact ? (
        <Text
          style={{
            fontFamily: Theme.font.sans,
            fontSize: 14,
            color: Theme.textMuted,
            lineHeight: 20,
            marginTop: 6,
          }}
          numberOfLines={2}
        >
          {prayer.description}
        </Text>
      ) : null}

      {/* Footer: tags + status meta */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 }}>
          {cats.slice(0, 2).map((cat) => (
            <Tag key={cat.id} category={cat} small />
          ))}
        </View>

        {prayer.status === "answered" && prayer.answered_at ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 }}>
            <Icon name="check" size={13} color={Theme.success} />
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.success }}>
              {format(new Date(prayer.answered_at), "MMM d")}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

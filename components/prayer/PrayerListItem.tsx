import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PrayerRequest } from "@/types";
import { CategoryChip } from "./CategoryChip";

interface PrayerListItemProps {
  prayer: PrayerRequest;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  ongoing: "Ongoing",
};

export function PrayerListItem({ prayer }: PrayerListItemProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/prayer/${prayer.id}`)}
      style={{
        backgroundColor: "#1A1A1A",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: prayer.is_urgent ? 3 : 0,
        borderLeftColor: "#E53E3E",
      }}
      activeOpacity={0.75}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        {prayer.is_urgent ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="alert-circle" size={12} color="#E53E3E" />
            <Text
              style={{
                fontFamily: "DMSans-SemiBold",
                fontSize: 10,
                color: "#E53E3E",
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Urgent
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#2A2A2A",
              borderRadius: 100,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans-Medium",
                fontSize: 10,
                color: "#9A9A9A",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {STATUS_LABEL[prayer.status] ?? prayer.status}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color="#4A4A4A" />
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: "DMSans-SemiBold",
          fontSize: 16,
          color: "#FFFFFF",
          marginBottom: prayer.description ? 4 : 8,
        }}
        numberOfLines={1}
      >
        {prayer.title}
      </Text>

      {/* Description preview */}
      {prayer.description ? (
        <Text
          style={{
            fontFamily: "DMSans-Regular",
            fontSize: 13,
            color: "#9A9A9A",
            marginBottom: 10,
            lineHeight: 18,
          }}
          numberOfLines={1}
        >
          {prayer.description}
        </Text>
      ) : null}

      {/* Categories */}
      {prayer.categories && prayer.categories.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {prayer.categories.map((cat) => (
            <CategoryChip key={cat.id} category={cat} dark />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

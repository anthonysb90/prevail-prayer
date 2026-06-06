import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { PrayerRequest } from "@/types";
import { CategoryChip } from "./CategoryChip";

interface PrayerCardProps {
  prayer: PrayerRequest;
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/prayer/${prayer.id}`)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: prayer.is_urgent ? 3 : 0,
        borderLeftColor: "#E53E3E",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
      activeOpacity={0.8}
    >
      {prayer.is_urgent && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Ionicons name="alert-circle" size={13} color="#E53E3E" />
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
      )}

      <Text
        style={{
          fontFamily: "DMSans-SemiBold",
          fontSize: 15,
          color: "#1A1A1A",
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {prayer.title}
      </Text>

      {prayer.description ? (
        <Text
          style={{
            fontFamily: "DMSans-Regular",
            fontSize: 13,
            color: "#4A4A4A",
            marginBottom: 10,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {prayer.description}
        </Text>
      ) : null}

      {prayer.categories && prayer.categories.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {prayer.categories.map((cat) => (
            <CategoryChip key={cat.id} category={cat} />
          ))}
        </View>
      )}

      <Text
        style={{
          fontFamily: "DMSans-Regular",
          fontSize: 11,
          color: "#8A8A8A",
        }}
      >
        {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
      </Text>
    </TouchableOpacity>
  );
}

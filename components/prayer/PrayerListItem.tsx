import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PrayerRequest } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

interface PrayerListItemProps {
  prayer: PrayerRequest;
}

export function PrayerListItem({ prayer }: PrayerListItemProps) {
  const router = useRouter();
  const cats = prayer.categories ?? [];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/prayer/${prayer.id}`)}
      activeOpacity={0.8}
      style={{
        backgroundColor: Theme.darkSurface,
        borderRadius: Theme.radius.inner,
        borderWidth: 1,
        borderColor: Theme.darkBorder,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            {prayer.is_urgent && <Icon name="flame" size={15} color={Theme.urgent} />}
            <Text
              style={{ fontFamily: Theme.font.serif, fontSize: 17, color: Theme.darkText, flex: 1 }}
              numberOfLines={1}
            >
              {prayer.title}
            </Text>
          </View>

          {prayer.description ? (
            <Text
              style={{
                fontFamily: Theme.font.sans,
                fontSize: 13.5,
                color: Theme.darkMuted,
                lineHeight: 19,
                marginTop: 5,
              }}
              numberOfLines={2}
            >
              {prayer.description}
            </Text>
          ) : null}

          {cats.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
              {cats.map((cat) => (
                <View
                  key={cat.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: Theme.radius.pill,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.darkMuted }}>
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ marginTop: 3 }}>
          <Icon name="right" size={18} color={Theme.darkMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

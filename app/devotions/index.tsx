import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useDevotions } from "@/hooks/useDevotions";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { Devotion } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

function DevotionRow({ devotion }: { devotion: Devotion }) {
  const router = useRouter();
  const { isPremium, showPaywall } = useSubscriptionStore();
  const onPress = () => { if (!isPremium) return showPaywall(); router.push(`/devotions/${devotion.id}`); };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder,
        marginBottom: 12, overflow: "hidden", flexDirection: "row", ...Theme.shadow,
      }}
    >
      {devotion.image_url ? (
        <Image source={{ uri: devotion.image_url }} style={{ width: 92, height: 92 }} resizeMode="cover" />
      ) : (
        <View style={{ width: 92, height: 92, backgroundColor: "#C7C4E2", alignItems: "center", justifyContent: "center" }}>
          <Icon name="cross" size={26} color="rgba(255,255,255,0.9)" />
        </View>
      )}
      <View style={{ flex: 1, padding: 14, justifyContent: "center" }}>
        {devotion.published_at && (
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginBottom: 4 }}>
            {format(new Date(devotion.published_at), "MMMM d, yyyy")}
          </Text>
        )}
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 17, color: Theme.text, lineHeight: 23, marginBottom: 4 }} numberOfLines={2}>
          {devotion.title}
        </Text>
        {devotion.scripture_reference && (
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 12, color: Theme.primary }}>{devotion.scripture_reference}</Text>
        )}
      </View>
      <View style={{ justifyContent: "center", paddingRight: 14 }}>
        <Icon name={isPremium ? "right" : "lock"} size={18} color={Theme.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

export default function DevotionsArchiveScreen() {
  const router = useRouter();
  const { data: devotions = [], isLoading, refetch } = useDevotions();

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 22, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
        <View>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text }}>Devotions</Text>
          {devotions.length > 0 && (
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginTop: 2 }}>
              {devotions.length} {devotions.length === 1 ? "devotion" : "devotions"}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={Theme.primary} /></View>
      ) : devotions.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="book" size={44} color={Theme.textFaint} />
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", marginTop: 14, lineHeight: 22 }}>
            No devotions published yet.{"\n"}Check back soon.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Theme.primary} />}
        >
          {devotions.map((d: Devotion) => <DevotionRow key={d.id} devotion={d} />)}
        </ScrollView>
      )}
    </View>
  );
}

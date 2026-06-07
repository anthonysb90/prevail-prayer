import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import { usePrayerRequest, useDeletePrayer, useMarkAnswered, useChangeStatus } from "@/hooks/usePrayers";
import { CategoryChip } from "@/components/prayer/CategoryChip";
import { PrayerStatus, PrayerRequest, Category } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const STATUS_COLOR: Record<PrayerStatus, string> = {
  active: Theme.primary,
  ongoing: "#7A5BD0",
  answered: Theme.success,
  completed: Theme.textFaint,
};
const STATUS_LABEL: Record<PrayerStatus, string> = {
  active: "Active", ongoing: "Ongoing", answered: "Answered", completed: "Completed",
};

export default function PrayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prayer, isLoading } = usePrayerRequest(id) as { data: PrayerRequest | undefined; isLoading: boolean };
  const deletePrayer = useDeletePrayer();
  const markAnswered = useMarkAnswered();
  const changeStatus = useChangeStatus();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }
  if (!prayer) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: Theme.font.sans, color: Theme.textMuted }}>Prayer request not found.</Text>
      </View>
    );
  }

  const status = prayer.status;

  const handleDelete = () => {
    Alert.alert(
      "Delete Prayer Request",
      "This will permanently delete this request and any linked journal entries.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => { await deletePrayer.mutateAsync(prayer.id); router.back(); } },
      ]
    );
  };
  const handleMarkAnswered = () => {
    Alert.prompt(
      "Mark as Answered", "How did God answer this prayer? (optional)",
      async (notes) => { await markAnswered.mutateAsync({ id: prayer.id, notes }); Alert.alert("Praise God!", "This prayer has been marked as answered."); },
      "plain-text", prayer.answer_notes ?? ""
    );
  };
  const handleShare = async () => {
    const tags = prayer.categories?.map((c: Category) => c.name).join(", ");
    let text = `Prayer Request: ${prayer.title}`;
    if (prayer.description) text += "\n\n" + prayer.description;
    if (tags) text += "\n\nCategories: " + tags;
    await Share.share({ message: text });
  };
  const handleStatusChange = (newStatus: PrayerStatus) => {
    if (newStatus === "answered") return handleMarkAnswered();
    Alert.alert("Change Status", `Move this request to "${STATUS_LABEL[newStatus]}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => changeStatus.mutateAsync({ id: prayer.id, status: newStatus }) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <TouchableOpacity onPress={handleShare}><Icon name="share" size={21} color={Theme.text} /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/prayer/edit/${prayer.id}`)}><Icon name="edit" size={21} color={Theme.text} /></TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}><Icon name="trash" size={21} color={Theme.urgent} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        {prayer.is_urgent && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Icon name="flame" size={16} color={Theme.urgent} />
            <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.urgent, textTransform: "uppercase", letterSpacing: 1 }}>Urgent</Text>
          </View>
        )}

        <Text style={{ fontFamily: Theme.font.serif, fontSize: 27, color: Theme.text, lineHeight: 35, marginBottom: 12 }}>{prayer.title}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: Theme.radius.pill, backgroundColor: STATUS_COLOR[status] + "1F" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 12, color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</Text>
          </View>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textFaint }}>
            Added {format(new Date(prayer.created_at), "MMM d, yyyy")}
          </Text>
        </View>

        {prayer.categories && prayer.categories.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
            {prayer.categories.map((cat: Category) => <CategoryChip key={cat.id} category={cat} />)}
          </View>
        )}

        {prayer.description && (
          <View style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder, padding: 18, marginBottom: 18, ...Theme.shadow }}>
            <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.primary, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Details</Text>
            <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 16, color: Theme.text, lineHeight: 25 }}>{prayer.description}</Text>
          </View>
        )}

        {status === "answered" && prayer.answer_notes && (
          <View style={{ backgroundColor: "#ECF8F2", borderRadius: Theme.radius.card, borderWidth: 1, borderColor: "#CDEBDD", padding: 18, marginBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon name="check" size={16} color={Theme.success} />
              <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.success, textTransform: "uppercase", letterSpacing: 1 }}>
                Answered{prayer.answered_at ? " " + format(new Date(prayer.answered_at), "MMM d, yyyy") : ""}
              </Text>
            </View>
            <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 16, color: Theme.text, lineHeight: 25 }}>{prayer.answer_notes}</Text>
          </View>
        )}

        {status !== "answered" && status !== "completed" && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.primary, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Update Status</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(["answered", "completed", "ongoing", "active"] as PrayerStatus[]).filter((s) => s !== status).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleStatusChange(s)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Theme.radius.pill,
                    backgroundColor: s === "answered" ? Theme.success : Theme.card,
                    borderWidth: 1, borderColor: s === "answered" ? Theme.success : Theme.cardBorder,
                  }}
                >
                  {s === "answered" && <Icon name="check" size={15} color="#FFFFFF" />}
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: s === "answered" ? "#FFFFFF" : Theme.textMuted }}>
                    {s === "answered" ? "Mark Answered" : "Move to " + STATUS_LABEL[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

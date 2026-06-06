import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow, format } from "date-fns";
import { usePrayerRequest, useDeletePrayer, useMarkAnswered, useChangeStatus } from "@/hooks/usePrayers";
import { CategoryChip } from "@/components/prayer/CategoryChip";
import { PrayerStatus } from "@/types";

const STATUS_COLOR: Record<PrayerStatus, string> = {
  active: "#2196F3",
  ongoing: "#9C27B0",
  answered: "#4CAF50",
  completed: "#8A8A8A",
};

const STATUS_LABEL: Record<PrayerStatus, string> = {
  active: "Active",
  ongoing: "Ongoing",
  answered: "Answered",
  completed: "Completed",
};

export default function PrayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prayer, isLoading } = usePrayerRequest(id);
  const deletePrayer = useDeletePrayer();
  const markAnswered = useMarkAnswered();
  const changeStatus = useChangeStatus();
  const [showAnswerInput, setShowAnswerInput] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream-100 items-center justify-center">
        <ActivityIndicator color="#F5B942" />
      </View>
    );
  }

  if (!prayer) {
    return (
      <View className="flex-1 bg-cream-100 items-center justify-center">
        <Text className="text-charcoal-400" style={{ fontFamily: "DMSans-Regular" }}>
          Prayer request not found.
        </Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Prayer Request",
      "This will permanently delete this request and any linked journal entries.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePrayer.mutateAsync(prayer.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkAnswered = () => {
    Alert.prompt(
      "Mark as Answered",
      "How did God answer this prayer? (optional)",
      async (notes) => {
        await markAnswered.mutateAsync({ id: prayer.id, notes });
        Alert.alert("Praise God!", "This prayer has been marked as answered.");
      },
      "plain-text",
      prayer.answer_notes ?? ""
    );
  };

  const handleShare = async () => {
    const tags = prayer.categories?.map((c) => c.name).join(", ");
    let text = `Prayer Request: ${prayer.title}`;
    if (prayer.description) text += "\n\n" + prayer.description;
    if (tags) text += "\n\nCategories: " + tags;
    await Share.share({ message: text });
  };

  const handleStatusChange = (newStatus: PrayerStatus) => {
    if (newStatus === "answered") { handleMarkAnswered(); return; }
    Alert.alert(
      "Change Status",
      `Move this request to "${STATUS_LABEL[newStatus]}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => changeStatus.mutateAsync({ id: prayer.id, status: newStatus }),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-cream-100">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/prayer/edit/${prayer.id}`)}>
            <Ionicons name="create-outline" size={22} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {/* Urgent badge */}
        {prayer.is_urgent && (
          <View className="flex-row items-center mb-3">
            <Ionicons name="alert-circle" size={16} color="#E53E3E" />
            <Text
              style={{ fontFamily: "DMSans-SemiBold", fontSize: 12, color: "#E53E3E", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Urgent
            </Text>
          </View>
        )}

        {/* Title */}
        <Text
          style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26, color: "#1A1A1A", marginBottom: 12, lineHeight: 34 }}
        >
          {prayer.title}
        </Text>

        {/* Status + Date row */}
        <View className="flex-row items-center gap-3 mb-5">
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 100,
              backgroundColor: STATUS_COLOR[prayer.status] + "20",
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans-SemiBold",
                fontSize: 12,
                color: STATUS_COLOR[prayer.status],
              }}
            >
              {STATUS_LABEL[prayer.status]}
            </Text>
          </View>
          <Text
            style={{ fontFamily: "DMSans-Regular", fontSize: 13, color: "#8A8A8A" }}
          >
            Added {format(new Date(prayer.created_at), "MMM d, yyyy")}
          </Text>
        </View>

        {/* Categories */}
        {prayer.categories && prayer.categories.length > 0 && (
          <View className="flex-row flex-wrap mb-5">
            {prayer.categories.map((cat) => (
              <CategoryChip key={cat.id} category={cat} />
            ))}
          </View>
        )}

        {/* Description */}
        {prayer.description && (
          <View className="bg-white rounded-2xl p-5 mb-5">
            <Text
              style={{ fontFamily: "DMSans-Medium", fontSize: 12, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}
            >
              Details
            </Text>
            <Text
              style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#1A1A1A", lineHeight: 24 }}
            >
              {prayer.description}
            </Text>
          </View>
        )}

        {/* Answer notes (if answered) */}
        {prayer.status === "answered" && prayer.answer_notes && (
          <View className="bg-green-50 rounded-2xl p-5 mb-5 border border-green-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text
                style={{ fontFamily: "DMSans-SemiBold", fontSize: 12, color: "#4CAF50", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Answered
                {prayer.answered_at
                  ? " " + format(new Date(prayer.answered_at), "MMM d, yyyy")
                  : ""}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#1A1A1A", lineHeight: 24 }}
            >
              {prayer.answer_notes}
            </Text>
          </View>
        )}

        {/* Status Actions */}
        {prayer.status !== "answered" && prayer.status !== "completed" && (
          <View className="mb-6">
            <Text
              style={{ fontFamily: "DMSans-Medium", fontSize: 12, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}
            >
              Update Status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(["answered", "completed", "ongoing", "active"] as PrayerStatus[])
                .filter((s) => s !== prayer.status)
                .map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleStatusChange(s)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 100,
                      backgroundColor: s === "answered" ? "#4CAF50" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: s === "answered" ? "#4CAF50" : "#EDE5D8",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "DMSans-SemiBold",
                        fontSize: 13,
                        color: s === "answered" ? "#FFFFFF" : "#4A4A4A",
                      }}
                    >
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

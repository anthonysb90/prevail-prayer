import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/hooks/useCategories";
import { usePrayerRequest, useUpdatePrayer } from "@/hooks/usePrayers";
import { PrayerStatus } from "@/types";

const STATUS_OPTIONS: { value: PrayerStatus; label: string }[] = [
  { value: "active",    label: "Active" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

function EditForm({ prayerId }: { prayerId: string }) {
  const router = useRouter();
  const { data: prayer, isLoading: prayerLoading } = usePrayerRequest(prayerId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const updatePrayer = useUpdatePrayer();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [status, setStatus] = useState<PrayerStatus>("active");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Pre-populate form once prayer data loads
  useEffect(() => {
    if (prayer && !initialized) {
      setTitle(prayer.title);
      setDescription(prayer.description ?? "");
      setIsUrgent(prayer.is_urgent);
      setStatus(prayer.status === "answered" ? "active" : prayer.status);
      setSelectedCategoryIds(prayer.categories?.map((c) => c.id) ?? []);
      setInitialized(true);
    }
  }, [prayer, initialized]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Please add a title.");
      return;
    }
    try {
      await updatePrayer.mutateAsync({
        id: prayerId,
        title,
        description: description.trim() || null,
        status,
        is_urgent: isUrgent,
        categoryIds: selectedCategoryIds,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error saving changes", e.message);
    }
  };

  if (prayerLoading || !initialized) {
    return (
      <View className="flex-1 bg-cream-100 items-center justify-center">
        <ActivityIndicator color="#F5B942" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }} className="text-charcoal-900">
          Edit Prayer Request
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={updatePrayer.isPending}>
          {updatePrayer.isPending ? (
            <ActivityIndicator size="small" color="#F5B942" />
          ) : (
            <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Title */}
        <TextInput
          className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900 mb-4"
          style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
          placeholder="What are you praying for?"
          placeholderTextColor="#8A8A8A"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <TextInput
          className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900 mb-4"
          style={{ fontFamily: "DMSans-Regular", fontSize: 15, minHeight: 100, textAlignVertical: "top" }}
          placeholder="Details, Scripture, or context (optional)..."
          placeholderTextColor="#8A8A8A"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        {/* Urgent toggle */}
        <TouchableOpacity
          className={`flex-row items-center rounded-xl px-4 py-4 mb-4 border ${
            isUrgent ? "bg-red-50 border-red-200" : "bg-white border-cream-200"
          }`}
          onPress={() => setIsUrgent(!isUrgent)}
        >
          <Ionicons
            name={isUrgent ? "alert-circle" : "alert-circle-outline"}
            size={20}
            color={isUrgent ? "#E53E3E" : "#8A8A8A"}
          />
          <Text
            className={`ml-3 text-base ${isUrgent ? "text-red-600" : "text-charcoal-600"}`}
            style={{ fontFamily: "DMSans-Medium" }}
          >
            Mark as Urgent
          </Text>
        </TouchableOpacity>

        {/* Status */}
        <Text className="text-charcoal-600 text-sm mb-2" style={{ fontFamily: "DMSans-Medium" }}>
          Status
        </Text>
        <View className="flex-row gap-2 mb-6 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              className={`rounded-full py-3 px-5 border ${
                status === opt.value
                  ? "bg-charcoal-900 border-charcoal-900"
                  : "bg-white border-cream-200"
              }`}
              onPress={() => setStatus(opt.value)}
            >
              <Text
                className={status === opt.value ? "text-white" : "text-charcoal-600"}
                style={{ fontFamily: "DMSans-Medium", fontSize: 14 }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <Text className="text-charcoal-600 text-sm mb-3" style={{ fontFamily: "DMSans-Medium" }}>
          Categories
        </Text>
        {categoriesLoading ? (
          <ActivityIndicator color="#F5B942" style={{ marginBottom: 16 }} />
        ) : (
          <View className="flex-row flex-wrap gap-2 mb-10">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: isSelected ? cat.color_bg : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: isSelected ? cat.color_border : "#EDE5D8",
                  }}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text
                    style={{
                      fontFamily: "DMSans-Medium",
                      fontSize: 13,
                      color: isSelected ? cat.color_border : "#4A4A4A",
                    }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EditPrayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditForm prayerId={id} />;
}

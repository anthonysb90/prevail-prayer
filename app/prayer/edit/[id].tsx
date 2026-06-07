import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCategories } from "@/hooks/useCategories";
import { usePrayerRequest, useUpdatePrayer } from "@/hooks/usePrayers";
import { PrayerStatus, PrayerRequest, Category } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

const STATUS_OPTIONS: { value: PrayerStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const inputStyle = {
  backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14,
  fontFamily: Theme.font.sans, fontSize: 16, color: Theme.text, marginBottom: 14,
} as const;

const fieldLabel = {
  fontFamily: Theme.font.sansBold as string, fontSize: 12, color: Theme.primary,
  textTransform: "uppercase" as const, letterSpacing: 1.5, marginBottom: 10,
};

function EditForm({ prayerId }: { prayerId: string }) {
  const router = useRouter();
  const { data: prayer, isLoading: prayerLoading } = usePrayerRequest(prayerId) as { data: PrayerRequest | undefined; isLoading: boolean };
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const updatePrayer = useUpdatePrayer();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [status, setStatus] = useState<PrayerStatus>("active");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (prayer && !initialized) {
      setTitle(prayer.title);
      setDescription(prayer.description ?? "");
      setIsUrgent(prayer.is_urgent);
      setStatus(prayer.status === "answered" ? "active" : prayer.status);
      setSelectedCategoryIds(prayer.categories?.map((c: Category) => c.id) ?? []);
      setInitialized(true);
    }
  }, [prayer, initialized]);

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Please add a title.");
    try {
      await updatePrayer.mutateAsync({ id: prayerId, title, description: description.trim() || null, status, is_urgent: isUrgent, categoryIds: selectedCategoryIds });
      router.back();
    } catch (e: any) {
      Alert.alert("Error saving changes", e.message);
    }
  };

  if (prayerLoading || !initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="x" size={24} color={Theme.text} /></TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>Edit Request</Text>
        <TouchableOpacity onPress={handleSave} disabled={updatePrayer.isPending}>
          {updatePrayer.isPending ? <ActivityIndicator size="small" color={Theme.primary} />
            : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: title.trim() ? Theme.primary : Theme.textFaint }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 22 }} keyboardShouldPersistTaps="handled">
        <TextInput
          style={inputStyle as any}
          placeholder="What are you praying for?" placeholderTextColor={Theme.textFaint}
          value={title} onChangeText={setTitle}
        />
        <TextInput
          style={[inputStyle, { minHeight: 100, textAlignVertical: "top", fontSize: 15 }] as any}
          placeholder="Details, Scripture, or context (optional)..." placeholderTextColor={Theme.textFaint}
          value={description} onChangeText={setDescription} multiline numberOfLines={4}
        />

        <TouchableOpacity
          onPress={() => setIsUrgent(!isUrgent)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: isUrgent ? "#FBEAEE" : Theme.card,
            borderWidth: 1, borderColor: isUrgent ? "#F2C2CC" : Theme.cardBorder,
            borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
          }}
        >
          <Icon name="flame" size={20} color={isUrgent ? Theme.urgent : Theme.textFaint} />
          <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: isUrgent ? Theme.urgent : Theme.textMuted }}>Mark as Urgent</Text>
        </TouchableOpacity>

        <Text style={fieldLabel}>Status</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {STATUS_OPTIONS.map((opt) => {
            const on = status === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                style={{
                  paddingHorizontal: 20, paddingVertical: 12, borderRadius: Theme.radius.pill,
                  backgroundColor: on ? Theme.primary : Theme.card,
                  borderWidth: 1, borderColor: on ? Theme.primary : Theme.cardBorder,
                }}
              >
                <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: on ? "#FFFFFF" : Theme.textMuted }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={fieldLabel}>Categories</Text>
        {categoriesLoading ? (
          <ActivityIndicator color={Theme.primary} style={{ marginBottom: 16 }} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {categories.map((cat: Category) => {
              const on = selectedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.pill,
                    backgroundColor: on ? (cat.color_bg ?? Theme.primarySoft) : Theme.card,
                    borderWidth: 1, borderColor: on ? (cat.color_border ?? Theme.primary) : Theme.cardBorder,
                  }}
                >
                  <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: on ? (cat.color_border ?? Theme.primary) : Theme.textMuted }}>{cat.name}</Text>
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

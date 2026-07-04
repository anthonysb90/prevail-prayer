import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreatePrayer } from "@/hooks/usePrayers";
import { PrayerStatus, Category } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";
import { PhotoPickerField } from "@/components/prayer/PhotoPickerField";
import { uploadPrayerImage } from "@/lib/prayerImages";
import { useAuthStore } from "@/stores/authStore";
import { PrivacyNote } from "@/components/ui/PrivacyNote";
import {
  ReminderPickerModal, ensureNotificationPermission, reminderDraftLabel, type ReminderDraft,
} from "@/components/prayer/ReminderPickerModal";
import { createReminder } from "@/lib/prayerReminders";

const STATUS_OPTIONS: { value: PrayerStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "ongoing", label: "Ongoing" },
];

const mkInputStyle = (Theme: AppTheme) => ({
  backgroundColor: Theme.card,
  borderWidth: 1,
  borderColor: Theme.cardBorder,
  borderRadius: Theme.radius.inner,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontFamily: Theme.font.sans,
  fontSize: 16,
  color: Theme.text,
  marginBottom: 14,
} as const);

const mkFieldLabel = (Theme: AppTheme) => ({
  fontFamily: Theme.font.sansBold as string,
  fontSize: 12,
  color: Theme.primary,
  textTransform: "uppercase" as const,
  letterSpacing: 1.5,
  marginBottom: 10,
});

export default function NewPrayerScreen() {
    const Theme = useTheme();
    const inputStyle = mkInputStyle(Theme);
    const fieldLabel = mkFieldLabel(Theme);
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createPrayer = useCreatePrayer();
  const createCat = useCreateCategory();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [status, setStatus] = useState<PrayerStatus>("active");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [reminder, setReminder] = useState<ReminderDraft | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const openReminderPicker = async () => {
    if (!(await ensureNotificationPermission())) return;
    setShowReminderModal(true);
  };

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const handleAddCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    try {
      const cat = await createCat.mutateAsync(name);
      setNewCat("");
      setSelectedCategoryIds((prev) => [...prev, cat.id]);
    } catch (e: any) {
      Alert.alert("Couldn't add category", e?.message ?? "Please try again.");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Please add a title for your prayer request.");
    try {
      let image_path: string | null = null;
      if (imageUri && user) {
        image_path = await uploadPrayerImage(user.id, imageUri);
        if (!image_path) Alert.alert("Photo couldn't be uploaded", "Your request will be saved without the photo.");
      }
      const created = await createPrayer.mutateAsync({ title, description, status, is_urgent: isUrgent, categoryIds: selectedCategoryIds, image_path });
      analytics.capture("prayer_added", { is_urgent: isUrgent, status });
      // Schedule the reminder the user configured (if any) now that the request has an id.
      if (reminder && user && created?.id) {
        try {
          if (reminder.scheduleType === "once" && reminder.fireAt && reminder.fireAt.getTime() < Date.now() + 30_000) {
            Alert.alert("Reminder not set", "The reminder time has already passed. Your request was saved — you can add a new reminder from the request.");
          } else {
            await createReminder(user.id, { prayerId: created.id, ...reminder }, title, description?.trim() || null);
            analytics.capture("prayer_reminder_added_on_create", { schedule: reminder.scheduleType });
          }
        } catch {
          Alert.alert("Reminder not set", "Your request was saved, but the reminder couldn't be scheduled. You can add it from the request.");
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error saving prayer request", e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="x" size={24} color={Theme.text} /></TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>New Request</Text>
        <TouchableOpacity onPress={handleSave} disabled={createPrayer.isPending}>
          {createPrayer.isPending ? <ActivityIndicator size="small" color={Theme.primary} />
            : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: title.trim() ? Theme.primary : Theme.textFaint }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 22 }} keyboardShouldPersistTaps="handled">
        <PrivacyNote
          text="Completely private. No one else can see your prayer requests — only you."
          style={{ marginBottom: 14 }}
        />
        <TextInput
          style={inputStyle as any}
          placeholder="What are you praying for?"
          placeholderTextColor={Theme.textFaint}
          value={title} onChangeText={setTitle} autoFocus
        />
        <TextInput
          style={[inputStyle, { minHeight: 100, textAlignVertical: "top", fontSize: 15 }] as any}
          placeholder="Add details, Scripture, or context (optional)..."
          placeholderTextColor={Theme.textFaint}
          value={description} onChangeText={setDescription} multiline numberOfLines={4}
        />

        <Text style={fieldLabel}>Photo</Text>
        <PhotoPickerField
          localUri={imageUri}
          onPick={setImageUri}
          onClear={() => setImageUri(null)}
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

        <Text style={fieldLabel}>Reminder</Text>
        {reminder ? (
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
              borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
            }}
          >
            <Icon name="bell" size={20} color={Theme.primary} />
            <TouchableOpacity onPress={openReminderPicker} style={{ flex: 1 }}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text }}>{reminderDraftLabel(reminder)}</Text>
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, marginTop: 1 }}>Set when you save this request. Tap to change.</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReminder(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="x" size={18} color={Theme.textFaint} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={openReminderPicker}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder,
              borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
            }}
          >
            <Icon name="bell" size={20} color={Theme.textFaint} />
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 15, color: Theme.textMuted }}>Remind me to pray for this</Text>
          </TouchableOpacity>
        )}

        <Text style={fieldLabel}>Request Type</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          {STATUS_OPTIONS.map((opt) => {
            const on = status === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: Theme.radius.pill,
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
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.pill, borderWidth: 1, borderStyle: "dashed", borderColor: Theme.cardBorder, backgroundColor: Theme.card }}>
              <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 15, color: Theme.primary, marginRight: 5 }}>+</Text>
              <TextInput
                value={newCat}
                onChangeText={setNewCat}
                placeholder="New"
                placeholderTextColor={Theme.textFaint}
                onSubmitEditing={handleAddCategory}
                returnKeyType="done"
                style={{ minWidth: 46, padding: 0, fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.text }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <ReminderPickerModal
        visible={showReminderModal}
        title={title.trim() || "Your prayer request"}
        onClose={() => setShowReminderModal(false)}
        onSave={(draft) => { setReminder(draft); setShowReminderModal(false); }}
      />
    </KeyboardAvoidingView>
  );
}

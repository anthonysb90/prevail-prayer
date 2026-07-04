import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import {
  listReminders, createReminder, setReminderEnabled, deleteReminder, reminderLabel,
  type PrayerReminder,
} from "@/lib/prayerReminders";
import {
  ReminderPickerModal, ensureNotificationPermission, type ReminderDraft,
} from "@/components/prayer/ReminderPickerModal";

interface PrayerRemindersProps {
  prayerId: string;
  title: string;
  detail?: string | null;
}

export function PrayerReminders({ prayerId, title, detail }: PrayerRemindersProps) {
  const Theme = useTheme();
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listReminders(prayerId).then((r) => { setReminders(r); setLoading(false); });
  }, [prayerId]);

  const openAdd = async () => {
    if (!(await ensureNotificationPermission())) return;
    setShowModal(true);
  };

  const handleSave = async (draft: ReminderDraft) => {
    if (!user) return;
    setSaving(true);
    try {
      const created = await createReminder(
        user.id,
        { prayerId, ...draft },
        title,
        detail,
      );
      setReminders((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (e: any) {
      Alert.alert("Couldn't set reminder", e.message ?? "Please try again.");
    }
    setSaving(false);
  };

  const handleToggle = async (r: PrayerReminder) => {
    const next = !r.enabled;
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: next } : x)));
    try { await setReminderEnabled(r, next, title, detail); }
    catch { setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: r.enabled } : x))); }
  };

  const handleDelete = (r: PrayerReminder) => {
    Alert.alert("Delete reminder", "Remove this prayer reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setReminders((prev) => prev.filter((x) => x.id !== r.id));
          await deleteReminder(r);
        },
      },
    ]);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.primary, textTransform: "uppercase", letterSpacing: 1.5 }}>Reminders</Text>
        <TouchableOpacity onPress={openAdd} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Icon name="plus" size={16} color={Theme.primary} />
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}>Add reminder</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Theme.primary} />
      ) : reminders.length === 0 ? (
        <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textFaint, lineHeight: 21 }}>
          Set a reminder to pray — once for a specific moment (like a surgery), or recurring (like a weekly treatment). The reminder includes this request and its details.
        </Text>
      ) : (
        reminders.map((r) => (
          <View key={r.id} style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon name="bell" size={18} color={r.enabled ? Theme.primary : Theme.textFaint} />
            <Text style={{ flex: 1, fontFamily: Theme.font.sansSemi, fontSize: 14, color: r.enabled ? Theme.text : Theme.textFaint }}>{reminderLabel(r)}</Text>
            <TouchableOpacity onPress={() => handleToggle(r)}>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: r.enabled ? Theme.primary : Theme.textFaint }}>{r.enabled ? "On" : "Off"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(r)}>
              <Icon name="trash" size={16} color={Theme.textFaint} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <ReminderPickerModal
        visible={showModal}
        title={title}
        saving={saving}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </View>
  );
}

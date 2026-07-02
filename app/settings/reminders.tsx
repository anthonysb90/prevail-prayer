import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { scheduleLocalReminder, cancelReminder, requestPushPermission } from "@/lib/notifications";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Reminder {
  id: string;
  recurrence_type: "daily" | "weekly";
  days_of_week: number[] | null;
  reminder_time: string;
  is_active: boolean;
}

const pad = (n: number) => n.toString().padStart(2, "0");

// Custom number stepper (chevron up / value / chevron down) — fully in-JS so it
// can never render invisibly the way the native time picker did on iOS.
function Stepper({ value, onUp, onDown }: { value: string; onUp: () => void; onDown: () => void }) {
  const Theme = useTheme();
  return (
    <View style={{ alignItems: "center" }}>
      <TouchableOpacity onPress={onUp} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} style={{ padding: 4 }}>
        <Ionicons name="chevron-up" size={24} color={Theme.primary} />
      </TouchableOpacity>
      <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 38, color: Theme.text, minWidth: 54, textAlign: "center" }}>
        {value}
      </Text>
      <TouchableOpacity onPress={onDown} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} style={{ padding: 4 }}>
        <Ionicons name="chevron-down" size={24} color={Theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

function RemindersContent() {
  const Theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [recurrence, setRecurrence] = useState<"daily" | "weekly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Mon default
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("reminder_type", "general")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReminders((data as Reminder[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  // ── Time parts (12-hour) derived from the `time` Date ──────────────────────
  const h24 = time.getHours();
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const minute = time.getMinutes();

  const setParts = (nh12: number, nmin: number, nperiod: "AM" | "PM") => {
    let h = nh12 % 12;
    if (nperiod === "PM") h += 12;
    const d = new Date(time);
    d.setHours(h, nmin, 0, 0);
    setTime(d);
  };
  const stepHour = (dir: number) => setParts(((h12 - 1 + dir + 12) % 12) + 1, minute, period);
  const stepMin = (dir: number) => setParts(h12, (minute + dir * 5 + 60) % 60, period);

  const toggleDay = (day: number) =>
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  // ── Notification helpers ───────────────────────────────────────────────────
  const cancelAllFor = async (id: string) => {
    await cancelReminder(`reminder_${id}`);
    for (let d = 0; d < 7; d++) await cancelReminder(`reminder_${id}_day${d}`);
  };
  const scheduleFor = async (id: string) => {
    const body = "Time to pray. Open your prayer list.";
    if (recurrence === "daily") {
      await scheduleLocalReminder({
        title: "Prevail Prayer", body,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.getHours(), minute: time.getMinutes() },
        identifier: `reminder_${id}`,
      });
    } else {
      for (const dayIndex of selectedDays) {
        await scheduleLocalReminder({
          title: "Prevail Prayer", body,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: dayIndex + 1, hour: time.getHours(), minute: time.getMinutes() },
          identifier: `reminder_${id}_day${dayIndex}`,
        });
      }
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setRecurrence("daily");
    setSelectedDays([1]);
    setTime(new Date(new Date().setHours(8, 0, 0, 0)));
    setShowModal(true);
  };

  const openEdit = (r: Reminder) => {
    const [h, m] = r.reminder_time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    setTime(d);
    setRecurrence(r.recurrence_type);
    setSelectedDays(r.days_of_week && r.days_of_week.length ? r.days_of_week : [1]);
    setEditingId(r.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (recurrence === "weekly" && selectedDays.length === 0) {
      Alert.alert("Select at least one day.");
      return;
    }
    if (!user) return;
    setSaving(true);

    // Ask for notification permission here — the first time it's actually needed —
    // rather than cold at login. If denied, the reminder is still saved so it
    // works once the user enables notifications in Settings.
    const granted = await requestPushPermission(user.id);
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "Your reminder is saved, but you won't get an alert until you turn on notifications for Prevail Prayer in your device Settings."
      );
    }

    const row = {
      recurrence_type: recurrence,
      days_of_week: recurrence === "weekly" ? [...selectedDays].sort() : null,
      reminder_time: `${pad(time.getHours())}:${pad(time.getMinutes())}:00`,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("reminders").update(row).eq("id", editingId);
        if (error) throw error;
        await cancelAllFor(editingId);
        await scheduleFor(editingId);
        setReminders((prev) => prev.map((r) => (r.id === editingId ? ({ ...r, ...row } as Reminder) : r)));
      } else {
        const { data: reminder, error } = await supabase
          .from("reminders")
          .insert({ user_id: user.id, reminder_type: "general", ...row, is_active: true })
          .select()
          .single();
        if (error) throw error;
        await scheduleFor(reminder.id);
        setReminders((prev) => [reminder as Reminder, ...prev]);
      }
      setShowModal(false);
      setEditingId(null);
    } catch (e: any) {
      Alert.alert("Error saving reminder", e.message);
    }
    setSaving(false);
  };

  const handleToggle = async (reminder: Reminder) => {
    await supabase.from("reminders").update({ is_active: !reminder.is_active }).eq("id", reminder.id);
    setReminders((prev) => prev.map((r) => (r.id === reminder.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const handleDelete = async (reminder: Reminder) => {
    Alert.alert("Delete Reminder", "This reminder will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("reminders").delete().eq("id", reminder.id);
          await cancelAllFor(reminder.id);
          setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        },
      },
    ]);
  };

  const formatReminderLabel = (r: Reminder) => {
    const [h, m] = r.reminder_time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    const timeStr = format(d, "h:mm a");
    if (r.recurrence_type === "daily") return `Every day at ${timeStr}`;
    const dayNames = (r.days_of_week ?? []).map((i) => DAYS[i]).join(", ");
    return `${dayNames} at ${timeStr}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={22} color={Theme.textMuted} />
          </TouchableOpacity>
          <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 24, color: Theme.text }}>General Reminders</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={{ backgroundColor: Theme.primary, borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 13, color: Theme.textFaint, marginBottom: 20, lineHeight: 19 }}>
          These reminders are not tied to a specific prayer — just a nudge to open the app and pray.
        </Text>

        {loading ? (
          <ActivityIndicator color={Theme.primary} />
        ) : reminders.length === 0 ? (
          <View style={{ backgroundColor: Theme.card, borderRadius: 16, padding: 24, alignItems: "center" }}>
            <Ionicons name="notifications-outline" size={36} color={Theme.cardBorder} />
            <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: Theme.textFaint, textAlign: "center", marginTop: 12 }}>
              No reminders yet.{"\n"}Tap + to add your first one.
            </Text>
          </View>
        ) : (
          reminders.map((r) => (
            <View
              key={r.id}
              style={{ backgroundColor: Theme.card, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center" }}
            >
              <TouchableOpacity onPress={() => openEdit(r)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.7}>
                <Ionicons name="alarm-outline" size={20} color={Theme.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: Theme.text }}>{formatReminderLabel(r)}</Text>
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 12, color: Theme.textFaint, marginTop: 2 }}>Tap to edit</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleToggle(r)} style={{ marginRight: 12 }}>
                <Ionicons name={r.is_active ? "toggle" : "toggle-outline"} size={28} color={r.is_active ? Theme.primary : Theme.textFaint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(r)}>
                <Ionicons name="trash-outline" size={18} color={Theme.textFaint} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / edit reminder modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: Theme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44 }}>
            <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 22, color: Theme.text, marginBottom: 20 }}>
              {editingId ? "Edit Reminder" : "Add Reminder"}
            </Text>

            {/* Frequency */}
            <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Frequency
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["daily", "weekly"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 100,
                    backgroundColor: recurrence === r ? Theme.text : "#FFFFFF",
                    alignItems: "center", borderWidth: 1, borderColor: recurrence === r ? Theme.primary : Theme.cardBorder,
                  }}
                >
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 14, color: recurrence === r ? "#FFFFFF" : Theme.textMuted }}>
                    {r === "daily" ? "Every Day" : "Weekly"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Days (weekly only) */}
            {recurrence === "weekly" && (
              <>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  Days
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                  {DAYS.map((day, i) => {
                    const selected = selectedDays.includes(i);
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => toggleDay(i)}
                        style={{
                          flex: 1, paddingVertical: 8, borderRadius: 10,
                          backgroundColor: selected ? Theme.primary : Theme.card,
                          alignItems: "center", borderWidth: 1, borderColor: selected ? Theme.primary : Theme.cardBorder,
                        }}
                      >
                        <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: selected ? "#FFFFFF" : Theme.textMuted }}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Time — custom stepper picker */}
            <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Time
            </Text>
            <View style={{ backgroundColor: Theme.card, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Stepper value={h12.toString()} onUp={() => stepHour(1)} onDown={() => stepHour(-1)} />
              <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 34, color: Theme.text, marginBottom: 4 }}>:</Text>
              <Stepper value={pad(minute)} onUp={() => stepMin(1)} onDown={() => stepMin(-1)} />
              <View style={{ gap: 8, marginLeft: 8 }}>
                {(["AM", "PM"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setParts(h12, minute, p)}
                    style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: period === p ? Theme.primary : Theme.bg }}
                  >
                    <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: period === p ? "#FFFFFF" : Theme.textMuted }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center" }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                  {editingId ? "Save Changes" : "Add Reminder"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowModal(false); setEditingId(null); }} style={{ alignItems: "center", paddingTop: 14 }}>
              <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: Theme.textFaint }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RemindersScreen() {
  return (
    <PremiumGate
      feature="Prayer Reminders"
      description="Schedule daily or weekly reminders to pray. Never miss your time with God because life got busy."
      icon="notifications-outline"
    >
      <RemindersContent />
    </PremiumGate>
  );
}

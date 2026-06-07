import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { scheduleLocalReminder, cancelReminder } from "@/lib/notifications";
import { format } from "date-fns";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

interface Reminder {
  id: string;
  recurrence_type: "daily" | "weekly";
  days_of_week: number[] | null;
  reminder_time: string;
  is_active: boolean;
}

function RemindersContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New reminder form state
  const [recurrence, setRecurrence] = useState<"daily" | "weekly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Mon default
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAdd = async () => {
    if (recurrence === "weekly" && selectedDays.length === 0) {
      Alert.alert("Select at least one day.");
      return;
    }
    if (!user) return;
    setSaving(true);

    const timeString = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:00`;

    try {
      const { data: reminder, error } = await supabase
        .from("reminders")
        .insert({
          user_id: user.id,
          reminder_type: "general",
          recurrence_type: recurrence,
          days_of_week: recurrence === "weekly" ? selectedDays.sort() : null,
          reminder_time: timeString,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule local notification(s)
      const notificationBody = "Time to pray. Open your prayer list.";

      if (recurrence === "daily") {
        await scheduleLocalReminder({
          title: "Prevail Prayer",
          body: notificationBody,
          trigger: { hour: time.getHours(), minute: time.getMinutes(), repeats: true } as any,
          identifier: `reminder_${reminder.id}`,
        });
      } else {
        // Schedule one notification per selected day
        for (const dayIndex of selectedDays) {
          await scheduleLocalReminder({
            title: "Prevail Prayer",
            body: notificationBody,
            trigger: {
              weekday: dayIndex + 1, // expo uses 1=Sun
              hour: time.getHours(),
              minute: time.getMinutes(),
              repeats: true,
            } as any,
            identifier: `reminder_${reminder.id}_day${dayIndex}`,
          });
        }
      }

      setReminders((prev) => [reminder as Reminder, ...prev]);
      setShowModal(false);
    } catch (e: any) {
      Alert.alert("Error adding reminder", e.message);
    }
    setSaving(false);
  };

  const handleToggle = async (reminder: Reminder) => {
    await supabase
      .from("reminders")
      .update({ is_active: !reminder.is_active })
      .eq("id", reminder.id);
    setReminders((prev) =>
      prev.map((r) => r.id === reminder.id ? { ...r, is_active: !r.is_active } : r)
    );
  };

  const handleDelete = async (reminder: Reminder) => {
    Alert.alert("Delete Reminder", "This reminder will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("reminders").delete().eq("id", reminder.id);

          // Cancel scheduled notifications
          if (reminder.recurrence_type === "daily") {
            await cancelReminder(`reminder_${reminder.id}`);
          } else {
            for (let d = 0; d < 7; d++) {
              await cancelReminder(`reminder_${reminder.id}_day${d}`);
            }
          }

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
    <View style={{ flex: 1, backgroundColor: "#F1EFF9" }}>
      {/* Header */}
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={22} color="#5A5666" />
          </TouchableOpacity>
          <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 24, color: "#1D1B26" }}>
            General Reminders
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: "#5B53C6", borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 13, color: "#9794A4", marginBottom: 20, lineHeight: 19 }}>
          These reminders are not tied to a specific prayer — just a nudge to open the app and pray.
        </Text>

        {loading ? (
          <ActivityIndicator color="#5B53C6" />
        ) : reminders.length === 0 ? (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center" }}>
            <Ionicons name="notifications-outline" size={36} color="#E7E5EF" />
            <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: "#9794A4", textAlign: "center", marginTop: 12 }}>
              No reminders yet.{"\n"}Tap + to add your first one.
            </Text>
          </View>
        ) : (
          reminders.map((r) => (
            <View
              key={r.id}
              style={{
                backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
                marginBottom: 10, flexDirection: "row", alignItems: "center",
              }}
            >
              <Ionicons name="alarm-outline" size={20} color="#5B53C6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: "#1D1B26" }}>
                  {formatReminderLabel(r)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleToggle(r)} style={{ marginRight: 12 }}>
                <Ionicons
                  name={r.is_active ? "toggle" : "toggle-outline"}
                  size={28}
                  color={r.is_active ? "#5B53C6" : "#9794A4"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(r)}>
                <Ionicons name="trash-outline" size={18} color="#9794A4" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add reminder modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: "#F1EFF9", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44 }}>
            <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 22, color: "#1D1B26", marginBottom: 20 }}>
              Add Reminder
            </Text>

            {/* Recurrence type */}
            <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: "#9794A4", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Frequency
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["daily", "weekly"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 100,
                    backgroundColor: recurrence === r ? "#1D1B26" : "#FFFFFF",
                    alignItems: "center",
                    borderWidth: 1, borderColor: recurrence === r ? "#1D1B26" : "#E7E5EF",
                  }}
                >
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 14, color: recurrence === r ? "#FFFFFF" : "#5A5666" }}>
                    {r === "daily" ? "Every Day" : "Weekly"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day picker (weekly only) */}
            {recurrence === "weekly" && (
              <>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: "#9794A4", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
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
                          backgroundColor: selected ? "#5B53C6" : "#FFFFFF",
                          alignItems: "center",
                          borderWidth: 1, borderColor: selected ? "#5B53C6" : "#E7E5EF",
                        }}
                      >
                        <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: selected ? "#FFFFFF" : "#5A5666" }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Time picker */}
            <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 12, color: "#9794A4", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 18, color: "#1D1B26" }}>
                {format(time, "h:mm a")}
              </Text>
              <Ionicons name="time-outline" size={20} color="#9794A4" />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selected) => {
                  setShowTimePicker(false);
                  if (selected) setTime(selected);
                }}
              />
            )}

            <TouchableOpacity
              onPress={handleAdd}
              disabled={saving}
              style={{ backgroundColor: "#5B53C6", borderRadius: 100, paddingVertical: 16, alignItems: "center" }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                  Add Reminder
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ alignItems: "center", paddingTop: 14 }}>
              <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: "#9794A4" }}>Cancel</Text>
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

import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";
import { useTheme } from "@/hooks/useTheme";
import { AppTheme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import {
  listReminders, createReminder, setReminderEnabled, deleteReminder, reminderLabel,
  type PrayerReminder, type ReminderSchedule,
} from "@/lib/prayerReminders";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => n.toString().padStart(2, "0");

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

  // Form state
  const [schedule, setSchedule] = useState<ReminderSchedule>("once");
  const [weekday, setWeekday] = useState(2); // Mon (1=Sun)
  const [dayOffset, setDayOffset] = useState(0); // for "once": days from today
  const [time, setTime] = useState(() => new Date(new Date().setHours(9, 0, 0, 0)));

  useEffect(() => {
    listReminders(prayerId).then((r) => { setReminders(r); setLoading(false); });
  }, [prayerId]);

  const h24 = time.getHours();
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const minute = time.getMinutes();
  const setParts = (nh12: number, nmin: number, np: "AM" | "PM") => {
    let h = nh12 % 12;
    if (np === "PM") h += 12;
    const d = new Date(time);
    d.setHours(h, nmin, 0, 0);
    setTime(d);
  };
  const stepHour = (dir: number) => setParts(((h12 - 1 + dir + 12) % 12) + 1, minute, period);
  const stepMin = (dir: number) => setParts(h12, (minute + dir * 5 + 60) % 60, period);

  const onceDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return d;
  })();
  const onceLabel = dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow"
    : onceDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const openAdd = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== "granted") {
        Alert.alert("Notifications off", "Turn on notifications for Prevail Prayer in Settings to get prayer reminders.");
        return;
      }
    }
    setSchedule("once");
    setWeekday(2);
    setDayOffset(0);
    setTime(new Date(new Date().setHours(9, 0, 0, 0)));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (schedule === "once" && onceDate.getTime() < Date.now() + 30_000) {
      Alert.alert("Pick a future time", "That time has already passed. Choose a later time.");
      return;
    }
    setSaving(true);
    try {
      const created = await createReminder(
        user.id,
        {
          prayerId,
          scheduleType: schedule,
          fireAt: schedule === "once" ? onceDate : undefined,
          weekday: schedule === "weekly" ? weekday : undefined,
          hour: time.getHours(),
          minute: time.getMinutes(),
        },
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

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: Theme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: Theme.font.serif, fontSize: 22, color: Theme.text, marginBottom: 4 }}>Remind me to pray</Text>
            <Text style={{ fontFamily: Theme.font.sans, fontSize: 13, color: Theme.textMuted, marginBottom: 18 }} numberOfLines={2}>{title}</Text>

            <SectionLabel Theme={Theme}>When</SectionLabel>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {(["once", "daily", "weekly"] as ReminderSchedule[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSchedule(s)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 100, alignItems: "center", backgroundColor: schedule === s ? Theme.primary : Theme.card, borderWidth: 1, borderColor: schedule === s ? Theme.primary : Theme.cardBorder }}
                >
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: schedule === s ? "#FFFFFF" : Theme.textMuted }}>{s === "once" ? "One time" : s === "daily" ? "Daily" : "Weekly"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {schedule === "once" && (
              <>
                <SectionLabel Theme={Theme}>Day</SectionLabel>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, backgroundColor: Theme.card, borderRadius: 14, paddingVertical: 12, marginBottom: 18 }}>
                  <TouchableOpacity onPress={() => setDayOffset((d) => Math.max(0, d - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="left" size={22} color={dayOffset === 0 ? Theme.cardBorder : Theme.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 17, color: Theme.text, minWidth: 150, textAlign: "center" }}>{onceLabel}</Text>
                  <TouchableOpacity onPress={() => setDayOffset((d) => Math.min(365, d + 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="right" size={22} color={Theme.primary} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {schedule === "weekly" && (
              <>
                <SectionLabel Theme={Theme}>Day of week</SectionLabel>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 18 }}>
                  {DAYS.map((day, i) => {
                    const wd = i + 1; // 1=Sun
                    const on = weekday === wd;
                    return (
                      <TouchableOpacity key={wd} onPress={() => setWeekday(wd)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", backgroundColor: on ? Theme.primary : Theme.card, borderWidth: 1, borderColor: on ? Theme.primary : Theme.cardBorder }}>
                        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: on ? "#FFFFFF" : Theme.textMuted }}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <SectionLabel Theme={Theme}>Time</SectionLabel>
            <View style={{ backgroundColor: Theme.card, borderRadius: 14, paddingVertical: 14, marginBottom: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Stepper Theme={Theme} value={h12.toString()} onUp={() => stepHour(1)} onDown={() => stepHour(-1)} />
              <Text style={{ fontFamily: Theme.font.serif, fontSize: 32, color: Theme.text, marginBottom: 4 }}>:</Text>
              <Stepper Theme={Theme} value={pad(minute)} onUp={() => stepMin(1)} onDown={() => stepMin(-1)} />
              <View style={{ gap: 8, marginLeft: 8 }}>
                {(["AM", "PM"] as const).map((p) => (
                  <TouchableOpacity key={p} onPress={() => setParts(h12, minute, p)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: period === p ? Theme.primary : Theme.bg }}>
                    <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: period === p ? "#FFFFFF" : Theme.textMuted }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: Theme.primary, borderRadius: 100, paddingVertical: 16, alignItems: "center" }}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Set Reminder</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ alignItems: "center", paddingTop: 14 }}>
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 14, color: Theme.textFaint }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionLabel({ Theme, children }: { Theme: AppTheme; children: string }) {
  return (
    <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{children}</Text>
  );
}

function Stepper({ Theme, value, onUp, onDown }: { Theme: AppTheme; value: string; onUp: () => void; onDown: () => void }) {
  return (
    <View style={{ alignItems: "center" }}>
      <TouchableOpacity onPress={onUp} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} style={{ padding: 4 }}>
        <View style={{ transform: [{ rotate: "180deg" }] }}>
          <Icon name="down" size={22} color={Theme.primary} sw={2} />
        </View>
      </TouchableOpacity>
      <Text style={{ fontFamily: Theme.font.serif, fontSize: 36, color: Theme.text, minWidth: 54, textAlign: "center" }}>{value}</Text>
      <TouchableOpacity onPress={onDown} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} style={{ padding: 4 }}>
        <Icon name="down" size={22} color={Theme.primary} sw={2} />
      </TouchableOpacity>
    </View>
  );
}

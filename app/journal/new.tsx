import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useCreateJournalEntry } from "@/hooks/useJournal";
import { useActivePrayers, useOngoingPrayers } from "@/hooks/usePrayers";
import { PrayerRequest } from "@/types";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const createEntry = useCreateJournalEntry();
  const { data: active = [] } = useActivePrayers();
  const { data: ongoing = [] } = useOngoingPrayers();
  const allPrayers: PrayerRequest[] = [...active, ...ongoing];

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkedPrayerId, setLinkedPrayerId] = useState<string | null>(null);
  const [showPrayerPicker, setShowPrayerPicker] = useState(false);

  const linkedPrayer = allPrayers.find((p) => p.id === linkedPrayerId);

  const handleSave = async () => {
    if (!body.trim()) return Alert.alert("Please write something before saving.");
    try {
      await createEntry.mutateAsync({ title, body, prayer_request_id: linkedPrayerId });
      router.back();
    } catch (e: any) { Alert.alert("Error saving entry", e.message); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="x" size={24} color={Theme.text} /></TouchableOpacity>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>New Entry</Text>
        <TouchableOpacity onPress={handleSave} disabled={createEntry.isPending}>
          {createEntry.isPending ? <ActivityIndicator size="small" color={Theme.primary} />
            : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: body.trim() ? Theme.primary : Theme.textFaint }}>Save</Text>}
        </TouchableOpacity>
      </View>

      {showPrayerPicker ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 22, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Theme.cardBorder }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.text }}>Link a Prayer Request</Text>
            <TouchableOpacity onPress={() => setShowPrayerPicker(false)}><Icon name="x" size={22} color={Theme.text} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 22 }}>
            <TouchableOpacity
              onPress={() => { setLinkedPrayerId(null); setShowPrayerPicker(false); }}
              style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: Theme.cardBorder }}
            >
              <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted }}>No link</Text>
            </TouchableOpacity>
            {allPrayers.map((p) => {
              const on = linkedPrayerId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { setLinkedPrayerId(p.id); setShowPrayerPicker(false); }}
                  style={{ backgroundColor: on ? Theme.primary : Theme.card, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: on ? Theme.primary : Theme.cardBorder }}
                >
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: on ? "#FFFFFF" : Theme.text }} numberOfLines={1}>{p.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <TextInput
            style={{ paddingHorizontal: 22, fontFamily: Theme.font.serif, fontSize: 24, color: Theme.text, marginBottom: 4 }}
            placeholder="Title (optional)" placeholderTextColor={Theme.textFaint}
            value={title} onChangeText={setTitle}
          />
          <TextInput
            style={{ paddingHorizontal: 22, flex: 1, fontFamily: Theme.font.sans, fontSize: 16, lineHeight: 26, color: Theme.text, textAlignVertical: "top", minHeight: 220 }}
            placeholder="What is God doing? What are you feeling? Write freely..." placeholderTextColor={Theme.textFaint}
            value={body} onChangeText={setBody} multiline autoFocus
          />
          <View style={{ marginHorizontal: 22, marginTop: 12, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setShowPrayerPicker(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Theme.card, borderRadius: Theme.radius.inner, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Theme.cardBorder }}
            >
              <Icon name="pray" size={18} color={linkedPrayer ? Theme.primary : Theme.textFaint} />
              <Text style={{ flex: 1, fontFamily: Theme.font.sans, fontSize: 14, color: linkedPrayer ? Theme.text : Theme.textFaint }} numberOfLines={1}>
                {linkedPrayer ? linkedPrayer.title : "Link to a prayer request (optional)"}
              </Text>
              <Icon name="right" size={16} color={Theme.textFaint} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

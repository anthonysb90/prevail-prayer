import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import { useJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from "@/hooks/useJournal";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useJournalEntry(id);
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const startEdit = () => { setTitle(entry?.title ?? ""); setBody(entry?.body ?? ""); setEditing(true); };
  const handleSave = async () => {
    if (!body.trim()) return Alert.alert("Body cannot be empty.");
    try { await updateEntry.mutateAsync({ id, title: title.trim() || null, body }); setEditing(false); }
    catch (e: any) { Alert.alert("Error saving", e.message); }
  };
  const handleDelete = () => {
    Alert.alert("Delete Entry", "This journal entry will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteEntry.mutateAsync(id); router.back(); } },
    ]);
  };

  if (isLoading) return <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={Theme.primary} /></View>;
  if (!entry) return <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: Theme.font.sans, color: Theme.textMuted }}>Entry not found.</Text></View>;

  if (editing) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => setEditing(false)}><Icon name="x" size={24} color={Theme.text} /></TouchableOpacity>
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>Edit Entry</Text>
          <TouchableOpacity onPress={handleSave} disabled={updateEntry.isPending}>
            {updateEntry.isPending ? <ActivityIndicator size="small" color={Theme.primary} />
              : <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.primary }}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <TextInput style={{ paddingHorizontal: 22, fontFamily: Theme.font.serif, fontSize: 24, color: Theme.text, marginBottom: 4 }} placeholder="Title (optional)" placeholderTextColor={Theme.textFaint} value={title} onChangeText={setTitle} />
          <TextInput style={{ paddingHorizontal: 22, flex: 1, fontFamily: Theme.font.sans, fontSize: 16, lineHeight: 26, color: Theme.text, textAlignVertical: "top", minHeight: 300 }} value={body} onChangeText={setBody} multiline autoFocus />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <TouchableOpacity onPress={startEdit}><Icon name="edit" size={21} color={Theme.text} /></TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}><Icon name="trash" size={21} color={Theme.urgent} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48 }}>
        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginBottom: 12 }}>
          {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
        </Text>
        {entry.title ? <Text style={{ fontFamily: Theme.font.serif, fontSize: 27, color: Theme.text, marginBottom: 16, lineHeight: 35 }}>{entry.title}</Text> : null}
        <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 17, color: Theme.text, lineHeight: 28 }}>{entry.body}</Text>

        {(entry as any).prayer_requests && (
          <TouchableOpacity
            onPress={() => router.push(`/prayer/${(entry as any).prayer_requests.id}`)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 32, padding: 16, backgroundColor: Theme.card, borderRadius: Theme.radius.card, borderWidth: 1, borderColor: Theme.cardBorder, ...Theme.shadow }}
          >
            <Icon name="pray" size={18} color={Theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 11, color: Theme.primary, textTransform: "uppercase", letterSpacing: 1 }}>Linked Prayer</Text>
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text, marginTop: 2 }} numberOfLines={1}>{(entry as any).prayer_requests.title}</Text>
            </View>
            <Icon name="right" size={16} color={Theme.textFaint} />
          </TouchableOpacity>
        )}

        {entry.updated_at !== entry.created_at && (
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 12, color: Theme.textFaint, marginTop: 24, textAlign: "center" }}>
            Edited {format(new Date(entry.updated_at), "MMM d, yyyy")}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

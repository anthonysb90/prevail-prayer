import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from "@/hooks/useJournal";

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useJournalEntry(id);
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const startEdit = () => {
    setTitle(entry?.title ?? "");
    setBody(entry?.body ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!body.trim()) { Alert.alert("Body cannot be empty."); return; }
    try {
      await updateEntry.mutateAsync({ id, title: title.trim() || null, body });
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error saving", e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "This journal entry will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteEntry.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream-100 items-center justify-center">
        <ActivityIndicator color="#F5B942" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 bg-cream-100 items-center justify-center">
        <Text className="text-charcoal-400" style={{ fontFamily: "DMSans-Regular" }}>
          Entry not found.
        </Text>
      </View>
    );
  }

  if (editing) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-cream-100"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Ionicons name="close" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }} className="text-charcoal-900">
            Edit Entry
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={updateEntry.isPending}>
            {updateEntry.isPending ? (
              <ActivityIndicator size="small" color="#F5B942" />
            ) : (
              <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <TextInput
            className="px-6 bg-transparent text-charcoal-900 mb-1"
            style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 22 }}
            placeholder="Title (optional)"
            placeholderTextColor="#8A8A8A"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            className="px-6 flex-1 bg-transparent text-charcoal-900"
            style={{ fontFamily: "DMSans-Regular", fontSize: 16, lineHeight: 26, textAlignVertical: "top", minHeight: 300 }}
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-cream-100">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
        </TouchableOpacity>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={startEdit}>
            <Ionicons name="create-outline" size={22} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
        {/* Date */}
        <Text
          style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#8A8A8A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {format(new Date(entry.created_at), "MMMM d, yyyy · h:mm a")}
        </Text>

        {/* Title */}
        {entry.title ? (
          <Text
            style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 26, color: "#1A1A1A", marginBottom: 16, lineHeight: 34 }}
          >
            {entry.title}
          </Text>
        ) : null}

        {/* Body */}
        <Text
          style={{ fontFamily: "DMSans-Regular", fontSize: 16, color: "#1A1A1A", lineHeight: 28 }}
        >
          {entry.body}
        </Text>

        {/* Linked prayer */}
        {(entry as any).prayer_requests && (
          <TouchableOpacity
            onPress={() => router.push(`/prayer/${(entry as any).prayer_requests.id}`)}
            style={{
              flexDirection: "row", alignItems: "center",
              marginTop: 32, padding: 16,
              backgroundColor: "#FFFFFF", borderRadius: 14,
              borderWidth: 1, borderColor: "#EDE5D8",
            }}
          >
            <Ionicons name="link-outline" size={18} color="#F5B942" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.4 }}>
                Linked Prayer
              </Text>
              <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 15, color: "#1A1A1A", marginTop: 2 }} numberOfLines={1}>
                {(entry as any).prayer_requests.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
          </TouchableOpacity>
        )}

        {/* Last edited */}
        {entry.updated_at !== entry.created_at && (
          <Text
            style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#8A8A8A", marginTop: 24, textAlign: "center" }}
          >
            Edited {format(new Date(entry.updated_at), "MMM d, yyyy")}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCreateJournalEntry } from "@/hooks/useJournal";
import { useActivePrayers, useOngoingPrayers } from "@/hooks/usePrayers";

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const createEntry = useCreateJournalEntry();
  const { data: active = [] } = useActivePrayers();
  const { data: ongoing = [] } = useOngoingPrayers();
  const allPrayers = [...active, ...ongoing];

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkedPrayerId, setLinkedPrayerId] = useState<string | null>(null);
  const [showPrayerPicker, setShowPrayerPicker] = useState(false);

  const linkedPrayer = allPrayers.find((p) => p.id === linkedPrayerId);

  const handleSave = async () => {
    if (!body.trim()) {
      Alert.alert("Please write something before saving.");
      return;
    }
    try {
      await createEntry.mutateAsync({
        title,
        body,
        prayer_request_id: linkedPrayerId,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error saving entry", e.message);
    }
  };

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
          New Entry
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={createEntry.isPending}>
          {createEntry.isPending ? (
            <ActivityIndicator size="small" color="#F5B942" />
          ) : (
            <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showPrayerPicker ? (
        /* Prayer Picker overlay */
        <View className="flex-1 bg-cream-100">
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-cream-200">
            <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }} className="text-charcoal-900">
              Link a Prayer Request
            </Text>
            <TouchableOpacity onPress={() => setShowPrayerPicker(false)}>
              <Ionicons name="close" size={22} color="#4A4A4A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <TouchableOpacity
              className="bg-white rounded-xl px-4 py-4 mb-2 border border-cream-200"
              onPress={() => { setLinkedPrayerId(null); setShowPrayerPicker(false); }}
            >
              <Text style={{ fontFamily: "DMSans-Regular", fontSize: 15, color: "#8A8A8A" }}>
                No link
              </Text>
            </TouchableOpacity>
            {allPrayers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={{
                  backgroundColor: linkedPrayerId === p.id ? "#1A1A1A" : "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: linkedPrayerId === p.id ? "#1A1A1A" : "#EDE5D8",
                }}
                onPress={() => { setLinkedPrayerId(p.id); setShowPrayerPicker(false); }}
              >
                <Text
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    fontSize: 15,
                    color: linkedPrayerId === p.id ? "#FFFFFF" : "#1A1A1A",
                  }}
                  numberOfLines={1}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            className="px-6 bg-transparent text-charcoal-900 mb-1"
            style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 22 }}
            placeholder="Title (optional)"
            placeholderTextColor="#8A8A8A"
            value={title}
            onChangeText={setTitle}
          />

          {/* Body */}
          <TextInput
            className="px-6 flex-1 bg-transparent text-charcoal-900"
            style={{
              fontFamily: "DMSans-Regular",
              fontSize: 16,
              lineHeight: 26,
              textAlignVertical: "top",
              minHeight: 200,
            }}
            placeholder="What is God doing? What are you feeling? Write freely..."
            placeholderTextColor="#8A8A8A"
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
          />

          {/* Link to prayer */}
          <View className="mx-6 mt-4 mb-2">
            <TouchableOpacity
              className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-cream-200"
              onPress={() => setShowPrayerPicker(true)}
            >
              <Ionicons
                name={linkedPrayer ? "link" : "link-outline"}
                size={18}
                color={linkedPrayer ? "#F5B942" : "#8A8A8A"}
              />
              <Text
                className="ml-3 flex-1"
                style={{
                  fontFamily: "DMSans-Regular",
                  fontSize: 14,
                  color: linkedPrayer ? "#1A1A1A" : "#8A8A8A",
                }}
                numberOfLines={1}
              >
                {linkedPrayer ? linkedPrayer.title : "Link to a prayer request (optional)"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

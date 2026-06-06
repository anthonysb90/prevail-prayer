import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!body.trim()) {
      Alert.alert("Please write something before saving.");
      return;
    }
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: title.trim() || null,
      body: body.trim(),
    });

    if (error) {
      Alert.alert("Error saving entry", error.message);
    } else {
      router.back();
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }} className="text-charcoal-900">
          New Entry
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6">
        <TextInput
          className="bg-transparent text-charcoal-900 mb-2"
          style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 22 }}
          placeholder="Title (optional)"
          placeholderTextColor="#8A8A8A"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          className="flex-1 bg-transparent text-charcoal-900"
          style={{ fontFamily: "DMSans-Regular", fontSize: 16, lineHeight: 26, textAlignVertical: "top" }}
          placeholder="Write your reflection..."
          placeholderTextColor="#8A8A8A"
          value={body}
          onChangeText={setBody}
          multiline
          autoFocus
        />
      </View>
    </KeyboardAvoidingView>
  );
}

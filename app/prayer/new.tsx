import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { PrayerStatus } from "@/types";

const STATUS_OPTIONS: { value: PrayerStatus; label: string }[] = [
  { value: "active",   label: "Active" },
  { value: "ongoing",  label: "Ongoing" },
];

export default function NewPrayerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [status, setStatus] = useState<PrayerStatus>("active");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Please add a title for your prayer request.");
      return;
    }
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("prayer_requests").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      status,
      is_urgent: isUrgent,
    });

    if (error) {
      Alert.alert("Error saving prayer request", error.message);
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
      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20 }} className="text-charcoal-900">
          New Prayer Request
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text className="text-amber-500" style={{ fontFamily: "DMSans-SemiBold", fontSize: 16 }}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Title */}
        <TextInput
          className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900 mb-4"
          style={{ fontFamily: "DMSans-Regular", fontSize: 16 }}
          placeholder="What are you praying for?"
          placeholderTextColor="#8A8A8A"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {/* Description */}
        <TextInput
          className="bg-white border border-cream-200 rounded-xl px-4 py-4 text-charcoal-900 mb-4"
          style={{ fontFamily: "DMSans-Regular", fontSize: 15, minHeight: 100, textAlignVertical: "top" }}
          placeholder="Add details, Scripture, or context (optional)..."
          placeholderTextColor="#8A8A8A"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        {/* Urgent toggle */}
        <TouchableOpacity
          className={`flex-row items-center rounded-xl px-4 py-4 mb-4 border ${
            isUrgent ? "bg-red-50 border-red-200" : "bg-white border-cream-200"
          }`}
          onPress={() => setIsUrgent(!isUrgent)}
        >
          <Ionicons
            name={isUrgent ? "alert-circle" : "alert-circle-outline"}
            size={20}
            color={isUrgent ? "#E53E3E" : "#8A8A8A"}
          />
          <Text
            className={`ml-3 text-base ${isUrgent ? "text-red-600" : "text-charcoal-600"}`}
            style={{ fontFamily: "DMSans-Medium" }}
          >
            Mark as Urgent
          </Text>
        </TouchableOpacity>

        {/* Status */}
        <Text className="text-charcoal-600 text-sm mb-2" style={{ fontFamily: "DMSans-Medium" }}>
          Request Type
        </Text>
        <View className="flex-row gap-3 mb-6">
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              className={`flex-1 rounded-full py-3 items-center border ${
                status === opt.value
                  ? "bg-charcoal-900 border-charcoal-900"
                  : "bg-white border-cream-200"
              }`}
              onPress={() => setStatus(opt.value)}
            >
              <Text
                className={status === opt.value ? "text-white" : "text-charcoal-600"}
                style={{ fontFamily: "DMSans-Medium", fontSize: 14 }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <Text className="text-charcoal-600 text-sm mb-3" style={{ fontFamily: "DMSans-Medium" }}>
          Categories
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <TouchableOpacity
                key={cat.name}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: isSelected ? cat.color_bg : "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: isSelected ? cat.color_border : "#EDE5D8",
                }}
                onPress={() => toggleCategory(cat.name)}
              >
                <Text
                  style={{
                    fontFamily: "DMSans-Medium",
                    fontSize: 13,
                    color: isSelected ? cat.color_border : "#4A4A4A",
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

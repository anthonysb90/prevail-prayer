import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useDevotion, useDevotionResponse, useSubmitDevotionResponse } from "@/hooks/useDevotions";

export default function DevotionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: devotion, isLoading } = useDevotion(id);
  const { data: existing } = useDevotionResponse(id);
  const submit = useSubmitDevotionResponse();

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setAnswer = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    if (!devotion) return;

    const hasAnswers = devotion.questions?.some((q: any) => answers[q.id]?.trim());
    if (!hasAnswers) {
      Alert.alert("Add a reflection", "Answer at least one question before saving to your journal.");
      return;
    }

    const responses = devotion.questions?.map((q: any) => ({
      question_id: q.id,
      question_text: q.question_text,
      answer: answers[q.id] ?? "",
    })) ?? [];

    try {
      await submit.mutateAsync({
        devotionId: devotion.id,
        devotionTitle: devotion.title,
        closingPrayer: devotion.closing_prayer,
        responses,
      });
      Alert.alert(
        "Saved to Journal",
        "Your reflection has been saved. You can find it in your Prayer Journal.",
        [{ text: "View Journal", onPress: () => router.push("/(tabs)/journal") },
         { text: "Done" }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (isLoading || !devotion) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F0E8", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#F5B942" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={{ flex: 1, backgroundColor: "#F5F0E8" }} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Hero image */}
        {devotion.image_url ? (
          <View style={{ position: "relative", height: 260 }}>
            <Image
              source={{ uri: devotion.image_url }}
              style={{ width: "100%", height: 260 }}
              resizeMode="cover"
            />
            <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ position: "absolute", top: 56, left: 24, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={22} color="#4A4A4A" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          {/* Date */}
          {devotion.published_at && (
            <Text style={{ fontFamily: "DMSans-Regular", fontSize: 12, color: "#8A8A8A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {format(new Date(devotion.published_at), "MMMM d, yyyy")}
            </Text>
          )}

          {/* Title */}
          <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 28, color: "#1A1A1A", lineHeight: 36, marginBottom: 20 }}>
            {devotion.title}
          </Text>

          {/* Scripture */}
          {devotion.scripture_reference && (
            <View style={{ backgroundColor: "#F5B942", borderRadius: 16, padding: 18, marginBottom: 24 }}>
              <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 11, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {devotion.scripture_reference}
              </Text>
              <Text style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 17, color: "#FFFFFF", lineHeight: 26, fontStyle: "italic" }}>
                "{devotion.scripture_text}"
              </Text>
            </View>
          )}

          {/* Body */}
          <Text style={{ fontFamily: "DMSans-Regular", fontSize: 16, color: "#1A1A1A", lineHeight: 28, marginBottom: 32 }}>
            {devotion.body}
          </Text>

          {/* Questions */}
          {devotion.questions && devotion.questions.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: "PlayfairDisplay-Bold", fontSize: 20, color: "#1A1A1A", marginBottom: 16 }}>
                Reflect
              </Text>
              {existing ? (
                <View style={{ backgroundColor: "#E8F5E9", borderRadius: 14, padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 14, color: "#4CAF50", marginLeft: 8 }}>
                      You completed this devotion
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/journal/${existing.journal_entry_id}`)}>
                    <Text style={{ fontFamily: "DMSans-Medium", fontSize: 13, color: "#2196F3" }}>
                      View journal entry →
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                devotion.questions.map((q: any, i: number) => (
                  <View key={q.id} style={{ marginBottom: 16 }}>
                    <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 14, color: "#1A1A1A", marginBottom: 8, lineHeight: 20 }}>
                      {i + 1}. {q.question_text}
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 12,
                        padding: 14,
                        fontFamily: "DMSans-Regular",
                        fontSize: 15,
                        color: "#1A1A1A",
                        minHeight: 88,
                        textAlignVertical: "top",
                        borderWidth: 1,
                        borderColor: "#EDE5D8",
                        lineHeight: 22,
                      }}
                      placeholder="Write your reflection..."
                      placeholderTextColor="#8A8A8A"
                      value={answers[q.id] ?? ""}
                      onChangeText={(t) => setAnswer(q.id, t)}
                      multiline
                    />
                  </View>
                ))
              )}
            </View>
          )}

          {/* Closing prayer */}
          {devotion.closing_prayer && (
            <View style={{ backgroundColor: "#1A1A1A", borderRadius: 16, padding: 20, marginBottom: 28 }}>
              <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 11, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
                Prayer
              </Text>
              <Text style={{ fontFamily: "PlayfairDisplay-SemiBold", fontSize: 16, color: "#FFFFFF", lineHeight: 26, fontStyle: "italic" }}>
                {devotion.closing_prayer}
              </Text>
            </View>
          )}

          {/* Save to journal */}
          {!existing && devotion.questions && devotion.questions.length > 0 && (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submit.isPending}
              style={{ backgroundColor: "#F5B942", borderRadius: 100, paddingVertical: 18, alignItems: "center", marginBottom: 16 }}
            >
              {submit.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: "DMSans-SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                  Save Reflection to Journal
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

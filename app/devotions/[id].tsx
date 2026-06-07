import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import { useDevotion, useDevotionResponse, useSubmitDevotionResponse } from "@/hooks/useDevotions";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function DevotionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: devotion, isLoading } = useDevotion(id);
  const { data: existing } = useDevotionResponse(id);
  const submit = useSubmitDevotionResponse();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setAnswer = (qId: string, text: string) => setAnswers((prev) => ({ ...prev, [qId]: text }));

  const handleSubmit = async () => {
    if (!devotion) return;
    const hasAnswers = devotion.questions?.some((q: any) => answers[q.id]?.trim());
    if (!hasAnswers) return Alert.alert("Add a reflection", "Answer at least one question before saving to your journal.");
    const responses = devotion.questions?.map((q: any) => ({ question_id: q.id, question_text: q.question_text, answer: answers[q.id] ?? "" })) ?? [];
    try {
      await submit.mutateAsync({ devotionId: devotion.id, devotionTitle: devotion.title, closingPrayer: devotion.closing_prayer, responses });
      Alert.alert("Saved to Journal", "Your reflection has been saved. You can find it in your Prayer Journal.", [
        { text: "View Journal", onPress: () => router.push("/(tabs)/journal") }, { text: "Done" },
      ]);
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (isLoading || !devotion) {
    return <View style={{ flex: 1, backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={Theme.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={{ flex: 1, backgroundColor: Theme.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
        {devotion.image_url ? (
          <View style={{ position: "relative", height: 260 }}>
            <Image source={{ uri: devotion.image_url }} style={{ width: "100%", height: 260 }} resizeMode="cover" />
            <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(20,18,32,0.28)" }} />
            <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", top: 56, left: 22, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(20,18,32,0.5)", alignItems: "center", justifyContent: "center" }}>
              <Icon name="left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingTop: 60, paddingHorizontal: 22, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.back()}><Icon name="left" size={22} color={Theme.text} /></TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          {devotion.published_at && (
            <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 12, color: Theme.textFaint, marginBottom: 8 }}>
              {format(new Date(devotion.published_at), "MMMM d, yyyy")}
            </Text>
          )}
          <Text style={{ fontFamily: Theme.font.serif, fontSize: 29, color: Theme.text, lineHeight: 37, marginBottom: 20 }}>{devotion.title}</Text>

          {devotion.scripture_reference && (
            <View style={{ backgroundColor: Theme.primarySoft, borderRadius: Theme.radius.card, padding: 18, marginBottom: 24 }}>
              <Text style={{ fontFamily: Theme.font.sansBold, fontSize: 12, color: Theme.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{devotion.scripture_reference}</Text>
              <Text style={{ fontFamily: Theme.font.serifMed, fontSize: 18, color: Theme.text, lineHeight: 27 }}>"{devotion.scripture_text}"</Text>
            </View>
          )}

          <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 17, color: Theme.text, lineHeight: 28, marginBottom: 32 }}>{devotion.body}</Text>

          {devotion.questions && devotion.questions.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: Theme.font.serif, fontSize: 21, color: Theme.text, marginBottom: 16 }}>Reflect</Text>
              {existing ? (
                <View style={{ backgroundColor: "#ECF8F2", borderRadius: Theme.radius.inner, borderWidth: 1, borderColor: "#CDEBDD", padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon name="check" size={18} color={Theme.success} />
                    <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: Theme.success }}>You completed this devotion</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/journal/${existing.journal_entry_id}`)}>
                    <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.primary }}>View journal entry →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                devotion.questions.map((q: any, i: number) => (
                  <View key={q.id} style={{ marginBottom: 16 }}>
                    <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.text, marginBottom: 8, lineHeight: 21 }}>{i + 1}. {q.question_text}</Text>
                    <TextInput
                      style={{ backgroundColor: Theme.card, borderRadius: Theme.radius.inner, padding: 14, fontFamily: Theme.font.sans, fontSize: 15, color: Theme.text, minHeight: 88, textAlignVertical: "top", borderWidth: 1, borderColor: Theme.cardBorder, lineHeight: 22 }}
                      placeholder="Write your reflection..." placeholderTextColor={Theme.textFaint}
                      value={answers[q.id] ?? ""} onChangeText={(t) => setAnswer(q.id, t)} multiline
                    />
                  </View>
                ))
              )}
            </View>
          )}

          {devotion.closing_prayer && (
            <View style={{ backgroundColor: Theme.dark, borderRadius: Theme.radius.card, padding: 20, marginBottom: 28 }}>
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Icon name="pray" size={22} color={Theme.accentOnDark} />
              </View>
              <Text style={{ fontFamily: Theme.font.serifMed, fontSize: 17, color: Theme.darkText, lineHeight: 27, textAlign: "center" }}>{devotion.closing_prayer}</Text>
            </View>
          )}

          {!existing && devotion.questions && devotion.questions.length > 0 && (
            <TouchableOpacity onPress={handleSubmit} disabled={submit.isPending} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 17, alignItems: "center", marginBottom: 16, flexDirection: "row", justifyContent: "center", gap: 8 }}>
              {submit.isPending ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Icon name="journal" size={17} color="#FFFFFF" />
                  <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Save Reflection to Journal</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

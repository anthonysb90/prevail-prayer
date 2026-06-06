import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Devotion, DevotionResponse } from "@/types";

const KEY = "devotions";

// ─── Query hooks ─────────────────────────────────────────────────────────────

export function useDevotions() {
  return useQuery<Devotion[]>({
    queryKey: [KEY, "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devotions")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLatestDevotion() {
  return useQuery<Devotion | null>({
    queryKey: [KEY, "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devotions")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

export function useDevotion(id: string) {
  return useQuery<Devotion & { questions: any[] }>({
    queryKey: [KEY, "detail", id],
    queryFn: async () => {
      const [devotionRes, questionsRes] = await Promise.all([
        supabase
          .from("devotions")
          .select("*")
          .eq("id", id)
          .single(),
        supabase
          .from("devotion_questions")
          .select("*")
          .eq("devotion_id", id)
          .order("sort_order", { ascending: true }),
      ]);
      if (devotionRes.error) throw devotionRes.error;
      return { ...devotionRes.data, questions: questionsRes.data ?? [] };
    },
    enabled: !!id,
  });
}

export function useDevotionResponse(devotionId: string) {
  const { user } = useAuthStore();
  return useQuery<DevotionResponse | null>({
    queryKey: [KEY, "response", devotionId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devotion_responses")
        .select("*")
        .eq("devotion_id", devotionId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!devotionId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

interface SubmitResponseInput {
  devotionId: string;
  devotionTitle: string;
  closingPrayer: string | null;
  responses: Array<{ question_id: string; question_text: string; answer: string }>;
}

export function useSubmitDevotionResponse() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitResponseInput) => {
      // 1. Build journal entry body
      const answersText = input.responses
        .map((r) => `${r.question_text}\n${r.answer}`)
        .join("\n\n");

      const journalBody = [
        answersText,
        input.closingPrayer ? `\nClosing Prayer:\n${input.closingPrayer}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // 2. Create linked journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user!.id,
          title: `${input.devotionTitle} — Reflection`,
          body: journalBody,
          devotion_id: input.devotionId,
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // 3. Save devotion response
      const { error: responseError } = await supabase
        .from("devotion_responses")
        .upsert({
          devotion_id: input.devotionId,
          user_id: user!.id,
          journal_entry_id: journalEntry.id,
          responses: input.responses,
        });

      if (responseError) throw responseError;

      return journalEntry;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: [KEY, "response", input.devotionId] });
      qc.invalidateQueries({ queryKey: ["journal_entries", user?.id] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ScriptureVerse } from "@/types";

// ─── Query hooks ─────────────────────────────────────────────────────────────

export function useVersesByTopic(topic: string) {
  return useQuery<ScriptureVerse[]>({
    queryKey: ["scripture_verses", "topic", topic],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scripture_verses")
        .select("*")
        .eq("topic", topic)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!topic,
    staleTime: Infinity, // Verses don't change — cache forever
  });
}

export function useFavoriteVerseIds() {
  const { user } = useAuthStore();

  return useQuery<string[]>({
    queryKey: ["user_favorite_verses", user?.id, "ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorite_verses")
        .select("verse_id")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data?.map((f) => f.verse_id) ?? [];
    },
    enabled: !!user,
  });
}

export function useFavoriteVerses() {
  const { user } = useAuthStore();

  return useQuery<ScriptureVerse[]>({
    queryKey: ["user_favorite_verses", user?.id, "full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorite_verses")
        .select("scripture_verses(*)")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data?.map((f: any) => f.scripture_verses).filter(Boolean) ?? [];
    },
    enabled: !!user,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useToggleFavorite() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      verseId,
      isFavorited,
    }: {
      verseId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from("user_favorite_verses")
          .delete()
          .eq("user_id", user!.id)
          .eq("verse_id", verseId);
        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from("user_favorite_verses")
          .insert({ user_id: user!.id, verse_id: verseId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_favorite_verses", user?.id] });
    },
  });
}

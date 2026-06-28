import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Category } from "@/types";

/** Create a custom, user-owned category and return it. */
export function useCreateCategory() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Category> => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user!.id,
          name: name.trim(),
          color_bg: "#ECEAFA",
          color_border: "#5B53C6",
          is_default: false,
          sort_order: 999,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", user?.id] }),
  });
}

export function useCategories() {
  const { user } = useAuthStore();

  return useQuery<Category[]>({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

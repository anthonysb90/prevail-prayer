import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Category } from "@/types";

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

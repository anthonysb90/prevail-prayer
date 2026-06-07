import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Announcement } from "@/types";

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { JournalEntry } from "@/types";

const KEY = "journal_entries";

const JOURNAL_SELECT = `
  *,
  prayer_requests ( id, title )
`;

// ─── Query hooks ─────────────────────────────────────────────────────────────

export function useJournalEntries() {
  const { user } = useAuthStore();

  return useQuery<JournalEntry[]>({
    queryKey: [KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select(JOURNAL_SELECT)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useJournalEntry(id: string) {
  const { user } = useAuthStore();

  return useQuery<JournalEntry>({
    queryKey: [KEY, user?.id, "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select(JOURNAL_SELECT)
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

interface CreateJournalInput {
  title?: string;
  body: string;
  prayer_request_id?: string | null;
}

export function useCreateJournalEntry() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJournalInput) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user!.id,
          title: input.title?.trim() || null,
          body: input.body.trim(),
          prayer_request_id: input.prayer_request_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

interface UpdateJournalInput {
  id: string;
  title?: string | null;
  body?: string;
  prayer_request_id?: string | null;
}

export function useUpdateJournalEntry() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateJournalInput) => {
      const { error } = await supabase
        .from("journal_entries")
        .update(fields)
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

export function useDeleteJournalEntry() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

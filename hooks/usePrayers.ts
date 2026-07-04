import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { PrayerRequest, PrayerStatus, PrayerUpdate } from "@/types";
import { cancelLocalRemindersForPrayer } from "@/lib/prayerReminders";
import { removePrayerImage } from "@/lib/prayerImages";

const KEY = "prayer_requests";

// ─── Transform ───────────────────────────────────────────────────────────────
// Flattens the Supabase join so categories live directly on the prayer object.

function transform(p: any): PrayerRequest {
  return {
    ...p,
    categories:
      p.prayer_request_categories
        ?.map((prc: any) => prc.categories)
        .filter(Boolean) ?? [],
  };
}

const PRAYER_SELECT = `
  *,
  prayer_request_categories (
    category_id,
    categories (*)
  )
`;

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchByStatus(
  userId: string,
  statuses: PrayerStatus[]
): Promise<PrayerRequest[]> {
  const { data, error } = await supabase
    .from("prayer_requests")
    .select(PRAYER_SELECT)
    .eq("user_id", userId)
    .in("status", statuses)
    .is("archived_at", null)
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(transform);
}

// ─── Query hooks ─────────────────────────────────────────────────────────────

export function useActivePrayers() {
  const { user } = useAuthStore();
  return useQuery<PrayerRequest[]>({
    queryKey: [KEY, user?.id, "active"],
    queryFn: () => fetchByStatus(user!.id, ["active"]),
    enabled: !!user,
  });
}

export function useOngoingPrayers() {
  const { user } = useAuthStore();
  return useQuery<PrayerRequest[]>({
    queryKey: [KEY, user?.id, "ongoing"],
    queryFn: () => fetchByStatus(user!.id, ["ongoing"]),
    enabled: !!user,
  });
}

export function useAnsweredPrayers() {
  const { user } = useAuthStore();
  return useQuery<PrayerRequest[]>({
    queryKey: [KEY, user?.id, "answered"],
    queryFn: () => fetchByStatus(user!.id, ["answered", "completed"]),
    enabled: !!user,
  });
}

/** All active + ongoing — used by Prayer List screen. Urgent first. */
export function usePrayerList() {
  const { user } = useAuthStore();
  return useQuery<PrayerRequest[]>({
    queryKey: [KEY, user?.id, "list"],
    queryFn: () => fetchByStatus(user!.id, ["active", "ongoing"]),
    enabled: !!user,
  });
}

/** Single prayer request by ID — used by detail + edit screens. */
export function usePrayerRequest(id: string) {
  const { user } = useAuthStore();
  return useQuery<PrayerRequest>({
    queryKey: [KEY, user?.id, "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(PRAYER_SELECT)
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return transform(data);
    },
    enabled: !!user && !!id,
  });
}

/** Summary counts for the home screen stats row. */
export function usePrayerCounts() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: [KEY, user?.id, "counts"],
    queryFn: async () => {
      const [active, answered] = await Promise.all([
        supabase
          .from("prayer_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .in("status", ["active", "ongoing"])
          .is("archived_at", null),
        supabase
          .from("prayer_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("status", "answered"),
      ]);
      return {
        active: active.count ?? 0,
        answered: answered.count ?? 0,
      };
    },
    enabled: !!user,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

interface CreateInput {
  title: string;
  description?: string;
  status: PrayerStatus;
  is_urgent: boolean;
  categoryIds: string[];
  image_path?: string | null;
}

export function useCreatePrayer() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInput) => {
      // 1. Insert prayer request
      const { data, error } = await supabase
        .from("prayer_requests")
        .insert({
          user_id: user!.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          status: input.status,
          is_urgent: input.is_urgent,
          image_path: input.image_path ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Link categories (if any selected)
      if (input.categoryIds.length > 0) {
        const { error: catError } = await supabase
          .from("prayer_request_categories")
          .insert(
            input.categoryIds.map((cid) => ({
              prayer_request_id: data.id,
              category_id: cid,
            }))
          );
        if (catError) throw catError;
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

/** Bulk-create prayer requests (used by AI import after review). Returns count inserted. */
export function useBulkCreatePrayers() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (items: { title: string; description?: string | null }[]) => {
      const rows = items
        .filter((i) => i.title.trim())
        .map((i) => ({
          user_id: user!.id,
          title: i.title.trim(),
          description: i.description?.trim() || null,
          status: "active" as PrayerStatus,
          is_urgent: false,
        }));
      if (rows.length === 0) return 0;
      const { error } = await supabase.from("prayer_requests").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

interface UpdateInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: PrayerStatus;
  is_urgent?: boolean;
  answer_notes?: string | null;
  answered_at?: string | null;
  categoryIds?: string[];
  image_path?: string | null;
}

export function useUpdatePrayer() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryIds, ...fields }: UpdateInput) => {
      // 1. Update fields
      if (Object.keys(fields).length > 0) {
        const { error } = await supabase
          .from("prayer_requests")
          .update(fields)
          .eq("id", id)
          .eq("user_id", user!.id);
        if (error) throw error;
      }

      // 2. Replace categories if provided
      if (categoryIds !== undefined) {
        await supabase
          .from("prayer_request_categories")
          .delete()
          .eq("prayer_request_id", id);

        if (categoryIds.length > 0) {
          const { error } = await supabase
            .from("prayer_request_categories")
            .insert(
              categoryIds.map((cid) => ({
                prayer_request_id: id,
                category_id: cid,
              }))
            );
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

export function useDeletePrayer() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Grab the image path before the row (and its cascades) disappear.
      const { data: row } = await supabase
        .from("prayer_requests")
        .select("image_path")
        .eq("id", id)
        .eq("user_id", user!.id)
        .maybeSingle();

      // Cancel on-device notifications for this prayer's reminders. The DB
      // rows cascade with the delete, but local notifications don't.
      await cancelLocalRemindersForPrayer(id);

      const { error } = await supabase
        .from("prayer_requests")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;

      // Best effort: remove the photo from storage so no orphaned file remains.
      if (row?.image_path) await removePrayerImage(row.image_path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, user?.id] });
    },
  });
}

export function useMarkAnswered() {
  const update = useUpdatePrayer();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      update.mutateAsync({
        id,
        status: "answered",
        answer_notes: notes ?? null,
        answered_at: new Date().toISOString(),
      }),
  });
}

export function useChangeStatus() {
  const update = useUpdatePrayer();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrayerStatus }) =>
      update.mutateAsync({ id, status }),
  });
}


// ─── Prayer Updates (progress notes & praise reports) ────────────────────────
export function usePrayerUpdates(prayerId: string) {
  const { user } = useAuthStore();
  return useQuery<PrayerUpdate[]>({
    queryKey: [KEY, user?.id, "updates", prayerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_updates")
        .select("*")
        .eq("prayer_request_id", prayerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as PrayerUpdate[]) ?? [];
    },
    enabled: !!user && !!prayerId,
  });
}

export function useAddPrayerUpdate() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async ({ prayerId, note, isPraise }: { prayerId: string; note: string; isPraise: boolean }) => {
      const { data, error } = await supabase
        .from("prayer_updates")
        .insert({ prayer_request_id: prayerId, user_id: user!.id, note, is_praise: isPraise })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [KEY, user?.id, "updates", vars.prayerId] }),
  });
}

export function useDeletePrayerUpdate() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async ({ id }: { id: string; prayerId: string }) => {
      const { error } = await supabase.from("prayer_updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [KEY, user?.id, "updates", vars.prayerId] }),
  });
}

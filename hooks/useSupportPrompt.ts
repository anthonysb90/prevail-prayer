import { useCallback } from "react";
import { useSupportStore } from "@/stores/supportStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { differenceInDays } from "date-fns";

const COOLDOWN_DAYS = 7;

export function useSupportPrompt() {
  const { user } = useAuthStore();
  const { show } = useSupportStore();

  /**
   * Call after each relevant event.
   * trigger: "prayer_added" | "session_completed" | "prayer_answered"
   * count: the current total for that event type
   */
  const checkAndShow = useCallback(
    async (trigger: "prayer_added" | "session_completed" | "prayer_answered", count: number) => {
      if (!user) return;

      // Only trigger at specific milestones
      const shouldTrigger =
        trigger === "prayer_added"    ? count > 0 && count % 10 === 0 :
        trigger === "session_completed" ? count > 0 && count % 5 === 0 :
        trigger === "prayer_answered" ? count === 1 : false;

      if (!shouldTrigger) return;

      // Check cooldown — don't show if prompted in last 7 days
      const { data: interactions } = await supabase
        .from("support_interactions")
        .select("shown_at")
        .eq("user_id", user.id)
        .order("shown_at", { ascending: false })
        .limit(1);

      if (interactions && interactions.length > 0) {
        const daysSince = differenceInDays(
          new Date(),
          new Date(interactions[0].shown_at)
        );
        if (daysSince < COOLDOWN_DAYS) return;
      }

      // Record the impression
      await supabase.from("support_interactions").insert({
        user_id: user.id,
        action: "dismissed", // default until user acts
        shown_at: new Date().toISOString(),
      });

      show();
    },
    [user, show]
  );

  return { checkAndShow };
}

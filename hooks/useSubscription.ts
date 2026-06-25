import { useEffect, useCallback } from "react";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { getSubscriptionStatus } from "@/lib/purchases";
import { isTrialActive } from "@/lib/trial";
import { useAuthStore } from "@/stores/authStore";

export function useSubscription() {
  const { isPremium, isLoading, setIsPremium, setIsLoading } =
    useSubscriptionStore();
  const { user, profile } = useAuthStore();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const status = await getSubscriptionStatus();
    setIsPremium(status || isTrialActive(profile));
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, profile]);

  return { isPremium, isLoading, refresh };
}

/**
 * Use this in tab/screen components to gate premium content.
 * Returns true if the user can access the feature.
 * Automatically shows the paywall if not subscribed.
 */
export function usePremiumGate() {
  const { isPremium, showPaywall } = useSubscriptionStore();

  const requirePremium = useCallback((): boolean => {
    if (!isPremium) {
      showPaywall();
      return false;
    }
    return true;
  }, [isPremium, showPaywall]);

  return { isPremium, requirePremium };
}

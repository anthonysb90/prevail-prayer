import { create } from "zustand";

export type PaywallContext = "default" | "birthday";

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  paywallVisible: boolean;
  paywallContext: PaywallContext;
  setIsPremium: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  showPaywall: (context?: PaywallContext) => void;
  hidePaywall: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoading: true,
  paywallVisible: false,
  paywallContext: "default",
  setIsPremium: (isPremium) => set({ isPremium }),
  setIsLoading: (isLoading) => set({ isLoading }),
  showPaywall: (context = "default") => set({ paywallVisible: true, paywallContext: context }),
  hidePaywall: () => set({ paywallVisible: false, paywallContext: "default" }),
}));

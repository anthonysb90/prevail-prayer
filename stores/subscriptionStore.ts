import { create } from "zustand";

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  paywallVisible: boolean;
  setIsPremium: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  showPaywall: () => void;
  hidePaywall: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoading: true,
  paywallVisible: false,
  setIsPremium: (isPremium) => set({ isPremium }),
  setIsLoading: (isLoading) => set({ isLoading }),
  showPaywall: () => set({ paywallVisible: true }),
  hidePaywall: () => set({ paywallVisible: false }),
}));

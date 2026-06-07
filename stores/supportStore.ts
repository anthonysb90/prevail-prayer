import { create } from "zustand";

interface SupportState {
  visible: boolean;
  interactionId: string | null;
  show: (interactionId: string) => void;
  hide: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  visible: false,
  interactionId: null,
  show: (interactionId) => set({ visible: true, interactionId }),
  hide: () => set({ visible: false, interactionId: null }),
}));

import { create } from "zustand";

interface SupportState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));

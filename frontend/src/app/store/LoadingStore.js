import { create } from "zustand";

export const LoadingStore = create((set) => ({
  loading: false,
  start: () => set({ loading: true }),
  stop: () => set({ loading: false }),
}));

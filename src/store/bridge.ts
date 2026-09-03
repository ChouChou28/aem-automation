import { create } from "zustand";

export interface BridgeState {
  /** True once the extension's content script announces itself. */
  available: boolean;
  /** Count of the most recently received cookie batch (for UI feedback). */
  lastSync: number | null;
  setAvailable: (v: boolean) => void;
  setLastSync: (n: number) => void;
}

export const useBridge = create<BridgeState>((set) => ({
  available: false,
  lastSync: null,
  setAvailable: (available) => set({ available }),
  setLastSync: (lastSync) => set({ lastSync }),
}));

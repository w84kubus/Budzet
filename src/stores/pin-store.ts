"use client";

import { create } from "zustand";

type PinState = {
  isLocked: boolean;
  pinHash: string | null;
  failedAttempts: number;
  lastActiveAt: number;

  setLocked: (locked: boolean) => void;
  setPinHash: (hash: string | null) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  touch: () => void;
};

export const usePinStore = create<PinState>((set) => ({
  isLocked: false,
  pinHash: null,
  failedAttempts: 0,
  lastActiveAt: Date.now(),

  setLocked: (isLocked) => set({ isLocked }),
  setPinHash: (pinHash) => set({ pinHash }),
  incrementFailedAttempts: () =>
    set((state) => ({ failedAttempts: state.failedAttempts + 1 })),
  resetFailedAttempts: () => set({ failedAttempts: 0 }),
  touch: () => set({ lastActiveAt: Date.now() }),
}));

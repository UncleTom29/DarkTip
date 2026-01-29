import { create } from "zustand";
import type { PrivacyLevel, TipStatus, Creator } from "@/types";
import { QUICK_TIP_AMOUNTS } from "@/config/constants";

interface TipState {
  // Current tip session
  isOpen: boolean;
  creator: Creator | null;
  amount: number;
  customAmount: string;
  message: string;
  privacyLevel: PrivacyLevel;
  status: TipStatus | null;
  transactionId: string | null;
  error: string | null;
  isProcessing: boolean;

  // Tip history (local cache)
  recentTips: Array<{
    id: string;
    creatorId: string;
    creatorName: string;
    amount: number;
    timestamp: number;
    status: TipStatus;
  }>;

  // Actions
  openTipModal: (creator: Creator) => void;
  closeTipModal: () => void;
  setAmount: (amount: number) => void;
  setCustomAmount: (amount: string) => void;
  setMessage: (message: string) => void;
  setPrivacyLevel: (level: PrivacyLevel) => void;
  setStatus: (status: TipStatus | null) => void;
  setTransactionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setProcessing: (processing: boolean) => void;
  addRecentTip: (tip: TipState["recentTips"][0]) => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  creator: null,
  amount: QUICK_TIP_AMOUNTS[0],
  customAmount: "",
  message: "",
  privacyLevel: "medium" as PrivacyLevel,
  status: null,
  transactionId: null,
  error: null,
  isProcessing: false,
  recentTips: [],
};

export const useTipStore = create<TipState>((set) => ({
  ...initialState,

  openTipModal: (creator) =>
    set({
      isOpen: true,
      creator,
      amount: QUICK_TIP_AMOUNTS[0],
      customAmount: "",
      message: "",
      privacyLevel: "medium",
      status: null,
      transactionId: null,
      error: null,
      isProcessing: false,
    }),

  closeTipModal: () =>
    set({
      isOpen: false,
      status: null,
      error: null,
      isProcessing: false,
    }),

  setAmount: (amount) => set({ amount, customAmount: "" }),

  setCustomAmount: (customAmount) => {
    const parsed = parseFloat(customAmount);
    set({
      customAmount,
      amount: isNaN(parsed) ? 0 : parsed,
    });
  },

  setMessage: (message) => set({ message }),

  setPrivacyLevel: (privacyLevel) => set({ privacyLevel }),

  setStatus: (status) => set({ status }),

  setTransactionId: (transactionId) => set({ transactionId }),

  setError: (error) => set({ error }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  addRecentTip: (tip) =>
    set((state) => ({
      recentTips: [tip, ...state.recentTips].slice(0, 50),
    })),

  reset: () => set(initialState),
}));

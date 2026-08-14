"use client";

import { create } from "zustand";
import type {
  Period,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  Transaction,
  TransferTask,
  UserSettings,
} from "@/domain/types";

type BudgetState = {
  // Data
  settings: UserSettings | null;
  periods: Period[];
  activePeriodId: string | null;
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  allFixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  transactions: Transaction[];
  allTransactions: Transaction[];
  transferTasks: TransferTask[];

  // Connection
  isOnline: boolean;
  isDataLoaded: boolean;

  // Actions
  setSettings: (settings: UserSettings | null) => void;
  setPeriods: (periods: Period[]) => void;
  setActivePeriodId: (id: string | null) => void;
  setFixedExpenseDefs: (defs: FixedExpenseDef[]) => void;
  setFixedExpenseInstances: (instances: FixedExpenseInstance[]) => void;
  setAllFixedExpenseInstances: (instances: FixedExpenseInstance[]) => void;
  setEnvelopes: (envelopes: Envelope[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setAllTransactions: (transactions: Transaction[]) => void;
  setTransferTasks: (tasks: TransferTask[]) => void;
  setIsOnline: (online: boolean) => void;
  setIsDataLoaded: (loaded: boolean) => void;
};

export const useBudgetStore = create<BudgetState>((set) => ({
  settings: null,
  periods: [],
  activePeriodId: null,
  fixedExpenseDefs: [],
  fixedExpenseInstances: [],
  allFixedExpenseInstances: [],
  envelopes: [],
  transactions: [],
  allTransactions: [],
  transferTasks: [],
  isOnline: true,
  isDataLoaded: false,

  setSettings: (settings) => set({ settings }),
  setPeriods: (periods) => set({ periods }),
  setActivePeriodId: (activePeriodId) => set({ activePeriodId }),
  setFixedExpenseDefs: (fixedExpenseDefs) => set({ fixedExpenseDefs }),
  setFixedExpenseInstances: (fixedExpenseInstances) =>
    set({ fixedExpenseInstances }),
  setAllFixedExpenseInstances: (allFixedExpenseInstances) =>
    set({ allFixedExpenseInstances }),
  setEnvelopes: (envelopes) => set({ envelopes }),
  setTransactions: (transactions) => set({ transactions }),
  setAllTransactions: (allTransactions) => set({ allTransactions }),
  setTransferTasks: (transferTasks) => set({ transferTasks }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),
}));

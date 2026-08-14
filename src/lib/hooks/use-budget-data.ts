"use client";

import { useEffect, useRef } from "react";
import { useBudgetStore } from "@/stores/budget-store";
import {
  subscribeSettings,
  subscribePeriods,
  subscribeFixedExpenseDefs,
  subscribeFixedExpenseInstances,
  subscribeAllFixedExpenseInstances,
  subscribeEnvelopes,
  subscribeTransactions,
  subscribeAllTransactions,
  subscribeTransferTasks,
} from "@/lib/firebase/db";

/**
 * Subscribes to all budget data for the given user.
 * Must be called within a component that has a valid budgetId.
 */
export function useBudgetData(budgetId: string | null) {
  const store = useBudgetStore();
  const activePeriodId = store.activePeriodId;
  const unsubsRef = useRef<Array<() => void>>([]);

  // Subscribe to core data (settings, periods, defs, envelopes, all transactions)
  useEffect(() => {
    if (!budgetId) return;

    const unsubs: Array<() => void> = [];
    let settingsLoaded = false;

    unsubs.push(
      subscribeSettings(budgetId, (settings) => {
        store.setSettings(settings);
        // Mark data as loaded only after settings subscription fires
        if (!settingsLoaded) {
          settingsLoaded = true;
          store.setIsDataLoaded(true);
        }
      })
    );

    unsubs.push(
      subscribePeriods(budgetId, (periods) => {
        store.setPeriods(periods);
        // Auto-select the open period
        const open = periods.find((p) => p.status === "open");
        if (open && !store.activePeriodId) {
          store.setActivePeriodId(open.id);
        }
      })
    );

    unsubs.push(
      subscribeFixedExpenseDefs(budgetId, (defs) => {
        store.setFixedExpenseDefs(defs);
      })
    );

    unsubs.push(
      subscribeEnvelopes(budgetId, (envelopes) => {
        store.setEnvelopes(envelopes);
      })
    );

    unsubs.push(
      subscribeAllTransactions(budgetId, (txs) => {
        store.setAllTransactions(txs);
      })
    );

    unsubs.push(
      subscribeAllFixedExpenseInstances(budgetId, (instances) => {
        store.setAllFixedExpenseInstances(instances);
      })
    );

    unsubs.push(
      subscribeTransferTasks(budgetId, (tasks) => {
        store.setTransferTasks(tasks);
      })
    );

    unsubsRef.current = unsubs;

    return () => {
      unsubs.forEach((u) => u());
      store.setIsDataLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId]);

  // Subscribe to period-specific data
  useEffect(() => {
    if (!budgetId || !activePeriodId) return;

    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeFixedExpenseInstances(budgetId, activePeriodId, (instances) => {
        store.setFixedExpenseInstances(instances);
      })
    );

    unsubs.push(
      subscribeTransactions(budgetId, activePeriodId, (txs) => {
        store.setTransactions(txs);
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId, activePeriodId]);

  // Online/offline tracking
  useEffect(() => {
    const onOnline = () => store.setIsOnline(true);
    const onOffline = () => store.setIsOnline(false);

    store.setIsOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

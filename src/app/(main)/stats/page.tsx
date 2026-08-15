"use client";

import { useBudgetStore } from "@/stores/budget-store";
import { StatsView } from "@/components/views/StatsView";

export default function StatsPage() {
  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const fixedExpenseInstances = useBudgetStore((s) => s.fixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const allFixedExpenseInstances = useBudgetStore((s) => s.allFixedExpenseInstances);
  const activePeriodId = useBudgetStore((s) => s.activePeriodId);

  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");

  const today = new Date().toISOString().split("T")[0];

  return (
    <StatsView
      activePeriod={activePeriod ?? null}
      settings={settings}
      periods={periods}
      transactions={transactions}
      allTransactions={allTransactions}
      allFixedExpenseInstances={allFixedExpenseInstances}
      fixedExpenseDefs={fixedExpenseDefs}
      fixedExpenseInstances={fixedExpenseInstances}
      envelopes={envelopes}
      today={today}
    />
  );
}

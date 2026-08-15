"use client";

import { useBudgetStore } from "@/stores/budget-store";
import { useSheets } from "@/lib/contexts/sheet-context";
import { ExpensesList } from "@/components/ExpensesList";

export default function ExpensesPage() {
  const { handleDeleteTransaction } = useSheets();

  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const periods = useBudgetStore((s) => s.periods);
  const activePeriodId = useBudgetStore((s) => s.activePeriodId);

  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");

  return (
    <ExpensesList
      transactions={transactions}
      allTransactions={allTransactions}
      fixedExpenseDefs={fixedExpenseDefs}
      envelopes={envelopes}
      periods={periods}
      activePeriodId={activePeriod?.id ?? ""}
      onDelete={handleDeleteTransaction}
    />
  );
}

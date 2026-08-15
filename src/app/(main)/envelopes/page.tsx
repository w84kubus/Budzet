"use client";

import { useBudgetStore } from "@/stores/budget-store";
import { useSheets } from "@/lib/contexts/sheet-context";
import { EnvelopesView } from "@/components/views/EnvelopesView";
import { calculateFreeFunds } from "@/domain/calculations";

export default function EnvelopesPage() {
  const {
    openAddEnvelope,
    openDistribute,
    openWithdrawal,
    openClosePeriod,
    openEnvelopeHistory,
    openEnvelopeTransfer,
  } = useSheets();

  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const fixedExpenseInstances = useBudgetStore((s) => s.fixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const activePeriodId = useBudgetStore((s) => s.activePeriodId);

  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");

  const freeFunds = activePeriod
    ? calculateFreeFunds(transactions, fixedExpenseInstances)
    : 0;

  const today = new Date().toISOString().split("T")[0];

  return (
    <EnvelopesView
      activePeriod={activePeriod ?? null}
      settings={settings}
      transactions={transactions}
      allTransactions={allTransactions}
      envelopes={envelopes}
      fixedExpenseDefs={fixedExpenseDefs}
      freeFunds={freeFunds}
      today={today}
      onAddEnvelope={openAddEnvelope}
      onDistribute={openDistribute}
      onWithdrawal={openWithdrawal}
      onClosePeriod={openClosePeriod}
      onExpandEnvelope={openEnvelopeHistory}
      onCoverOverdraft={openEnvelopeTransfer}
    />
  );
}

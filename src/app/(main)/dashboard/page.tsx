"use client";

import { useRouter } from "next/navigation";
import { useBudgetStore } from "@/stores/budget-store";
import { useSheets } from "@/lib/contexts/sheet-context";
import { DashboardView } from "@/components/views/DashboardView";
import { calculateFreeFunds } from "@/domain/calculations";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function DashboardPage() {
  const router = useRouter();
  const {
    openAddDef,
    openAddEnvelope,
    openEditInstance,
    openDistribute,
    openClosePeriod,
    handleTogglePaid,
    handleMarkTransferDone,
    handleChangePeriod,
  } = useSheets();

  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);
  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const fixedExpenseInstances = useBudgetStore((s) => s.fixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const transferTasks = useBudgetStore((s) => s.transferTasks);
  const activePeriodId = useBudgetStore((s) => s.activePeriodId);

  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");

  const freeFunds = activePeriod
    ? calculateFreeFunds(transactions, fixedExpenseInstances)
    : 0;

  const today = new Date().toISOString().split("T")[0];

  if (!isDataLoaded) {
    return <LoadingScreen message="Pobieranie danych..." />;
  }

  return (
    <DashboardView
      activePeriod={activePeriod ?? null}
      periods={periods}
      settings={settings}
      transactions={transactions}
      allTransactions={allTransactions}
      fixedExpenseDefs={fixedExpenseDefs}
      fixedExpenseInstances={fixedExpenseInstances}
      envelopes={envelopes}
      transferTasks={transferTasks}
      freeFunds={freeFunds}
      today={today}
      onChangePeriod={handleChangePeriod}
      onTogglePaid={handleTogglePaid}
      onMarkTransferDone={handleMarkTransferDone}
      onAddDef={openAddDef}
      onAddEnvelope={openAddEnvelope}
      onEditInstance={openEditInstance}
      onDistribute={openDistribute}
      onClosePeriod={openClosePeriod}
      onShowAllExpenses={() => router.push("/expenses")}
    />
  );
}

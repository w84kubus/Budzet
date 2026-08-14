"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { usePinLock } from "@/lib/hooks/use-pin-lock";
import { useBudgetStore } from "@/stores/budget-store";
import { PinLock } from "@/components/PinLock";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardView } from "@/components/views/DashboardView";
import { EnvelopesView } from "@/components/views/EnvelopesView";
import { StatsView } from "@/components/views/StatsView";
import { ExpenseSheet } from "@/components/ExpenseSheet";
import { AddFixedExpenseSheet } from "@/components/AddFixedExpenseSheet";
import { AddEnvelopeSheet } from "@/components/AddEnvelopeSheet";
import { EditFixedExpenseSheet } from "@/components/EditFixedExpenseSheet";
import { DistributeFundsSheet } from "@/components/DistributeFundsSheet";
import { WithdrawalSheet } from "@/components/WithdrawalSheet";
import { EnvelopeTransferSheet } from "@/components/EnvelopeTransferSheet";
import { ClosePeriodWizard } from "@/components/ClosePeriodWizard";
import { ExpensesList } from "@/components/ExpensesList";
import { EnvelopeHistory } from "@/components/envelopes/EnvelopeHistory";
import { ToastContainer, showToast } from "@/components/Toast";
import { DashboardSkeleton } from "@/components/ui";
import {
  calculateFreeFunds,
} from "@/domain/calculations";
import { closePeriod } from "@/domain/operations";
import {
  saveTransaction,
  deleteTransaction,
  updateTransferTask,
  updateFixedExpenseInstance,
  updateFixedExpenseDef,
  saveFixedExpenseDef,
  saveFixedExpenseInstance,
  saveFixedExpenseInstances,
  saveEnvelope,
  savePeriod,
  saveTransferTask,
} from "@/lib/firebase/db";
import { formatAmount } from "@/domain/money";
import type {
  Transaction,
  Envelope,
  FixedExpenseInstance,
  FixedExpenseDef,
  FixedExpenseType,
  TransferBreakdownItem,
} from "@/domain/types";

export default function Home() {
  const router = useRouter();
  const { user, loading, budgetId } = useAuth();
  useBudgetData(budgetId);
  const { isLocked } = usePinLock();

  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const fixedExpenseInstances = useBudgetStore((s) => s.fixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const allFixedExpenseInstances = useBudgetStore((s) => s.allFixedExpenseInstances);
  const transferTasks = useBudgetStore((s) => s.transferTasks);
  const activePeriodId = useBudgetStore((s) => s.activePeriodId);
  const setActivePeriodId = useBudgetStore((s) => s.setActivePeriodId);

  // ── Sheet states ──
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addDefOpen, setAddDefOpen] = useState(false);
  const [addEnvOpen, setAddEnvOpen] = useState(false);
  const [editInstOpen, setEditInstOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<FixedExpenseInstance | null>(null);
  const [editingDef, setEditingDef] = useState<FixedExpenseDef | null>(null);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Envelope | null>(null);
  const [transferAmount, setTransferAmount] = useState(0);
  const [closePeriodOpen, setClosePeriodOpen] = useState(false);
  const [envelopeHistoryOpen, setEnvelopeHistoryOpen] = useState(false);
  const [historyEnvelope, setHistoryEnvelope] = useState<Envelope | null>(null);

  const [activeNav, setActiveNav] = useState<"dashboard" | "expenses" | "envelopes" | "stats">("dashboard");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isDataLoaded && !settings) {
      router.push("/onboarding");
    }
  }, [user, isDataLoaded, settings, router]);

  // ── Helpers ──
  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");
  const today = new Date().toISOString().split("T")[0];

  const freeFunds = activePeriod
    ? calculateFreeFunds(transactions, fixedExpenseInstances)
    : 0;

  // ── Handlers ──

  const handleSaveExpense = useCallback(
    async (tx: Omit<Transaction, "id" | "createdAt">) => {
      if (!budgetId) return;
      const fullTx: Transaction = {
        ...tx,
        id: "",
        createdAt: new Date().toISOString(),
      };
      const savedId = await saveTransaction(budgetId, fullTx);
      showToast({
        message: `Zapisano — ${formatAmount(tx.amount)} zł`,
        undoAction: () => {
          deleteTransaction(budgetId, savedId);
        },
      });
    },
    [budgetId]
  );

  const handleTogglePaid = useCallback(
    async (instance: FixedExpenseInstance) => {
      if (!budgetId) return;
      await updateFixedExpenseInstance(budgetId, instance.id, {
        isPaid: !instance.isPaid,
        paidAt: !instance.isPaid ? new Date().toISOString() : null,
        actual: !instance.isPaid ? instance.planned : 0,
      });
    },
    [budgetId]
  );

  const handleMarkTransferDone = useCallback(
    async (taskId: string) => {
      if (!budgetId) return;
      await updateTransferTask(budgetId, taskId, {
        isDone: true,
        doneAt: new Date().toISOString(),
      });
    },
    [budgetId]
  );

  const handleAddFixedExpense = useCallback(
    async (data: { name: string; type: FixedExpenseType; defaultPlanned: number; dueDay: number | null }) => {
      if (!budgetId || !activePeriod) return;
      const defId = `fed_${Date.now()}`;
      const def: FixedExpenseDef = {
        id: defId,
        name: data.name,
        type: data.type,
        defaultPlanned: data.defaultPlanned,
        dueDay: data.dueDay,
        subcategories: [],
        order: fixedExpenseDefs.length,
        archived: false,
      };
      await saveFixedExpenseDef(budgetId, def);
      const instId = `${activePeriod.id}_${defId}`;
      await saveFixedExpenseInstance(budgetId, {
        id: instId,
        periodId: activePeriod.id,
        defId,
        planned: data.defaultPlanned,
        actual: 0,
        isPaid: false,
        paidAt: null,
      });
      showToast({ message: `Dodano: ${data.name}` });
    },
    [budgetId, fixedExpenseDefs.length, activePeriodId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAddEnvelope = useCallback(
    async (data: { name: string; emoji: string; monthlyPlan: number; targetAmount: number | null }) => {
      if (!budgetId) return;
      const envId = `env_${Date.now()}`;
      await saveEnvelope(budgetId, {
        id: envId,
        name: data.name,
        emoji: data.emoji,
        monthlyPlan: data.monthlyPlan,
        targetAmount: data.targetAmount,
        subcategories: [],
        order: envelopes.length,
        archived: false,
      });
      showToast({ message: `Dodano kopertę: ${data.emoji} ${data.name}` });
    },
    [budgetId, envelopes.length]
  );

  const handleEditInstance = useCallback(
    (instance: FixedExpenseInstance, def: FixedExpenseDef) => {
      setEditingInstance(instance);
      setEditingDef(def);
      setEditInstOpen(true);
    },
    []
  );

  const handleSaveInstancePlanned = useCallback(
    async (instanceId: string, planned: number) => {
      if (!budgetId) return;
      await updateFixedExpenseInstance(budgetId, instanceId, { planned });
    },
    [budgetId]
  );

  const handleSaveDefName = useCallback(
    async (defId: string, name: string) => {
      if (!budgetId) return;
      await updateFixedExpenseDef(budgetId, defId, { name });
      showToast({ message: `Zmieniono nazwę na „${name}"` });
    },
    [budgetId]
  );

  const handleChangePeriod = useCallback(
    (periodId: string) => {
      setActivePeriodId(periodId);
    },
    [setActivePeriodId]
  );

  const handleDistribute = useCallback(
    async (allocations: TransferBreakdownItem[]) => {
      if (!budgetId || !activePeriod) return;
      const now = new Date().toISOString();
      const dateStr = now.split("T")[0];

      for (const alloc of allocations) {
        await saveTransaction(budgetId, {
          id: "",
          periodId: activePeriod.id,
          kind: "allocation",
          amount: alloc.amount,
          date: dateStr,
          envelopeId: alloc.envelopeId,
          isImpulse: false,
          createdAt: now,
        });
      }

      const totalAmount = allocations.reduce((s, a) => s + a.amount, 0);
      await saveTransferTask(budgetId, {
        id: "",
        periodId: activePeriod.id,
        totalAmount,
        breakdown: allocations,
        createdAt: now,
        isDone: false,
        doneAt: null,
      });

      showToast({
        message: `Rozdysponowano ${formatAmount(totalAmount)} zł`,
      });
    },
    [budgetId, activePeriod]
  );

  const handleWithdrawal = useCallback(
    async (envelopeId: string, amount: number, note: string) => {
      if (!budgetId || !activePeriod) return;
      const now = new Date().toISOString();
      await saveTransaction(budgetId, {
        id: "",
        periodId: activePeriod.id,
        kind: "withdrawal",
        amount,
        date: now.split("T")[0],
        envelopeId,
        note: note || undefined,
        isImpulse: false,
        createdAt: now,
      });
      showToast({ message: `Wyjęto ${formatAmount(amount)} zł z koperty` });
    },
    [budgetId, activePeriod]
  );

  const handleEnvelopeTransfer = useCallback(
    async (sourceId: string, targetId: string, amount: number) => {
      if (!budgetId || !activePeriod) return;
      const now = new Date().toISOString();
      await saveTransaction(budgetId, {
        id: "",
        periodId: activePeriod.id,
        kind: "envelopeTransfer",
        amount,
        date: now.split("T")[0],
        envelopeId: sourceId,
        targetEnvelopeId: targetId,
        isImpulse: false,
        createdAt: now,
      });
      showToast({ message: `Przeniesiono ${formatAmount(amount)} zł` });
    },
    [budgetId, activePeriod]
  );

  const handleCoverOverdraft = useCallback(
    (envelope: Envelope, overdraftAmount: number) => {
      setTransferTarget(envelope);
      setTransferAmount(overdraftAmount);
      setTransferOpen(true);
    },
    []
  );

  const handleExpandEnvelope = useCallback((envelope: Envelope) => {
    setHistoryEnvelope(envelope);
    setEnvelopeHistoryOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (txId: string) => {
      if (!budgetId) return;
      await deleteTransaction(budgetId, txId);
      showToast({ message: "Usunięto transakcję" });
    },
    [budgetId]
  );

  const handleClosePeriod = useCallback(
    async (data: { newStartDate: string; newIncome: number }) => {
      if (!budgetId || !activePeriod) return;

      const now = new Date().toISOString();
      const result = closePeriod({
        currentPeriod: activePeriod,
        newStartDate: data.newStartDate,
        newExpectedIncome: data.newIncome,
        fixedExpenseDefs,
      });

      await savePeriod(budgetId, result.closedPeriod);
      await savePeriod(budgetId, result.newPeriod);
      if (result.newInstances.length > 0) {
        await saveFixedExpenseInstances(budgetId, result.newInstances);
      }

      await saveTransaction(budgetId, {
        id: "",
        periodId: result.newPeriod.id,
        kind: "income",
        amount: data.newIncome,
        date: data.newStartDate,
        isImpulse: false,
        createdAt: now,
      });

      setActivePeriodId(result.newPeriod.id);
      setClosePeriodOpen(false);
      showToast({ message: `Nowy okres: ${result.newPeriod.label}` });
    },
    [budgetId, activePeriod, fixedExpenseDefs, setActivePeriodId]
  );

  // ── Render guards ──

  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) return null;
  if (isLocked) return <PinLock />;

  // ── Active view ──

  const renderActiveView = () => {
    switch (activeNav) {
      case "dashboard":
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
            onAddDef={() => setAddDefOpen(true)}
            onAddEnvelope={() => setAddEnvOpen(true)}
            onEditInstance={handleEditInstance}
            onDistribute={() => setDistributeOpen(true)}
            onClosePeriod={() => setClosePeriodOpen(true)}
            onShowAllExpenses={() => setActiveNav("expenses")}
          />
        );
      case "envelopes":
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
            onAddEnvelope={() => setAddEnvOpen(true)}
            onDistribute={() => setDistributeOpen(true)}
            onWithdrawal={() => setWithdrawalOpen(true)}
            onClosePeriod={() => setClosePeriodOpen(true)}
            onExpandEnvelope={handleExpandEnvelope}
            onCoverOverdraft={handleCoverOverdraft}
          />
        );
      case "expenses":
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
      case "stats":
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
      default:
        return null;
    }
  };

  return (
    <>
      <AppShell
        activeNav={activeNav}
        onNavigate={setActiveNav}
        onFab={() => setSheetOpen(true)}
      >
        {renderActiveView()}
      </AppShell>

      {/* ── Sheets ── */}

      <ExpenseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={handleSaveExpense}
        envelopes={envelopes}
        fixedExpenseDefs={fixedExpenseDefs}
        periodId={activePeriod?.id ?? ""}
      />

      <AddFixedExpenseSheet
        open={addDefOpen}
        onClose={() => setAddDefOpen(false)}
        onSave={handleAddFixedExpense}
      />

      <AddEnvelopeSheet
        open={addEnvOpen}
        onClose={() => setAddEnvOpen(false)}
        onSave={handleAddEnvelope}
      />

      <EditFixedExpenseSheet
        open={editInstOpen}
        instance={editingInstance}
        def={editingDef}
        onClose={() => {
          setEditInstOpen(false);
          setEditingInstance(null);
          setEditingDef(null);
        }}
        onSave={handleSaveInstancePlanned}
        onSaveName={handleSaveDefName}
      />

      <DistributeFundsSheet
        open={distributeOpen}
        available={Math.max(0, freeFunds)}
        envelopes={envelopes}
        onClose={() => setDistributeOpen(false)}
        onSave={handleDistribute}
      />

      <WithdrawalSheet
        open={withdrawalOpen}
        envelopes={envelopes}
        allTransactions={allTransactions}
        onClose={() => setWithdrawalOpen(false)}
        onSave={handleWithdrawal}
      />

      <EnvelopeTransferSheet
        open={transferOpen}
        targetEnvelope={transferTarget}
        suggestedAmount={transferAmount}
        envelopes={envelopes}
        allTransactions={allTransactions}
        onClose={() => {
          setTransferOpen(false);
          setTransferTarget(null);
          setTransferAmount(0);
        }}
        onSave={handleEnvelopeTransfer}
      />

      {activePeriod && settings && (
        <ClosePeriodWizard
          open={closePeriodOpen}
          period={activePeriod}
          transactions={transactions}
          fixedExpenseDefs={fixedExpenseDefs}
          fixedExpenseInstances={fixedExpenseInstances}
          envelopes={envelopes}
          allTransactions={allTransactions}
          transferTasks={transferTasks}
          defaultPaydayDay={settings.paydayDay}
          defaultIncome={activePeriod.expectedIncome}
          onClose={() => setClosePeriodOpen(false)}
          onComplete={handleClosePeriod}
        />
      )}

      {envelopeHistoryOpen && historyEnvelope && (
        <EnvelopeHistory
          envelope={historyEnvelope}
          transactions={allTransactions}
          envelopes={envelopes}
          fixedExpenseDefs={fixedExpenseDefs}
          onClose={() => {
            setEnvelopeHistoryOpen(false);
            setHistoryEnvelope(null);
          }}
        />
      )}

      <ToastContainer />
    </>
  );
}

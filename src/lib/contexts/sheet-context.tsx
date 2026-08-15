"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetStore } from "@/stores/budget-store";
import { ExpenseSheet } from "@/components/ExpenseSheet";
import { AddFixedExpenseSheet } from "@/components/AddFixedExpenseSheet";
import { AddEnvelopeSheet } from "@/components/AddEnvelopeSheet";
import { EditFixedExpenseSheet } from "@/components/EditFixedExpenseSheet";
import { DistributeFundsSheet } from "@/components/DistributeFundsSheet";
import { WithdrawalSheet } from "@/components/WithdrawalSheet";
import { EnvelopeTransferSheet } from "@/components/EnvelopeTransferSheet";
import { ClosePeriodWizard } from "@/components/ClosePeriodWizard";
import { EnvelopeHistory } from "@/components/envelopes/EnvelopeHistory";
import { ToastContainer, showToast } from "@/components/Toast";
import { calculateFreeFunds } from "@/domain/calculations";
import { closePeriod } from "@/domain/operations";
import { formatAmount } from "@/domain/money";
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
import type {
  Transaction,
  Envelope,
  FixedExpenseInstance,
  FixedExpenseDef,
  FixedExpenseType,
  TransferBreakdownItem,
} from "@/domain/types";

type SheetContextType = {
  openExpenseSheet: () => void;
  openAddDef: () => void;
  openAddEnvelope: () => void;
  openEditInstance: (instance: FixedExpenseInstance, def: FixedExpenseDef) => void;
  openDistribute: () => void;
  openWithdrawal: () => void;
  openClosePeriod: () => void;
  openEnvelopeTransfer: (envelope: Envelope, amount: number) => void;
  openEnvelopeHistory: (envelope: Envelope) => void;
  handleDeleteTransaction: (txId: string) => Promise<void>;
  handleTogglePaid: (instance: FixedExpenseInstance) => Promise<void>;
  handleMarkTransferDone: (taskId: string) => Promise<void>;
  handleChangePeriod: (periodId: string) => void;
};

const SheetContext = createContext<SheetContextType | null>(null);

export function useSheets() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheets must be used within SheetProvider");
  return ctx;
}

export function SheetProvider({ children }: { children: ReactNode }) {
  const { budgetId } = useAuth();

  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const fixedExpenseInstances = useBudgetStore((s) => s.fixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const transactions = useBudgetStore((s) => s.transactions);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
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

  const activePeriod = activePeriodId
    ? periods.find((p) => p.id === activePeriodId)
    : periods.find((p) => p.status === "open");

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
    [budgetId, fixedExpenseDefs.length, activePeriod]
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

  const handleDeleteTransaction = useCallback(
    async (txId: string) => {
      if (!budgetId) return;
      await deleteTransaction(budgetId, txId);
      showToast({ message: "Usunięto transakcję" });
    },
    [budgetId]
  );

  const handleChangePeriod = useCallback(
    (periodId: string) => {
      setActivePeriodId(periodId);
    },
    [setActivePeriodId]
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

  // ── Context value ──

  const contextValue: SheetContextType = {
    openExpenseSheet: () => setSheetOpen(true),
    openAddDef: () => setAddDefOpen(true),
    openAddEnvelope: () => setAddEnvOpen(true),
    openEditInstance: (instance, def) => {
      setEditingInstance(instance);
      setEditingDef(def);
      setEditInstOpen(true);
    },
    openDistribute: () => setDistributeOpen(true),
    openWithdrawal: () => setWithdrawalOpen(true),
    openClosePeriod: () => setClosePeriodOpen(true),
    openEnvelopeTransfer: (envelope, amount) => {
      setTransferTarget(envelope);
      setTransferAmount(amount);
      setTransferOpen(true);
    },
    openEnvelopeHistory: (envelope) => {
      setHistoryEnvelope(envelope);
      setEnvelopeHistoryOpen(true);
    },
    handleDeleteTransaction,
    handleTogglePaid,
    handleMarkTransferDone,
    handleChangePeriod,
  };

  return (
    <SheetContext.Provider value={contextValue}>
      {children}

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
    </SheetContext.Provider>
  );
}

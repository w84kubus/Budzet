"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { usePinLock } from "@/lib/hooks/use-pin-lock";
import { useBudgetStore } from "@/stores/budget-store";
import { PinLock } from "@/components/PinLock";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { BottomNav } from "@/components/BottomNav";
import { ExpenseSheet } from "@/components/ExpenseSheet";
import { AddFixedExpenseSheet } from "@/components/AddFixedExpenseSheet";
import { AddEnvelopeSheet } from "@/components/AddEnvelopeSheet";
import { EditFixedExpenseSheet } from "@/components/EditFixedExpenseSheet";
import { DistributeFundsSheet } from "@/components/DistributeFundsSheet";
import { WithdrawalSheet } from "@/components/WithdrawalSheet";
import { EnvelopeTransferSheet } from "@/components/EnvelopeTransferSheet";
import { ClosePeriodWizard } from "@/components/ClosePeriodWizard";
import { ExpensesList } from "@/components/ExpensesList";
import { PeriodTab } from "@/components/stats/PeriodTab";
import { TrendsTab } from "@/components/stats/TrendsTab";
import { CategoriesTab } from "@/components/stats/CategoriesTab";
import { EnvelopeCard } from "@/components/envelopes/EnvelopeCard";
import { EnvelopeHistory } from "@/components/envelopes/EnvelopeHistory";
import { ToastContainer, showToast } from "@/components/Toast";
import { PeriodHeader } from "@/components/dashboard/PeriodHeader";
import { MainIndicator } from "@/components/dashboard/MainIndicator";
import { TransferTaskCard } from "@/components/dashboard/TransferTaskCard";
import { FixedExpenses } from "@/components/dashboard/FixedExpenses";
import { EnvelopeTiles } from "@/components/dashboard/EnvelopeTiles";
import { ImpulseCounter } from "@/components/dashboard/ImpulseCounter";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import {
  calculateFreeFunds,
  calculateAllEnvelopeBalances,
  calculateAccountBalances,
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
  const [statsTab, setStatsTab] = useState<"period" | "trends" | "categories">("period");

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

  const activeTask = activePeriod
    ? transferTasks.find((t) => t.periodId === activePeriod.id && !t.isDone)
    : undefined;

  const freeFunds = activePeriod
    ? calculateFreeFunds(transactions, fixedExpenseInstances)
    : 0;

  // ── Handlers: existing ──

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

  // ── Handlers: Phase 4 ──

  const handleDistribute = useCallback(
    async (allocations: TransferBreakdownItem[]) => {
      if (!budgetId || !activePeriod) return;
      const now = new Date().toISOString();
      const dateStr = now.split("T")[0];

      // Save allocation transactions
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

      // Save transfer task
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

      // Create income transaction for new period
      const now = new Date().toISOString();

      // Close current period and create new one
      const result = closePeriod({
        currentPeriod: activePeriod,
        newStartDate: data.newStartDate,
        newExpectedIncome: data.newIncome,
        fixedExpenseDefs,
      });

      // Save closed period
      await savePeriod(budgetId, result.closedPeriod);
      // Save new period
      await savePeriod(budgetId, result.newPeriod);
      // Save new fixed expense instances
      if (result.newInstances.length > 0) {
        await saveFixedExpenseInstances(budgetId, result.newInstances);
      }

      // Create income transaction
      await saveTransaction(budgetId, {
        id: "",
        periodId: result.newPeriod.id,
        kind: "income",
        amount: data.newIncome,
        date: data.newStartDate,
        isImpulse: false,
        createdAt: now,
      });

      // Switch to new period
      setActivePeriodId(result.newPeriod.id);
      setClosePeriodOpen(false);

      showToast({ message: `Nowy okres: ${result.newPeriod.label}` });
    },
    [budgetId, activePeriod, fixedExpenseDefs, setActivePeriodId]
  );

  // ── Render guards ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted">Ładowanie…</div>
      </div>
    );
  }

  if (!user) return null;
  if (isLocked) return <PinLock />;

  // ── Envelopes view ──
  const renderEnvelopesView = () => {
    if (!activePeriod || !settings) return null;

    const active = envelopes.filter((e) => !e.archived);
    const balances = calculateAllEnvelopeBalances(
      active.map((e) => e.id),
      allTransactions
    );
    const totalSavings = [...balances.values()].reduce((s, b) => s + b, 0);

    const acctBalances = calculateAccountBalances(
      allTransactions,
      active.map((e) => e.id)
    );

    // Sort: overdrafted first, then by order
    const sorted = [...active].sort((a, b) => {
      const balA = balances.get(a.id) ?? 0;
      const balB = balances.get(b.id) ?? 0;
      if (balA < 0 && balB >= 0) return -1;
      if (balA >= 0 && balB < 0) return 1;
      return a.order - b.order;
    });

    return (
      <div className="mx-auto max-w-[960px] px-4 md:px-8">
        <div className="safe-top pt-2 pb-4">
          <h1 className="font-display text-[22px] font-semibold text-text">
            Koperty
          </h1>
        </div>

        {/* Total savings */}
        <div className="mb-4 rounded-xl bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Suma kopert</span>
            <span className="font-mono text-[22px] font-semibold tabular-nums text-text">
              {formatAmount(totalSavings)}{" "}
              <span className="text-[14px] text-muted">zł</span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-[12px]">
            <span className="text-muted">
              Na koncie oszczędnościowym powinno być:
            </span>
            <span className="font-mono tabular-nums text-muted">
              {formatAmount(acctBalances.expectedSavings)} zł
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setDistributeOpen(true)}
            disabled={freeFunds <= 0}
            className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
              freeFunds > 0
                ? "bg-brass text-ink active:opacity-90"
                : "bg-panel-2 text-muted/30"
            }`}
          >
            Rozdysponuj
          </button>
          <button
            onClick={() => setWithdrawalOpen(true)}
            className="flex-1 rounded-xl border border-line py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
          >
            Wyjmij z koperty
          </button>
          <button
            onClick={() => setClosePeriodOpen(true)}
            className="flex-1 rounded-xl border border-line py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
          >
            Mam wypłatę
          </button>
        </div>

        {/* Envelope cards */}
        <div className="space-y-3 pb-24 md:pb-4">
          {sorted.length === 0 ? (
            <div className="rounded-xl bg-panel p-6 text-center">
              <p className="text-[14px] text-muted">Brak kopert.</p>
              <button
                onClick={() => setAddEnvOpen(true)}
                className="mt-2 text-[13px] font-medium text-brass"
              >
                Dodaj pierwszą
              </button>
            </div>
          ) : (
            sorted.map((env) => (
              <EnvelopeCard
                key={env.id}
                envelope={env}
                allTransactions={allTransactions}
                periodTransactions={transactions}
                period={activePeriod}
                paydayDay={settings.paydayDay}
                today={today}
                onExpand={handleExpandEnvelope}
                onCoverOverdraft={handleCoverOverdraft}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // ── Dashboard view ──
  const renderDashboard = () => {
    if (!activePeriod || !settings) {
      return (
        <div className="safe-top flex min-h-[60vh] flex-col items-center justify-center px-5">
          <p className="mb-4 text-center text-muted">
            Brak otwartego okresu budżetowego.
          </p>
          <button
            onClick={() => setClosePeriodOpen(true)}
            className="rounded-lg bg-brass px-6 py-2.5 text-sm font-medium text-ink"
          >
            Rozpocznij okres
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-[960px] px-4 md:px-8">
        {/* Period header */}
        <div className="safe-top">
          <PeriodHeader
            period={activePeriod}
            periods={periods}
            paydayDay={settings.paydayDay}
            today={today}
            onChangePeriod={handleChangePeriod}
          />
        </div>

        {/* ── Desktop: 2-column grid / Mobile: stack ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4 md:space-y-5">
            <MainIndicator
              period={activePeriod}
              transactions={transactions}
              fixedExpenseInstances={fixedExpenseInstances}
              paydayDay={settings.paydayDay}
              today={today}
            />

            {activeTask && (
              <TransferTaskCard
                task={activeTask}
                envelopes={envelopes}
                onMarkDone={handleMarkTransferDone}
              />
            )}

            {/* Distribute / Close period buttons */}
            {activePeriod.status === "open" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setDistributeOpen(true)}
                  disabled={freeFunds <= 0}
                  className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
                    freeFunds > 0
                      ? "bg-panel text-brass hover:bg-panel-2"
                      : "bg-panel text-muted/30"
                  }`}
                >
                  Rozdysponuj
                </button>
                <button
                  onClick={() => setClosePeriodOpen(true)}
                  className="flex-1 rounded-xl bg-panel py-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-panel-2 hover:text-text"
                >
                  Mam wypłatę
                </button>
              </div>
            )}

            <FixedExpenses
              defs={fixedExpenseDefs}
              instances={fixedExpenseInstances}
              onTogglePaid={handleTogglePaid}
              onAddDef={() => setAddDefOpen(true)}
              onEditInstance={handleEditInstance}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 md:space-y-5">
            <EnvelopeTiles
              envelopes={envelopes}
              allTransactions={allTransactions}
              onAdd={() => setAddEnvOpen(true)}
            />
          </div>

          {/* FULL WIDTH ROW */}
          <div className="space-y-4 md:col-span-2 md:space-y-5">
            <ImpulseCounter
              periodTransactions={transactions}
              allTransactions={allTransactions}
              currentPeriodId={activePeriod.id}
            />
            <RecentTransactions
              transactions={transactions}
              fixedExpenseDefs={fixedExpenseDefs}
              envelopes={envelopes}
              onShowAll={() => setActiveNav("expenses")}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ink pb-24 md:pb-8">
      {/* Online indicator */}
      <div className="fixed top-0 right-0 z-20 p-3">
        <OnlineIndicator />
      </div>

      {/* Desktop top nav — hidden on mobile (BottomNav handles it) */}
      <nav className="mx-auto hidden max-w-[960px] px-4 pt-2 md:block md:px-8">
        <div className="flex gap-1 rounded-xl bg-panel p-1">
          {([
            { key: "dashboard" as const, label: "Pulpit" },
            { key: "expenses" as const, label: "Wydatki" },
            { key: "envelopes" as const, label: "Koperty" },
            { key: "stats" as const, label: "Statystyki" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveNav(tab.key)}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
                activeNav === tab.key
                  ? "bg-panel-2 text-brass"
                  : "text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* View switching based on nav */}
      {activeNav === "dashboard" && renderDashboard()}
      {activeNav === "envelopes" && renderEnvelopesView()}
      {activeNav === "expenses" && (
        <ExpensesList
          transactions={transactions}
          allTransactions={allTransactions}
          fixedExpenseDefs={fixedExpenseDefs}
          envelopes={envelopes}
          periods={periods}
          activePeriodId={activePeriod?.id ?? ""}
          onDelete={handleDeleteTransaction}
        />
      )}
      {activeNav === "stats" && activePeriod && settings && (
        <div className="mx-auto max-w-[960px] px-4 md:px-8">
          <div className="safe-top pt-2 pb-2">
            <h1 className="font-display text-[22px] font-semibold text-text">
              Statystyki
            </h1>
          </div>

          {/* Tab selector */}
          <div className="mb-4 flex gap-1 rounded-xl bg-panel p-1">
            {([
              { key: "period" as const, label: "Okres" },
              { key: "trends" as const, label: "Trendy" },
              { key: "categories" as const, label: "Kategorie" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatsTab(tab.key)}
                className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
                  statsTab === tab.key
                    ? "bg-panel-2 text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pb-24 md:pb-4">
            {statsTab === "period" && (
              <PeriodTab
                period={activePeriod}
                transactions={transactions}
                fixedExpenseDefs={fixedExpenseDefs}
                fixedExpenseInstances={fixedExpenseInstances}
                envelopes={envelopes}
                today={today}
              />
            )}
            {statsTab === "trends" && (
              <TrendsTab
                periods={periods}
                allTransactions={allTransactions}
                allInstances={allFixedExpenseInstances}
              />
            )}
            {statsTab === "categories" && (
              <CategoriesTab
                periods={periods}
                allTransactions={allTransactions}
                allInstances={allFixedExpenseInstances}
                fixedExpenseDefs={fixedExpenseDefs}
                envelopes={envelopes}
                currentPeriodId={activePeriod.id}
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom navigation — mobile only */}
      <div className="md:hidden">
        <BottomNav
          active={activeNav}
          onNavigate={setActiveNav}
          onFab={() => setSheetOpen(true)}
        />
      </div>

      {/* Desktop FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-8 bottom-8 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-brass shadow-lg shadow-brass/20 active:opacity-90 md:flex"
        aria-label="Dodaj wydatek"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* ── All Sheets ── */}

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
    </div>
  );
}

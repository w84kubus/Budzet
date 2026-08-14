"use client";

import { PeriodHeader } from "@/components/dashboard/PeriodHeader";
import { MainIndicator } from "@/components/dashboard/MainIndicator";
import { TransferTaskCard } from "@/components/dashboard/TransferTaskCard";
import { FixedExpenses } from "@/components/dashboard/FixedExpenses";
import { EnvelopeTiles } from "@/components/dashboard/EnvelopeTiles";
import { ImpulseCounter } from "@/components/dashboard/ImpulseCounter";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Button } from "@/components/ui";
import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  TransferTask,
  UserSettings,
} from "@/domain/types";

type Props = {
  activePeriod: Period | null;
  periods: Period[];
  settings: UserSettings | null;
  transactions: Transaction[];
  allTransactions: Transaction[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  transferTasks: TransferTask[];
  freeFunds: number;
  today: string;
  onChangePeriod: (periodId: string) => void;
  onTogglePaid: (instance: FixedExpenseInstance) => void;
  onMarkTransferDone: (taskId: string) => void;
  onAddDef: () => void;
  onAddEnvelope: () => void;
  onEditInstance: (instance: FixedExpenseInstance, def: FixedExpenseDef) => void;
  onDistribute: () => void;
  onClosePeriod: () => void;
  onShowAllExpenses: () => void;
};

export function DashboardView({
  activePeriod,
  periods,
  settings,
  transactions,
  allTransactions,
  fixedExpenseDefs,
  fixedExpenseInstances,
  envelopes,
  transferTasks,
  freeFunds,
  today,
  onChangePeriod,
  onTogglePaid,
  onMarkTransferDone,
  onAddDef,
  onAddEnvelope,
  onEditInstance,
  onDistribute,
  onClosePeriod,
  onShowAllExpenses,
}: Props) {
  // ── Empty state: no open period ──
  if (!activePeriod || !settings) {
    return (
      <div className="safe-top flex min-h-[60vh] flex-col items-center justify-center px-5">
        <p className="mb-4 text-center text-muted">
          Brak otwartego okresu budżetowego.
        </p>
        <Button onClick={onClosePeriod}>
          Rozpocznij okres
        </Button>
      </div>
    );
  }

  const activeTask = transferTasks.find(
    (t) => t.periodId === activePeriod.id && !t.isDone
  );

  return (
    <div className="mx-auto max-w-[960px] px-4 md:px-8">
      {/* Period header */}
      <div className="safe-top">
        <PeriodHeader
          period={activePeriod}
          periods={periods}
          paydayDay={settings.paydayDay}
          today={today}
          onChangePeriod={onChangePeriod}
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
              onMarkDone={onMarkTransferDone}
            />
          )}

          {/* Action buttons */}
          {activePeriod.status === "open" && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={onDistribute}
                disabled={freeFunds <= 0}
              >
                Rozdysponuj
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onClosePeriod}
              >
                Mam wypłatę
              </Button>
            </div>
          )}

          <FixedExpenses
            defs={fixedExpenseDefs}
            instances={fixedExpenseInstances}
            onTogglePaid={onTogglePaid}
            onAddDef={onAddDef}
            onEditInstance={onEditInstance}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 md:space-y-5">
          <EnvelopeTiles
            envelopes={envelopes}
            allTransactions={allTransactions}
            onAdd={onAddEnvelope}
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
            onShowAll={onShowAllExpenses}
          />
        </div>
      </div>
    </div>
  );
}

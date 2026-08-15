"use client";

import { useState, useEffect } from "react";
import { formatAmount, groszeToCurrencyInput } from "@/domain/money";
import {
  calculateFreeFunds,
  calculateImpulseTotal,
  calculateAllEnvelopeBalances,
} from "@/domain/calculations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  TransferTask,
} from "@/domain/types";

type Props = {
  open: boolean;
  period: Period;
  transactions: Transaction[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  allTransactions: Transaction[];
  transferTasks: TransferTask[];
  defaultPaydayDay: number;
  defaultIncome: number;
  onClose: () => void;
  onComplete: (data: {
    newStartDate: string;
    newIncome: number;
  }) => void;
};

type Step = "summary" | "issues" | "newPeriod";

function parseAmountInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function ClosePeriodWizard({
  open,
  period,
  transactions,
  fixedExpenseDefs,
  fixedExpenseInstances,
  envelopes,
  allTransactions,
  transferTasks,
  defaultPaydayDay,
  defaultIncome,
  onClose,
  onComplete,
}: Props) {
  const [step, setStep] = useState<Step>("summary");
  const [newDate, setNewDate] = useState("");
  const [newIncome, setNewIncome] = useState("");

  // Suppress unused variable warning - defaultPaydayDay reserved for future auto-fill
  void defaultPaydayDay;

  useEffect(() => {
    if (open) {
      setStep("summary");
      const today = new Date().toISOString().split("T")[0];
      setNewDate(today);
      setNewIncome(groszeToCurrencyInput(defaultIncome));
    }
  }, [open, defaultIncome]);

  if (!open) return null;

  // ── Summary calculations ──
  const totalIncome = transactions
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  const paidFixed = fixedExpenseInstances
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + (i.actual > 0 ? i.actual : i.planned), 0);

  const totalFixedPlanned = fixedExpenseInstances.reduce(
    (s, i) => s + i.planned,
    0
  );

  const envelopeExpenses = transactions
    .filter((t) => t.kind === "envelopeExpense")
    .reduce((s, t) => s + t.amount, 0);

  const totalAllocated = transactions
    .filter((t) => t.kind === "allocation")
    .reduce((s, t) => s + t.amount, 0);

  const impulseTotal = calculateImpulseTotal(transactions);

  const freeFunds = calculateFreeFunds(transactions, fixedExpenseInstances);

  // ── Issues ──
  const unpaidInstances = fixedExpenseInstances.filter((i) => !i.isPaid);

  const openTransferTasks = transferTasks.filter(
    (t) => t.periodId === period.id && !t.isDone
  );

  const activeEnvelopes = envelopes.filter((e) => !e.archived);
  const envelopeBalances = calculateAllEnvelopeBalances(
    activeEnvelopes.map((e) => e.id),
    allTransactions
  );
  const overdraftedEnvelopes = activeEnvelopes.filter(
    (e) => (envelopeBalances.get(e.id) ?? 0) < 0
  );

  const hasIssues =
    unpaidInstances.length > 0 ||
    openTransferTasks.length > 0 ||
    overdraftedEnvelopes.length > 0;

  const incomeGrosze = parseAmountInput(newIncome);
  const canComplete = newDate !== "" && incomeGrosze > 0;

  return (
    <>
      <div
        className="sheet-backdrop-enter fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <div className="sheet-enter fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] max-w-[430px] flex-col rounded-t-2xl bg-panel safe-bottom">
        <div className="flex justify-center py-3">
          <div className="h-[4px] w-10 rounded-full bg-line" />
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 pb-4">
          {(["summary", "issues", "newPeriod"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-[3px] flex-1 rounded-full ${
                (["summary", "issues", "newPeriod"] as const).indexOf(step) >= i
                  ? "bg-brass"
                  : "bg-line"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* ── Step 1: Summary ── */}
          {step === "summary" && (
            <div>
              <h2 className="mb-4 font-display text-body-lg font-semibold text-text">
                Podsumowanie: {period.label}
              </h2>

              <div className="space-y-3">
                <SummaryRow
                  label="Przychody"
                  value={totalIncome}
                  color="text-good"
                />
                <SummaryRow
                  label="Wydatki stałe"
                  value={paidFixed}
                  sub={`plan: ${formatAmount(totalFixedPlanned)} zł`}
                />
                <SummaryRow
                  label="Wydatki z kopert"
                  value={envelopeExpenses}
                />
                <SummaryRow
                  label="Odłożone na koperty"
                  value={totalAllocated}
                  color="text-good"
                />
                {impulseTotal > 0 && (
                  <SummaryRow
                    label="⚡ Impulsy"
                    value={impulseTotal}
                    color="text-bad"
                  />
                )}

                <div className="border-t border-line pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-text">
                      Wolne środki
                    </span>
                    <span
                      className={`font-mono text-body-lg font-semibold tabular-nums ${
                        freeFunds >= 0 ? "text-text" : "text-bad"
                      }`}
                    >
                      {freeFunds < 0 ? "−" : ""}
                      {formatAmount(Math.abs(freeFunds))} zł
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Issues ── */}
          {step === "issues" && (
            <div>
              <h2 className="mb-4 font-display text-body-lg font-semibold text-text">
                Niedokończone sprawy
              </h2>

              {!hasIssues ? (
                <div className="rounded-xl bg-good/8 p-4 text-center">
                  <p className="text-sm text-good">
                    Wszystko załatwione! ✓
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unpaidInstances.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-caption font-medium uppercase tracking-wider text-muted">
                        Niezapłacone wydatki stałe
                      </h3>
                      <div className="space-y-1">
                        {unpaidInstances.map((inst) => {
                          const def = fixedExpenseDefs.find(
                            (d) => d.id === inst.defId
                          );
                          return (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between rounded-lg bg-panel-2 px-3 py-2"
                            >
                              <span className="text-caption text-text">
                                {def?.name ?? "-"}
                              </span>
                              <span className="font-mono text-caption tabular-nums text-muted">
                                {formatAmount(inst.planned)} zł
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {openTransferTasks.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-caption font-medium uppercase tracking-wider text-muted">
                        Otwarte zadania przelewu
                      </h3>
                      {openTransferTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg bg-panel-2 px-3 py-2"
                        >
                          <span className="font-mono text-caption tabular-nums text-text">
                            {formatAmount(task.totalAmount)} zł
                          </span>
                          <span className="ml-2 text-micro text-muted">
                            do przelania
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {overdraftedEnvelopes.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-caption font-medium uppercase tracking-wider text-muted">
                        Przekroczone koperty
                      </h3>
                      <div className="space-y-1">
                        {overdraftedEnvelopes.map((env) => {
                          const bal = envelopeBalances.get(env.id) ?? 0;
                          return (
                            <div
                              key={env.id}
                              className="flex items-center justify-between rounded-lg bg-bad/8 px-3 py-2"
                            >
                              <span className="text-caption text-text">
                                {env.emoji} {env.name}
                              </span>
                              <span className="font-mono text-caption tabular-nums text-bad">
                                −{formatAmount(Math.abs(bal))} zł
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-micro text-muted/70">
                    Możesz zamknąć okres mimo niedokończonych spraw - przejdą do
                    następnego.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: New Period ── */}
          {step === "newPeriod" && (
            <div>
              <h2 className="mb-4 font-display text-body-lg font-semibold text-text">
                Nowy okres
              </h2>

              <div className="space-y-4">
                <Input
                  label="Data wypłaty"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />

                <AmountInput
                  label="Kwota wypłaty"
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
                  placeholder="0,00"
                  className="text-right text-body-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="border-t border-line px-5 pb-2 pt-3">
          <div className="flex gap-3">
            {step !== "summary" && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  if (step === "issues") setStep("summary");
                  if (step === "newPeriod") setStep("issues");
                }}
              >
                Wstecz
              </Button>
            )}
            {step === "summary" && (
              <Button variant="secondary" fullWidth onClick={onClose}>
                Anuluj
              </Button>
            )}
            {step !== "newPeriod" && (
              <Button
                fullWidth
                onClick={() => {
                  if (step === "summary") setStep("issues");
                  if (step === "issues") setStep("newPeriod");
                }}
              >
                Dalej
              </Button>
            )}
            {step === "newPeriod" && (
              <Button
                fullWidth
                onClick={() => {
                  if (canComplete) {
                    onComplete({
                      newStartDate: newDate,
                      newIncome: incomeGrosze,
                    });
                  }
                }}
                disabled={!canComplete}
              >
                Mam wypłatę - zamknij okres
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryRow({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <span className="text-caption text-muted">{label}</span>
        {sub && (
          <span className="ml-2 text-micro text-muted/50">{sub}</span>
        )}
      </div>
      <span
        className={`font-mono text-sm tabular-nums ${color ?? "text-text"}`}
      >
        {formatAmount(value)} zł
      </span>
    </div>
  );
}

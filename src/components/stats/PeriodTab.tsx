"use client";

import { useMemo, useState, useEffect } from "react";
import { formatAmount } from "@/domain/money";
import {
  calculatePeriodSummary,
  calculateCategoryBreakdown,
  calculateFixedExpenseComparison,
} from "@/domain/statistics";
import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
} from "@/domain/types";

type Props = {
  period: Period;
  transactions: Transaction[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  today: string;
};

// Pie chart colors — muted palette fitting dark theme
const PIE_COLORS = [
  "#D9A441", // brass
  "#6FBF8B", // good
  "#5B9BD5", // blue
  "#E0645A", // bad
  "#9B7FD4", // purple
  "#D4A07F", // tan
  "#7FC4D4", // teal
  "#D47FA0", // pink
  "#8A979E", // muted
  "#BFD46F", // lime
];

export function PeriodTab({
  period,
  transactions,
  fixedExpenseDefs,
  fixedExpenseInstances,
  envelopes,
  today,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const summary = useMemo(
    () =>
      calculatePeriodSummary(
        period,
        transactions,
        fixedExpenseInstances,
        today
      ),
    [period, transactions, fixedExpenseInstances, today]
  );

  const categories = useMemo(
    () =>
      calculateCategoryBreakdown(
        transactions,
        fixedExpenseDefs,
        fixedExpenseInstances,
        envelopes
      ),
    [transactions, fixedExpenseDefs, fixedExpenseInstances, envelopes]
  );

  const fixedComparison = useMemo(
    () =>
      calculateFixedExpenseComparison(fixedExpenseDefs, fixedExpenseInstances),
    [fixedExpenseDefs, fixedExpenseInstances]
  );

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <StatTile label="Przychody" value={summary.income} color="text-good" />
        <StatTile label="Wydatki łącznie" value={summary.totalExpenses} />
        <StatTile label="Odłożone" value={summary.allocated} color="text-good" />
        <StatTile
          label="Stopa oszczędzania"
          valueText={`${summary.savingsRate}%`}
          color={summary.savingsRate >= 20 ? "text-good" : "text-text"}
        />
        <StatTile
          label="Śr. wydatek dzienny"
          value={summary.averageDailyExpense}
        />
        <StatTile
          label="Dni bez wydatku"
          valueText={`${summary.daysWithoutExpense} / ${summary.totalDays}`}
          color="text-muted"
        />
      </div>

      {/* Category breakdown — horizontal bars (works on all sizes) */}
      {categories.length > 0 && (
        <div className="rounded-xl bg-panel p-4">
          <h3 className="mb-3 text-caption font-medium uppercase tracking-wider text-muted">
            Wydatki wg kategorii
          </h3>
          <div className="space-y-2.5">
            {categories.map((cat, i) => (
              <div key={cat.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-caption text-text">
                    {cat.emoji} {cat.name}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-micro tabular-nums text-muted">
                      {cat.percentage}%
                    </span>
                    <span className="font-mono text-caption tabular-nums text-text">
                      {formatAmount(cat.amount)} zł
                    </span>
                  </div>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-panel-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed expenses: plan vs actual */}
      {fixedComparison.length > 0 && (
        <div className="rounded-xl bg-panel p-4">
          <h3 className="mb-3 text-caption font-medium uppercase tracking-wider text-muted">
            Wydatki stałe: plan vs rzeczywistość
          </h3>
          <div className="space-y-3">
            {fixedComparison.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-caption text-text">{item.name}</span>
                  <span className="font-mono text-micro tabular-nums text-muted">
                    {formatAmount(item.actual)}{" "}
                    <span className="text-muted/50">
                      / {formatAmount(item.planned)} zł
                    </span>
                  </span>
                </div>
                <div className="relative h-[6px] overflow-hidden rounded-full bg-panel-2">
                  {/* Plan line */}
                  <div className="absolute inset-0 rounded-full bg-line" />
                  {/* Actual bar */}
                  <div
                    className="relative h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor:
                        item.percentage > 100
                          ? "var(--color-bad)"
                          : item.percentage === 100
                          ? "var(--color-good)"
                          : "var(--color-brass)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impulse highlight */}
      {summary.impulseTotal > 0 && (
        <div className="rounded-xl border border-bad/20 bg-bad/5 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-caption text-muted">⚡ Wydatki impulsywne</span>
            <span className="font-mono text-body-lg font-semibold tabular-nums text-bad">
              {formatAmount(summary.impulseTotal)} zł
            </span>
          </div>
          {summary.totalExpenses > 0 && (
            <p className="mt-1 text-micro text-muted/60">
              {Math.round(
                (summary.impulseTotal / summary.totalExpenses) * 100
              )}
              % wszystkich wydatków
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  valueText,
  color,
}: {
  label: string;
  value?: number;
  valueText?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-panel p-3">
      <p className="text-micro text-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-body-lg font-semibold tabular-nums ${
          color ?? "text-text"
        }`}
      >
        {valueText ?? `${formatAmount(value ?? 0)} zł`}
      </p>
    </div>
  );
}

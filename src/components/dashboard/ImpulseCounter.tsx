"use client";

import { formatAmount } from "@/domain/money";
import { calculateImpulseTotal } from "@/domain/calculations";
import type { Transaction } from "@/domain/types";

type Props = {
  periodTransactions: Transaction[];
  allTransactions: Transaction[];
  currentPeriodId: string;
};

export function ImpulseCounter({
  periodTransactions,
  allTransactions,
  currentPeriodId,
}: Props) {
  const currentTotal = calculateImpulseTotal(periodTransactions);

  // Find previous period's impulse total
  const previousPeriodTxs = allTransactions.filter(
    (tx) => tx.periodId !== currentPeriodId && tx.isImpulse
  );
  // Group by periodId, take the most recent one
  const periodTotals = new Map<string, number>();
  for (const tx of previousPeriodTxs) {
    periodTotals.set(
      tx.periodId,
      (periodTotals.get(tx.periodId) ?? 0) + tx.amount
    );
  }
  // Get the latest previous period (by sorting period IDs which are YYYY-MM)
  const sortedPeriodIds = [...periodTotals.keys()].sort().reverse();
  const prevTotal =
    sortedPeriodIds.length > 0
      ? periodTotals.get(sortedPeriodIds[0]) ?? 0
      : 0;

  const diff = currentTotal - prevTotal;

  return (
    <section className="rounded-xl bg-panel p-4">
      <h2 className="mb-2 text-caption font-semibold uppercase tracking-wider text-muted">
        Impulsy w tym okresie
      </h2>

      <div className="flex items-baseline gap-3">
        <span
          className={`font-display text-display font-semibold tabular-nums ${
            currentTotal > 0 ? "text-bad" : "text-muted/40"
          }`}
          style={{ fontOpticalSizing: "auto", letterSpacing: "-0.01em" }}
        >
          {currentTotal > 0
            ? `${formatAmount(currentTotal)} zł`
            : "0 zł"}
        </span>

        {prevTotal > 0 && currentTotal > 0 && (
          <span
            className={`text-caption font-medium ${
              diff > 0 ? "text-bad/70" : diff < 0 ? "text-good/70" : "text-muted"
            }`}
          >
            {diff > 0
              ? `↑ o ${formatAmount(diff)} zł`
              : diff < 0
                ? `↓ o ${formatAmount(Math.abs(diff))} zł`
                : "bez zmian"}
          </span>
        )}
      </div>

      {currentTotal === 0 && (
        <p className="mt-1 text-caption text-muted/60">
          Żadnych impulsywnych wydatków. Tak trzymaj.
        </p>
      )}
    </section>
  );
}

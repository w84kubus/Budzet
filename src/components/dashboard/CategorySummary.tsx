"use client";

import { useMemo } from "react";
import { formatAmount } from "@/domain/money";
import { EXPENSE_CATEGORIES, getCategoryById } from "@/domain/constants";
import type { Transaction } from "@/domain/types";

type Props = {
  transactions: Transaction[];
};

export function CategorySummary({ transactions }: Props) {
  // Aggregate spending per category from subcategory field
  const categorySums = useMemo(() => {
    const sums = new Map<string, number>();

    for (const tx of transactions) {
      if (
        tx.kind === "envelopeExpense" &&
        tx.paidFrom === "main" &&
        !tx.envelopeId &&
        tx.subcategory
      ) {
        sums.set(tx.subcategory, (sums.get(tx.subcategory) ?? 0) + tx.amount);
      }
    }

    // Sort by amount descending
    return [...sums.entries()]
      .map(([catId, total]) => ({
        category: getCategoryById(catId),
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const grandTotal = categorySums.reduce((s, c) => s + c.total, 0);

  if (categorySums.length === 0) {
    return null; // Don't show section if no categorized expenses yet
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-caption font-semibold uppercase tracking-wider text-muted">
          Wydatki w tym okresie
        </h2>
        <span className="font-mono text-caption tabular-nums text-muted">
          {formatAmount(grandTotal)} zł
        </span>
      </div>

      <div className="space-y-[1px] overflow-hidden rounded-xl bg-line">
        {categorySums.map(({ category, total }) => {
          const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

          return (
            <div
              key={category.id}
              className="relative flex items-center gap-3 bg-panel px-4 py-2.5"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-y-0 left-0 bg-panel-2/50"
                style={{ width: `${pct}%` }}
              />

              {/* Content */}
              <span className="relative z-10 text-body-lg leading-none">
                {category.emoji}
              </span>
              <span className="relative z-10 min-w-0 flex-1 truncate text-sm text-text">
                {category.name}
              </span>
              <span className="relative z-10 shrink-0 font-mono text-caption tabular-nums text-text/80">
                {formatAmount(total)} zł
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

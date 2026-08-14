"use client";

import { formatAmount } from "@/domain/money";
import type { Transaction, Envelope, FixedExpenseDef } from "@/domain/types";

type Props = {
  envelope: Envelope;
  transactions: Transaction[];
  envelopes: Envelope[];
  fixedExpenseDefs: FixedExpenseDef[];
  onClose: () => void;
};

function txLabel(
  tx: Transaction,
  envelopes: Envelope[],
  fixedExpenseDefs: FixedExpenseDef[]
): { label: string; sign: "+" | "−" } {
  switch (tx.kind) {
    case "allocation":
      return { label: "Wpłata na kopertę", sign: "+" };
    case "envelopeExpense": {
      const note = tx.note || tx.subcategory || "Wydatek";
      return { label: note, sign: "−" };
    }
    case "envelopeTransfer": {
      if (tx.targetEnvelopeId === undefined) {
        const target = envelopes.find((e) => e.id === tx.targetEnvelopeId);
        return {
          label: `Transfer → ${target?.name ?? "koperta"}`,
          sign: "−",
        };
      }
      const source = envelopes.find((e) => e.id === tx.envelopeId);
      return {
        label: `Transfer ← ${source?.name ?? "koperta"}`,
        sign: "+",
      };
    }
    case "withdrawal":
      return { label: "Wyjęcie z koperty", sign: "−" };
    case "adjustment":
      return {
        label: tx.note || "Korekta",
        sign: tx.paidFrom === "savings" ? "−" : "+",
      };
    case "fixedExpense": {
      const def = fixedExpenseDefs.find((d) => d.id === tx.fixedExpenseDefId);
      return { label: def?.name ?? "Wydatek stały", sign: "−" };
    }
    default:
      return { label: tx.note || tx.kind, sign: "−" };
  }
}

export function EnvelopeHistory({
  envelope,
  transactions,
  envelopes,
  fixedExpenseDefs,
  onClose,
}: Props) {
  // Filter transactions related to this envelope
  const related = transactions.filter(
    (tx) =>
      tx.envelopeId === envelope.id || tx.targetEnvelopeId === envelope.id
  );

  // Group by date
  const grouped = new Map<string, Transaction[]>();
  for (const tx of related) {
    const date = tx.date.split("T")[0];
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(tx);
  }

  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div
        className="sheet-backdrop-enter fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <div className="sheet-enter fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] max-w-[430px] flex-col rounded-t-2xl bg-panel safe-bottom">
        <div className="flex justify-center py-3">
          <div className="h-[4px] w-10 rounded-full bg-line" />
        </div>

        <div className="flex items-center gap-2.5 px-5 pb-3">
          <span className="text-title">{envelope.emoji}</span>
          <h2 className="font-display text-body-lg font-semibold text-text">
            {envelope.name}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {sortedDates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Brak transakcji dla tej koperty.
            </p>
          ) : (
            sortedDates.map((date) => {
              const txs = grouped.get(date)!;
              const d = new Date(date);
              const dateLabel = d.toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "short",
              });

              return (
                <div key={date} className="mb-4">
                  <p className="mb-1.5 text-micro font-medium uppercase tracking-wider text-muted">
                    {dateLabel}
                  </p>
                  <div className="space-y-1">
                    {txs.map((tx) => {
                      const { label, sign } = txLabel(
                        tx,
                        envelopes,
                        fixedExpenseDefs
                      );
                      const isPositive = sign === "+";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg px-2 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-caption text-text">
                              {label}
                            </p>
                            {tx.isImpulse && (
                              <span className="text-micro text-bad/70">
                                ⚡ impuls
                              </span>
                            )}
                          </div>
                          <span
                            className={`ml-3 shrink-0 font-mono text-sm tabular-nums ${
                              isPositive ? "text-good" : "text-text"
                            }`}
                          >
                            {sign}
                            {formatAmount(tx.amount)} zł
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-line px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-line py-3 text-sm font-medium text-muted transition-colors hover:text-text"
          >
            Zamknij
          </button>
        </div>
      </div>
    </>
  );
}

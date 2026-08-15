"use client";

import { formatAmount } from "@/domain/money";
import { formatDateShort } from "@/lib/format";
import { getCategoryById } from "@/domain/constants";
import type { Transaction, FixedExpenseDef, Envelope } from "@/domain/types";

type Props = {
  transactions: Transaction[];
  fixedExpenseDefs: FixedExpenseDef[];
  envelopes: Envelope[];
  onShowAll?: () => void;
};

function getLabel(
  tx: Transaction,
  defs: Map<string, FixedExpenseDef>,
  envs: Map<string, Envelope>
): string {
  switch (tx.kind) {
    case "income":
      return "Przychód";
    case "fixedExpense": {
      const def = tx.fixedExpenseDefId ? defs.get(tx.fixedExpenseDefId) : null;
      return def?.name ?? "Wydatek stały";
    }
    case "envelopeExpense": {
      if (!tx.envelopeId) {
        if (tx.subcategory) {
          const cat = getCategoryById(tx.subcategory);
          return `${cat.emoji} ${cat.name}`;
        }
        return "💳 Konto główne";
      }
      const env = envs.get(tx.envelopeId);
      return env ? `${env.emoji} ${env.name}` : "Wydatek kopertowy";
    }
    case "allocation": {
      const env = tx.envelopeId ? envs.get(tx.envelopeId) : null;
      return env ? `→ ${env.emoji} ${env.name}` : "Alokacja";
    }
    case "envelopeTransfer":
      return "Transfer między kopertami";
    case "withdrawal": {
      const env = tx.envelopeId ? envs.get(tx.envelopeId) : null;
      return env ? `← ${env.emoji} ${env.name}` : "Wyjęcie z koperty";
    }
    case "adjustment":
      return "Korekta";
  }
}

function getSign(kind: Transaction["kind"]): "+" | "−" | "" {
  switch (kind) {
    case "income":
    case "withdrawal":
      return "+";
    case "fixedExpense":
    case "envelopeExpense":
    case "allocation":
      return "−";
    default:
      return "";
  }
}

function getColor(kind: Transaction["kind"]): string {
  switch (kind) {
    case "income":
    case "withdrawal":
      return "text-good";
    case "fixedExpense":
    case "envelopeExpense":
      return "text-text";
    case "allocation":
      return "text-muted";
    default:
      return "text-muted";
  }
}

export function RecentTransactions({
  transactions,
  fixedExpenseDefs,
  envelopes,
  onShowAll,
}: Props) {
  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));
  const envMap = new Map(envelopes.map((e) => [e.id, e]));
  const recent = transactions.slice(0, 5);

  return (
    <section>
      <h2 className="mb-3 text-caption font-semibold uppercase tracking-wider text-muted">
        Ostatnie transakcje
      </h2>

      {recent.length === 0 ? (
        <div className="rounded-xl bg-panel p-6 text-center">
          <p className="text-sm text-muted">
            Brak transakcji w tym okresie.
          </p>
          <p className="mt-1 text-caption text-muted/60">
            Dodaj pierwszą za pomocą przycisku +
          </p>
        </div>
      ) : (
        <div className="space-y-[1px] overflow-hidden rounded-xl bg-line">
          {recent.map((tx) => {
            const sign = getSign(tx.kind);
            const color = getColor(tx.kind);
            const label = getLabel(tx, defMap, envMap);

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-tight text-text">
                    {label}
                  </span>
                  <span className="text-micro text-muted/60">
                    {formatDateShort(tx.date)}
                    {tx.note && ` · ${tx.note}`}
                    {tx.isImpulse && (
                      <span className="ml-1 text-bad/60">⚡</span>
                    )}
                  </span>
                </div>
                <span
                  className={`shrink-0 font-mono text-sm font-medium tabular-nums ${color}`}
                >
                  {sign}
                  {formatAmount(tx.amount)} zł
                </span>
              </div>
            );
          })}
        </div>
      )}

      {transactions.length > 5 && (
        <button
          onClick={onShowAll}
          className="mt-3 w-full text-center text-caption font-medium text-brass hover:text-text transition-colors"
        >
          Zobacz wszystkie ({transactions.length})
        </button>
      )}
    </section>
  );
}

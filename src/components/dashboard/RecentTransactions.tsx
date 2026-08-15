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

/** Icon background color per transaction kind */
function getIconBg(kind: Transaction["kind"]): string {
  switch (kind) {
    case "income":
      return "bg-good/15 text-good";
    case "fixedExpense":
      return "bg-brass/15 text-brass";
    case "envelopeExpense":
      return "bg-bad/10 text-bad";
    case "allocation":
      return "bg-brass/10 text-brass";
    case "withdrawal":
      return "bg-good/10 text-good";
    default:
      return "bg-muted/10 text-muted";
  }
}

/** Icon SVG per transaction kind */
function TxIcon({ kind }: { kind: Transaction["kind"] }) {
  const cls = `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconBg(kind)}`;

  switch (kind) {
    case "income":
      return (
        <div className={cls}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M5 7L8 4L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      );
    case "fixedExpense":
      return (
        <div className={cls}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5H13M3 8H13M3 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      );
    case "envelopeExpense":
      return (
        <div className={cls}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4V12M11 9L8 12L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      );
    case "allocation":
      return (
        <div className={cls}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      );
    default:
      return (
        <div className={cls}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
        </div>
      );
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
        <div className="rounded-2xl bg-panel p-6 text-center">
          <p className="text-sm text-muted">
            Brak transakcji w tym okresie.
          </p>
          <p className="mt-1 text-caption text-muted/60">
            Dodaj pierwszą za pomocą przycisku +
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-panel">
          {recent.map((tx, i) => {
            const sign = getSign(tx.kind);
            const color = getColor(tx.kind);
            const label = getLabel(tx, defMap, envMap);

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < recent.length - 1 ? "border-b border-line/50" : ""
                }`}
              >
                <TxIcon kind={tx.kind} />
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

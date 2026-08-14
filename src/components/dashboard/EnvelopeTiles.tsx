"use client";

import { formatAmount } from "@/domain/money";
import { calculateAllEnvelopeBalances } from "@/domain/calculations";
import type { Envelope, Transaction } from "@/domain/types";

type Props = {
  envelopes: Envelope[];
  allTransactions: Transaction[];
  onAdd?: () => void;
};

export function EnvelopeTiles({ envelopes, allTransactions, onAdd }: Props) {
  const active = envelopes.filter((e) => !e.archived);
  const balances = calculateAllEnvelopeBalances(
    active.map((e) => e.id),
    allTransactions
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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-caption font-semibold uppercase tracking-wider text-muted">
          Koperty
        </h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-micro font-medium text-muted transition-colors hover:bg-panel hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Dodaj
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl bg-panel p-5 text-center">
          <p className="text-sm text-muted">Brak kopert.</p>
          {onAdd && (
            <button onClick={onAdd} className="mt-2 text-caption font-medium text-brass">
              Dodaj pierwszą
            </button>
          )}
        </div>
      ) : (

      <div className="no-scrollbar flex gap-3 overflow-x-auto md:grid md:grid-cols-2 md:overflow-x-visible">
        {sorted.map((env) => {
          const balance = balances.get(env.id) ?? 0;
          const target = env.targetAmount ?? env.monthlyPlan;
          const isOverdraft = balance < 0;

          // Fill level: 0–100% based on balance/target
          const fillPct =
            target > 0
              ? Math.min(100, Math.max(0, (balance / target) * 100))
              : balance > 0
                ? 50 // no target set but has money
                : 0;

          return (
            <div
              key={env.id}
              className="relative flex w-[120px] shrink-0 flex-col overflow-hidden rounded-xl bg-panel md:w-auto"
              style={{ height: 140 }}
            >
              {/* Fill from bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0">
                <div
                  className={`fill-animate w-full ${
                    isOverdraft ? "bg-bad/15" : "bg-good/8"
                  }`}
                  style={{ height: `${fillPct}%` }}
                />
                {/* Meniscus line */}
                {fillPct > 0 && fillPct < 100 && (
                  <div
                    className={`absolute inset-x-0 h-[1px] ${
                      isOverdraft ? "bg-bad/30" : "bg-good/20"
                    }`}
                    style={{ bottom: `${fillPct}%` }}
                  />
                )}
              </div>

              {/* Overdraft indicator — red stripe at bottom */}
              {isOverdraft && (
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-bad/60" />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-1 flex-col justify-between p-3">
                <div>
                  <span className="text-body-lg leading-none">{env.emoji}</span>
                  <p className="mt-1 text-micro leading-tight text-muted">
                    {env.name}
                  </p>
                </div>
                <div>
                  <span
                    className={`font-mono text-sm font-medium tabular-nums ${
                      isOverdraft ? "text-bad" : "text-text"
                    }`}
                  >
                    {isOverdraft ? "−" : ""}
                    {formatAmount(Math.abs(balance))}
                  </span>
                  <span
                    className={`ml-0.5 text-micro ${
                      isOverdraft ? "text-bad/60" : "text-muted"
                    }`}
                  >
                    zł
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}

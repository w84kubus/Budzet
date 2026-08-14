"use client";

import { formatAmount } from "@/domain/money";
import { calculateAllEnvelopeBalances } from "@/domain/calculations";
import type { Envelope, Transaction } from "@/domain/types";

type Props = {
  envelopes: Envelope[];
  allTransactions: Transaction[];
  onAdd?: () => void;
};

function getEnvelopeState(balance: number, target: number) {
  if (balance < 0) return "over" as const;
  if (target > 0 && balance / target >= 0.75) return "warn" as const;
  return "ok" as const;
}

const fillColors = {
  ok: "bg-envelope-ok/12",
  warn: "bg-envelope-warn/15",
  over: "bg-envelope-over/15",
} as const;

const meniscusColors = {
  ok: "bg-envelope-ok/40",
  warn: "bg-envelope-warn/50",
  over: "bg-envelope-over/50",
} as const;

const amountColors = {
  ok: "text-text",
  warn: "text-text",
  over: "text-bad",
} as const;

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
            className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-micro font-medium text-muted transition-colors hover:bg-panel hover:text-text
              focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
            const state = getEnvelopeState(balance, target);

            // Fill level: 0–100% based on balance/target
            const fillPct =
              target > 0
                ? Math.min(100, Math.max(0, (balance / target) * 100))
                : balance > 0
                  ? 50
                  : 0;

            return (
              <div
                key={env.id}
                className="relative flex w-[130px] shrink-0 flex-col overflow-hidden rounded-xl bg-panel md:w-auto"
                style={{ height: 100 }}
              >
                {/* Fill from bottom — flat color, the signature element */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0">
                  <div
                    className={`fill-animate w-full ${fillColors[state]}`}
                    style={{ height: `${fillPct}%` }}
                  >
                    {/* Meniscus — 1px line at top of fill */}
                    <div
                      className={`absolute inset-x-0 top-0 h-px ${meniscusColors[state]}`}
                    />
                  </div>
                </div>

                {/* Overdraft stripe — red line at bottom */}
                {state === "over" && (
                  <div className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-bad/60" />
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-1 flex-col justify-between p-3">
                  <div>
                    <span className="text-body-lg leading-none" aria-hidden="true">{env.emoji}</span>
                    <p className="mt-1 truncate text-micro leading-tight text-muted">
                      {env.name}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`font-mono text-sm font-medium tabular-nums ${amountColors[state]}`}
                    >
                      {state === "over" ? "−" : ""}
                      {formatAmount(Math.abs(balance))}
                    </span>
                    <span
                      className={`ml-0.5 text-micro ${
                        state === "over" ? "text-bad/60" : "text-muted"
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

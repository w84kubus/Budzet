"use client";

import { formatAmount } from "@/domain/money";
import type { FixedExpenseDef, FixedExpenseInstance } from "@/domain/types";

type Props = {
  defs: FixedExpenseDef[];
  instances: FixedExpenseInstance[];
  onTogglePaid: (instance: FixedExpenseInstance) => void;
  onAddDef?: () => void;
  onEditInstance?: (instance: FixedExpenseInstance, def: FixedExpenseDef) => void;
};

export function FixedExpenses({ defs, instances, onTogglePaid, onAddDef, onEditInstance }: Props) {
  const defMap = new Map(defs.map((d) => [d.id, d]));

  // Filter: only instances with matching def, deduplicate by defId (keep first)
  const seen = new Set<string>();
  const validInstances = instances.filter((inst) => {
    if (!defMap.has(inst.defId)) return false;
    if (seen.has(inst.defId)) return false;
    seen.add(inst.defId);
    return true;
  });

  const sorted = [...validInstances].sort((a, b) => {
    const defA = defMap.get(a.defId);
    const defB = defMap.get(b.defId);
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return (defA?.order ?? 0) - (defB?.order ?? 0);
  });

  const totalPlanned = validInstances.reduce((s, i) => s + i.planned, 0);
  const totalPaid = validInstances
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + i.planned, 0);
  const paidCount = validInstances.filter((i) => i.isPaid).length;

  if (validInstances.length === 0 && !onAddDef) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-caption font-semibold uppercase tracking-wider text-muted">
          Zobowiązania stałe
        </h2>
        {onAddDef && (
          <button
            onClick={onAddDef}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-micro font-medium text-muted transition-colors hover:bg-panel-2 hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Dodaj
          </button>
        )}
      </div>

      {validInstances.length === 0 ? (
        <div className="rounded-2xl bg-panel p-5 text-center">
          <p className="text-sm text-muted">Brak zobowiązań stałych.</p>
          {onAddDef && (
            <button
              onClick={onAddDef}
              className="mt-2 text-caption font-medium text-brass"
            >
              Dodaj pierwszy
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-panel">
          {sorted.map((inst, i) => {
            const def = defMap.get(inst.defId);
            if (!def) return null;

            return (
              <div
                key={inst.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < sorted.length - 1 ? "border-b border-line/50" : ""
                }`}
              >
                {/* Checkbox — 44×44 touch target */}
                <button
                  onClick={() => onTogglePaid(inst)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center -ml-2"
                  aria-label={inst.isPaid ? "Oznacz jako niezapłacone" : "Oznacz jako zapłacone"}
                >
                  <span
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors ${
                      inst.isPaid
                        ? "border-good/60 bg-good/15"
                        : "border-muted/30 bg-panel-2"
                    }`}
                  >
                    {inst.isPaid && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="var(--color-good)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-tight ${
                      inst.isPaid ? "text-muted line-through" : "text-text"
                    }`}
                  >
                    {def.name}
                  </span>
                </div>

                {/* Amount */}
                <button
                  onClick={() => onEditInstance?.(inst, def)}
                  className={`shrink-0 rounded-lg px-2 py-1 font-mono text-caption tabular-nums transition-colors hover:bg-panel-2 ${
                    inst.isPaid ? "text-muted/40" : "text-text/80"
                  }`}
                >
                  {formatAmount(inst.planned)} zł
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {validInstances.length > 0 && (
        <div className="mt-2.5 px-1 text-micro text-muted">
          {paidCount === validInstances.length ? (
            <>
              Wszystko opłacone ·{" "}
              <span className="font-mono tabular-nums">{formatAmount(totalPlanned)}</span> zł
            </>
          ) : (
            <>
              {paidCount}/{validInstances.length} opłacone ·{" "}
              <span className="font-mono tabular-nums">{formatAmount(totalPaid)}</span> z{" "}
              <span className="font-mono tabular-nums">{formatAmount(totalPlanned)}</span> zł
            </>
          )}
        </div>
      )}
    </section>
  );
}

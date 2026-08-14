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
  const sorted = [...instances].sort((a, b) => {
    const defA = defMap.get(a.defId);
    const defB = defMap.get(b.defId);
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return (defA?.order ?? 0) - (defB?.order ?? 0);
  });

  const totalPlanned = instances.reduce((s, i) => s + i.planned, 0);
  const totalPaid = instances
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + (i.actual > 0 ? i.actual : i.planned), 0);

  if (instances.length === 0 && !onAddDef) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
          Wydatki stałe
        </h2>
        {onAddDef && (
          <button
            onClick={onAddDef}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-muted transition-colors hover:bg-panel hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Dodaj
          </button>
        )}
      </div>

      {instances.length === 0 ? (
        <div className="rounded-xl bg-panel p-5 text-center">
          <p className="text-[14px] text-muted">Brak wydatków stałych.</p>
          {onAddDef && (
            <button
              onClick={onAddDef}
              className="mt-2 text-[13px] font-medium text-brass"
            >
              Dodaj pierwszy
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-[1px] overflow-hidden rounded-xl bg-line">
          {sorted.map((inst) => {
            const def = defMap.get(inst.defId);
            if (!def) return null;

            const isAccumulating = def.type === "accumulating";
            const progressPct =
              isAccumulating && inst.planned > 0
                ? Math.min(100, (inst.actual / inst.planned) * 100)
                : 0;

            return (
              <div
                key={inst.id}
                className="flex items-center gap-3 bg-panel px-4 py-3"
              >
                {/* Checkbox */}
                <button
                  onClick={() => onTogglePaid(inst)}
                  className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] border border-line transition-colors"
                  style={
                    inst.isPaid
                      ? { backgroundColor: "var(--color-muted)", borderColor: "var(--color-muted)" }
                      : undefined
                  }
                  aria-label={inst.isPaid ? "Oznacz jako niezapłacone" : "Oznacz jako zapłacone"}
                >
                  {inst.isPaid && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="var(--color-ink)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Name + progress */}
                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-[14px] leading-tight ${
                      inst.isPaid ? "text-muted line-through" : "text-text"
                    }`}
                  >
                    {def.name}
                  </span>

                  {isAccumulating && !inst.isPaid && inst.planned > 0 && (
                    <div className="mt-1.5 h-[2px] w-full rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-full bg-muted/50 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Amount — clickable to edit */}
                <button
                  onClick={() => onEditInstance?.(inst, def)}
                  className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[13px] tabular-nums transition-colors hover:bg-panel-2 ${
                    inst.isPaid ? "text-muted/50" : "text-text/80"
                  }`}
                >
                  {isAccumulating && !inst.isPaid
                    ? `${formatAmount(inst.actual)} / ${formatAmount(inst.planned)}`
                    : `${formatAmount(inst.planned)}`}
                  {" zł"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {instances.length > 0 && (
        <div className="mt-2 px-1 text-[12px] text-muted">
          Zapłacono{" "}
          <span className="font-mono tabular-nums">{formatAmount(totalPaid)}</span>{" "}
          z{" "}
          <span className="font-mono tabular-nums">{formatAmount(totalPlanned)}</span>{" "}
          zł
        </div>
      )}
    </section>
  );
}

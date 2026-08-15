"use client";

import { useState, useEffect, useMemo } from "react";
import { formatAmount, groszeToCurrencyInput } from "@/domain/money";
import { distributeProportionally } from "@/domain/operations";
import { Button } from "@/components/ui/Button";
import type { Envelope, TransferBreakdownItem } from "@/domain/types";

type Props = {
  open: boolean;
  available: number; // grosze - free funds
  envelopes: Envelope[];
  onClose: () => void;
  onSave: (allocations: TransferBreakdownItem[]) => void;
};

function parseInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function DistributeFundsSheet({
  open,
  available,
  envelopes,
  onClose,
  onSave,
}: Props) {
  const active = useMemo(
    () => envelopes.filter((e) => !e.archived),
    [envelopes]
  );

  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const buildAmountsFromProportional = () => {
    const proportional = distributeProportionally(active, available);
    const init: Record<string, string> = {};
    for (const env of active) {
      const alloc = proportional.find((p) => p.envelopeId === env.id);
      init[env.id] = alloc && alloc.amount > 0
        ? groszeToCurrencyInput(alloc.amount)
        : "";
    }
    return init;
  };

  useEffect(() => {
    if (open) {
      setAmounts(buildAmountsFromProportional());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, available]);

  if (!open) return null;

  const totalAllocated = active.reduce(
    (sum, env) => sum + parseInput(amounts[env.id] ?? ""),
    0
  );
  const remaining = available - totalAllocated;
  const isOver = remaining < 0;
  const canSave = totalAllocated > 0 && !isOver;

  const handleChange = (envId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [envId]: value }));
  };

  const handleProportional = () => {
    setAmounts(buildAmountsFromProportional());
  };

  const handleZero = () => {
    const cleared: Record<string, string> = {};
    for (const env of active) cleared[env.id] = "";
    setAmounts(cleared);
  };

  const handleRestToPoduszka = () => {
    const poduszka = active.find((e) =>
      e.name.toLowerCase().includes("poduszka")
    );
    if (!poduszka) return;

    const otherTotal = active
      .filter((e) => e.id !== poduszka.id)
      .reduce((sum, e) => sum + parseInput(amounts[e.id] ?? ""), 0);

    const restForPoduszka = Math.max(0, available - otherTotal);
    setAmounts((prev) => ({
      ...prev,
      [poduszka.id]: restForPoduszka > 0
        ? groszeToCurrencyInput(restForPoduszka)
        : "",
    }));
  };

  const handleSave = () => {
    if (!canSave) return;
    const allocations: TransferBreakdownItem[] = active
      .map((env) => ({
        envelopeId: env.id,
        amount: parseInput(amounts[env.id] ?? ""),
      }))
      .filter((a) => a.amount > 0);
    onSave(allocations);
    onClose();
  };

  const hasPoduszka = active.some((e) =>
    e.name.toLowerCase().includes("poduszka")
  );

  return (
    <>
      <div
        className="sheet-backdrop-enter fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <div className="sheet-enter fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] max-w-[430px] flex-col rounded-t-2xl bg-panel safe-bottom">
        <div className="flex justify-center py-3">
          <div className="h-[4px] w-10 rounded-full bg-line" />
        </div>

        <div className="px-5 pb-3">
          <h2 className="font-display text-body-lg font-semibold text-text">
            Rozdysponuj wolne środki
          </h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-caption text-muted">Do rozdysponowania:</span>
            <span className="font-mono text-body-lg font-semibold tabular-nums text-brass">
              {formatAmount(available)} zł
            </span>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-2 px-5 pb-3">
          <Button variant="ghost" size="sm" onClick={handleProportional}>
            Proporcjonalnie
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZero}>
            Wyzeruj
          </Button>
          {hasPoduszka && (
            <Button variant="ghost" size="sm" onClick={handleRestToPoduszka}>
              Resztę do Poduszki
            </Button>
          )}
        </div>

        {/* Envelope list */}
        <div className="flex-1 overflow-y-auto px-5">
          <div className="space-y-2">
            {active.map((env) => (
              <div
                key={env.id}
                className="flex items-center gap-3 rounded-lg bg-panel-2 px-3 py-2.5"
              >
                <span className="text-body-lg">{env.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption text-text">{env.name}</p>
                  <p className="text-micro text-muted/60">
                    Plan: {formatAmount(env.monthlyPlan)} zł
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[env.id] ?? ""}
                    onChange={(e) => handleChange(env.id, e.target.value)}
                    placeholder="0,00"
                    className="w-20 rounded-lg border border-line bg-ink px-2 py-1.5 text-right font-mono text-sm tabular-nums text-text placeholder:text-muted/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                  />
                  <span className="text-micro text-muted">zł</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remaining + Save */}
        <div className="border-t border-line px-5 pb-2 pt-3">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-caption text-muted">Pozostanie:</span>
            <span
              className={`font-mono text-body-lg font-semibold tabular-nums ${
                isOver ? "text-bad" : remaining === 0 ? "text-good" : "text-text"
              }`}
            >
              {isOver ? "−" : ""}
              {formatAmount(Math.abs(remaining))} zł
            </span>
          </div>
          {isOver && (
            <p className="mb-2 text-center text-micro text-bad">
              Suma przekracza dostępne środki o{" "}
              {formatAmount(Math.abs(remaining))} zł
            </p>
          )}
          <Button fullWidth onClick={handleSave} disabled={!canSave} className="mb-1">
            Rozdysponuj
          </Button>
        </div>
      </div>
    </>
  );
}

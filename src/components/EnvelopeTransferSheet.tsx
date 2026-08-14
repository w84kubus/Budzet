"use client";

import { useState, useEffect } from "react";
import { formatAmount } from "@/domain/money";
import { calculateEnvelopeBalance } from "@/domain/calculations";
import type { Envelope, Transaction } from "@/domain/types";

type Props = {
  open: boolean;
  /** Pre-selected target envelope (the one with overdraft) */
  targetEnvelope: Envelope | null;
  /** Suggested amount (overdraft amount) */
  suggestedAmount: number;
  envelopes: Envelope[];
  allTransactions: Transaction[];
  onClose: () => void;
  onSave: (sourceId: string, targetId: string, amount: number) => void;
};

function parseInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function EnvelopeTransferSheet({
  open,
  targetEnvelope,
  suggestedAmount,
  envelopes,
  allTransactions,
  onClose,
  onSave,
}: Props) {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setSourceId(null);
      setAmount(
        suggestedAmount > 0
          ? (suggestedAmount / 100).toFixed(2).replace(".", ",")
          : ""
      );
    }
  }, [open, suggestedAmount]);

  if (!open || !targetEnvelope) return null;

  const active = envelopes.filter(
    (e) => !e.archived && e.id !== targetEnvelope.id
  );

  // Only show envelopes with positive balance
  const sourceCandidates = active
    .map((env) => ({
      env,
      balance: calculateEnvelopeBalance(env.id, allTransactions),
    }))
    .filter((item) => item.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const grosze = parseInput(amount);
  const sourceBalance = sourceId
    ? calculateEnvelopeBalance(sourceId, allTransactions)
    : 0;
  const canSave = sourceId !== null && grosze > 0;

  const handleSave = () => {
    if (!canSave || !sourceId) return;
    onSave(sourceId, targetEnvelope.id, grosze);
    onClose();
  };

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

        <div className="px-5 pb-5">
          <h2 className="mb-1 font-display text-body-lg font-semibold text-text">
            Pokryj przekroczenie
          </h2>
          <p className="mb-4 text-caption text-muted">
            {targetEnvelope.emoji} {targetEnvelope.name} — przekroczone o{" "}
            <span className="font-mono text-bad">
              {formatAmount(suggestedAmount)} zł
            </span>
          </p>

          {/* Source picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-micro text-muted">
              Pokryj z koperty
            </label>
            {sourceCandidates.length === 0 ? (
              <p className="rounded-lg bg-panel-2 p-4 text-center text-caption text-muted">
                Brak kopert z dodatnim saldem.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sourceCandidates.map(({ env, balance }) => {
                  const isSelected = sourceId === env.id;
                  return (
                    <button
                      key={env.id}
                      onClick={() => setSourceId(env.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "border-brass/40 bg-brass/10"
                          : "border-line bg-panel-2 active:bg-line"
                      }`}
                    >
                      <span className="text-body-lg">{env.emoji}</span>
                      <span
                        className={`flex-1 text-left text-caption ${
                          isSelected ? "text-brass" : "text-text"
                        }`}
                      >
                        {env.name}
                      </span>
                      <span className="font-mono text-caption tabular-nums text-good">
                        {formatAmount(balance)} zł
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-3">
            <label className="mb-1 block text-micro text-muted">
              Kwota (zł)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right font-mono text-body-lg tabular-nums text-text placeholder:text-muted/30 focus:border-brass/40 focus:outline-none"
            />
            {sourceId && grosze > sourceBalance && (
              <p className="mt-1 text-micro text-bad">
                Przekracza saldo źródła ({formatAmount(sourceBalance)} zł)
              </p>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-muted transition-colors hover:text-text"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                canSave
                  ? "bg-brass text-ink active:opacity-90"
                  : "bg-panel-2 text-muted/30"
              }`}
            >
              Przenieś
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

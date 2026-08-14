"use client";

import { useState, useEffect } from "react";
import { formatAmount } from "@/domain/money";
import { calculateEnvelopeBalance } from "@/domain/calculations";
import type { Envelope, Transaction } from "@/domain/types";

type Props = {
  open: boolean;
  envelopes: Envelope[];
  allTransactions: Transaction[];
  onClose: () => void;
  onSave: (envelopeId: string, amount: number, note: string) => void;
};

function parseInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function WithdrawalSheet({
  open,
  envelopes,
  allTransactions,
  onClose,
  onSave,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setAmount("");
      setNote("");
    }
  }, [open]);

  if (!open) return null;

  const active = envelopes.filter((e) => !e.archived);
  const selected = active.find((e) => e.id === selectedId);
  const selectedBalance = selected
    ? calculateEnvelopeBalance(selected.id, allTransactions)
    : 0;

  const grosze = parseInput(amount);
  const canSave = selectedId !== null && grosze > 0;

  const handleSave = () => {
    if (!canSave || !selectedId) return;
    onSave(selectedId, grosze, note.trim());
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

        <div className="px-5 pb-4">
          <h2 className="mb-4 font-display text-[20px] font-semibold text-text">
            Wyjmij z koperty
          </h2>

          {/* Envelope picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] text-muted">
              Koperta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {active.map((env) => {
                const bal = calculateEnvelopeBalance(env.id, allTransactions);
                const isSelected = selectedId === env.id;
                return (
                  <button
                    key={env.id}
                    onClick={() => setSelectedId(env.id)}
                    className={`flex flex-col items-center rounded-xl border px-2 py-2.5 transition-colors ${
                      isSelected
                        ? "border-brass/40 bg-brass/10"
                        : "border-line bg-panel-2 active:bg-line"
                    }`}
                  >
                    <span className="text-[18px]">{env.emoji}</span>
                    <span
                      className={`mt-0.5 line-clamp-1 text-[10px] ${
                        isSelected ? "text-brass" : "text-muted"
                      }`}
                    >
                      {env.name}
                    </span>
                    <span
                      className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                        bal < 0 ? "text-bad" : "text-muted/60"
                      }`}
                    >
                      {formatAmount(bal)} zł
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected info */}
          {selected && (
            <p className="mb-3 text-[12px] text-muted">
              Saldo: {formatAmount(selectedBalance)} zł
            </p>
          )}

          {/* Amount */}
          <div className="mb-3">
            <label className="mb-1 block text-[12px] text-muted">
              Kwota (zł)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right font-mono text-[18px] tabular-nums text-text placeholder:text-muted/30 focus:border-brass/40 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div className="mb-4">
            <label className="mb-1 block text-[12px] text-muted">
              Powód (opcjonalnie)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="np. Pilny wydatek"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-3 text-[14px] font-medium text-muted transition-colors hover:text-text"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold transition-all ${
                canSave
                  ? "bg-brass text-ink active:opacity-90"
                  : "bg-panel-2 text-muted/30"
              }`}
            >
              Wyjmij
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

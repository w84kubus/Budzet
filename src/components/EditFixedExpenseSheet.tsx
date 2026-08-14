"use client";

import { useState, useEffect } from "react";
import type { FixedExpenseDef, FixedExpenseInstance } from "@/domain/types";

type Props = {
  open: boolean;
  instance: FixedExpenseInstance | null;
  def: FixedExpenseDef | null;
  onClose: () => void;
  onSave: (instanceId: string, planned: number) => void;
  onSaveName?: (defId: string, name: string) => void;
};

export function EditFixedExpenseSheet({ open, instance, def, onClose, onSave, onSaveName }: Props) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open && instance && def) {
      setAmount(instance.planned > 0 ? (instance.planned / 100).toFixed(2).replace(".", ",") : "");
      setName(def.name);
    }
  }, [open, instance, def]);

  if (!open || !instance || !def) return null;

  const handleSave = () => {
    const grosze = amount
      ? Math.round(parseFloat(amount.replace(",", ".")) * 100)
      : 0;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (Number.isFinite(grosze) && grosze >= 0) {
      onSave(instance.id, grosze);
    }

    if (trimmedName !== def.name && onSaveName) {
      onSaveName(def.id, trimmedName);
    }

    onClose();
  };

  return (
    <>
      <div
        className="sheet-backdrop-enter fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <div className="sheet-enter fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-2xl bg-panel safe-bottom">
        <div className="flex justify-center py-3">
          <div className="h-[4px] w-10 rounded-full bg-line" />
        </div>

        <div className="px-5 pb-6">
          <h2 className="mb-4 font-display text-[20px] font-semibold text-text">
            Edytuj wydatek stały
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-[12px] text-muted">
              Nazwa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa wydatku"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-muted">
              Kwota planowana (zł)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right text-[18px] font-mono text-text tabular-nums placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-3 text-[14px] font-medium text-muted transition-colors hover:text-text"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold transition-all ${
                name.trim()
                  ? "bg-brass text-ink active:opacity-90"
                  : "bg-panel-2 text-muted/30"
              }`}
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

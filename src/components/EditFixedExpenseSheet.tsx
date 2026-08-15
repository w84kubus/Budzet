"use client";

import { useState, useEffect } from "react";
import { groszeToCurrencyInput } from "@/domain/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
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
      setAmount(groszeToCurrencyInput(instance.planned));
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
          <h2 className="mb-4 font-display text-body-lg font-semibold text-text">
            Edytuj wydatek stały
          </h2>

          <div className="space-y-4">
            <Input
              label="Nazwa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa wydatku"
              autoFocus
            />

            <AmountInput
              label="Kwota planowana"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="text-right text-body-lg"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Anuluj
            </Button>
            <Button fullWidth onClick={handleSave} disabled={!name.trim()}>
              Zapisz
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

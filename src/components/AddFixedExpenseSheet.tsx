"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
import type { FixedExpenseType } from "@/domain/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: FixedExpenseType;
    defaultPlanned: number;
    dueDay: number | null;
  }) => void;
};

export function AddFixedExpenseSheet({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FixedExpenseType>("single");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setType("single");
      setAmount("");
      setDueDay("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    const grosze = amount
      ? Math.round(parseFloat(amount.replace(",", ".")) * 100)
      : 0;
    const day = dueDay ? parseInt(dueDay, 10) : null;

    onSave({
      name: name.trim(),
      type,
      defaultPlanned: Number.isFinite(grosze) ? grosze : 0,
      dueDay: day && day >= 1 && day <= 31 ? day : null,
    });
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
          <h2 className="mb-5 font-display text-body-lg font-semibold text-text">
            Nowy wydatek stały
          </h2>

          <div className="space-y-4">
            <Input
              label="Nazwa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Czynsz"
              autoFocus
            />

            <div>
              <label className="mb-1.5 block text-caption font-medium text-muted">Typ</label>
              <div className="flex gap-[1px] overflow-hidden rounded-lg bg-line">
                {(["single", "accumulating"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-caption font-medium transition-colors ${
                      type === t
                        ? "bg-brass/15 text-brass"
                        : "bg-panel-2 text-muted"
                    }`}
                  >
                    {t === "single" ? "Jednorazowy" : "Narastający"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <AmountInput
                  label="Kwota planowana"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="text-right"
                />
              </div>
              <div className="w-20">
                <Input
                  label="Dzień"
                  inputMode="numeric"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="—"
                  className="text-center"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Anuluj
            </Button>
            <Button fullWidth onClick={handleSave} disabled={!name.trim()}>
              Dodaj
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
import { validateName, validateAmount } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    emoji: string;
    monthlyPlan: number;
    targetAmount: number | null;
  }) => void;
};

import { ENVELOPE_EMOJI_OPTIONS } from "@/domain/constants";

export function AddEnvelopeSheet({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [monthlyPlan, setMonthlyPlan] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setEmoji("💰");
      setMonthlyPlan("");
      setTargetAmount("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const nameCheck = validateName(name);
    if (!nameCheck.valid) return;

    const planGrosze = monthlyPlan
      ? Math.round(parseFloat(monthlyPlan.replace(",", ".")) * 100)
      : 0;
    const targetGrosze = targetAmount
      ? Math.round(parseFloat(targetAmount.replace(",", ".")) * 100)
      : null;

    const safePlan = Number.isFinite(planGrosze) ? planGrosze : 0;
    const safeTarget = targetGrosze && Number.isFinite(targetGrosze) ? targetGrosze : null;

    if (safePlan > 0 && !validateAmount(safePlan).valid) return;
    if (safeTarget && !validateAmount(safeTarget).valid) return;

    onSave({
      name: nameCheck.sanitized,
      emoji,
      monthlyPlan: safePlan,
      targetAmount: safeTarget,
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
            Nowa koperta
          </h2>

          <div className="space-y-4">
            {/* Emoji picker */}
            <div>
              <label className="mb-1.5 block text-caption font-medium text-muted">Ikona</label>
              <div className="flex flex-wrap gap-1.5">
                {ENVELOPE_EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-body-lg transition-colors ${
                      emoji === e
                        ? "bg-brass/15 ring-1 ring-brass/40"
                        : "bg-panel-2 hover:bg-line"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Nazwa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Wakacje"
              autoFocus
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <AmountInput
                  label="Plan miesięczny"
                  value={monthlyPlan}
                  onChange={(e) => setMonthlyPlan(e.target.value)}
                  placeholder="0,00"
                  className="text-right"
                />
              </div>
              <div className="flex-1">
                <AmountInput
                  label="Cel (opcjonalnie)"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="-"
                  className="text-right"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Anuluj
            </Button>
            <Button fullWidth onClick={handleSave} disabled={!validateName(name).valid}>
              Dodaj
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

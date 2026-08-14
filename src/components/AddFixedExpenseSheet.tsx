"use client";

import { useState, useEffect } from "react";
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
          <h2 className="mb-5 font-display text-[20px] font-semibold text-text">
            Nowy wydatek stały
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] text-muted">Nazwa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Czynsz"
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] text-muted">Typ</label>
              <div className="flex gap-[1px] overflow-hidden rounded-lg bg-line">
                {(["single", "accumulating"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
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
                <label className="mb-1 block text-[12px] text-muted">
                  Kwota planowana (zł)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-[12px] text-muted">
                  Dzień
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="—"
                  className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
                />
              </div>
            </div>
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
              Dodaj
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

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
    type: "single";
    defaultPlanned: number;
    dueDay: number | null;
    endDate: string | null;
  }) => void;
};

export function AddFixedExpenseSheet({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setDueDay("");
      setHasEndDate(false);
      setEndMonth("");
      setEndYear("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const nameCheck = validateName(name);
    if (!nameCheck.valid) return;

    const grosze = amount
      ? Math.round(parseFloat(amount.replace(",", ".")) * 100)
      : 0;
    const safeGrosze = Number.isFinite(grosze) ? grosze : 0;

    if (safeGrosze > 0 && !validateAmount(safeGrosze).valid) return;

    const day = dueDay ? parseInt(dueDay, 10) : null;

    let endDate: string | null = null;
    if (hasEndDate && endMonth && endYear) {
      const m = parseInt(endMonth, 10);
      const y = parseInt(endYear, 10);
      if (m >= 1 && m <= 12 && y >= 2024 && y <= 2099) {
        endDate = `${y}-${String(m).padStart(2, "0")}`;
      }
    }

    onSave({
      name: nameCheck.sanitized,
      type: "single",
      defaultPlanned: safeGrosze,
      dueDay: day && day >= 1 && day <= 31 ? day : null,
      endDate,
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
              placeholder="np. Czynsz, Kredyt"
              autoFocus
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <AmountInput
                  label="Kwota miesięczna"
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
                  placeholder="-"
                  className="text-center"
                />
              </div>
            </div>

            {/* End date toggle */}
            <div>
              <button
                onClick={() => setHasEndDate(!hasEndDate)}
                className="flex items-center gap-2 text-caption text-muted hover:text-text transition-colors"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    hasEndDate
                      ? "border-brass/60 bg-brass/15"
                      : "border-line bg-panel-2"
                  }`}
                >
                  {hasEndDate && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brass" />
                    </svg>
                  )}
                </div>
                Ma termin końca spłaty (np. kredyt, raty)
              </button>

              {hasEndDate && (
                <div className="mt-3 flex items-center gap-2 pl-7">
                  <span className="text-caption text-muted">Ostatnia rata:</span>
                  <Input
                    inputMode="numeric"
                    value={endMonth}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setEndMonth(v);
                    }}
                    placeholder="MM"
                    className="w-14 text-center"
                  />
                  <span className="text-caption text-muted">/</span>
                  <Input
                    inputMode="numeric"
                    value={endYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setEndYear(v);
                    }}
                    placeholder="RRRR"
                    className="w-20 text-center"
                  />
                </div>
              )}
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

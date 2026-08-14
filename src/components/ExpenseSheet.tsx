"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { formatAmount, terminalInputToGrosze } from "@/domain/money";
import type { Envelope, FixedExpenseDef, Transaction, TransactionKind } from "@/domain/types";

type CategoryTarget =
  | { type: "envelope"; id: string; name: string; emoji: string }
  | { type: "fixedExpense"; id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  envelopes: Envelope[];
  fixedExpenseDefs: FixedExpenseDef[];
  periodId: string;
};

/** Parse "12,50" or "12.50" → grosze (1250) */
function parseInputToGrosze(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function ExpenseSheet({
  open,
  onClose,
  onSave,
  envelopes,
  fixedExpenseDefs,
  periodId,
}: Props) {
  // Terminal keypad mode (mobile)
  const [digits, setDigits] = useState("");
  // Text input mode (desktop)
  const [textAmount, setTextAmount] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<CategoryTarget | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");
  const [isImpulse, setIsImpulse] = useState(false);
  const [paidFrom, setPaidFrom] = useState<"main" | "savings">("savings");
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const amount = isMobile
    ? terminalInputToGrosze(digits)
    : parseInputToGrosze(textAmount);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setDigits("");
      setTextAmount("");
      setSelectedCategory(null);
      setShowMore(false);
      setNote("");
      setIsImpulse(false);
      setPaidFrom("savings");
      // Focus desktop input after mount
      if (!isMobile) {
        setTimeout(() => desktopInputRef.current?.focus(), 100);
      }
    }
  }, [open, isMobile]);

  const handleDigit = useCallback((d: string) => {
    setDigits((prev) => {
      if (prev.length >= 8) return prev; // max 999 999,99
      if (prev === "" && d === "0") return prev; // no leading zero
      return prev + d;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleSave = useCallback(() => {
    if (amount <= 0 || !selectedCategory) return;

    const today = new Date().toISOString().split("T")[0];

    let kind: TransactionKind;
    let envelopeId: string | undefined;
    let fixedExpenseDefId: string | undefined;

    if (selectedCategory.type === "envelope") {
      kind = "envelopeExpense";
      envelopeId = selectedCategory.id;
    } else {
      kind = "fixedExpense";
      fixedExpenseDefId = selectedCategory.id;
    }

    onSave({
      periodId,
      kind,
      amount,
      date: today,
      envelopeId,
      fixedExpenseDefId,
      paidFrom: selectedCategory.type === "envelope" ? paidFrom : undefined,
      note: note.trim() || undefined,
      isImpulse,
    });

    onClose();
  }, [amount, selectedCategory, periodId, paidFrom, note, isImpulse, onSave, onClose]);

  if (!open) return null;

  // Build category list: envelopes first, then accumulating fixed expenses
  const categories: CategoryTarget[] = [
    ...envelopes
      .filter((e) => !e.archived)
      .map((e) => ({
        type: "envelope" as const,
        id: e.id,
        name: e.name,
        emoji: e.emoji,
      })),
    ...fixedExpenseDefs
      .filter((d) => !d.archived && d.type === "accumulating")
      .map((d) => ({
        type: "fixedExpense" as const,
        id: d.id,
        name: d.name,
      })),
  ];

  const canSave = amount > 0 && selectedCategory !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="sheet-backdrop-enter fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="sheet-enter fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] max-w-[430px] flex-col rounded-t-2xl bg-panel safe-bottom">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-[4px] w-10 rounded-full bg-line" />
        </div>

        {/* Amount display — mobile: passive display, desktop: editable input */}
        <div className="px-5 pb-4 text-center">
          {isMobile ? (
            <>
              <span
                className={`font-display text-[40px] font-semibold tabular-nums tracking-[-0.02em] ${
                  amount > 0 ? "text-text" : "text-muted/30"
                }`}
                style={{ fontOpticalSizing: "auto" }}
              >
                {amount > 0 ? formatAmount(amount) : "0,00"}
              </span>
              <span className="ml-1.5 text-[18px] text-muted/50">zł</span>
            </>
          ) : (
            <div className="flex items-baseline justify-center gap-2">
              <input
                ref={desktopInputRef}
                type="text"
                inputMode="decimal"
                value={textAmount}
                onChange={(e) => setTextAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSave) handleSave();
                }}
                placeholder="0,00"
                className="w-40 border-b-2 border-line bg-transparent text-center font-display text-[40px] font-semibold tabular-nums tracking-[-0.02em] text-text placeholder:text-muted/30 focus:border-brass/40 focus:outline-none"
                style={{ fontOpticalSizing: "auto" }}
              />
              <span className="text-[18px] text-muted/50">zł</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5">
          {/* Category grid */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const isSelected =
                selectedCategory?.type === cat.type &&
                selectedCategory?.id === cat.id;

              return (
                <button
                  key={`${cat.type}-${cat.id}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-2 transition-colors ${
                    isSelected
                      ? "border-brass/40 bg-brass/10"
                      : "border-line bg-panel-2 active:bg-line"
                  }`}
                >
                  {cat.type === "envelope" ? (
                    <>
                      <span className="text-[22px] leading-none">{cat.emoji}</span>
                      <span
                        className={`mt-1 line-clamp-1 text-[10px] leading-tight ${
                          isSelected ? "text-brass" : "text-muted"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[14px] leading-none text-muted">💸</span>
                      <span
                        className={`mt-1 line-clamp-2 text-center text-[10px] leading-tight ${
                          isSelected ? "text-brass" : "text-muted"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* More options */}
          {!showMore ? (
            <button
              onClick={() => setShowMore(true)}
              className="mb-4 w-full text-center text-[13px] text-muted"
            >
              Więcej opcji ▾
            </button>
          ) : (
            <div className="mb-4 space-y-3">
              {/* Note */}
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notatka (opcjonalne)"
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
              />

              {/* Impulse toggle */}
              <button
                onClick={() => setIsImpulse(!isImpulse)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-[14px] transition-colors ${
                  isImpulse
                    ? "border-bad/30 bg-bad/8 text-bad"
                    : "border-line bg-panel-2 text-muted"
                }`}
              >
                <span>⚡ To był impuls</span>
                <div
                  className={`h-5 w-9 rounded-full transition-colors ${
                    isImpulse ? "bg-bad" : "bg-line"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isImpulse ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>

              {/* Paid from */}
              {selectedCategory?.type === "envelope" && (
                <div>
                  <span className="mb-1.5 block text-[12px] text-muted">
                    Zapłacone z
                  </span>
                  <div className="flex gap-[1px] overflow-hidden rounded-lg bg-line">
                    {(["main", "savings"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setPaidFrom(opt)}
                        className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                          paidFrom === opt
                            ? "bg-brass/15 text-brass"
                            : "bg-panel-2 text-muted"
                        }`}
                      >
                        {opt === "main" ? "Główne" : "Oszczędnościowe"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keypad — mobile only */}
        {isMobile && (
          <div className="border-t border-line px-5 pb-2 pt-3">
            <div className="grid grid-cols-3 gap-[1px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="flex h-[52px] items-center justify-center rounded-lg text-[22px] font-medium text-text active:bg-panel-2"
                >
                  {d}
                </button>
              ))}
              {/* Bottom row: 00, 0, backspace */}
              <button
                onClick={() => {
                  handleDigit("0");
                  handleDigit("0");
                }}
                className="flex h-[52px] items-center justify-center rounded-lg text-[18px] font-medium text-muted active:bg-panel-2"
              >
                00
              </button>
              <button
                onClick={() => handleDigit("0")}
                className="flex h-[52px] items-center justify-center rounded-lg text-[22px] font-medium text-text active:bg-panel-2"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="flex h-[52px] items-center justify-center rounded-lg text-muted active:bg-panel-2"
                aria-label="Cofnij"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9.5 7L4.5 12L9.5 17M5 12H19.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="px-5 pb-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`mt-2 mb-1 w-full rounded-xl py-3.5 text-[15px] font-semibold transition-all ${
              canSave
                ? "bg-brass text-ink active:opacity-90"
                : "bg-panel-2 text-muted/30"
            }`}
          >
            Zapisz wydatek
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { formatAmount, terminalInputToGrosze } from "@/domain/money";
import { Button } from "@/components/ui/Button";
import { EXPENSE_CATEGORIES, detectCategory, getCategoryById } from "@/domain/constants";
import type { Transaction } from "@/domain/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id" | "createdAt">) => void;
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
  periodId,
}: Props) {
  // Terminal keypad mode (mobile)
  const [digits, setDigits] = useState("");
  // Text input mode (desktop)
  const [textAmount, setTextAmount] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [note, setNote] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isImpulse, setIsImpulse] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Auto-detected category from note text
  const autoDetectedId = detectCategory(note);
  // Effective category: manual pick > auto-detection > null
  const effectiveCategoryId = selectedCategoryId ?? autoDetectedId;

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
      setNote("");
      setSelectedCategoryId(null);
      setIsImpulse(false);
      // Focus desktop input after mount
      if (!isMobile) {
        setTimeout(() => desktopInputRef.current?.focus(), 100);
      }
    }
  }, [open, isMobile]);

  const handleDigit = useCallback((d: string) => {
    setDigits((prev) => {
      if (prev.length >= 8) return prev;
      if (prev === "" && d === "0") return prev;
      return prev + d;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleSave = useCallback(() => {
    if (amount <= 0 || !effectiveCategoryId) return;

    const today = new Date().toISOString().split("T")[0];

    onSave({
      periodId,
      kind: "envelopeExpense",
      amount,
      date: today,
      paidFrom: "main",
      subcategory: effectiveCategoryId,
      note: note.trim() || undefined,
      isImpulse,
    });

    onClose();
  }, [amount, effectiveCategoryId, periodId, note, isImpulse, onSave, onClose]);

  if (!open) return null;

  const canSave = amount > 0 && effectiveCategoryId !== null;

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

        {/* Amount display */}
        <div className="px-5 pb-3 text-center">
          {isMobile ? (
            <>
              <span
                className={`font-display text-display font-semibold tabular-nums tracking-[-0.02em] ${
                  amount > 0 ? "text-text" : "text-muted/30"
                }`}
                style={{ fontOpticalSizing: "auto" }}
              >
                {amount > 0 ? formatAmount(amount) : "0,00"}
              </span>
              <span className="ml-1.5 text-body-lg text-muted/50">zł</span>
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
                  if (e.key === "Tab") {
                    e.preventDefault();
                    noteInputRef.current?.focus();
                  }
                }}
                placeholder="0,00"
                className="w-40 border-b-2 border-line bg-transparent text-center font-display text-display font-semibold tabular-nums tracking-[-0.02em] text-text placeholder:text-muted/30 focus:border-brass focus:outline-none"
                style={{ fontOpticalSizing: "auto" }}
              />
              <span className="text-body-lg text-muted/50">zł</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5">
          {/* Note / name input */}
          <div className="mb-3">
            <input
              ref={noteInputRef}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) handleSave();
              }}
              placeholder="Co kupujesz? np. Żabka, Orlen, Rossmann…"
              className="w-full rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
            />
            {/* Auto-detection hint */}
            {autoDetectedId && !selectedCategoryId && (
              <p className="mt-1 px-1 text-micro text-muted/60">
                Auto: {getCategoryById(autoDetectedId).emoji}{" "}
                {getCategoryById(autoDetectedId).name}
              </p>
            )}
          </div>

          {/* Category grid */}
          <div className="mb-3">
            <span className="mb-2 block text-micro font-medium text-muted">
              Kategoria
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isAutoDetected = autoDetectedId === cat.id && !selectedCategoryId;
                const isManuallySelected = selectedCategoryId === cat.id;
                const isSelected = isManuallySelected || isAutoDetected;

                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setSelectedCategoryId(
                        selectedCategoryId === cat.id ? null : cat.id
                      )
                    }
                    className={`flex min-h-[56px] flex-col items-center justify-center rounded-lg border px-1 py-2 transition-colors ${
                      isSelected
                        ? isAutoDetected
                          ? "border-brass/25 bg-brass/5"
                          : "border-brass/40 bg-brass/10"
                        : "border-line bg-panel-2 active:bg-line"
                    }`}
                  >
                    <span className="text-body-lg leading-none">{cat.emoji}</span>
                    <span
                      className={`mt-1 line-clamp-1 text-center text-[10px] font-medium leading-tight ${
                        isSelected ? "text-brass" : "text-muted"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impulse toggle */}
          <button
            onClick={() => setIsImpulse(!isImpulse)}
            className={`mb-3 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
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
        </div>

        {/* Keypad — mobile only */}
        {isMobile && (
          <div className="border-t border-line px-5 pb-2 pt-3">
            <div className="grid grid-cols-3 gap-[1px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="flex h-[52px] items-center justify-center rounded-lg text-title font-medium text-text active:bg-panel-2"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => {
                  handleDigit("0");
                  handleDigit("0");
                }}
                className="flex h-[52px] items-center justify-center rounded-lg text-body-lg font-medium text-muted active:bg-panel-2"
              >
                00
              </button>
              <button
                onClick={() => handleDigit("0")}
                className="flex h-[52px] items-center justify-center rounded-lg text-title font-medium text-text active:bg-panel-2"
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
          <Button
            fullWidth
            onClick={handleSave}
            disabled={!canSave}
            className="mt-2 mb-1"
          >
            Zapisz wydatek
          </Button>
        </div>
      </div>
    </>
  );
}

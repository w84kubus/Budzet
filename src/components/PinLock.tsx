"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePinStore } from "@/stores/pin-store";
import { verifyPin } from "@/lib/pin";
import { signOut } from "@/lib/firebase/auth";

export function PinLock() {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const pinStore = usePinStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDigit = useCallback(
    (digit: string) => {
      if (verifying) return;
      const next = digits + digit;
      setError("");

      if (next.length === 4) {
        setVerifying(true);
        void (async () => {
          const ok = await verifyPin(next, pinStore.pinHash!);
          if (ok) {
            pinStore.setLocked(false);
            pinStore.resetFailedAttempts();
            pinStore.touch();
            setDigits("");
          } else {
            pinStore.incrementFailedAttempts();
            setError("Nieprawidłowy PIN");
            setDigits("");
          }
          setVerifying(false);
        })();
      } else {
        setDigits(next);
      }
    },
    [digits, verifying, pinStore]
  );

  const handleBackspace = useCallback(() => {
    setDigits((d) => d.slice(0, -1));
    setError("");
  }, []);

  const handleForgot = useCallback(async () => {
    await signOut();
    pinStore.setLocked(false);
    pinStore.setPinHash(null);
  }, [pinStore]);

  // Keyboard support — listen for digit keys and backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace]);

  const padButtons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">
          Budżet
        </h1>
        <p className="mt-2 text-sm text-muted">Wpisz PIN, aby kontynuować</p>
      </div>

      {/* Dots */}
      <div className="mb-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full border transition-colors ${
              i < digits.length
                ? "border-brass bg-brass"
                : "border-line bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-bad">{error}</p>
      )}
      {pinStore.failedAttempts >= 3 && (
        <p className="mb-4 text-xs text-muted">
          {pinStore.failedAttempts} nieudanych prób
        </p>
      )}

      {/* Keypad */}
      <div className="grid w-64 grid-cols-3 gap-3">
        {padButtons.map((btn, i) => {
          if (btn === "") return <div key={i} />;
          if (btn === "⌫") {
            return (
              <button
                key={i}
                onClick={handleBackspace}
                className="flex h-16 items-center justify-center rounded-xl text-xl text-muted active:bg-panel-2"
                aria-label="Cofnij"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(btn)}
              className="flex h-16 items-center justify-center rounded-xl bg-panel text-xl font-medium text-text active:bg-panel-2"
            >
              {btn}
            </button>
          );
        })}
      </div>

      {/* Forgot PIN */}
      <button
        onClick={handleForgot}
        className="mt-8 text-sm text-muted underline-offset-2 hover:underline"
      >
        Zapomniałem PIN-u
      </button>
    </div>
  );
}

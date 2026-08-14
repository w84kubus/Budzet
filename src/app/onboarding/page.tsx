"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { initializeUserData } from "@/lib/firebase/db";
import { hashPin, isValidPin } from "@/lib/pin";
import { createInitialPeriod } from "@/domain/operations";
import {
  DEFAULT_FIXED_EXPENSE_DEFS,
  DEFAULT_ENVELOPES,
} from "@/domain/defaults";
import { formatAmount } from "@/domain/money";
import type {
  UserSettings,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
} from "@/domain/types";

type Step = "payday" | "income" | "confirm" | "pin";

export default function OnboardingPage() {
  const router = useRouter();
  const { budgetId } = useAuth();
  const [step, setStep] = useState<Step>("payday");
  const [paydayDay, setPaydayDay] = useState(10);
  const [income, setIncome] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [skipPin, setSkipPin] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!budgetId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  async function handleFinish() {
    if (!budgetId) return;
    setError("");
    setSaving(true);

    try {
      // PIN hash
      let pinHash: string | null = null;
      if (!skipPin && pin) {
        if (!isValidPin(pin)) {
          setError("PIN musi składać się z 4 cyfr.");
          setSaving(false);
          return;
        }
        if (pin !== pinConfirm) {
          setError("PIN-y nie są identyczne.");
          setSaving(false);
          return;
        }
        pinHash = await hashPin(pin);
      }

      const now = new Date().toISOString();
      const today = now.split("T")[0];

      // Settings
      const settings: UserSettings = {
        paydayDay,
        pinHash,
        currency: "PLN",
        createdAt: now,
        lastBackupAt: null,
      };

      // Income in grosze
      const incomeGrosze = income ? Math.round(parseFloat(income.replace(",", ".")) * 100) : 0;

      // Period
      const period = createInitialPeriod(today, incomeGrosze);

      // Fixed expense defs with IDs
      const fixedExpenseDefs: FixedExpenseDef[] = DEFAULT_FIXED_EXPENSE_DEFS.map(
        (def, i) => ({
          ...def,
          id: `fed_${i}`,
        })
      );

      // Fixed expense instances for the initial period
      const fixedExpenseInstances: FixedExpenseInstance[] = fixedExpenseDefs
        .filter((d) => !d.archived)
        .map((def) => ({
          id: `${period.id}_${def.id}`,
          periodId: period.id,
          defId: def.id,
          planned: def.defaultPlanned,
          actual: 0,
          isPaid: false,
          paidAt: null,
        }));

      // Envelopes with IDs
      const envelopes: Envelope[] = DEFAULT_ENVELOPES.map((env, i) => ({
        ...env,
        id: `env_${i}`,
      }));

      await initializeUserData(
        budgetId,
        settings,
        period,
        fixedExpenseDefs,
        fixedExpenseInstances,
        envelopes
      );

      router.push("/");
    } catch (err) {
      console.error("Onboarding save error:", err);
      setError("Nie udało się zapisać danych. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="mb-8 flex gap-1.5">
          {(["payday", "income", "confirm", "pin"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                (["payday", "income", "confirm", "pin"] as Step[]).indexOf(step) >= i
                  ? "bg-brass"
                  : "bg-line"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Payday */}
        {step === "payday" && (
          <div>
            <h2 className="mb-1 font-display text-2xl font-semibold text-text">
              Dzień wypłaty
            </h2>
            <p className="mb-6 text-sm text-muted">
              Którego dnia miesiąca zazwyczaj dostajesz wypłatę?
            </p>
            <div className="mb-6">
              <input
                type="number"
                min={1}
                max={31}
                value={paydayDay}
                onChange={(e) => setPaydayDay(Number(e.target.value))}
                className="w-24 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-lg text-text focus:border-brass focus:outline-none"
              />
              <span className="ml-3 text-muted">dnia miesiąca</span>
            </div>
            <button
              onClick={() => setStep("income")}
              className="w-full rounded-lg bg-brass py-2.5 text-sm font-medium text-ink"
            >
              Dalej
            </button>
          </div>
        )}

        {/* Step 2: Income */}
        {step === "income" && (
          <div>
            <h2 className="mb-1 font-display text-2xl font-semibold text-text">
              Kwota wypłaty
            </h2>
            <p className="mb-6 text-sm text-muted">
              Ile zazwyczaj dostajesz na rękę? Możesz zmienić przy każdym okresie.
            </p>
            <div className="mb-6 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0,00"
                className="w-40 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right text-lg text-text focus:border-brass focus:outline-none"
              />
              <span className="text-muted">zł</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("payday")}
                className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted hover:text-text"
              >
                Wstecz
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-ink"
              >
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm defaults */}
        {step === "confirm" && (
          <div>
            <h2 className="mb-1 font-display text-2xl font-semibold text-text">
              Twój budżet
            </h2>
            <p className="mb-4 text-sm text-muted">
              Przygotowaliśmy startowy zestaw kategorii. Możesz je zmienić
              później w ustawieniach.
            </p>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                Wydatki stałe
              </h3>
              <div className="space-y-1">
                {DEFAULT_FIXED_EXPENSE_DEFS.map((def, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 text-sm"
                  >
                    <span className="text-text">{def.name}</span>
                    <span className="font-mono text-xs text-muted">
                      {def.defaultPlanned > 0
                        ? formatAmount(def.defaultPlanned) + " zł"
                        : "do uzupełnienia"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                Koperty
              </h3>
              <div className="space-y-1">
                {DEFAULT_ENVELOPES.map((env, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 text-sm"
                  >
                    <span className="text-text">
                      {env.emoji} {env.name}
                    </span>
                    {env.targetAmount && (
                      <span className="font-mono text-xs text-muted">
                        cel: {formatAmount(env.targetAmount)} zł
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("income")}
                className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted hover:text-text"
              >
                Wstecz
              </button>
              <button
                onClick={() => setStep("pin")}
                className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-ink"
              >
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* Step 4: PIN */}
        {step === "pin" && (
          <div>
            <h2 className="mb-1 font-display text-2xl font-semibold text-text">
              Blokada PIN
            </h2>
            <p className="mb-6 text-sm text-muted">
              Ustaw 4-cyfrowy PIN, żeby nikt postronny nie zajrzał do Twojego
              budżetu. Możesz to zrobić później.
            </p>

            {!skipPin && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-muted">PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-text focus:border-brass focus:outline-none"
                    placeholder="····"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">
                    Powtórz PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) =>
                      setPinConfirm(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-text focus:border-brass focus:outline-none"
                    placeholder="····"
                  />
                </div>
              </div>
            )}

            <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={skipPin}
                onChange={(e) => {
                  setSkipPin(e.target.checked);
                  if (e.target.checked) {
                    setPin("");
                    setPinConfirm("");
                  }
                }}
                className="rounded border-line"
              />
              Pomiń — ustawię PIN później
            </label>

            {error && <p className="mb-4 text-sm text-bad">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted hover:text-text"
              >
                Wstecz
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Zapisywanie…" : "Gotowe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

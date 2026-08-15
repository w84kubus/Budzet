"use client";

import { useState, useRef, useEffect } from "react";
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
import { ENVELOPE_EMOJI_OPTIONS } from "@/domain/constants";
import type {
  UserSettings,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
} from "@/domain/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = "payday" | "income" | "fixed" | "envelopes" | "summary" | "pin";

const STEPS: Step[] = ["payday", "income", "fixed", "envelopes", "summary", "pin"];

type EditableFixedDef = {
  tempId: string;
  name: string;
  type: "single" | "accumulating";
  defaultPlanned: number; // grosze
  dueDay: number | null;
};

type EditableEnvelope = {
  tempId: string;
  name: string;
  emoji: string;
  monthlyPlan: number; // grosze
  targetAmount: number | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseAmountInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

let nextTempId = 0;
function tempId(): string {
  return `tmp_${nextTempId++}`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { budgetId } = useAuth();
  const [step, setStep] = useState<Step>("payday");

  // Step 1: Payday
  const [paydayDay, setPaydayDay] = useState(10);

  // Step 2: Income
  const [income, setIncome] = useState("");

  // Step 3: Fixed expenses
  const [fixedDefs, setFixedDefs] = useState<EditableFixedDef[]>(() =>
    DEFAULT_FIXED_EXPENSE_DEFS.map((def) => ({
      tempId: tempId(),
      name: def.name,
      type: def.type,
      defaultPlanned: def.defaultPlanned,
      dueDay: def.dueDay,
    }))
  );

  // Step 4: Envelopes
  const [envelopes, setEnvelopes] = useState<EditableEnvelope[]>(() =>
    DEFAULT_ENVELOPES.map((env) => ({
      tempId: tempId(),
      name: env.name,
      emoji: env.emoji,
      monthlyPlan: env.monthlyPlan,
      targetAmount: env.targetAmount,
    }))
  );

  // Step 6: PIN
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [skipPin, setSkipPin] = useState(false);

  // General
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!budgetId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);

  // ─── Finish ─────────────────────────────────────────────────────────────

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
      const incomeGrosze = income
        ? Math.round(parseFloat(income.replace(",", ".")) * 100)
        : 0;

      // Period
      const period = createInitialPeriod(today, incomeGrosze);

      // Fixed expense defs
      const finalFixedDefs: FixedExpenseDef[] = fixedDefs
        .filter((d) => d.name.trim())
        .map((def, i) => ({
          id: `fed_${i}`,
          name: def.name.trim(),
          type: def.type,
          defaultPlanned: def.defaultPlanned,
          dueDay: def.dueDay,
          endDate: null,
          subcategories: [],
          order: i,
          archived: false,
        }));

      // Fixed expense instances for the initial period
      const finalInstances: FixedExpenseInstance[] = finalFixedDefs.map(
        (def) => ({
          id: `${period.id}_${def.id}`,
          periodId: period.id,
          defId: def.id,
          planned: def.defaultPlanned,
          actual: 0,
          isPaid: false,
          paidAt: null,
        })
      );

      // Envelopes
      const finalEnvelopes: Envelope[] = envelopes
        .filter((e) => e.name.trim())
        .map((env, i) => ({
          id: `env_${i}`,
          name: env.name.trim(),
          emoji: env.emoji,
          monthlyPlan: env.monthlyPlan,
          targetAmount: env.targetAmount,
          subcategories: [],
          order: i,
          archived: false,
        }));

      await initializeUserData(
        budgetId,
        settings,
        period,
        finalFixedDefs,
        finalInstances,
        finalEnvelopes
      );

      router.push("/");
    } catch (err) {
      console.error("Onboarding save error:", err);
      setError("Nie udało się zapisać danych. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                stepIndex >= i ? "bg-brass" : "bg-line"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Payday */}
        {step === "payday" && (
          <StepPayday
            paydayDay={paydayDay}
            setPaydayDay={setPaydayDay}
            onNext={() => setStep("income")}
          />
        )}

        {/* Step 2: Income */}
        {step === "income" && (
          <StepIncome
            income={income}
            setIncome={setIncome}
            onBack={() => setStep("payday")}
            onNext={() => setStep("fixed")}
          />
        )}

        {/* Step 3: Fixed expenses */}
        {step === "fixed" && (
          <StepFixedExpenses
            fixedDefs={fixedDefs}
            setFixedDefs={setFixedDefs}
            onBack={() => setStep("income")}
            onNext={() => setStep("envelopes")}
          />
        )}

        {/* Step 4: Envelopes */}
        {step === "envelopes" && (
          <StepEnvelopes
            envelopes={envelopes}
            setEnvelopes={setEnvelopes}
            onBack={() => setStep("fixed")}
            onNext={() => setStep("summary")}
          />
        )}

        {/* Step 5: Summary */}
        {step === "summary" && (
          <StepSummary
            paydayDay={paydayDay}
            income={income}
            fixedDefs={fixedDefs}
            envelopes={envelopes}
            onBack={() => setStep("envelopes")}
            onNext={() => setStep("pin")}
          />
        )}

        {/* Step 6: PIN */}
        {step === "pin" && (
          <StepPin
            pin={pin}
            setPin={setPin}
            pinConfirm={pinConfirm}
            setPinConfirm={setPinConfirm}
            skipPin={skipPin}
            setSkipPin={setSkipPin}
            error={error}
            saving={saving}
            onBack={() => setStep("summary")}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────

function StepPayday({
  paydayDay,
  setPaydayDay,
  onNext,
}: {
  paydayDay: number;
  setPaydayDay: (d: number) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
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
          className="w-24 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-body-lg text-text focus:border-brass focus:outline-none"
        />
        <span className="ml-3 text-muted">dnia miesiąca</span>
      </div>
      <button
        onClick={onNext}
        className="w-full rounded-lg bg-brass py-2.5 text-sm font-medium text-ink"
      >
        Dalej
      </button>
    </div>
  );
}

function StepIncome({
  income,
  setIncome,
  onBack,
  onNext,
}: {
  income: string;
  setIncome: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
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
          className="w-40 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-right text-body-lg text-text focus:border-brass focus:outline-none"
        />
        <span className="text-muted">zł</span>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── Step 3: Fixed Expenses ─────────────────────────────────────────────

function StepFixedExpenses({
  fixedDefs,
  setFixedDefs,
  onBack,
  onNext,
}: {
  fixedDefs: EditableFixedDef[];
  setFixedDefs: (defs: EditableFixedDef[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew) newNameRef.current?.focus();
  }, [addingNew]);

  const updateDef = (id: string, updates: Partial<EditableFixedDef>) => {
    setFixedDefs(fixedDefs.map((d) =>
      d.tempId === id ? { ...d, ...updates } : d
    ));
  };

  const removeDef = (id: string) => {
    setFixedDefs(fixedDefs.filter((d) => d.tempId !== id));
  };

  const addDef = () => {
    if (!newName.trim()) return;
    const newDef: EditableFixedDef = {
      tempId: tempId(),
      name: newName.trim(),
      type: "single",
      defaultPlanned: parseAmountInput(newAmount),
      dueDay: null,
    };
    setFixedDefs([...fixedDefs, newDef]);
    setNewName("");
    setNewAmount("");
    setAddingNew(false);
  };

  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
        Wydatki stałe
      </h2>
      <p className="mb-4 text-sm text-muted">
        Dodaj swoje comiesięczne rachunki i zobowiązania — czynsz, raty,
        subskrypcje. Kwoty możesz uzupełnić teraz lub później.
      </p>

      <div className="mb-4 max-h-[340px] space-y-1.5 overflow-y-auto">
        {fixedDefs.length === 0 && !addingNew && (
          <p className="py-4 text-center text-sm text-muted">
            Brak wydatków stałych. Dodaj swoje poniżej.
          </p>
        )}
        {fixedDefs.map((def) => (
          <FixedDefRow
            key={def.tempId}
            def={def}
            onUpdate={(updates) => updateDef(def.tempId, updates)}
            onRemove={() => removeDef(def.tempId)}
          />
        ))}
      </div>

      {/* Add new form */}
      {addingNew ? (
        <div className="mb-4 rounded-lg border border-line bg-panel p-3">
          <div className="mb-2 flex gap-2">
            <input
              ref={newNameRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwa wydatku"
              onKeyDown={(e) => {
                if (e.key === "Enter") addDef();
                if (e.key === "Escape") setAddingNew(false);
              }}
              className="min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-text focus:border-brass focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0,00"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addDef();
                }}
                className="w-24 rounded-lg border border-line bg-panel-2 px-2 py-2 text-right font-mono text-sm text-text focus:border-brass focus:outline-none"
              />
              <span className="text-micro text-muted">zł</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddingNew(false)}
              className="flex-1 rounded-lg border border-line py-2 text-micro text-muted hover:text-text"
            >
              Anuluj
            </button>
            <button
              onClick={addDef}
              disabled={!newName.trim()}
              className="flex-1 rounded-lg bg-brass py-2 text-micro font-medium text-ink disabled:opacity-40"
            >
              Dodaj
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="mb-4 w-full rounded-lg border border-dashed border-line py-2.5 text-sm text-muted transition-colors hover:border-brass hover:text-brass"
        >
          + Dodaj wydatek stały
        </button>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function FixedDefRow({
  def,
  onUpdate,
  onRemove,
}: {
  def: EditableFixedDef;
  onUpdate: (updates: Partial<EditableFixedDef>) => void;
  onRemove: () => void;
}) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState(
    def.defaultPlanned > 0 ? formatAmount(def.defaultPlanned) : ""
  );
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAmount) amountRef.current?.focus();
  }, [editingAmount]);

  const commitAmount = () => {
    const grosze = parseAmountInput(amountValue);
    onUpdate({ defaultPlanned: grosze });
    if (grosze === 0) setAmountValue("");
    setEditingAmount(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {def.name}
      </span>

      <div className="w-[90px] text-right">
        {editingAmount ? (
          <input
            ref={amountRef}
            type="text"
            inputMode="decimal"
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value)}
            onBlur={commitAmount}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAmount();
              if (e.key === "Escape") {
                setAmountValue(
                  def.defaultPlanned > 0
                    ? formatAmount(def.defaultPlanned)
                    : ""
                );
                setEditingAmount(false);
              }
            }}
            placeholder="0,00"
            className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-right font-mono text-micro text-text focus:border-brass focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingAmount(true)}
            className="font-mono text-micro tabular-nums text-muted transition-colors hover:text-brass"
            title="Kliknij, aby edytować kwotę"
          >
            {def.defaultPlanned > 0
              ? `${formatAmount(def.defaultPlanned)} zł`
              : "— zł"}
          </button>
        )}
      </div>

      <button
        onClick={onRemove}
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bad/10 hover:text-bad"
        title="Usuń"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Step 4: Envelopes ──────────────────────────────────────────────────

function StepEnvelopes({
  envelopes,
  setEnvelopes,
  onBack,
  onNext,
}: {
  envelopes: EditableEnvelope[];
  setEnvelopes: (envs: EditableEnvelope[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💰");
  const [newPlan, setNewPlan] = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew) newNameRef.current?.focus();
  }, [addingNew]);

  const removeEnvelope = (id: string) => {
    setEnvelopes(envelopes.filter((e) => e.tempId !== id));
  };

  const updateEnvelope = (id: string, updates: Partial<EditableEnvelope>) => {
    setEnvelopes(
      envelopes.map((e) => (e.tempId === id ? { ...e, ...updates } : e))
    );
  };

  const addEnvelope = () => {
    if (!newName.trim()) return;
    setEnvelopes([
      ...envelopes,
      {
        tempId: tempId(),
        name: newName.trim(),
        emoji: newEmoji,
        monthlyPlan: parseAmountInput(newPlan),
        targetAmount: null,
      },
    ]);
    setNewName("");
    setNewPlan("");
    setNewEmoji("💰");
    setAddingNew(false);
  };

  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
        Koperty
      </h2>
      <p className="mb-4 text-sm text-muted">
        Koperty to Twoje cele oszczędnościowe. Przydzielaj im pieniądze co
        miesiąc — wydatki z kopert nie obciążają dziennego limitu.
      </p>

      <div className="mb-4 max-h-[340px] space-y-1.5 overflow-y-auto">
        {envelopes.map((env) => (
          <EnvelopeRow
            key={env.tempId}
            env={env}
            onUpdate={(updates) => updateEnvelope(env.tempId, updates)}
            onRemove={() => removeEnvelope(env.tempId)}
          />
        ))}
      </div>

      {/* Add new form */}
      {addingNew ? (
        <div className="mb-4 rounded-lg border border-line bg-panel p-3">
          <div className="mb-3 flex gap-2">
            <EmojiPickerButton emoji={newEmoji} onSelect={setNewEmoji} />
            <input
              ref={newNameRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwa koperty"
              onKeyDown={(e) => {
                if (e.key === "Enter") addEnvelope();
                if (e.key === "Escape") setAddingNew(false);
              }}
              className="min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-text focus:border-brass focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                placeholder="0,00"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addEnvelope();
                }}
                className="w-20 rounded-lg border border-line bg-panel-2 px-2 py-2 text-right font-mono text-sm text-text focus:border-brass focus:outline-none"
              />
              <span className="text-micro text-muted">zł/mies.</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddingNew(false)}
              className="flex-1 rounded-lg border border-line py-2 text-micro text-muted hover:text-text"
            >
              Anuluj
            </button>
            <button
              onClick={addEnvelope}
              disabled={!newName.trim()}
              className="flex-1 rounded-lg bg-brass py-2 text-micro font-medium text-ink disabled:opacity-40"
            >
              Dodaj
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="mb-4 w-full rounded-lg border border-dashed border-line py-2.5 text-sm text-muted transition-colors hover:border-brass hover:text-brass"
        >
          + Dodaj kopertę
        </button>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function EnvelopeRow({
  env,
  onUpdate,
  onRemove,
}: {
  env: EditableEnvelope;
  onUpdate: (updates: Partial<EditableEnvelope>) => void;
  onRemove: () => void;
}) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [planValue, setPlanValue] = useState(
    env.monthlyPlan > 0 ? formatAmount(env.monthlyPlan) : ""
  );
  const planRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPlan) planRef.current?.focus();
  }, [editingPlan]);

  const commitPlan = () => {
    const grosze = parseAmountInput(planValue);
    onUpdate({ monthlyPlan: grosze });
    if (grosze === 0) setPlanValue("");
    setEditingPlan(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2">
      <EmojiPickerButton
        emoji={env.emoji}
        onSelect={(emoji) => onUpdate({ emoji })}
      />

      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {env.name}
      </span>

      <div className="w-[90px] text-right">
        {editingPlan ? (
          <input
            ref={planRef}
            type="text"
            inputMode="decimal"
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            onBlur={commitPlan}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitPlan();
              if (e.key === "Escape") {
                setPlanValue(
                  env.monthlyPlan > 0 ? formatAmount(env.monthlyPlan) : ""
                );
                setEditingPlan(false);
              }
            }}
            placeholder="0,00"
            className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-right font-mono text-micro text-text focus:border-brass focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingPlan(true)}
            className="font-mono text-micro tabular-nums text-muted transition-colors hover:text-brass"
            title="Kliknij, aby edytować plan"
          >
            {env.monthlyPlan > 0
              ? `${formatAmount(env.monthlyPlan)} zł`
              : "— zł"}
          </button>
        )}
      </div>

      <button
        onClick={onRemove}
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bad/10 hover:text-bad"
        title="Usuń"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Shared: Emoji Picker Button ────────────────────────────────────────

function EmojiPickerButton({
  emoji,
  onSelect,
}: {
  emoji: string;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-body transition-colors ${
          open
            ? "bg-brass/15 ring-1 ring-brass/40"
            : "bg-panel-2 hover:bg-line"
        }`}
        title="Zmień ikonę"
      >
        {emoji}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-6 gap-1 rounded-xl border border-line bg-panel p-2 shadow-lg shadow-ink/50">
          {ENVELOPE_EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-body-lg transition-colors ${
                emoji === e
                  ? "bg-brass/15 ring-1 ring-brass/40"
                  : "hover:bg-panel-2"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Summary ────────────────────────────────────────────────────

function StepSummary({
  paydayDay,
  income,
  fixedDefs,
  envelopes,
  onBack,
  onNext,
}: {
  paydayDay: number;
  income: string;
  fixedDefs: EditableFixedDef[];
  envelopes: EditableEnvelope[];
  onBack: () => void;
  onNext: () => void;
}) {
  const incomeGrosze = income
    ? Math.round(parseFloat(income.replace(",", ".")) * 100)
    : 0;
  const totalFixed = fixedDefs.reduce((sum, d) => sum + d.defaultPlanned, 0);
  const totalEnvPlans = envelopes.reduce((sum, e) => sum + e.monthlyPlan, 0);
  const remaining = incomeGrosze - totalFixed - totalEnvPlans;

  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
        Podsumowanie
      </h2>
      <p className="mb-5 text-sm text-muted">
        Sprawdź, czy wszystko się zgadza, zanim zaczniemy.
      </p>

      {/* Overview cards */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-panel px-3 py-2.5">
          <p className="text-micro text-muted">Wypłata</p>
          <p className="font-mono text-body font-medium tabular-nums text-text">
            {incomeGrosze > 0 ? `${formatAmount(incomeGrosze)} zł` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-panel px-3 py-2.5">
          <p className="text-micro text-muted">Dzień wypłaty</p>
          <p className="text-body font-medium text-text">{paydayDay}.</p>
        </div>
        <div className="rounded-lg bg-panel px-3 py-2.5">
          <p className="text-micro text-muted">
            Wydatki stałe ({fixedDefs.filter((d) => d.defaultPlanned > 0).length}/{fixedDefs.length})
          </p>
          <p className="font-mono text-body font-medium tabular-nums text-text">
            {formatAmount(totalFixed)} zł
          </p>
        </div>
        <div className="rounded-lg bg-panel px-3 py-2.5">
          <p className="text-micro text-muted">
            Plany kopert ({envelopes.filter((e) => e.monthlyPlan > 0).length}/{envelopes.length})
          </p>
          <p className="font-mono text-body font-medium tabular-nums text-text">
            {formatAmount(totalEnvPlans)} zł
          </p>
        </div>
      </div>

      {/* Free funds indicator */}
      {incomeGrosze > 0 && (
        <div className="mb-4 rounded-lg border border-line bg-panel px-4 py-3 text-center">
          <p className="text-micro text-muted">Wolne środki po odliczeniach</p>
          <p
            className={`font-mono text-title font-semibold tabular-nums ${
              remaining >= 0 ? "text-good" : "text-bad"
            }`}
          >
            {formatAmount(remaining)} zł
          </p>
          {remaining < 0 && (
            <p className="mt-1 text-micro text-bad">
              Wydatki przekraczają wypłatę — zmniejsz kwoty lub wróć i popraw.
            </p>
          )}
        </div>
      )}

      {/* Lists */}
      <div className="mb-3">
        <h3 className="mb-1.5 text-micro font-medium uppercase tracking-wider text-muted">
          Wydatki stałe ({fixedDefs.length})
        </h3>
        <div className="space-y-0.5">
          {fixedDefs.map((d) => (
            <div
              key={d.tempId}
              className="flex items-center justify-between px-1 py-0.5 text-sm"
            >
              <span className="text-text">{d.name}</span>
              <span className="font-mono text-micro tabular-nums text-muted">
                {d.defaultPlanned > 0
                  ? `${formatAmount(d.defaultPlanned)} zł`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-1.5 text-micro font-medium uppercase tracking-wider text-muted">
          Koperty ({envelopes.length})
        </h3>
        <div className="space-y-0.5">
          {envelopes.map((e) => (
            <div
              key={e.tempId}
              className="flex items-center justify-between px-1 py-0.5 text-sm"
            >
              <span className="text-text">
                {e.emoji} {e.name}
              </span>
              <span className="font-mono text-micro tabular-nums text-muted">
                {e.monthlyPlan > 0
                  ? `${formatAmount(e.monthlyPlan)} zł/mies.`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Dalej" />
    </div>
  );
}

// ─── Step 6: PIN ────────────────────────────────────────────────────────

function StepPin({
  pin,
  setPin,
  pinConfirm,
  setPinConfirm,
  skipPin,
  setSkipPin,
  error,
  saving,
  onBack,
  onFinish,
}: {
  pin: string;
  setPin: (v: string) => void;
  pinConfirm: string;
  setPinConfirm: (v: string) => void;
  skipPin: boolean;
  setSkipPin: (v: boolean) => void;
  error: string;
  saving: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 font-display text-display font-semibold text-text">
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
              className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-body-lg tracking-[0.5em] text-text focus:border-brass focus:outline-none"
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
                setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-center text-body-lg tracking-[0.5em] text-text focus:border-brass focus:outline-none"
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
          onClick={onBack}
          className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted hover:text-text"
        >
          Wstecz
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Zapisywanie…" : "Rozpocznij 🚀"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared: Navigation Buttons ─────────────────────────────────────────

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Dalej",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted hover:text-text"
      >
        Wstecz
      </button>
      <button
        onClick={onNext}
        className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-ink"
      >
        {nextLabel}
      </button>
    </div>
  );
}

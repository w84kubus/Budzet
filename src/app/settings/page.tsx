"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { useBudgetStore } from "@/stores/budget-store";
import {
  updateSettings,
  updateFixedExpenseDef,
  deleteFixedExpenseDef,
  updateEnvelope,
  deleteEnvelope,
} from "@/lib/firebase/db";
import { signOut, changePassword } from "@/lib/firebase/auth";
import { hashPin } from "@/lib/pin";
import { formatAmount } from "@/domain/money";
import {
  exportTransactionsCSV,
  createBackup,
  downloadFile,
} from "@/domain/export";
import type { BackupData } from "@/domain/export";
import { ENVELOPE_EMOJI_OPTIONS } from "@/domain/constants";
import { sanitize, validateAmount, validatePassword } from "@/lib/validation";
import type { Envelope, FixedExpenseDef } from "@/domain/types";

function parseAmountInput(val: string): number {
  const cleaned = val.replace(",", ".").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const budgetId = user?.uid ?? null;
  useBudgetData(budgetId);

  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const allFixedExpenseInstances = useBudgetStore((s) => s.allFixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const transferTasks = useBudgetStore((s) => s.transferTasks);
  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);

  // Edit states
  const [paydayDay, setPaydayDay] = useState("");
  const [defaultIncome, setDefaultIncome] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState<"idle" | "set" | "change" | "remove">("idle");
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmWord, setConfirmWord] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (settings) {
      setPaydayDay(String(settings.paydayDay));
      setDefaultIncome("");
    }
  }, [settings]);

  const handleSavePaydayDay = useCallback(async () => {
    if (!budgetId || !settings) return;
    const day = parseInt(paydayDay);
    if (day >= 1 && day <= 31 && day !== settings.paydayDay) {
      await updateSettings(budgetId, { paydayDay: day });
    }
  }, [budgetId, settings, paydayDay]);

  const handleSavePin = useCallback(async () => {
    if (!budgetId || !pinInput.trim()) return;
    const hash = await hashPin(pinInput.trim());
    await updateSettings(budgetId, { pinHash: hash });
    setPinInput("");
    setPinMode("idle");
  }, [budgetId, pinInput]);

  const handleRemovePin = useCallback(async () => {
    if (!budgetId) return;
    await updateSettings(budgetId, { pinHash: null });
    setPinMode("idle");
  }, [budgetId]);

  const handleExportCSV = useCallback(() => {
    if (!allTransactions.length) return;
    const csv = exportTransactionsCSV(allTransactions, fixedExpenseDefs, envelopes);
    const date = new Date().toISOString().split("T")[0];
    downloadFile(csv, `budzet-wydatki-${date}.csv`, "text/csv;charset=utf-8");
  }, [allTransactions, fixedExpenseDefs, envelopes]);

  const handleExportJSON = useCallback(async () => {
    if (!settings || !budgetId) return;
    const backup = createBackup({
      settings,
      periods,
      fixedExpenseDefs,
      fixedExpenseInstances: allFixedExpenseInstances,
      envelopes,
      transactions: allTransactions,
      transferTasks,
    });
    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().split("T")[0];
    downloadFile(json, `budzet-kopia-${date}.json`, "application/json");

    await updateSettings(budgetId, {
      lastBackupAt: new Date().toISOString(),
    });
  }, [settings, budgetId, periods, fixedExpenseDefs, allFixedExpenseInstances, envelopes, allTransactions, transferTasks]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;
        if (!data.version || !data.settings || !data.periods) {
          setImportError("Nieprawidłowy format pliku.");
          return;
        }
        setImportData(data);
        setImportError(null);
      } catch {
        setImportError("Nie udało się odczytać pliku JSON.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleToggleArchiveDef = useCallback(
    async (def: FixedExpenseDef) => {
      if (!budgetId) return;
      await updateFixedExpenseDef(budgetId, def.id, {
        archived: !def.archived,
      });
    },
    [budgetId]
  );

  const handleToggleArchiveEnvelope = useCallback(
    async (env: Envelope) => {
      if (!budgetId) return;
      await updateEnvelope(budgetId, env.id, {
        archived: !env.archived,
      });
    },
    [budgetId]
  );

  const handleDeleteDef = useCallback(
    async (def: FixedExpenseDef) => {
      if (!budgetId) return;
      await deleteFixedExpenseDef(budgetId, def.id);
    },
    [budgetId]
  );

  const handleDeleteEnvelope = useCallback(
    async (env: Envelope) => {
      if (!budgetId) return;
      await deleteEnvelope(budgetId, env.id);
    },
    [budgetId]
  );

  const handleChangePassword = useCallback(async () => {
    setPassError("");
    setPassSuccess(false);

    const passCheck = validatePassword(newPass);
    if (!passCheck.valid) {
      setPassError(passCheck.error!);
      return;
    }
    if (newPass !== newPassConfirm) {
      setPassError("Nowe hasla nie sa identyczne.");
      return;
    }
    if (currentPass === newPass) {
      setPassError("Nowe haslo musi byc inne niz obecne.");
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(currentPass, newPass);
      setPassSuccess(true);
      setCurrentPass("");
      setNewPass("");
      setNewPassConfirm("");
      setTimeout(() => {
        setShowPasswordChange(false);
        setPassSuccess(false);
      }, 2000);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPassError("Obecne haslo jest nieprawidlowe.");
      } else if (code === "auth/weak-password") {
        setPassError("Nowe haslo jest za slabe.");
      } else if (code === "auth/too-many-requests") {
        setPassError("Za duzo prob. Sprobuj pozniej.");
      } else {
        setPassError("Nie udalo sie zmienic hasla. Sprobuj ponownie.");
      }
    } finally {
      setPassLoading(false);
    }
  }, [currentPass, newPass, newPassConfirm]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/login");
  }, [router]);

  if (loading || !isDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted">Ładowanie…</div>
      </div>
    );
  }

  const activeDefs = fixedExpenseDefs.filter((d) => !d.archived);
  const archivedDefs = fixedExpenseDefs.filter((d) => d.archived);
  const activeEnvelopes = envelopes.filter((e) => !e.archived);
  const archivedEnvelopes = envelopes.filter((e) => e.archived);

  const lastBackup = settings?.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleDateString("pl-PL")
    : null;
  const daysSinceBackup = settings?.lastBackupAt
    ? Math.floor(
        (Date.now() - new Date(settings.lastBackupAt).getTime()) / 86400000
      )
    : null;

  return (
    <div className="mx-auto max-w-[600px] px-4 pb-12 md:px-8">
      <div className="safe-top flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => router.push("/")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel hover:text-text"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-display text-title font-semibold text-text">
          Ustawienia
        </h1>
      </div>

      {/* ── General ── */}
      <Section title="Ogólne">
        <Row label="Dzień wypłaty">
          <input
            type="number"
            min="1"
            max="31"
            value={paydayDay}
            onChange={(e) => setPaydayDay(e.target.value)}
            onBlur={handleSavePaydayDay}
            className="w-16 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-center font-mono text-sm tabular-nums text-text focus:border-brass/40 focus:outline-none"
          />
        </Row>
      </Section>

      {/* ── Fixed Expenses ── */}
      <Section title="Wydatki stałe">
        {activeDefs.length === 0 ? (
          <p className="py-3 text-center text-caption text-muted">
            Brak aktywnych wydatków stałych.
          </p>
        ) : (
          <div className="space-y-1">
            {activeDefs.map((def) => (
              <EditableDefRow
                key={def.id}
                def={def}
                onSaveName={(name) => {
                  if (budgetId) updateFixedExpenseDef(budgetId, def.id, { name });
                }}
                onSavePlanned={(defaultPlanned) => {
                  if (budgetId) updateFixedExpenseDef(budgetId, def.id, { defaultPlanned });
                }}
                onArchive={() => handleToggleArchiveDef(def)}
                onDelete={() => handleDeleteDef(def)}
              />
            ))}
          </div>
        )}
        {archivedDefs.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-micro uppercase tracking-wider text-muted">
              Zarchiwizowane
            </p>
            {archivedDefs.map((def) => (
              <div
                key={def.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
              >
                <span className="text-caption text-muted line-through">
                  {def.name}
                </span>
                <button
                  onClick={() => handleToggleArchiveDef(def)}
                  className="text-micro text-muted hover:text-good"
                >
                  Przywróć
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Envelopes ── */}
      <Section title="Koperty">
        {activeEnvelopes.length === 0 ? (
          <p className="py-3 text-center text-caption text-muted">
            Brak aktywnych kopert.
          </p>
        ) : (
          <div className="space-y-1">
            {activeEnvelopes.map((env) => (
              <EditableEnvelopeRow
                key={env.id}
                env={env}
                onSaveEmoji={(emoji) => {
                  if (budgetId) updateEnvelope(budgetId, env.id, { emoji });
                }}
                onSaveName={(name) => {
                  if (budgetId) updateEnvelope(budgetId, env.id, { name });
                }}
                onSavePlan={(monthlyPlan) => {
                  if (budgetId) updateEnvelope(budgetId, env.id, { monthlyPlan });
                }}
                onArchive={() => handleToggleArchiveEnvelope(env)}
                onDelete={() => handleDeleteEnvelope(env)}
              />
            ))}
          </div>
        )}
        {archivedEnvelopes.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-micro uppercase tracking-wider text-muted">
              Zarchiwizowane
            </p>
            {archivedEnvelopes.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
              >
                <span className="text-caption text-muted line-through">
                  {env.emoji} {env.name}
                </span>
                <button
                  onClick={() => handleToggleArchiveEnvelope(env)}
                  className="text-micro text-muted hover:text-good"
                >
                  Przywróć
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── PIN ── */}
      <Section title="Blokada PIN">
        {settings?.pinHash ? (
          <div className="space-y-3">
            <p className="text-caption text-good">PIN aktywny ✓</p>
            {pinMode === "idle" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setPinMode("change")}
                  className="rounded-lg bg-panel-2 px-3 py-2 text-caption text-muted hover:text-text"
                >
                  Zmień PIN
                </button>
                <button
                  onClick={() => setPinMode("remove")}
                  className="rounded-lg bg-panel-2 px-3 py-2 text-caption text-muted hover:text-bad"
                >
                  Wyłącz PIN
                </button>
              </div>
            )}
            {pinMode === "change" && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Nowy PIN"
                  className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-2 text-center font-mono text-body text-text focus:border-brass/40 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSavePin}
                  disabled={pinInput.length < 4}
                  className="rounded-lg bg-brass px-4 py-2 text-caption font-semibold text-white disabled:opacity-30"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => { setPinMode("idle"); setPinInput(""); }}
                  className="text-micro text-muted"
                >
                  Anuluj
                </button>
              </div>
            )}
            {pinMode === "remove" && (
              <div className="flex items-center gap-2">
                <span className="text-caption text-bad">Na pewno wyłączyć?</span>
                <button
                  onClick={handleRemovePin}
                  className="rounded-lg bg-bad px-4 py-2 text-caption font-semibold text-white"
                >
                  Wyłącz
                </button>
                <button
                  onClick={() => setPinMode("idle")}
                  className="text-micro text-muted"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {pinMode !== "set" ? (
              <button
                onClick={() => setPinMode("set")}
                className="rounded-lg bg-panel-2 px-4 py-2 text-caption text-muted hover:text-text"
              >
                Ustaw PIN
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN (min. 4 cyfry)"
                  className="w-40 rounded-lg border border-line bg-panel-2 px-3 py-2 text-center font-mono text-body text-text focus:border-brass/40 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSavePin}
                  disabled={pinInput.length < 4}
                  className="rounded-lg bg-brass px-4 py-2 text-caption font-semibold text-white disabled:opacity-30"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => { setPinMode("idle"); setPinInput(""); }}
                  className="text-micro text-muted"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Export ── */}
      <Section title="Eksport">
        <div className="space-y-3">
          <button
            onClick={handleExportCSV}
            disabled={allTransactions.length === 0}
            className="w-full rounded-xl bg-panel-2 py-3 text-sm font-medium text-text transition-colors hover:bg-line disabled:text-muted/30"
          >
            📄 Eksportuj CSV (transakcje)
          </button>
          <button
            onClick={handleExportJSON}
            className="w-full rounded-xl bg-panel-2 py-3 text-sm font-medium text-text transition-colors hover:bg-line"
          >
            💾 Pobierz kopię zapasową (JSON)
          </button>
          {lastBackup && (
            <p className={`text-micro ${daysSinceBackup !== null && daysSinceBackup > 30 ? "text-bad" : "text-muted"}`}>
              Ostatnia kopia: {lastBackup}
              {daysSinceBackup !== null && daysSinceBackup > 30 && (
                <span className="ml-1">⚠ ponad 30 dni temu</span>
              )}
            </p>
          )}
        </div>
      </Section>

      {/* ── Import ── */}
      <Section title="Import">
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl bg-panel-2 py-3 text-sm font-medium text-text transition-colors hover:bg-line"
          >
            📂 Wczytaj kopię zapasową
          </button>
          {importError && (
            <p className="text-caption text-bad">{importError}</p>
          )}
          {importData && (
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <p className="mb-2 text-sm font-medium text-text">
                Podgląd importu
              </p>
              <div className="space-y-1 text-caption text-muted">
                <p>{importData.transactions.length} transakcji</p>
                <p>{importData.envelopes.length} kopert</p>
                <p>{importData.periods.length} okresów</p>
                <p>{importData.fixedExpenseDefs.length} wydatków stałych</p>
                <p className="text-micro text-muted/50">
                  Wyeksportowano: {new Date(importData.exportedAt).toLocaleString("pl-PL")}
                </p>
              </div>

              <div className="mt-4">
                <p className="mb-1 text-micro text-bad">
                  Wpisz ZASTĄP żeby potwierdzić nadpisanie danych:
                </p>
                <input
                  type="text"
                  value={confirmWord}
                  onChange={(e) => setConfirmWord(e.target.value)}
                  placeholder="ZASTĄP"
                  className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-center font-mono text-sm text-text focus:border-bad/40 focus:outline-none"
                />
                <button
                  disabled={confirmWord !== "ZASTĄP"}
                  className="mt-3 w-full rounded-xl bg-bad py-3 text-sm font-semibold text-white transition-all disabled:opacity-30"
                >
                  Zastąp dane (nieodwracalne)
                </button>
                <button
                  onClick={() => {
                    setImportData(null);
                    setConfirmWord("");
                  }}
                  className="mt-2 w-full text-center text-caption text-muted hover:text-text"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Print ── */}
      <Section title="Wydruk">
        {periods.length > 0 && (
          <div className="space-y-2">
            {periods
              .slice()
              .sort((a, b) => b.startDate.localeCompare(a.startDate))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => window.open(`/print/${p.id}`, "_blank")}
                  className="flex w-full items-center justify-between rounded-lg bg-panel-2 px-3 py-2.5 text-caption transition-colors hover:bg-line"
                >
                  <span className="text-text">{p.label}</span>
                  <span className="text-muted">🖨 Drukuj</span>
                </button>
              ))}
          </div>
        )}
      </Section>

      {/* ── Encryption ── */}
      <Section title="Szyfrowanie E2E">
        {settings?.encryptionSalt ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-good/15">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-caption text-good">Szyfrowanie aktywne</span>
            </div>
            <p className="text-micro leading-relaxed text-muted">
              Twoje kwoty, nazwy transakcji, koperty i wydatki stale sa zaszyfrowane kluczem wyprowadzonym z Twojego hasla. Nikt - nawet administrator bazy danych - nie moze ich odczytac.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bad/15">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3L9 9M9 3L3 9" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-caption text-bad">Szyfrowanie nieaktywne</span>
            </div>
            <p className="text-micro text-muted">
              Wyloguj sie i zaloguj ponownie, aby aktywowac szyfrowanie E2E.
            </p>
          </div>
        )}
      </Section>

      {/* ── Account ── */}
      <Section title="Konto">
        <p className="mb-3 text-caption text-muted">{user?.email}</p>

        {/* Password change */}
        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="mb-3 w-full rounded-xl bg-panel-2 py-3 text-sm font-medium text-text transition-colors hover:bg-line"
          >
            🔑 Zmien haslo
          </button>
        ) : (
          <div className="mb-3 space-y-3 rounded-xl border border-line bg-panel-2 p-4">
            <p className="text-sm font-medium text-text">Zmiana hasla</p>
            {settings?.encryptionSalt && (
              <p className="text-micro text-muted">
                Dane zostana ponownie zaszyfrowane nowym kluczem.
              </p>
            )}
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Obecne haslo"
              autoComplete="current-password"
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-text placeholder:text-muted/50 focus:border-brass focus:outline-none"
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Nowe haslo (min. 6 znakow)"
              autoComplete="new-password"
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-text placeholder:text-muted/50 focus:border-brass focus:outline-none"
            />
            <input
              type="password"
              value={newPassConfirm}
              onChange={(e) => setNewPassConfirm(e.target.value)}
              placeholder="Powtorz nowe haslo"
              autoComplete="new-password"
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-text placeholder:text-muted/50 focus:border-brass focus:outline-none"
            />
            {passError && (
              <p className="text-caption text-bad">{passError}</p>
            )}
            {passSuccess && (
              <p className="text-caption text-good">Haslo zmienione ✓</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={passLoading || !currentPass || !newPass || !newPassConfirm}
                className="flex-1 rounded-xl bg-brass py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                {passLoading ? "Zmieniam..." : "Zmien haslo"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPass("");
                  setNewPass("");
                  setNewPassConfirm("");
                  setPassError("");
                  setPassSuccess(false);
                }}
                className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-text"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-line py-3 text-sm font-medium text-muted transition-colors hover:border-bad/30 hover:text-bad"
        >
          Wyloguj sie
        </button>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-micro font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="rounded-xl bg-panel p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text">{label}</span>
      {children}
    </div>
  );
}

function EditableDefRow({
  def,
  onSaveName,
  onSavePlanned,
  onArchive,
  onDelete,
}: {
  def: FixedExpenseDef;
  onSaveName: (name: string) => void;
  onSavePlanned: (defaultPlanned: number) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameValue, setNameValue] = useState(def.name);
  const [amountValue, setAmountValue] = useState(
    formatAmount(def.defaultPlanned)
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (editingAmount) amountRef.current?.focus();
  }, [editingAmount]);

  const commitName = () => {
    const sanitized = sanitize(nameValue).slice(0, 100);
    if (sanitized && sanitized !== def.name) {
      onSaveName(sanitized);
    } else {
      setNameValue(def.name);
    }
    setEditingName(false);
  };

  const commitAmount = () => {
    const grosze = parseAmountInput(amountValue);
    if (grosze > 0 && grosze !== def.defaultPlanned && validateAmount(grosze).valid) {
      onSavePlanned(grosze);
    } else {
      setAmountValue(formatAmount(def.defaultPlanned));
    }
    setEditingAmount(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5">
      {/* Name */}
      <div className="min-w-0 flex-1">
        {editingName ? (
          <input
            ref={nameRef}
            type="text"
            value={nameValue}
            maxLength={100}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setNameValue(def.name);
                setEditingName(false);
              }
            }}
            className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-sm text-text outline-none focus:border-brass"
          />
        ) : (
          <div>
            <button
              onClick={() => setEditingName(true)}
              className="text-left text-sm text-text hover:text-brass transition-colors"
              title="Kliknij, aby edytować nazwę"
            >
              {def.name}
            </button>
            {def.endDate && (
              <p className="text-micro text-muted/70">
                do {def.endDate.replace("-", "/")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="w-[100px] shrink-0 text-right">
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
                setAmountValue(formatAmount(def.defaultPlanned));
                setEditingAmount(false);
              }
            }}
            className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-right font-mono text-micro tabular-nums text-text outline-none focus:border-brass"
          />
        ) : (
          <button
            onClick={() => setEditingAmount(true)}
            className="font-mono text-micro tabular-nums text-muted hover:text-brass transition-colors"
            title="Kliknij, aby edytować kwotę"
          >
            {formatAmount(def.defaultPlanned)} zł
          </button>
        )}
      </div>

      {/* Actions */}
      {confirmDelete ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-micro text-bad">Usunąć?</span>
          <button
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            className="rounded-md bg-bad/15 px-2 py-0.5 text-micro font-medium text-bad hover:bg-bad/25 transition-colors"
          >
            Tak
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-md px-2 py-0.5 text-micro text-muted hover:text-text transition-colors"
          >
            Nie
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onArchive}
            className="rounded-md px-2 py-0.5 text-micro text-muted hover:text-text transition-colors"
            title="Archiwizuj"
          >
            Archiwizuj
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted/50 hover:bg-bad/10 hover:text-bad transition-colors"
            title="Usuń"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 3.5H11.5M5.5 6V10M8.5 6V10M3.5 3.5L4 11.5C4 12.05 4.45 12.5 5 12.5H9C9.55 12.5 10 12.05 10 11.5L10.5 3.5M5 3.5V2C5 1.45 5.45 1 6 1H8C8.55 1 9 1.45 9 2V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function EditableEnvelopeRow({
  env,
  onSaveEmoji,
  onSaveName,
  onSavePlan,
  onArchive,
  onDelete,
}: {
  env: Envelope;
  onSaveEmoji: (emoji: string) => void;
  onSaveName: (name: string) => void;
  onSavePlan: (monthlyPlan: number) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameValue, setNameValue] = useState(env.name);
  const [planValue, setPlanValue] = useState(formatAmount(env.monthlyPlan));
  const nameRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (editingPlan) planRef.current?.focus();
  }, [editingPlan]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmojiPicker]);

  const commitName = () => {
    const sanitized = sanitize(nameValue).slice(0, 100);
    if (sanitized && sanitized !== env.name) {
      onSaveName(sanitized);
    } else {
      setNameValue(env.name);
    }
    setEditingName(false);
  };

  const commitPlan = () => {
    const grosze = parseAmountInput(planValue);
    if (grosze > 0 && grosze !== env.monthlyPlan && validateAmount(grosze).valid) {
      onSavePlan(grosze);
    } else {
      setPlanValue(formatAmount(env.monthlyPlan));
    }
    setEditingPlan(false);
  };

  return (
    <div className="rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-2">
        {/* Emoji button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors ${
              showEmojiPicker
                ? "bg-brass/15 ring-1 ring-brass/40"
                : "hover:bg-panel-2"
            }`}
            title="Zmień ikonę"
          >
            {env.emoji}
          </button>

          {/* Emoji picker dropdown */}
          {showEmojiPicker && (
            <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-6 gap-1 rounded-xl border border-line bg-panel p-2 shadow-lg shadow-ink/50">
              {ENVELOPE_EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    if (e !== env.emoji) onSaveEmoji(e);
                    setShowEmojiPicker(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-body-lg transition-colors ${
                    env.emoji === e
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

        {/* Name */}
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              ref={nameRef}
              type="text"
              value={nameValue}
              maxLength={100}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameValue(env.name);
                  setEditingName(false);
                }
              }}
              className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-sm text-text outline-none focus:border-brass"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-left text-sm text-text hover:text-brass transition-colors"
              title="Kliknij, aby edytować nazwę"
            >
              {env.name}
            </button>
          )}
        </div>

        {/* Monthly plan */}
        <div className="w-[100px] shrink-0 text-right">
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
                  setPlanValue(formatAmount(env.monthlyPlan));
                  setEditingPlan(false);
                }
              }}
              className="w-full rounded border border-line bg-panel-2 px-2 py-0.5 text-right font-mono text-micro tabular-nums text-text outline-none focus:border-brass"
            />
          ) : (
            <button
              onClick={() => setEditingPlan(true)}
              className="font-mono text-micro tabular-nums text-muted hover:text-brass transition-colors"
              title="Kliknij, aby edytować kwotę"
            >
              {formatAmount(env.monthlyPlan)} zł
            </button>
          )}
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-micro text-bad">Usunąć?</span>
            <button
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              className="rounded-md bg-bad/15 px-2 py-0.5 text-micro font-medium text-bad hover:bg-bad/25 transition-colors"
            >
              Tak
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2 py-0.5 text-micro text-muted hover:text-text transition-colors"
            >
              Nie
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onArchive}
              className="rounded-md px-2 py-0.5 text-micro text-muted hover:text-text transition-colors"
              title="Archiwizuj"
            >
              Archiwizuj
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted/50 hover:bg-bad/10 hover:text-bad transition-colors"
              title="Usuń"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 3.5H11.5M5.5 6V10M8.5 6V10M3.5 3.5L4 11.5C4 12.05 4.45 12.5 5 12.5H9C9.55 12.5 10 12.05 10 11.5L10.5 3.5M5 3.5V2C5 1.45 5.45 1 6 1H8C8.55 1 9 1.45 9 2V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { useBudgetStore } from "@/stores/budget-store";
import { formatAmount } from "@/domain/money";
import {
  calculateFreeFunds,
  calculateImpulseTotal,
  calculateAllEnvelopeBalances,
} from "@/domain/calculations";

export default function PrintPeriodPage() {
  const params = useParams();
  const periodId = params.periodId as string;
  const { user } = useAuth();
  const budgetId = user?.uid ?? null;
  useBudgetData(budgetId);

  const periods = useBudgetStore((s) => s.periods);
  const fixedExpenseDefs = useBudgetStore((s) => s.fixedExpenseDefs);
  const allFixedExpenseInstances = useBudgetStore((s) => s.allFixedExpenseInstances);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const allTransactions = useBudgetStore((s) => s.allTransactions);
  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);

  const [ready, setReady] = useState(false);

  const period = periods.find((p) => p.id === periodId);
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.periodId === periodId),
    [allTransactions, periodId]
  );
  const instances = useMemo(
    () => allFixedExpenseInstances.filter((i) => i.periodId === periodId),
    [allFixedExpenseInstances, periodId]
  );

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  const paidFixed = instances
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + (i.actual > 0 ? i.actual : i.planned), 0);

  const totalFixedPlanned = instances.reduce((s, i) => s + i.planned, 0);

  const envelopeExpenses = transactions
    .filter((t) => t.kind === "envelopeExpense")
    .reduce((s, t) => s + t.amount, 0);

  const totalAllocated = transactions
    .filter((t) => t.kind === "allocation")
    .reduce((s, t) => s + t.amount, 0);

  const impulseTotal = calculateImpulseTotal(transactions);
  const freeFunds = calculateFreeFunds(transactions, instances);

  const activeEnvelopes = envelopes.filter((e) => !e.archived);
  const envelopeBalances = calculateAllEnvelopeBalances(
    activeEnvelopes.map((e) => e.id),
    allTransactions
  );

  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));

  useEffect(() => {
    if (isDataLoaded && period) {
      setReady(true);
    }
  }, [isDataLoaded, period]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Ładowanie danych...</p>
      </div>
    );
  }

  if (!period) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Nie znaleziono okresu.</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: #1a1a1a !important;
            font-family: "Inter Tight", system-ui, sans-serif;
            font-size: 11pt;
            margin: 0;
            padding: 20mm;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            background: white !important;
            color: #1a1a1a !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        @media screen {
          .print-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            color: #1a1a1a;
            min-height: 100vh;
            font-family: "Inter Tight", system-ui, sans-serif;
          }
        }
      `}</style>

      <div className="print-page">
        {/* Print button - hidden on print */}
        <div className="no-print mb-8 flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white"
          >
            🖨 Drukuj
          </button>
          <button
            onClick={() => window.close()}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-600"
          >
            Zamknij
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-900 pb-4">
          <h1 className="text-2xl font-bold">{period.label}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {period.startDate}
            {period.endDate ? ` - ${period.endDate}` : " - w trakcie"}
          </p>
        </div>

        {/* Income */}
        <section className="mb-6">
          <h2 className="mb-3 border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            Przychody
          </h2>
          <p className="text-xl font-bold tabular-nums">
            {formatAmount(totalIncome)} zł
          </p>
        </section>

        {/* Fixed expenses */}
        <section className="mb-6">
          <h2 className="mb-3 border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            Wydatki stałe
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="pb-1 font-medium">Nazwa</th>
                <th className="pb-1 text-right font-medium">Plan</th>
                <th className="pb-1 text-right font-medium">Rzeczywista</th>
                <th className="pb-1 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const def = defMap.get(inst.defId);
                return (
                  <tr key={inst.id} className="border-b border-gray-100">
                    <td className="py-1.5">{def?.name ?? "-"}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-500">
                      {formatAmount(inst.planned)} zł
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {inst.isPaid
                        ? `${formatAmount(inst.actual > 0 ? inst.actual : inst.planned)} zł`
                        : "-"}
                    </td>
                    <td className="py-1.5 text-center">
                      {inst.isPaid ? "✓" : "○"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-300 font-medium">
                <td className="pt-2">Razem</td>
                <td className="pt-2 text-right tabular-nums text-gray-500">
                  {formatAmount(totalFixedPlanned)} zł
                </td>
                <td className="pt-2 text-right tabular-nums">
                  {formatAmount(paidFixed)} zł
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Envelopes */}
        <section className="mb-6">
          <h2 className="mb-3 border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            Koperty
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="pb-1 font-medium">Koperta</th>
                <th className="pb-1 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {activeEnvelopes.map((env) => {
                const bal = envelopeBalances.get(env.id) ?? 0;
                return (
                  <tr key={env.id} className="border-b border-gray-100">
                    <td className="py-1.5">
                      {env.emoji} {env.name}
                    </td>
                    <td
                      className={`py-1.5 text-right tabular-nums ${
                        bal < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {bal < 0 ? "−" : ""}
                      {formatAmount(Math.abs(bal))} zł
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Summary */}
        <section className="mb-6 rounded-lg border-2 border-gray-900 p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
            Podsumowanie
          </h2>
          <div className="space-y-2 text-sm">
            <SummaryLine label="Przychody" value={totalIncome} />
            <SummaryLine label="Wydatki stałe (zapłacone)" value={paidFixed} />
            <SummaryLine label="Wydatki z kopert" value={envelopeExpenses} />
            <SummaryLine label="Odłożone na koperty" value={totalAllocated} />
            {impulseTotal > 0 && (
              <SummaryLine label="⚡ Impulsy" value={impulseTotal} color="text-red-600" />
            )}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between text-base font-bold">
                <span>Wolne środki</span>
                <span className={`tabular-nums ${freeFunds < 0 ? "text-red-600" : ""}`}>
                  {freeFunds < 0 ? "−" : ""}
                  {formatAmount(Math.abs(freeFunds))} zł
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
          Wygenerowano {new Date().toLocaleDateString("pl-PL")} · Budżet PWA
        </div>
      </div>
    </>
  );
}

function SummaryLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`tabular-nums ${color ?? ""}`}>
        {formatAmount(value)} zł
      </span>
    </div>
  );
}

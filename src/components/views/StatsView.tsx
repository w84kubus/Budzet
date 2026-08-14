"use client";

import { useState } from "react";
import { PeriodTab } from "@/components/stats/PeriodTab";
import { TrendsTab } from "@/components/stats/TrendsTab";
import { CategoriesTab } from "@/components/stats/CategoriesTab";
import { Tabs } from "@/components/ui";
import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  UserSettings,
} from "@/domain/types";

type Props = {
  activePeriod: Period | null;
  settings: UserSettings | null;
  periods: Period[];
  transactions: Transaction[];
  allTransactions: Transaction[];
  allFixedExpenseInstances: FixedExpenseInstance[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  today: string;
};

const STATS_TABS = [
  { key: "period" as const, label: "Okres" },
  { key: "trends" as const, label: "Trendy" },
  { key: "categories" as const, label: "Kategorie" },
];

export function StatsView({
  activePeriod,
  settings,
  periods,
  transactions,
  allTransactions,
  allFixedExpenseInstances,
  fixedExpenseDefs,
  fixedExpenseInstances,
  envelopes,
  today,
}: Props) {
  const [statsTab, setStatsTab] = useState<"period" | "trends" | "categories">("period");

  if (!activePeriod || !settings) {
    return (
      <div className="mx-auto max-w-[960px] px-4 md:px-8">
        <div className="safe-top pt-2 pb-4">
          <h1 className="font-display text-title font-semibold text-text">
            Statystyki
          </h1>
        </div>
        <div className="rounded-xl bg-panel p-6 text-center">
          <p className="text-sm text-muted">
            Rozpocznij pierwszy okres, aby zobaczyć statystyki.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 md:px-8">
      <div className="safe-top pt-2 pb-2">
        <h1 className="font-display text-title font-semibold text-text">
          Statystyki
        </h1>
      </div>

      <Tabs
        tabs={STATS_TABS}
        active={statsTab}
        onChange={setStatsTab}
        className="mb-4"
      />

      <div className="pb-24 md:pb-4">
        {statsTab === "period" && (
          <PeriodTab
            period={activePeriod}
            transactions={transactions}
            fixedExpenseDefs={fixedExpenseDefs}
            fixedExpenseInstances={fixedExpenseInstances}
            envelopes={envelopes}
            today={today}
          />
        )}
        {statsTab === "trends" && (
          <TrendsTab
            periods={periods}
            allTransactions={allTransactions}
            allInstances={allFixedExpenseInstances}
          />
        )}
        {statsTab === "categories" && (
          <CategoriesTab
            periods={periods}
            allTransactions={allTransactions}
            allInstances={allFixedExpenseInstances}
            fixedExpenseDefs={fixedExpenseDefs}
            envelopes={envelopes}
            currentPeriodId={activePeriod.id}
          />
        )}
      </div>
    </div>
  );
}

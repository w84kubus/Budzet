"use client";

import { formatAmount } from "@/domain/money";
import {
  calculateFreeFunds,
  calculateDailyAllowance,
  calculateDaysUntilPayday,
} from "@/domain/calculations";
import type { Transaction, FixedExpenseInstance, Period } from "@/domain/types";

type Props = {
  period: Period;
  transactions: Transaction[];
  fixedExpenseInstances: FixedExpenseInstance[];
  paydayDay: number;
  today: string;
};

export function MainIndicator({
  period,
  transactions,
  fixedExpenseInstances,
  paydayDay,
  today,
}: Props) {
  const freeFunds = calculateFreeFunds(transactions, fixedExpenseInstances);
  const daysLeft = calculateDaysUntilPayday(
    today,
    period.startDate,
    paydayDay,
    period.endDate
  );
  const daily = calculateDailyAllowance(freeFunds, daysLeft);

  // Burn rate
  const start = new Date(period.startDate).getTime();
  const todayMs = new Date(today).getTime();
  const nextPayday = new Date(period.startDate);
  nextPayday.setMonth(nextPayday.getMonth() + 1);
  nextPayday.setDate(paydayDay);
  const end = nextPayday.getTime();

  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const elapsed = Math.max(0, (todayMs - start) / (1000 * 60 * 60 * 24));
  const timePct = Math.min(100, (elapsed / totalDays) * 100);

  const income = period.expectedIncome;
  const spent = income > 0 ? Math.max(0, income - freeFunds) : 0;
  const burnPct = income > 0 ? Math.min(100, (spent / income) * 100) : 0;

  const isOverspending = burnPct > timePct + 5;
  const isNegative = freeFunds < 0;

  return (
    <section className="overflow-hidden rounded-2xl bg-panel">
      {/* Main amount */}
      <div className="relative px-5 pb-5 pt-6">
        {/* Subtle gradient glow */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-brass/8 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-brass/5 blur-3xl" />

        <div className="relative">
          <div className="mb-1 text-center">
            <span className="text-caption font-medium uppercase tracking-wider text-muted">
              Wolne środki
            </span>
          </div>
          <div className="mb-3 text-center">
            <span
              className={`font-display text-hero font-semibold leading-none tracking-[-0.02em] tabular-nums md:text-[4.5rem] ${
                isNegative ? "text-bad" : "text-text"
              } amount-enter`}
              style={{ fontOpticalSizing: "auto" }}
            >
              {isNegative ? "−" : ""}
              {formatAmount(Math.abs(freeFunds))}
            </span>
            <span
              className={`ml-2 font-display text-title font-medium md:text-[1.75rem] ${
                isNegative ? "text-bad/60" : "text-muted"
              }`}
            >
              zł
            </span>
          </div>

          {daysLeft > 0 && (
            <p className="mb-5 text-center text-body text-muted">
              Możesz wydawać ok.{" "}
              <span className="font-mono text-body font-medium text-text tabular-nums">
                {formatAmount(Math.max(0, daily))} zł
              </span>{" "}
              dziennie
            </p>
          )}

          {/* Progress bar */}
          <div className="relative mt-1">
            <div className="h-1 w-full rounded-full bg-panel-2">
              <div
                className="absolute top-0 left-0 h-1 rounded-full bg-line"
                style={{ width: `${timePct}%` }}
              />
              <div
                className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-500 ${
                  isOverspending ? "bg-bad/80" : "bg-brass/50"
                }`}
                style={{ width: `${burnPct}%` }}
              />
            </div>
            <div
              className="absolute -top-[2px] h-[8px] w-[2px] rounded-full bg-text/40"
              style={{ left: `${timePct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-micro text-muted/50">
            <span>początek okresu</span>
            <span>wypłata</span>
          </div>
        </div>
      </div>

      {/* Income / Expenses overview row */}
      <div className="grid grid-cols-2 border-t border-line">
        <div className="border-r border-line px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-good" />
            <span className="text-micro text-muted">Przychód</span>
          </div>
          <span className="font-mono text-sm font-medium tabular-nums text-text">
            {formatAmount(income)} zł
          </span>
        </div>
        <div className="px-5 py-4">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-bad" />
            <span className="text-micro text-muted">Wydano</span>
          </div>
          <span className="font-mono text-sm font-medium tabular-nums text-text">
            {formatAmount(spent)} zł
          </span>
        </div>
      </div>
    </section>
  );
}

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

  // Burn rate: how much of the budget is spent vs how much time has passed
  const start = new Date(period.startDate).getTime();
  const todayMs = new Date(today).getTime();
  const nextPayday = new Date(period.startDate);
  nextPayday.setMonth(nextPayday.getMonth() + 1);
  nextPayday.setDate(paydayDay);
  const end = nextPayday.getTime();

  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const elapsed = Math.max(0, (todayMs - start) / (1000 * 60 * 60 * 24));
  const timePct = Math.min(100, (elapsed / totalDays) * 100);

  // Budget burn: income spent
  const income = period.expectedIncome;
  const spent = income > 0 ? Math.max(0, income - freeFunds) : 0;
  const burnPct = income > 0 ? Math.min(100, (spent / income) * 100) : 0;

  const isOverspending = burnPct > timePct + 5;
  const isNegative = freeFunds < 0;

  return (
    <section className="rounded-2xl bg-panel px-5 pb-5 pt-6">
      {/* Free funds — THE number */}
      <div className="mb-1 text-center">
        <span className="text-caption font-medium uppercase tracking-wider text-muted">
          Zostało
        </span>
      </div>
      <div className="mb-3 text-center">
        <span
          className={`font-display text-hero font-semibold leading-none tracking-[-0.02em] tabular-nums ${
            isNegative ? "text-bad" : "text-brass"
          } amount-enter`}
          style={{ fontOpticalSizing: "auto" }}
        >
          {isNegative ? "−" : ""}
          {formatAmount(Math.abs(freeFunds))}
        </span>
        <span
          className={`ml-2 font-display text-title font-medium ${
            isNegative ? "text-bad/60" : "text-brass/60"
          }`}
        >
          zł
        </span>
      </div>

      {/* Daily allowance */}
      {daysLeft > 0 && (
        <p className="mb-5 text-center text-body text-muted">
          Możesz wydawać ok.{" "}
          <span className="font-mono text-body font-medium text-text tabular-nums">
            {formatAmount(Math.max(0, daily))} zł
          </span>{" "}
          dziennie
        </p>
      )}

      {/* Burn rate bar */}
      <div className="relative mt-1">
        <div className="h-[3px] w-full rounded-full bg-panel-2">
          {/* Time progress — thin line */}
          <div
            className="absolute top-0 left-0 h-[3px] rounded-full bg-line"
            style={{ width: `${timePct}%` }}
          />
          {/* Budget burn — overlay */}
          <div
            className={`absolute top-0 left-0 h-[3px] rounded-full transition-all duration-500 ${
              isOverspending ? "bg-bad/80" : "bg-muted/40"
            }`}
            style={{ width: `${burnPct}%` }}
          />
        </div>
        {/* Time marker */}
        <div
          className="absolute -top-[3px] h-[9px] w-[1px] bg-text/30"
          style={{ left: `${timePct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-micro text-muted/60">
        <span>początek okresu</span>
        <span>wypłata</span>
      </div>
    </section>
  );
}

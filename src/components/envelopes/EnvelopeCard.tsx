"use client";

import { formatAmount } from "@/domain/money";
import {
  calculateEnvelopeBalance,
  calculateEnvelopeDailyLimit,
  calculateDaysUntilPayday,
} from "@/domain/calculations";
import type { Envelope, Transaction, Period } from "@/domain/types";

type Props = {
  envelope: Envelope;
  allTransactions: Transaction[];
  periodTransactions: Transaction[];
  period: Period;
  paydayDay: number;
  today: string;
  onExpand: (envelope: Envelope) => void;
  onCoverOverdraft?: (envelope: Envelope, overdraftAmount: number) => void;
};

// Consumable envelopes show daily limit
const CONSUMABLE_IDS_SUBSTRINGS = ["rozrywka", "glupoty", "impulsy", "jedzenie"];
function isConsumable(name: string): boolean {
  const lower = name.toLowerCase();
  return CONSUMABLE_IDS_SUBSTRINGS.some((s) => lower.includes(s));
}

export function EnvelopeCard({
  envelope,
  allTransactions,
  periodTransactions,
  period,
  paydayDay,
  today,
  onExpand,
  onCoverOverdraft,
}: Props) {
  const balance = calculateEnvelopeBalance(envelope.id, allTransactions);
  const isOverdraft = balance < 0;

  // Period stats
  let periodAllocated = 0;
  let periodSpent = 0;
  for (const tx of periodTransactions) {
    if (tx.kind === "allocation" && tx.envelopeId === envelope.id) {
      periodAllocated += tx.amount;
    }
    if (tx.kind === "envelopeExpense" && tx.envelopeId === envelope.id) {
      periodSpent += tx.amount;
    }
  }

  // Target / progress
  const target = envelope.targetAmount;
  const fillPct = target && target > 0
    ? Math.min(100, Math.max(0, (balance / target) * 100))
    : null;

  // Projection
  let projection: string | null = null;
  if (target && target > 0 && envelope.monthlyPlan > 0 && balance < target) {
    const remaining = target - balance;
    const monthsLeft = Math.ceil(remaining / envelope.monthlyPlan);
    if (monthsLeft > 0 && monthsLeft <= 120) {
      const projDate = new Date(today);
      projDate.setMonth(projDate.getMonth() + monthsLeft);
      const monthNames = [
        "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu",
        "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu",
      ];
      projection = `Przy ${formatAmount(envelope.monthlyPlan)} zł/mies. cel w ${monthNames[projDate.getMonth()]} ${projDate.getFullYear()}`;
    }
  }

  // Daily limit (consumable only)
  const daysLeft = calculateDaysUntilPayday(
    today,
    period.startDate,
    paydayDay,
    period.endDate
  );
  const showDailyLimit = isConsumable(envelope.name) && daysLeft > 0 && balance > 0;
  const dailyLimit = showDailyLimit
    ? calculateEnvelopeDailyLimit(balance, daysLeft)
    : 0;

  return (
    <div
      onClick={() => onExpand(envelope)}
      className="cursor-pointer rounded-xl bg-panel transition-colors hover:bg-panel-2"
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-title leading-none">{envelope.emoji}</span>
            <div>
              <h3 className="text-body font-medium text-text">
                {envelope.name}
              </h3>
              {showDailyLimit && (
                <p className="mt-0.5 text-micro text-muted">
                  ok. {formatAmount(dailyLimit)} zł / dzień
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`font-mono text-body-lg font-semibold tabular-nums ${
                isOverdraft ? "text-bad" : "text-text"
              }`}
            >
              {isOverdraft ? "−" : ""}
              {formatAmount(Math.abs(balance))}
            </span>
            <span
              className={`ml-1 text-caption ${
                isOverdraft ? "text-bad/60" : "text-muted"
              }`}
            >
              zł
            </span>
          </div>
        </div>

        {/* Progress bar (target) */}
        {fillPct !== null && target && (
          <div className="mb-2">
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverdraft ? "bg-bad/60" : "bg-good/40"
                }`}
                style={{ width: `${Math.max(0, fillPct)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-micro text-muted">
              <span>{formatAmount(Math.max(0, balance))} zł</span>
              <span>{formatAmount(target)} zł</span>
            </div>
          </div>
        )}

        {/* Projection */}
        {projection && (
          <p className="mb-2 text-micro text-muted/70">{projection}</p>
        )}

        {/* Period stats */}
        <div className="flex gap-4 text-micro">
          {periodAllocated > 0 && (
            <span className="text-good/70">
              +{formatAmount(periodAllocated)} zł wpłacono
            </span>
          )}
          {periodSpent > 0 && (
            <span className="text-muted">
              −{formatAmount(periodSpent)} zł wydano
            </span>
          )}
          {periodAllocated === 0 && periodSpent === 0 && (
            <span className="text-muted/50">Brak ruchów w tym okresie</span>
          )}
        </div>

        {/* Overdraft warning */}
        {isOverdraft && (
          <div className="mt-3 rounded-lg border border-bad/20 bg-bad/8 px-3 py-2">
            <p className="text-caption font-medium text-bad">
              Przekroczone o {formatAmount(Math.abs(balance))} zł
            </p>
            {onCoverOverdraft && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCoverOverdraft(envelope, Math.abs(balance));
                }}
                className="mt-1.5 text-micro font-medium text-bad underline decoration-bad/30 underline-offset-2"
              >
                Pokryj z innej koperty
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

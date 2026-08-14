"use client";

import { formatAmount } from "@/domain/money";
import {
  calculateAllEnvelopeBalances,
  calculateAccountBalances,
} from "@/domain/calculations";
import { EnvelopeCard } from "@/components/envelopes/EnvelopeCard";
import { Button } from "@/components/ui";
import type {
  Period,
  Transaction,
  Envelope,
  FixedExpenseDef,
  UserSettings,
} from "@/domain/types";

type Props = {
  activePeriod: Period | null;
  settings: UserSettings | null;
  transactions: Transaction[];
  allTransactions: Transaction[];
  envelopes: Envelope[];
  fixedExpenseDefs: FixedExpenseDef[];
  freeFunds: number;
  today: string;
  onAddEnvelope: () => void;
  onDistribute: () => void;
  onWithdrawal: () => void;
  onClosePeriod: () => void;
  onExpandEnvelope: (envelope: Envelope) => void;
  onCoverOverdraft: (envelope: Envelope, overdraftAmount: number) => void;
};

export function EnvelopesView({
  activePeriod,
  settings,
  transactions,
  allTransactions,
  envelopes,
  freeFunds,
  today,
  onAddEnvelope,
  onDistribute,
  onWithdrawal,
  onClosePeriod,
  onExpandEnvelope,
  onCoverOverdraft,
}: Props) {
  if (!activePeriod || !settings) return null;

  const active = envelopes.filter((e) => !e.archived);
  const balances = calculateAllEnvelopeBalances(
    active.map((e) => e.id),
    allTransactions
  );
  const totalSavings = [...balances.values()].reduce((s, b) => s + b, 0);

  const acctBalances = calculateAccountBalances(
    allTransactions,
    active.map((e) => e.id)
  );

  // Sort: overdrafted first, then by order
  const sorted = [...active].sort((a, b) => {
    const balA = balances.get(a.id) ?? 0;
    const balB = balances.get(b.id) ?? 0;
    if (balA < 0 && balB >= 0) return -1;
    if (balA >= 0 && balB < 0) return 1;
    return a.order - b.order;
  });

  return (
    <div className="mx-auto max-w-[960px] px-4 md:px-8">
      <div className="safe-top pt-2 pb-4">
        <h1 className="font-display text-title font-semibold text-text">
          Koperty
        </h1>
      </div>

      {/* Total savings */}
      <div className="mb-4 rounded-xl bg-panel p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-caption text-muted">Suma kopert</span>
          <span className="font-mono text-title font-semibold tabular-nums text-text">
            {formatAmount(totalSavings)}{" "}
            <span className="text-sm text-muted">zł</span>
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between text-micro">
          <span className="text-muted">
            Na koncie oszczędnościowym powinno być:
          </span>
          <span className="font-mono tabular-nums text-muted">
            {formatAmount(acctBalances.expectedSavings)} zł
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={onDistribute}
          disabled={freeFunds <= 0}
          size="sm"
          fullWidth
        >
          Rozdysponuj
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={onWithdrawal}>
          Wyjmij z koperty
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={onClosePeriod}>
          Mam wypłatę
        </Button>
      </div>

      {/* Envelope cards */}
      <div className="space-y-3 pb-24 md:pb-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl bg-panel p-6 text-center">
            <p className="text-sm text-muted">Brak kopert.</p>
            <button
              onClick={onAddEnvelope}
              className="mt-2 text-caption font-medium text-brass"
            >
              Dodaj pierwszą
            </button>
          </div>
        ) : (
          sorted.map((env) => (
            <EnvelopeCard
              key={env.id}
              envelope={env}
              allTransactions={allTransactions}
              periodTransactions={transactions}
              period={activePeriod}
              paydayDay={settings.paydayDay}
              today={today}
              onExpand={onExpandEnvelope}
              onCoverOverdraft={onCoverOverdraft}
            />
          ))
        )}
      </div>
    </div>
  );
}

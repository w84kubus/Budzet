import type { Transaction, FixedExpenseInstance } from "./types";

// ─── Envelope balance ────────────────────────────────────────────────────────

/**
 * saldoKoperty(e) =
 *     Σ allocation(→e)
 *   + Σ envelopeTransfer(→e)
 *   − Σ envelopeTransfer(e→)
 *   − Σ envelopeExpense(e)          // regardless of paidFrom
 *   − Σ withdrawal(e→)
 *   ± Σ adjustment(e)
 */
export function calculateEnvelopeBalance(
  envelopeId: string,
  transactions: readonly Transaction[]
): number {
  let balance = 0;

  for (const tx of transactions) {
    switch (tx.kind) {
      case "allocation":
        if (tx.envelopeId === envelopeId) balance += tx.amount;
        break;
      case "envelopeTransfer":
        if (tx.targetEnvelopeId === envelopeId) balance += tx.amount;
        if (tx.envelopeId === envelopeId) balance -= tx.amount;
        break;
      case "envelopeExpense":
        if (tx.envelopeId === envelopeId) balance -= tx.amount;
        break;
      case "withdrawal":
        if (tx.envelopeId === envelopeId) balance -= tx.amount;
        break;
      case "adjustment":
        if (tx.envelopeId === envelopeId) {
          // adjustment amount is signed conceptually - but spec says amount is ALWAYS positive.
          // We need a way to distinguish positive/negative adjustments.
          // Convention: adjustment with envelopeId = increase, adjustment with targetEnvelopeId would be decrease.
          // Simpler: use note or separate. For now: adjustment to envelope = positive.
          // Per spec: ± adjustment(e). We use paidFrom as signal:
          //   paidFrom = 'main' → positive adjustment (adding to envelope)
          //   paidFrom = 'savings' → negative adjustment (removing from envelope)
          // This is a design decision. Default: positive.
          if (tx.paidFrom === "savings") {
            balance -= tx.amount;
          } else {
            balance += tx.amount;
          }
        }
        break;
    }
  }

  return balance;
}

// ─── All envelope balances at once ───────────────────────────────────────────

export function calculateAllEnvelopeBalances(
  envelopeIds: readonly string[],
  transactions: readonly Transaction[]
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const id of envelopeIds) {
    balances.set(id, 0);
  }

  for (const tx of transactions) {
    switch (tx.kind) {
      case "allocation":
        if (tx.envelopeId && balances.has(tx.envelopeId)) {
          balances.set(tx.envelopeId, balances.get(tx.envelopeId)! + tx.amount);
        }
        break;
      case "envelopeTransfer":
        if (tx.envelopeId && balances.has(tx.envelopeId)) {
          balances.set(tx.envelopeId, balances.get(tx.envelopeId)! - tx.amount);
        }
        if (tx.targetEnvelopeId && balances.has(tx.targetEnvelopeId)) {
          balances.set(
            tx.targetEnvelopeId,
            balances.get(tx.targetEnvelopeId)! + tx.amount
          );
        }
        break;
      case "envelopeExpense":
        if (tx.envelopeId && balances.has(tx.envelopeId)) {
          balances.set(tx.envelopeId, balances.get(tx.envelopeId)! - tx.amount);
        }
        break;
      case "withdrawal":
        if (tx.envelopeId && balances.has(tx.envelopeId)) {
          balances.set(tx.envelopeId, balances.get(tx.envelopeId)! - tx.amount);
        }
        break;
      case "adjustment":
        if (tx.envelopeId && balances.has(tx.envelopeId)) {
          if (tx.paidFrom === "savings") {
            balances.set(
              tx.envelopeId,
              balances.get(tx.envelopeId)! - tx.amount
            );
          } else {
            balances.set(
              tx.envelopeId,
              balances.get(tx.envelopeId)! + tx.amount
            );
          }
        }
        break;
    }
  }

  return balances;
}

// ─── Account balances ────────────────────────────────────────────────────────

export type AccountBalances = {
  expectedMain: number;
  expectedSavings: number;
  totalEnvelopes: number;
  settlementAmount: number; // doWyrownania
};

/**
 * oczekiwaneSaldoGłównego =
 *     Σ income
 *   − Σ fixedExpense
 *   − Σ allocation
 *   + Σ withdrawal
 *   − Σ envelopeExpense(paidFrom='main')
 *
 * oczekiwaneSaldoOszczędnościowego =
 *     Σ allocation
 *   − Σ withdrawal
 *   − Σ envelopeExpense(paidFrom='savings')
 *
 * sumaOszczędności = Σ saldoKoperty
 * doWyrównania = oczekiwaneSaldoOszczędnościowego − sumaOszczędności
 */
export function calculateAccountBalances(
  transactions: readonly Transaction[],
  envelopeIds: readonly string[]
): AccountBalances {
  let expectedMain = 0;
  let expectedSavings = 0;

  for (const tx of transactions) {
    switch (tx.kind) {
      case "income":
        expectedMain += tx.amount;
        break;
      case "fixedExpense":
        expectedMain -= tx.amount;
        break;
      case "allocation":
        expectedMain -= tx.amount;
        expectedSavings += tx.amount;
        break;
      case "withdrawal":
        expectedMain += tx.amount;
        expectedSavings -= tx.amount;
        break;
      case "envelopeExpense": {
        const from = tx.paidFrom ?? "savings";
        if (from === "main") {
          expectedMain -= tx.amount;
        } else {
          expectedSavings -= tx.amount;
        }
        break;
      }
    }
  }

  const envelopeBalances = calculateAllEnvelopeBalances(
    envelopeIds,
    transactions
  );
  let totalEnvelopes = 0;
  for (const bal of envelopeBalances.values()) {
    totalEnvelopes += bal;
  }

  const settlementAmount = expectedSavings - totalEnvelopes;

  return { expectedMain, expectedSavings, totalEnvelopes, settlementAmount };
}

// ─── Free funds ──────────────────────────────────────────────────────────────

/**
 * wolneŚrodki =
 *     Σ income(okres)
 *   − Σ fixedExpense transakcje(okres)
 *   − Σ planowane niezapłacone wydatki stałe(okres)
 *   − Σ planowane zapłacone bez transakcji (legacy data)
 *   − Σ envelopeExpense(paidFrom='main', okres)
 *   − Σ allocation(okres)
 */
export function calculateFreeFunds(
  periodTransactions: readonly Transaction[],
  fixedExpenseInstances: readonly FixedExpenseInstance[]
): number {
  let funds = 0;

  // Collect which defIds have a fixedExpense transaction
  const defsWithTransaction = new Set<string>();

  for (const tx of periodTransactions) {
    switch (tx.kind) {
      case "income":
        funds += tx.amount;
        break;
      case "fixedExpense":
        funds -= tx.amount;
        if (tx.fixedExpenseDefId) {
          defsWithTransaction.add(tx.fixedExpenseDefId);
        }
        break;
      case "envelopeExpense":
        if ((tx.paidFrom ?? "savings") === "main") {
          funds -= tx.amount;
        }
        break;
      case "allocation":
        funds -= tx.amount;
        break;
    }
  }

  // Subtract planned amounts for fixed expenses NOT already covered by a transaction
  const seenDefs = new Set<string>();
  for (const instance of fixedExpenseInstances) {
    if (seenDefs.has(instance.defId)) continue;
    seenDefs.add(instance.defId);

    // Skip if this def already has a fixedExpense transaction (already subtracted above)
    if (defsWithTransaction.has(instance.defId)) continue;

    // No transaction exists → subtract planned amount (whether paid or not)
    funds -= instance.planned;
  }

  return funds;
}

// ─── Daily allowance ─────────────────────────────────────────────────────────

/**
 * dniDoWypłaty = max(1, dni od dziś do przewidywanej następnej wypłaty)
 * dziennyLimit = wolneŚrodki / dniDoWypłaty
 */
export function calculateDaysUntilPayday(
  today: string,
  periodStartDate: string,
  paydayDay: number,
  periodEndDate: string | null
): number {
  // If period is closed, return 0 (no daily limit applicable)
  if (periodEndDate !== null) return 0;

  const todayDate = new Date(today);
  const startDate = new Date(periodStartDate);

  // Expected next payday: start month + 1, on paydayDay
  const nextPayday = new Date(startDate);
  nextPayday.setMonth(nextPayday.getMonth() + 1);
  nextPayday.setDate(paydayDay);

  const diffMs = nextPayday.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

export function calculateDailyAllowance(
  freeFunds: number,
  daysUntilPayday: number
): number {
  if (daysUntilPayday <= 0) return 0;
  // Integer division - truncate, don't round up
  return Math.floor(freeFunds / daysUntilPayday);
}

// ─── Envelope daily limit ────────────────────────────────────────────────────

export function calculateEnvelopeDailyLimit(
  envelopeBalance: number,
  daysUntilPayday: number
): number {
  if (daysUntilPayday <= 0) return 0;
  return Math.floor(envelopeBalance / daysUntilPayday);
}

// ─── Impulse total ───────────────────────────────────────────────────────────

export function calculateImpulseTotal(
  periodTransactions: readonly Transaction[]
): number {
  let total = 0;
  for (const tx of periodTransactions) {
    if (tx.isImpulse) {
      total += tx.amount;
    }
  }
  return total;
}

// ─── Period allocation breakdown ─────────────────────────────────────────────

export function calculateAllocationBreakdown(
  periodTransactions: readonly Transaction[]
): Map<string, number> {
  const breakdown = new Map<string, number>();
  for (const tx of periodTransactions) {
    if (tx.kind === "allocation" && tx.envelopeId) {
      breakdown.set(
        tx.envelopeId,
        (breakdown.get(tx.envelopeId) ?? 0) + tx.amount
      );
    }
  }
  return breakdown;
}

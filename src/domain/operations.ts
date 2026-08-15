import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  TransferTask,
  TransferBreakdownItem,
} from "./types";

// ─── Close period & open new ─────────────────────────────────────────────────

export type ClosePeriodInput = {
  currentPeriod: Period;
  newStartDate: string; // ISO date
  newExpectedIncome: number; // grosze
  fixedExpenseDefs: readonly FixedExpenseDef[];
};

export type ClosePeriodResult = {
  closedPeriod: Period;
  newPeriod: Period;
  newInstances: FixedExpenseInstance[];
};

export function closePeriod(input: ClosePeriodInput): ClosePeriodResult {
  const { currentPeriod, newStartDate, newExpectedIncome, fixedExpenseDefs } =
    input;

  if (currentPeriod.status !== "open") {
    throw new Error("Nie można zamknąć okresu, który nie jest otwarty.");
  }

  const closedPeriod: Period = {
    ...currentPeriod,
    endDate: newStartDate,
    status: "closed",
  };

  const startDate = new Date(newStartDate);
  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];
  const year = startDate.getFullYear();
  const month = startDate.getMonth(); // 0-indexed
  const periodId = `${year}-${String(month + 1).padStart(2, "0")}`;
  const label = `${monthNames[month]} ${year}`;

  const newPeriod: Period = {
    id: periodId,
    label,
    startDate: newStartDate,
    endDate: null,
    expectedIncome: newExpectedIncome,
    status: "open",
  };

  // Create instances for non-archived defs that haven't expired
  const periodMonth = periodId; // "YYYY-MM"
  const newInstances: FixedExpenseInstance[] = fixedExpenseDefs
    .filter((def) => !def.archived)
    .filter((def) => !def.endDate || def.endDate >= periodMonth)
    .map((def) => ({
      id: `${periodId}_${def.id}`,
      periodId,
      defId: def.id,
      planned: def.defaultPlanned,
      actual: 0,
      isPaid: false,
      paidAt: null,
    }));

  return { closedPeriod, newPeriod, newInstances };
}

// ─── Create initial period ───────────────────────────────────────────────────

export function createInitialPeriod(
  startDate: string,
  expectedIncome: number
): Period {
  const date = new Date(startDate);
  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];
  const year = date.getFullYear();
  const month = date.getMonth();
  const periodId = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    id: periodId,
    label: `${monthNames[month]} ${year}`,
    startDate,
    endDate: null,
    expectedIncome,
    status: "open",
  };
}

// ─── Distribute funds ────────────────────────────────────────────────────────

export type DistributeFundsInput = {
  periodId: string;
  available: number; // grosze — wolne środki
  allocations: TransferBreakdownItem[]; // envelope → amount
  date: string; // ISO date
};

export type DistributeFundsResult = {
  transactions: Transaction[];
  transferTask: Omit<TransferTask, "id">;
};

export function distributeFunds(
  input: DistributeFundsInput
): DistributeFundsResult {
  const { periodId, available, allocations, date } = input;

  const nonZero = allocations.filter((a) => a.amount > 0);
  if (nonZero.length === 0) {
    throw new Error("Brak alokacji do rozdysponowania.");
  }

  const totalAllocated = nonZero.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > available) {
    throw new Error(
      `Suma alokacji (${totalAllocated}) przekracza dostępne środki (${available}).`
    );
  }

  const now = new Date().toISOString();

  const transactions: Transaction[] = nonZero.map((alloc, i) => ({
    id: `alloc_${periodId}_${i}`, // placeholder — real id from Firestore
    periodId,
    kind: "allocation" as const,
    amount: alloc.amount,
    date,
    envelopeId: alloc.envelopeId,
    isImpulse: false,
    createdAt: now,
  }));

  const transferTask: Omit<TransferTask, "id"> = {
    periodId,
    totalAmount: totalAllocated,
    breakdown: nonZero,
    createdAt: now,
    isDone: false,
    doneAt: null,
  };

  return { transactions, transferTask };
}

// ─── Proportional distribution ───────────────────────────────────────────────

/**
 * Distribute `available` grosze proportionally across envelopes by their monthlyPlan.
 * Returns integer amounts that sum exactly to min(available, totalPlan).
 * Uses largest-remainder method to avoid rounding errors.
 */
export function distributeProportionally(
  envelopes: readonly { id: string; monthlyPlan: number }[],
  available: number
): TransferBreakdownItem[] {
  const active = envelopes.filter((e) => e.monthlyPlan > 0);
  if (active.length === 0) return [];

  const totalPlan = active.reduce((s, e) => s + e.monthlyPlan, 0);
  const toDistribute = Math.min(available, totalPlan);

  if (toDistribute <= 0) return [];

  // Largest remainder method for integer distribution
  const rawShares = active.map((e) => ({
    id: e.id,
    raw: (e.monthlyPlan / totalPlan) * toDistribute,
  }));

  const floored = rawShares.map((s) => ({
    id: s.id,
    amount: Math.floor(s.raw),
    remainder: s.raw - Math.floor(s.raw),
  }));

  const distributed = floored.reduce((s, f) => s + f.amount, 0);
  let remaining = toDistribute - distributed;

  // Sort by remainder descending, give 1 grosz to each until remaining = 0
  const sorted = [...floored].sort((a, b) => b.remainder - a.remainder);
  for (const item of sorted) {
    if (remaining <= 0) break;
    item.amount += 1;
    remaining -= 1;
  }

  return floored
    .filter((f) => f.amount > 0)
    .map((f) => ({ envelopeId: f.id, amount: f.amount }));
}

// ─── Period label helper ─────────────────────────────────────────────────────

export function shouldShowPaydayReminder(
  periodStartDate: string,
  paydayDay: number,
  today: string
): boolean {
  const start = new Date(periodStartDate);
  const todayDate = new Date(today);

  // Expected next payday from start
  const expectedPayday = new Date(start);
  expectedPayday.setMonth(expectedPayday.getMonth() + 1);
  expectedPayday.setDate(paydayDay);

  // If today > expectedPayday + 5 days, show reminder
  const deadline = new Date(expectedPayday);
  deadline.setDate(deadline.getDate() + 5);

  return todayDate > deadline;
}

import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
} from "./types";
import { calculateImpulseTotal } from "./calculations";

// ─── Period Summary ─────────────────────────────────────────────────────────

export type PeriodSummary = {
  income: number;
  fixedExpensesTotal: number;
  fixedExpensesPlanned: number;
  envelopeExpensesTotal: number;
  allocated: number;
  impulseTotal: number;
  totalExpenses: number;
  savingsRate: number; // 0–100
  averageDailyExpense: number;
  daysWithoutExpense: number;
  totalDays: number;
};

export function calculatePeriodSummary(
  period: Period,
  transactions: Transaction[],
  fixedExpenseInstances: FixedExpenseInstance[],
  today: string
): PeriodSummary {
  const income = transactions
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  const fixedExpensesPlanned = fixedExpenseInstances.reduce(
    (s, i) => s + i.planned,
    0
  );
  const fixedExpensesTotal = fixedExpenseInstances
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + (i.actual > 0 ? i.actual : i.planned), 0);

  const envelopeExpensesTotal = transactions
    .filter((t) => t.kind === "envelopeExpense")
    .reduce((s, t) => s + t.amount, 0);

  const allocated = transactions
    .filter((t) => t.kind === "allocation")
    .reduce((s, t) => s + t.amount, 0);

  const impulseTotal = calculateImpulseTotal(transactions);

  const totalExpenses = fixedExpensesTotal + envelopeExpensesTotal;

  const savingsRate =
    income > 0 ? Math.round((allocated / income) * 100) : 0;

  // Days calculation
  const endDate = period.endDate ?? today;
  const start = new Date(period.startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
  );

  // Days with expenses
  const expenseDates = new Set(
    transactions
      .filter(
        (t) =>
          t.kind === "fixedExpense" ||
          t.kind === "envelopeExpense"
      )
      .map((t) => t.date)
  );
  const daysWithoutExpense = totalDays - expenseDates.size;

  const averageDailyExpense =
    totalDays > 0 ? Math.round(totalExpenses / totalDays) : 0;

  return {
    income,
    fixedExpensesTotal,
    fixedExpensesPlanned,
    envelopeExpensesTotal,
    allocated,
    impulseTotal,
    totalExpenses,
    savingsRate,
    averageDailyExpense,
    daysWithoutExpense,
    totalDays,
  };
}

// ─── Category Breakdown ─────────────────────────────────────────────────────

export type CategoryBreakdown = {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  percentage: number;
  type: "envelope" | "fixed";
};

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  fixedExpenseDefs: FixedExpenseDef[],
  fixedExpenseInstances: FixedExpenseInstance[],
  envelopes: Envelope[]
): CategoryBreakdown[] {
  const categories: CategoryBreakdown[] = [];

  // Envelope expenses
  const envelopeMap = new Map(envelopes.map((e) => [e.id, e]));
  const envelopeTotals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind === "envelopeExpense" && tx.envelopeId) {
      envelopeTotals.set(
        tx.envelopeId,
        (envelopeTotals.get(tx.envelopeId) ?? 0) + tx.amount
      );
    }
  }
  for (const [envId, total] of envelopeTotals) {
    const env = envelopeMap.get(envId);
    if (env) {
      categories.push({
        id: envId,
        name: env.name,
        emoji: env.emoji,
        amount: total,
        percentage: 0,
        type: "envelope",
      });
    }
  }

  // Fixed expenses
  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));
  for (const inst of fixedExpenseInstances) {
    if (!inst.isPaid) continue;
    const def = defMap.get(inst.defId);
    if (!def) continue;
    const amount = inst.actual > 0 ? inst.actual : inst.planned;
    if (amount <= 0) continue;
    categories.push({
      id: def.id,
      name: def.name,
      emoji: "📌",
      amount,
      percentage: 0,
      type: "fixed",
    });
  }

  // Calculate percentages
  const total = categories.reduce((s, c) => s + c.amount, 0);
  if (total > 0) {
    for (const cat of categories) {
      cat.percentage = Math.round((cat.amount / total) * 100);
    }
  }

  // Sort by amount desc
  categories.sort((a, b) => b.amount - a.amount);

  return categories;
}

// ─── Fixed Expense Plan vs Actual ───────────────────────────────────────────

export type FixedExpenseComparison = {
  id: string;
  name: string;
  planned: number;
  actual: number;
  percentage: number; // actual/planned * 100
};

export function calculateFixedExpenseComparison(
  fixedExpenseDefs: FixedExpenseDef[],
  fixedExpenseInstances: FixedExpenseInstance[]
): FixedExpenseComparison[] {
  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));
  return fixedExpenseInstances
    .map((inst) => {
      const def = defMap.get(inst.defId);
      const actual = inst.isPaid
        ? inst.actual > 0
          ? inst.actual
          : inst.planned
        : 0;
      return {
        id: inst.id,
        name: def?.name ?? "—",
        planned: inst.planned,
        actual,
        percentage: inst.planned > 0 ? Math.round((actual / inst.planned) * 100) : 0,
      };
    })
    .filter((c) => c.planned > 0)
    .sort((a, b) => b.planned - a.planned);
}

// ─── Trend Data (multi-period) ──────────────────────────────────────────────

export type TrendPoint = {
  periodId: string;
  label: string;
  totalSavings: number;
  totalExpenses: number;
  impulseExpenses: number;
  savingsRate: number;
};

export function calculateTrends(
  periods: Period[],
  allTransactions: Transaction[],
  allInstances: FixedExpenseInstance[]
): TrendPoint[] {
  // Sort periods chronologically
  const sorted = [...periods]
    .filter((p) => p.status === "closed" || p.status === "open")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  let cumulativeSavings = 0;

  return sorted.map((period) => {
    const txs = allTransactions.filter((t) => t.periodId === period.id);
    const instances = allInstances.filter((i) => i.periodId === period.id);

    const allocated = txs
      .filter((t) => t.kind === "allocation")
      .reduce((s, t) => s + t.amount, 0);

    const withdrawals = txs
      .filter((t) => t.kind === "withdrawal")
      .reduce((s, t) => s + t.amount, 0);

    cumulativeSavings += allocated - withdrawals;

    const fixedTotal = instances
      .filter((i) => i.isPaid)
      .reduce((s, i) => s + (i.actual > 0 ? i.actual : i.planned), 0);

    const envelopeExpenses = txs
      .filter((t) => t.kind === "envelopeExpense")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpenses = fixedTotal + envelopeExpenses;

    const impulseExpenses = calculateImpulseTotal(txs);

    const income = txs
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0);

    const savingsRate = income > 0 ? Math.round((allocated / income) * 100) : 0;

    // Short label: "Sie 26", "Wrz 26"
    const shortLabel =
      period.label.length > 6
        ? period.label.substring(0, 3) + " " + period.label.slice(-2)
        : period.label;

    return {
      periodId: period.id,
      label: shortLabel,
      totalSavings: cumulativeSavings,
      totalExpenses,
      impulseExpenses,
      savingsRate,
    };
  });
}

// ─── Category History (sparklines) ──────────────────────────────────────────

export type CategoryHistory = {
  id: string;
  name: string;
  emoji: string;
  currentAmount: number;
  previousAmount: number;
  changePercent: number | null; // null if no previous data
  sparkline: number[]; // last N periods amounts
};

export function calculateCategoryHistory(
  periods: Period[],
  allTransactions: Transaction[],
  allInstances: FixedExpenseInstance[],
  fixedExpenseDefs: FixedExpenseDef[],
  envelopes: Envelope[],
  currentPeriodId: string,
  maxPeriods: number = 6
): CategoryHistory[] {
  const sorted = [...periods]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(-maxPeriods);

  const currentIdx = sorted.findIndex((p) => p.id === currentPeriodId);
  const envelopeMap = new Map(envelopes.map((e) => [e.id, e]));
  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));

  // Build per-period per-category amounts
  const categoryAmounts = new Map<string, number[]>();
  const categoryMeta = new Map<
    string,
    { name: string; emoji: string }
  >();

  for (let pi = 0; pi < sorted.length; pi++) {
    const period = sorted[pi];
    const txs = allTransactions.filter((t) => t.periodId === period.id);
    const instances = allInstances.filter(
      (i) => i.periodId === period.id
    );

    // Envelope expenses
    for (const tx of txs) {
      if (tx.kind === "envelopeExpense" && tx.envelopeId) {
        const env = envelopeMap.get(tx.envelopeId);
        if (!env) continue;
        if (!categoryAmounts.has(tx.envelopeId)) {
          categoryAmounts.set(
            tx.envelopeId,
            new Array(sorted.length).fill(0)
          );
          categoryMeta.set(tx.envelopeId, {
            name: env.name,
            emoji: env.emoji,
          });
        }
        categoryAmounts.get(tx.envelopeId)![pi] += tx.amount;
      }
    }

    // Fixed expenses
    for (const inst of instances) {
      if (!inst.isPaid) continue;
      const def = defMap.get(inst.defId);
      if (!def) continue;
      const amount = inst.actual > 0 ? inst.actual : inst.planned;
      if (amount <= 0) continue;

      if (!categoryAmounts.has(def.id)) {
        categoryAmounts.set(
          def.id,
          new Array(sorted.length).fill(0)
        );
        categoryMeta.set(def.id, { name: def.name, emoji: "📌" });
      }
      categoryAmounts.get(def.id)![pi] += amount;
    }
  }

  // Build result
  const result: CategoryHistory[] = [];
  for (const [id, amounts] of categoryAmounts) {
    const meta = categoryMeta.get(id)!;
    const current =
      currentIdx >= 0 ? amounts[currentIdx] : amounts[amounts.length - 1];
    const previous =
      currentIdx > 0
        ? amounts[currentIdx - 1]
        : currentIdx === 0
        ? 0
        : amounts.length > 1
        ? amounts[amounts.length - 2]
        : 0;

    const changePercent =
      previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : current > 0
        ? null
        : null;

    result.push({
      id,
      name: meta.name,
      emoji: meta.emoji,
      currentAmount: current,
      previousAmount: previous,
      changePercent,
      sparkline: amounts,
    });
  }

  result.sort((a, b) => b.currentAmount - a.currentAmount);
  return result;
}

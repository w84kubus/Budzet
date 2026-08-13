import { z } from "zod";

// ─── Shared validators ──────────────────────────────────────────────────────

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/);
const grosze = z.number().int();
const nonNegativeGrosze = z.number().int().nonnegative();
const positiveGrosze = z.number().int().positive();

// ─── Period ──────────────────────────────────────────────────────────────────

export const PeriodSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: isoDateString,
  endDate: isoDateString.nullable(),
  expectedIncome: nonNegativeGrosze,
  status: z.enum(["open", "closed"]),
});

// ─── Fixed Expense Def ───────────────────────────────────────────────────────

export const FixedExpenseDefSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["single", "accumulating"]),
  defaultPlanned: nonNegativeGrosze,
  dueDay: z.number().int().min(1).max(31).nullable(),
  subcategories: z.array(z.string()),
  order: z.number().int().nonnegative(),
  archived: z.boolean(),
});

// ─── Fixed Expense Instance ──────────────────────────────────────────────────

export const FixedExpenseInstanceSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  defId: z.string(),
  planned: nonNegativeGrosze,
  actual: nonNegativeGrosze,
  isPaid: z.boolean(),
  paidAt: isoDateString.nullable(),
});

// ─── Envelope ────────────────────────────────────────────────────────────────

export const EnvelopeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  emoji: z.string().min(1),
  monthlyPlan: nonNegativeGrosze,
  targetAmount: nonNegativeGrosze.nullable(),
  subcategories: z.array(z.string()),
  order: z.number().int().nonnegative(),
  archived: z.boolean(),
});

// ─── Transaction ─────────────────────────────────────────────────────────────

export const TransactionKindSchema = z.enum([
  "income",
  "fixedExpense",
  "envelopeExpense",
  "allocation",
  "envelopeTransfer",
  "withdrawal",
  "adjustment",
]);

export const TransactionSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  kind: TransactionKindSchema,
  amount: positiveGrosze,
  date: isoDateString,
  fixedExpenseDefId: z.string().optional(),
  envelopeId: z.string().optional(),
  targetEnvelopeId: z.string().optional(),
  subcategory: z.string().optional(),
  paidFrom: z.enum(["main", "savings"]).optional(),
  note: z.string().optional(),
  isImpulse: z.boolean(),
  receiptUrl: z.string().url().optional(),
  createdAt: isoDateString,
});

// ─── Transfer Task ───────────────────────────────────────────────────────────

export const TransferBreakdownItemSchema = z.object({
  envelopeId: z.string(),
  amount: positiveGrosze,
});

export const TransferTaskSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  totalAmount: positiveGrosze,
  breakdown: z.array(TransferBreakdownItemSchema).min(1),
  createdAt: isoDateString,
  isDone: z.boolean(),
  doneAt: isoDateString.nullable(),
});

// ─── Balance Check ───────────────────────────────────────────────────────────

export const BalanceCheckSchema = z.object({
  id: z.string(),
  date: isoDateString,
  mainReal: grosze,
  savingsReal: grosze,
  mainExpected: grosze,
  savingsExpected: grosze,
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const UserSettingsSchema = z.object({
  paydayDay: z.number().int().min(1).max(31),
  pinHash: z.string().nullable(),
  currency: z.literal("PLN"),
  createdAt: isoDateString,
  lastBackupAt: isoDateString.nullable(),
});

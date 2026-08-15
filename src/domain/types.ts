// ─── Period ──────────────────────────────────────────────────────────────────

export type PeriodStatus = "open" | "closed";

export type Period = {
  id: string; // "2026-08"
  label: string; // "Sierpień 2026"
  startDate: string; // ISO date
  endDate: string | null; // null = open
  expectedIncome: number; // grosze
  status: PeriodStatus;
};

// ─── Fixed Expenses ──────────────────────────────────────────────────────────

export type FixedExpenseType = "single" | "accumulating";

export type FixedExpenseDef = {
  id: string;
  name: string;
  type: FixedExpenseType;
  defaultPlanned: number; // grosze
  dueDay: number | null;
  endDate: string | null; // ISO date "YYYY-MM" - last month this expense is active, null = no end
  subcategories: string[];
  order: number;
  archived: boolean;
};

export type FixedExpenseInstance = {
  id: string;
  periodId: string;
  defId: string;
  planned: number; // grosze
  actual: number; // grosze - for 'single' set on mark-paid, for 'accumulating' = sum of txns
  isPaid: boolean;
  paidAt: string | null;
};

// ─── Envelopes ───────────────────────────────────────────────────────────────

export type Envelope = {
  id: string;
  name: string;
  emoji: string;
  monthlyPlan: number; // grosze
  targetAmount: number | null; // grosze, optional goal
  subcategories: string[];
  order: number;
  archived: boolean;
};

// ─── Transactions ────────────────────────────────────────────────────────────

export type TransactionKind =
  | "income"
  | "fixedExpense"
  | "envelopeExpense"
  | "allocation"
  | "envelopeTransfer"
  | "withdrawal"
  | "adjustment";

export type PaidFrom = "main" | "savings";

export type Transaction = {
  id: string;
  periodId: string;
  kind: TransactionKind;
  amount: number; // ALWAYS positive, grosze - direction implied by kind
  date: string; // ISO date
  fixedExpenseDefId?: string;
  envelopeId?: string; // for envelope movements; for transfer = source
  targetEnvelopeId?: string; // for envelopeTransfer = target
  subcategory?: string;
  paidFrom?: PaidFrom; // only for envelopeExpense, default 'savings'
  note?: string;
  isImpulse: boolean;
  receiptUrl?: string;
  createdAt: string; // ISO datetime
};

// ─── Transfer Task ───────────────────────────────────────────────────────────

export type TransferTask = {
  id: string;
  periodId: string;
  totalAmount: number; // grosze
  breakdown: TransferBreakdownItem[];
  createdAt: string;
  isDone: boolean;
  doneAt: string | null;
};

export type TransferBreakdownItem = {
  envelopeId: string;
  amount: number; // grosze
};

// ─── Balance Check ───────────────────────────────────────────────────────────

export type BalanceCheck = {
  id: string;
  date: string;
  mainReal: number;
  savingsReal: number;
  mainExpected: number;
  savingsExpected: number;
};

// ─── Settings ────────────────────────────────────────────────────────────────

export type UserSettings = {
  paydayDay: number;
  pinHash: string | null;
  currency: string; // always "PLN"
  createdAt: string;
  lastBackupAt: string | null;
};

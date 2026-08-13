import { describe, it, expect } from "vitest";
import {
  PeriodSchema,
  TransactionSchema,
  EnvelopeSchema,
  FixedExpenseDefSchema,
  FixedExpenseInstanceSchema,
  TransferTaskSchema,
  BalanceCheckSchema,
  UserSettingsSchema,
} from "./schemas";

describe("PeriodSchema", () => {
  it("accepts valid period", () => {
    const result = PeriodSchema.safeParse({
      id: "2026-08",
      label: "Sierpień 2026",
      startDate: "2026-08-10",
      endDate: null,
      expectedIncome: 500000,
      status: "open",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative income", () => {
    const result = PeriodSchema.safeParse({
      id: "2026-08",
      label: "Sierpień 2026",
      startDate: "2026-08-10",
      endDate: null,
      expectedIncome: -100,
      status: "open",
    });
    expect(result.success).toBe(false);
  });

  it("rejects float income", () => {
    const result = PeriodSchema.safeParse({
      id: "2026-08",
      label: "Sierpień 2026",
      startDate: "2026-08-10",
      endDate: null,
      expectedIncome: 500000.5,
      status: "open",
    });
    expect(result.success).toBe(false);
  });
});

describe("TransactionSchema", () => {
  it("accepts valid transaction", () => {
    const result = TransactionSchema.safeParse({
      id: "tx-1",
      periodId: "2026-08",
      kind: "envelopeExpense",
      amount: 3500,
      date: "2026-08-14",
      envelopeId: "env-1",
      paidFrom: "main",
      isImpulse: true,
      createdAt: "2026-08-14T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = TransactionSchema.safeParse({
      id: "tx-1",
      periodId: "2026-08",
      kind: "income",
      amount: 0,
      date: "2026-08-14",
      isImpulse: false,
      createdAt: "2026-08-14T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = TransactionSchema.safeParse({
      id: "tx-1",
      periodId: "2026-08",
      kind: "income",
      amount: -100,
      date: "2026-08-14",
      isImpulse: false,
      createdAt: "2026-08-14T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects float amount", () => {
    const result = TransactionSchema.safeParse({
      id: "tx-1",
      periodId: "2026-08",
      kind: "income",
      amount: 100.5,
      date: "2026-08-14",
      isImpulse: false,
      createdAt: "2026-08-14T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const result = TransactionSchema.safeParse({
      id: "tx-1",
      periodId: "2026-08",
      kind: "refund",
      amount: 100,
      date: "2026-08-14",
      isImpulse: false,
      createdAt: "2026-08-14T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("EnvelopeSchema", () => {
  it("accepts valid envelope", () => {
    const result = EnvelopeSchema.safeParse({
      id: "env-1",
      name: "Wakacje",
      emoji: "✈️",
      monthlyPlan: 50000,
      targetAmount: 500000,
      subcategories: [],
      order: 0,
      archived: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null targetAmount", () => {
    const result = EnvelopeSchema.safeParse({
      id: "env-1",
      name: "Rozrywka",
      emoji: "🎬",
      monthlyPlan: 0,
      targetAmount: null,
      subcategories: [],
      order: 0,
      archived: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = EnvelopeSchema.safeParse({
      id: "env-1",
      name: "",
      emoji: "🎬",
      monthlyPlan: 0,
      targetAmount: null,
      subcategories: [],
      order: 0,
      archived: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("FixedExpenseDefSchema", () => {
  it("accepts valid definition", () => {
    const result = FixedExpenseDefSchema.safeParse({
      id: "d1",
      name: "Studia",
      type: "single",
      defaultPlanned: 99000,
      dueDay: 10,
      subcategories: [],
      order: 0,
      archived: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects dueDay > 31", () => {
    const result = FixedExpenseDefSchema.safeParse({
      id: "d1",
      name: "Test",
      type: "single",
      defaultPlanned: 0,
      dueDay: 32,
      subcategories: [],
      order: 0,
      archived: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("FixedExpenseInstanceSchema", () => {
  it("accepts valid instance", () => {
    const result = FixedExpenseInstanceSchema.safeParse({
      id: "i1",
      periodId: "2026-08",
      defId: "d1",
      planned: 99000,
      actual: 99000,
      isPaid: true,
      paidAt: "2026-08-10",
    });
    expect(result.success).toBe(true);
  });
});

describe("TransferTaskSchema", () => {
  it("accepts valid task", () => {
    const result = TransferTaskSchema.safeParse({
      id: "tt-1",
      periodId: "2026-08",
      totalAmount: 130000,
      breakdown: [{ envelopeId: "env-1", amount: 80000 }, { envelopeId: "env-2", amount: 50000 }],
      createdAt: "2026-08-14T10:00:00Z",
      isDone: false,
      doneAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty breakdown", () => {
    const result = TransferTaskSchema.safeParse({
      id: "tt-1",
      periodId: "2026-08",
      totalAmount: 0,
      breakdown: [],
      createdAt: "2026-08-14T10:00:00Z",
      isDone: false,
      doneAt: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("BalanceCheckSchema", () => {
  it("accepts valid check with negative values", () => {
    const result = BalanceCheckSchema.safeParse({
      id: "bc-1",
      date: "2026-08-14",
      mainReal: 500000,
      savingsReal: 200000,
      mainExpected: 480000,
      savingsExpected: -5000,
    });
    expect(result.success).toBe(true);
  });
});

describe("UserSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = UserSettingsSchema.safeParse({
      paydayDay: 10,
      pinHash: null,
      currency: "PLN",
      createdAt: "2026-08-01T00:00:00Z",
      lastBackupAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-PLN currency", () => {
    const result = UserSettingsSchema.safeParse({
      paydayDay: 10,
      pinHash: null,
      currency: "EUR",
      createdAt: "2026-08-01T00:00:00Z",
      lastBackupAt: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects paydayDay out of range", () => {
    expect(
      UserSettingsSchema.safeParse({
        paydayDay: 0,
        pinHash: null,
        currency: "PLN",
        createdAt: "2026-08-01T00:00:00Z",
        lastBackupAt: null,
      }).success
    ).toBe(false);

    expect(
      UserSettingsSchema.safeParse({
        paydayDay: 32,
        pinHash: null,
        currency: "PLN",
        createdAt: "2026-08-01T00:00:00Z",
        lastBackupAt: null,
      }).success
    ).toBe(false);
  });
});

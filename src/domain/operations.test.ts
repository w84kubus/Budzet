import { describe, it, expect } from "vitest";
import type { Period, FixedExpenseDef } from "./types";
import {
  closePeriod,
  createInitialPeriod,
  distributeFunds,
  distributeProportionally,
  shouldShowPaydayReminder,
} from "./operations";

// ─── closePeriod ─────────────────────────────────────────────────────────────

describe("closePeriod", () => {
  const openPeriod: Period = {
    id: "2026-07",
    label: "Lipiec 2026",
    startDate: "2026-07-10",
    endDate: null,
    expectedIncome: 500000,
    status: "open",
  };

  const defs: FixedExpenseDef[] = [
    {
      id: "d1",
      name: "Studia",
      type: "single",
      defaultPlanned: 99000,
      dueDay: null,
      endDate: null,
      subcategories: [],
      order: 0,
      archived: false,
    },
    {
      id: "d2",
      name: "Jedzenie",
      type: "accumulating",
      defaultPlanned: 150000,
      dueDay: null,
      endDate: null,
      subcategories: ["Zakupy spożywcze"],
      order: 1,
      archived: false,
    },
    {
      id: "d3",
      name: "Archived",
      type: "single",
      defaultPlanned: 50000,
      dueDay: null,
      endDate: null,
      subcategories: [],
      order: 2,
      archived: true,
    },
  ];

  it("closes current period and opens new one", () => {
    const result = closePeriod({
      currentPeriod: openPeriod,
      newStartDate: "2026-08-10",
      newExpectedIncome: 520000,
      fixedExpenseDefs: defs,
    });

    expect(result.closedPeriod.status).toBe("closed");
    expect(result.closedPeriod.endDate).toBe("2026-08-10");

    expect(result.newPeriod.id).toBe("2026-08");
    expect(result.newPeriod.label).toBe("Sierpień 2026");
    expect(result.newPeriod.startDate).toBe("2026-08-10");
    expect(result.newPeriod.endDate).toBeNull();
    expect(result.newPeriod.expectedIncome).toBe(520000);
    expect(result.newPeriod.status).toBe("open");
  });

  it("creates instances only for non-archived defs", () => {
    const result = closePeriod({
      currentPeriod: openPeriod,
      newStartDate: "2026-08-10",
      newExpectedIncome: 520000,
      fixedExpenseDefs: defs,
    });

    expect(result.newInstances).toHaveLength(2);
    expect(result.newInstances.every((i) => i.isPaid === false)).toBe(true);
    expect(result.newInstances.every((i) => i.actual === 0)).toBe(true);
    expect(result.newInstances[0].planned).toBe(99000);
    expect(result.newInstances[1].planned).toBe(150000);
  });

  it("throws if period is already closed", () => {
    const closed: Period = { ...openPeriod, status: "closed", endDate: "2026-08-01" };
    expect(() =>
      closePeriod({
        currentPeriod: closed,
        newStartDate: "2026-08-10",
        newExpectedIncome: 500000,
        fixedExpenseDefs: defs,
      })
    ).toThrow("Nie można zamknąć okresu");
  });

  it("generates correct period id from month", () => {
    const result = closePeriod({
      currentPeriod: openPeriod,
      newStartDate: "2026-12-05",
      newExpectedIncome: 500000,
      fixedExpenseDefs: [],
    });
    expect(result.newPeriod.id).toBe("2026-12");
    expect(result.newPeriod.label).toBe("Grudzień 2026");
  });

  it("handles January transition", () => {
    const result = closePeriod({
      currentPeriod: openPeriod,
      newStartDate: "2027-01-08",
      newExpectedIncome: 500000,
      fixedExpenseDefs: [],
    });
    expect(result.newPeriod.id).toBe("2027-01");
    expect(result.newPeriod.label).toBe("Styczeń 2027");
  });
});

// ─── createInitialPeriod ─────────────────────────────────────────────────────

describe("createInitialPeriod", () => {
  it("creates an open period with correct label", () => {
    const period = createInitialPeriod("2026-08-10", 500000);
    expect(period.id).toBe("2026-08");
    expect(period.label).toBe("Sierpień 2026");
    expect(period.startDate).toBe("2026-08-10");
    expect(period.endDate).toBeNull();
    expect(period.expectedIncome).toBe(500000);
    expect(period.status).toBe("open");
  });
});

// ─── distributeFunds ─────────────────────────────────────────────────────────

describe("distributeFunds", () => {
  it("creates allocation transactions and transfer task", () => {
    const result = distributeFunds({
      periodId: "2026-08",
      available: 200000,
      allocations: [
        { envelopeId: "env-1", amount: 80000 },
        { envelopeId: "env-2", amount: 50000 },
      ],
      date: "2026-08-14",
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].kind).toBe("allocation");
    expect(result.transactions[0].amount).toBe(80000);
    expect(result.transactions[0].envelopeId).toBe("env-1");

    expect(result.transferTask.totalAmount).toBe(130000);
    expect(result.transferTask.breakdown).toHaveLength(2);
    expect(result.transferTask.isDone).toBe(false);
  });

  it("filters out zero allocations", () => {
    const result = distributeFunds({
      periodId: "2026-08",
      available: 200000,
      allocations: [
        { envelopeId: "env-1", amount: 80000 },
        { envelopeId: "env-2", amount: 0 },
      ],
      date: "2026-08-14",
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transferTask.breakdown).toHaveLength(1);
  });

  it("throws if all allocations are zero", () => {
    expect(() =>
      distributeFunds({
        periodId: "2026-08",
        available: 200000,
        allocations: [{ envelopeId: "env-1", amount: 0 }],
        date: "2026-08-14",
      })
    ).toThrow("Brak alokacji");
  });

  it("throws if total exceeds available", () => {
    expect(() =>
      distributeFunds({
        periodId: "2026-08",
        available: 50000,
        allocations: [
          { envelopeId: "env-1", amount: 30000 },
          { envelopeId: "env-2", amount: 30000 },
        ],
        date: "2026-08-14",
      })
    ).toThrow("przekracza dostępne środki");
  });

  it("allows total equal to available", () => {
    const result = distributeFunds({
      periodId: "2026-08",
      available: 100000,
      allocations: [
        { envelopeId: "env-1", amount: 60000 },
        { envelopeId: "env-2", amount: 40000 },
      ],
      date: "2026-08-14",
    });
    expect(result.transferTask.totalAmount).toBe(100000);
  });
});

// ─── distributeProportionally ────────────────────────────────────────────────

describe("distributeProportionally", () => {
  it("distributes proportionally to plan", () => {
    const envelopes = [
      { id: "e1", monthlyPlan: 30000 },
      { id: "e2", monthlyPlan: 20000 },
      { id: "e3", monthlyPlan: 50000 },
    ];
    const result = distributeProportionally(envelopes, 100000);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(100000);

    const e1 = result.find((r) => r.envelopeId === "e1");
    const e2 = result.find((r) => r.envelopeId === "e2");
    const e3 = result.find((r) => r.envelopeId === "e3");
    expect(e1?.amount).toBe(30000);
    expect(e2?.amount).toBe(20000);
    expect(e3?.amount).toBe(50000);
  });

  it("caps at available when less than total plan", () => {
    const envelopes = [
      { id: "e1", monthlyPlan: 60000 },
      { id: "e2", monthlyPlan: 40000 },
    ];
    const result = distributeProportionally(envelopes, 50000);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(50000);
  });

  it("caps at total plan when available exceeds it", () => {
    const envelopes = [
      { id: "e1", monthlyPlan: 30000 },
      { id: "e2", monthlyPlan: 20000 },
    ];
    const result = distributeProportionally(envelopes, 200000);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(50000);
  });

  it("returns empty for no envelopes with plans", () => {
    const envelopes = [{ id: "e1", monthlyPlan: 0 }];
    expect(distributeProportionally(envelopes, 100000)).toEqual([]);
  });

  it("returns empty for 0 available", () => {
    const envelopes = [{ id: "e1", monthlyPlan: 50000 }];
    expect(distributeProportionally(envelopes, 0)).toEqual([]);
  });

  it("handles non-divisible amounts without losing a grosz", () => {
    const envelopes = [
      { id: "e1", monthlyPlan: 33333 },
      { id: "e2", monthlyPlan: 33333 },
      { id: "e3", monthlyPlan: 33334 },
    ];
    const result = distributeProportionally(envelopes, 100);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(100);
  });

  it("integer distribution: sum is always exact for any input", () => {
    // Property test with various tricky inputs
    const cases: [{ id: string; monthlyPlan: number }[], number][] = [
      [[{ id: "a", monthlyPlan: 1 }, { id: "b", monthlyPlan: 1 }, { id: "c", monthlyPlan: 1 }], 100],
      [[{ id: "a", monthlyPlan: 7 }, { id: "b", monthlyPlan: 3 }], 99],
      [[{ id: "a", monthlyPlan: 1 }], 1],
      [[{ id: "a", monthlyPlan: 50000 }, { id: "b", monthlyPlan: 50000 }], 1],
    ];
    for (const [envs, available] of cases) {
      const result = distributeProportionally(envs, available);
      const total = result.reduce((s, r) => s + r.amount, 0);
      const expectedTotal = Math.min(available, envs.reduce((s, e) => s + e.monthlyPlan, 0));
      expect(total).toBe(expectedTotal);
    }
  });
});

// ─── shouldShowPaydayReminder ────────────────────────────────────────────────

describe("shouldShowPaydayReminder", () => {
  it("returns false when within normal range", () => {
    expect(shouldShowPaydayReminder("2026-08-10", 10, "2026-08-20")).toBe(false);
  });

  it("returns false on expected payday + 5 days", () => {
    // Period started 2026-08-10, payday day 10, next expected = 2026-09-10
    // Deadline = 2026-09-15
    // Today 2026-09-15 → not past deadline (need >)
    expect(shouldShowPaydayReminder("2026-08-10", 10, "2026-09-15")).toBe(false);
  });

  it("returns true when past payday + 5 days", () => {
    expect(shouldShowPaydayReminder("2026-08-10", 10, "2026-09-16")).toBe(true);
  });
});

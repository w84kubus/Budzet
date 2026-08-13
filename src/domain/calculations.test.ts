import { describe, it, expect } from "vitest";
import type { Transaction, FixedExpenseInstance } from "./types";
import {
  calculateEnvelopeBalance,
  calculateAllEnvelopeBalances,
  calculateAccountBalances,
  calculateFreeFunds,
  calculateDaysUntilPayday,
  calculateDailyAllowance,
  calculateEnvelopeDailyLimit,
  calculateImpulseTotal,
  calculateAllocationBreakdown,
} from "./calculations";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tx(overrides: Partial<Transaction> & Pick<Transaction, "kind" | "amount">): Transaction {
  return {
    id: "tx-" + Math.random().toString(36).slice(2, 8),
    periodId: "2026-08",
    date: "2026-08-14",
    isImpulse: false,
    createdAt: "2026-08-14T10:00:00Z",
    ...overrides,
  };
}

// ─── calculateEnvelopeBalance ────────────────────────────────────────────────

describe("calculateEnvelopeBalance", () => {
  it("returns 0 for no transactions", () => {
    expect(calculateEnvelopeBalance("env-1", [])).toBe(0);
  });

  it("adds allocations", () => {
    const txs = [
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-1" }),
      tx({ kind: "allocation", amount: 30000, envelopeId: "env-1" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(80000);
  });

  it("ignores allocations to other envelopes", () => {
    const txs = [
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-2" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(0);
  });

  it("subtracts envelope expenses regardless of paidFrom", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 30000, envelopeId: "env-1", paidFrom: "savings" }),
      tx({ kind: "envelopeExpense", amount: 20000, envelopeId: "env-1", paidFrom: "main" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(50000);
  });

  it("handles envelope transfers in both directions", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-2" }),
      // Transfer 20000 from env-1 to env-2
      tx({ kind: "envelopeTransfer", amount: 20000, envelopeId: "env-1", targetEnvelopeId: "env-2" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(80000);
    expect(calculateEnvelopeBalance("env-2", txs)).toBe(70000);
  });

  it("subtracts withdrawals", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "withdrawal", amount: 40000, envelopeId: "env-1" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(60000);
  });

  it("handles positive adjustments (default)", () => {
    const txs = [
      tx({ kind: "adjustment", amount: 5000, envelopeId: "env-1" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(5000);
  });

  it("handles negative adjustments (paidFrom=savings)", () => {
    const txs = [
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-1" }),
      tx({ kind: "adjustment", amount: 5000, envelopeId: "env-1", paidFrom: "savings" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(45000);
  });

  it("can go negative (overdrawn envelope)", () => {
    const txs = [
      tx({ kind: "allocation", amount: 10000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 25000, envelopeId: "env-1" }),
    ];
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(-15000);
  });

  it("handles all movement types in one envelope", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 20000, envelopeId: "env-1" }),
      tx({ kind: "envelopeTransfer", amount: 10000, envelopeId: "env-1", targetEnvelopeId: "env-2" }),
      tx({ kind: "envelopeTransfer", amount: 5000, envelopeId: "env-2", targetEnvelopeId: "env-1" }),
      tx({ kind: "withdrawal", amount: 15000, envelopeId: "env-1" }),
      tx({ kind: "adjustment", amount: 3000, envelopeId: "env-1" }),
    ];
    // 100000 - 20000 - 10000 + 5000 - 15000 + 3000 = 63000
    expect(calculateEnvelopeBalance("env-1", txs)).toBe(63000);
  });
});

// ─── calculateAllEnvelopeBalances ────────────────────────────────────────────

describe("calculateAllEnvelopeBalances", () => {
  it("returns 0 for all envelopes with no transactions", () => {
    const result = calculateAllEnvelopeBalances(["env-1", "env-2"], []);
    expect(result.get("env-1")).toBe(0);
    expect(result.get("env-2")).toBe(0);
  });

  it("computes all balances in one pass", () => {
    const txs = [
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-1" }),
      tx({ kind: "allocation", amount: 30000, envelopeId: "env-2" }),
      tx({ kind: "envelopeExpense", amount: 10000, envelopeId: "env-1" }),
    ];
    const result = calculateAllEnvelopeBalances(["env-1", "env-2"], txs);
    expect(result.get("env-1")).toBe(40000);
    expect(result.get("env-2")).toBe(30000);
  });
});

// ─── calculateAccountBalances ────────────────────────────────────────────────

describe("calculateAccountBalances", () => {
  it("empty transactions = zero balances", () => {
    const result = calculateAccountBalances([], []);
    expect(result.expectedMain).toBe(0);
    expect(result.expectedSavings).toBe(0);
    expect(result.totalEnvelopes).toBe(0);
    expect(result.settlementAmount).toBe(0);
  });

  it("income increases main", () => {
    const txs = [tx({ kind: "income", amount: 500000 })];
    const result = calculateAccountBalances(txs, []);
    expect(result.expectedMain).toBe(500000);
  });

  it("fixedExpense decreases main", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "fixedExpense", amount: 99000 }),
    ];
    const result = calculateAccountBalances(txs, []);
    expect(result.expectedMain).toBe(401000);
  });

  it("allocation moves from main to savings", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    expect(result.expectedMain).toBe(400000);
    expect(result.expectedSavings).toBe(100000);
    expect(result.totalEnvelopes).toBe(100000);
    expect(result.settlementAmount).toBe(0);
  });

  it("withdrawal moves from savings to main", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "withdrawal", amount: 30000, envelopeId: "env-1" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    expect(result.expectedMain).toBe(-100000 + 30000);
    expect(result.expectedSavings).toBe(100000 - 30000);
    expect(result.totalEnvelopes).toBe(70000);
  });

  it("envelopeExpense paidFrom=main decreases main only", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 20000, envelopeId: "env-1", paidFrom: "main" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    expect(result.expectedMain).toBe(500000 - 100000 - 20000);
    expect(result.expectedSavings).toBe(100000);
    // Envelope balance = 100000 - 20000 = 80000
    expect(result.totalEnvelopes).toBe(80000);
    // Settlement = expectedSavings - totalEnvelopes = 100000 - 80000 = 20000
    // Positive = surplus on savings account → should transfer to main
    expect(result.settlementAmount).toBe(20000);
  });

  it("envelopeExpense paidFrom=savings decreases savings", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 20000, envelopeId: "env-1", paidFrom: "savings" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    expect(result.expectedSavings).toBe(80000);
    expect(result.totalEnvelopes).toBe(80000);
    expect(result.settlementAmount).toBe(0);
  });

  it("envelopeExpense defaults paidFrom to savings", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 20000, envelopeId: "env-1" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    expect(result.expectedSavings).toBe(80000);
  });

  it("settlement amount = expectedSavings - totalEnvelopes", () => {
    const txs = [
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
      tx({ kind: "envelopeExpense", amount: 40000, envelopeId: "env-1", paidFrom: "main" }),
    ];
    const result = calculateAccountBalances(txs, ["env-1"]);
    // expectedSavings = 100000 (allocated)
    // totalEnvelopes = 100000 - 40000 = 60000
    // settlement = 100000 - 60000 = 40000
    expect(result.settlementAmount).toBe(40000);
  });
});

// ─── calculateFreeFunds ──────────────────────────────────────────────────────

describe("calculateFreeFunds", () => {
  it("returns 0 with no data", () => {
    expect(calculateFreeFunds([], [])).toBe(0);
  });

  it("income minus paid fixed expenses", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "fixedExpense", amount: 99000 }),
    ];
    expect(calculateFreeFunds(txs, [])).toBe(401000);
  });

  it("subtracts planned amounts for unpaid fixed expenses", () => {
    const txs = [tx({ kind: "income", amount: 500000 })];
    const instances: FixedExpenseInstance[] = [
      { id: "i1", periodId: "2026-08", defId: "d1", planned: 99000, actual: 0, isPaid: false, paidAt: null },
      { id: "i2", periodId: "2026-08", defId: "d2", planned: 50000, actual: 50000, isPaid: true, paidAt: "2026-08-10" },
    ];
    // 500000 - 99000 (unpaid plan) = 401000
    // The paid one is not subtracted via instances — it should be subtracted via fixedExpense transaction
    expect(calculateFreeFunds(txs, instances)).toBe(401000);
  });

  it("subtracts both paid txns and unpaid plans correctly", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "fixedExpense", amount: 50000 }), // paid fixed expense
    ];
    const instances: FixedExpenseInstance[] = [
      { id: "i1", periodId: "2026-08", defId: "d1", planned: 99000, actual: 0, isPaid: false, paidAt: null },
      { id: "i2", periodId: "2026-08", defId: "d2", planned: 50000, actual: 50000, isPaid: true, paidAt: "2026-08-10" },
    ];
    // 500000 - 50000 (paid txn) - 99000 (unpaid plan) = 351000
    expect(calculateFreeFunds(txs, instances)).toBe(351000);
  });

  it("subtracts envelope expenses paid from main", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "envelopeExpense", amount: 20000, paidFrom: "main" }),
    ];
    expect(calculateFreeFunds(txs, [])).toBe(480000);
  });

  it("does NOT subtract envelope expenses paid from savings", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "envelopeExpense", amount: 20000, paidFrom: "savings" }),
    ];
    expect(calculateFreeFunds(txs, [])).toBe(500000);
  });

  it("subtracts allocations", () => {
    const txs = [
      tx({ kind: "income", amount: 500000 }),
      tx({ kind: "allocation", amount: 100000, envelopeId: "env-1" }),
    ];
    expect(calculateFreeFunds(txs, [])).toBe(400000);
  });

  it("can go negative", () => {
    const txs = [
      tx({ kind: "income", amount: 100000 }),
      tx({ kind: "fixedExpense", amount: 150000 }),
    ];
    expect(calculateFreeFunds(txs, [])).toBe(-50000);
  });
});

// ─── calculateDaysUntilPayday ────────────────────────────────────────────────

describe("calculateDaysUntilPayday", () => {
  it("returns days until next payday", () => {
    // Period started 2026-08-10, payday day 10, today is 2026-08-14
    // Next payday: 2026-09-10
    // Days: 27
    const days = calculateDaysUntilPayday("2026-08-14", "2026-08-10", 10, null);
    expect(days).toBe(27);
  });

  it("returns 1 on payday itself", () => {
    const days = calculateDaysUntilPayday("2026-09-10", "2026-08-10", 10, null);
    expect(days).toBe(1); // max(1, 0) = 1
  });

  it("returns 1 if past payday (never goes below 1)", () => {
    const days = calculateDaysUntilPayday("2026-09-15", "2026-08-10", 10, null);
    expect(days).toBe(1); // max(1, negative) = 1
  });

  it("returns 0 for closed period", () => {
    const days = calculateDaysUntilPayday("2026-08-14", "2026-08-10", 10, "2026-09-10");
    expect(days).toBe(0);
  });
});

// ─── calculateDailyAllowance ─────────────────────────────────────────────────

describe("calculateDailyAllowance", () => {
  it("divides free funds by days", () => {
    expect(calculateDailyAllowance(270000, 27)).toBe(10000); // 100 zł/day
  });

  it("truncates, does not round up", () => {
    expect(calculateDailyAllowance(100000, 3)).toBe(33333); // 333,33 not 333,34
  });

  it("returns 0 for closed period (0 days)", () => {
    expect(calculateDailyAllowance(100000, 0)).toBe(0);
  });

  it("handles negative free funds", () => {
    expect(calculateDailyAllowance(-50000, 10)).toBe(-5000);
  });
});

// ─── calculateEnvelopeDailyLimit ─────────────────────────────────────────────

describe("calculateEnvelopeDailyLimit", () => {
  it("divides balance by days", () => {
    expect(calculateEnvelopeDailyLimit(30000, 10)).toBe(3000);
  });

  it("returns 0 for 0 days", () => {
    expect(calculateEnvelopeDailyLimit(30000, 0)).toBe(0);
  });
});

// ─── calculateImpulseTotal ───────────────────────────────────────────────────

describe("calculateImpulseTotal", () => {
  it("returns 0 with no transactions", () => {
    expect(calculateImpulseTotal([])).toBe(0);
  });

  it("sums only impulse transactions", () => {
    const txs = [
      tx({ kind: "envelopeExpense", amount: 5000, isImpulse: true }),
      tx({ kind: "envelopeExpense", amount: 10000, isImpulse: false }),
      tx({ kind: "fixedExpense", amount: 3000, isImpulse: true }),
    ];
    expect(calculateImpulseTotal(txs)).toBe(8000);
  });
});

// ─── calculateAllocationBreakdown ────────────────────────────────────────────

describe("calculateAllocationBreakdown", () => {
  it("groups allocations by envelope", () => {
    const txs = [
      tx({ kind: "allocation", amount: 50000, envelopeId: "env-1" }),
      tx({ kind: "allocation", amount: 30000, envelopeId: "env-2" }),
      tx({ kind: "allocation", amount: 20000, envelopeId: "env-1" }),
      tx({ kind: "income", amount: 500000 }), // ignored
    ];
    const result = calculateAllocationBreakdown(txs);
    expect(result.get("env-1")).toBe(70000);
    expect(result.get("env-2")).toBe(30000);
  });
});

// ─── Property test: envelope balances sum equals net movements ───────────────

describe("property: envelope balances consistency", () => {
  it("sum of all envelope balances equals net envelope movements for random transactions", () => {
    const envelopeIds = ["e1", "e2", "e3", "e4", "e5"];
    const kinds: Array<Transaction["kind"]> = [
      "allocation",
      "envelopeExpense",
      "envelopeTransfer",
      "withdrawal",
      "income",
      "fixedExpense",
    ];

    // Deterministic pseudo-random for reproducibility
    let seed = 42;
    function rand(): number {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    }

    const transactions: Transaction[] = [];
    for (let i = 0; i < 1000; i++) {
      const kindIdx = rand() % kinds.length;
      const kind = kinds[kindIdx];
      const amount = (rand() % 100000) + 1; // 1..100000 grosze
      const envIdx = rand() % envelopeIds.length;
      const targetIdx = rand() % envelopeIds.length;

      const t = tx({
        id: `prop-${i}`,
        kind,
        amount,
        envelopeId: envelopeIds[envIdx],
        targetEnvelopeId: kind === "envelopeTransfer" ? envelopeIds[targetIdx] : undefined,
        paidFrom: rand() % 2 === 0 ? "main" : "savings",
      });
      transactions.push(t);
    }

    const balances = calculateAllEnvelopeBalances(envelopeIds, transactions);
    let totalFromBalances = 0;
    for (const b of balances.values()) {
      totalFromBalances += b;
    }

    // Calculate expected total from movements manually
    let expectedTotal = 0;
    for (const t of transactions) {
      switch (t.kind) {
        case "allocation":
          if (t.envelopeId && envelopeIds.includes(t.envelopeId)) {
            expectedTotal += t.amount;
          }
          break;
        case "envelopeExpense":
          if (t.envelopeId && envelopeIds.includes(t.envelopeId)) {
            expectedTotal -= t.amount;
          }
          break;
        case "envelopeTransfer":
          // Net zero on total (source -X, target +X) — but only if both are tracked
          break;
        case "withdrawal":
          if (t.envelopeId && envelopeIds.includes(t.envelopeId)) {
            expectedTotal -= t.amount;
          }
          break;
        case "adjustment":
          // Not in our random set, but handle for completeness
          break;
      }
    }

    expect(totalFromBalances).toBe(expectedTotal);
  });
});

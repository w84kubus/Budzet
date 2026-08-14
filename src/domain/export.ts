import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  TransferTask,
  UserSettings,
} from "./types";

// ─── CSV Export ─────────────────────────────────────────────────────────────

export function exportTransactionsCSV(
  transactions: Transaction[],
  fixedExpenseDefs: FixedExpenseDef[],
  envelopes: Envelope[]
): string {
  const defMap = new Map(fixedExpenseDefs.map((d) => [d.id, d]));
  const envMap = new Map(envelopes.map((e) => [e.id, e]));

  const BOM = "﻿";
  const header =
    "Data;Typ;Kategoria;Kwota;Notatka;Impuls;Okres";

  const rows = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((tx) => {
      const kind = translateKind(tx.kind);
      let category = "";
      if (tx.envelopeId) {
        const env = envMap.get(tx.envelopeId);
        category = env ? `${env.emoji} ${env.name}` : tx.envelopeId;
      }
      if (tx.fixedExpenseDefId) {
        const def = defMap.get(tx.fixedExpenseDefId);
        category = def ? def.name : tx.fixedExpenseDefId;
      }
      const amount = formatCSVAmount(tx.amount);
      const note = (tx.note ?? "").replace(/;/g, ",");
      const impulse = tx.isImpulse ? "Tak" : "";
      return `${tx.date};${kind};${category};${amount};${note};${impulse};${tx.periodId}`;
    });

  return BOM + header + "\n" + rows.join("\n");
}

function translateKind(kind: string): string {
  const map: Record<string, string> = {
    income: "Przychód",
    fixedExpense: "Wydatek stały",
    envelopeExpense: "Wydatek z koperty",
    allocation: "Alokacja",
    envelopeTransfer: "Transfer",
    withdrawal: "Wypłata z koperty",
    adjustment: "Korekta",
  };
  return map[kind] ?? kind;
}

function formatCSVAmount(grosze: number): string {
  const zl = (grosze / 100).toFixed(2).replace(".", ",");
  return zl;
}

// ─── JSON Export (full backup) ──────────────────────────────────────────────

export type BackupData = {
  version: number;
  exportedAt: string;
  settings: UserSettings;
  periods: Period[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  transactions: Transaction[];
  transferTasks: TransferTask[];
};

export function createBackup(data: {
  settings: UserSettings;
  periods: Period[];
  fixedExpenseDefs: FixedExpenseDef[];
  fixedExpenseInstances: FixedExpenseInstance[];
  envelopes: Envelope[];
  transactions: Transaction[];
  transferTasks: TransferTask[];
}): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

// ─── Download helper ────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

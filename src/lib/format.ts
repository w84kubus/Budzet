/**
 * Central formatting utilities.
 * All PLN amounts, dates, and Polish plurals go through here.
 */

import { formatPLN, formatAmount } from "@/domain/money";

// Re-export money formatters as the single source of truth
export { formatPLN, formatAmount };

// ── Dates ──────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "sty", "lut", "mar", "kwi", "maj", "cze",
  "lip", "sie", "wrz", "paź", "lis", "gru",
] as const;

const MONTHS_FULL = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
] as const;

/** "14 sie" */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "14 sierpnia 2026" */
export function formatDateFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/** "dziś", "wczoraj", "2 dni temu", or short date */
export function formatDateRelative(iso: string): string {
  const target = new Date(iso);
  const now = new Date();

  // Normalize to midnight for day comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = todayDay.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "dziś";
  if (diffDays === 1) return "wczoraj";
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} ${pluralDni(diffDays)} temu`;
  return formatDateShort(iso);
}

/** "Sierpień 2026" */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  const monthNames = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
  ];
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Polish plurals ────────────────────────────────────────────────

/**
 * Polish plural selector.
 * n=1 → form1, n=2..4 (except 12..14) → form2, rest → form5
 */
export function pluralize(n: number, form1: string, form2: string, form5: string): string {
  const abs = Math.abs(n);
  if (abs === 1) return form1;
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  if (lastOne >= 2 && lastOne <= 4 && (lastTwo < 10 || lastTwo >= 20)) return form2;
  return form5;
}

/** "1 dzień", "2 dni", "5 dni" */
export function pluralDni(n: number): string {
  return pluralize(n, "dzień", "dni", "dni");
}

/** "1 transakcja", "2 transakcje", "5 transakcji" */
export function pluralTransakcje(n: number): string {
  return pluralize(n, "transakcja", "transakcje", "transakcji");
}

/** "1 koperta", "2 koperty", "5 kopert" */
export function pluralKoperty(n: number): string {
  return pluralize(n, "koperta", "koperty", "kopert");
}

// ── Amount helpers ────────────────────────────────────────────────

/** Format grosze with sign: "+1 234,56 zł" or "−1 234,56 zł" */
export function formatAmountSigned(grosze: number, kind: "income" | "expense"): string {
  const sign = kind === "income" ? "+" : "−";
  return `${sign}${formatAmount(Math.abs(grosze))} zł`;
}

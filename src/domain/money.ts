/**
 * Format grosze as PLN string: 123456 → "1 234,56 zł"
 * Uses Intl.NumberFormat for consistent Polish formatting.
 */
const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPLN(grosze: number): string {
  return plnFormatter.format(grosze / 100);
}

/**
 * Format grosze as plain number string without currency: 123456 → "1 234,56"
 */
const plainFormatter = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(grosze: number): string {
  return plainFormatter.format(grosze / 100);
}

/**
 * Parse a PLN string back to grosze.
 * Accepts: "1 234,56 zł", "1234,56", "1234.56", "1 234,56"
 * Returns null for unparseable input.
 */
export function parsePLN(input: string): number | null {
  // Strip currency symbol and whitespace
  let cleaned = input.replace(/zł/g, "").trim();

  // Remove thousands separators (spaces and non-breaking spaces)
  cleaned = cleaned.replace(/[\s ]/g, "");

  // Normalize comma to dot
  cleaned = cleaned.replace(",", ".");

  // Remove trailing dot with no decimals
  if (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1);
  }

  if (cleaned === "" || !/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  // Convert to grosze — round to handle floating-point imprecision
  return Math.round(parsed * 100);
}

/**
 * Terminal-style input: digits typed left-to-right build up grosze.
 * "3" → 3 (0,03 zł)
 * "35" → 35 (0,35 zł)
 * "350" → 350 (3,50 zł)
 * "3500" → 3500 (35,00 zł)
 */
export function terminalInputToGrosze(digits: string): number {
  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
}

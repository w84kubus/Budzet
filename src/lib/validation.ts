/**
 * Input validation and sanitization.
 * All user-facing text goes through sanitize() before storage.
 * Auth inputs have dedicated validators.
 */

// ─── Sanitization ───────────────────────────────────────────────────────────

/**
 * Strip HTML tags, control characters, and trim whitespace.
 * Prevents stored XSS if data ever renders outside React's escaping.
 */
export function sanitize(input: string): string {
  return input
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, "")
    // Remove null bytes and other control chars (keep newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse excessive whitespace
    .replace(/\s{3,}/g, "  ")
    .trim();
}

/**
 * Sanitize and enforce max length.
 */
export function sanitizeWithLimit(input: string, maxLength: number): string {
  return sanitize(input).slice(0, maxLength);
}

// ─── Email validation ───────────────────────────────────────────────────────

/**
 * RFC 5322-compliant email regex (simplified but robust).
 * Rejects: spaces, consecutive dots, leading/trailing dots,
 *          missing TLD, missing @, special chars without quoting.
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function validateEmail(email: string): { valid: boolean; error: string | null } {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: "Podaj adres e-mail." };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Adres e-mail jest za długi." };
  }

  if (trimmed.includes("..")) {
    return { valid: false, error: "Adres e-mail zawiera podwójną kropkę." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Nieprawidłowy format adresu e-mail." };
  }

  return { valid: true, error: null };
}

// ─── Password validation ────────────────────────────────────────────────────

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export function validatePassword(password: string): { valid: boolean; error: string | null } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Hasło nie może mieć więcej niż ${PASSWORD_MAX_LENGTH} znaków.` };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Hasło musi zawierać co najmniej jedną literę." };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: "Hasło musi zawierać co najmniej jedną cyfrę." };
  }

  // Check for control characters / null bytes
  if (/[\x00-\x1F\x7F]/.test(password)) {
    return { valid: false, error: "Hasło zawiera niedozwolone znaki." };
  }

  return { valid: true, error: null };
}

// ─── Generic text field validation ──────────────────────────────────────────

const MAX_NAME_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;
const MAX_LABEL_LENGTH = 200;

export function validateName(name: string): { valid: boolean; sanitized: string; error: string | null } {
  const sanitized = sanitizeWithLimit(name, MAX_NAME_LENGTH);

  if (!sanitized) {
    return { valid: false, sanitized, error: "Nazwa nie może być pusta." };
  }

  return { valid: true, sanitized, error: null };
}

export function validateNote(note: string): { valid: boolean; sanitized: string; error: string | null } {
  const sanitized = sanitizeWithLimit(note, MAX_NOTE_LENGTH);
  return { valid: true, sanitized, error: null };
}

export function validateLabel(label: string): { valid: boolean; sanitized: string; error: string | null } {
  const sanitized = sanitizeWithLimit(label, MAX_LABEL_LENGTH);

  if (!sanitized) {
    return { valid: false, sanitized, error: "Etykieta nie może być pusta." };
  }

  return { valid: true, sanitized, error: null };
}

// ─── Amount validation ──────────────────────────────────────────────────────

const MAX_AMOUNT_GROSZE = 99_999_999; // 999 999,99 zł

export function validateAmount(grosze: number): { valid: boolean; error: string | null } {
  if (!Number.isInteger(grosze)) {
    return { valid: false, error: "Kwota musi być liczbą całkowitą (grosze)." };
  }

  if (grosze < 0) {
    return { valid: false, error: "Kwota nie może być ujemna." };
  }

  if (grosze > MAX_AMOUNT_GROSZE) {
    return { valid: false, error: "Kwota jest za duża (max 999 999,99 zł)." };
  }

  return { valid: true, error: null };
}

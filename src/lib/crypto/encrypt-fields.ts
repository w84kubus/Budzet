/**
 * Per-document-type field encryption/decryption.
 * Encrypts sensitive fields (amounts, names, notes) while leaving
 * structural fields (IDs, dates, types, booleans) in the clear
 * so Firestore queries and ordering still work.
 */

import { encrypt, decrypt } from "./crypto";
import { getEncryptionKey } from "./key-store";

// ─── Field definitions ──────────────────────────────────────────────────────
// "number" = integer in grosze, stored as encrypted string in Firestore
// "string" = text, stored as encrypted string
// "number|null" = nullable number

type FieldType = "number" | "string" | "number|null";

type FieldMap = Record<string, FieldType>;

const PERIOD_FIELDS: FieldMap = {
  label: "string",
  expectedIncome: "number",
};

const FIXED_EXPENSE_DEF_FIELDS: FieldMap = {
  name: "string",
  defaultPlanned: "number",
};

const FIXED_EXPENSE_INSTANCE_FIELDS: FieldMap = {
  planned: "number",
  actual: "number",
};

const ENVELOPE_FIELDS: FieldMap = {
  name: "string",
  emoji: "string",
  monthlyPlan: "number",
  targetAmount: "number|null",
};

const TRANSACTION_FIELDS: FieldMap = {
  amount: "number",
  note: "string",
  subcategory: "string",
};

const TRANSFER_TASK_FIELDS: FieldMap = {
  totalAmount: "number",
  // breakdown handled specially below
};

const SETTINGS_FIELDS: FieldMap = {
  pinHash: "string",
};

// ─── Generic encrypt/decrypt ────────────────────────────────────────────────

async function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: FieldMap
): Promise<T> {
  const key = getEncryptionKey();
  if (!key) return obj;

  const result = { ...obj };

  for (const [field, type] of Object.entries(fields)) {
    const value = result[field];

    // Skip undefined (partial updates) and null
    if (value === undefined) continue;
    if (value === null) continue;

    if (type === "number" || type === "number|null") {
      result[field as keyof T] = (await encrypt(
        key,
        String(value)
      )) as T[keyof T];
    } else if (type === "string") {
      if (typeof value === "string" && value.length > 0) {
        result[field as keyof T] = (await encrypt(key, value)) as T[keyof T];
      }
    }
  }

  return result;
}

async function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: FieldMap
): Promise<T> {
  const key = getEncryptionKey();
  if (!key) return obj;

  const result = { ...obj };

  for (const [field, type] of Object.entries(fields)) {
    const value = result[field];

    // Skip undefined and null
    if (value === undefined) continue;
    if (value === null) continue;
    if (typeof value !== "string") continue; // Already decrypted or not encrypted

    try {
      if (type === "number" || type === "number|null") {
        const decrypted = await decrypt(key, value);
        result[field as keyof T] = Number(decrypted) as T[keyof T];
      } else if (type === "string") {
        result[field as keyof T] = (await decrypt(key, value)) as T[keyof T];
      }
    } catch {
      // If decryption fails, the field might not be encrypted (migration)
      // Leave it as-is
    }
  }

  return result;
}

// ─── Typed encrypt/decrypt per document type ────────────────────────────────

// Period
export async function encryptPeriod<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return encryptFields(data, PERIOD_FIELDS);
}

export async function decryptPeriod<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return decryptFields(data, PERIOD_FIELDS);
}

// FixedExpenseDef
export async function encryptFixedExpenseDef<
  T extends Record<string, unknown>,
>(data: T): Promise<T> {
  return encryptFields(data, FIXED_EXPENSE_DEF_FIELDS);
}

export async function decryptFixedExpenseDef<
  T extends Record<string, unknown>,
>(data: T): Promise<T> {
  return decryptFields(data, FIXED_EXPENSE_DEF_FIELDS);
}

// FixedExpenseInstance
export async function encryptFixedExpenseInstance<
  T extends Record<string, unknown>,
>(data: T): Promise<T> {
  return encryptFields(data, FIXED_EXPENSE_INSTANCE_FIELDS);
}

export async function decryptFixedExpenseInstance<
  T extends Record<string, unknown>,
>(data: T): Promise<T> {
  return decryptFields(data, FIXED_EXPENSE_INSTANCE_FIELDS);
}

// Envelope
export async function encryptEnvelope<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return encryptFields(data, ENVELOPE_FIELDS);
}

export async function decryptEnvelope<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return decryptFields(data, ENVELOPE_FIELDS);
}

// Transaction
export async function encryptTransaction<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return encryptFields(data, TRANSACTION_FIELDS);
}

export async function decryptTransaction<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return decryptFields(data, TRANSACTION_FIELDS);
}

// TransferTask (with special handling for breakdown array)
export async function encryptTransferTask<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  const key = getEncryptionKey();
  if (!key) return data;

  let result = await encryptFields(data, TRANSFER_TASK_FIELDS);

  // Encrypt breakdown amounts
  const breakdown = result.breakdown as
    | Array<{ envelopeId: string; amount: number }>
    | undefined;
  if (breakdown && Array.isArray(breakdown)) {
    result = {
      ...result,
      breakdown: await Promise.all(
        breakdown.map(async (item) => ({
          envelopeId: item.envelopeId,
          amount: await encrypt(key, String(item.amount)),
        }))
      ),
    };
  }

  return result;
}

export async function decryptTransferTask<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  const key = getEncryptionKey();
  if (!key) return data;

  let result = await decryptFields(data, TRANSFER_TASK_FIELDS);

  // Decrypt breakdown amounts
  const breakdown = result.breakdown as
    | Array<{ envelopeId: string; amount: string | number }>
    | undefined;
  if (breakdown && Array.isArray(breakdown)) {
    result = {
      ...result,
      breakdown: await Promise.all(
        breakdown.map(async (item) => {
          if (typeof item.amount === "string") {
            try {
              return {
                envelopeId: item.envelopeId,
                amount: Number(await decrypt(key, item.amount)),
              };
            } catch {
              return item; // Not encrypted (migration)
            }
          }
          return item;
        })
      ),
    };
  }

  return result;
}

// Settings
export async function encryptSettings<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return encryptFields(data, SETTINGS_FIELDS);
}

export async function decryptSettings<T extends Record<string, unknown>>(
  data: T
): Promise<T> {
  return decryptFields(data, SETTINGS_FIELDS);
}

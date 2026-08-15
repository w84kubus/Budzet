/**
 * E2E encryption setup - called during login/register to derive
 * and store the encryption key from the user's password.
 */

import {
  generateSalt,
  deriveKey,
  saltToBase64,
  saltFromBase64,
  createVerificationToken,
  verifyKey,
} from "./crypto";
import { setEncryptionKey, clearEncryptionKey } from "./key-store";
import { getSettings, updateSettings } from "@/lib/firebase/db";

/**
 * Initialize encryption for a NEW user (registration).
 * Generates salt, derives key, returns salt + verify token to save in settings.
 */
export async function initEncryptionForNewUser(password: string): Promise<{
  encryptionSalt: string;
  encryptionVerify: string;
}> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);

  setEncryptionKey(key, salt);

  const saltB64 = saltToBase64(salt);
  const verifyToken = await createVerificationToken(key);

  return {
    encryptionSalt: saltB64,
    encryptionVerify: verifyToken,
  };
}

/**
 * Initialize encryption for an EXISTING user (login).
 * Reads salt from settings, derives key, verifies it.
 * Returns true if encryption is set up and key is verified.
 */
export async function initEncryptionForLogin(
  budgetId: string,
  password: string
): Promise<boolean> {
  const settings = await getSettings(budgetId);

  if (!settings || !settings.encryptionSalt || !settings.encryptionVerify) {
    // No encryption set up yet - set it up now (migration)
    console.log("[E2E] No encryption metadata found - migrating...");
    const result = await migrateToEncryption(budgetId, password);
    console.log("[E2E] Migration complete. Encryption is now active.");
    return result;
  }

  console.log("[E2E] Encryption metadata found - deriving key...");
  const salt = saltFromBase64(settings.encryptionSalt);
  const key = await deriveKey(password, salt);

  const isValid = await verifyKey(key, settings.encryptionVerify);
  if (!isValid) {
    console.error("[E2E] Key verification FAILED - wrong password or corrupted token");
    clearEncryptionKey();
    return false;
  }

  setEncryptionKey(key, salt);
  console.log("[E2E] Key verified and ready. Encryption active.");
  return true;
}

/**
 * Migrate an existing unencrypted account to E2E encryption.
 * Generates salt + key, saves encryption metadata to settings.
 * Existing data will be re-encrypted on next write (lazy migration).
 */
async function migrateToEncryption(
  budgetId: string,
  password: string
): Promise<boolean> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);

  setEncryptionKey(key, salt);

  const saltB64 = saltToBase64(salt);
  const verifyToken = await createVerificationToken(key);

  await updateSettings(budgetId, {
    encryptionSalt: saltB64,
    encryptionVerify: verifyToken,
  });

  return true;
}

/**
 * Clear encryption state on sign-out.
 */
export function teardownEncryption(): void {
  clearEncryptionKey();
}

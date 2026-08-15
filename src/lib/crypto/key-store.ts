/**
 * Module-level singleton for the E2E encryption key.
 * The key lives only in memory - never persisted to disk or localStorage.
 * Cleared on sign-out or page refresh (= re-enter password).
 */

let _key: CryptoKey | null = null;
let _salt: Uint8Array | null = null;

export function setEncryptionKey(key: CryptoKey, salt: Uint8Array): void {
  _key = key;
  _salt = salt;
}

export function getEncryptionKey(): CryptoKey | null {
  return _key;
}

export function getEncryptionSalt(): Uint8Array | null {
  return _salt;
}

export function clearEncryptionKey(): void {
  _key = null;
  _salt = null;
}

export function isEncryptionReady(): boolean {
  return _key !== null;
}

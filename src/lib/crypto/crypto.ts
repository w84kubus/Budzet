/**
 * Core E2E encryption using Web Crypto API.
 * AES-256-GCM with PBKDF2 key derivation from user password.
 * Zero external dependencies.
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 32;
const VERIFICATION_PLAINTEXT = "BUDGET_E2E_VERIFIED";

// ─── Salt ───────────────────────────────────────────────────────────────────

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export function saltToBase64(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt));
}

export function saltFromBase64(encoded: string): Uint8Array {
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
}

// ─── Key derivation ─────────────────────────────────────────────────────────

export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt / Decrypt ──────────────────────────────────────────────────────

export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // IV (12 bytes) + ciphertext+tag
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
  key: CryptoKey,
  encoded: string
): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ─── Verification token ─────────────────────────────────────────────────────

export async function createVerificationToken(
  key: CryptoKey
): Promise<string> {
  return encrypt(key, VERIFICATION_PLAINTEXT);
}

export async function verifyKey(
  key: CryptoKey,
  token: string
): Promise<boolean> {
  try {
    const decrypted = await decrypt(key, token);
    return decrypted === VERIFICATION_PLAINTEXT;
  } catch {
    return false;
  }
}

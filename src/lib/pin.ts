/**
 * PIN hashing with PBKDF2 (Web Crypto API).
 * Salt is generated on creation and stored alongside the hash.
 * Format: "salt:hash" (both hex-encoded).
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits
const HASH_ALGO = "SHA-256";

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(pin: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    KEY_LENGTH
  );
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(pin, salt.buffer);
  return `${bufToHex(salt.buffer)}:${bufToHex(hash)}`;
}

export async function verifyPin(
  pin: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuf(saltHex);
  const derived = await deriveKey(pin, salt);
  return bufToHex(derived) === hashHex;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

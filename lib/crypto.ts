import crypto from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string containing: iv (12 bytes) + authTag (16 bytes) + ciphertext
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY, "hex"),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV, Auth Tag, and Ciphertext into a single buffer
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypts a base64-encoded ciphertext string.
 */
export function decrypt(ciphertextBase64: string): string {
  const combined = Buffer.from(ciphertextBase64, "base64");

  // Extract the components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY, "hex"),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Hash for deterministic lookup using SHA-256 HMAC.
 */
export function hashForLookup(value: string): string {
  return crypto
    .createHmac("sha256", Buffer.from(env.HASH_KEY, "hex"))
    .update(value.toLowerCase().trim())
    .digest("hex");
}

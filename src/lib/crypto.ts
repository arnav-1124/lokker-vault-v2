/**
 * Standard Web Crypto primitives for Lokker's local-first zero-knowledge vault.
 * - 3-Tier Envelope Encryption: VEK (Vault Encryption Key) wrapped by Password KEK and Recovery KEK
 * - PBKDF2 (SHA-256, 100,000 iterations) for Key Encryption Key (KEK) derivation
 * - AES-GCM 256-bit for VEK & authenticated payload/file encryption
 * - k-Anonymity SHA-1 prefix breach analysis
 * - High-entropy Emergency Recovery Key generation
 */

import { EncryptedVaultData, PasswordEntry, VaultMetadata, WrappedKeySlot } from "@/types";
import { AppError } from "./errors";

const PBKDF2_ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12;

export function bufferToBase64(buffer: ArrayBuffer | ArrayBufferView | ArrayBufferLike): string {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : "buffer" in buffer && buffer.buffer
      ? new Uint8Array(buffer.buffer as ArrayBuffer)
      : new Uint8Array(buffer as ArrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateRandomSalt(length = SALT_SIZE): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  const chunks = hex.match(/.{1,4}/g) || [];
  return chunks.join("-");
}

export function formatRecoveryKey(raw: string): string {
  const clean = raw.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join("-") || clean;
}

export function parseRecoveryKey(formatted: string): string {
  return formatted.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
}

/**
 * Generates a random 256-bit AES-GCM Vault Encryption Key (VEK).
 */
export async function generateVek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Derives an AES-GCM 256-bit Key Encryption Key (KEK) from a password and salt using PBKDF2.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array | string
): Promise<CryptoKey> {
  const saltBytes =
    typeof salt === "string" ? new Uint8Array(base64ToBuffer(salt)) : salt;
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

/**
 * Derives an AES-GCM 256-bit Key Encryption Key (KEK) from a 32-char Recovery Key and salt.
 */
export async function deriveKeyFromRecoveryKey(
  recoveryKey: string,
  salt: Uint8Array | string
): Promise<CryptoKey> {
  const clean = parseRecoveryKey(recoveryKey);
  return deriveKeyFromPassword(clean, salt);
}

/**
 * Wraps (encrypts) a CryptoKey using AES-GCM with a wrapping KEK.
 */
export async function wrapVek(
  vek: CryptoKey,
  kek: CryptoKey
): Promise<WrappedKeySlot> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const wrappedBuffer = await crypto.subtle.wrapKey(
    "raw",
    vek,
    kek,
    { name: "AES-GCM", iv }
  );

  return {
    cipherText: bufferToBase64(wrappedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Unwraps (decrypts) a wrapped key using AES-GCM with an unwrapping KEK.
 */
export async function unwrapVek(
  wrapped: WrappedKeySlot,
  kek: CryptoKey
): Promise<CryptoKey> {
  const iv = new Uint8Array(base64ToBuffer(wrapped.iv));
  const cipherBuffer = new Uint8Array(base64ToBuffer(wrapped.cipherText));

  return crypto.subtle.unwrapKey(
    "raw",
    cipherBuffer,
    kek,
    { name: "AES-GCM", iv },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Creates a verification token encrypted with a KEK to verify keys quickly.
 */
export async function createVerifierToken(
  kek: CryptoKey,
  tokenString = "LOKKER_VERIFY_TOKEN_2026"
): Promise<string> {
  const iv = new Uint8Array(IV_SIZE);
  const enc = new TextEncoder();
  const token = enc.encode(tokenString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    kek,
    token
  );

  return bufferToBase64(encryptedBuffer);
}

/**
 * Verifies if a KEK correctly decrypts a verification token.
 */
export async function verifyToken(
  kek: CryptoKey,
  verifierBase64: string,
  tokenString = "LOKKER_VERIFY_TOKEN_2026"
): Promise<boolean> {
  try {
    const iv = new Uint8Array(IV_SIZE);
    const cipherBuffer = new Uint8Array(base64ToBuffer(verifierBase64));

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      kek,
      cipherBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer) === tokenString;
  } catch {
    return false;
  }
}

export async function createPasswordVerifier(
  password: string,
  saltBase64: string
): Promise<string> {
  const kek = await deriveKeyFromPassword(password, saltBase64);
  return createVerifierToken(kek);
}

export async function verifyMasterPassword(
  password: string,
  saltBase64: string,
  verifierBase64: string
): Promise<boolean> {
  try {
    const kek = await deriveKeyFromPassword(password, saltBase64);
    return verifyToken(kek, verifierBase64);
  } catch {
    return false;
  }
}

/**
 * Initializes a new 3-tier envelope vault (VEK wrapped by Password KEK and Recovery KEK).
 */
export async function initializeEnvelopeVault(
  password: string,
  recoveryKey: string,
  initialData: PasswordEntry[]
): Promise<{ meta: VaultMetadata; vek: CryptoKey }> {
  // 1. Generate random 256-bit VEK
  const vek = await generateVek();

  // 2. Derive Password KEK & Wrap VEK
  const passwordSalt = generateRandomSalt();
  const passwordSaltBase64 = bufferToBase64(passwordSalt);
  const passwordKek = await deriveKeyFromPassword(password, passwordSalt);
  const wrappedVekByPassword = await wrapVek(vek, passwordKek);
  const passwordVerifier = await createVerifierToken(passwordKek);

  // 3. Derive Recovery KEK & Wrap VEK
  const recoverySalt = generateRandomSalt();
  const recoverySaltBase64 = bufferToBase64(recoverySalt);
  const cleanRecoveryKey = parseRecoveryKey(recoveryKey);
  const recoveryKek = await deriveKeyFromPassword(cleanRecoveryKey, recoverySalt);
  const wrappedVekByRecoveryKey = await wrapVek(vek, recoveryKek);
  const recoveryVerifier = await createVerifierToken(recoveryKek, "LOKKER_RECOVERY_TOKEN_2026");

  // 4. Encrypt vault payload with VEK
  const payloadEnc = await encryptPayloadWithVek(initialData, vek);

  const encryptedVault: EncryptedVaultData = {
    cipherText: payloadEnc.cipherText,
    iv: payloadEnc.iv,
    salt: passwordSaltBase64,
    version: 2,
    updatedAt: Date.now(),
  };

  const meta: VaultMetadata = {
    isInitialized: true,
    version: 2,
    salt: passwordSaltBase64,
    verifier: passwordVerifier,
    wrappedVekByPassword,
    recoveryKeySalt: recoverySaltBase64,
    recoveryKeyVerifier: recoveryVerifier,
    wrappedVekByRecoveryKey,
    encryptedVault,
  };

  return { meta, vek };
}

/**
 * Unwraps VEK using Master Password with automatic V1 -> V2 migration support.
 */
export async function unwrapVekWithPassword(
  password: string,
  meta: VaultMetadata
): Promise<{ vek: CryptoKey; migratedMeta?: VaultMetadata; passwords: PasswordEntry[] }> {
  // Case A: V2 Envelope Vault (Has wrappedVekByPassword)
  if (meta.wrappedVekByPassword && meta.salt) {
    if (meta.verifier) {
      const isValid = await verifyMasterPassword(password, meta.salt, meta.verifier);
      if (!isValid) throw new Error("Incorrect master password");
    }

    const passwordKek = await deriveKeyFromPassword(password, meta.salt);
    const vek = await unwrapVek(meta.wrappedVekByPassword, passwordKek);

    if (!meta.encryptedVault) {
      return { vek, passwords: [] };
    }

    const passwords = await decryptPayloadWithVek<PasswordEntry[]>(
      meta.encryptedVault.cipherText,
      meta.encryptedVault.iv,
      vek
    );

    return { vek, passwords };
  }

  // Case B: V1 Legacy Vault Migration (Direct KEK encryption)
  if (meta.encryptedVault && meta.salt) {
    if (meta.verifier) {
      const isValid = await verifyMasterPassword(password, meta.salt, meta.verifier);
      if (!isValid) throw new Error("Incorrect master password");
    }

    // Decrypt V1 payload using legacy direct KEK
    const legacyKey = await deriveKeyFromPassword(password, meta.salt);
    const passwords = await decryptPayload<PasswordEntry[]>(
      meta.encryptedVault.cipherText,
      meta.encryptedVault.iv,
      legacyKey
    );

    // Generate fresh Recovery Key and upgrade to V2 Envelope Vault
    const newRecoveryKey = generateRecoveryKey();
    const { meta: newMeta, vek } = await initializeEnvelopeVault(
      password,
      newRecoveryKey,
      passwords
    );

    return { vek, migratedMeta: newMeta, passwords };
  }

  throw new Error("Invalid vault metadata");
}

/**
 * Unwraps VEK using Emergency Recovery Key.
 */
export async function unwrapVekWithRecoveryKey(
  recoveryKey: string,
  meta: VaultMetadata
): Promise<{ vek: CryptoKey; passwords: PasswordEntry[] }> {
  const clean = parseRecoveryKey(recoveryKey);
  if (clean.length !== 32) {
    throw new Error("Invalid recovery key format");
  }

  if (!meta.wrappedVekByRecoveryKey || !meta.recoveryKeySalt) {
    throw new Error("Recovery key slot not configured in this vault");
  }

  const recoveryKek = await deriveKeyFromPassword(clean, meta.recoveryKeySalt);

  if (meta.recoveryKeyVerifier) {
    const isValid = await verifyToken(recoveryKek, meta.recoveryKeyVerifier, "LOKKER_RECOVERY_TOKEN_2026");
    if (!isValid) {
      throw new Error("Invalid recovery key");
    }
  }

  const vek = await unwrapVek(meta.wrappedVekByRecoveryKey, recoveryKek);

  if (!meta.encryptedVault) {
    return { vek, passwords: [] };
  }

  const passwords = await decryptPayloadWithVek<PasswordEntry[]>(
    meta.encryptedVault.cipherText,
    meta.encryptedVault.iv,
    vek
  );

  return { vek, passwords };
}

/**
 * Rotates Master Password without re-encrypting the vault payload.
 * Re-wraps the same VEK under a new Password KEK.
 */
export async function rotateMasterPassword(
  oldPassword: string,
  newPassword: string,
  meta: VaultMetadata
): Promise<{ updatedMeta: VaultMetadata; vek: CryptoKey }> {
  const { vek } = await unwrapVekWithPassword(oldPassword, meta);

  const newSalt = generateRandomSalt();
  const newSaltBase64 = bufferToBase64(newSalt);
  const newPasswordKek = await deriveKeyFromPassword(newPassword, newSalt);

  const newWrappedVek = await wrapVek(vek, newPasswordKek);
  const newVerifier = await createVerifierToken(newPasswordKek);

  const updatedMeta: VaultMetadata = {
    ...meta,
    version: 2,
    salt: newSaltBase64,
    verifier: newVerifier,
    wrappedVekByPassword: newWrappedVek,
    encryptedVault: meta.encryptedVault
      ? {
          ...meta.encryptedVault,
          salt: newSaltBase64,
          updatedAt: Date.now(),
        }
      : undefined,
  };

  return { updatedMeta, vek };
}

/**
 * Rotates the Emergency Recovery Key without re-encrypting the vault payload
 * and without touching the password or WebAuthn slots. The previous recovery
 * key stops working immediately (its slot is re-wrapped under a new KEK).
 */
export async function rotateRecoveryKey(
  newRecoveryKey: string,
  vek: CryptoKey,
  meta: VaultMetadata
): Promise<VaultMetadata> {
  const clean = parseRecoveryKey(newRecoveryKey);
  if (clean.length !== 32) {
    throw new AppError("Invalid recovery key format for rotation", {
      code: "CRYPTO_INVALID_RECOVERY_KEY",
      userMessage: "The recovery key must be 32 hexadecimal characters (XXXX-XXXX-...).",
    });
  }

  const recoverySalt = generateRandomSalt();
  const recoveryKek = await deriveKeyFromPassword(clean, recoverySalt);
  const wrappedVekByRecoveryKey = await wrapVek(vek, recoveryKek);
  const recoveryVerifier = await createVerifierToken(recoveryKek, "LOKKER_RECOVERY_TOKEN_2026");

  return {
    ...meta,
    recoveryKeySalt: bufferToBase64(recoverySalt),
    recoveryKeyVerifier: recoveryVerifier,
    wrappedVekByRecoveryKey,
  };
}

/**
 * Encrypts arbitrary data using AES-GCM 256-bit with the active VEK.
 */
export async function encryptPayloadWithVek<T>(
  data: T,
  vek: CryptoKey
): Promise<{ cipherText: string; iv: string }> {
  const enc = new TextEncoder();
  const encoded = enc.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    vek,
    encoded
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts AES-GCM 256-bit ciphertext to JSON using the active VEK.
 */
export async function decryptPayloadWithVek<T>(
  cipherText: string,
  ivBase64: string,
  vek: CryptoKey
): Promise<T> {
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const encryptedBuffer = new Uint8Array(base64ToBuffer(cipherText));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    vek,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuffer)) as T;
}

/**
 * Encrypts raw file data (base64 string or binary text) using the active VEK.
 */
export async function encryptFileWithVek(
  fileData: string,
  vek: CryptoKey
): Promise<{ cipherText: string; iv: string }> {
  const enc = new TextEncoder();
  const encoded = enc.encode(fileData);
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    vek,
    encoded
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts encrypted file data using the active VEK.
 */
export async function decryptFileWithVek(
  cipherText: string,
  ivBase64: string,
  vek: CryptoKey
): Promise<string> {
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const encryptedBuffer = new Uint8Array(base64ToBuffer(cipherText));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    vek,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Backward-compatible general payload encryption
export async function encryptPayload<T>(
  data: T,
  key: CryptoKey,
  existingSaltBase64?: string
): Promise<{ cipherText: string; iv: string; salt: string }> {
  const { cipherText, iv } = await encryptPayloadWithVek(data, key);
  const saltBase64 = existingSaltBase64 || bufferToBase64(generateRandomSalt());
  return { cipherText, iv, salt: saltBase64 };
}

export async function decryptPayload<T>(
  cipherText: string,
  ivBase64: string,
  key: CryptoKey
): Promise<T> {
  return decryptPayloadWithVek<T>(cipherText, ivBase64, key);
}

// Password Generator Options
export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar?: boolean;
}

export function generateSecurePassword(
  optionsOrLength: PasswordGeneratorOptions | number = 16,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSymbols = true,
  excludeSimilar = false
): string {
  let opts: PasswordGeneratorOptions;

  if (typeof optionsOrLength === "number") {
    opts = {
      length: optionsOrLength,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeSimilar,
    };
  } else {
    opts = optionsOrLength;
  }

  let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let lowercase = "abcdefghijklmnopqrstuvwxyz";
  let numbers = "0123456789";
  let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (opts.excludeSimilar) {
    uppercase = uppercase.replace(/[IO]/g, "");
    lowercase = lowercase.replace(/[lI10oO]/g, "");
    numbers = numbers.replace(/[01]/g, "");
  }

  let charset = "";
  if (opts.includeUppercase) charset += uppercase;
  if (opts.includeLowercase) charset += lowercase;
  if (opts.includeNumbers) charset += numbers;
  if (opts.includeSymbols) charset += symbols;

  if (!charset) {
    charset = lowercase + numbers;
  }

  const length = opts.length || 16;
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

export function generateMemorablePassphrase(wordCount = 4, separator = "-"): string {
  const wordList = [
    "correct", "horse", "battery", "staple", "galaxy", "quantum", "crypto", "shield",
    "vault", "ember", "aurora", "falcon", "beacon", "summit", "matrix", "vector",
    "harbor", "zenith", "shadow", "timber", "canyon", "orbit", "anchor", "silver",
    "planet", "frost", "citadel", "glacier", "prism", "thunder", "signal", "quartz"
  ];
  const selected: string[] = [];
  const randomBytes = new Uint8Array(wordCount);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < wordCount; i++) {
    const word = wordList[randomBytes[i] % wordList.length];
    selected.push(word.charAt(0).toUpperCase() + word.slice(1));
  }

  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  const randomNum = 10 + (randomValues[0] % 90);
  return selected.join(separator) + separator + randomNum;
}

// Calculate Password Entropy and Strength Rating
export function calculatePasswordStrength(password: string): {
  score: number;
  label: "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
} {
  if (!password) {
    return { score: 0, label: "Weak", color: "text-destructive" };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 40) {
    return { score: 25, label: "Weak", color: "text-destructive" };
  } else if (entropy < 60) {
    return { score: 50, label: "Fair", color: "text-warning" };
  } else if (entropy < 80) {
    return { score: 75, label: "Strong", color: "text-success" };
  } else {
    return { score: 100, label: "Very Strong", color: "text-primary" };
  }
}

// Check if password has been exposed in public breaches using k-Anonymity SHA-1 prefix
export async function checkPasswordBreached(
  password: string
): Promise<{ breached: boolean; count: number }> {
  if (!password) return { breached: false, count: 0 };
  try {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!res.ok) return { breached: false, count: 0 };

    const text = await res.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(":");
      if (lineSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) || 1 };
      }
    }

    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}

/**
 * Lokker Full Vault Backup & Portability Engine
 * Complete zero-knowledge export, AES-GCM 256-bit encryption, schema validation,
 * decryption, and restoration across any machine/browser.
 */

import {
  Bookmark,
  Category,
  EncryptedFile,
  LokkerBackupPayload,
  LokkerEncryptedBackupFile,
  PasswordEntry,
  VaultMetadata,
  VaultSettings,
  BackupSummary,
} from "@/types";
import {
  bufferToBase64,
  decryptPayload,
  deriveKeyFromPassword,
  encryptPayload,
  generateRandomSalt,
} from "./crypto";

export const LOKKER_BACKUP_SCHEMA_VERSION = 2;
export const LOKKER_BACKUP_APP_NAME = "Lokker";
export const LOKKER_BACKUP_APP_VERSION = "0.1.0";

/**
 * Creates a validated full Lokker backup payload containing every piece of user-owned state.
 */
export function createLokkerBackupPayload(params: {
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
  settings: VaultSettings;
  files: EncryptedFile[];
  vaultMeta?: VaultMetadata | null;
}): LokkerBackupPayload {
  const { passwords, bookmarks, categories, settings, files, vaultMeta } = params;

  return {
    version: LOKKER_BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    application: {
      name: LOKKER_BACKUP_APP_NAME,
      version: LOKKER_BACKUP_APP_VERSION,
    },
    vaultMeta: vaultMeta || undefined,
    passwords: Array.isArray(passwords) ? passwords : [],
    bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
    categories: Array.isArray(categories) ? categories : [],
    settings: settings || {
      autoLockMinutes: 15,
      requireConfirmationForAutofill: true,
      trustedDomains: [],
    },
    files: Array.isArray(files) ? files : [],
  };
}

/**
 * Computes a high-level summary of a backup payload without exposing secrets.
 */
export function summarizeBackupPayload(payload: LokkerBackupPayload): BackupSummary {
  const passwords = Array.isArray(payload.passwords) ? payload.passwords : [];
  const bookmarks = Array.isArray(payload.bookmarks) ? payload.bookmarks : [];
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const files = Array.isArray(payload.files) ? payload.files : [];

  const totpCount = passwords.filter((p) => !!p.totpSecret && p.totpSecret.trim().length > 0).length;
  const nestedCategoryCount = categories.filter((c) => !!c.parentId && c.parentId.trim().length > 0).length;

  return {
    passwordCount: passwords.length,
    bookmarkCount: bookmarks.length,
    categoryCount: categories.length,
    nestedCategoryCount,
    totpCount,
    fileCount: files.length,
    hasSettings: !!payload.settings,
    hasVaultMeta: !!payload.vaultMeta && !!payload.vaultMeta.isInitialized,
    version: payload.version || 1,
    exportedAt: payload.exportedAt,
  };
}

/**
 * Encrypts a full Lokker backup payload using AES-GCM 256-bit with a freshly derived Backup KEK.
 */
export async function exportEncryptedLokkerBackup(
  payload: LokkerBackupPayload,
  backupPassword: string
): Promise<LokkerEncryptedBackupFile> {
  if (!backupPassword || backupPassword.length === 0) {
    throw new Error("A master password is required to encrypt the backup.");
  }

  const saltUint8 = generateRandomSalt(16);
  const saltBase64 = bufferToBase64(saltUint8);

  const backupKey = await deriveKeyFromPassword(backupPassword, saltBase64);
  const { cipherText, iv } = await encryptPayload(payload, backupKey);

  return {
    format: "lokker-encrypted-backup",
    version: LOKKER_BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    application: {
      name: LOKKER_BACKUP_APP_NAME,
      version: LOKKER_BACKUP_APP_VERSION,
    },
    crypto: {
      kdf: "PBKDF2-SHA256",
      iterations: 100000,
      salt: saltBase64,
      algorithm: "AES-GCM-256",
      iv,
    },
    cipherText,
  };
}

export interface BackupInspectionResult {
  isLokkerBackup: boolean;
  isEncrypted: boolean;
  encryptedFile?: LokkerEncryptedBackupFile;
  decryptedPayload?: LokkerBackupPayload;
  summary?: BackupSummary;
  isExternalFormat?: boolean;
}

/**
 * Parses and inspects an uploaded backup file string without executing unsafe operations.
 */
export function inspectBackupFileText(fileText: string): BackupInspectionResult {
  let data: any;
  try {
    data = JSON.parse(fileText);
  } catch {
    return {
      isLokkerBackup: false,
      isEncrypted: false,
      isExternalFormat: true,
    };
  }

  // 1. Standard Lokker Encrypted Backup V2
  if (
    (data.format === "lokker-encrypted-backup" || data.isEncryptedBackup) &&
    data.cipherText
  ) {
    const salt = data.crypto?.salt || data.salt;
    const iv = data.crypto?.iv || data.iv;

    if (!salt || !iv) {
      throw new Error("Invalid encrypted backup: Missing cryptographic salt or initialization vector.");
    }

    const encryptedFile: LokkerEncryptedBackupFile = {
      format: "lokker-encrypted-backup",
      version: data.version || 2,
      exportedAt: data.exportedAt || new Date().toISOString(),
      application: {
        name: LOKKER_BACKUP_APP_NAME,
        version: data.application?.version || LOKKER_BACKUP_APP_VERSION,
      },
      crypto: {
        kdf: "PBKDF2-SHA256",
        iterations: data.crypto?.iterations || 100000,
        salt,
        algorithm: "AES-GCM-256",
        iv,
      },
      cipherText: data.cipherText,
    };

    return {
      isLokkerBackup: true,
      isEncrypted: true,
      encryptedFile,
    };
  }

  // 2. Unencrypted Lokker Backup
  if (
    data.format === "lokker-unencrypted-backup" ||
    (Array.isArray(data.passwords) && (Array.isArray(data.bookmarks) || Array.isArray(data.categories)))
  ) {
    const payload: LokkerBackupPayload = {
      version: data.version || 1,
      exportedAt: data.exportedAt || new Date().toISOString(),
      application: {
        name: LOKKER_BACKUP_APP_NAME,
        version: data.application?.version || LOKKER_BACKUP_APP_VERSION,
      },
      vaultMeta: data.vaultMeta,
      passwords: Array.isArray(data.passwords) ? data.passwords : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      settings: data.settings || {
        autoLockMinutes: 15,
        requireConfirmationForAutofill: true,
        trustedDomains: [],
      },
      files: Array.isArray(data.files) ? data.files : [],
    };

    return {
      isLokkerBackup: true,
      isEncrypted: false,
      decryptedPayload: payload,
      summary: summarizeBackupPayload(payload),
    };
  }

  // 3. External manager backup format (Bitwarden JSON, etc.)
  return {
    isLokkerBackup: false,
    isEncrypted: false,
    isExternalFormat: true,
  };
}

/**
 * Decrypts and validates an encrypted Lokker backup file using the user-provided password.
 */
export async function decryptAndValidateLokkerBackup(
  encryptedFile: LokkerEncryptedBackupFile,
  password: string
): Promise<{ payload: LokkerBackupPayload; summary: BackupSummary }> {
  if (!password) {
    throw new Error("Password is required to decrypt backup.");
  }

  const salt = encryptedFile.crypto.salt;
  const iv = encryptedFile.crypto.iv;

  let key: CryptoKey;
  try {
    key = await deriveKeyFromPassword(password, salt);
  } catch {
    throw new Error("Failed to derive cryptographic key from backup password.");
  }

  let decryptedRaw: any;
  try {
    decryptedRaw = await decryptPayload<any>(encryptedFile.cipherText, iv, key);
  } catch {
    throw new Error("Incorrect backup password or corrupted backup ciphertext.");
  }

  if (!decryptedRaw || typeof decryptedRaw !== "object") {
    throw new Error("Decrypted backup content is invalid.");
  }

  // Normalize into standard LokkerBackupPayload
  const payload: LokkerBackupPayload = {
    version: decryptedRaw.version || 2,
    exportedAt: decryptedRaw.exportedAt || encryptedFile.exportedAt,
    application: {
      name: LOKKER_BACKUP_APP_NAME,
      version: decryptedRaw.application?.version || LOKKER_BACKUP_APP_VERSION,
    },
    vaultMeta: decryptedRaw.vaultMeta,
    passwords: Array.isArray(decryptedRaw.passwords) ? decryptedRaw.passwords : [],
    bookmarks: Array.isArray(decryptedRaw.bookmarks) ? decryptedRaw.bookmarks : [],
    categories: Array.isArray(decryptedRaw.categories) ? decryptedRaw.categories : [],
    settings: decryptedRaw.settings || {
      autoLockMinutes: 15,
      requireConfirmationForAutofill: true,
      trustedDomains: [],
    },
    files: Array.isArray(decryptedRaw.files) ? decryptedRaw.files : [],
  };

  const summary = summarizeBackupPayload(payload);
  return { payload, summary };
}

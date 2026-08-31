export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  parentId?: string;
  isDefault?: boolean;
}

export type EntryType = "login" | "card" | "note" | "identity";

export interface PasswordHistoryItem {
  password: string;
  changedAt: number;
}

export interface CardDetails {
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

export interface PasswordEntry {
  id: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  history?: PasswordHistoryItem[];
  totpSecret?: string;
  entryType?: EntryType;
  cardDetails?: CardDetails;
}

export interface EncryptedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // AES-GCM encrypted ciphertext in base64 (or legacy plaintext base64)
  iv?: string; // AES-GCM IV in base64
  salt?: string;
  isEncrypted?: boolean;
  createdAt: number;
}

export interface EncryptedVaultData {
  cipherText: string;
  iv: string;
  salt: string;
  version: number;
  updatedAt: number;
}

export interface WrappedKeySlot {
  cipherText: string;
  iv: string;
}

export interface VaultMetadata {
  isInitialized: boolean;
  version?: number; // 1 = legacy direct KEK, 2 = 3-tier VEK envelope
  salt: string;
  verifier?: string;
  wrappedVekByPassword?: WrappedKeySlot;
  recoveryKeySalt?: string;
  recoveryKeyVerifier?: string;
  wrappedVekByRecoveryKey?: WrappedKeySlot;
  encryptedVault?: EncryptedVaultData;
}

export interface VaultSettings {
  autoLockMinutes: number;
  requireConfirmationForAutofill: boolean;
  trustedDomains: string[];
  duckEnabled?: boolean;
  duckToken?: string;
  lastBackupTime?: number;
  webAuthnEnabled?: boolean;
}

export interface LokkerBackupPayload {
  version: number;
  exportedAt: string;
  application: {
    name: "Lokker";
    version: string;
  };
  vaultMeta?: VaultMetadata;
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
  settings: VaultSettings;
  files: EncryptedFile[];
}

export interface LokkerEncryptedBackupFile {
  format: "lokker-encrypted-backup";
  version: number;
  exportedAt: string;
  application: {
    name: "Lokker";
    version: string;
  };
  crypto: {
    kdf: "PBKDF2-SHA256";
    iterations: number;
    salt: string;
    algorithm: "AES-GCM-256";
    iv: string;
  };
  cipherText: string;
}

export interface BackupSummary {
  passwordCount: number;
  bookmarkCount: number;
  categoryCount: number;
  nestedCategoryCount: number;
  totpCount: number;
  fileCount: number;
  hasSettings: boolean;
  hasVaultMeta: boolean;
  version: number;
  exportedAt?: string;
}

export type ViewMode =
  | "home"
  | "passwords"
  | "bookmarks"
  | "totp"
  | "security-audit"
  | "generator"
  | "import-export"
  | "files"
  | "masked-emails"
  | "favorites"
  | "guide"
  | "settings"
  | "extension";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

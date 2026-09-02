/**
 * Shared types for the vault context domains and the merged VaultContextType.
 *
 * The vault context is split into focused providers (see vault-provider.tsx):
 * UI, Navigation, Security, Data, and Backup. `VaultContextType` is their
 * intersection — the merged shape consumed via `useVault()`.
 */

import type * as React from "react";
import type {
  Bookmark,
  Category,
  PasswordEntry,
  VaultMetadata,
  VaultSettings,
  ViewMode,
  ToastMessage,
  LokkerBackupPayload,
  LokkerEncryptedBackupFile,
} from "@/types";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export interface DeleteTransferDialogState {
  categoryId: string;
  categoryName: string;
  passwordCount: number;
  bookmarkCount: number;
  childCount: number;
}

// ==========================================
// Navigation — URL-derived view state
// ==========================================

export interface VaultNavigationContextType {
  currentView: ViewMode;
  navigateTo: (view: ViewMode) => void;
}

// ==========================================
// UI — modal/dialog/toast/workspace UI state
// ==========================================

export interface VaultUIContextType {
  // Workspace filter state
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Modal states
  isMasterPasswordModalOpen: boolean;
  setIsMasterPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingPassword: PasswordEntry | null;
  setEditingPassword: React.Dispatch<React.SetStateAction<PasswordEntry | null>>;
  isBookmarkModalOpen: boolean;
  setIsBookmarkModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingBookmark: Bookmark | null;
  setEditingBookmark: React.Dispatch<React.SetStateAction<Bookmark | null>>;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  categoryModalParentId: string | undefined;
  setCategoryModalParentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExtensionGuideOpen: boolean;
  setIsExtensionGuideOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isImportBackupModalOpen: boolean;
  setIsImportBackupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBackupPasswordModalOpen: boolean;
  setIsBackupPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pendingEncryptedBackup: LokkerEncryptedBackupFile | null;
  setPendingEncryptedBackup: React.Dispatch<React.SetStateAction<LokkerEncryptedBackupFile | null>>;
  pendingUnencryptedBackup: LokkerBackupPayload | null;
  setPendingUnencryptedBackup: React.Dispatch<React.SetStateAction<LokkerBackupPayload | null>>;

  // Confirmation dialog
  confirmDialog: ConfirmDialogState | null;

  // Category delete-transfer dialog
  deleteTransferDialog: DeleteTransferDialogState | null;
  setDeleteTransferDialog: React.Dispatch<React.SetStateAction<DeleteTransferDialogState | null>>;

  // Toast & Confirm
  toasts: ToastMessage[];
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  dismissToast: (id: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
  dismissConfirm: () => void;
}

// ==========================================
// Security — vault keys, lock state, crypto flows
// ==========================================

export interface VaultSecurityContextType {
  vaultMeta: VaultMetadata | null;
  isUnlocked: boolean;
  derivedKey: CryptoKey | null;
  decryptedPasswords: PasswordEntry[];

  // Vault security policy (auto-lock, autofill confirmation, trusted domains)
  settings: VaultSettings;
  updateSettings: (s: VaultSettings) => Promise<void>;
  setSettingsState: React.Dispatch<React.SetStateAction<VaultSettings>>;

  // Narrow state setters for cross-domain flows (backup restore / reset)
  setVaultMeta: React.Dispatch<React.SetStateAction<VaultMetadata | null>>;
  setIsUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  setDerivedKey: React.Dispatch<React.SetStateAction<CryptoKey | null>>;
  setDecryptedPasswords: React.Dispatch<React.SetStateAction<PasswordEntry[]>>;

  // Handlers
  lockVault: () => void;
  handleMasterPasswordSubmit: (password: string, isSetup: boolean, recoveryKey?: string) => Promise<boolean>;
  handleUnlockWithRecoveryKey: (recoveryKey: string) => Promise<boolean>;
  handleUnlockWithWebAuthn: () => Promise<boolean>;
  handleRegisterWebAuthn: () => Promise<void>;
  handleUnregisterWebAuthn: () => Promise<void>;
  handleVerifyMasterPassword: (password: string) => Promise<boolean>;
  handleChangeMasterPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  handleRegenerateRecoveryKey: (newRecoveryKey: string) => Promise<boolean>;

  // Re-encrypt helper shared with the data layer
  saveAndEncryptPasswords: (newPasswords: PasswordEntry[]) => Promise<void>;
}

// ==========================================
// Data — bookmarks, categories, settings, entry CRUD
// ==========================================

export interface VaultDataContextType {
  bookmarks: Bookmark[];
  categories: Category[];

  // Narrow state setters for cross-domain flows (backup restore)
  setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;

  handleSavePassword: (entry: PasswordEntry) => Promise<void>;
  handleDeletePassword: (id: string) => Promise<void>;
  handleTogglePasswordFavorite: (id: string) => Promise<void>;
  handleSaveBookmark: (bookmark: Bookmark) => Promise<void>;
  handleDeleteBookmark: (id: string) => Promise<void>;
  handleToggleBookmarkFavorite: (id: string) => Promise<void>;
  handleAddCategory: (name: string, color: string, parentId?: string) => Promise<void>;
  handleDeleteCategory: (id: string) => Promise<void>;
  handleTransferAndDelete: (targetCategoryId: string, transferToCatName: string) => Promise<void>;
  handleRenameCategory: (id: string, newName: string) => Promise<void>;
  handleCopyText: (text: string, label: string) => void;
}

// ==========================================
// Backup — export / import / CSV / reset
// ==========================================

export interface VaultBackupContextType {
  handleExportEncryptedBackup: () => Promise<void>;
  handleBackupPasswordSubmit: (password: string) => Promise<boolean>;
  handleExportUnencryptedBackup: () => Promise<void>;
  handleImportLokkerBackupFile: (file: File) => void;
  handleImportExternalFile: (file: File) => void;
  handleExportCSV: () => void;
  handleConfirmRestoreBackup: (payload: LokkerBackupPayload, strategy: "merge" | "replace") => Promise<void>;
  handleResetVault: () => Promise<void>;
}

export type VaultContextType = VaultNavigationContextType &
  VaultUIContextType &
  VaultSecurityContextType &
  VaultDataContextType &
  VaultBackupContextType;

"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
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
import {
  getBookmarks,
  saveBookmark,
  saveAllBookmarks,
  deleteBookmarkDB,
  getCategories,
  saveCategoryDB,
  saveAllCategories,
  getVaultMeta,
  saveVaultMeta,
  getSettings,
  saveSettings,
  resetDatabase,
  getEncryptedFiles,
  saveEncryptedFile,
} from "@/lib/db";
import {
  initializeEnvelopeVault,
  unwrapVekWithPassword,
  unwrapVekWithRecoveryKey,
  encryptPayloadWithVek,
  verifyMasterPassword,
} from "@/lib/crypto";
import {
  registerWebAuthnCredential,
  authenticateWithWebAuthn,
  clearWebAuthnSlot,
} from "@/lib/webauthn";
import {
  createLokkerBackupPayload,
  exportEncryptedLokkerBackup,
  inspectBackupFileText,
} from "@/lib/backup";
import { parseCSVToEntries, parseJSONBackupText } from "@/lib/importers";
import { downloadTextFile } from "@/lib/download";
import { INITIAL_DEMO_VAULT_ITEMS } from "@/lib/sampleData";

// ==========================================
// Pathname ↔ ViewMode mapping
// ==========================================

const VIEW_TO_PATH: Record<ViewMode, string> = {
  home: "/app",
  passwords: "/app/passwords",
  bookmarks: "/app/bookmarks",
  totp: "/app/totp",
  favorites: "/app/favorites",
  "security-audit": "/app/security-audit",
  generator: "/app/generator",
  "import-export": "/app/import-export",
  files: "/app/files",
  "masked-emails": "/app/masked-emails",
  extension: "/app/extension",
  guide: "/app/guide",
  settings: "/app/settings",
};

const PATH_TO_VIEW: Record<string, ViewMode> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([k, v]) => [v, k as ViewMode])
);

function viewFromPath(pathname: string): ViewMode {
  return PATH_TO_VIEW[pathname] || "home";
}

// ==========================================
// Types
// ==========================================

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface DeleteTransferDialogState {
  categoryId: string;
  categoryName: string;
  passwordCount: number;
  bookmarkCount: number;
  childCount: number;
}

export interface VaultContextType {
  // Data
  bookmarks: Bookmark[];
  categories: Category[];
  settings: VaultSettings;
  vaultMeta: VaultMetadata | null;
  isUnlocked: boolean;
  derivedKey: CryptoKey | null;
  decryptedPasswords: PasswordEntry[];

  // Navigation
  currentView: ViewMode;
  navigateTo: (view: ViewMode) => void;
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
  confirmDialog: ConfirmDialogState | null;
  deleteTransferDialog: DeleteTransferDialogState | null;
  setDeleteTransferDialog: React.Dispatch<React.SetStateAction<DeleteTransferDialogState | null>>;

  // Handlers
  lockVault: () => void;
  handleMasterPasswordSubmit: (password: string, isSetup: boolean, recoveryKey?: string) => Promise<boolean>;
  handleUnlockWithRecoveryKey: (recoveryKey: string) => Promise<boolean>;
  handleUnlockWithWebAuthn: () => Promise<boolean>;
  handleRegisterWebAuthn: () => Promise<void>;
  handleUnregisterWebAuthn: () => Promise<void>;
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
  handleExportEncryptedBackup: () => Promise<void>;
  handleBackupPasswordSubmit: (password: string) => Promise<boolean>;
  handleExportUnencryptedBackup: () => Promise<void>;
  handleImportLokkerBackupFile: (file: File) => void;
  handleImportExternalFile: (file: File) => void;
  handleExportCSV: () => void;
  handleConfirmRestoreBackup: (payload: LokkerBackupPayload, strategy: "merge" | "replace") => Promise<void>;
  handleResetVault: () => Promise<void>;
  updateSettings: (s: VaultSettings) => Promise<void>;

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
// Context
// ==========================================

const VaultContext = React.createContext<VaultContextType | null>(null);

export function useVault(): VaultContextType {
  const ctx = React.useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}

// ==========================================
// Utility
// ==========================================

function normalizeHost(str: string): string {
  if (!str) return "";
  try {
    const raw = str.startsWith("http") ? str : `https://${str}`;
    return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return str.trim().toLowerCase();
  }
}

// ==========================================
// Provider
// ==========================================

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Navigation state — derived from URL
  const [currentView, setCurrentView] = React.useState<ViewMode>(() => viewFromPath(pathname));
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Sync URL → currentView (e.g. direct URL access or browser back/forward)
  React.useEffect(() => {
    const view = viewFromPath(pathname);
    setCurrentView(view);
  }, [pathname]);

  const navigateTo = React.useCallback((view: ViewMode) => {
    setCurrentView(view);
    router.push(VIEW_TO_PATH[view]);
  }, [router]);

  // Storage state
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [settings, setSettingsState] = React.useState<VaultSettings>({
    autoLockMinutes: 15,
    requireConfirmationForAutofill: true,
    trustedDomains: ["github.com", "google.com", "notion.so", "vercel.com"],
  });

  // Vault Security State
  // NOTE: the master password is intentionally never kept in React state —
  // it exists only inside the unlock/setup handler scope. Backup export
  // re-asks for it through BackupPasswordModal and verifies it on submit.
  const [vaultMeta, setVaultMeta] = React.useState<VaultMetadata | null>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [derivedKey, setDerivedKey] = React.useState<CryptoKey | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = React.useState<PasswordEntry[]>([]);

  // Modal states
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = React.useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState<PasswordEntry | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [categoryModalParentId, setCategoryModalParentId] = React.useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isExtensionGuideOpen, setIsExtensionGuideOpen] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isImportBackupModalOpen, setIsImportBackupModalOpen] = React.useState(false);
  const [isBackupPasswordModalOpen, setIsBackupPasswordModalOpen] = React.useState(false);
  const [pendingEncryptedBackup, setPendingEncryptedBackup] = React.useState<LokkerEncryptedBackupFile | null>(null);
  const [pendingUnencryptedBackup, setPendingUnencryptedBackup] = React.useState<LokkerBackupPayload | null>(null);

  // When a linked-entry edit modal is opened from a sync suggestion, the next
  // save must not trigger the mirrored suggestion again (ping-pong guard).
  const skipSyncSuggestionRef = React.useRef(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);

  // Category delete-transfer dialog
  const [deleteTransferDialog, setDeleteTransferDialog] = React.useState<DeleteTransferDialogState | null>(null);

  // Toast system
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToasts((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      return [...prev, { id, text, type }];
    });
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = React.useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      isDestructive?: boolean,
      confirmText?: string,
      cancelText?: string
    ) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        // Close the current dialog BEFORE running the callback so a callback
        // can chain a follow-up confirm (e.g. cross-delete prompts) without
        // being wiped by this cleanup.
        onConfirm: () => {
          setConfirmDialog(null);
          onConfirm();
        },
        confirmText,
        cancelText,
        isDestructive,
      });
    },
    []
  );

  // ==========================================
  // Effects
  // ==========================================

  // Initialize DB data
  React.useEffect(() => {
    async function loadData() {
      try {
        const [bms, cats, meta, st] = await Promise.all([
          getBookmarks(),
          getCategories(),
          getVaultMeta(),
          getSettings(),
        ]);
        setBookmarks(bms);
        setCategories(cats);
        setVaultMeta(meta);
        setSettingsState(st);
        if (!meta || !meta.isInitialized) {
          setIsMasterPasswordModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to load vault database:", err);
      }
    }
    loadData();
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Extension sync bridge
  React.useEffect(() => {
    if (vaultMeta && typeof window !== "undefined") {
      window.postMessage(
        { type: "LOKKER_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
        window.location.origin
      );
      window.postMessage(
        { type: "XEROX_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
        window.location.origin
      );
    }
  }, [vaultMeta]);

  // Extension ping listener
  React.useEffect(() => {
    const handleExtensionPing = (event: MessageEvent) => {
      if (
        event.data?.type === "LOKKER_EXTENSION_READY" ||
        event.data?.type === "XEROX_EXTENSION_READY" ||
        event.data?.type === "LOKKER_REQUEST_VAULT_SYNC"
      ) {
        if (vaultMeta) {
          window.postMessage(
            { type: "LOKKER_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
            window.location.origin
          );
        }
      }
    };
    window.addEventListener("message", handleExtensionPing);
    return () => window.removeEventListener("message", handleExtensionPing);
  }, [vaultMeta]);

  // ==========================================
  // Vault Operations
  // ==========================================

  const lockVault = React.useCallback(() => {
    setIsUnlocked(false);
    setDerivedKey(null);
    setDecryptedPasswords([]);
    if (typeof window !== "undefined") {
      window.postMessage({ type: "LOKKER_VAULT_LOCKED" }, window.location.origin);
      window.postMessage({ type: "XEROX_VAULT_LOCKED" }, window.location.origin);
    }
    addToast("Password Vault locked.", "info");
  }, [addToast]);

  // Auto-lock timer
  React.useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes === 0) return;
    const timer = setTimeout(() => lockVault(), settings.autoLockMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isUnlocked, settings.autoLockMinutes, lockVault]);

  const handleMasterPasswordSubmit = async (
    password: string,
    isSetup: boolean,
    recoveryKey?: string
  ): Promise<boolean> => {
    if (isSetup) {
      if (!recoveryKey) return false;
      try {
        const { meta, vek } = await initializeEnvelopeVault(password, recoveryKey, INITIAL_DEMO_VAULT_ITEMS);
        await saveVaultMeta(meta);
        setVaultMeta(meta);
        setDerivedKey(vek);
        setDecryptedPasswords(INITIAL_DEMO_VAULT_ITEMS);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);
        addToast("Local vault initialized with 3-tier AES-GCM envelope encryption!", "success");
        return true;
      } catch (err) {
        console.error("Setup error:", err);
        return false;
      }
    } else {
      if (!vaultMeta || !vaultMeta.encryptedVault) return false;
      try {
        const { vek, migratedMeta, passwords } = await unwrapVekWithPassword(password, vaultMeta);
        if (migratedMeta) {
          await saveVaultMeta(migratedMeta);
          setVaultMeta(migratedMeta);
        }
        setDerivedKey(vek);
        setDecryptedPasswords(passwords);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);
        addToast("Password Vault unlocked.", "success");
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleUnlockWithRecoveryKey = async (recoveryKey: string): Promise<boolean> => {
    if (!vaultMeta) return false;
    try {
      const { vek, passwords } = await unwrapVekWithRecoveryKey(recoveryKey, vaultMeta);
      setDerivedKey(vek);
      setDecryptedPasswords(passwords);
      setIsUnlocked(true);
      setIsMasterPasswordModalOpen(false);
      addToast("Vault unlocked with Emergency Recovery Key!", "success");
      return true;
    } catch {
      return false;
    }
  };

  const handleUnlockWithWebAuthn = async (): Promise<boolean> => {
    if (!vaultMeta) return false;
    try {
      const { vek, passwords } = await authenticateWithWebAuthn(vaultMeta);
      setDerivedKey(vek);
      setDecryptedPasswords(passwords);
      setIsUnlocked(true);
      setIsMasterPasswordModalOpen(false);
      addToast("Vault unlocked with Passkey!", "success");
      return true;
    } catch (err) {
      // Surface the specific failure reason (e.g. missing PRF support) to the
      // unlock modal instead of a generic "authentication failed".
      throw err instanceof Error ? err : new Error("Passkey unlock failed.");
    }
  };

  const handleRegisterWebAuthn = async () => {
    if (!derivedKey || !vaultMeta) throw new Error("Vault must be unlocked to register a passkey.");
    const result = await registerWebAuthnCredential(derivedKey);
    const updatedMeta: VaultMetadata = {
      ...vaultMeta,
      webauthnCredentialId: result.credentialIdBase64,
      webauthnUserHandle: result.userHandleBase64,
      webauthnSalt: result.saltBase64,
      wrappedVekByWebAuthn: result.wrappedSlot,
      webauthnVerifier: result.verifier,
    };
    await saveVaultMeta(updatedMeta);
    setVaultMeta(updatedMeta);
    addToast("Passkey registered successfully. You can now unlock with biometrics.", "success");
  };

  const handleUnregisterWebAuthn = async () => {
    if (!vaultMeta) throw new Error("No vault metadata found.");
    const cleanedMeta = clearWebAuthnSlot(vaultMeta);
    await saveVaultMeta(cleanedMeta);
    setVaultMeta(cleanedMeta);
    addToast("Passkey removed. Biometric unlock is no longer available.", "info");
  };

  // ==========================================
  // Re-encrypt helper
  // ==========================================

  const saveAndEncryptPasswords = async (newPasswords: PasswordEntry[]) => {
    setDecryptedPasswords(newPasswords);
    if (!derivedKey || !vaultMeta || !vaultMeta.encryptedVault) return;
    try {
      const { cipherText, iv } = await encryptPayloadWithVek(newPasswords, derivedKey);
      const updatedMeta: VaultMetadata = {
        ...vaultMeta,
        encryptedVault: {
          ...vaultMeta.encryptedVault,
          cipherText,
          iv,
          version: 2,
          updatedAt: Date.now(),
        },
      };
      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
    } catch {
      addToast("Failed to re-encrypt vault data.", "error");
    }
  };

  // ==========================================
  // Bookmark Handlers
  // ==========================================

  const handleSaveBookmark = async (bookmark: Bookmark) => {
    const existingIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
    const updatedBookmarks =
      existingIndex >= 0
        ? bookmarks.map((b) => (b.id === bookmark.id ? bookmark : b))
        : [bookmark, ...bookmarks];
    setBookmarks(updatedBookmarks);
    await saveBookmark(bookmark);

    const bmHost = normalizeHost(bookmark.url || bookmark.title);
    const linkedPassword = decryptedPasswords.find(
      (p) => normalizeHost(p.websiteUrl || p.websiteName) === bmHost
    );

    if (linkedPassword) {
      if (skipSyncSuggestionRef.current) {
        // This save came from a linked-entry suggestion; don't mirror back.
        skipSyncSuggestionRef.current = false;
        addToast(existingIndex >= 0 ? "Bookmark updated." : "Bookmark saved.", "success");
        return;
      }
      addToast(existingIndex >= 0 ? "Bookmark updated." : "Bookmark saved.", "success");
      showConfirm(
        "Linked Password Entry Found",
        `A password entry for "${bmHost}" already exists. Do you want to edit it now? (Nothing is overwritten without your confirmation.)`,
        () => {
          setEditingPassword(linkedPassword);
          setIsPasswordModalOpen(true);
          skipSyncSuggestionRef.current = true;
        },
        false,
        "Edit Password Entry",
        "Not Now"
      );
      return;
    }

    // Add-sync: creating a bookmark creates its password entry with empty
    // credentials so the extension can already match the domain. The vault
    // must be unlocked for the entry to be encrypted and persisted.
    if (!isUnlocked) {
      addToast("Bookmark saved. Unlock the vault to link a password entry.", "success");
      return;
    }
    const newPwd: PasswordEntry = {
      id: "pwd-sync-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      websiteName: bookmark.title,
      websiteUrl: bookmark.url,
      username: "",
      password: "",
      category: bookmark.category || "General",
      isFavorite: !!bookmark.isFavorite,
      notes: bookmark.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveAndEncryptPasswords([newPwd, ...decryptedPasswords]);
    addToast(
      existingIndex >= 0 ? "Bookmark updated & password entry linked." : "Bookmark saved & synced to vault.",
      "success"
    );
  };

  const handleToggleBookmarkFavorite = async (id: string) => {
    const updated = bookmarks.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
    setBookmarks(updated);
    const target = updated.find((b) => b.id === id);
    if (target) await saveBookmark(target);
  };

  const handleDeleteBookmark = async (id: string) => {
    const target = bookmarks.find((b) => b.id === id);
    showConfirm(
      "Delete Bookmark",
      `Are you sure you want to delete "${target?.title || "this bookmark"}"?`,
      async () => {
        const updated = bookmarks.filter((b) => b.id !== id);
        setBookmarks(updated);
        await deleteBookmarkDB(id);
        addToast("Bookmark deleted.", "info");

        // Deletion is isolated by default — only offer to remove the linked
        // password entry, and the default answer is No (Keep Entry).
        const linked = target
          ? decryptedPasswords.find(
              (p) => normalizeHost(p.websiteUrl || p.websiteName) === normalizeHost(target.url || target.title)
            )
          : undefined;
        if (linked) {
          showConfirm(
            "Delete Linked Password Entry?",
            `"${linked.websiteName}" (${linked.username || "no username"}) shares this bookmark's URL. Delete it too?`,
            async () => {
              await saveAndEncryptPasswords(decryptedPasswords.filter((p) => p.id !== linked.id));
              addToast("Linked password entry deleted.", "info");
            },
            true,
            "Delete Entry",
            "Keep Entry"
          );
        }
      },
      true
    );
  };

  // ==========================================
  // Password Handlers
  // ==========================================

  const handleSavePassword = async (entry: PasswordEntry) => {
    const existingIndex = decryptedPasswords.findIndex((p) => p.id === entry.id);
    const updatedPwds =
      existingIndex >= 0
        ? decryptedPasswords.map((p) => (p.id === entry.id ? entry : p))
        : [entry, ...decryptedPasswords];
    await saveAndEncryptPasswords(updatedPwds);

    const pwdHost = normalizeHost(entry.websiteUrl || entry.websiteName);
    const linkedBookmark = bookmarks.find((b) => normalizeHost(b.url || b.title) === pwdHost);

    if (linkedBookmark) {
      if (skipSyncSuggestionRef.current) {
        // This save came from a linked-entry suggestion; don't mirror back.
        skipSyncSuggestionRef.current = false;
        addToast(existingIndex >= 0 ? "Password updated." : "Password stored.", "success");
        return;
      }
      addToast(existingIndex >= 0 ? "Password updated." : "Password stored.", "success");
      showConfirm(
        "Linked Bookmark Found",
        `A bookmark for "${pwdHost}" already exists. Do you want to edit it now? (Nothing is overwritten without your confirmation.)`,
        () => {
          setEditingBookmark(linkedBookmark);
          setIsBookmarkModalOpen(true);
          skipSyncSuggestionRef.current = true;
        },
        false,
        "Edit Bookmark",
        "Not Now"
      );
      return;
    }

    // Add-sync: creating a password entry creates its bookmark counterpart.
    const newBm: Bookmark = {
      id: "bm-sync-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      title: entry.websiteName,
      url: entry.websiteUrl || `https://${entry.websiteName.toLowerCase().replace(/\s+/g, "")}.com`,
      category: entry.category || "General",
      isFavorite: !!entry.isFavorite,
      description: entry.notes || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setBookmarks([newBm, ...bookmarks]);
    await saveBookmark(newBm);
    addToast(
      existingIndex >= 0 ? "Password updated & bookmark linked." : "Password stored & synced to bookmarks.",
      "success"
    );
  };

  const handleTogglePasswordFavorite = async (id: string) => {
    const updated = decryptedPasswords.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    await saveAndEncryptPasswords(updated);
  };

  const handleDeletePassword = async (id: string) => {
    const target = decryptedPasswords.find((p) => p.id === id);
    showConfirm(
      "Delete Password Entry",
      `Are you sure you want to permanently delete credentials for "${target?.websiteName || "this entry"}"?`,
      async () => {
        await saveAndEncryptPasswords(decryptedPasswords.filter((p) => p.id !== id));
        addToast("Password entry deleted.", "info");

        // Deletion is isolated by default — only offer to remove the linked
        // bookmark, and the default answer is No (Keep Bookmark).
        const linked = target
          ? bookmarks.find(
              (b) => normalizeHost(b.url || b.title) === normalizeHost(target.websiteUrl || target.websiteName)
            )
          : undefined;
        if (linked) {
          showConfirm(
            "Delete Linked Bookmark?",
            `"${linked.title}" shares this entry's URL. Delete it too?`,
            async () => {
              const updatedBms = bookmarks.filter((b) => b.id !== linked.id);
              setBookmarks(updatedBms);
              await deleteBookmarkDB(linked.id);
              addToast("Linked bookmark deleted.", "info");
            },
            true,
            "Delete Bookmark",
            "Keep Bookmark"
          );
        }
      },
      true
    );
  };

  // ==========================================
  // Category Handlers
  // ==========================================

  const handleAddCategory = async (name: string, color: string, parentId?: string) => {
    const newCat: Category = { id: "cat-" + Date.now(), name, color, parentId };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCategoryDB(newCat);
    addToast(`Category "${name}" created.`, "success");
  };

  const handleDeleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const catName = target.name;
    const pwCount = decryptedPasswords.filter((p) => p.category === catName).length;
    const bmCount = bookmarks.filter((b) => b.category === catName).length;
    const childCount = categories.filter((c) => c.parentId === id).length;
    if (pwCount > 0 || bmCount > 0 || childCount > 0) {
      setDeleteTransferDialog({ categoryId: id, categoryName: catName, passwordCount: pwCount, bookmarkCount: bmCount, childCount });
      return;
    }
    showConfirm(
      "Delete Category",
      `Delete empty category "${catName}"?`,
      async () => {
        const updated = categories.filter((c) => c.id !== id);
        setCategories(updated);
        await saveAllCategories(updated);
        if (selectedCategory === catName) setSelectedCategory(null);
        addToast("Category deleted.", "info");
      },
      true
    );
  };

  const handleTransferAndDelete = async (targetCategoryId: string, transferToCatName: string) => {
    const catName = categories.find((c) => c.id === targetCategoryId)?.name;
    if (!catName) return;
    const updatedPws = decryptedPasswords.map((p) => (p.category === catName ? { ...p, category: transferToCatName } : p));
    await saveAndEncryptPasswords(updatedPws);
    const updatedBms = bookmarks.map((b) => (b.category === catName ? { ...b, category: transferToCatName } : b));
    setBookmarks(updatedBms);
    await saveAllBookmarks(updatedBms);
    const updatedCats = categories
      .map((c) => (c.parentId === targetCategoryId ? { ...c, parentId: undefined } : c))
      .filter((c) => c.id !== targetCategoryId);
    setCategories(updatedCats);
    await saveAllCategories(updatedCats);
    if (selectedCategory === catName) setSelectedCategory(null);
    setDeleteTransferDialog(null);
    addToast(`Items transferred to "${transferToCatName}" and category deleted.`, "success");
  };

  const handleRenameCategory = async (id: string, newName: string) => {
    const oldName = categories.find((c) => c.id === id)?.name;
    if (!oldName) return;
    const updated = categories.map((c) => (c.id === id ? { ...c, name: newName } : c));
    setCategories(updated);
    await saveAllCategories(updated);
    if (oldName !== newName) {
      const updatedPws = decryptedPasswords.map((p) => (p.category === oldName ? { ...p, category: newName } : p));
      if (updatedPws.some((p) => p.category !== decryptedPasswords.find((op) => op.id === p.id)?.category)) {
        await saveAndEncryptPasswords(updatedPws);
      }
      const updatedBms = bookmarks.map((b) => (b.category === oldName ? { ...b, category: newName } : b));
      if (updatedBms.some((b, i) => b.category !== bookmarks[i]?.category)) {
        setBookmarks(updatedBms);
        await saveAllBookmarks(updatedBms);
      }
      if (selectedCategory === oldName) setSelectedCategory(newName);
    }
    addToast(`Category renamed to "${newName}".`, "success");
  };

  // ==========================================
  // Clipboard Helper
  // ==========================================

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    addToast(`${label} copied to clipboard.`, "success");
  };

  // ==========================================
  // Backup Export / Import
  // ==========================================

  const handleExportEncryptedBackup = async () => {
    if (!isUnlocked) {
      addToast("Please unlock your vault before exporting a complete backup.", "error");
      setIsMasterPasswordModalOpen(true);
      return;
    }
    // The master password is never kept in memory between sessions — the
    // BackupPasswordModal collects it, verifies it, then encrypts.
    setIsBackupPasswordModalOpen(true);
  };

  const handleBackupPasswordSubmit = async (password: string): Promise<boolean> => {
    if (!vaultMeta?.salt || !vaultMeta.verifier) return false;
    const isValid = await verifyMasterPassword(password, vaultMeta.salt, vaultMeta.verifier);
    if (!isValid) return false;
    try {
      const files = await getEncryptedFiles();
      const payload = createLokkerBackupPayload({
        passwords: decryptedPasswords,
        bookmarks,
        categories,
        settings,
        files,
        vaultMeta,
      });
      const encryptedBackup = await exportEncryptedLokkerBackup(payload, password);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadTextFile(
        JSON.stringify(encryptedBackup, null, 2),
        `lokker-backup-${dateStr}.lokker`,
        "application/json"
      );
      const updatedSettings = { ...settings, lastBackupTime: Date.now() };
      setSettingsState(updatedSettings);
      await saveSettings(updatedSettings);
      setIsBackupPasswordModalOpen(false);
      addToast("Full encrypted Lokker backup exported successfully (.lokker).", "success");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export backup.";
      addToast(message, "error");
      return false;
    }
  };

  const handleExportUnencryptedBackup = async () => {
    if (!isUnlocked) {
      addToast("Please unlock your vault first.", "error");
      setIsMasterPasswordModalOpen(true);
      return;
    }
    showConfirm(
      "Export Unencrypted Backup",
      "WARNING: This file will contain your unencrypted passwords, bookmarks, and settings in plain JSON. Anyone with access to this file can read your secrets. Are you sure?",
      async () => {
        try {
          const files = await getEncryptedFiles();
          const payload = createLokkerBackupPayload({
            passwords: decryptedPasswords,
            bookmarks,
            categories,
            settings,
            files,
            vaultMeta,
          });
          const jsonStr = JSON.stringify({ format: "lokker-unencrypted-backup", ...payload }, null, 2);
          const dateStr = new Date().toISOString().split("T")[0];
          downloadTextFile(jsonStr, `lokker-unencrypted-backup-${dateStr}.json`, "application/json");
          addToast("Exported unencrypted backup (keep this file secure).", "info");
        } catch {
          addToast("Failed to export unencrypted backup.", "error");
        }
      },
      true,
      "Export Plaintext Backup"
    );
  };

  const handleImportLokkerBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        const inspection = inspectBackupFileText(text);
        if (inspection.isLokkerBackup) {
          if (inspection.isEncrypted && inspection.encryptedFile) {
            setPendingEncryptedBackup(inspection.encryptedFile);
            setPendingUnencryptedBackup(null);
            setIsImportBackupModalOpen(true);
          } else if (inspection.decryptedPayload) {
            setPendingEncryptedBackup(null);
            setPendingUnencryptedBackup(inspection.decryptedPayload);
            setIsImportBackupModalOpen(true);
          }
        } else {
          handleImportExternalFile(file);
        }
      } catch (err: any) {
        addToast(err?.message || "Failed to parse backup file.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestoreBackup = async (
    payload: LokkerBackupPayload,
    strategy: "merge" | "replace"
  ) => {
    if (strategy === "replace") {
      await resetDatabase();
      const incomingBookmarks = Array.isArray(payload.bookmarks) ? payload.bookmarks : [];
      const incomingCategories = Array.isArray(payload.categories) ? payload.categories : [];
      const incomingSettings = payload.settings || {
        autoLockMinutes: 15,
        requireConfirmationForAutofill: true,
        trustedDomains: [],
      };
      const incomingFiles = Array.isArray(payload.files) ? payload.files : [];
      const incomingPasswords = Array.isArray(payload.passwords) ? payload.passwords : [];
      await saveAllBookmarks(incomingBookmarks);
      await saveAllCategories(incomingCategories);
      await saveSettings(incomingSettings);
      for (const f of incomingFiles) { await saveEncryptedFile(f); }
      setBookmarks(incomingBookmarks);
      setCategories(incomingCategories);
      setSettingsState(incomingSettings);
      if (payload.vaultMeta && payload.vaultMeta.isInitialized) {
        await saveVaultMeta(payload.vaultMeta);
        setVaultMeta(payload.vaultMeta);
      }
      if (isUnlocked && derivedKey) {
        await saveAndEncryptPasswords(incomingPasswords);
      } else {
        setDecryptedPasswords([]);
        setIsUnlocked(false);
        setIsMasterPasswordModalOpen(true);
      }
      addToast(
        `Restored complete backup (${incomingPasswords.length} passwords, ${incomingBookmarks.length} bookmarks, ${incomingCategories.length} categories, ${incomingFiles.length} files).`,
        "success"
      );
    } else {
      if (!isUnlocked || !derivedKey) throw new Error("Please unlock your current vault first to merge backup items.");
      const existingMap = new Set(
        decryptedPasswords.map((p) => `${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
      );
      const incomingPasswords = Array.isArray(payload.passwords) ? payload.passwords : [];
      const newPwds = incomingPasswords.filter(
        (p) => !existingMap.has(`${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
      );
      const mergedPwds = [...newPwds, ...decryptedPasswords];
      await saveAndEncryptPasswords(mergedPwds);
      const existingBmUrls = new Set(bookmarks.map((b) => b.url.toLowerCase()));
      const incomingBms = Array.isArray(payload.bookmarks) ? payload.bookmarks : [];
      const newBms = incomingBms.filter((b) => !existingBmUrls.has(b.url.toLowerCase()));
      const mergedBms = [...newBms, ...bookmarks];
      setBookmarks(mergedBms);
      await saveAllBookmarks(mergedBms);
      const existingCatNames = new Set(categories.map((c) => c.name.toLowerCase()));
      const incomingCats = Array.isArray(payload.categories) ? payload.categories : [];
      const newCats = incomingCats.filter((c) => !existingCatNames.has(c.name.toLowerCase()));
      const mergedCats = [...categories, ...newCats];
      setCategories(mergedCats);
      await saveAllCategories(mergedCats);
      const incomingFiles = Array.isArray(payload.files) ? payload.files : [];
      for (const f of incomingFiles) { await saveEncryptedFile(f); }
      addToast(
        `Merged ${newPwds.length} new credentials, ${newBms.length} bookmarks, and ${newCats.length} categories into your vault.`,
        "success"
      );
    }
  };

  // ==========================================
  // External Import / Export
  // ==========================================

  const handleExportCSV = () => {
    if (!isUnlocked || decryptedPasswords.length === 0) {
      addToast("No decrypted passwords to export. Unlock vault first.", "error");
      return;
    }
    const headers = ["title", "url", "username", "password", "notes", "category"];
    const rows = decryptedPasswords.map((p) => [
      `"${(p.websiteName || "").replace(/"/g, '""')}"`,
      `"${(p.websiteUrl || "").replace(/"/g, '""')}"`,
      `"${(p.username || "").replace(/"/g, '""')}"`,
      `"${(p.password || "").replace(/"/g, '""')}"`,
      `"${(p.notes || "").replace(/"/g, '""')}"`,
      `"${(p.category || "General").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadTextFile(csvContent, `lokker-passwords-export-${Date.now()}.csv`, "text/csv;charset=utf-8;");
    addToast("CSV Passwords exported successfully.", "success");
  };

  const handleImportExternalFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        if (!isUnlocked) {
          addToast("Please unlock your vault before importing external credentials.", "error");
          setIsMasterPasswordModalOpen(true);
          return;
        }
        if (file.name.endsWith(".csv")) {
          const parsedEntries = parseCSVToEntries(text);
          if (parsedEntries.length === 0) {
            addToast("No valid credentials found in CSV file.", "error");
            return;
          }
          const existingMap = new Set(
            decryptedPasswords.map((p) => `${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
          );
          const newItems = parsedEntries.filter(
            (p) => !existingMap.has(`${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
          );
          const merged = [...newItems, ...decryptedPasswords];
          await saveAndEncryptPasswords(merged);
          addToast(
            `Imported ${newItems.length} credentials from CSV (${parsedEntries.length - newItems.length} duplicates skipped).`,
            "success"
          );
        } else {
          const parsed = parseJSONBackupText(text);
          if (parsed.passwords.length > 0) {
            const existingMap = new Set(
              decryptedPasswords.map((p) => `${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
            );
            const newPwds = parsed.passwords.filter(
              (p) => !existingMap.has(`${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
            );
            const mergedPwds = [...newPwds, ...decryptedPasswords];
            await saveAndEncryptPasswords(mergedPwds);
            addToast(`Imported ${newPwds.length} credentials from external JSON.`, "success");
          } else {
            addToast("No login credentials found in file.", "error");
          }
        }
      } catch (err: any) {
        addToast(err?.message || "Failed to parse file.", "error");
      }
    };
    reader.readAsText(file);
  };

  // ==========================================
  // Reset Vault
  // ==========================================

  const handleResetVault = async () => {
    showConfirm(
      "Reset & Wipe Vault",
      "Are you sure you want to reset all stored passwords, bookmarks, and settings? This cannot be undone.",
      async () => {
        await resetDatabase();
        setBookmarks([]);
        setDecryptedPasswords([]);
        setVaultMeta(null);
        setIsUnlocked(false);
        setDerivedKey(null);
        setIsMasterPasswordModalOpen(true);
        addToast("Local vault reset completed.", "info");
      },
      true
    );
  };

  // ==========================================
  // Context Value
  // ==========================================

  const dismissConfirm = React.useCallback(() => setConfirmDialog(null), []);

  const updateSettings = async (s: VaultSettings) => {
    setSettingsState(s);
    await saveSettings(s);
  };

  const value = React.useMemo<VaultContextType>(() => ({
    bookmarks, categories, settings, vaultMeta, isUnlocked, derivedKey, decryptedPasswords,
    currentView, navigateTo, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery,
    isMasterPasswordModalOpen, setIsMasterPasswordModalOpen,
    isPasswordModalOpen, setIsPasswordModalOpen, editingPassword, setEditingPassword,
    isBookmarkModalOpen, setIsBookmarkModalOpen, editingBookmark, setEditingBookmark,
    isCategoryModalOpen, setIsCategoryModalOpen, categoryModalParentId, setCategoryModalParentId,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    isExtensionGuideOpen, setIsExtensionGuideOpen,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isImportBackupModalOpen, setIsImportBackupModalOpen,
    isBackupPasswordModalOpen, setIsBackupPasswordModalOpen,
    pendingEncryptedBackup, setPendingEncryptedBackup,
    pendingUnencryptedBackup, setPendingUnencryptedBackup,
    confirmDialog, deleteTransferDialog, setDeleteTransferDialog,
    lockVault, handleMasterPasswordSubmit, handleUnlockWithRecoveryKey, handleUnlockWithWebAuthn,
    handleRegisterWebAuthn, handleUnregisterWebAuthn,
    handleSavePassword, handleDeletePassword, handleTogglePasswordFavorite,
    handleSaveBookmark, handleDeleteBookmark, handleToggleBookmarkFavorite,
    handleAddCategory, handleDeleteCategory, handleTransferAndDelete, handleRenameCategory,
    handleCopyText,
    handleExportEncryptedBackup, handleBackupPasswordSubmit, handleExportUnencryptedBackup,
    handleImportLokkerBackupFile, handleImportExternalFile, handleExportCSV,
    handleConfirmRestoreBackup, handleResetVault,
    toasts, addToast, dismissToast, showConfirm, dismissConfirm,
    updateSettings,
  }), [
    bookmarks, categories, settings, vaultMeta, isUnlocked, derivedKey, decryptedPasswords,
    currentView, selectedCategory, searchQuery,
    isMasterPasswordModalOpen, isPasswordModalOpen, editingPassword,
    isBookmarkModalOpen, editingBookmark,
    isCategoryModalOpen, categoryModalParentId,
    isCommandPaletteOpen, isExtensionGuideOpen, isMobileSidebarOpen,
    isImportBackupModalOpen, isBackupPasswordModalOpen, pendingEncryptedBackup, pendingUnencryptedBackup,
    confirmDialog, deleteTransferDialog,
    lockVault, handleMasterPasswordSubmit, handleUnlockWithRecoveryKey, handleUnlockWithWebAuthn,
    handleRegisterWebAuthn, handleUnregisterWebAuthn,
    handleSavePassword, handleDeletePassword, handleTogglePasswordFavorite,
    handleSaveBookmark, handleDeleteBookmark, handleToggleBookmarkFavorite,
    handleAddCategory, handleDeleteCategory, handleTransferAndDelete, handleRenameCategory,
    handleCopyText,
    handleExportEncryptedBackup, handleBackupPasswordSubmit, handleExportUnencryptedBackup,
    handleImportLokkerBackupFile, handleImportExternalFile, handleExportCSV,
    handleConfirmRestoreBackup, handleResetVault,
    toasts, addToast, dismissToast, showConfirm,
  ]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

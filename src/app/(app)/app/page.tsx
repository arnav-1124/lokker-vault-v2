"use client";

import * as React from "react";
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
} from "@/lib/crypto";
import {
  createLokkerBackupPayload,
  exportEncryptedLokkerBackup,
  inspectBackupFileText,
} from "@/lib/backup";
import { parseCSVToEntries, parseJSONBackupText } from "@/lib/importers";
import { INITIAL_DEMO_VAULT_ITEMS } from "@/lib/sampleData";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeroView } from "@/components/views/dashboard-hero-view";
import { PasswordListView } from "@/components/views/password-list-view";
import { BookmarkListView } from "@/components/views/bookmark-list-view";
import { TotpView } from "@/components/views/totp-view";
import { SecurityAuditView } from "@/components/views/security-audit-view";
import { GeneratorView } from "@/components/views/generator-view";
import { ImportExportView } from "@/components/views/import-export-view";
import { FileVaultView } from "@/components/views/file-vault-view";
import { MaskedEmailsView } from "@/components/views/masked-emails-view";
import { SettingsView } from "@/components/views/settings-view";
import { FeatureGuideView } from "@/components/views/feature-guide-view";

import { MasterPasswordModal } from "@/components/modals/master-password-modal";
import { PasswordModal } from "@/components/modals/password-modal";
import { BookmarkModal } from "@/components/modals/bookmark-modal";
import { CategoryManagerModal } from "@/components/modals/category-modal";
import { CommandPalette } from "@/components/modals/command-palette";
import { ExtensionGuideModal } from "@/components/modals/extension-guide-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { ImportBackupModal } from "@/components/modals/import-backup-modal";
import { ToastContainer } from "@/components/toast-container";
import { Star, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppWorkspacePage() {
  const [currentView, setCurrentView] = React.useState<ViewMode>("home");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Storage state
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [settings, setSettingsState] = React.useState<VaultSettings>({
    autoLockMinutes: 15,
    requireConfirmationForAutofill: true,
    trustedDomains: ["github.com", "google.com", "notion.so", "vercel.com"],
  });

  // Vault Security State (VEK and decrypted payload)
  const [vaultMeta, setVaultMeta] = React.useState<VaultMetadata | null>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [derivedKey, setDerivedKey] = React.useState<CryptoKey | null>(null); // Active VEK
  const [decryptedPasswords, setDecryptedPasswords] = React.useState<PasswordEntry[]>([]);
  const [activeMasterPassword, setActiveMasterPassword] = React.useState<string | null>(null);

  // Modals & UI Controls
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

  // Full Lokker Backup Restore Modal State
  const [isImportBackupModalOpen, setIsImportBackupModalOpen] = React.useState(false);
  const [pendingEncryptedBackup, setPendingEncryptedBackup] = React.useState<LokkerEncryptedBackupFile | null>(null);
  const [pendingUnencryptedBackup, setPendingUnencryptedBackup] = React.useState<LokkerBackupPayload | null>(null);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

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
        onConfirm: () => {
          onConfirm();
          setConfirmDialog(null);
        },
        confirmText,
        cancelText,
        isDestructive,
      });
    },
    []
  );

  // Toast System with deduplication
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToasts((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) {
        return prev;
      }
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      return [...prev, { id, text, type }];
    });
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

        // If vault not yet initialized, prompt setup modal
        if (!meta || !meta.isInitialized) {
          setIsMasterPasswordModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to load vault database:", err);
      }
    }
    loadData();
  }, []);

  // Global Keyboard Shortcuts: Cmd/Ctrl+K and / to open command palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      // Cmd/Ctrl+K — always opens command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // / to open command palette — only when not in an input
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Escape to close command palette
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Extension Synchronization Bridge
  React.useEffect(() => {
    if (vaultMeta && typeof window !== "undefined") {
      window.postMessage(
        {
          type: "LOKKER_SYNC_VAULT",
          vaultMeta,
          encryptedVault: vaultMeta.encryptedVault,
        },
        "*"
      );
      // Compatibility alias
      window.postMessage(
        {
          type: "XEROX_SYNC_VAULT",
          vaultMeta,
          encryptedVault: vaultMeta.encryptedVault,
        },
        "*"
      );
    }
  }, [vaultMeta]);

  // Extension Ping Listener
  React.useEffect(() => {
    const handleExtensionPing = (event: MessageEvent) => {
      if (
        event.data?.type === "LOKKER_EXTENSION_READY" ||
        event.data?.type === "XEROX_EXTENSION_READY" ||
        event.data?.type === "LOKKER_REQUEST_VAULT_SYNC"
      ) {
        if (vaultMeta) {
          window.postMessage(
            {
              type: "LOKKER_SYNC_VAULT",
              vaultMeta,
              encryptedVault: vaultMeta.encryptedVault,
            },
            "*"
          );
        }
      }
    };
    window.addEventListener("message", handleExtensionPing);
    return () => window.removeEventListener("message", handleExtensionPing);
  }, [vaultMeta]);

  // Lock Vault
  const lockVault = React.useCallback(() => {
    setIsUnlocked(false);
    setDerivedKey(null);
    setDecryptedPasswords([]);
    setActiveMasterPassword(null);
    if (typeof window !== "undefined") {
      window.postMessage({ type: "LOKKER_VAULT_LOCKED" }, "*");
      window.postMessage({ type: "XEROX_VAULT_LOCKED" }, "*");
    }
    addToast("Password Vault locked.", "info");
  }, [addToast]);

  // Auto-lock timer
  React.useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes === 0) return;
    const timer = setTimeout(() => {
      lockVault();
    }, settings.autoLockMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isUnlocked, settings.autoLockMinutes, lockVault]);

  // Master Password Submission (Setup or Unlock)
  const handleMasterPasswordSubmit = async (
    password: string,
    isSetup: boolean,
    recoveryKey?: string
  ): Promise<boolean> => {
    if (isSetup) {
      if (!recoveryKey) return false;
      try {
        const { meta, vek } = await initializeEnvelopeVault(
          password,
          recoveryKey,
          INITIAL_DEMO_VAULT_ITEMS
        );

        await saveVaultMeta(meta);
        setVaultMeta(meta);
        setDerivedKey(vek);
        setDecryptedPasswords(INITIAL_DEMO_VAULT_ITEMS);
        setActiveMasterPassword(password);
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
        const { vek, migratedMeta, passwords } = await unwrapVekWithPassword(
          password,
          vaultMeta
        );

        if (migratedMeta) {
          await saveVaultMeta(migratedMeta);
          setVaultMeta(migratedMeta);
        }

        setDerivedKey(vek);
        setDecryptedPasswords(passwords);
        setActiveMasterPassword(password);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);
        addToast("Password Vault unlocked.", "success");
        return true;
      } catch {
        return false;
      }
    }
  };

  // Recovery Key Unlock Handler
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

  // Save Decrypted Passwords & Re-encrypt with active VEK
  const saveAndEncryptPasswords = async (newPasswords: PasswordEntry[]) => {
    setDecryptedPasswords(newPasswords);
    if (!derivedKey || !vaultMeta || !vaultMeta.encryptedVault) return;

    try {
      const { cipherText, iv } = await encryptPayloadWithVek(
        newPasswords,
        derivedKey
      );

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

  const normalizeHost = (str: string) => {
    if (!str) return "";
    try {
      const raw = str.startsWith("http") ? str : `https://${str}`;
      return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return str.trim().toLowerCase();
    }
  };

  // Bookmark handlers
  const handleSaveBookmark = async (bookmark: Bookmark) => {
    const existingIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
    let updatedBookmarks: Bookmark[];
    if (existingIndex >= 0) {
      updatedBookmarks = [...bookmarks];
      updatedBookmarks[existingIndex] = bookmark;
    } else {
      updatedBookmarks = [bookmark, ...bookmarks];
    }
    setBookmarks(updatedBookmarks);
    await saveBookmark(bookmark);

    // Sync to Password Vault if unlocked
    if (isUnlocked && decryptedPasswords) {
      const bmHost = normalizeHost(bookmark.url || bookmark.title);
      const existingPwdIndex = decryptedPasswords.findIndex(
        (p) => normalizeHost(p.websiteUrl || p.websiteName) === bmHost
      );

      let updatedPwds: PasswordEntry[];
      if (existingPwdIndex >= 0) {
        const existing = decryptedPasswords[existingPwdIndex];
        const syncedPwd: PasswordEntry = {
          ...existing,
          websiteName: bookmark.title,
          websiteUrl: bookmark.url || existing.websiteUrl,
          category: bookmark.category || existing.category,
          isFavorite: bookmark.isFavorite !== undefined ? bookmark.isFavorite : existing.isFavorite,
          notes: bookmark.description || existing.notes,
          updatedAt: Date.now(),
        };
        updatedPwds = [...decryptedPasswords];
        updatedPwds[existingPwdIndex] = syncedPwd;
      } else {
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
        updatedPwds = [newPwd, ...decryptedPasswords];
      }
      await saveAndEncryptPasswords(updatedPwds);
    }

    addToast(existingIndex >= 0 ? "Bookmark updated & synced." : "Bookmark saved & synced to vault.", "success");
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
      },
      true
    );
  };

  // Password Vault handlers
  const handleSavePassword = async (entry: PasswordEntry) => {
    const existingIndex = decryptedPasswords.findIndex((p) => p.id === entry.id);
    let updatedPwds: PasswordEntry[];
    if (existingIndex >= 0) {
      updatedPwds = [...decryptedPasswords];
      updatedPwds[existingIndex] = entry;
    } else {
      updatedPwds = [entry, ...decryptedPasswords];
    }
    await saveAndEncryptPasswords(updatedPwds);

    // Sync to Bookmarks
    const pwdHost = normalizeHost(entry.websiteUrl || entry.websiteName);
    const existingBmIndex = bookmarks.findIndex((b) => normalizeHost(b.url || b.title) === pwdHost);

    let updatedBookmarks: Bookmark[];
    if (existingBmIndex >= 0) {
      const existing = bookmarks[existingBmIndex];
      const syncedBm: Bookmark = {
        ...existing,
        title: entry.websiteName,
        url: entry.websiteUrl || existing.url,
        category: entry.category || existing.category,
        isFavorite: entry.isFavorite !== undefined ? entry.isFavorite : existing.isFavorite,
        description: entry.notes || existing.description,
        updatedAt: Date.now(),
      };
      updatedBookmarks = [...bookmarks];
      updatedBookmarks[existingBmIndex] = syncedBm;
      await saveBookmark(syncedBm);
    } else {
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
      updatedBookmarks = [newBm, ...bookmarks];
      await saveBookmark(newBm);
    }
    setBookmarks(updatedBookmarks);

    addToast(existingIndex >= 0 ? "Password updated & synced." : "Password stored & synced.", "success");
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
        const updated = decryptedPasswords.filter((p) => p.id !== id);
        await saveAndEncryptPasswords(updated);
        addToast("Password entry deleted.", "info");
      },
      true
    );
  };

  // Categories handlers
  const handleAddCategory = async (name: string, color: string, parentId?: string) => {
    const newCat: Category = {
      id: "cat-" + Date.now(),
      name,
      color,
      parentId,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCategoryDB(newCat);
    addToast(`Category "${name}" created.`, "success");
  };

  const handleDeleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    showConfirm(
      "Delete Category",
      `Delete category "${target?.name || "this category"}"? Items will be moved to General.`,
      async () => {
        const updated = categories.filter((c) => c.id !== id);
        setCategories(updated);
        await saveAllCategories(updated);
        addToast("Category deleted.", "info");
      },
      true
    );
  };

  // Copy Clipboard Helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    addToast(`${label} copied to clipboard.`, "success");
  };

  // ==========================================
  // FULL LOKKER BACKUP EXPORT / RESTORE FLOWS
  // ==========================================

  const handleExportEncryptedBackup = async () => {
    if (!isUnlocked) {
      addToast("Please unlock your vault before exporting a complete backup.", "error");
      setIsMasterPasswordModalOpen(true);
      return;
    }

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

      // Prompt or use master password
      const passwordToUse = activeMasterPassword || prompt("Enter Master Password to encrypt this backup:");
      if (!passwordToUse) return;

      const encryptedBackup = await exportEncryptedLokkerBackup(payload, passwordToUse);
      const jsonStr = JSON.stringify(encryptedBackup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `lokker-backup-${dateStr}.lokker`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const updatedSettings = { ...settings, lastBackupTime: Date.now() };
      setSettingsState(updatedSettings);
      await saveSettings(updatedSettings);

      addToast("Full encrypted Lokker backup exported successfully (.lokker).", "success");
    } catch (err: any) {
      addToast(err?.message || "Failed to export backup.", "error");
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

          const jsonStr = JSON.stringify(
            {
              format: "lokker-unencrypted-backup",
              ...payload,
            },
            null,
            2
          );

          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const dateStr = new Date().toISOString().split("T")[0];
          a.download = `lokker-unencrypted-backup-${dateStr}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

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
          // If not standard Lokker format, route to external manager parser
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
      // 1. Fresh Restore / Full Replace
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

      for (const f of incomingFiles) {
        await saveEncryptedFile(f);
      }

      setBookmarks(incomingBookmarks);
      setCategories(incomingCategories);
      setSettingsState(incomingSettings);

      // If backup contains VaultMetadata, restore it
      if (payload.vaultMeta && payload.vaultMeta.isInitialized) {
        await saveVaultMeta(payload.vaultMeta);
        setVaultMeta(payload.vaultMeta);
      }

      // If current session is unlocked, re-encrypt under current VEK or prompt
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
      // 2. Safe Merge & Synchronize
      if (!isUnlocked || !derivedKey) {
        throw new Error("Please unlock your current vault first to merge backup items.");
      }

      // Merge passwords
      const existingMap = new Set(
        decryptedPasswords.map((p) => `${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
      );
      const incomingPasswords = Array.isArray(payload.passwords) ? payload.passwords : [];
      const newPwds = incomingPasswords.filter(
        (p) => !existingMap.has(`${normalizeHost(p.websiteUrl || p.websiteName)}::${p.username.toLowerCase()}`)
      );
      const mergedPwds = [...newPwds, ...decryptedPasswords];
      await saveAndEncryptPasswords(mergedPwds);

      // Merge bookmarks
      const existingBmUrls = new Set(bookmarks.map((b) => b.url.toLowerCase()));
      const incomingBms = Array.isArray(payload.bookmarks) ? payload.bookmarks : [];
      const newBms = incomingBms.filter((b) => !existingBmUrls.has(b.url.toLowerCase()));
      const mergedBms = [...newBms, ...bookmarks];
      setBookmarks(mergedBms);
      await saveAllBookmarks(mergedBms);

      // Merge categories
      const existingCatNames = new Set(categories.map((c) => c.name.toLowerCase()));
      const incomingCats = Array.isArray(payload.categories) ? payload.categories : [];
      const newCats = incomingCats.filter((c) => !existingCatNames.has(c.name.toLowerCase()));
      const mergedCats = [...categories, ...newCats];
      setCategories(mergedCats);
      await saveAllCategories(mergedCats);

      // Merge files
      const incomingFiles = Array.isArray(payload.files) ? payload.files : [];
      for (const f of incomingFiles) {
        await saveEncryptedFile(f);
      }

      addToast(
        `Merged ${newPwds.length} new credentials, ${newBms.length} bookmarks, and ${newCats.length} categories into your vault.`,
        "success"
      );
    }
  };

  // ==========================================
  // EXTERNAL MANAGER IMPORT / EXPORT (CSV / JSON)
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lokker-passwords-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          // Bitwarden / 1Password JSON
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
        setActiveMasterPassword(null);
        setIsMasterPasswordModalOpen(true);
        addToast("Local vault reset completed.", "info");
      },
      true
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <AppSidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isUnlocked={isUnlocked}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        bookmarkCount={bookmarks.length}
        passwordCount={decryptedPasswords.length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto lokker-scrollbar">
        <AppHeader
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isUnlocked={isUnlocked}
          autoLockMinutes={settings.autoLockMinutes}
          onToggleLock={() => {
            if (isUnlocked) lockVault();
            else setIsMasterPasswordModalOpen(true);
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewItemModal={() => {
            if (currentView === "bookmarks") {
              setEditingBookmark(null);
              setIsBookmarkModalOpen(true);
            } else {
              if (!isUnlocked) {
                setIsMasterPasswordModalOpen(true);
              } else {
                setEditingPassword(null);
                setIsPasswordModalOpen(true);
              }
            }
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
        />

        {/* View Renderer */}
        <main className="flex-1 pb-16">
          {currentView === "home" && (
            <DashboardHeroView
              onNavigate={setCurrentView}
              onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
              isUnlocked={isUnlocked}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              lastBackupTime={settings.lastBackupTime}
              onBackupExportClick={handleExportEncryptedBackup}
              passwordCount={decryptedPasswords.length}
              bookmarkCount={bookmarks.length}
              categoryCount={categories.length}
              passwords={decryptedPasswords}
              bookmarks={bookmarks}
              onOpenAddPassword={() => {
                if (!isUnlocked) {
                  setIsMasterPasswordModalOpen(true);
                } else {
                  setEditingPassword(null);
                  setIsPasswordModalOpen(true);
                }
              }}
              onOpenAddBookmark={() => {
                setEditingBookmark(null);
                setIsBookmarkModalOpen(true);
              }}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              onCopyText={handleCopyText}
            />
          )}

          {currentView === "passwords" && (
            <PasswordListView
              passwords={decryptedPasswords}
              isUnlocked={isUnlocked}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onUnlockVaultClick={() => setIsMasterPasswordModalOpen(true)}
              onToggleFavorite={handleTogglePasswordFavorite}
              onEdit={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              onDelete={handleDeletePassword}
              onCopyText={handleCopyText}
              onOpenAddModal={() => {
                setEditingPassword(null);
                setIsPasswordModalOpen(true);
              }}
              categories={categories}
              bookmarks={bookmarks}
              onNavigateBookmark={(bm) => {
                setEditingBookmark(bm);
                setIsBookmarkModalOpen(true);
              }}
            />
          )}

          {currentView === "bookmarks" && (
            <BookmarkListView
              bookmarks={bookmarks}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onToggleFavorite={handleToggleBookmarkFavorite}
              onEdit={(bm) => {
                setEditingBookmark(bm);
                setIsBookmarkModalOpen(true);
              }}
              onDelete={handleDeleteBookmark}
              onOpenAddModal={() => {
                setEditingBookmark(null);
                setIsBookmarkModalOpen(true);
              }}
              categories={categories}
            />
          )}

          {currentView === "favorites" && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
              <div className="pb-4 border-b border-border-subtle">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  <span>Pinned Favorites</span>
                </h2>
                <p className="text-xs text-muted-foreground">Quick access to favorited bookmarks and logins.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Bookmarks
                  </h3>
                  <BookmarkListView
                    bookmarks={bookmarks.filter((b) => b.isFavorite)}
                    selectedCategory={null}
                    searchQuery={searchQuery}
                    onToggleFavorite={handleToggleBookmarkFavorite}
                    onEdit={(bm) => {
                      setEditingBookmark(bm);
                      setIsBookmarkModalOpen(true);
                    }}
                    onDelete={handleDeleteBookmark}
                    onOpenAddModal={() => {
                      setEditingBookmark(null);
                      setIsBookmarkModalOpen(true);
                    }}
                    categories={categories}
                  />
                </div>

                {isUnlocked && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Passwords
                    </h3>
                    <PasswordListView
                      passwords={decryptedPasswords.filter((p) => p.isFavorite)}
                      isUnlocked={true}
                      selectedCategory={null}
                      searchQuery={searchQuery}
                      onUnlockVaultClick={() => {}}
                      onToggleFavorite={handleTogglePasswordFavorite}
                      onEdit={(entry) => {
                        setEditingPassword(entry);
                        setIsPasswordModalOpen(true);
                      }}
                      onDelete={handleDeletePassword}
                      onCopyText={handleCopyText}
                      onOpenAddModal={() => {
                        setEditingPassword(null);
                        setIsPasswordModalOpen(true);
                      }}
                      categories={categories}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === "totp" && (
            <TotpView
              passwords={decryptedPasswords}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              addToast={addToast}
            />
          )}

          {currentView === "security-audit" && (
            <SecurityAuditView
              passwords={decryptedPasswords}
              isUnlocked={isUnlocked}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              onUpdatePassword={handleSavePassword}
              addToast={addToast}
            />
          )}

          {currentView === "generator" && (
            <GeneratorView
              onCopyText={handleCopyText}
              onSaveAsCredential={(pwd) => {
                if (!isUnlocked) {
                  addToast("Please unlock your vault to save credentials.", "info");
                  setIsMasterPasswordModalOpen(true);
                } else {
                  setEditingPassword({
                    id: "pwd-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                    websiteName: "",
                    websiteUrl: "",
                    username: "",
                    password: pwd,
                    notes: "Generated with Lokker Password Generator",
                    category: "General",
                    isFavorite: false,
                    entryType: "login",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                  setIsPasswordModalOpen(true);
                }
              }}
            />
          )}

          {currentView === "import-export" && (
            <ImportExportView
              isUnlocked={isUnlocked}
              onUnlockVaultClick={() => setIsMasterPasswordModalOpen(true)}
              onImportLokkerBackupFile={handleImportLokkerBackupFile}
              onImportExternalFile={handleImportExternalFile}
              onExportEncryptedBackup={handleExportEncryptedBackup}
              onExportUnencryptedBackup={handleExportUnencryptedBackup}
              onExportCSV={handleExportCSV}
              addToast={addToast}
            />
          )}

          {currentView === "files" && (
            <FileVaultView
              derivedKey={derivedKey}
              showConfirm={showConfirm}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              addToast={addToast}
            />
          )}

          {currentView === "masked-emails" && (
            <MaskedEmailsView
              passwords={decryptedPasswords}
              isUnlocked={isUnlocked}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              addToast={addToast}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              settings={settings}
              onUpdateSettings={async (newSt) => {
                setSettingsState(newSt);
                await saveSettings(newSt);
                addToast("Settings updated.", "success");
              }}
              onExportJSON={handleExportEncryptedBackup}
              onExportCSV={handleExportCSV}
              onImportFile={handleImportLokkerBackupFile}
              onResetVault={handleResetVault}
              isUnlocked={isUnlocked}
              onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
            />
          )}

          {currentView === "guide" && (
            <FeatureGuideView
              onSelectView={setCurrentView}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          )}

          {currentView === "extension" && (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
              <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center space-y-4 shadow-xs">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                  <Puzzle className="size-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    Chrome & Edge Manifest V3 Autofill
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Enjoy real password autofill directly in website login forms across all Chromium browsers.
                  </p>
                </div>
                <Button
                  onClick={() => setIsExtensionGuideOpen(true)}
                  className="gap-2 h-9 px-6 text-xs font-medium cursor-pointer"
                >
                  <Puzzle className="size-4" />
                  <span>Open Setup Guide & Download</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <MasterPasswordModal
        isOpen={isMasterPasswordModalOpen}
        isInitialSetup={!vaultMeta || !vaultMeta.isInitialized}
        onClose={vaultMeta?.isInitialized ? () => setIsMasterPasswordModalOpen(false) : undefined}
        onSubmitPassword={handleMasterPasswordSubmit}
        onUnlockWithRecoveryKey={handleUnlockWithRecoveryKey}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
        initialEntry={editingPassword}
        categories={categories}
        defaultCategoryId={selectedCategory || undefined}
        settings={settings}
      />

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSave={handleSaveBookmark}
        initialBookmark={editingBookmark}
        categories={categories}
        defaultCategoryId={selectedCategory || undefined}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        defaultParentId={categoryModalParentId}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={bookmarks}
        passwords={decryptedPasswords}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        isUnlocked={isUnlocked}
        onCopyText={handleCopyText}
        onNavigate={setCurrentView}
        onOpenAddPassword={() => {
          if (!isUnlocked) {
            setIsMasterPasswordModalOpen(true);
          } else {
            setEditingPassword(null);
            setIsPasswordModalOpen(true);
          }
          setIsCommandPaletteOpen(false);
        }}
        onOpenAddBookmark={() => {
          setEditingBookmark(null);
          setIsBookmarkModalOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onLockVault={() => {
          if (isUnlocked) lockVault();
          setIsCommandPaletteOpen(false);
        }}
        onSelectPassword={(entry) => {
          setEditingPassword(entry);
          setIsPasswordModalOpen(true);
        }}
        onSelectBookmark={(bm) => {
          setEditingBookmark(bm);
          setIsBookmarkModalOpen(true);
        }}
      />

      <ExtensionGuideModal
        isOpen={isExtensionGuideOpen}
        onClose={() => setIsExtensionGuideOpen(false)}
      />

      <ImportBackupModal
        isOpen={isImportBackupModalOpen}
        onClose={() => {
          setIsImportBackupModalOpen(false);
          setPendingEncryptedBackup(null);
          setPendingUnencryptedBackup(null);
        }}
        encryptedFile={pendingEncryptedBackup}
        unencryptedPayload={pendingUnencryptedBackup}
        onConfirmRestore={handleConfirmRestoreBackup}
      />

      {confirmDialog && (
        <ConfirmationModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isDestructive={confirmDialog.isDestructive}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

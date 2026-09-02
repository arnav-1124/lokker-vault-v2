"use client";

/**
 * Backup domain of the vault context: encrypted/plaintext backup export,
 Lokker/external import, CSV export, restore (merge/replace), and the
 destructive vault reset.
 */

import * as React from "react";
import type { LokkerBackupPayload } from "@/types";
import {
  saveVaultMeta,
  saveAllBookmarks,
  saveAllCategories,
  saveSettings,
  resetDatabase,
  getEncryptedFiles,
  saveEncryptedFile,
} from "@/lib/db";
import { verifyMasterPassword } from "@/lib/crypto";
import {
  createLokkerBackupPayload,
  exportEncryptedLokkerBackup,
  inspectBackupFileText,
} from "@/lib/backup";
import { parseCSVToEntries, parseJSONBackupText } from "@/lib/importers";
import { downloadTextFile } from "@/lib/download";
import { useVaultUI } from "./vault-ui-context";
import { useVaultSecurity } from "./vault-security-context";
import { useVaultData, normalizeHost } from "./vault-data-context";
import type { VaultBackupContextType } from "./vault-types";

const VaultBackupContext = React.createContext<VaultBackupContextType | null>(null);

export function useVaultBackup(): VaultBackupContextType {
  const ctx = React.useContext(VaultBackupContext);
  if (!ctx) throw new Error("useVaultBackup must be used within VaultBackupProvider");
  return ctx;
}

export function VaultBackupProvider({ children }: { children: React.ReactNode }) {
  const {
    addToast, showConfirm,
    setIsMasterPasswordModalOpen,
    setIsBackupPasswordModalOpen,
    setIsImportBackupModalOpen,
    setPendingEncryptedBackup, setPendingUnencryptedBackup,
  } = useVaultUI();
  const {
    vaultMeta, isUnlocked, derivedKey, decryptedPasswords, settings,
    setVaultMeta, setIsUnlocked, setDerivedKey, setDecryptedPasswords,
    setSettingsState, saveAndEncryptPasswords,
  } = useVaultSecurity();
  const {
    bookmarks, categories, setBookmarks, setCategories,
  } = useVaultData();

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to parse backup file.";
        addToast(message, "error");
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to parse file.";
        addToast(message, "error");
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

  const value: VaultBackupContextType = {
    handleExportEncryptedBackup, handleBackupPasswordSubmit,
    handleExportUnencryptedBackup,
    handleImportLokkerBackupFile, handleImportExternalFile, handleExportCSV,
    handleConfirmRestoreBackup, handleResetVault,
  };

  return <VaultBackupContext.Provider value={value}>{children}</VaultBackupContext.Provider>;
}

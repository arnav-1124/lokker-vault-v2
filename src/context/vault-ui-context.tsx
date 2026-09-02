"use client";

/**
 * UI domain of the vault context: modal/dialog visibility, workspace
 * filter state (selected category, search), toasts, and keyboard
 * shortcuts. Pure presentation state — no crypto, no persistence.
 */

import * as React from "react";
import type { Bookmark, PasswordEntry, ToastMessage, LokkerBackupPayload, LokkerEncryptedBackupFile } from "@/types";
import { generateId } from "@/lib/id";
import type { ConfirmDialogState, DeleteTransferDialogState, VaultUIContextType } from "./vault-types";

const VaultUIContext = React.createContext<VaultUIContextType | null>(null);

export function useVaultUI(): VaultUIContextType {
  const ctx = React.useContext(VaultUIContext);
  if (!ctx) throw new Error("useVaultUI must be used within VaultUIProvider");
  return ctx;
}

export function VaultUIProvider({ children }: { children: React.ReactNode }) {
  // Workspace filter state
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

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

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);

  // Category delete-transfer dialog
  const [deleteTransferDialog, setDeleteTransferDialog] = React.useState<DeleteTransferDialogState | null>(null);

  // Toast system
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToasts((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      const id = generateId("toast");
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

  const dismissConfirm = React.useCallback(() => setConfirmDialog(null), []);

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

  const value: VaultUIContextType = {
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
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
    toasts, addToast, dismissToast, showConfirm, dismissConfirm,
  };

  return <VaultUIContext.Provider value={value}>{children}</VaultUIContext.Provider>;
}

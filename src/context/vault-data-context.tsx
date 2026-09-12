"use client";

/**
 * Data domain of the vault context: bookmarks, categories, and the CRUD /
 * sync handlers for password entries and bookmarks (including the
 * add-sync, delete-isolation, and linked-edit suggestion semantics).
 */

import * as React from "react";
import type { Bookmark, Category, PasswordEntry } from "@/types";
import {
  getBookmarks,
  saveBookmark,
  saveAllBookmarks,
  deleteBookmarkDB,
  getCategories,
  saveCategoryDB,
  saveAllCategories,
} from "@/lib/db";
import { generateId } from "@/lib/id";
import { reconcileMissingCategories } from "@/lib/category-tree";
import {
  prepareCloudSyncPayload,
  encryptAndUploadCloudVault,
  downloadAndDecryptCloudVault,
  deleteCloudVault,
  mergeCloudVaultWithLocal,
} from "@/lib/cloud-sync";
import { getCloudSession, CLOUD_AUTH_CHANGE_EVENT } from "@/lib/auth-session";
import { appConfig } from "@/config/app";
import { useVaultUI } from "./vault-ui-context";
import { useVaultSecurity } from "./vault-security-context";
import type { VaultDataContextType } from "./vault-types";

/** Normalizes a URL or hostname to a bare hostname for linking/matching. */
export function normalizeHost(str: string): string {
  if (!str) return "";
  try {
    const raw = str.startsWith("http") ? str : `https://${str}`;
    return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return str.trim().toLowerCase();
  }
}

const VaultDataContext = React.createContext<VaultDataContextType | null>(null);

export function useVaultData(): VaultDataContextType {
  const ctx = React.useContext(VaultDataContext);
  if (!ctx) throw new Error("useVaultData must be used within VaultDataProvider");
  return ctx;
}

export function VaultDataProvider({ children }: { children: React.ReactNode }) {
  const {
    addToast, showConfirm, setDeleteTransferDialog,
    setEditingPassword, setIsPasswordModalOpen, setEditingBookmark, setIsBookmarkModalOpen,
    selectedCategory, setSelectedCategory,
  } = useVaultUI();
  const {
    vaultMeta, isUnlocked, derivedKey, decryptedPasswords,
    saveAndEncryptPasswords,
  } = useVaultSecurity();

  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = React.useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("lokker_last_synced_at");
  });
  const [cloudItemCount, setCloudItemCount] = React.useState<number>(0);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // Debounced auto-sync timer ref
  const autoSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Keep live count of items with storageScope: 'cloud'
  const localCloudItemCount = React.useMemo(() => {
    return (
      decryptedPasswords.filter((p) => p.storageScope === "cloud").length +
      bookmarks.filter((b) => b.storageScope === "cloud").length
    );
  }, [decryptedPasswords, bookmarks]);

  const effectiveCloudItemCount = cloudItemCount > 0 ? cloudItemCount : localCloudItemCount;

  // When a linked-entry edit modal is opened from a sync suggestion, the next
  // save must not trigger the mirrored suggestion again (ping-pong guard).
  const skipSyncSuggestionRef = React.useRef(false);

  // Core Cloud Sync Orchestrator
  const triggerCloudSync = React.useCallback(
    async (options?: { force?: boolean }): Promise<boolean> => {
      const session = getCloudSession();
      if (!session?.accessToken) {
        setSyncStatus("idle");
        return false;
      }
      if (!isUnlocked || !derivedKey) {
        return false;
      }

      setSyncStatus("syncing");
      setSyncError(null);

      try {
        // 1. Download cloud vault (if any)
        const downloadResult = await downloadAndDecryptCloudVault(
          derivedKey,
          session.accessToken,
          appConfig.apiUrl
        );

        let currentPasswords = decryptedPasswords;
        let currentBookmarks = bookmarks;
        let currentCategories = categories;

        if (downloadResult.exists && downloadResult.payload) {
          const merged = mergeCloudVaultWithLocal(
            {
              passwords: decryptedPasswords,
              bookmarks,
              categories,
            },
            downloadResult.payload
          );

          if (merged.hasChanges) {
            currentPasswords = merged.mergedPasswords;
            currentBookmarks = merged.mergedBookmarks;
            currentCategories = merged.mergedCategories;

            await saveAndEncryptPasswords(currentPasswords);
            setBookmarks(currentBookmarks);
            await saveAllBookmarks(currentBookmarks);
            setCategories(currentCategories);
            await saveAllCategories(currentCategories);
          }
        }

        // 2. Prepare payload of local cloud-scoped items to sync upstream
        const uploadPayload = prepareCloudSyncPayload({
          passwords: currentPasswords,
          bookmarks: currentBookmarks,
          categories: currentCategories,
        });

        // 3. Encrypt and upload
        const uploadResult = await encryptAndUploadCloudVault(
          derivedKey,
          uploadPayload,
          session.accessToken,
          appConfig.apiUrl
        );

        setSyncStatus("synced");
        setLastSyncedAt(uploadResult.updatedAt);
        setCloudItemCount(uploadResult.itemCount);
        if (typeof window !== "undefined") {
          localStorage.setItem("lokker_last_synced_at", uploadResult.updatedAt);
        }

        if (options?.force) {
          addToast("Cloud vault synchronized securely.", "success");
        }
        return true;
      } catch (err: any) {
        console.error("Cloud sync error:", err);
        setSyncStatus("error");
        setSyncError(err.message || "Failed to synchronize with cloud");
        if (options?.force) {
          addToast(err.message || "Unable to sync with cloud", "error");
        }
        return false;
      }
    },
    [isUnlocked, derivedKey, decryptedPasswords, bookmarks, categories, saveAndEncryptPasswords, addToast]
  );

  const deleteCloudBackup = React.useCallback(async (): Promise<boolean> => {
    const session = getCloudSession();
    if (!session?.accessToken) return false;
    try {
      await deleteCloudVault(session.accessToken, appConfig.apiUrl);
      setLastSyncedAt(null);
      setCloudItemCount(0);
      setSyncStatus("idle");
      if (typeof window !== "undefined") {
        localStorage.removeItem("lokker_last_synced_at");
      }
      addToast("Cloud backup removed successfully. Your local vault is preserved.", "info");
      return true;
    } catch (err: any) {
      addToast(err.message || "Failed to remove cloud backup", "error");
      return false;
    }
  }, [addToast]);

  const scheduleAutoSync = React.useCallback(() => {
    const session = getCloudSession();
    if (!session?.accessToken || !isUnlocked || !derivedKey) return;
    if (autoSyncTimeoutRef.current) {
      clearTimeout(autoSyncTimeoutRef.current);
    }
    autoSyncTimeoutRef.current = setTimeout(() => {
      triggerCloudSync();
    }, 1500);
  }, [isUnlocked, derivedKey, triggerCloudSync]);

  // Trigger sync on unlock if cloud session exists
  const hasTriggeredInitialSyncRef = React.useRef(false);
  React.useEffect(() => {
    if (isUnlocked && derivedKey && getCloudSession()) {
      if (!hasTriggeredInitialSyncRef.current) {
        hasTriggeredInitialSyncRef.current = true;
        triggerCloudSync();
      }
    } else if (!isUnlocked) {
      hasTriggeredInitialSyncRef.current = false;
    }
  }, [isUnlocked, derivedKey, triggerCloudSync]);

  // Sync on auth session changes (login/logout)
  React.useEffect(() => {
    const handleAuthChange = () => {
      const session = getCloudSession();
      if (session && isUnlocked && derivedKey) {
        triggerCloudSync();
      } else if (!session) {
        setSyncStatus("idle");
        setLastSyncedAt(null);
        setCloudItemCount(0);
        if (typeof window !== "undefined") {
          localStorage.removeItem("lokker_last_synced_at");
        }
      }
    };
    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
  }, [isUnlocked, derivedKey, triggerCloudSync]);

  // Initialize bookmark + category collections
  React.useEffect(() => {
    async function loadData() {
      try {
        const [bms, cats] = await Promise.all([getBookmarks(), getCategories()]);
        setBookmarks(bms);
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load bookmark/category collections:", err);
      }
    }
    loadData();
  }, []);

  // Auto-heal missing categories (e.g. when signing in with cloud-saved entries)
  React.useEffect(() => {
    if (categories.length === 0) return;
    const entriesToCheck = [
      ...decryptedPasswords.map((p) => ({ category: p.category })),
      ...bookmarks.map((b) => ({ category: b.category })),
    ];
    const { updatedCategories, addedCount } = reconcileMissingCategories(entriesToCheck, categories);
    if (addedCount > 0) {
      setCategories(updatedCategories);
      saveAllCategories(updatedCategories).catch(() => {});
    }
  }, [decryptedPasswords, bookmarks, categories]);

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
    if (bookmark.storageScope === "cloud") {
      scheduleAutoSync();
    }

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
      id: generateId("pwd-sync"),
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
    if (target) {
      await saveBookmark(target);
      if (target.storageScope === "cloud") {
        scheduleAutoSync();
      }
    }
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
        if (target?.storageScope === "cloud") {
          scheduleAutoSync();
        }
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
      id: generateId("bm-sync"),
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
    scheduleAutoSync();
    addToast(
      existingIndex >= 0 ? "Password updated & bookmark linked." : "Password stored & synced to bookmarks.",
      "success"
    );
  };

  const handleTogglePasswordFavorite = async (id: string) => {
    const updated = decryptedPasswords.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    await saveAndEncryptPasswords(updated);
    const target = updated.find((p) => p.id === id);
    if (target?.storageScope === "cloud") {
      scheduleAutoSync();
    }
  };

  const handleDeletePassword = async (id: string) => {
    const target = decryptedPasswords.find((p) => p.id === id);
    showConfirm(
      "Delete Password Entry",
      `Are you sure you want to permanently delete credentials for "${target?.websiteName || "this entry"}"?`,
      async () => {
        await saveAndEncryptPasswords(decryptedPasswords.filter((p) => p.id !== id));
        if (target?.storageScope === "cloud") {
          scheduleAutoSync();
        }
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
    const newCat: Category = { id: generateId("cat"), name, color, parentId };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCategoryDB(newCat);
    addToast(`Category "${name}" created.`, "success");
  };

  const handleDeleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const catName = target.name;
    const pwCount = decryptedPasswords.filter((p) => p.category.toLowerCase() === catName.toLowerCase()).length;
    const bmCount = bookmarks.filter((b) => (b.category || "").toLowerCase() === catName.toLowerCase()).length;
    const childCount = categories.filter((c) => c.parentId === id).length;
    // Always open the Transfer & Delete dialog to prevent any accidental data loss
    setDeleteTransferDialog({
      categoryId: id,
      categoryName: catName,
      passwordCount: pwCount,
      bookmarkCount: bmCount,
      childCount,
    });
  };

  const handleTransferAndDelete = async (targetCategoryId: string, transferToCatName: string) => {
    const targetCat = categories.find((c) => c.id === targetCategoryId);
    if (!targetCat) return;
    const catName = targetCat.name;
    const destinationCat = categories.find((c) => c.name === transferToCatName);
    const destCatId = destinationCat ? destinationCat.id : undefined;

    // 1. Transfer passwords
    const updatedPws = decryptedPasswords.map((p) =>
      p.category.toLowerCase() === catName.toLowerCase() ? { ...p, category: transferToCatName } : p
    );
    await saveAndEncryptPasswords(updatedPws);

    // 2. Transfer bookmarks
    const updatedBms = bookmarks.map((b) =>
      (b.category || "").toLowerCase() === catName.toLowerCase() ? { ...b, category: transferToCatName } : b
    );
    setBookmarks(updatedBms);
    await saveAllBookmarks(updatedBms);

    // 3. Transfer subcategories: re-parent to the destination category!
    const updatedCats = categories
      .map((c) => (c.parentId === targetCategoryId ? { ...c, parentId: destCatId } : c))
      .filter((c) => c.id !== targetCategoryId);
    setCategories(updatedCats);
    await saveAllCategories(updatedCats);

    if (selectedCategory?.toLowerCase() === catName.toLowerCase()) {
      setSelectedCategory(transferToCatName);
    }
    setDeleteTransferDialog(null);
    addToast(`All items safely moved to "${transferToCatName}" and category removed.`, "success");
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

  const value: VaultDataContextType = {
    bookmarks, categories,
    setBookmarks, setCategories,
    syncStatus,
    lastSyncedAt,
    cloudItemCount: effectiveCloudItemCount,
    syncError,
    triggerCloudSync,
    deleteCloudBackup,
    handleSavePassword, handleDeletePassword, handleTogglePasswordFavorite,
    handleSaveBookmark, handleDeleteBookmark, handleToggleBookmarkFavorite,
    handleAddCategory, handleDeleteCategory, handleTransferAndDelete, handleRenameCategory,
    handleCopyText,
  };

  return <VaultDataContext.Provider value={value}>{children}</VaultDataContext.Provider>;
}

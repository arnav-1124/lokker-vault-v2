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

  // When a linked-entry edit modal is opened from a sync suggestion, the next
  // save must not trigger the mirrored suggestion again (ping-pong guard).
  const skipSyncSuggestionRef = React.useRef(false);

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

  const value: VaultDataContextType = {
    bookmarks, categories,
    setBookmarks, setCategories,
    handleSavePassword, handleDeletePassword, handleTogglePasswordFavorite,
    handleSaveBookmark, handleDeleteBookmark, handleToggleBookmarkFavorite,
    handleAddCategory, handleDeleteCategory, handleTransferAndDelete, handleRenameCategory,
    handleCopyText,
  };

  return <VaultDataContext.Provider value={value}>{children}</VaultDataContext.Provider>;
}

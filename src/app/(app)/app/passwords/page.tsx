"use client";

import { useVault } from "@/context/vault-context";
import { PasswordListView } from "@/components/views/password-list-view";

export default function PasswordsPage() {
  const vault = useVault();

  return (
    <PasswordListView
      passwords={vault.decryptedPasswords}
      isUnlocked={vault.isUnlocked}
      selectedCategory={vault.selectedCategory}
      searchQuery={vault.searchQuery}
      onUnlockVaultClick={() => vault.setIsMasterPasswordModalOpen(true)}
      onToggleFavorite={vault.handleTogglePasswordFavorite}
      onEdit={(entry) => {
        vault.setEditingPassword(entry);
        vault.setIsPasswordModalOpen(true);
      }}
      onDelete={vault.handleDeletePassword}
      onCopyText={vault.handleCopyText}
      onOpenAddModal={() => {
        vault.setEditingPassword(null);
        vault.setIsPasswordModalOpen(true);
      }}
      categories={vault.categories}
      bookmarks={vault.bookmarks}
      onNavigateBookmark={(bm) => {
        vault.setEditingBookmark(bm);
        vault.setIsBookmarkModalOpen(true);
      }}
    />
  );
}

"use client";

import { useVault } from "@/context/vault-context";
import { BookmarkListView } from "@/components/views/bookmark-list-view";

export default function BookmarksPage() {
  const vault = useVault();

  return (
    <BookmarkListView
      bookmarks={vault.bookmarks}
      selectedCategory={vault.selectedCategory}
      searchQuery={vault.searchQuery}
      onToggleFavorite={vault.handleToggleBookmarkFavorite}
      onEdit={(bm) => {
        vault.setEditingBookmark(bm);
        vault.setIsBookmarkModalOpen(true);
      }}
      onDelete={vault.handleDeleteBookmark}
      onOpenAddModal={() => {
        vault.setEditingBookmark(null);
        vault.setIsBookmarkModalOpen(true);
      }}
      categories={vault.categories}
      passwords={vault.decryptedPasswords}
      onNavigateCredential={(p) => {
        vault.setEditingPassword(p);
        vault.setIsPasswordModalOpen(true);
      }}
    />
  );
}

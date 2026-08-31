"use client";

import { useVault } from "@/context/vault-context";
import { PasswordListView } from "@/components/views/password-list-view";
import { BookmarkListView } from "@/components/views/bookmark-list-view";
import { Star } from "lucide-react";

export default function FavoritesPage() {
  const vault = useVault();

  return (
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
            bookmarks={vault.bookmarks.filter((b) => b.isFavorite)}
            selectedCategory={null}
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
        </div>

        {vault.isUnlocked && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Passwords
            </h3>
            <PasswordListView
              passwords={vault.decryptedPasswords.filter((p) => p.isFavorite)}
              isUnlocked={true}
              selectedCategory={null}
              searchQuery={vault.searchQuery}
              onUnlockVaultClick={() => {}}
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
            />
          </div>
        )}
      </div>
    </div>
  );
}

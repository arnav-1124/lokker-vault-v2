"use client";

import { useVault } from "@/context/vault-context";
import { DashboardHeroView } from "@/components/views/dashboard-hero-view";

export default function HomePage() {
  const vault = useVault();

  return (
    <DashboardHeroView
      onNavigate={vault.navigateTo}
      onOpenExtensionGuide={() => vault.setIsExtensionGuideOpen(true)}
      isUnlocked={vault.isUnlocked}
      onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
      lastBackupTime={vault.settings.lastBackupTime}
      onBackupExportClick={vault.handleExportEncryptedBackup}
      passwordCount={vault.decryptedPasswords.length}
      bookmarkCount={vault.bookmarks.length}
      categoryCount={vault.categories.length}
      passwords={vault.decryptedPasswords}
      bookmarks={vault.bookmarks}
      onOpenAddPassword={() => {
        if (!vault.isUnlocked) {
          vault.setIsMasterPasswordModalOpen(true);
        } else {
          vault.setEditingPassword(null);
          vault.setIsPasswordModalOpen(true);
        }
      }}
      onOpenAddBookmark={() => {
        vault.setEditingBookmark(null);
        vault.setIsBookmarkModalOpen(true);
      }}
      onEditPassword={(entry) => {
        vault.setEditingPassword(entry);
        vault.setIsPasswordModalOpen(true);
      }}
      onCopyText={vault.handleCopyText}
    />
  );
}

"use client";

import { useVault } from "@/context/vault-context";
import { VaultProvider } from "@/context/vault-context";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MasterPasswordModal } from "@/components/modals/master-password-modal";
import { PasswordModal } from "@/components/modals/password-modal";
import { BookmarkModal } from "@/components/modals/bookmark-modal";
import { CategoryManagerModal } from "@/components/modals/category-modal";
import { CategoryDeleteModal } from "@/components/modals/category-delete-modal";
import { CommandPalette } from "@/components/modals/command-palette";
import { ExtensionGuideModal } from "@/components/modals/extension-guide-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { ImportBackupModal } from "@/components/modals/import-backup-modal";
import { ToastContainer } from "@/components/toast-container";

function AppShell({ children }: { children: React.ReactNode }) {
  const vault = useVault();

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <AppSidebar
        onSelectView={vault.navigateTo}
        categories={vault.categories}
        selectedCategory={vault.selectedCategory}
        onSelectCategory={vault.setSelectedCategory}
        isUnlocked={vault.isUnlocked}
        onOpenCategoryManager={(parentId) => {
          vault.setCategoryModalParentId(parentId);
          vault.setIsCategoryModalOpen(true);
        }}
        onRenameCategory={vault.handleRenameCategory}
        onDeleteCategory={vault.handleDeleteCategory}
        bookmarkCount={vault.bookmarks.length}
        passwordCount={vault.decryptedPasswords.length}
        isMobileOpen={vault.isMobileSidebarOpen}
        onCloseMobile={() => vault.setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto lokker-scrollbar">
        <AppHeader
          searchQuery={vault.searchQuery}
          onSearchChange={vault.setSearchQuery}
          isUnlocked={vault.isUnlocked}
          autoLockMinutes={vault.settings.autoLockMinutes}
          onToggleLock={() => {
            if (vault.isUnlocked) vault.lockVault();
            else vault.setIsMasterPasswordModalOpen(true);
          }}
          onOpenCommandPalette={() => vault.setIsCommandPaletteOpen(true)}
          onOpenNewItemModal={() => {
            if (vault.currentView === "bookmarks") {
              vault.setEditingBookmark(null);
              vault.setIsBookmarkModalOpen(true);
            } else {
              if (!vault.isUnlocked) {
                vault.setIsMasterPasswordModalOpen(true);
              } else {
                vault.setEditingPassword(null);
                vault.setIsPasswordModalOpen(true);
              }
            }
          }}
          onToggleMobileSidebar={() => vault.setIsMobileSidebarOpen(!vault.isMobileSidebarOpen)}
          onOpenExtensionGuide={() => vault.setIsExtensionGuideOpen(true)}
        />

        {/* Route content renders here */}
        <main className="flex-1 pb-16">{children}</main>
      </div>

      {/* Dialog Modals — shared across all routes */}
      <MasterPasswordModal
        isOpen={vault.isMasterPasswordModalOpen}
        isInitialSetup={!vault.vaultMeta || !vault.vaultMeta.isInitialized}
        onClose={vault.vaultMeta?.isInitialized ? () => vault.setIsMasterPasswordModalOpen(false) : undefined}
        onSubmitPassword={vault.handleMasterPasswordSubmit}
        onUnlockWithRecoveryKey={vault.handleUnlockWithRecoveryKey}
        onUnlockWithWebAuthn={vault.handleUnlockWithWebAuthn}
        hasWebAuthnCredential={!!vault.vaultMeta?.webauthnCredentialId}
      />

      <PasswordModal
        isOpen={vault.isPasswordModalOpen}
        onClose={() => vault.setIsPasswordModalOpen(false)}
        onSave={vault.handleSavePassword}
        initialEntry={vault.editingPassword}
        categories={vault.categories}
        defaultCategoryId={vault.selectedCategory || undefined}
        settings={vault.settings}
      />

      <BookmarkModal
        isOpen={vault.isBookmarkModalOpen}
        onClose={() => vault.setIsBookmarkModalOpen(false)}
        onSave={vault.handleSaveBookmark}
        initialBookmark={vault.editingBookmark}
        categories={vault.categories}
        defaultCategoryId={vault.selectedCategory || undefined}
      />

      <CategoryManagerModal
        isOpen={vault.isCategoryModalOpen}
        onClose={() => vault.setIsCategoryModalOpen(false)}
        categories={vault.categories}
        onAddCategory={vault.handleAddCategory}
        onDeleteCategory={vault.handleDeleteCategory}
        defaultParentId={vault.categoryModalParentId}
      />

      <CategoryDeleteModal
        isOpen={!!vault.deleteTransferDialog}
        categoryName={vault.deleteTransferDialog?.categoryName || ""}
        passwordCount={vault.deleteTransferDialog?.passwordCount || 0}
        bookmarkCount={vault.deleteTransferDialog?.bookmarkCount || 0}
        childCount={vault.deleteTransferDialog?.childCount || 0}
        categories={vault.categories}
        deleteCategoryId={vault.deleteTransferDialog?.categoryId || ""}
        onTransferAndDelete={vault.handleTransferAndDelete}
        onClose={() => vault.setDeleteTransferDialog(null)}
      />

      <CommandPalette
        isOpen={vault.isCommandPaletteOpen}
        onClose={() => vault.setIsCommandPaletteOpen(false)}
        bookmarks={vault.bookmarks}
        passwords={vault.decryptedPasswords}
        categories={vault.categories.map((c) => ({ id: c.id, name: c.name }))}
        isUnlocked={vault.isUnlocked}
        onCopyText={vault.handleCopyText}
        onNavigate={vault.navigateTo}
        onOpenAddPassword={() => {
          if (!vault.isUnlocked) {
            vault.setIsMasterPasswordModalOpen(true);
          } else {
            vault.setEditingPassword(null);
            vault.setIsPasswordModalOpen(true);
          }
          vault.setIsCommandPaletteOpen(false);
        }}
        onOpenAddBookmark={() => {
          vault.setEditingBookmark(null);
          vault.setIsBookmarkModalOpen(true);
          vault.setIsCommandPaletteOpen(false);
        }}
        onLockVault={() => {
          if (vault.isUnlocked) vault.lockVault();
          vault.setIsCommandPaletteOpen(false);
        }}
        onSelectPassword={(entry) => {
          vault.setEditingPassword(entry);
          vault.setIsPasswordModalOpen(true);
        }}
        onSelectBookmark={(bm) => {
          vault.setEditingBookmark(bm);
          vault.setIsBookmarkModalOpen(true);
        }}
      />

      <ExtensionGuideModal
        isOpen={vault.isExtensionGuideOpen}
        onClose={() => vault.setIsExtensionGuideOpen(false)}
      />

      <ImportBackupModal
        isOpen={vault.isImportBackupModalOpen}
        onClose={() => {
          vault.setIsImportBackupModalOpen(false);
          vault.setPendingEncryptedBackup(null);
          vault.setPendingUnencryptedBackup(null);
        }}
        encryptedFile={vault.pendingEncryptedBackup}
        unencryptedPayload={vault.pendingUnencryptedBackup}
        onConfirmRestore={vault.handleConfirmRestoreBackup}
      />

      {vault.confirmDialog && (
        <ConfirmationModal
          isOpen={vault.confirmDialog.isOpen}
          title={vault.confirmDialog.title}
          message={vault.confirmDialog.message}
          confirmText={vault.confirmDialog.confirmText}
          cancelText={vault.confirmDialog.cancelText}
          isDestructive={vault.confirmDialog.isDestructive}
          onConfirm={vault.confirmDialog.onConfirm}
          onClose={() => vault.dismissConfirm()}
        />
      )}

      {/* Toast System */}
      <ToastContainer toasts={vault.toasts} onDismiss={vault.dismissToast} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <VaultProvider>
      <AppShell>{children}</AppShell>
    </VaultProvider>
  );
}

"use client";

import * as React from "react";
import { useVault } from "@/context/vault-context";
import { VaultProvider } from "@/context/vault-context";

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
import { CategoryDeleteModal } from "@/components/modals/category-delete-modal";
import { CommandPalette } from "@/components/modals/command-palette";
import { ExtensionGuideModal } from "@/components/modals/extension-guide-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { ImportBackupModal } from "@/components/modals/import-backup-modal";
import { ToastContainer } from "@/components/toast-container";
import { Star, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";

function AppWorkspace() {
  const vault = useVault();

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <AppSidebar
        currentView={vault.currentView}
        onSelectView={vault.setCurrentView}
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
          currentView={vault.currentView}
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

        {/* View Renderer */}
        <main className="flex-1 pb-16">
          {vault.currentView === "home" && (
            <DashboardHeroView
              onNavigate={vault.setCurrentView}
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
          )}

          {vault.currentView === "passwords" && (
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
          )}

          {vault.currentView === "bookmarks" && (
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
          )}

          {vault.currentView === "favorites" && (
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
          )}

          {vault.currentView === "totp" && (
            <TotpView
              passwords={vault.decryptedPasswords}
              onEditPassword={(entry) => {
                vault.setEditingPassword(entry);
                vault.setIsPasswordModalOpen(true);
              }}
              addToast={vault.addToast}
            />
          )}

          {vault.currentView === "security-audit" && (
            <SecurityAuditView
              passwords={vault.decryptedPasswords}
              isUnlocked={vault.isUnlocked}
              onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
              onEditPassword={(entry) => {
                vault.setEditingPassword(entry);
                vault.setIsPasswordModalOpen(true);
              }}
              onUpdatePassword={vault.handleSavePassword}
              addToast={vault.addToast}
            />
          )}

          {vault.currentView === "generator" && (
            <GeneratorView
              onCopyText={vault.handleCopyText}
              onSaveAsCredential={(pwd) => {
                if (!vault.isUnlocked) {
                  vault.addToast("Please unlock your vault to save credentials.", "info");
                  vault.setIsMasterPasswordModalOpen(true);
                } else {
                  vault.setEditingPassword({
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
                  vault.setIsPasswordModalOpen(true);
                }
              }}
            />
          )}

          {vault.currentView === "import-export" && (
            <ImportExportView
              isUnlocked={vault.isUnlocked}
              onUnlockVaultClick={() => vault.setIsMasterPasswordModalOpen(true)}
              onImportLokkerBackupFile={vault.handleImportLokkerBackupFile}
              onImportExternalFile={vault.handleImportExternalFile}
              onExportEncryptedBackup={vault.handleExportEncryptedBackup}
              onExportUnencryptedBackup={vault.handleExportUnencryptedBackup}
              onExportCSV={vault.handleExportCSV}
              addToast={vault.addToast}
            />
          )}

          {vault.currentView === "files" && (
            <FileVaultView
              derivedKey={vault.derivedKey}
              showConfirm={vault.showConfirm}
              onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
              addToast={vault.addToast}
            />
          )}

          {vault.currentView === "masked-emails" && (
            <MaskedEmailsView
              passwords={vault.decryptedPasswords}
              isUnlocked={vault.isUnlocked}
              onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
              onEditPassword={(entry) => {
                vault.setEditingPassword(entry);
                vault.setIsPasswordModalOpen(true);
              }}
              addToast={vault.addToast}
              onNavigate={vault.setCurrentView}
            />
          )}

          {vault.currentView === "settings" && (
            <SettingsView
              settings={vault.settings}
              onUpdateSettings={async (newSt) => {
                await vault.updateSettings(newSt);
                vault.addToast("Settings updated.", "success");
              }}
              onExportJSON={vault.handleExportEncryptedBackup}
              onExportCSV={vault.handleExportCSV}
              onImportFile={vault.handleImportLokkerBackupFile}
              onResetVault={vault.handleResetVault}
              isUnlocked={vault.isUnlocked}
              onOpenExtensionGuide={() => vault.setIsExtensionGuideOpen(true)}
              isWebAuthnRegistered={!!vault.vaultMeta?.webauthnCredentialId}
              onRegisterWebAuthn={vault.handleRegisterWebAuthn}
              onUnregisterWebAuthn={vault.handleUnregisterWebAuthn}
            />
          )}

          {vault.currentView === "guide" && (
            <FeatureGuideView
              onSelectView={vault.setCurrentView}
              onOpenCommandPalette={() => vault.setIsCommandPaletteOpen(true)}
            />
          )}

          {vault.currentView === "extension" && (
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
                  onClick={() => vault.setIsExtensionGuideOpen(true)}
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
        onNavigate={vault.setCurrentView}
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

export default function AppWorkspacePage() {
  return (
    <VaultProvider>
      <AppWorkspace />
    </VaultProvider>
  );
}

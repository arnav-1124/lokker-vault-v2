"use client";

import { useVault } from "@/context/vault-context";
import { SettingsView } from "@/components/views/settings-view";

export default function SettingsPage() {
  const vault = useVault();

  return (
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
  );
}

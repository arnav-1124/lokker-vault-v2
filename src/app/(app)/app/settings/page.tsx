"use client";

import * as React from "react";
import { useVault } from "@/context/vault-context";
import { SettingsView } from "@/components/views/settings-view";
import { ChangeMasterPasswordModal } from "@/components/modals/change-master-password-modal";
import { RecoveryKeyModal } from "@/components/modals/recovery-key-modal";

export default function SettingsPage() {
  const vault = useVault();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = React.useState(false);
  const [isRecoveryKeyModalOpen, setIsRecoveryKeyModalOpen] = React.useState(false);

  return (
    <>
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
        onChangeMasterPasswordClick={() => setIsChangePasswordModalOpen(true)}
        onOpenRecoveryKeyClick={() => setIsRecoveryKeyModalOpen(true)}
      />

      <ChangeMasterPasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSubmit={vault.handleChangeMasterPassword}
      />

      <RecoveryKeyModal
        isOpen={isRecoveryKeyModalOpen}
        onClose={() => setIsRecoveryKeyModalOpen(false)}
        onVerify={vault.handleVerifyMasterPassword}
        onApply={vault.handleRegenerateRecoveryKey}
      />
    </>
  );
}

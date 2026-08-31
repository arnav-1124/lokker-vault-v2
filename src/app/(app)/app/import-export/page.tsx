"use client";

import { useVault } from "@/context/vault-context";
import { ImportExportView } from "@/components/views/import-export-view";

export default function ImportExportPage() {
  const vault = useVault();

  return (
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
  );
}

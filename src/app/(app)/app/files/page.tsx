"use client";

import { useVault } from "@/context/vault-context";
import { FileVaultView } from "@/components/views/file-vault-view";

export default function FilesPage() {
  const vault = useVault();

  return (
    <FileVaultView
      derivedKey={vault.derivedKey}
      showConfirm={vault.showConfirm}
      onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
      addToast={vault.addToast}
    />
  );
}

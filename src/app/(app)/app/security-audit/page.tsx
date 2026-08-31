"use client";

import { useVault } from "@/context/vault-context";
import { SecurityAuditView } from "@/components/views/security-audit-view";

export default function SecurityAuditPage() {
  const vault = useVault();

  return (
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
  );
}

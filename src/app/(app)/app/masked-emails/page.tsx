"use client";

import { useVault } from "@/context/vault-context";
import { MaskedEmailsView } from "@/components/views/masked-emails-view";

export default function MaskedEmailsPage() {
  const vault = useVault();

  return (
    <MaskedEmailsView
      passwords={vault.decryptedPasswords}
      isUnlocked={vault.isUnlocked}
      onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
      onEditPassword={(entry) => {
        vault.setEditingPassword(entry);
        vault.setIsPasswordModalOpen(true);
      }}
      addToast={vault.addToast}
      onNavigate={vault.navigateTo}
    />
  );
}

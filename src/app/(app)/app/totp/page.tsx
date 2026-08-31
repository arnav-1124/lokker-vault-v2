"use client";

import { useVault } from "@/context/vault-context";
import { TotpView } from "@/components/views/totp-view";

export default function TotpPage() {
  const vault = useVault();

  return (
    <TotpView
      passwords={vault.decryptedPasswords}
      onEditPassword={(entry) => {
        vault.setEditingPassword(entry);
        vault.setIsPasswordModalOpen(true);
      }}
      addToast={vault.addToast}
    />
  );
}

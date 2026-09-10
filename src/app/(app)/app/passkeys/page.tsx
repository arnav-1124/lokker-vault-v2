"use client";

import { useVault } from "@/context/vault-context";
import { PasskeysView } from "@/components/views/passkeys-view";

export default function PasskeysPage() {
  const vault = useVault();

  return (
    <PasskeysView
      isUnlocked={vault.isUnlocked}
      onUnlockClick={() => vault.setIsMasterPasswordModalOpen(true)}
      addToast={vault.addToast}
      onNavigate={vault.navigateTo}
    />
  );
}

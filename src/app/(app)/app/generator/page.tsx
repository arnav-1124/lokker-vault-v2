"use client";

import { useVault } from "@/context/vault-context";
import { generateId } from "@/lib/id";
import { GeneratorView } from "@/components/views/generator-view";

export default function GeneratorPage() {
  const vault = useVault();

  return (
    <GeneratorView
      onCopyText={vault.handleCopyText}
      onSaveAsCredential={(pwd) => {
        if (!vault.isUnlocked) {
          vault.addToast("Please unlock your vault to save credentials.", "info");
          vault.setIsMasterPasswordModalOpen(true);
        } else {
          vault.setEditingPassword({
            id: generateId("pwd"),
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
  );
}

"use client";

import * as React from "react";
import { useWorkspace } from "@/context/workspace-context";
import { useVault } from "@/context/vault-context";
import { WorkspaceGeneratorView } from "@/components/workspace/workspace-generator-view";
import { WorkspacePasswordModal } from "@/components/workspace/workspace-password-modal";
import { PasswordEntry } from "@/types";

export default function WorkspaceGeneratorPage() {
  const {
    activeWorkspace,
    workspaceCategories,
    saveWorkspacePassword,
    isAdmin,
    canWrite,
  } = useWorkspace();
  const vault = useVault();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [prefilledEntry, setPrefilledEntry] = React.useState<Partial<PasswordEntry> | null>(null);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      vault.addToast(`${label} copied to clipboard`, "success");
    } catch {
      vault.addToast("Failed to copy to clipboard", "error");
    }
  };

  const handleSaveAsCredential = (password: string) => {
    setPrefilledEntry({
      websiteName: "",
      websiteUrl: "",
      username: "",
      password,
      notes: "Generated with Workspace Generator",
      category: workspaceCategories[0]?.name || "General",
      isFavorite: false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (entry: PasswordEntry) => {
    try {
      await saveWorkspacePassword(entry);
      vault.addToast("Saved credential to workspace successfully", "success");
      setIsModalOpen(false);
      setPrefilledEntry(null);
    } catch (err: any) {
      vault.addToast(err.message || "Failed to save credential", "error");
    }
  };

  return (
    <>
      <WorkspaceGeneratorView
        workspaceName={activeWorkspace?.name || "Workspace"}
        isAdmin={isAdmin}
        canWrite={canWrite}
        onCopyText={handleCopyText}
        onSaveAsCredential={handleSaveAsCredential}
      />

      {isModalOpen && (
        <WorkspacePasswordModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPrefilledEntry(null);
          }}
          onSave={handleSave}
          initialEntry={prefilledEntry as PasswordEntry}
          categories={workspaceCategories}
          workspaceName={activeWorkspace?.name}
        />
      )}
    </>
  );
}

"use client";

import * as React from "react";
import { useWorkspace } from "@/context/workspace-context";
import { useVault } from "@/context/vault-context";
import { WorkspaceSecurityAuditView } from "@/components/workspace/workspace-security-audit-view";
import { WorkspacePasswordModal } from "@/components/workspace/workspace-password-modal";
import { PasswordEntry } from "@/types";

export default function WorkspaceSecurityAuditPage() {
  const {
    activeWorkspace,
    workspacePasswords,
    workspaceCategories,
    saveWorkspacePassword,
    isAdmin,
    canWrite,
  } = useWorkspace();
  const vault = useVault();

  const [editingEntry, setEditingEntry] = React.useState<PasswordEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleEditPassword = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleSave = async (updated: PasswordEntry) => {
    try {
      await saveWorkspacePassword(updated);
      vault.addToast("Workspace credential updated successfully", "success");
    } catch (err: any) {
      vault.addToast(err.message || "Failed to update credential", "error");
    }
  };

  return (
    <>
      <WorkspaceSecurityAuditView
        workspaceName={activeWorkspace?.name || "Workspace"}
        passwords={workspacePasswords}
        isAdmin={isAdmin}
        canWrite={canWrite}
        onEditPassword={handleEditPassword}
        addToast={vault.addToast}
      />

      {isModalOpen && (
        <WorkspacePasswordModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSave}
          initialEntry={editingEntry}
          categories={workspaceCategories}
          workspaceName={activeWorkspace?.name}
        />
      )}
    </>
  );
}

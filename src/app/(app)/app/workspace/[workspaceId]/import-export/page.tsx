"use client";

import * as React from "react";
import { useWorkspace } from "@/context/workspace-context";
import { useVault } from "@/context/vault-context";
import { WorkspaceImportExportView } from "@/components/workspace/workspace-import-export-view";

export default function WorkspaceImportExportPage() {
  const {
    activeWorkspace,
    isAdmin,
    workspacePasswords,
    workspaceBookmarks,
    workspaceCategories,
    exportWorkspaceEncrypted,
    exportWorkspaceCSV,
    exportWorkspaceJSON,
    importWorkspaceCredentials,
  } = useWorkspace();
  const vault = useVault();

  return (
    <WorkspaceImportExportView
      workspaceName={activeWorkspace?.name || "Workspace"}
      isAdmin={isAdmin}
      passwordsCount={workspacePasswords.length}
      bookmarksCount={workspaceBookmarks.length}
      categoriesCount={workspaceCategories.length}
      onExportEncrypted={exportWorkspaceEncrypted}
      onExportCSV={exportWorkspaceCSV}
      onExportJSON={exportWorkspaceJSON}
      onImportCredentials={importWorkspaceCredentials}
      addToast={vault.addToast}
    />
  );
}

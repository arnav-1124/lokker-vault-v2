import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Portability & Backup",
};

export default function WorkspaceImportExportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

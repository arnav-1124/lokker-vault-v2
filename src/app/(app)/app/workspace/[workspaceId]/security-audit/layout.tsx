import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Security Watchtower",
};

export default function WorkspaceSecurityAuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

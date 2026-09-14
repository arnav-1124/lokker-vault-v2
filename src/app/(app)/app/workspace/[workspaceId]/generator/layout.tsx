import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Password Generator",
};

export default function WorkspaceGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "File Vault",
};

export default function FilesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

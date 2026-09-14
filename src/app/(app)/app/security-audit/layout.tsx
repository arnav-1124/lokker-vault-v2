import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Audit",
};

export default function SecurityAuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

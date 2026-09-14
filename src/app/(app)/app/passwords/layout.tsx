import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Vault",
};

export default function PasswordsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

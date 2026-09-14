import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2FA Authenticator",
};

export default function TotpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

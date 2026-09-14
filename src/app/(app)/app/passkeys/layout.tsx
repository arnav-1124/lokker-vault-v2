import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Passkeys",
};

export default function PasskeysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

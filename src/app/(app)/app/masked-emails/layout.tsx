import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masked Emails",
};

export default function MaskedEmailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

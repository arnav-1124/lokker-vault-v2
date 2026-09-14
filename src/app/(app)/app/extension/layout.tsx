import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browser Extension",
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

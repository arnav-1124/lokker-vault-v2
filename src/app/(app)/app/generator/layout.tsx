import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Generator",
};

export default function GeneratorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

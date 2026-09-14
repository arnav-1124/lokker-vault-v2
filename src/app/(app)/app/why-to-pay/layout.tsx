import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Pay",
};

export default function WhyToPayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

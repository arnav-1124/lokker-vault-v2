import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Download Browser Extension (Manifest V3)",
  description:
    "Download the Lokker Manifest V3 browser extension for Chrome, Brave, Edge, and Arc. Seamless offline-first autofill and password generation.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download Lokker Browser Extension (MV3)",
    description:
      "Get the offline-first Manifest V3 browser autofill extension for Chromium browsers.",
    url: "/download",
  },
};

export default function DownloadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

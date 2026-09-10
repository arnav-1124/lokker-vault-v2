import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation & Technical Reference",
  description:
    "Official developer documentation, cryptographic specifications, API references, and architecture guides for Lokker Zero-Knowledge Vault and Platform.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Lokker Documentation & Technical Reference",
    description:
      "Explore Lokker architecture: 3-tier envelope cryptography, WebAuthn PRF, FIDO2 passkeys, BYOK masked email relays, and platform SDK contracts.",
    url: "/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

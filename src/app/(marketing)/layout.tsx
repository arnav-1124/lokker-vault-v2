import type { ReactNode } from "react";
import { appConfig } from "@/config/app";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${appConfig.url}/#software`,
        name: "Lokker Vault",
        url: appConfig.url,
        description: appConfig.description,
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web, Windows, macOS, Linux, ChromeOS",
        browserRequirements: "Requires Chrome, Edge, Brave, Safari, or Firefox with Web Crypto API",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        softwareVersion: "2.0.0",
        author: {
          "@type": "Organization",
          name: "Lokker",
          url: appConfig.url,
        },
        featureList: [
          "Local-First Architecture: zero cloud authority over plaintext credentials",
          "3-Tier Envelope Encryption: 256-bit AES-GCM VEK wrapped by PBKDF2 KEK",
          "Emergency Recovery Key: 32-character hexadecimal offline unwrap",
          "RFC 6238 TOTP 2FA Authenticator with live countdowns",
          "Client-Side Encrypted File Vault",
          "Manifest V3 Browser Autofill Extension",
          "Privacy-Preserving SHA-1 k-Anonymity Dark Web Breach Checks",
          "Encrypted Container Portability (.lokker backup & restore)",
        ],
        screenshot: `${appConfig.url}/opengraph-image`,
      },
      {
        "@type": "Organization",
        "@id": `${appConfig.url}/#organization`,
        name: "Lokker",
        url: appConfig.url,
        logo: `${appConfig.url}/favicon.svg`,
        sameAs: ["https://github.com/arnav-1124/lokker-vault-v2"],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

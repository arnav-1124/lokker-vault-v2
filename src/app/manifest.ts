import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lokker — Zero-Knowledge Password Vault",
    short_name: "Lokker",
    description:
      "Local-first zero-knowledge encrypted password vault, TOTP authenticator, and secure credential storage.",
    start_url: "/app",
    id: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#090d16",
    theme_color: "#090d16",
    lang: "en",
    categories: ["utilities", "productivity", "security"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Passwords",
        short_name: "Passwords",
        description: "Access encrypted password credentials",
        url: "/app/passwords",
        icons: [{ src: "/favicon.svg", sizes: "96x96" }],
      },
      {
        name: "2FA Authenticator",
        short_name: "2FA Codes",
        description: "View two-factor TOTP authentication codes",
        url: "/app/totp",
        icons: [{ src: "/favicon.svg", sizes: "96x96" }],
      },
      {
        name: "Password Generator",
        short_name: "Generator",
        description: "Generate high-entropy random passwords",
        url: "/app/generator",
        icons: [{ src: "/favicon.svg", sizes: "96x96" }],
      },
      {
        name: "Security Health",
        short_name: "Audit",
        description: "Inspect password health and compromised accounts",
        url: "/app/security-audit",
        icons: [{ src: "/favicon.svg", sizes: "96x96" }],
      },
    ],
  };
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { appConfig } from "@/config/app";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.url),
  title: {
    default: "Lokker — Local-First Zero-Knowledge Password Vault",
    template: `%s · Lokker`,
  },
  description: appConfig.description,
  applicationName: "Lokker",
  authors: [{ name: "Lokker Team", url: appConfig.url }],
  creator: "Lokker",
  publisher: "Lokker",
  keywords: [
    "password vault",
    "local-first password manager",
    "zero-knowledge encryption",
    "AES-GCM 256-bit",
    "offline password vault",
    "PBKDF2 key derivation",
    "TOTP authenticator",
    "2FA code generator",
    "secure bookmark manager",
    "Manifest V3 autofill extension",
    "encrypted file vault",
    "privacy-first security workspace",
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appConfig.url,
    siteName: "Lokker Vault",
    title: "Lokker — Local-First Zero-Knowledge Password Vault",
    description: appConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Lokker — Local-First Zero-Knowledge Password Vault",
    description: appConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

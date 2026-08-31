"use client";

import * as React from "react";
import {
  BookOpen,
  KeyRound,
  ShieldCheck,
  Compass,
  FileKey,
  QrCode,
  Database,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/types";

interface FeatureGuideViewProps {
  onSelectView: (view: ViewMode) => void;
  onOpenCommandPalette: () => void;
}

export function FeatureGuideView({ onSelectView }: FeatureGuideViewProps) {
  const guideArticles = [
    {
      title: "Master Passwords & 3-Tier Envelope Encryption",
      desc: "Understand how your master password derives a Key Encryption Key (KEK) to unwrap your 256-bit Vault Encryption Key (VEK) using PBKDF2 with 600,000 iterations.",
      icon: KeyRound,
      actionText: "View Vault",
      target: "passwords" as ViewMode,
    },
    {
      title: "Emergency Recovery Key Best Practices",
      desc: "How to safely store your 32-character hexadecimal offline recovery key and use it to restore access if you ever forget your master password.",
      icon: FileKey,
      actionText: "Settings & Recovery",
      target: "settings" as ViewMode,
    },
    {
      title: "2FA TOTP Authenticator Setup",
      desc: "Generate time-based one-time passcodes locally using RFC 6238 HMAC-SHA1 algorithms with live 30-second circular countdown timers.",
      icon: QrCode,
      actionText: "Open 2FA",
      target: "totp" as ViewMode,
    },
    {
      title: "Browser Extension & Isolated Shadow DOM",
      desc: "Learn how the Manifest V3 extension protects against DOM scraping, enforces origin allowlists, and provides repositionable autofill buttons.",
      icon: Compass,
      actionText: "Extension Guide",
      target: "extension" as ViewMode,
    },
    {
      title: "Security Health & Dark Web Breach Analysis",
      desc: "How Lokker scans your passwords against public breach databases using 5-character SHA-1 k-Anonymity prefixes with zero plaintext leakage.",
      icon: ShieldCheck,
      actionText: "Run Audit",
      target: "security-audit" as ViewMode,
    },
    {
      title: "Encrypted Backup & Portability",
      desc: "Full JSON backup exports with master key derivation and support for Chrome, Bitwarden, and 1Password CSV imports.",
      icon: Database,
      actionText: "Import/Export",
      target: "import-export" as ViewMode,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <span>Lokker Feature & Architecture Guide</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Step-by-step documentation for zero-knowledge encryption, passkeys, and extension autofill.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guideArticles.map((article, idx) => {
          const Icon = article.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-border-subtle bg-surface p-5 flex flex-col justify-between space-y-4 hover:border-border-strong transition-colors"
            >
              <div className="space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug">{article.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{article.desc}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectView(article.target)}
                className="w-full text-xs gap-1 justify-between h-8 cursor-pointer"
              >
                <span>{article.actionText}</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

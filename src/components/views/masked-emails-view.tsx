"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordEntry, ViewMode } from "@/types";

interface MaskedEmailsViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  onNavigate: (view: ViewMode) => void;
}

const RELAY_PROVIDERS = [
  {
    id: "duck",
    name: "DuckDuckGo Email",
    domain: "duck.com",
    badge: "Free Relay",
    desc: "duck.com addresses forward directly to your personal email with tracker stripping.",
  },
  {
    id: "mozmail",
    name: "Mozilla Firefox Relay",
    domain: "mozmail.com",
    badge: "Privacy Relay",
    desc: "Forwarding aliases created via Mozilla Relay account.",
  },
  {
    id: "simplelogin",
    name: "SimpleLogin / Proton",
    domain: "simplelogin.co",
    badge: "PGP Support",
    desc: "Open-source alias forwarding with optional PGP encryption.",
  },
  {
    id: "custom",
    name: "Custom Catch-All Domain",
    domain: "yourdomain.com",
    badge: "Custom",
    desc: "Direct your custom catch-all domain prefix to your mail server.",
  },
];

export function MaskedEmailsView({
  passwords,
  addToast,
  onNavigate,
}: MaskedEmailsViewProps) {
  const [selectedProvider, setSelectedProvider] = React.useState("duck");
  const [customDomain, setCustomDomain] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [generatedAlias, setGeneratedAlias] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = () => {
    const randomHex = Math.random().toString(36).substr(2, 6);
    const cleanPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    let domain = "duck.com";
    if (selectedProvider === "custom" && customDomain.trim()) {
      domain = customDomain.trim().replace(/^@/, "");
    } else {
      const match = RELAY_PROVIDERS.find((p) => p.id === selectedProvider);
      if (match) domain = match.domain;
    }

    const alias = cleanPrefix ? `${cleanPrefix}.${randomHex}@${domain}` : `lokker.${randomHex}@${domain}`;
    setGeneratedAlias(alias);
  };

  const handleCopy = () => {
    if (!generatedAlias) return;
    navigator.clipboard?.writeText(generatedAlias);
    setCopied(true);
    addToast("Masked email alias copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Find all usernames containing alias domains
  const existingAliases = React.useMemo(() => {
    return passwords.filter(
      (p) =>
        p.username.toLowerCase().includes("@duck.com") ||
        p.username.toLowerCase().includes("@mozmail.com") ||
        p.username.toLowerCase().includes("@simplelogin") ||
        p.username.toLowerCase().includes("@privaterelay") ||
        p.username.toLowerCase().includes("@anonaddy")
    );
  }, [passwords]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          <span>Masked Email Generator & Aliases</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Protect your personal inbox by generating isolated email aliases for every service.
        </p>
      </div>

      {/* Architecture Explanation Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs">
          <Info className="size-4 shrink-0" />
          <span>How Lokker Masked Emails Work</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Lokker is a <strong>local-first password vault</strong>. It generates, organizes, and secures unique alias identifiers directly inside your encrypted vault. Because Lokker operates entirely in your browser without central servers, incoming emails are forwarded to your personal inbox through your chosen email relay provider (such as <strong>DuckDuckGo Email Protection</strong>, <strong>SimpleLogin</strong>, or a <strong>Catch-All domain</strong>).
        </p>
      </div>

      {/* Generator Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-5 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generate New Masked Alias
        </h3>

        {/* Provider Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Select Relay Provider Pattern</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {RELAY_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedProvider === provider.id
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{provider.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {provider.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{provider.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedProvider === "custom" && (
          <div className="space-y-1.5">
            <Label htmlFor="custom-domain" className="text-xs">
              Custom Domain Name
            </Label>
            <Input
              id="custom-domain"
              placeholder="e.g. mail.yourdomain.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>
        )}

        {/* Service Prefix Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="alias-prefix" className="text-xs font-medium">
              Service Tag / Purpose (Optional)
            </Label>
            <Input
              id="alias-prefix"
              placeholder="e.g. netflix, amazon, newsletter"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="h-9 text-xs bg-background"
            />
          </div>
          <Button
            size="sm"
            onClick={handleGenerate}
            className="h-9 text-xs gap-1.5 self-end px-5 cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>Generate Alias</span>
          </Button>
        </div>

        {/* Generated Alias Box */}
        {generatedAlias && (
          <div className="p-4 rounded-xl bg-background border border-border-subtle flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <span className="font-mono text-xs sm:text-sm font-semibold text-foreground select-all break-all">
              {generatedAlias}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Alias"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Existing Aliases in Vault */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Aliases in Vault ({existingAliases.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("passwords")}
            className="text-xs text-primary hover:text-primary h-7 gap-1 cursor-pointer"
          >
            <span>View All Passwords</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>

        {existingAliases.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-xs text-muted-foreground">
            No masked email aliases saved in your vault credentials yet.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {existingAliases.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">{item.websiteName}</p>
                  <p className="text-muted-foreground font-mono text-[11px] truncate">{item.username}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background shrink-0">
                  Masked
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

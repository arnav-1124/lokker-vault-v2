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
  Settings,
  Key,
  Trash2,
  Power,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaskedEmail, PasswordEntry, RelayConfig, ViewMode } from "@/types";
import { getMaskedEmails, saveMaskedEmail, deleteMaskedEmailDB, getSettings, saveSettings } from "@/lib/db";
import { createRelayAlias, toggleRelayAlias, testRelayConnection } from "@/lib/masked-email";

interface MaskedEmailsViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  onNavigate: (view: ViewMode) => void;
}

export function MaskedEmailsView({
  passwords,
  addToast,
  onNavigate,
}: MaskedEmailsViewProps) {
  const [selectedProvider, setSelectedProvider] = React.useState<"simplelogin" | "addy" | "duck" | "custom">("duck");
  const [customDomain, setCustomDomain] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [note, setNote] = React.useState("");
  const [generatedAlias, setGeneratedAlias] = React.useState<MaskedEmail | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Stored aliases and relay settings
  const [savedAliases, setSavedAliases] = React.useState<MaskedEmail[]>([]);
  const [relayConfig, setRelayConfig] = React.useState<RelayConfig>({});
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [testingProvider, setTestingProvider] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<{ provider: string; success: boolean; message: string } | null>(null);

  // Load aliases & relay settings from IndexedDB
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [aliases, settings] = await Promise.all([
          getMaskedEmails(),
          getSettings(),
        ]);
        if (mounted) {
          setSavedAliases(aliases);
          if (settings.relayConfig) {
            setRelayConfig(settings.relayConfig);
            if (settings.relayConfig.defaultProvider) {
              setSelectedProvider(settings.relayConfig.defaultProvider);
            }
          }
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveSettings = async () => {
    try {
      const currentSettings = await getSettings();
      const updated = {
        ...currentSettings,
        relayConfig: {
          ...relayConfig,
          defaultProvider: selectedProvider,
        },
      };
      await saveSettings(updated);
      setRelayConfig(updated.relayConfig || {});
      setIsSettingsOpen(false);
      addToast("Relay API credentials saved securely in encrypted vault settings.", "success");
    } catch {
      addToast("Failed to save relay settings.", "error");
    }
  };

  const handleTestConnection = async (provider: "simplelogin" | "addy") => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const result = await testRelayConnection(provider, relayConfig);
      setTestResult({ provider, ...result });
      if (result.success) {
        addToast(`${provider === "simplelogin" ? "SimpleLogin" : "Addy.io"}: ${result.message}`, "success");
      } else {
        addToast(`${provider === "simplelogin" ? "SimpleLogin" : "Addy.io"} Error: ${result.message}`, "error");
      }
    } catch (e: any) {
      setTestResult({ provider, success: false, message: e.message || "Failed to test connection." });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const alias = await createRelayAlias(selectedProvider, relayConfig, {
        prefix,
        note,
        customDomain,
      });

      await saveMaskedEmail(alias);
      setSavedAliases((prev) => [alias, ...prev.filter((a) => a.id !== alias.id)]);
      setGeneratedAlias(alias);
      setPrefix("");
      setNote("");
      addToast(`Generated new masked email alias: ${alias.alias}`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate alias.";
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlias = async (alias: MaskedEmail) => {
    try {
      const updated = await toggleRelayAlias(alias, relayConfig);
      await saveMaskedEmail(updated);
      setSavedAliases((prev) => prev.map((a) => (a.id === alias.id ? updated : a)));
      addToast(`Alias ${alias.alias} is now ${updated.isEnabled ? "active" : "paused"}.`, "info");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle alias.";
      addToast(message, "error");
    }
  };

  const handleDeleteAlias = async (id: string) => {
    try {
      await deleteMaskedEmailDB(id);
      setSavedAliases((prev) => prev.filter((a) => a.id !== id));
      if (generatedAlias?.id === id) setGeneratedAlias(null);
      addToast("Masked alias removed from vault.", "info");
    } catch {
      addToast("Failed to remove alias.", "error");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    addToast("Masked email alias copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Aliases detected in passwords
  const passwordAliases = React.useMemo(() => {
    return passwords.filter(
      (p) =>
        p.username.toLowerCase().includes("@duck.com") ||
        p.username.toLowerCase().includes("@mozmail.com") ||
        p.username.toLowerCase().includes("@simplelogin") ||
        p.username.toLowerCase().includes("@slmail.me") ||
        p.username.toLowerCase().includes("@privaterelay") ||
        p.username.toLowerCase().includes("@anonaddy") ||
        p.username.toLowerCase().includes("@addy.io")
    );
  }, [passwords]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <span>Masked Email Relay & Aliases</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Zero-backend Bring-Your-Own-Key (BYOK) privacy forwarding with SimpleLogin, Addy.io, and DuckDuckGo
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Settings className="size-3.5" />
          <span>Relay API Settings</span>
        </Button>
      </div>

      {/* Generator Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-5 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generate New Masked Alias
        </h3>

        {/* Provider Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Select Relay Provider</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. SimpleLogin */}
            <button
              type="button"
              onClick={() => setSelectedProvider("simplelogin")}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedProvider === "simplelogin"
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">SimpleLogin (Proton)</span>
                <Badge variant="outline" className="text-[10px]">
                  {relayConfig.simpleloginApiKey ? "BYOK Connected" : "API Key Required"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Direct client API integration with your SimpleLogin or Proton Pass account.
              </p>
            </button>

            {/* 2. Addy.io */}
            <button
              type="button"
              onClick={() => setSelectedProvider("addy")}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedProvider === "addy"
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Addy.io (AnonAddy)</span>
                <Badge variant="outline" className="text-[10px]">
                  {relayConfig.addyApiKey ? "BYOK Connected" : "API Token Required"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Open-source email forwarding with live API alias creation and toggles.
              </p>
            </button>

            {/* 3. DuckDuckGo */}
            <button
              type="button"
              onClick={() => setSelectedProvider("duck")}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedProvider === "duck"
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">DuckDuckGo Email</span>
                <Badge variant="outline" className="text-[10px]">
                  Zero Config
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                duck.com address generation with built-in tracker stripping.
              </p>
            </button>

            {/* 4. Custom Catch-All */}
            <button
              type="button"
              onClick={() => setSelectedProvider("custom")}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedProvider === "custom"
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Custom Catch-All Domain</span>
                <Badge variant="outline" className="text-[10px]">
                  Custom
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Generate isolated prefixes directed to your own custom mail domain.
              </p>
            </button>
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

        {/* Prefix & Note Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <Label htmlFor="alias-note" className="text-xs font-medium">
              Note (Optional)
            </Label>
            <Input
              id="alias-note"
              placeholder="e.g. Used for personal streaming"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs bg-background"
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="h-9 text-xs gap-1.5 px-5 cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          <span>{loading ? "Generating Live Alias..." : "Generate & Save Masked Alias"}</span>
        </Button>

        {/* Generated Result Box */}
        {generatedAlias && (
          <div className="p-4 rounded-xl bg-background border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-semibold text-foreground select-all break-all">
                  {generatedAlias.alias}
                </span>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary uppercase">
                  {generatedAlias.provider}
                </Badge>
              </div>
              {generatedAlias.note && (
                <p className="text-[11px] text-muted-foreground">{generatedAlias.note}</p>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(generatedAlias.alias)}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                <span>{copied ? "Copied" : "Copy Alias"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Saved Aliases in Vault */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vault Masked Aliases ({savedAliases.length})
          </h3>
          {savedAliases.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              Stored locally and included in full encrypted backups
            </span>
          )}
        </div>

        {savedAliases.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-xs text-muted-foreground">
            No masked email aliases saved in your vault yet. Generate one above to protect your personal inbox.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {savedAliases.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-foreground truncate select-all">
                      {item.alias}
                    </p>
                    <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 bg-background shrink-0">
                      {item.provider}
                    </Badge>
                  </div>
                  {item.note && (
                    <p className="text-muted-foreground text-[11px] truncate">{item.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Status Toggle */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAlias(item)}
                    title={item.isEnabled ? "Alias is Active (Click to pause)" : "Alias is Paused (Click to activate)"}
                    className={`size-7 p-0 cursor-pointer ${
                      item.isEnabled ? "text-success hover:text-success/80" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Power className="size-3.5" />
                  </Button>

                  {/* Copy */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item.alias)}
                    className="size-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="size-3.5" />
                  </Button>

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAlias(item.id)}
                    className="size-7 p-0 cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aliases Detected in Password Entries */}
      {passwordAliases.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aliases Used in Credentials ({passwordAliases.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("passwords")}
              className="text-xs text-primary hover:text-primary h-7 gap-1 cursor-pointer"
            >
              <span>View Passwords</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {passwordAliases.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border-subtle bg-surface flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">{item.websiteName}</p>
                  <p className="text-muted-foreground font-mono text-[11px] truncate">{item.username}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background shrink-0">
                  In Use
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BYOK Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-surface border-border-subtle p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Key className="size-4 text-primary" />
              <span>Relay Provider API Keys (BYOK)</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your API tokens are stored directly in your browser&apos;s encrypted vault settings. Requests to SimpleLogin and Addy.io are executed client-to-service without any Lokker backend.
          </p>

          <div className="space-y-4">
            {/* SimpleLogin */}
            <div className="space-y-2 p-3 rounded-xl border border-border-subtle bg-background">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">SimpleLogin / Proton API</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!relayConfig.simpleloginApiKey || testingProvider === "simplelogin"}
                  onClick={() => handleTestConnection("simplelogin")}
                  className="h-6 text-[10px] gap-1 px-2 cursor-pointer"
                >
                  <RefreshCw className={`size-2.5 ${testingProvider === "simplelogin" ? "animate-spin" : ""}`} />
                  <span>Test</span>
                </Button>
              </div>
              <Input
                type="password"
                placeholder="Paste SimpleLogin API Key"
                value={relayConfig.simpleloginApiKey || ""}
                onChange={(e) => setRelayConfig((prev) => ({ ...prev, simpleloginApiKey: e.target.value }))}
                className="h-8 text-xs bg-surface"
              />
              <p className="text-[10px] text-muted-foreground">
                Get your key in SimpleLogin Dashboard &gt; Settings &gt; API Keys.
              </p>
            </div>

            {/* Addy.io */}
            <div className="space-y-2 p-3 rounded-xl border border-border-subtle bg-background">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Addy.io (AnonAddy) API</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!relayConfig.addyApiKey || testingProvider === "addy"}
                  onClick={() => handleTestConnection("addy")}
                  className="h-6 text-[10px] gap-1 px-2 cursor-pointer"
                >
                  <RefreshCw className={`size-2.5 ${testingProvider === "addy" ? "animate-spin" : ""}`} />
                  <span>Test</span>
                </Button>
              </div>
              <Input
                type="password"
                placeholder="Paste Addy.io API Token"
                value={relayConfig.addyApiKey || ""}
                onChange={(e) => setRelayConfig((prev) => ({ ...prev, addyApiKey: e.target.value }))}
                className="h-8 text-xs bg-surface"
              />
              <p className="text-[10px] text-muted-foreground">
                Generate in Addy.io &gt; Settings &gt; API &gt; Create New Token.
              </p>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs ${testResult.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {testResult.message}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSettings} className="h-8 text-xs">
              Save Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

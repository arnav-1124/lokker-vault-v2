"use client";

import * as React from "react";
import {
  Fingerprint,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Trash2,
  ExternalLink,
  Code2,
  Info,
  Globe,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PasskeyEntry, ViewMode } from "@/types";
import { getPasskeys, savePasskey, deletePasskeyDB } from "@/lib/db";
import { createPasskeyCredential, formatSpkiToPem } from "@/lib/passkey";

interface PasskeysViewProps {
  isUnlocked: boolean;
  onUnlockClick: () => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  onNavigate: (view: ViewMode) => void;
}

export function PasskeysView({
  isUnlocked,
  onUnlockClick,
  addToast,
}: PasskeysViewProps) {
  const [passkeys, setPasskeys] = React.useState<PasskeyEntry[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
  const [inspectingPasskey, setInspectingPasskey] = React.useState<PasskeyEntry | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Form State
  const [websiteName, setWebsiteName] = React.useState("");
  const [rpId, setRpId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Load passkeys from IndexedDB
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await getPasskeys();
        if (mounted) setPasskeys(stored);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const handleCreatePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rpId.trim() || !userName.trim()) return;

    setCreating(true);
    try {
      const newPasskey = await createPasskeyCredential({
        websiteName: websiteName.trim() || rpId.trim(),
        rpId: rpId.trim(),
        userName: userName.trim(),
        userDisplayName: displayName.trim() || undefined,
      });

      await savePasskey(newPasskey);
      setPasskeys((prev) => [newPasskey, ...prev.filter((p) => p.id !== newPasskey.id)]);
      setIsRegisterModalOpen(false);
      setWebsiteName("");
      setRpId("");
      setUserName("");
      setDisplayName("");
      addToast(`Passkey registered for ${newPasskey.websiteName}!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register passkey.";
      addToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string) => {
    try {
      await deletePasskeyDB(id);
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      addToast(`Passkey for ${name} deleted from vault.`, "info");
    } catch {
      addToast("Failed to delete passkey.", "error");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    addToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Fingerprint className="size-4 text-primary" />
            <span>FIDO2 &amp; WebAuthn Passkeys</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Zero-knowledge cryptographic passkeys (ES256 / P-256). Asymmetric keypairs stored encrypted in your vault.
          </p>
        </div>

        <Button
          onClick={() => {
            if (!isUnlocked) {
              onUnlockClick();
            } else {
              setIsRegisterModalOpen(true);
            }
          }}
          size="sm"
          className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Register Passkey</span>
        </Button>
      </div>

      {/* Explainer Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs">
          <ShieldCheck className="size-4 shrink-0" />
          <span>How Lokker Passkeys Work</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Passkeys replace traditional passwords with <strong>public-key cryptography (ECDSA P-256)</strong>. When registering, Lokker generates a private key that remains sealed in your local vault and a public key registered with the service. Passkeys are phishing-resistant and cannot be leaked in server data breaches.
        </p>
      </div>

      {/* Passkeys Grid */}
      {passkeys.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-3">
          <Fingerprint className="size-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No Passkeys Stored Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Register passkeys for websites like Google, GitHub, or Amazon to experience passwordless, phishing-proof authentication.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsRegisterModalOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="size-3.5" />
            <span>Register First Passkey</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {passkeys.map((pk) => (
            <div
              key={pk.id}
              className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col justify-between space-y-4 hover:border-primary/30 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{pk.websiteName}</h4>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Globe className="size-3" />
                      {pk.rpId}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-background border-primary/20 text-primary py-0">
                    ES256
                  </Badge>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border-subtle space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium text-foreground font-mono truncate max-w-[160px]">{pk.userName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Credential ID:</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {pk.credentialId.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setInspectingPasskey(pk)}
                  className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Code2 className="size-3" />
                  <span>Inspect Public Key</span>
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(pk.credentialId, pk.id)}
                    title="Copy Credential ID"
                    className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {copiedId === pk.id ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePasskey(pk.id, pk.websiteName)}
                    title="Delete Passkey"
                    className="size-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-w-md bg-surface border-border-subtle p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Fingerprint className="size-4 text-primary" />
              <span>Register FIDO2 Passkey</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePasskey} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="pk-name" className="text-xs">
                Website / Service Name
              </Label>
              <Input
                id="pk-name"
                required
                placeholder="e.g. GitHub, Google, Amazon"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pk-rpid" className="text-xs">
                Relying Party ID (Domain)
              </Label>
              <Input
                id="pk-rpid"
                required
                placeholder="e.g. github.com, google.com"
                value={rpId}
                onChange={(e) => setRpId(e.target.value)}
                className="h-8 text-xs bg-background"
              />
              <p className="text-[10px] text-muted-foreground">
                The exact domain that requested passkey registration (e.g. <code className="text-primary font-mono">github.com</code>).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pk-user" className="text-xs">
                Username / Email
              </Label>
              <Input
                id="pk-user"
                required
                placeholder="developer@example.com"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pk-display" className="text-xs">
                Display Name (Optional)
              </Label>
              <Input
                id="pk-display"
                placeholder="e.g. Work MacBook"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRegisterModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creating}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>{creating ? "Generating Asymmetric Keypair..." : "Generate Passkey"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inspect Public Key Dialog */}
      <Dialog open={!!inspectingPasskey} onOpenChange={(open) => !open && setInspectingPasskey(null)}>
        <DialogContent className="max-w-lg bg-surface border-border-subtle p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Code2 className="size-4 text-primary" />
              <span>Passkey Cryptographic Details</span>
            </DialogTitle>
          </DialogHeader>

          {inspectingPasskey && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-background border border-border-subtle">
                <div>
                  <span className="text-[10px] text-muted-foreground">Service:</span>
                  <p className="font-semibold text-foreground">{inspectingPasskey.websiteName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Relying Party:</span>
                  <p className="font-mono text-foreground">{inspectingPasskey.rpId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Account:</span>
                  <p className="font-mono text-foreground">{inspectingPasskey.userName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Algorithm:</span>
                  <p className="font-mono text-foreground">ECDSA P-256 (ES256)</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-foreground">Credential ID (Base64URL):</span>
                <div className="p-2 rounded bg-background border border-border-subtle font-mono text-[11px] select-all break-all text-muted-foreground">
                  {inspectingPasskey.credentialId}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-foreground">SPKI Public Key (PEM format):</span>
                <pre className="p-3 rounded bg-background border border-border-subtle font-mono text-[10px] leading-tight select-all overflow-x-auto text-muted-foreground">
                  {formatSpkiToPem(inspectingPasskey.publicKey)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInspectingPasskey(null)}
                  className="h-8 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

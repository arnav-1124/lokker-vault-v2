"use client";

import * as React from "react";
import { FileKey, AlertCircle, Copy, Check, Download, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { generateRecoveryKey } from "@/lib/crypto";
import { downloadTextFile } from "@/lib/download";

interface RecoveryKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Re-authenticates the user before showing a new key. */
  onVerify: (password: string) => Promise<boolean>;
  /** Applies the regenerated recovery key (re-wraps the VEK). */
  onApply: (newRecoveryKey: string) => Promise<boolean>;
}

/**
 * Emergency Recovery Key regeneration. The existing key is never stored in
 * plaintext, so it cannot be re-shown — this generates a FRESH 256-bit key,
 * re-wraps the VEK under it, and invalidates the previous key.
 */
export function RecoveryKeyModal({ isOpen, onClose, onVerify, onApply }: RecoveryKeyModalProps) {
  const [step, setStep] = React.useState<"verify" | "save">("verify");
  const [password, setPassword] = React.useState("");
  const [newKey, setNewKey] = React.useState("");
  const [confirmedSaved, setConfirmedSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleClose = () => {
    setStep("verify");
    setPassword("");
    setNewKey("");
    setConfirmedSaved(false);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter your master password to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const valid = await onVerify(password);
      if (!valid) {
        setError("Incorrect master password.");
        return;
      }
      setNewKey(generateRecoveryKey());
      setStep("save");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const content = [
      "LOKKER EMERGENCY RECOVERY KEY",
      "==============================",
      "",
      newKey,
      "",
      "Store this file offline and securely. This key can restore access to",
      "your vault if you ever forget your master password. Anyone holding it",
      "can unlock your vault — treat it like a password.",
    ].join("\n");
    downloadTextFile(content, `lokker-recovery-key-${dateStr}.txt`, "text/plain");
  };

  const handleApply = async () => {
    if (!confirmedSaved) {
      setError("Please confirm you have saved the new recovery key first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const success = await onApply(newKey);
      if (!success) {
        setError("Failed to apply the new recovery key. Please try again.");
      } else {
        handleClose();
      }
    } catch {
      setError("Unexpected error while applying the new key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <FileKey className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Regenerate Emergency Recovery Key
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === "verify"
              ? "Confirm your master password to generate a new recovery key."
              : "Save the new key before applying it — the previous recovery key stops working immediately."}
          </DialogDescription>
        </DialogHeader>

        {step === "verify" ? (
          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="recovery-verify-pass" className="text-xs font-medium">
                Master Password
              </Label>
              <Input
                id="recovery-verify-pass"
                type="password"
                placeholder="Enter master password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="h-9 text-xs bg-background"
              />
            </div>
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="text-xs font-medium cursor-pointer">
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border border-border-subtle bg-background space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  New Emergency Recovery Key
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 text-[11px] gap-1 px-2 cursor-pointer"
                  >
                    {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="h-6 text-[11px] gap-1 px-2 cursor-pointer"
                  >
                    <Download className="size-3" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              <p className="font-mono text-xs text-primary bg-surface p-2 rounded border border-border-subtle select-all text-center">
                {newKey}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Store this key securely offline. It is shown only once and cannot be recovered from the vault.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="recovery-saved-check"
                checked={confirmedSaved}
                onCheckedChange={(checked) => setConfirmedSaved(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="recovery-saved-check" className="text-xs text-muted-foreground font-normal cursor-pointer leading-tight">
                I have safely stored the new recovery key offline and understand the previous key no longer works.
              </Label>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs cursor-pointer">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading || !confirmedSaved}
                size="sm"
                onClick={handleApply}
                className="text-xs font-medium cursor-pointer"
              >
                {loading ? "Re-keying Recovery Slot..." : "Apply New Recovery Key"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

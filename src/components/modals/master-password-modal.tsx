"use client";

import * as React from "react";
import {
  Lock,
  KeyRound,
  FileKey,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  calculatePasswordStrength,
  generateRecoveryKey,
  formatRecoveryKey,
  parseRecoveryKey,
} from "@/lib/crypto";

interface MasterPasswordModalProps {
  isOpen: boolean;
  isInitialSetup: boolean;
  onClose?: () => void;
  onSubmitPassword: (password: string, isSetup: boolean, recoveryKey?: string) => Promise<boolean>;
  onUnlockWithRecoveryKey?: (recoveryKey: string) => Promise<boolean>;
}

export function MasterPasswordModal({
  isOpen,
  isInitialSetup,
  onClose,
  onSubmitPassword,
  onUnlockWithRecoveryKey,
}: MasterPasswordModalProps) {
  // Setup state
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [generatedRecoveryKey] = React.useState<string>(() => generateRecoveryKey());
  const [savedRecoveryKeyConfirmed, setSavedRecoveryKeyConfirmed] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(false);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = React.useState("");
  const [recoveryInput, setRecoveryInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const strength = calculatePasswordStrength(password);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Master password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!savedRecoveryKeyConfirmed) {
      setError("Please confirm you have saved your Emergency Recovery Key.");
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmitPassword(password, true, generatedRecoveryKey);
      if (!success) {
        setError("Failed to initialize vault.");
      }
    } catch {
      setError("Unexpected error initializing vault.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!unlockPassword) {
      setError("Please enter your master password.");
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmitPassword(unlockPassword, false);
      if (!success) {
        setError("Incorrect master password. Please try again.");
      } else {
        setUnlockPassword("");
      }
    } catch {
      setError("Failed to decrypt vault with master password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = parseRecoveryKey(recoveryInput);
    if (clean.length !== 32) {
      setError("Emergency Recovery Key must be 32 hexadecimal characters (XXXX-XXXX-...).");
      return;
    }

    setLoading(true);
    try {
      if (onUnlockWithRecoveryKey) {
        const success = await onUnlockWithRecoveryKey(clean);
        if (!success) {
          setError("Invalid recovery key for this vault.");
        }
      } else {
        const success = await onSubmitPassword(clean, false);
        if (!success) {
          setError("Invalid recovery key for this vault.");
        }
      }
    } catch {
      setError("Failed to unwrap encryption keys with recovery key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryKey = () => {
    navigator.clipboard?.writeText(generatedRecoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) onClose();
      }}
    >
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6" showCloseButton={!isInitialSetup}>
        <DialogHeader className="space-y-1 shrink-0">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            {isInitialSetup ? "Initialize Local Encrypted Vault" : "Unlock Lokker Vault"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isInitialSetup
              ? "Choose a strong master password. It encrypts your vault locally using AES-GCM 256-bit envelope encryption."
              : "Enter your master password or emergency recovery key to unwrap your encryption keys."}
          </DialogDescription>
        </DialogHeader>

        {isInitialSetup ? (
          /* INITIAL SETUP FORM */
          <form onSubmit={handleSetupSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto lokker-scrollbar space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="setup-pass" className="text-xs font-medium">
                Master Password
              </Label>
              <div className="relative">
                <Input
                  id="setup-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose strong master password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 h-9 text-xs bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Entropy Strength:</span>
                    <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score < 50
                          ? "bg-destructive"
                          : strength.score < 80
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-pass" className="text-xs font-medium">
                Confirm Master Password
              </Label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="Re-enter master password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            {/* Emergency Recovery Key Box */}
            <div className="p-3.5 rounded-xl border border-border-subtle bg-background space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <FileKey className="size-3.5 text-primary" />
                  Emergency Recovery Key
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRecoveryKey}
                  className="h-6 text-[11px] gap-1 px-2 cursor-pointer"
                >
                  {copiedKey ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                  <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                </Button>
              </div>
              <p className="font-mono text-xs text-primary bg-surface p-2 rounded border border-border-subtle select-all text-center">
                {generatedRecoveryKey}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Store this key securely offline. If you lose your master password, this key is the only way to recover your vault.
              </p>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="save-rec-check"
                checked={savedRecoveryKeyConfirmed}
                onCheckedChange={(checked) => setSavedRecoveryKeyConfirmed(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="save-rec-check" className="text-xs text-muted-foreground font-normal cursor-pointer leading-tight">
                I have safely stored my 256-bit Emergency Recovery Key offline.
              </Label>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            </div>

            <DialogFooter className="gap-2 pt-2 -mx-6 -mb-6 mt-auto">
              <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-medium cursor-pointer">
                {loading ? "Encrypting & Initializing..." : "Initialize Encrypted Vault"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* UNLOCK TABS FORM */
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto lokker-scrollbar space-y-4 pt-2">
            <Tabs defaultValue="password">
              <TabsList className="grid grid-cols-3 w-full bg-background border border-border-subtle">
                <TabsTrigger value="password" className="text-xs cursor-pointer">
                  Password
                </TabsTrigger>
                <TabsTrigger value="recovery" className="text-xs cursor-pointer">
                  Recovery Key
                </TabsTrigger>
                <TabsTrigger value="passkey" className="text-xs cursor-pointer">
                  Passkey
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: MASTER PASSWORD */}
              <TabsContent value="password" className="space-y-3 pt-3">
                <form onSubmit={handleUnlockSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="unlock-pass" className="text-xs">
                      Master Password
                    </Label>
                    <Input
                      id="unlock-pass"
                      type="password"
                      placeholder="Enter master password..."
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      autoFocus
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  {error && (
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-medium cursor-pointer">
                    {loading ? "Unwrapping Keys..." : "Unlock Vault"}
                  </Button>
                </form>
              </TabsContent>

              {/* TAB 2: RECOVERY KEY */}
              <TabsContent value="recovery" className="space-y-3 pt-3">
                <form onSubmit={handleRecoveryUnlock} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-key" className="text-xs">
                      Emergency Recovery Key (32 Hex Characters)
                    </Label>
                    <Input
                      id="recovery-key"
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                      value={recoveryInput}
                      onChange={(e) => setRecoveryInput(formatRecoveryKey(e.target.value))}
                      className="font-mono text-xs h-9 bg-background uppercase"
                    />
                  </div>

                  {error && (
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-medium cursor-pointer">
                    {loading ? "Restoring with Recovery Key..." : "Unlock with Recovery Key"}
                  </Button>
                </form>
              </TabsContent>

              {/* TAB 3: WEBAUTHN PASSKEY */}
              <TabsContent value="passkey" className="space-y-4 pt-4 text-center">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Fingerprint className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold">WebAuthn PRF Biometric Unlock</p>
                  <p className="text-[11px] text-muted-foreground">
                    Authenticate via Touch ID, Windows Hello, or FIDO2 security key to derive your symmetric encryption key directly.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs gap-2 cursor-pointer"
                  onClick={() => {
                    setError("WebAuthn hardware passkey can be paired in Settings after unlocking.");
                  }}
                >
                  <Fingerprint className="size-3.5" />
                  <span>Authenticate with Passkey</span>
                </Button>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

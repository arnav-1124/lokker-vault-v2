"use client";

import * as React from "react";
import { KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck, Cloud, ArrowRight, FileKey, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { calculatePasswordStrength, parseRecoveryKey, formatRecoveryKey } from "@/lib/crypto";

interface ChangeMasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Verifies the current password and rotates it. Returns false on wrong password or failure. */
  onSubmit: (currentPassword: string, newPassword: string) => Promise<boolean>;
  /** Resets the master password using the 32-character Emergency Recovery Key if current password is forgotten. */
  onSubmitWithRecoveryKey?: (recoveryKey: string, newPassword: string) => Promise<boolean>;
}

export function ChangeMasterPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitWithRecoveryKey,
}: ChangeMasterPasswordModalProps) {
  const [authMethod, setAuthMethod] = React.useState<"password" | "recovery_key">("password");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [recoveryKeyInput, setRecoveryKeyInput] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showSyncPopup, setShowSyncPopup] = React.useState(false);
  const [cloudEmail, setCloudEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const sessionStr = localStorage.getItem("lokker_cloud_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.email) setCloudEmail(session.email);
      } else {
        setCloudEmail(null);
      }
    } catch {
      setCloudEmail(null);
    }
  }, [isOpen]);

  const strength = calculatePasswordStrength(newPassword);

  const handleClose = () => {
    setAuthMethod("password");
    setCurrentPassword("");
    setRecoveryKeyInput("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);
    setError(null);
    setShowSyncPopup(false);
    onClose();
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMethod === "password") {
      if (!currentPassword) {
        setError("Please enter your current master password.");
        return;
      }
      if (newPassword === currentPassword) {
        setError("The new master password must be different from your current one.");
        return;
      }
    } else {
      const cleanKey = parseRecoveryKey(recoveryKeyInput);
      if (cleanKey.length !== 32) {
        setError("Emergency Recovery Key must be 32 characters (e.g. XXXX-XXXX-...).");
        return;
      }
    }

    if (newPassword.length < 8) {
      setError("New master password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    // Trigger the clean confirmation popup informing user auth pass will also change
    setShowSyncPopup(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let success = false;
      if (authMethod === "password") {
        success = await onSubmit(currentPassword, newPassword);
      } else if (onSubmitWithRecoveryKey) {
        const cleanKey = parseRecoveryKey(recoveryKeyInput);
        success = await onSubmitWithRecoveryKey(cleanKey, newPassword);
      }

      if (!success) {
        setError(
          authMethod === "password"
            ? "Incorrect current master password. Please check and try again."
            : "Invalid Emergency Recovery Key. Please verify your 32-character key and try again."
        );
        setShowSyncPopup(false);
      } else {
        handleClose();
      }
    } catch {
      setError("Unexpected error while updating your master password.");
      setShowSyncPopup(false);
    } finally {
      setLoading(false);
    }
  };

  const inputType = showPasswords ? "text" : "password";

  return (
    <>
      <Dialog open={isOpen && !showSyncPopup} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md bg-surface border-border-subtle p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-1">
              <KeyRound className="size-5" />
            </div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-foreground">
                {authMethod === "password" ? "Change Master Password" : "Reset Master Password"}
              </DialogTitle>
              {cloudEmail && (
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0">
                  Cloud Synced
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {authMethod === "password"
                ? "Update your master password safely. Your stored passwords, files, and recovery key will remain securely protected."
                : "Reset your master password using your offline Emergency Recovery Key. All your encrypted data remains safe."}
            </DialogDescription>
          </DialogHeader>

          {/* Unified Cloud Notice */}
          <div className="p-3 rounded-xl bg-background border border-border-subtle text-xs flex items-start gap-2.5">
            <Cloud className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-foreground text-xs block">
                Unified Password Protection
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {cloudEmail
                  ? `Your cloud account (${cloudEmail}) sign-in password will automatically update to match your new master password.`
                  : "When you change your master password, your cloud sign-in password will automatically update to match."}
              </p>
            </div>
          </div>

          <form onSubmit={handlePreSubmit} className="space-y-4 pt-1">
            {authMethod === "password" ? (
              /* Option 1: Current Master Password */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cur-master-pass" className="text-xs font-medium">
                    Current Master Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("recovery_key");
                      setError(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    Forgot password? Use Recovery Key
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="cur-master-pass"
                    type={inputType}
                    placeholder="Enter current master password..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoFocus
                    className="h-9 text-xs bg-background pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                  >
                    {showPasswords ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              /* Option 2: Emergency Recovery Key */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reset-rec-key" className="text-xs font-medium flex items-center gap-1.5">
                    <FileKey className="size-3 text-emerald-400" />
                    Emergency Recovery Key
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setError(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    Use current password instead
                  </button>
                </div>
                <Input
                  id="reset-rec-key"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(formatRecoveryKey(e.target.value))}
                  autoFocus
                  className="h-9 text-xs bg-background font-mono tracking-wider"
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter the 32-character Emergency Recovery Key saved when setting up your vault.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-master-pass" className="text-xs font-medium">
                New Master Password
              </Label>
              <Input
                id="new-master-pass"
                type={inputType}
                placeholder="Choose a strong new password (min. 8 chars)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs bg-background"
              />
              {newPassword && (
                <div className="flex justify-between text-[11px] pt-0.5">
                  <span className="text-muted-foreground">Password Strength:</span>
                  <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-master-pass" className="text-xs font-medium">
                Confirm New Master Password
              </Label>
              <Input
                id="confirm-master-pass"
                type={inputType}
                placeholder="Re-enter new master password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              <Button type="submit" disabled={loading} size="sm" className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clean Minimal Acknowledgement Popup in Center of Screen */}
      <Dialog open={isOpen && showSyncPopup} onOpenChange={(open) => !open && setShowSyncPopup(false)}>
        <DialogContent className="max-w-md bg-surface border-border-subtle p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold text-foreground">
                Confirm Password Update
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Your sign-in password will also be updated automatically.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Cloud className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Synchronized Sign-In Across Devices
                </p>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  {cloudEmail
                    ? `Your cloud account password for ${cloudEmail} will also be changed to match this new master password.`
                    : "Your cloud sign-in password will automatically update to stay in perfect sync with your new master password."}
                </p>
              </div>
            </div>
            <div className="border-t border-border-subtle/60 pt-2 text-[11px] text-muted-foreground">
              From now on, you will use this single password to both unlock your vault and sign in to your cloud account.
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSyncPopup(false)}
              disabled={loading}
              className="text-xs cursor-pointer"
            >
              Go Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>Yes, Update Both</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

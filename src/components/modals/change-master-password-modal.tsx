"use client";

import * as React from "react";
import { KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
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
import { calculatePasswordStrength } from "@/lib/crypto";

interface ChangeMasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Verifies the current password and rotates it. Returns false on wrong password or failure. */
  onSubmit: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

/**
 * Master password rotation UI. Re-wraps the existing VEK under a new
 * Password KEK — the vault payload, recovery key, and passkey slots stay
 * valid. Requires the current password (verified against the stored verifier).
 */
export function ChangeMasterPasswordModal({ isOpen, onClose, onSubmit }: ChangeMasterPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const strength = calculatePasswordStrength(newPassword);

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Enter your current master password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New master password must be at least 8 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("The new master password must be different from the current one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(currentPassword, newPassword);
      if (!success) {
        setError("Incorrect current master password, or the rotation failed. Please try again.");
      } else {
        handleClose();
      }
    } catch {
      setError("Unexpected error while changing the master password.");
    } finally {
      setLoading(false);
    }
  };

  const inputType = showPasswords ? "text" : "password";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <KeyRound className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Change Master Password
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your vault is re-keyed in place: the same encryption key is re-wrapped under the new password. Bookmarks, files, recovery key, and passkey stay valid.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cur-master-pass" className="text-xs font-medium">
              Current Master Password
            </Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="new-master-pass" className="text-xs font-medium">
              New Master Password
            </Label>
            <Input
              id="new-master-pass"
              type={inputType}
              placeholder="Choose a strong new password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 text-xs bg-background"
            />
            {newPassword && (
              <div className="flex justify-between text-[11px] pt-0.5">
                <span className="text-muted-foreground">Entropy Strength:</span>
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
            <Button type="submit" disabled={loading} size="sm" className="text-xs font-medium cursor-pointer">
              {loading ? "Re-keying Vault..." : "Change Master Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

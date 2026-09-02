"use client";

import * as React from "react";
import { FileKey, AlertCircle } from "lucide-react";
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

interface BackupPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Verifies the password and performs the export. Returns false on wrong password/failure. */
  onSubmit: (password: string) => Promise<boolean>;
}

/**
 * Collects the master password for encrypted backup export.
 * The master password is never persisted in React state — it is used once
 * to derive the backup KEK and then discarded.
 */
export function BackupPasswordModal({ isOpen, onClose, onSubmit }: BackupPasswordModalProps) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your master password.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await onSubmit(password);
      if (!success) {
        setError("Incorrect master password, or the backup could not be created.");
      } else {
        setPassword("");
        onClose();
      }
    } catch {
      setError("Failed to create the encrypted backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <FileKey className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Encrypt Full Backup
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Confirm your master password to derive the backup encryption key (PBKDF2 + AES-GCM 256-bit). It is used once and never stored.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="backup-export-pwd" className="text-xs font-medium">
              Master Password
            </Label>
            <Input
              id="backup-export-pwd"
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="text-xs font-medium cursor-pointer"
            >
              {loading ? "Encrypting & Exporting..." : "Encrypt & Export"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

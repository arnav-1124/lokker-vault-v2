"use client";

import * as React from "react";
import { Lock, AlertCircle, FileJson } from "lucide-react";
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

interface ImportDecryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecryptSubmit: (password: string) => Promise<boolean>;
}

export function ImportDecryptModal({
  isOpen,
  onClose,
  onDecryptSubmit,
}: ImportDecryptModalProps) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter the decryption password for this backup.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await onDecryptSubmit(password);
      if (!success) {
        setError("Incorrect backup password or corrupted ciphertext.");
      } else {
        setPassword("");
        onClose();
      }
    } catch {
      setError("Failed to decrypt backup file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Encrypted Backup Detected
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This backup file is encrypted with AES-GCM 256-bit. Please enter the master password that was used when creating this backup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="backup-pwd" className="text-xs font-medium">
              Backup Master Password
            </Label>
            <Input
              id="backup-pwd"
              type="password"
              placeholder="Enter backup decryption password..."
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
              {loading ? "Decrypting & Importing..." : "Decrypt & Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

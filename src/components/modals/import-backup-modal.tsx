"use client";

import * as React from "react";
import {
  AlertCircle,
  KeyRound,
  Bookmark as BookmarkIcon,
  Tag,
  FolderLock,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import {
  BackupSummary,
  LokkerBackupPayload,
  LokkerEncryptedBackupFile,
} from "@/types";
import { decryptAndValidateLokkerBackup, summarizeBackupPayload } from "@/lib/backup";

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptedFile: LokkerEncryptedBackupFile | null;
  unencryptedPayload: LokkerBackupPayload | null;
  onConfirmRestore: (
    payload: LokkerBackupPayload,
    strategy: "merge" | "replace"
  ) => Promise<void>;
}

export function ImportBackupModal({
  isOpen,
  onClose,
  encryptedFile,
  unencryptedPayload,
  onConfirmRestore,
}: ImportBackupModalProps) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [decryptedPayload, setDecryptedPayload] = React.useState<LokkerBackupPayload | null>(null);
  const [decryptedSummary, setDecryptedSummary] = React.useState<BackupSummary | null>(null);
  const [strategy, setStrategy] = React.useState<"merge" | "replace">("merge");

  // Reset state when modal is closed
  const handleClose = React.useCallback(() => {
    setPassword("");
    setError(null);
    setDecryptedPayload(null);
    setDecryptedSummary(null);
    setStrategy("merge");
    onClose();
  }, [onClose]);

  const activePayload = decryptedPayload || unencryptedPayload;
  const activeSummary = React.useMemo(() => {
    if (decryptedSummary) return decryptedSummary;
    if (unencryptedPayload) return summarizeBackupPayload(unencryptedPayload);
    return null;
  }, [decryptedSummary, unencryptedPayload]);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptedFile) return;
    if (!password) {
      setError("Please enter the master password used to encrypt this backup.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await decryptAndValidateLokkerBackup(encryptedFile, password);
      setDecryptedPayload(res.payload);
      setDecryptedSummary(res.summary);
    } catch (err: any) {
      setError(err?.message || "Incorrect backup password or corrupted ciphertext.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!activePayload) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirmRestore(activePayload, strategy);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to restore backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            {activePayload ? "Restore Lokker Vault Backup" : "Decrypt Lokker Backup"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {activePayload
              ? "Review the contents of this backup and choose your restore strategy."
              : "This backup file is encrypted with AES-GCM 256-bit. Enter the master password used when it was exported."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Password Prompt if Encrypted and not yet decrypted */}
        {!activePayload && encryptedFile && (
          <form onSubmit={handleDecrypt} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="backup-master-password" className="text-xs font-medium">
                Backup Master Password
              </Label>
              <Input
                id="backup-master-password"
                type="password"
                placeholder="Enter password..."
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
                onClick={handleClose}
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
                {loading ? "Decrypting..." : "Decrypt Backup"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2: Summary & Strategy Selection */}
        {activePayload && activeSummary && (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto lokker-scrollbar space-y-5 pt-2">
            {/* Contents Overview Card */}
            <div className="rounded-xl border border-border-subtle bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Backup Contents</span>
                <Badge variant="outline" className="text-[10px] bg-surface">
                  Version {activeSummary.version} • {activeSummary.exportedAt ? new Date(activeSummary.exportedAt).toLocaleDateString() : "Snapshot"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <KeyRound className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    <strong>{activeSummary.passwordCount}</strong> Passwords
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <BookmarkIcon className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    <strong>{activeSummary.bookmarkCount}</strong> Bookmarks
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <Tag className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    <strong>{activeSummary.categoryCount}</strong> Categories
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <QrCode className="size-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">
                    <strong>{activeSummary.totpCount}</strong> 2FA TOTP
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <FolderLock className="size-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    <strong>{activeSummary.fileCount}</strong> Files
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border-subtle">
                  <CheckCircle2 className="size-3.5 text-success shrink-0" />
                  <span className="truncate">Settings & Keys</span>
                </div>
              </div>
            </div>

            {/* Restore Strategy Radios */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-foreground">Select Restore Strategy</Label>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setStrategy("merge")}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    strategy === "merge"
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Merge & Synchronize</span>
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                      Safe
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Adds non-duplicate items to your current vault. Preserves any existing credentials, bookmarks, and settings.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy("replace")}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    strategy === "replace"
                      ? "bg-destructive/10 border-destructive text-foreground"
                      : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      <span>Complete Fresh Restore</span>
                    </span>
                    <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                      Replaces Vault
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Completely replaces your local vault with this backup snapshot, restoring exact categories, bookmarks, and encryption keys.
                  </p>
                </button>
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
                onClick={handleClose}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleExecuteRestore}
                variant={strategy === "replace" ? "destructive" : "default"}
                size="sm"
                className="text-xs font-medium cursor-pointer"
              >
                {loading
                  ? "Restoring..."
                  : strategy === "replace"
                  ? "Confirm & Replace Vault"
                  : "Merge into Vault"}
              </Button>
            </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

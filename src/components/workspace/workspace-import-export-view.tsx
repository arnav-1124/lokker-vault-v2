"use client";

import * as React from "react";
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  FolderArchive,
  AlertTriangle,
  Check,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordEntry } from "@/types";
import {
  parseCSVToEntries,
  parseJSONBackupText,
  decryptEncryptedBackupData,
} from "@/lib/importers";

interface WorkspaceImportExportViewProps {
  workspaceName?: string;
  isAdmin?: boolean;
  canWrite?: boolean;
  passwordsCount: number;
  bookmarksCount: number;
  categoriesCount: number;
  onExportEncrypted: (passphrase: string) => Promise<void>;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportCredentials: (
    entries: PasswordEntry[]
  ) => Promise<{ importedCount: number; duplicateCount: number }>;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
}

export function WorkspaceImportExportView({
  workspaceName = "Workspace",
  isAdmin = false,
  canWrite,
  passwordsCount,
  bookmarksCount,
  categoriesCount,
  onExportEncrypted,
  onExportCSV,
  onExportJSON,
  onImportCredentials,
  addToast,
}: WorkspaceImportExportViewProps) {
  const userCanWrite = canWrite !== undefined ? canWrite : isAdmin;
  // Export states
  const [exportPassphrase, setExportPassphrase] = React.useState("");
  const [showExportPassphrase, setShowExportPassphrase] = React.useState(false);
  const [isExportingEncrypted, setIsExportingEncrypted] = React.useState(false);

  // Import states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [pendingEncryptedBackup, setPendingEncryptedBackup] = React.useState<{
    cipherText: string;
    iv: string;
    salt: string;
  } | null>(null);
  const [importPassphrase, setImportPassphrase] = React.useState("");
  const [showImportPassphrase, setShowImportPassphrase] = React.useState(false);
  const [isDecrypting, setIsDecrypting] = React.useState(false);

  // Preview before commit
  const [previewEntries, setPreviewEntries] = React.useState<PasswordEntry[] | null>(null);
  const [detectedFormat, setDetectedFormat] = React.useState<string>("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    importedCount: number;
    duplicateCount: number;
  } | null>(null);

  // Handle Export Encrypted
  const handleExportEncrypted = async () => {
    if (!exportPassphrase || exportPassphrase.length < 8) {
      addToast("Passphrase must be at least 8 characters long", "error");
      return;
    }
    try {
      setIsExportingEncrypted(true);
      await onExportEncrypted(exportPassphrase);
      addToast("Workspace encrypted backup exported successfully", "success");
      setExportPassphrase("");
    } catch (err: any) {
      addToast(err.message || "Failed to export encrypted backup", "error");
    } finally {
      setIsExportingEncrypted(false);
    }
  };

  // Process selected or dropped file
  const handleProcessFile = (file: File) => {
    setImportResult(null);
    setPreviewEntries(null);
    setPendingEncryptedBackup(null);
    setImportPassphrase("");

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        addToast("Empty file provided", "error");
        return;
      }

      try {
        if (fileName.endsWith(".csv")) {
          // CSV format
          const entries = parseCSVToEntries(text);
          if (entries.length === 0) {
            addToast("No valid credentials found in CSV file", "error");
            return;
          }
          setDetectedFormat("CSV (Browser / Password Manager Export)");
          setPreviewEntries(entries);
        } else {
          // JSON or .lokker-ws format
          try {
            const parsed = parseJSONBackupText(text);
            if (parsed.isEncrypted && parsed.encryptedBackup) {
              setDetectedFormat(
                fileName.endsWith(".lokker-ws")
                  ? "Lokker Encrypted Workspace Container (.lokker-ws)"
                  : "Lokker Encrypted Backup (.json)"
              );
              setPendingEncryptedBackup(parsed.encryptedBackup);
            } else if (parsed.passwords && parsed.passwords.length > 0) {
              setDetectedFormat("Lokker / Bitwarden Plaintext JSON Export");
              setPreviewEntries(parsed.passwords);
            } else {
              addToast("No login credentials found in JSON backup", "error");
            }
          } catch (jsonErr: any) {
            // If JSON parse fails but file might be CSV
            const entries = parseCSVToEntries(text);
            if (entries.length > 0) {
              setDetectedFormat("CSV File");
              setPreviewEntries(entries);
            } else {
              throw new Error("Unrecognized or corrupted file format");
            }
          }
        }
      } catch (err: any) {
        addToast(err.message || "Failed to parse file", "error");
      }
    };

    reader.readAsText(file);
  };

  // Decrypt pending encrypted container
  const handleDecryptContainer = async () => {
    if (!pendingEncryptedBackup || !importPassphrase) {
      addToast("Please enter the decryption passphrase", "error");
      return;
    }

    try {
      setIsDecrypting(true);
      const decrypted = await decryptEncryptedBackupData(
        pendingEncryptedBackup,
        importPassphrase
      );

      if (!decrypted.passwords || decrypted.passwords.length === 0) {
        addToast("Decrypted container has no credentials", "info");
      } else {
        setPreviewEntries(decrypted.passwords);
        setPendingEncryptedBackup(null);
        setImportPassphrase("");
        addToast(`Decrypted ${decrypted.passwords.length} credentials successfully`, "success");
      }
    } catch {
      addToast("Decryption failed. Please check your passphrase.", "error");
    } finally {
      setIsDecrypting(false);
    }
  };

  // Commit imported credentials to workspace
  const handleConfirmImport = async () => {
    if (!previewEntries || previewEntries.length === 0) return;
    try {
      setIsImporting(true);
      const result = await onImportCredentials(previewEntries);
      setImportResult(result);
      setPreviewEntries(null);
      addToast(
        `Imported ${result.importedCount} credential(s). ${result.duplicateCount} duplicate(s) skipped.`,
        "success"
      );
    } catch (err: any) {
      addToast(err.message || "Failed to import credentials", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <span>Workspace Portability & Data Transfer</span>
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              {workspaceName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zero vendor lock-in. Export client-side encrypted workspace archives, CSV tables, or import logins seamlessly.
          </p>
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground self-start sm:self-auto bg-surface px-3 py-1.5 rounded-xl border border-border-subtle">
          <span><strong>{passwordsCount}</strong> passwords</span>
          <span>•</span>
          <span><strong>{bookmarksCount}</strong> bookmarks</span>
          <span>•</span>
          <span><strong>{categoriesCount}</strong> categories</span>
        </div>
      </div>

      {/* Role Notice */}
      {!isAdmin && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
          <Info className="size-4 shrink-0" />
          <span>
            <strong>Read-only Permission:</strong> You can export workspace secrets, but only Workspace Admins can import new credentials.
          </span>
        </div>
      )}

      {/* SECTION 1: EXPORT WORKSPACE DATA */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Download className="size-4 text-primary" />
            <span>Export Workspace Data</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download your team secrets for disaster recovery, air-gapped backup, or spreadsheet reporting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 1. Encrypted Workspace Container (.lokker-ws) */}
          <div className="rounded-2xl border border-primary/30 bg-surface p-5 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Recommended
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FolderArchive className="size-4 text-primary" />
                  <span>Encrypted Archive (.lokker-ws)</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero-knowledge encrypted snapshot. Protected with AES-GCM 256-bit and PBKDF2 (100,000 rounds).
              </p>

              {/* Passphrase Input */}
              <div className="pt-2 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Set Export Passphrase (min 8 chars)
                </Label>
                <div className="relative">
                  <Input
                    type={showExportPassphrase ? "text" : "password"}
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    placeholder="Enter strong passphrase"
                    className="h-8 text-xs pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassphrase(!showExportPassphrase)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showExportPassphrase ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <Button
                size="sm"
                onClick={handleExportEncrypted}
                disabled={isExportingEncrypted || exportPassphrase.length < 8}
                className="w-full text-xs gap-1.5 h-8 font-medium cursor-pointer"
              >
                {isExportingEncrypted ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                <span>Export .lokker-ws</span>
              </Button>
            </div>
          </div>

          {/* 2. Plaintext CSV */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="size-4 text-warning" />
                  <span>Plaintext CSV</span>
                </span>
                <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                  Unencrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Spreadsheet table with Titles, URLs, Usernames, Passwords, and 2FA TOTP secrets. Ideal for external audits.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                className="w-full text-xs gap-1.5 h-8 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export CSV Table</span>
              </Button>
            </div>
          </div>

          {/* 3. Structured JSON */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileJson className="size-4 text-blue-500" />
                  <span>Structured JSON</span>
                </span>
                <Badge variant="outline" className="text-muted-foreground border-border-subtle text-[10px]">
                  Unencrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw JSON backup containing passwords, bookmarks, and organizational categories. For programmatic scripts.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportJSON}
                className="w-full text-xs gap-1.5 h-8 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export JSON Backup</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: IMPORT CREDENTIALS */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Upload className="size-4 text-primary" />
            <span>Import Credentials into {workspaceName}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Import passwords and 2FA tokens from Google Chrome, Bitwarden, 1Password, or Lokker backups.
          </p>
        </div>

        {/* Dropzone / Upload box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (userCanWrite) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!userCanWrite) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleProcessFile(file);
          }}
          onClick={() => {
            if (userCanWrite) fileInputRef.current?.click();
          }}
          className={`rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center space-y-3 transition-colors ${
            !userCanWrite
              ? "opacity-60 cursor-not-allowed border-border-subtle bg-surface"
              : isDragging
              ? "border-primary bg-primary/5 cursor-pointer"
              : "border-border-subtle bg-surface hover:border-border-strong cursor-pointer"
          }`}
        >
          <div className="size-12 rounded-full bg-surface-elevated text-primary flex items-center justify-center shadow-2xs">
            <Upload className="size-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {userCanWrite
                ? "Drop archive or credential file here"
                : "Importing is disabled in read-only audit mode"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports <code className="text-foreground">.lokker-ws</code>, <code className="text-foreground">.csv</code> (Chrome, Bitwarden, 1Password), or <code className="text-foreground">.json</code>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".lokker-ws,.lokker,.csv,.json"
            disabled={!userCanWrite}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleProcessFile(f);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
            className="hidden"
          />

          {userCanWrite && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-xs cursor-pointer h-8"
            >
              Browse Files
            </Button>
          )}
        </div>

        {/* Pending Decryption Card (if encrypted container uploaded) */}
        {pendingEncryptedBackup && (
          <div className="p-5 rounded-2xl border border-primary/40 bg-surface space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Lock className="size-4 text-primary" />
              <span className="text-xs font-semibold">Encrypted Container Detected</span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                {detectedFormat}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Please enter the passphrase used to protect this container to decrypt and preview its credentials:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Input
                  type={showImportPassphrase ? "text" : "password"}
                  value={importPassphrase}
                  onChange={(e) => setImportPassphrase(e.target.value)}
                  placeholder="Enter decryption passphrase"
                  className="h-9 text-xs pr-8 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDecryptContainer();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowImportPassphrase(!showImportPassphrase)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showImportPassphrase ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              <Button
                onClick={handleDecryptContainer}
                disabled={isDecrypting || !importPassphrase}
                size="sm"
                className="h-9 text-xs gap-1.5 font-medium cursor-pointer"
              >
                {isDecrypting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unlock className="size-3.5" />
                )}
                <span>Unlock & Inspect</span>
              </Button>
            </div>
          </div>
        )}

        {/* Preview Panel before commit */}
        {previewEntries && previewEntries.length > 0 && (
          <div className="p-5 rounded-2xl border border-border-subtle bg-surface space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success" />
                  <span className="text-xs font-semibold text-foreground">
                    Ready to Import: {previewEntries.length} Credential(s)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {detectedFormat}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Items matching existing website and username will be automatically skipped to prevent duplicates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewEntries(null)}
                  disabled={isImporting}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  <span>Commit to {workspaceName}</span>
                </Button>
              </div>
            </div>

            {/* Credential sample list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {previewEntries.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border-subtle text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-foreground truncate">
                      {entry.websiteName || entry.websiteUrl || "Unnamed Credential"}
                    </span>
                    <span className="text-muted-foreground truncate">
                      ({entry.username || "No username"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.totpSecret && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        2FA Included
                      </Badge>
                    )}
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ••••••••
                    </span>
                  </div>
                </div>
              ))}
              {previewEntries.length > 10 && (
                <p className="text-[11px] text-center text-muted-foreground pt-1">
                  ...and {previewEntries.length - 10} more credentials
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Result Status Banner */}
        {importResult && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              <span>
                <strong>Import complete:</strong> Added <strong>{importResult.importedCount}</strong> new credential(s) to {workspaceName}.{" "}
                {importResult.duplicateCount > 0 && (
                  <span>
                    ({importResult.duplicateCount} duplicate(s) skipped).
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="text-[11px] underline font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

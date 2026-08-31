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
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImportExportViewProps {
  isUnlocked: boolean;
  onUnlockVaultClick: () => void;
  onImportLokkerBackupFile: (file: File) => void;
  onImportExternalFile: (file: File) => void;
  onExportEncryptedBackup: () => void;
  onExportUnencryptedBackup: () => void;
  onExportCSV: () => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
}

export function ImportExportView({
  isUnlocked,
  onUnlockVaultClick,
  onImportLokkerBackupFile,
  onImportExternalFile,
  onExportEncryptedBackup,
  onExportUnencryptedBackup,
  onExportCSV,
}: ImportExportViewProps) {
  const backupInputRef = React.useRef<HTMLInputElement>(null);
  const externalInputRef = React.useRef<HTMLInputElement>(null);
  const [isDraggingBackup, setIsDraggingBackup] = React.useState(false);
  const [isDraggingExternal, setIsDraggingExternal] = React.useState(false);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <span>Vault Portability & Full Backup</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Zero vendor lock-in. Full encrypted vault portability and external browser migration.
        </p>
      </div>

      {/* SECTION 1: FULL LOKKER BACKUP & RESTORE */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            <span>Full Lokker Vault Backup & Restore</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preserves 100% of your passwords, bookmarks, categories, TOTP secrets, settings, and encrypted files in a portable format.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Backup Export Card */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FolderArchive className="size-4 text-primary" />
                  <span>Export Full Backup</span>
                </span>
                <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                  AES-GCM Encrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export an offline encrypted snapshot (<code className="text-foreground">.lokker</code>) of your entire workspace. Move it safely to any computer or browser.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <Button
                size="sm"
                onClick={onExportEncryptedBackup}
                className="w-full text-xs gap-1.5 h-8 font-medium cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export Encrypted Backup (.lokker)</span>
              </Button>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onExportUnencryptedBackup}
                  className="text-[11px] text-muted-foreground hover:text-destructive underline cursor-pointer"
                >
                  Export plain JSON (Unencrypted)
                </button>
              </div>
            </div>
          </div>

          {/* Full Backup Restore Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingBackup(true);
            }}
            onDragLeave={() => setIsDraggingBackup(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBackup(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onImportLokkerBackupFile(file);
            }}
            onClick={() => backupInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center flex flex-col items-center justify-center space-y-3 transition-colors cursor-pointer ${
              isDraggingBackup
                ? "border-primary bg-primary/5"
                : "border-border-subtle bg-surface hover:border-border-strong"
            }`}
          >
            <div className="size-10 rounded-full bg-surface-elevated text-primary flex items-center justify-center">
              <Upload className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Restore Full Lokker Backup
              </p>
              <p className="text-[11px] text-muted-foreground">
                Drag and drop your <code className="text-foreground">.lokker</code> or <code className="text-foreground">.json</code> backup file
              </p>
            </div>
            <input
              ref={backupInputRef}
              type="file"
              accept=".lokker,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onImportLokkerBackupFile(f);
                  if (backupInputRef.current) backupInputRef.current.value = "";
                }
              }}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                backupInputRef.current?.click();
              }}
              className="text-xs cursor-pointer h-7"
            >
              Select Backup File
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXTERNAL PASSWORD MANAGERS (CHROME / BITWARDEN / 1PASSWORD) */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Upload className="size-4 text-primary" />
            <span>External Password Manager Migration</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Import logins from Chrome, Bitwarden, or 1Password. Export unencrypted CSV for other managers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* External Manager Import Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingExternal(true);
            }}
            onDragLeave={() => setIsDraggingExternal(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingExternal(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onImportExternalFile(file);
            }}
            onClick={() => externalInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center flex flex-col items-center justify-center space-y-3 transition-colors cursor-pointer ${
              isDraggingExternal
                ? "border-primary bg-primary/5"
                : "border-border-subtle bg-surface hover:border-border-strong"
            }`}
          >
            <div className="size-10 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center">
              <FileSpreadsheet className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Import from Browser / Manager
              </p>
              <p className="text-[11px] text-muted-foreground">
                Supports Chrome CSV, Bitwarden JSON/CSV, 1Password CSV
              </p>
            </div>
            <input
              ref={externalInputRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onImportExternalFile(f);
                  if (externalInputRef.current) externalInputRef.current.value = "";
                }
              }}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                externalInputRef.current?.click();
              }}
              className="text-xs cursor-pointer h-7"
            >
              Browse CSV/JSON
            </Button>
          </div>

          {/* Plain CSV Export Card */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="size-4 text-warning" />
                  <span>Plain CSV Export</span>
                </span>
                <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                  Unencrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export standard plaintext spreadsheet format for importing into legacy tools or browser password managers.
              </p>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                className="w-full text-xs gap-1.5 h-8 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export Passwords as CSV</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

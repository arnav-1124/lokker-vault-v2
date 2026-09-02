"use client";

import * as React from "react";
import {
  FolderLock,
  Upload,
  File,
  Trash2,
  Download,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EncryptedFile } from "@/types";
import {
  deleteEncryptedFileDB,
  getEncryptedFiles,
  saveEncryptedFile,
} from "@/lib/db";
import { decryptFileWithVek, encryptFileWithVek } from "@/lib/crypto";
import { generateId } from "@/lib/id";

interface FileVaultViewProps {
  derivedKey: CryptoKey | null;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive?: boolean
  ) => void;
  onUnlockClick: () => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
}

export function FileVaultView({
  derivedKey,
  showConfirm,
  onUnlockClick,
  addToast,
}: FileVaultViewProps) {
  const [files, setFiles] = React.useState<EncryptedFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadFiles() {
      try {
        const loaded = await getEncryptedFiles();
        setFiles(loaded);
      } catch (err) {
        console.error("Failed to load encrypted files", err);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!derivedKey) {
      addToast("Please unlock your vault before encrypting and storing files.", "error");
      onUnlockClick();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast("File size limit is 10MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;

        // Encrypt with active VEK using AES-GCM 256-bit
        const { cipherText, iv } = await encryptFileWithVek(base64Data, derivedKey);

        const newFile: EncryptedFile = {
          id: generateId("file"),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          data: cipherText,
          iv,
          isEncrypted: true,
          createdAt: Date.now(),
        };

        await saveEncryptedFile(newFile);
        setFiles((prev) => [newFile, ...prev]);
        addToast(`Encrypted & stored "${file.name}" with AES-GCM 256.`, "success");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch {
        addToast("Failed to encrypt file with vault key.", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm(
      "Delete Encrypted File",
      `Are you sure you want to permanently delete "${name}"?`,
      async () => {
        await deleteEncryptedFileDB(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
        addToast("File deleted from local vault.", "info");
      },
      true
    );
  };

  const handleDownload = async (file: EncryptedFile) => {
    try {
      let finalDataUrl = file.data;

      if (file.iv && file.isEncrypted !== false) {
        if (!derivedKey) {
          addToast("Please unlock your vault to decrypt this file.", "error");
          onUnlockClick();
          return;
        }
        finalDataUrl = await decryptFileWithVek(file.data, file.iv, derivedKey);
      }

      const a = document.createElement("a");
      a.href = finalDataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast(`Decrypted & downloaded "${file.name}".`, "success");
    } catch {
      addToast("Failed to decrypt file: Authentication failed or data tampered.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FolderLock className="size-4 text-primary" />
            <span>Encrypted File Vault</span>
            <Badge variant="outline" className="text-xs font-mono">
              {files.length}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Client-side AES-GCM 256-bit encrypted documents and credentials stored in local IndexedDB
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => {
              if (!derivedKey) {
                onUnlockClick();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Upload className="size-3.5" />
            <span>Upload & Encrypt File</span>
          </Button>
        </div>
      </div>

      {!derivedKey && (
        <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            <span>Vault is locked. Decryption keys are not in memory.</span>
          </div>
          <Button size="sm" variant="outline" onClick={onUnlockClick} className="h-7 text-xs cursor-pointer">
            Unlock Vault
          </Button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-3">
          <div className="size-10 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center mx-auto">
            <File className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No encrypted files stored</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Store private PDFs, cryptographic key files, IDs, or sensitive images with AES-GCM 256-bit encryption.
            </p>
          </div>
          <Button
            onClick={() => {
              if (!derivedKey) {
                onUnlockClick();
              } else {
                fileInputRef.current?.click();
              }
            }}
            size="sm"
            variant="outline"
            className="text-xs cursor-pointer"
          >
            Choose File
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-xl border border-border-subtle bg-surface p-4 flex flex-col justify-between gap-3 hover:border-border-strong transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="size-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-primary shrink-0">
                  <File className="size-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                    {file.isEncrypted !== false && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] py-0 px-1">
                        AES-GCM
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || "Document"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(file.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => handleDownload(file)}
                    title="Decrypt & Download file"
                    className="cursor-pointer"
                  >
                    <Download className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(file.id, file.name)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

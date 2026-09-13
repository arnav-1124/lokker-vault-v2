"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud, CheckSquare, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CloudUploadChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadAll: () => Promise<void>;
  onUploadSelected: () => void;
  totalLocalItems?: number;
}

export function CloudUploadChoiceModal({
  isOpen,
  onClose,
  onUploadAll,
  onUploadSelected,
  totalLocalItems,
}: CloudUploadChoiceModalProps) {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUploadAllClick = async () => {
    setIsUploading(true);
    try {
      await onUploadAll();
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSelectedClick = () => {
    onUploadSelected();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isUploading && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Cloud className="size-5" />
            </div>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 px-2 py-0.5 font-mono">
              1-Click Cloud Migration
            </Badge>
          </div>

          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Upload Credentials to Lokker Cloud
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Would you like to upload all your local credentials to Lokker Cloud in one click, or choose specific credentials to sync?
          </DialogDescription>
        </DialogHeader>

        {/* 2 Options Cards */}
        <div className="space-y-3 pt-2">
          {/* Option A: Upload All in 1 Click */}
          <div
            onClick={!isUploading ? handleUploadAllClick : undefined}
            className={`p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer space-y-2.5 group ${
              isUploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Sparkles className="size-4 text-primary shrink-0" />
                <span>Upload All Credentials (Recommended)</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary font-bold">
                1-CLICK
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Instantly migrates all your local passwords, bookmarks, and categories to your encrypted cloud vault. Everything is protected with zero-knowledge end-to-end encryption.
              {typeof totalLocalItems === "number" && totalLocalItems > 0 && (
                <span className="block mt-1 font-mono text-primary text-[10px]">
                  • {totalLocalItems} local item{totalLocalItems === 1 ? "" : "s"} ready for cloud migration
                </span>
              )}
            </p>
            <Button
              size="sm"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                handleUploadAllClick();
              }}
              className="w-full h-8 text-xs font-medium gap-1.5 cursor-pointer mt-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Migrating & Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <Cloud className="size-3.5" />
                  <span>Upload All to Cloud</span>
                  <ArrowRight className="size-3" />
                </>
              )}
            </Button>
          </div>

          {/* Option B: Choose Selected Credentials */}
          <div
            onClick={!isUploading ? handleUploadSelectedClick : undefined}
            className={`p-4 rounded-xl border border-border-subtle bg-background hover:border-primary/30 hover:bg-surface-elevated transition-all cursor-pointer space-y-2.5 ${
              isUploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <CheckSquare className="size-4 text-muted-foreground shrink-0" />
              <span>Upload Selected Credentials Only</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Keep full granular control. This sync window will close so you can edit any specific credential and click the &quot;Update in Cloud&quot; button individually.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                handleUploadSelectedClick();
              }}
              className="w-full h-8 text-xs font-medium cursor-pointer mt-1 text-muted-foreground hover:text-foreground"
            >
              <span>Choose Selected Credentials (Close Sync Modal)</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-4 px-6 py-3 border-t border-border-subtle bg-muted/20 flex flex-row items-center justify-between rounded-b-xl shrink-0">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3 text-primary" />
            <span>Zero-Knowledge AES-GCM Encryption</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={onClose}
            className="h-7 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

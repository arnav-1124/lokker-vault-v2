"use client";

import * as React from "react";
import { AlertTriangle, Cloud, HardDrive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SaveScopeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToCloud: () => void;
  onSaveLocally: () => void;
  itemType?: string; // e.g. "credential", "bookmark"
}

export function SaveScopeWarningModal({
  isOpen,
  onClose,
  onSaveToCloud,
  onSaveLocally,
  itemType = "credential",
}: SaveScopeWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border-border-subtle p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="size-5" />
          </div>

          <div className="space-y-1.5">
            <DialogTitle className="text-base font-semibold text-foreground">
              Save to Local Device Only?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              You are signed into your Lokker account, but you chose to save this {itemType} strictly on this local device. It will <strong className="text-foreground">not</strong> be backed up to your encrypted cloud.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-3.5 rounded-xl border border-border-subtle bg-muted/20 text-xs space-y-1.5 my-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <HardDrive className="size-3.5 text-muted-foreground" />
            <span>Local Device Storage Only</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            If you switch devices, lose this computer, or clear your browser history, this {itemType} will be lost permanently.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-border-subtle mt-2">
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
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveLocally}
            className="text-xs gap-1.5 cursor-pointer border-border-subtle hover:bg-surface-elevated"
          >
            <HardDrive className="size-3.5 text-muted-foreground" />
            <span>Save Locally</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onSaveToCloud}
            className="text-xs font-medium gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Cloud className="size-3.5" />
            <span>Add to Cloud Instead</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

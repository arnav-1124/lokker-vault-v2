"use client";

import * as React from "react";
import {
  AlertTriangle,
  Cloud,
  CloudOff,
  HardDrive,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DeleteItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    subtitle?: string;
    storageScope?: "cloud" | "local";
    itemType: "password" | "bookmark";
  } | null;
  hasCloudSession: boolean;
  onConfirmDelete: (mode: "everywhere" | "cloud-only" | "local") => Promise<void> | void;
}

export function DeleteItemModal({
  isOpen,
  onClose,
  item,
  hasCloudSession,
  onConfirmDelete,
}: DeleteItemModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Reset state whenever modal opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!item) return null;

  const isCloudSynced = item.storageScope === "cloud" && hasCloudSession;
  const isPassword = item.itemType === "password";
  const itemTypeLabel = isPassword ? "Password Entry" : "Bookmark";

  const handleDelete = async (mode: "everywhere" | "cloud-only" | "local") => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(mode);
      onClose();
    } catch (err) {
      console.error("Delete operation failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border-border-subtle p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="size-11 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
            <Trash2 className="size-5" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground">
              Delete {itemTypeLabel}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {isCloudSynced
                ? "This item is synced to Lokker Cloud and your connected devices. Choose where to delete it:"
                : "This item is stored only on this device. Deleting it will permanently remove it."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Item Preview Card */}
        <div className="p-3 rounded-xl border border-border-subtle bg-muted/20 flex items-center justify-between gap-3 my-1">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground truncate">{item.title}</div>
            {item.subtitle && (
              <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
            )}
          </div>
          {isCloudSynced ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Cloud className="size-3" />
              <span>Cloud Synced</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border-subtle shrink-0">
              <HardDrive className="size-3" />
              <span>Device Only</span>
            </span>
          )}
        </div>

        {isCloudSynced ? (
          /* Cloud Options: Everywhere vs Cloud Only */
          <div className="space-y-2.5 my-2">
            {/* Option 1: Delete Everywhere */}
            <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-destructive flex items-center gap-1.5">
                    <Trash2 className="size-3.5" />
                    <span>Delete Everywhere</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Permanently purges this {itemTypeLabel.toLowerCase()} from this computer, Lokker Cloud, and all synced devices.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  data-testid="delete-everywhere-btn"
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => handleDelete("everywhere")}
                  className="text-xs font-medium h-8 px-3 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Everywhere"
                  )}
                </Button>
              </div>
            </div>

            {/* Option 2: Remove from Cloud Only */}
            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-elevated/40 hover:bg-surface-elevated transition-colors space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <CloudOff className="size-3.5 text-blue-400" />
                    <span>Remove from Cloud Only</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Removes from Lokker Cloud & other devices, but keeps a local-only copy safe on this device.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  data-testid="delete-cloud-only-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => handleDelete("cloud-only")}
                  className="text-xs font-medium h-8 px-3 cursor-pointer border-border-subtle hover:bg-surface-elevated text-foreground"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Updating...
                    </>
                  ) : (
                    "Keep Locally Only"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Local Device Only Option */
          <div className="space-y-3 my-2">
            <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <span>
                This credential is not saved to the cloud. Once deleted, it cannot be recovered.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                data-testid="delete-local-btn"
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => handleDelete("local")}
                className="text-xs font-medium h-8 px-4 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  "Delete from Device"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-start pt-2 border-t border-border-subtle">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
            className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

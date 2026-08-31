"use client";

import * as React from "react";
import { AlertTriangle, FolderX, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/types";

interface CategoryDeleteModalProps {
  isOpen: boolean;
  categoryName: string;
  passwordCount: number;
  bookmarkCount: number;
  childCount: number;
  categories: Category[];
  deleteCategoryId: string;
  onTransferAndDelete: (deleteCategoryId: string, transferToCatName: string) => void;
  onClose: () => void;
}

export function CategoryDeleteModal({
  isOpen,
  categoryName,
  passwordCount,
  bookmarkCount,
  childCount,
  categories,
  deleteCategoryId,
  onTransferAndDelete,
  onClose,
}: CategoryDeleteModalProps) {
  const [selectedTarget, setSelectedTarget] = React.useState<string>("");

  // Available targets: all categories except the one being deleted and its descendants
  const getDescendantIds = React.useCallback(
    (catId: string): Set<string> => {
      const ids = new Set<string>();
      const collect = (id: string) => {
        categories
          .filter((c) => c.parentId === id)
          .forEach((child) => {
            ids.add(child.id);
            collect(child.id);
          });
      };
      collect(catId);
      return ids;
    },
    [categories]
  );

  const excludedIds = React.useMemo(
    () => new Set([deleteCategoryId, ...getDescendantIds(deleteCategoryId)]),
    [deleteCategoryId, getDescendantIds]
  );

  const targetCategories = React.useMemo(
    () => categories.filter((c) => !excludedIds.has(c.id)),
    [categories, excludedIds]
  );

  // Auto-select first available target
  React.useEffect(() => {
    if (targetCategories.length > 0 && !selectedTarget) {
      setSelectedTarget(targetCategories[0].name);
    }
  }, [targetCategories, selectedTarget]);

  const canConfirm = selectedTarget !== "";

  const totalItems = passwordCount + bookmarkCount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl flex items-center justify-center mb-1 bg-destructive/10 text-destructive">
            <FolderX className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Cannot Delete &ldquo;{categoryName}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            This category still contains items. You must transfer them to another category before deleting.
          </DialogDescription>
        </DialogHeader>

        {/* Item summary */}
        <div className="rounded-lg border border-border-subtle bg-background p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Passwords</span>
            <span className="font-mono font-medium text-foreground">{passwordCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bookmarks</span>
            <span className="font-mono font-medium text-foreground">{bookmarkCount}</span>
          </div>
          {childCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Nested categories</span>
              <span className="font-mono font-medium text-foreground">{childCount} <span className="text-muted-foreground font-normal">(will become root-level)</span></span>
            </div>
          )}
        </div>

        {/* Transfer target selector */}
        {totalItems > 0 && (
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <ArrowRight className="size-3 text-primary" />
              Transfer items to:
            </Label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="h-8 text-xs bg-surface">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {targetCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canConfirm}
            onClick={() => onTransferAndDelete(deleteCategoryId, selectedTarget)}
            className="text-xs font-medium cursor-pointer"
          >
            Transfer &amp; Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

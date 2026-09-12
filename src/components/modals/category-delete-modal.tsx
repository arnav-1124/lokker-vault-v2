"use client";

import * as React from "react";
import { FolderX, ArrowRight, CornerDownRight, AlertCircle } from "lucide-react";
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
import {
  getCategoryAncestors,
  getCategoryDescendantIds,
  formatCategoryPath,
} from "@/lib/category-tree";

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
  const [userSelectedTarget, setUserSelectedTarget] = React.useState<string>("");

  const currentCat = React.useMemo(
    () => categories.find((c) => c.id === deleteCategoryId),
    [categories, deleteCategoryId]
  );

  const isChildCategory = !!currentCat?.parentId;

  // Descendants cannot be transfer targets (prevents circular loops)
  const descendantIds = React.useMemo(
    () => getCategoryDescendantIds(deleteCategoryId, categories),
    [deleteCategoryId, categories]
  );

  const excludedIds = React.useMemo(
    () => new Set([deleteCategoryId, ...descendantIds]),
    [deleteCategoryId, descendantIds]
  );

  // Parent / Ancestor categories (if deleting a child category)
  const ancestorCategories = React.useMemo(() => {
    if (!isChildCategory) return [];
    return getCategoryAncestors(deleteCategoryId, categories);
  }, [isChildCategory, deleteCategoryId, categories]);

  const ancestorIds = React.useMemo(
    () => new Set(ancestorCategories.map((a) => a.id)),
    [ancestorCategories]
  );

  // Other available categories
  const otherCategories = React.useMemo(() => {
    if (isChildCategory) {
      // Any category that is not this category, not a descendant, and not an ancestor
      return categories.filter((c) => !excludedIds.has(c.id) && !ancestorIds.has(c.id));
    } else {
      // If deleting a root category: allow other root (parent) categories
      const otherRoots = categories.filter((c) => !c.parentId && c.id !== deleteCategoryId);
      if (otherRoots.length > 0) return otherRoots;
      // Fallback: any non-descendant category if no other roots exist
      return categories.filter((c) => !excludedIds.has(c.id));
    }
  }, [isChildCategory, categories, excludedIds, ancestorIds, deleteCategoryId]);

  const allAvailableTargets = React.useMemo(
    () => [...ancestorCategories, ...otherCategories],
    [ancestorCategories, otherCategories]
  );

  // Auto-select initial target
  const selectedTarget =
    userSelectedTarget && allAvailableTargets.some((c) => c.name === userSelectedTarget)
      ? userSelectedTarget
      : allAvailableTargets[0]?.name || "";

  const canConfirm = allAvailableTargets.length > 0 && selectedTarget !== "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="size-10 rounded-xl flex items-center justify-center mb-1 bg-destructive/10 text-destructive">
            <FolderX className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Delete &ldquo;{categoryName}&rdquo; &amp; Transfer Data
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            To prevent any accidental data loss, all logins, bookmarks, and nested subcategories will be safely transferred to your chosen destination category.
          </DialogDescription>
        </DialogHeader>

        {/* Data summary */}
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
              <span className="text-muted-foreground">Nested subcategories</span>
              <span className="font-mono font-medium text-foreground">
                {childCount}{" "}
                <span className="text-muted-foreground font-normal text-[11px]">
                  (will be preserved under target)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Target Category Selector */}
        {allAvailableTargets.length > 0 ? (
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <ArrowRight className="size-3 text-primary" />
              <span>Transfer all items to:</span>
            </Label>
            <Select value={selectedTarget} onValueChange={setUserSelectedTarget}>
              <SelectTrigger className="h-9 text-xs bg-surface">
                <SelectValue placeholder="Select destination category..." />
              </SelectTrigger>
              <SelectContent>
                {/* Group 1: Parent categories if deleting a child */}
                {ancestorCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Parent Categories
                    </div>
                    {ancestorCategories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({formatCategoryPath(c.name, categories)})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}

                {/* Group 2: Other categories */}
                {otherCategories.length > 0 && (
                  <>
                    {ancestorCategories.length > 0 && (
                      <div className="px-2 py-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Other Categories
                      </div>
                    )}
                    {otherCategories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span>{c.name}</span>
                          {c.parentId && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({formatCategoryPath(c.name, categories)})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-xs text-foreground flex items-start gap-2">
            <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
            <p>
              You cannot remove this category because there is no other category available to move your items to. Please create another category first.
            </p>
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

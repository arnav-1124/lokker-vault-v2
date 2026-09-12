"use client";

import * as React from "react";
import { Plus, Trash2, Tag, FolderTree, CornerDownRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/types";
import { buildCategoryTree } from "@/lib/category-tree";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string, color: string, parentId?: string) => void;
  onDeleteCategory: (id: string) => void;
  defaultParentId?: string;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#64748b", // Slate
];

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  defaultParentId,
}: CategoryManagerModalProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(PRESET_COLORS[0]);
  const [selectedParentId, setSelectedParentId] = React.useState<string>(defaultParentId || "none");

  // Synchronize input fields and selected parent whenever the modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedParentId(defaultParentId || "none");
    }
  }, [isOpen, defaultParentId]);

  const handleClose = React.useCallback(() => {
    setName("");
    setColor(PRESET_COLORS[0]);
    setSelectedParentId("none");
    onClose();
  }, [onClose]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parentId = selectedParentId !== "none" ? selectedParentId : undefined;
    onAddCategory(name.trim(), color, parentId);
    setName("");
  };

  const tree = React.useMemo(() => buildCategoryTree(categories), [categories]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg w-full bg-surface border-border-subtle p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <span>Manage Categories</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-clip lokker-scrollbar space-y-4 pt-2">
            {/* Add Category Form */}
            <form onSubmit={handleAdd} className="space-y-3 p-3.5 rounded-xl border border-border-subtle bg-background">
              <Label htmlFor="cat-name" className="text-xs font-medium">
                Create New Category
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cat-name"
                  placeholder="Category name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs bg-surface"
                />
                <Button id="btn-add-category" type="submit" size="sm" className="h-8 text-xs gap-1 px-3 cursor-pointer">
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Parent Category Selector — hierarchical */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="cat-parent" className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <FolderTree className="size-3 text-muted-foreground" />
                  <span>Parent Category (Optional Nesting):</span>
                </Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger id="cat-parent" size="sm" className="h-8 text-xs bg-surface">
                    <SelectValue placeholder="Top Level (No Parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Top Level (No Parent)</SelectItem>
                    {tree.map((opt) => (
                      <SelectItem key={opt.category.id} value={opt.category.id}>
                        <span
                          className="flex items-center gap-1.5"
                          style={{ paddingLeft: `${opt.depth * 12}px` }}
                        >
                          {opt.depth > 0 && <CornerDownRight className="size-3 text-muted-foreground shrink-0" />}
                          <span>{opt.category.name}</span>
                          {opt.depth > 0 && (
                            <span className="text-[10px] text-muted-foreground/60 font-mono ml-1">
                              ({opt.path})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground">Color:</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`size-4 rounded-full transition-transform cursor-pointer ${
                        color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </form>

            {/* Existing Categories — tree view */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                Existing Categories ({categories.length})
              </p>
              {tree.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1 py-3 text-center">
                  No categories yet. Create one above.
                </p>
              )}
              {tree.map(({ category: cat, depth, hasChildren, childCount, path }) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border-subtle text-xs"
                  style={{ marginLeft: `${depth * 16}px` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {depth > 0 ? (
                      <CornerDownRight className="size-3 text-muted-foreground/60 shrink-0" />
                    ) : (
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <span className="font-medium text-foreground truncate">{cat.name}</span>
                    {depth > 0 && (
                      <span className="text-[10px] text-muted-foreground/60 truncate max-w-[140px]" title={path}>
                        ({path})
                      </span>
                    )}
                    {hasChildren && (
                      <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                        {childCount} subcategories
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                    title="Delete category"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button id="btn-done-category" variant="outline" size="sm" onClick={handleClose} className="text-xs cursor-pointer">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

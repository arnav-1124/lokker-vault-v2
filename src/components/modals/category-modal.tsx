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

// Build a flat tree-ordered list with depth info
interface TreeItem {
  category: Category;
  depth: number;
}

function buildCategoryTree(categories: Category[]): TreeItem[] {
  const rootCats = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  categories.forEach((c) => {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) || [];
      arr.push(c);
      childrenMap.set(c.parentId, arr);
    }
  });

  const result: TreeItem[] = [];
  const walk = (cat: Category, depth: number) => {
    result.push({ category: cat, depth });
    const children = childrenMap.get(cat.id) || [];
    children.forEach((child) => walk(child, depth + 1));
  };
  rootCats.forEach((root) => walk(root, 0));

  // Append orphaned children (parent doesn't exist in list) as root
  categories.forEach((c) => {
    if (c.parentId && !categories.some((p) => p.id === c.parentId)) {
      if (!result.some((r) => r.category.id === c.id)) {
        result.push({ category: c, depth: 0 });
      }
    }
  });

  return result;
}

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

  const handleClose = React.useCallback(() => {
    setName("");
    setColor(PRESET_COLORS[0]);
    setSelectedParentId(defaultParentId || "none");
    onClose();
  }, [defaultParentId, onClose]);

  // When defaultParentId changes (e.g. clicking "Add Nested" from sidebar), update the selector
  React.useEffect(() => {
    if (defaultParentId) {
      setSelectedParentId(defaultParentId);
    }
  }, [defaultParentId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parentId = selectedParentId !== "none" ? selectedParentId : undefined;
    onAddCategory(name.trim(), color, parentId);
    setName("");
    setSelectedParentId("none");
  };

  const tree = React.useMemo(() => buildCategoryTree(categories), [categories]);

  // Hierarchical options for parent selector
  const parentOptions = React.useMemo(() => {
    const items: { id: string; name: string; depth: number }[] = [];
    const walk = (cat: Category, depth: number) => {
      items.push({ id: cat.id, name: cat.name, depth });
      categories
        .filter((c) => c.parentId === cat.id)
        .forEach((child) => walk(child, depth + 1));
    };
    categories
      .filter((c) => !c.parentId)
      .forEach((root) => walk(root, 0));
    return items;
  }, [categories]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
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
                <Button type="submit" size="sm" className="h-8 text-xs gap-1 px-3 cursor-pointer">
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
                    <SelectValue placeholder="Root Level (No Parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Root Level (No Parent)</SelectItem>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <span
                          className="flex items-center gap-1.5"
                          style={{ paddingLeft: `${opt.depth * 12}px` }}
                        >
                          {opt.depth > 0 && <CornerDownRight className="size-3 text-muted-foreground shrink-0" />}
                          {opt.name}
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
              {tree.map(({ category: cat, depth }) => {
                const hasChildren = categories.some((c) => c.parentId === cat.id);
                return (
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
                      {hasChildren && (
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                          {categories.filter((c) => c.parentId === cat.id).length}
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
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={handleClose} className="text-xs cursor-pointer">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

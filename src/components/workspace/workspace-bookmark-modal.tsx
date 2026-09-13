"use client";

import * as React from "react";
import { Bookmark as BookmarkIcon, CornerDownRight, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Category } from "@/types";
import { buildCategoryTree } from "@/lib/category-tree";

interface WorkspaceBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bm: Bookmark) => void;
  initialBookmark: Bookmark | null;
  categories: Category[];
  defaultCategoryId?: string;
  workspaceName?: string;
}

export function WorkspaceBookmarkModal({
  isOpen,
  onClose,
  onSave,
  initialBookmark,
  categories,
  defaultCategoryId,
  workspaceName,
}: WorkspaceBookmarkModalProps) {
  const [title, setTitle] = React.useState(initialBookmark?.title || "");
  const [url, setUrl] = React.useState(initialBookmark?.url || "");
  const [category, setCategory] = React.useState(
    initialBookmark?.category || defaultCategoryId || (categories[0]?.name || "General")
  );
  const [description, setDescription] = React.useState(initialBookmark?.description || "");
  const [isFavorite, setIsFavorite] = React.useState(!!initialBookmark?.isFavorite);

  const categoryTree = React.useMemo(() => buildCategoryTree(categories), [categories]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialBookmark) {
        setTitle(initialBookmark.title || "");
        setUrl(initialBookmark.url || "");
        setCategory(initialBookmark.category || defaultCategoryId || (categories[0]?.name || "General"));
        setDescription(initialBookmark.description || "");
        setIsFavorite(!!initialBookmark.isFavorite);
      } else {
        setTitle("");
        setUrl("");
        setCategory(defaultCategoryId || (categories[0]?.name || "General"));
        setDescription("");
        setIsFavorite(false);
      }
    }
  }, [isOpen, initialBookmark, defaultCategoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const entry: Bookmark = {
      id: initialBookmark?.id || "ws-bm-" + Date.now().toString(16),
      title: title.trim(),
      url: cleanUrl,
      category: category || "General",
      description: description.trim(),
      isFavorite,
      storageScope: "cloud",
      createdAt: initialBookmark?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(entry);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg w-full bg-surface border-border-subtle p-6 max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <BookmarkIcon className="size-4 text-primary" />
            <span>{initialBookmark ? "Edit Workspace Bookmark" : "Add Workspace Bookmark"}</span>
            {workspaceName && (
              <span className="text-xs font-normal text-muted-foreground">
                • {workspaceName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-clip lokker-scrollbar space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-bm-title" className="text-xs">
                Title / Name
              </Label>
              <Input
                id="ws-bm-title"
                required
                placeholder="e.g. Team Documentation, Staging Dashboard, GitHub Repo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-bm-url" className="text-xs">
                Website URL
              </Label>
              <Input
                id="ws-bm-url"
                required
                placeholder="https://docs.team.internal or https://github.com/org/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-bm-cat" className="text-xs">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="ws-bm-cat" size="sm" className="bg-background">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryTree.map((item) => (
                    <SelectItem key={item.category.id} value={item.category.name}>
                      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${item.depth * 10}px` }}>
                        {item.depth > 0 && <CornerDownRight className="size-3 text-muted-foreground shrink-0" />}
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.category.color || "#6b7280" }}
                        />
                        <span className="truncate">{item.category.name}</span>
                        {item.depth > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0 opacity-70">
                            ({item.path})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {!categories.some((c) => c.name.toLowerCase() === "general") && (
                    <SelectItem value="General">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-muted-foreground shrink-0" />
                        <span>General</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-bm-desc" className="text-xs">
                Description / Notes (Optional)
              </Label>
              <Textarea
                id="ws-bm-desc"
                rows={3}
                placeholder="What this link is used for, credentials notes, team instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="ws-bm-fav"
                checked={isFavorite}
                onCheckedChange={(checked) => setIsFavorite(!!checked)}
              />
              <Label htmlFor="ws-bm-fav" className="text-xs text-muted-foreground cursor-pointer font-normal">
                Pin to Favorites
              </Label>
            </div>
          </div>

          <div className="-mx-6 -mb-6 mt-6 px-6 py-4 border-t border-border-subtle bg-surface-elevated/40 flex items-center justify-between gap-3 rounded-b-xl shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              className="text-xs font-medium gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Globe className="size-3.5" />
              <span>{initialBookmark ? "Update in Workspace" : "Save to Workspace"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Bookmark as BookmarkIcon, Cloud, HardDrive, CornerDownRight } from "lucide-react";
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
import { Bookmark, Category, StorageScope } from "@/types";
import { generateId } from "@/lib/id";
import { SaveScopeWarningModal } from "./save-scope-warning-modal";
import { getCloudSession, CLOUD_AUTH_CHANGE_EVENT } from "@/lib/auth-session";
import { buildCategoryTree } from "@/lib/category-tree";

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bm: Bookmark) => void;
  initialBookmark: Bookmark | null;
  categories: Category[];
  defaultCategoryId?: string;
}

export function BookmarkModal({
  isOpen,
  onClose,
  onSave,
  initialBookmark,
  categories,
  defaultCategoryId,
}: BookmarkModalProps) {
  const [title, setTitle] = React.useState(initialBookmark?.title || "");
  const [url, setUrl] = React.useState(initialBookmark?.url || "");
  const [category, setCategory] = React.useState(initialBookmark?.category || defaultCategoryId || (categories[0]?.name || "General"));
  const [description, setDescription] = React.useState(initialBookmark?.description || "");
  const [isFavorite, setIsFavorite] = React.useState(!!initialBookmark?.isFavorite);
  const [storageScope, setStorageScope] = React.useState<StorageScope>(initialBookmark?.storageScope || "cloud");
  const [hasCloudSession, setHasCloudSession] = React.useState<boolean>(() => !!getCloudSession());
  const [isWarningModalOpen, setIsWarningModalOpen] = React.useState(false);

  const categoryTree = React.useMemo(() => buildCategoryTree(categories), [categories]);

  React.useEffect(() => {
    const updateSession = () => setHasCloudSession(!!getCloudSession());
    updateSession();
    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, updateSession);
    window.addEventListener("storage", updateSession);
    return () => {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, updateSession);
      window.removeEventListener("storage", updateSession);
    };
  }, [isOpen]);

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

  const buildBookmark = (scope?: StorageScope): Bookmark => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    return {
      id: initialBookmark?.id || generateId("bm"),
      title: title.trim(),
      url: cleanUrl,
      category: category || "General",
      description: description.trim(),
      isFavorite,
      storageScope: scope || initialBookmark?.storageScope || (hasCloudSession ? "cloud" : "local"),
      createdAt: initialBookmark?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleInitiateSave = (scope: StorageScope) => {
    if (!title.trim() || !url.trim()) return;
    if (hasCloudSession && scope === "local") {
      setIsWarningModalOpen(true);
      return;
    }
    const bm = buildBookmark(scope);
    onSave(bm);
    onClose();
  };

  const handleConfirmSaveLocally = () => {
    setIsWarningModalOpen(false);
    const bm = buildBookmark("local");
    onSave(bm);
    onClose();
  };

  const handleConfirmSaveToCloud = () => {
    setIsWarningModalOpen(false);
    const bm = buildBookmark("cloud");
    onSave(bm);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCloudSession) {
      handleInitiateSave("cloud");
    } else {
      handleInitiateSave("local");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-full bg-surface border-border-subtle p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <BookmarkIcon className="size-4 text-primary" />
            <span>{initialBookmark ? "Edit Bookmark" : "Add Bookmark"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bm-title" className="text-xs">
              Site Title
            </Label>
            <Input
              id="bm-title"
              required
              placeholder="e.g. GitHub, Notion, Supabase"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bm-url" className="text-xs">
              Website URL
            </Label>
            <Input
              id="bm-url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bm-cat" className="text-xs">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="bm-cat" size="sm" className="bg-background">
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
            <Label htmlFor="bm-desc" className="text-xs">
              Description (Optional)
            </Label>
            <Textarea
              id="bm-desc"
              rows={2}
              placeholder="Notes or tags for this bookmark..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="bm-fav"
              checked={isFavorite}
              onCheckedChange={(checked) => setIsFavorite(!!checked)}
            />
            <Label htmlFor="bm-fav" className="text-xs text-muted-foreground cursor-pointer font-normal">
              Pin to Favorites
            </Label>
          </div>

          <div className="-mx-6 -mb-6 mt-6 px-6 py-4 border-t border-border-subtle bg-surface-elevated/40 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-b-xl shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>

            {hasCloudSession ? (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInitiateSave("local")}
                  className="text-xs gap-1.5 cursor-pointer border-border-subtle hover:bg-surface-elevated"
                >
                  <HardDrive className="size-3.5 text-muted-foreground" />
                  <span>Save Locally</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleInitiateSave("cloud")}
                  className="text-xs font-medium gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Cloud className="size-3.5" />
                  <span>{initialBookmark ? "Update in Cloud" : "Save to Cloud"}</span>
                </Button>
              </div>
            ) : (
              <Button type="submit" size="sm" className="text-xs font-medium cursor-pointer">
                {initialBookmark ? "Update Bookmark" : "Save Bookmark"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      <SaveScopeWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onSaveLocally={handleConfirmSaveLocally}
        onSaveToCloud={handleConfirmSaveToCloud}
        itemType="bookmark"
      />
    </Dialog>
  );
}

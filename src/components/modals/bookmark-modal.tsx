"use client";

import * as React from "react";
import { Bookmark as BookmarkIcon } from "lucide-react";
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
import { generateId } from "@/lib/id";

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
  const [prevBookmark, setPrevBookmark] = React.useState<Bookmark | null>(initialBookmark);
  const [title, setTitle] = React.useState(initialBookmark?.title || "");
  const [url, setUrl] = React.useState(initialBookmark?.url || "");
  const [category, setCategory] = React.useState(initialBookmark?.category || defaultCategoryId || (categories[0]?.name || "General"));
  const [description, setDescription] = React.useState(initialBookmark?.description || "");
  const [isFavorite, setIsFavorite] = React.useState(!!initialBookmark?.isFavorite);

  if (prevBookmark !== initialBookmark) {
    setPrevBookmark(initialBookmark);
    if (initialBookmark) {
      setTitle(initialBookmark.title || "");
      setUrl(initialBookmark.url || "");
      setCategory(initialBookmark.category || "General");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newBookmark: Bookmark = {
      id: initialBookmark?.id || generateId("bm"),
      title: title.trim(),
      url: cleanUrl,
      category: category || "General",
      description: description.trim(),
      isFavorite,
      createdAt: initialBookmark?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(newBookmark);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem value="General">General</SelectItem>
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

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs font-medium cursor-pointer">
              {initialBookmark ? "Update Bookmark" : "Save Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

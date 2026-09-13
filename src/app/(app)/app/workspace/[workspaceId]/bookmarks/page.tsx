"use client";

import * as React from "react";
import {
  Bookmark as BookmarkIcon,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "@/types";
import { useWorkspace } from "@/context/workspace-context";

export default function WorkspaceBookmarksPage() {
  const {
    activeWorkspace,
    workspaceBookmarks,
    workspaceCategories,
    selectedWorkspaceCategory,
    setSelectedWorkspaceCategory,
    saveWorkspaceBookmark,
    deleteWorkspaceBookmark,
  } = useWorkspace();

  const [search, setSearch] = React.useState("");

  // Add Bookmark Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [newCategory, setNewCategory] = React.useState(workspaceCategories[0]?.name || "General");

  const filteredBookmarks = React.useMemo(() => {
    return workspaceBookmarks.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.url.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !selectedWorkspaceCategory || b.category === selectedWorkspaceCategory;
      return matchesSearch && matchesCat;
    });
  }, [workspaceBookmarks, search, selectedWorkspaceCategory]);

  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const entry: Bookmark = {
      id: "ws-bm-" + Date.now().toString(16),
      title: newTitle.trim(),
      url: formattedUrl,
      category: newCategory,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspaceId: activeWorkspace?.id,
      workspaceName: activeWorkspace?.name,
    };

    await saveWorkspaceBookmark(entry);
    setNewTitle("");
    setNewUrl("");
    setIsAddOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookmarkIcon className="size-5 text-primary" />
            <span>Workspace Bookmarks</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Shared team links and resources for {activeWorkspace?.name || "this workspace"}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Add Bookmark</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border-subtle"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto lokker-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            variant={selectedWorkspaceCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedWorkspaceCategory(null)}
            className="h-7 text-xs px-2.5 cursor-pointer rounded-full"
          >
            All ({workspaceBookmarks.length})
          </Button>
          {workspaceCategories.map((cat) => {
            const count = workspaceBookmarks.filter((b) => b.category === cat.name).length;
            return (
              <Button
                key={cat.id}
                variant={selectedWorkspaceCategory === cat.name ? "secondary" : "ghost"}
                size="sm"
                onClick={() =>
                  setSelectedWorkspaceCategory(selectedWorkspaceCategory === cat.name ? null : cat.name)
                }
                className="h-7 text-xs px-2.5 cursor-pointer rounded-full gap-1.5"
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
                <span className="opacity-60 font-mono text-[10px]">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredBookmarks.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-border-subtle rounded-xl bg-surface/30 space-y-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <BookmarkIcon className="size-5" />
            </div>
            <p className="text-xs font-medium text-foreground">No workspace bookmarks found</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Save shared team docs, repos, dashboards, and staging links here.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add First Bookmark</span>
            </Button>
          </div>
        ) : (
          filteredBookmarks.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 hover:bg-surface transition-all flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-xs text-foreground truncate">{item.title}</span>
                  {item.category && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border-subtle">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate font-mono"
                >
                  <span className="truncate">{item.url}</span>
                  <ExternalLink className="size-2.5 shrink-0" />
                </a>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => deleteWorkspaceBookmark(item.id)}
                className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                title="Delete Bookmark"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Add Workspace Bookmark</h2>
            <form onSubmit={handleCreateBookmark} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  required
                  placeholder="e.g. GitHub Organization, Staging Server"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">URL</label>
                <Input
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-8 text-xs bg-background border border-border-subtle rounded-md px-2 text-foreground"
                >
                  {workspaceCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs cursor-pointer">
                  Save Bookmark
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Bookmark as BookmarkIcon,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  Star,
  Globe,
  MoreVertical,
  Filter,
  ChevronDown,
  CornerDownRight,
  Check,
  Copy,
  KeyRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, PasswordEntry } from "@/types";
import { useWorkspace } from "@/context/workspace-context";
import { calculatePasswordStrength } from "@/lib/crypto";
import { buildCategoryTree, formatCategoryPath, getCategoryFamilyNames } from "@/lib/category-tree";
import { WorkspaceBookmarkModal } from "@/components/workspace/workspace-bookmark-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";

export default function WorkspaceBookmarksPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    workspaceBookmarks,
    workspacePasswords,
    workspaceCategories,
    selectedWorkspaceCategory,
    setSelectedWorkspaceCategory,
    saveWorkspaceBookmark,
    deleteWorkspaceBookmark,
    toggleWorkspaceBookmarkFavorite,
    isAdmin,
  } = useWorkspace();

  const [search, setSearch] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const categoryTree = React.useMemo(
    () => buildCategoryTree(workspaceCategories),
    [workspaceCategories]
  );

  const familyNames = React.useMemo(() => {
    if (!selectedWorkspaceCategory) return null;
    return getCategoryFamilyNames(selectedWorkspaceCategory, workspaceCategories);
  }, [selectedWorkspaceCategory, workspaceCategories]);

  const filteredBookmarks = React.useMemo(() => {
    return workspaceBookmarks.filter((b) => {
      const matchesCategory =
        !familyNames || (b.category && familyNames.has(b.category.toLowerCase()));
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [workspaceBookmarks, familyNames, search]);

  const normalizeHost = (str: string) => {
    if (!str) return "";
    try {
      const raw = str.startsWith("http") ? str : `https://${str}`;
      return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return str.trim().toLowerCase();
    }
  };

  const getLinkedCredential = React.useCallback(
    (bm: Bookmark): PasswordEntry | undefined => {
      if (!bm.url && !bm.title) return undefined;
      const host = normalizeHost(bm.url || bm.title);
      return workspacePasswords.find(
        (p) => normalizeHost(p.websiteUrl || p.websiteName) === host
      );
    },
    [workspacePasswords]
  );

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingBookmark(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bm: Bookmark) => {
    setEditingBookmark(bm);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteWorkspaceBookmark(deletingId);
      setDeletingId(null);
    }
  };

  // Find active category object for display
  const activeCatObj = React.useMemo(() => {
    if (!selectedWorkspaceCategory) return null;
    return workspaceCategories.find(
      (c) => c.name.toLowerCase() === selectedWorkspaceCategory.toLowerCase()
    );
  }, [selectedWorkspaceCategory, workspaceCategories]);

  const activeCatCount = React.useMemo(() => {
    if (!selectedWorkspaceCategory) return workspaceBookmarks.length;
    return workspaceBookmarks.filter(
      (b) => !!b.category && familyNames?.has(b.category.toLowerCase())
    ).length;
  }, [selectedWorkspaceCategory, workspaceBookmarks, familyNames]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookmarkIcon className="size-5 text-primary" />
            <span>Workspace Bookmarks</span>
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {filteredBookmarks.length}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shared team links, documentation, and resources for {activeWorkspace?.name || "this workspace"}.
          </p>
        </div>

        {isAdmin ? (
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Add Bookmark</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs border-border-subtle bg-surface text-muted-foreground px-2.5 py-1">
              Member (Read-Only)
            </Badge>
          </div>
        )}
      </div>

      {/* Filter and Search Bar: Scalable Dropdown instead of compacted horizontal row */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace bookmarks by title, URL, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-background border-border-subtle"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-3 gap-2 shrink-0 border-border-subtle bg-background hover:bg-surface cursor-pointer w-full sm:w-auto justify-between sm:justify-start"
            >
              <Filter className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[180px]">
                {selectedWorkspaceCategory ? (
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: activeCatObj?.color || "#3b82f6" }}
                    />
                    <span className="font-medium text-foreground truncate">
                      {selectedWorkspaceCategory}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      ({activeCatCount})
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>All Categories</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({workspaceBookmarks.length})
                    </span>
                  </span>
                )}
              </span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 max-h-80 overflow-y-auto lokker-scrollbar">
            <DropdownMenuItem
              onClick={() => setSelectedWorkspaceCategory(null)}
              className="text-xs cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className={selectedWorkspaceCategory === null ? "font-semibold text-primary" : ""}>
                  All Categories
                </span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {workspaceBookmarks.length}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {categoryTree.map((item) => {
              const count = workspaceBookmarks.filter(
                (b) => (b.category || "General").toLowerCase() === item.category.name.toLowerCase()
              ).length;
              const isSelected =
                selectedWorkspaceCategory?.toLowerCase() === item.category.name.toLowerCase();

              return (
                <DropdownMenuItem
                  key={item.category.id}
                  onClick={() =>
                    setSelectedWorkspaceCategory(isSelected ? null : item.category.name)
                  }
                  className="text-xs cursor-pointer flex items-center justify-between"
                  style={{ paddingLeft: `${Math.max(8, item.depth * 12 + 8)}px` }}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {item.depth > 0 && (
                      <CornerDownRight className="size-2.5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.category.color || "#6b7280" }}
                    />
                    <span className={`truncate ${isSelected ? "font-semibold text-primary" : ""}`}>
                      {item.category.name}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({count})
                    </span>
                    {isSelected && <Check className="size-3 text-primary shrink-0" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="p-12 text-center border border-border-subtle rounded-xl bg-surface/40 space-y-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <BookmarkIcon className="size-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No workspace bookmarks found</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            {search
              ? `No bookmarks match "${search}".`
              : selectedWorkspaceCategory
              ? `No bookmarks found in category "${selectedWorkspaceCategory}".`
              : "Save shared team docs, repos, dashboards, and staging links here."}
          </p>
          {isAdmin ? (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
            >
              <Plus className="size-3.5" />
              <span>Add First Bookmark</span>
            </Button>
          ) : (
            <p className="text-[11px] text-muted-foreground/80 italic">
              Shared bookmarks added by workspace admins will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredBookmarks.map((item) => {
            const isCopied = copiedId === item.id;
            const linkedCred = getLinkedCredential(item);
            const strength = linkedCred?.password
              ? calculatePasswordStrength(linkedCred.password)
              : null;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border-subtle bg-surface p-4 flex flex-col justify-between gap-3 hover:border-border-strong transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center shrink-0">
                        <Globe className="size-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleWorkspaceBookmarkFavorite(item.id)}
                        className="p-1 text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
                        title={item.isFavorite ? "Unpin from favorites" : "Pin to favorites"}
                      >
                        <Star
                          className={`size-3.5 ${
                            item.isFavorite ? "text-amber-400 fill-amber-400" : ""
                          }`}
                        />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground cursor-pointer"
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(item)}
                              className="cursor-pointer"
                            >
                              <Edit2 className="size-3 mr-1.5" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleCopyUrl(item.id, item.url)}
                            className="cursor-pointer"
                          >
                            <Copy className="size-3 mr-1.5" />
                            <span>Copy URL</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cursor-pointer flex items-center"
                            >
                              <ExternalLink className="size-3 mr-1.5" />
                              <span>Visit Site</span>
                            </a>
                          </DropdownMenuItem>

                          {linkedCred && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/app/workspace/${activeWorkspace?.id}/passwords`)
                              }
                              className="cursor-pointer"
                            >
                              <KeyRound className="size-3 mr-1.5 text-primary" />
                              <span>View Password</span>
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingId(item.id)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3 mr-1.5" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* URL */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors block truncate font-mono"
                    title={item.url}
                  >
                    {item.url}
                  </a>

                  {/* Description / Notes */}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Linked credential indicator */}
                  {linkedCred && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/workspace/${activeWorkspace?.id}/passwords`)
                      }
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer w-fit pt-0.5"
                      title="Jump to workspace credential"
                    >
                      <KeyRound className="size-3" />
                      <span className="font-medium">Credential linked</span>
                      {strength && (
                        <span className={`text-[9px] font-medium ${strength.color}`}>
                          ({strength.label})
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {item.category && (() => {
                      const catName = item.category;
                      const catObj = workspaceCategories.find(
                        (c) => c.name.toLowerCase() === catName.toLowerCase()
                      );
                      const pathStr = formatCategoryPath(catName, workspaceCategories);
                      return (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 bg-background border-border-subtle gap-1 inline-flex items-center"
                          title={`Category: ${pathStr}`}
                        >
                          {catObj && (
                            <span
                              className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: catObj.color }}
                            />
                          )}
                          <span className="truncate max-w-[130px]">{pathStr}</span>
                        </Badge>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUrl(item.id, item.url)}
                      className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3 text-success" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-xs font-medium cursor-pointer"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Workspace Bookmark Modal */}
      <WorkspaceBookmarkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBookmark(null);
        }}
        onSave={(bm) => {
          saveWorkspaceBookmark(bm);
        }}
        initialBookmark={editingBookmark}
        categories={workspaceCategories}
        defaultCategoryId={selectedWorkspaceCategory || undefined}
        workspaceName={activeWorkspace?.name}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!deletingId}
        title="Delete Workspace Bookmark"
        message="Are you sure you want to delete this shared bookmark? It will be permanently removed for all members of this workspace."
        confirmText="Delete Bookmark"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}

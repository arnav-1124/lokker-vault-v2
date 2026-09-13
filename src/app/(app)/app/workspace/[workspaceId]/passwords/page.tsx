"use client";

import * as React from "react";
import {
  KeyRound,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Star,
  MoreVertical,
  Filter,
  ChevronDown,
  CornerDownRight,
  CreditCard,
  FileText,
  User,
  Bookmark as BookmarkIcon,
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
import { WorkspacePasswordModal } from "@/components/workspace/workspace-password-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";

export default function WorkspacePasswordsPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    workspacePasswords,
    workspaceBookmarks,
    workspaceCategories,
    selectedWorkspaceCategory,
    setSelectedWorkspaceCategory,
    saveWorkspacePassword,
    deleteWorkspacePassword,
    toggleWorkspacePasswordFavorite,
    isAdmin,
  } = useWorkspace();

  const [search, setSearch] = React.useState("");
  const [revealedIds, setRevealedIds] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<PasswordEntry | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const categoryTree = React.useMemo(
    () => buildCategoryTree(workspaceCategories),
    [workspaceCategories]
  );

  const familyNames = React.useMemo(() => {
    if (!selectedWorkspaceCategory) return null;
    return getCategoryFamilyNames(selectedWorkspaceCategory, workspaceCategories);
  }, [selectedWorkspaceCategory, workspaceCategories]);

  const filteredPasswords = React.useMemo(() => {
    return workspacePasswords.filter((p) => {
      const matchesCategory =
        !familyNames || familyNames.has(p.category.toLowerCase());
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.websiteName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [workspacePasswords, familyNames, search]);

  const normalizeHost = (str: string) => {
    if (!str) return "";
    try {
      const raw = str.startsWith("http") ? str : `https://${str}`;
      return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return str.trim().toLowerCase();
    }
  };

  const getLinkedBookmark = React.useCallback(
    (p: PasswordEntry): Bookmark | undefined => {
      if (!p.websiteUrl && !p.websiteName) return undefined;
      const host = normalizeHost(p.websiteUrl || p.websiteName);
      return workspaceBookmarks.find((b) => normalizeHost(b.url || b.title) === host);
    },
    [workspaceBookmarks]
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteWorkspacePassword(deletingId);
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
    if (!selectedWorkspaceCategory) return workspacePasswords.length;
    return workspacePasswords.filter(
      (p) => familyNames?.has(p.category.toLowerCase())
    ).length;
  }, [selectedWorkspaceCategory, workspacePasswords, familyNames]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <span>Workspace Passwords</span>
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {filteredPasswords.length}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Credentials securely shared across members of {activeWorkspace?.name || "this workspace"}.
          </p>
        </div>

        {isAdmin ? (
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Add Password</span>
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
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace passwords by name, URL, user, or notes..."
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
                      ({workspacePasswords.length})
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
                {workspacePasswords.length}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {categoryTree.map((item) => {
              const count = workspacePasswords.filter(
                (p) => p.category.toLowerCase() === item.category.name.toLowerCase()
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

      {/* Passwords List */}
      {filteredPasswords.length === 0 ? (
        <div className="p-12 text-center border border-border-subtle rounded-xl bg-surface/40 space-y-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <KeyRound className="size-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No workspace passwords found</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            {search
              ? `No passwords match "${search}".`
              : selectedWorkspaceCategory
              ? `No credentials found in category "${selectedWorkspaceCategory}".`
              : "Add shared passwords to this workspace so your team can securely access services."}
          </p>
          {isAdmin ? (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
            >
              <Plus className="size-3.5" />
              <span>Add First Password</span>
            </Button>
          ) : (
            <p className="text-[11px] text-muted-foreground/80 italic">
              Shared credentials added by workspace admins will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPasswords.map((item) => {
            const isRevealed = !!revealedIds[item.id];
            const isCopied = copiedId === item.id;
            const strength = item.password ? calculatePasswordStrength(item.password) : null;
            const strengthBarColor = strength
              ? strength.score <= 40
                ? "bg-destructive"
                : strength.score <= 60
                ? "bg-warning"
                : strength.score <= 80
                ? "bg-success"
                : "bg-primary"
              : "";
            const linkedBm = getLinkedBookmark(item);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border-subtle bg-surface p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors relative"
              >
                {/* Password strength indicator bar */}
                {strength && item.password && (
                  <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-surface-elevated">
                    <div
                      className={`h-full rounded-full transition-all ${strengthBarColor}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                )}

                {/* Left: Icon, Service Name, Username */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                    {item.entryType === "card" ? (
                      <CreditCard className="size-4 text-primary" />
                    ) : item.entryType === "note" ? (
                      <FileText className="size-4 text-primary" />
                    ) : item.entryType === "identity" ? (
                      <User className="size-4 text-primary" />
                    ) : (
                      item.websiteName[0]?.toUpperCase() || "P"
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {item.websiteName}
                      </span>

                      {/* Category badge */}
                      {item.category && (() => {
                        const catObj = workspaceCategories.find(
                          (c) => c.name.toLowerCase() === item.category.toLowerCase()
                        );
                        const pathStr = formatCategoryPath(item.category, workspaceCategories);
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

                      {item.isFavorite && (
                        <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {item.username || (item.entryType === "note" ? "Secure Note" : "No username")}
                    </p>
                  </div>
                </div>

                {/* Right: Password display & actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/40 shrink-0">
                  {item.password && (
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border-subtle max-w-[180px] sm:max-w-none">
                      <span className="font-mono text-xs text-foreground truncate select-all">
                        {isRevealed ? item.password : "••••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleReveal(item.id)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer shrink-0"
                        aria-label={isRevealed ? "Hide Password" : "Show Password"}
                      >
                        {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      {strength && (
                        <span
                          className={`hidden xs:inline text-[9px] font-medium px-1 py-0.5 rounded ${strength.color} shrink-0`}
                        >
                          {strength.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Copy Password Button */}
                    {item.password && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(item.id, item.password)}
                        className="h-7 text-xs gap-1 px-2.5 cursor-pointer"
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
                    )}

                    {/* Website Redirect Button (Opens in New Tab) */}
                    {item.websiteUrl && (
                      <a
                        href={
                          item.websiteUrl.startsWith("http://") ||
                          item.websiteUrl.startsWith("https://")
                            ? item.websiteUrl
                            : `https://${item.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${item.websiteUrl}`}
                        className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border-subtle/60"
                      >
                        <ExternalLink className="size-3.5" />
                        <span className="sr-only">Visit Website</span>
                      </a>
                    )}

                    {/* Dropdown Menu for options */}
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
                      <DropdownMenuContent align="end" className="w-40">
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
                          onClick={() => toggleWorkspacePasswordFavorite(item.id)}
                          className="cursor-pointer"
                        >
                          <Star className="size-3 mr-1.5" />
                          <span>{item.isFavorite ? "Unfavorite" : "Favorite"}</span>
                        </DropdownMenuItem>

                        {item.username && (
                          <DropdownMenuItem
                            onClick={() => handleCopy(item.id + "-user", item.username)}
                            className="cursor-pointer"
                          >
                            <Copy className="size-3 mr-1.5" />
                            <span>Copy Username</span>
                          </DropdownMenuItem>
                        )}

                        {item.websiteUrl && (
                          <DropdownMenuItem asChild>
                            <a
                              href={
                                item.websiteUrl.startsWith("http://") ||
                                item.websiteUrl.startsWith("https://")
                                  ? item.websiteUrl
                                  : `https://${item.websiteUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cursor-pointer flex items-center"
                            >
                              <ExternalLink className="size-3 mr-1.5" />
                              <span>Open Website</span>
                            </a>
                          </DropdownMenuItem>
                        )}

                        {linkedBm && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/app/workspace/${activeWorkspace?.id}/bookmarks`)
                            }
                            className="cursor-pointer"
                          >
                            <BookmarkIcon className="size-3 mr-1.5 text-primary" />
                            <span>Linked Bookmark</span>
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Workspace Password Modal */}
      <WorkspacePasswordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={(entry) => {
          saveWorkspacePassword(entry);
        }}
        initialEntry={editingEntry}
        categories={workspaceCategories}
        defaultCategoryId={selectedWorkspaceCategory || undefined}
        workspaceName={activeWorkspace?.name}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!deletingId}
        title="Delete Workspace Password"
        message="Are you sure you want to delete this shared password? It will be permanently removed for all members of this workspace."
        confirmText="Delete Password"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}

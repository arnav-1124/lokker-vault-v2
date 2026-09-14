"use client";

import * as React from "react";
import {
  Star,
  Search,
  KeyRound,
  Bookmark as BookmarkIcon,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MoreVertical,
  Edit2,
  ShieldAlert,
  Link2,
  FolderInput,
  CreditCard,
  FileText,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Bookmark, PasswordEntry } from "@/types";
import { useWorkspace } from "@/context/workspace-context";
import { calculatePasswordStrength, checkPasswordBreached } from "@/lib/crypto";
import { buildCategoryTree, formatCategoryPath } from "@/lib/category-tree";
import { BreachBadge } from "@/components/ui/breach-badge";
import { breachCache } from "@/hooks/use-breach-check";
import { TotpCountdownPill } from "@/components/ui/totp-countdown-pill";
import { ShareSecretModal } from "@/components/modals/share-secret-modal";
import { WorkspacePasswordModal } from "@/components/workspace/workspace-password-modal";
import { WorkspaceBookmarkModal } from "@/components/workspace/workspace-bookmark-modal";

export default function WorkspaceFavoritesPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    workspacePasswords,
    workspaceBookmarks,
    workspaceCategories,
    toggleWorkspacePasswordFavorite,
    toggleWorkspaceBookmarkFavorite,
    saveWorkspacePassword,
    saveWorkspaceBookmark,
    isAdmin,
    canWrite,
  } = useWorkspace();

  const [search, setSearch] = React.useState("");
  const [revealedIds, setRevealedIds] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [rowBreachStatus, setRowBreachStatus] = React.useState<
    Record<string, { status: "checking" | "breached" | "clean" | "error"; count: number }>
  >({});
  const [sharingEntry, setSharingEntry] = React.useState<PasswordEntry | null>(null);

  // Modals for admin editing
  const [editingPassword, setEditingPassword] = React.useState<PasswordEntry | null>(null);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);

  const handleCheckBreach = React.useCallback(async (id: string, pwd?: string) => {
    if (!pwd) return;
    setRowBreachStatus((prev) => ({ ...prev, [id]: { status: "checking", count: 0 } }));
    try {
      const res = await checkPasswordBreached(pwd);
      breachCache.set(pwd, res);
      setRowBreachStatus((prev) => ({
        ...prev,
        [id]: {
          status: res.error ? "error" : res.breached ? "breached" : "clean",
          count: res.count,
        },
      }));
    } catch {
      setRowBreachStatus((prev) => ({ ...prev, [id]: { status: "error", count: 0 } }));
    }
  }, []);

  const toggleReveal = (id: string, pwd?: string) => {
    setRevealedIds((prev) => {
      const willReveal = !prev[id];
      if (willReveal && pwd && !rowBreachStatus[id] && !breachCache.get(pwd)) {
        handleCheckBreach(id, pwd);
      }
      return { ...prev, [id]: willReveal };
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter pinned favorites
  const q = search.toLowerCase().trim();

  const favoritePasswords = React.useMemo(() => {
    return workspacePasswords
      .filter((p) => p.isFavorite)
      .filter((p) => {
        if (!q) return true;
        return (
          p.websiteName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      });
  }, [workspacePasswords, q]);

  const favoriteBookmarks = React.useMemo(() => {
    return workspaceBookmarks
      .filter((b) => b.isFavorite)
      .filter((b) => {
        if (!q) return true;
        return (
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.category && b.category.toLowerCase().includes(q))
        );
      });
  }, [workspaceBookmarks, q]);

  const totalFavoritesCount = favoritePasswords.length + favoriteBookmarks.length;
  const hasAnyFavorites = workspacePasswords.some((p) => p.isFavorite) || workspaceBookmarks.some((b) => b.isFavorite);
  const basePath = activeWorkspace ? `/app/workspace/${activeWorkspace.id}` : "";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 shrink-0">
            <Star className="size-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Workspace Favorites</h2>
              {totalFavoritesCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-amber-400/10 border-amber-400/30 text-amber-500 font-mono text-[10px] px-1.5 py-0"
                >
                  {totalFavoritesCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Your personal pinned workspace credentials and bookmarks. Private to your account.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {hasAnyFavorites && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favorites..."
              className="pl-8 h-8 text-xs bg-surface border-border-subtle"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {!hasAnyFavorites ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border-subtle bg-surface/40 p-8 space-y-4">
          <div className="size-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center mx-auto">
            <Star className="size-6 text-amber-400/70" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-foreground">No Pinned Favorites Yet</h3>
            <p className="text-xs text-muted-foreground">
              You haven&apos;t pinned any credentials or bookmarks in this workspace. Star any item to keep it accessible here. Your favorites are distinct from other members.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href={`${basePath}/passwords`}>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer">
                <KeyRound className="size-3.5 text-primary" />
                <span>Browse Passwords</span>
              </Button>
            </Link>
            <Link href={`${basePath}/bookmarks`}>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer">
                <BookmarkIcon className="size-3.5 text-primary" />
                <span>Browse Bookmarks</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : totalFavoritesCount === 0 && search ? (
        <div className="py-12 text-center rounded-xl border border-border-subtle bg-surface/30 p-6 space-y-2">
          <Search className="size-8 text-muted-foreground mx-auto opacity-40" />
          <h3 className="text-sm font-semibold text-foreground">No matching favorites</h3>
          <p className="text-xs text-muted-foreground">
            No pinned favorites matched &quot;{search}&quot;.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch("")}
            className="text-xs text-primary cursor-pointer mt-1"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned Passwords Section */}
          {favoritePasswords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pinned Passwords ({favoritePasswords.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {favoritePasswords.map((item) => {
                  const isRevealed = !!revealedIds[item.id];
                  const isCopied = copiedId === item.id;
                  const strength = item.password ? calculatePasswordStrength(item.password) : null;
                  const cachedBreach = item.password ? breachCache.get(item.password) : null;
                  const breachInfo =
                    rowBreachStatus[item.id] ||
                    (cachedBreach
                      ? {
                          status: cachedBreach.error
                            ? ("error" as const)
                            : cachedBreach.breached
                            ? ("breached" as const)
                            : ("clean" as const),
                          count: cachedBreach.count,
                        }
                      : null);
                  const strengthBarColor = strength
                    ? strength.score <= 40
                      ? "bg-destructive"
                      : strength.score <= 60
                      ? "bg-warning"
                      : strength.score <= 80
                      ? "bg-success"
                      : "bg-primary"
                    : "";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border-subtle bg-surface p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors relative"
                    >
                      {/* Strength bar */}
                      {strength && item.password && (
                        <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-surface-elevated">
                          <div
                            className={`h-full rounded-full transition-all ${strengthBarColor}`}
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                      )}

                      {/* Left: Icon & Service */}
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
                            {item.category && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 bg-background border-border-subtle gap-1 inline-flex items-center"
                                title={`Category: ${formatCategoryPath(item.category, workspaceCategories)}`}
                              >
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.username ? (
                              <span className="truncate max-w-[200px]">{item.username}</span>
                            ) : (
                              <span className="italic opacity-60">No username</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/40 shrink-0">
                        {item.password && (
                          <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border-subtle max-w-[240px] sm:max-w-none">
                            <span className="font-mono text-xs text-foreground truncate select-all">
                              {isRevealed ? item.password : "••••••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleReveal(item.id, item.password)}
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
                            {breachInfo && (
                              <BreachBadge compact status={breachInfo.status} count={breachInfo.count} />
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.totpSecret && (
                            <TotpCountdownPill
                              secret={item.totpSecret}
                              onCopy={() => handleCopy(item.id + "-totp", "")}
                            />
                          )}

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

                          {item.websiteUrl && (
                            <a
                              href={
                                item.websiteUrl.startsWith("http://") || item.websiteUrl.startsWith("https://")
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

                          {/* Unpin Favorite Button */}
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => toggleWorkspacePasswordFavorite(item.id)}
                              className="p-1.5 text-amber-500 hover:text-muted-foreground transition-colors cursor-pointer rounded-md hover:bg-surface-elevated border border-border-subtle/60"
                              title="Unpin from favorites"
                            >
                              <Star className="size-3.5 fill-amber-400" />
                            </button>
                          )}

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
                            <DropdownMenuContent align="end" className="w-48">
                              {canWrite && (
                                <DropdownMenuItem
                                  onClick={() => setEditingPassword(item)}
                                  className="cursor-pointer"
                                >
                                  <Edit2 className="size-3 mr-1.5" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                              )}

                              {item.password && (
                                <DropdownMenuItem
                                  onClick={() => handleCheckBreach(item.id, item.password)}
                                  className="cursor-pointer"
                                >
                                  <ShieldAlert className="size-3 mr-1.5 text-primary" />
                                  <span>Check Breach Status</span>
                                </DropdownMenuItem>
                              )}

                              {item.password && (
                                <DropdownMenuItem
                                  onClick={() => setSharingEntry(item)}
                                  className="cursor-pointer"
                                >
                                  <Link2 className="size-3 mr-1.5 text-primary" />
                                  <span>Share Expiring Link</span>
                                </DropdownMenuItem>
                              )}

                              {canWrite && (
                                <DropdownMenuItem
                                  onClick={() => toggleWorkspacePasswordFavorite(item.id)}
                                  className="cursor-pointer"
                                >
                                  <Star className="size-3 mr-1.5" />
                                  <span>Unfavorite</span>
                                </DropdownMenuItem>
                              )}

                              {canWrite && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="cursor-pointer">
                                    <FolderInput className="size-3 mr-1.5 text-primary" />
                                    <span>Move to Category</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-44 max-h-56 overflow-y-auto lokker-scrollbar">
                                    {workspaceCategories.map((cat) => (
                                      <DropdownMenuItem
                                        key={cat.id}
                                        disabled={item.category === cat.name}
                                        onClick={() =>
                                          saveWorkspacePassword({ ...item, category: cat.name })
                                        }
                                        className="cursor-pointer text-xs"
                                      >
                                        <span className="truncate">{cat.name}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pinned Bookmarks Section */}
          {favoriteBookmarks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="size-4 text-primary" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pinned Bookmarks ({favoriteBookmarks.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteBookmarks.map((item) => (
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
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => toggleWorkspaceBookmarkFavorite(item.id)}
                              className="p-1 text-amber-500 hover:text-muted-foreground transition-colors cursor-pointer"
                              title="Unpin from favorites"
                            >
                              <Star className="size-3.5 fill-amber-400" />
                            </button>
                          )}

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
                              {canWrite && (
                                <DropdownMenuItem
                                  onClick={() => setEditingBookmark(item)}
                                  className="cursor-pointer"
                                >
                                  <Edit2 className="size-3 mr-1.5" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleCopy(item.id + "-url", item.url)}
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

                              {canWrite && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="cursor-pointer">
                                    <FolderInput className="size-3 mr-1.5 text-primary" />
                                    <span>Move to Category</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-44 max-h-56 overflow-y-auto lokker-scrollbar">
                                    {workspaceCategories.map((cat) => (
                                      <DropdownMenuItem
                                        key={cat.id}
                                        disabled={item.category === cat.name}
                                        onClick={() =>
                                          saveWorkspaceBookmark({ ...item, category: cat.name })
                                        }
                                        className="cursor-pointer text-xs"
                                      >
                                        <span className="truncate">{cat.name}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border-subtle/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[160px]">{item.url}</span>
                      {item.category && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1 bg-background border-border-subtle"
                        >
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Expiring Secret Modal */}
      {sharingEntry && (
        <ShareSecretModal
          isOpen={!!sharingEntry}
          onClose={() => setSharingEntry(null)}
          initialTitle={sharingEntry.websiteName}
          initialSecret={sharingEntry.password || ""}
        />
      )}

      {/* Admin Edit Modals */}
      {editingPassword && (
        <WorkspacePasswordModal
          isOpen={!!editingPassword}
          onClose={() => setEditingPassword(null)}
          initialEntry={editingPassword}
          categories={workspaceCategories}
          onSave={saveWorkspacePassword}
        />
      )}

      {editingBookmark && (
        <WorkspaceBookmarkModal
          isOpen={!!editingBookmark}
          onClose={() => setEditingBookmark(null)}
          initialBookmark={editingBookmark}
          categories={workspaceCategories}
          onSave={saveWorkspaceBookmark}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Star,
  MoreVertical,
  ExternalLink,
  Plus,
  Lock,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
  User,
  Bookmark as BookmarkIcon,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Category, PasswordEntry } from "@/types";
import { calculatePasswordStrength } from "@/lib/crypto";

interface PasswordListViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  onUnlockVaultClick: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
  onOpenAddModal: () => void;
  categories: Category[];
  bookmarks?: Bookmark[];
  onNavigateBookmark?: (bm: Bookmark) => void;
}

export function PasswordListView({
  passwords,
  isUnlocked,
  selectedCategory,
  searchQuery,
  onUnlockVaultClick,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopyText,
  onOpenAddModal,
  categories,
  bookmarks = [],
  onNavigateBookmark,
}: PasswordListViewProps) {
  const [revealedIds, setRevealedIds] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPasswords = React.useMemo(() => {
    return passwords.filter((p) => {
      const matchesCategory =
        !selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.websiteName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [passwords, selectedCategory, searchQuery]);

  // Helper: find linked bookmark for a credential by hostname
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
      return bookmarks.find((b) => normalizeHost(b.url || b.title) === host);
    },
    [bookmarks]
  );

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Lock className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Password Vault is Locked</h2>
          <p className="text-xs text-muted-foreground">
            Unlock with your master password or emergency recovery key to view credentials.
          </p>
        </div>
        <Button onClick={onUnlockVaultClick} size="sm" className="h-9 px-6 text-xs font-medium cursor-pointer">
          Unlock Vault
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>{selectedCategory ? `${selectedCategory} Credentials` : "All Credentials"}</span>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredPasswords.length}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Local zero-knowledge vault • AES-GCM 256-bit encrypted payload
          </p>
        </div>

        <Button onClick={onOpenAddModal} size="sm" className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer">
          <Plus className="size-3.5" />
          <span>Add Password</span>
        </Button>
      </div>

      {/* Password list */}
      {filteredPasswords.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-3">
          <div className="size-10 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center mx-auto">
            <KeyRound className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No credentials found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No passwords match "${searchQuery}".`
                : "Your password vault is empty. Add your first login or import from browser."}
            </p>
          </div>
          <Button onClick={onOpenAddModal} size="sm" variant="outline" className="text-xs cursor-pointer">
            Add New Entry
          </Button>
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
                {/* Left: Icon, Title, Username */}
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
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.websiteName}
                      </span>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-background border-border-subtle">
                          {item.category}
                        </Badge>
                      )}
                      {item.isFavorite && (
                        <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {item.username || (item.entryType === "note" ? "Secure Note" : "No username")}
                    </p>
                  </div>
                </div>

                {/* Right: Masked Password, Quick Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.password && (
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border-subtle">
                      <span className="font-mono text-xs text-foreground select-all">
                        {isRevealed ? item.password : "••••••••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleReveal(item.id)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                        aria-label={isRevealed ? "Hide Password" : "Show Password"}
                      >
                        {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      {strength && (
                        <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${strength.color}`}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Copy Button */}
                  {item.password && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.id, item.password, "Password")}
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

                  {/* Website link */}
                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open site"
                      className="p-1.5 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}

                  {/* Dropdown Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs" className="text-muted-foreground cursor-pointer">
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                        <Edit2 className="size-3 mr-1.5" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleFavorite(item.id)} className="cursor-pointer">
                        <Star className="size-3 mr-1.5" />
                        <span>{item.isFavorite ? "Unfavorite" : "Favorite"}</span>
                      </DropdownMenuItem>
                      {item.username && (
                        <DropdownMenuItem onClick={() => onCopyText(item.username, "Username")} className="cursor-pointer">
                          <Copy className="size-3 mr-1.5" />
                          <span>Copy Username</span>
                        </DropdownMenuItem>
                      )}
                      {(() => {
                        const linkedBm = getLinkedBookmark(item);
                        if (linkedBm) {
                          return (
                            <DropdownMenuItem
                              onClick={() => onNavigateBookmark?.(linkedBm)}
                              className="cursor-pointer"
                            >
                              <BookmarkIcon className="size-3 mr-1.5" />
                              <span>Linked Bookmark</span>
                            </DropdownMenuItem>
                          );
                        }
                        return null;
                      })()}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(item.id)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3 mr-1.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

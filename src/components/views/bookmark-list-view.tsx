"use client";

import * as React from "react";
import {
  Bookmark as BookmarkIcon,
  Star,
  ExternalLink,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  Globe,
  KeyRound,
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

interface BookmarkListViewProps {
  bookmarks: Bookmark[];
  selectedCategory: string | null;
  searchQuery: string;
  onToggleFavorite: (id: string) => void;
  onEdit: (bm: Bookmark) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  categories: Category[];
  passwords?: PasswordEntry[];
  onNavigateCredential?: (p: PasswordEntry) => void;
}

export function BookmarkListView({
  bookmarks,
  selectedCategory,
  searchQuery,
  onToggleFavorite,
  onEdit,
  onDelete,
  onOpenAddModal,
  passwords = [],
  onNavigateCredential,
}: BookmarkListViewProps) {
  // Helper: find linked credential for a bookmark by hostname
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
      return passwords.find((p) => normalizeHost(p.websiteUrl || p.websiteName) === host);
    },
    [passwords]
  );

  const filteredBookmarks = React.useMemo(() => {
    return bookmarks.filter((b) => {
      const matchesCategory =
        !selectedCategory ||
        (b.category && b.category.toLowerCase() === selectedCategory.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [bookmarks, selectedCategory, searchQuery]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>{selectedCategory ? `${selectedCategory} Bookmarks` : "All Bookmarks"}</span>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredBookmarks.length}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Organized site hub • Bidirectional credential sync
          </p>
        </div>

        <Button onClick={onOpenAddModal} size="sm" className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer">
          <Plus className="size-3.5" />
          <span>Add Bookmark</span>
        </Button>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-3">
          <div className="size-10 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center mx-auto">
            <Globe className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No bookmarks found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No bookmarks match "${searchQuery}".`
                : "Save website shortcuts and manage them directly alongside credentials."}
            </p>
          </div>
          <Button onClick={onOpenAddModal} size="sm" variant="outline" className="text-xs cursor-pointer">
            Add First Bookmark
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="rounded-xl border border-border-subtle bg-surface p-4 flex flex-col justify-between gap-3 hover:border-border-strong transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                      {bm.title[0]?.toUpperCase() || "B"}
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {bm.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(bm.id)}
                      className="p-1 text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
                      aria-label="Toggle Favorite"
                    >
                      <Star
                        className={`size-3.5 ${
                          bm.isFavorite ? "text-amber-400 fill-amber-400" : ""
                        }`}
                      />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                          <MoreVertical className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => onEdit(bm)} className="cursor-pointer">
                          <Edit2 className="size-3 mr-1.5" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(bm.id)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="size-3 mr-1.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-mono truncate">
                  {bm.url}
                </p>

                {bm.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {bm.description}
                  </p>
                )}

                {/* Linked credential indicator */}
                {(() => {
                  const linked = getLinkedCredential(bm);
                  if (!linked) return null;
                  const hasPwd = !!linked.password;
                  const strength = hasPwd ? calculatePasswordStrength(linked.password) : null;
                  return (
                    <button
                      type="button"
                      onClick={() => onNavigateCredential?.(linked)}
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer w-fit"
                      title="Open linked credential"
                    >
                      <KeyRound className="size-3" />
                      <span className="font-medium">
                        {hasPwd ? "Credential linked" : "Credential shell \u2014 no password"}
                      </span>
                      {strength && (
                        <span className={`text-[9px] font-medium ${strength.color}`}>
                          {strength.label}
                        </span>
                      )}
                    </button>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                <Badge variant="outline" className="text-[10px] bg-background border-border-subtle">
                  {bm.category || "General"}
                </Badge>
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-xs font-medium cursor-pointer"
                >
                  <span>Visit Site</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

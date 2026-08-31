"use client";

import * as React from "react";
import {
  Search,
  KeyRound,
  Bookmark as BookmarkIcon,
  Copy,
  ExternalLink,
  Globe,
  QrCode,
  Activity,
  Sparkles,
  Database,
  FolderLock,
  Mail,
  Settings as SettingsIcon,
  Lock,
  Plus,
  ShieldCheck,
  Tag,
  Star,
  Command,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, PasswordEntry, ViewMode } from "@/types";

export interface CommandPaletteAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  category: string;
  onSelect: () => void;
}

interface SearchResult {
  id: string;
  type: "password" | "bookmark" | "totp" | "category" | "action";
  label: string;
  sublabel: string;
  icon: React.ElementType;
  category: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  passwords: PasswordEntry[];
  categories: { name: string; id: string }[];
  isUnlocked: boolean;
  onCopyText: (text: string, label: string) => void;
  onNavigate: (view: ViewMode) => void;
  onOpenAddPassword?: () => void;
  onOpenAddBookmark?: () => void;
  onLockVault?: () => void;
  onSelectPassword?: (pwd: PasswordEntry) => void;
  onSelectBookmark?: (bm: Bookmark) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  bookmarks,
  passwords,
  categories,
  isUnlocked,
  onCopyText,
  onNavigate,
  onOpenAddPassword,
  onOpenAddBookmark,
  onLockVault,
  onSelectPassword,
  onSelectBookmark,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Build action items
  const actions = React.useMemo((): CommandPaletteAction[] => {
    const items: CommandPaletteAction[] = [
      {
        id: "nav-home",
        label: "Go to Dashboard",
        icon: ShieldCheck,
        category: "Navigation",
        onSelect: () => onNavigate("home"),
      },
      {
        id: "nav-passwords",
        label: "Go to Password Vault",
        icon: KeyRound,
        category: "Navigation",
        onSelect: () => onNavigate("passwords"),
      },
      {
        id: "nav-bookmarks",
        label: "Go to Bookmarks",
        icon: BookmarkIcon,
        category: "Navigation",
        onSelect: () => onNavigate("bookmarks"),
      },
      {
        id: "nav-totp",
        label: "Open 2FA Authenticator",
        icon: QrCode,
        category: "Navigation",
        onSelect: () => onNavigate("totp"),
      },
      {
        id: "nav-security",
        label: "Open Security Health",
        icon: Activity,
        category: "Navigation",
        onSelect: () => onNavigate("security-audit"),
      },
      {
        id: "nav-generator",
        label: "Generate Password",
        icon: Sparkles,
        category: "Actions",
        onSelect: () => onNavigate("generator"),
      },
      {
        id: "nav-import",
        label: "Open Import / Export",
        icon: Database,
        category: "Navigation",
        onSelect: () => onNavigate("import-export"),
      },
      {
        id: "nav-files",
        label: "Open File Vault",
        icon: FolderLock,
        category: "Navigation",
        onSelect: () => onNavigate("files"),
      },
      {
        id: "nav-emails",
        label: "Open Masked Emails",
        icon: Mail,
        category: "Navigation",
        onSelect: () => onNavigate("masked-emails"),
      },
      {
        id: "nav-settings",
        label: "Open Settings",
        icon: SettingsIcon,
        category: "Navigation",
        onSelect: () => onNavigate("settings"),
      },
    ];

    if (isUnlocked && onOpenAddPassword) {
      items.push({
        id: "add-password",
        label: "Add Password",
        icon: Plus,
        shortcut: "N",
        category: "Actions",
        onSelect: onOpenAddPassword,
      });
    }

    if (onOpenAddBookmark) {
      items.push({
        id: "add-bookmark",
        label: "Add Bookmark",
        icon: Plus,
        category: "Actions",
        onSelect: onOpenAddBookmark,
      });
    }

    if (isUnlocked && onLockVault) {
      items.push({
        id: "lock-vault",
        label: "Lock Vault",
        icon: Lock,
        category: "Actions",
        onSelect: onLockVault,
      });
    }

    return items;
  }, [isUnlocked, onNavigate, onOpenAddPassword, onOpenAddBookmark, onLockVault]);

  // Search results: filter passwords, bookmarks, TOTP, categories, actions
  const results = React.useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    if (q) {
      // Search credentials (metadata only — never expose passwords)
      if (isUnlocked) {
        for (const p of passwords) {
          if (
            p.websiteName.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
          ) {
            items.push({
              id: `pwd-${p.id}`,
              type: "password",
              label: p.websiteName,
              sublabel: p.username || "No username",
              icon: KeyRound,
              category: "Passwords",
              onSelect: () => {
                if (onSelectPassword) onSelectPassword(p);
                onClose();
              },
            });
          }
        }
      }

      // Search bookmarks
      for (const b of bookmarks) {
        if (
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
        ) {
          items.push({
            id: `bm-${b.id}`,
            type: "bookmark",
            label: b.title,
            sublabel: b.url,
            icon: BookmarkIcon,
            category: "Bookmarks",
            onSelect: () => {
              if (onSelectBookmark) onSelectBookmark(b);
              onClose();
            },
          });
        }
      }

      // Search TOTP entries
      if (isUnlocked) {
        for (const p of passwords) {
          if (!p.totpSecret) continue;
          if (
            p.websiteName.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q))
          ) {
            // Avoid duplicates if already listed as password
            if (!items.some((i) => i.id === `pwd-${p.id}`)) {
              items.push({
                id: `totp-${p.id}`,
                type: "totp",
                label: p.websiteName,
                sublabel: p.username || "2FA account",
                icon: QrCode,
                category: "2FA",
                onSelect: () => {
                  onNavigate("totp");
                  onClose();
                },
              });
            }
          }
        }
      }

      // Search categories
      for (const cat of categories) {
        if (cat.name.toLowerCase().includes(q)) {
          items.push({
            id: `cat-${cat.id}`,
            type: "category",
            label: cat.name,
            sublabel: "Category",
            icon: Tag,
            category: "Categories",
            onSelect: () => {
              onNavigate("passwords");
              onClose();
            },
          });
        }
      }

      // Filter actions by query
      for (const action of actions) {
        if (action.label.toLowerCase().includes(q)) {
          items.push({
            id: `action-${action.id}`,
            type: "action",
            label: action.label,
            sublabel: action.category,
            icon: action.icon,
            category: "Actions",
            onSelect: action.onSelect,
          });
        }
      }
    } else {
      // No query — show actions
      for (const action of actions) {
        items.push({
          id: `action-${action.id}`,
          type: "action",
          label: action.label,
          sublabel: action.category,
          icon: action.icon,
          category: action.category,
          onSelect: action.onSelect,
        });
      }
    }

    return items;
  }, [query, passwords, bookmarks, categories, isUnlocked, actions, onNavigate, onSelectPassword, onSelectBookmark, onClose]);

  // Group results by category for display
  const groupedResults = React.useMemo(() => {
    const groups: { category: string; items: SearchResult[] }[] = [];
    const seen = new Set<string>();

    for (const item of results) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({ category: item.category, items: [] });
      }
      groups.find((g) => g.category === item.category)!.items.push(item);
    }

    return groups;
  }, [results]);

  // Keep active index within bounds
  const safeActiveIndex = results.length > 0 ? Math.min(activeIndex, results.length - 1) : 0;

  // Focus input on open, and reset state
  // Using a key-based approach: we track isOpen with an effect to reset,
  // but use an intermediate ref to break the cascade.
  const isOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (isOpen !== isOpenRef.current) {
      isOpenRef.current = isOpen;
      if (isOpen) {
        // Use a microtask to defer the state reset
        queueMicrotask(() => {
          setQuery("");
          setActiveIndex(0);
        });
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [isOpen]);

  // Scroll active item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-command-index="${safeActiveIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [safeActiveIndex]);

  // Keyboard handling inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[safeActiveIndex]) {
        results[safeActiveIndex].onSelect();
      }
    }
  };

  // Global index across groups
  let flatIndex = 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-surface border-border-subtle p-0 overflow-hidden shadow-overlay" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-surface">
          <Command className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Lokker..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Search Lokker"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-background border border-border-subtle text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto lokker-scrollbar p-2 text-xs">
          {!query.trim() && results.length > 0 ? (
            <>
              {groupedResults.map((group) => (
                <div key={group.category} className="mb-2 last:mb-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {group.category}
                  </p>
                  {group.items.map((item) => {
                    const currentIndex = flatIndex++;
                    const Icon = item.icon;
                    const isActive = currentIndex === safeActiveIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-command-index={currentIndex}
                        onClick={() => item.onSelect()}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-surface-hover text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          ) : query.trim() && results.length > 0 ? (
            <>
              {groupedResults.map((group) => (
                <div key={group.category} className="mb-2 last:mb-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {group.category} ({group.items.length})
                  </p>
                  {group.items.map((item) => {
                    const currentIndex = flatIndex++;
                    const Icon = item.icon;
                    const isActive = currentIndex === safeActiveIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-command-index={currentIndex}
                        onClick={() => item.onSelect()}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-surface-hover text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-3.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.label}</p>
                            <p className="truncate text-[11px] opacity-70">{item.sublabel}</p>
                          </div>
                        </div>
                        {item.type === "bookmark" && (
                          <ExternalLink className="size-3 shrink-0 opacity-50" />
                        )}
                        {item.type === "password" && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {(() => {
                              const pwdId = item.id.replace("pwd-", "");
                              const pwd = passwords.find((p) => p.id === pwdId);
                              const hasUrl = pwd?.websiteUrl;
                              return (
                                <>
                                  {hasUrl && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(hasUrl, "_blank", "noopener,noreferrer");
                                        onClose();
                                      }}
                                      className="p-1 rounded hover:bg-surface-active text-muted-foreground hover:text-foreground cursor-pointer"
                                      aria-label="Open website"
                                      title="Open website in new tab"
                                    >
                                      <Globe className="size-3" />
                                    </button>
                                  )}
                                  {isUnlocked && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const pwdId2 = item.id.replace("pwd-", "");
                                        const pwd2 = passwords.find((p) => p.id === pwdId2);
                                        if (pwd2?.username) {
                                          onCopyText(pwd2.username, "Username");
                                        }
                                        onClose();
                                      }}
                                      className="p-1 rounded hover:bg-surface-active text-muted-foreground hover:text-foreground cursor-pointer"
                                      aria-label="Copy username"
                                    >
                                      <Copy className="size-3" />
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          ) : query.trim() && results.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="size-5 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No results found</p>
              <p className="text-[11px] mt-0.5">
                No matching items for &quot;{query}&quot;.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer with hint */}
        <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-background border border-border-subtle font-mono">&uarr;&darr;</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-background border border-border-subtle font-mono">&crarr;</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-background border border-border-subtle font-mono">esc</kbd>
            <span>Close</span>
          </span>
          {isUnlocked && (
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-background border border-border-subtle font-mono">/</kbd>
              <span>Search</span>
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

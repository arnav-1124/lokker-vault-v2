"use client";

import * as React from "react";
import {
  Keyboard,
  Search,
  Lock,
  Plus,
  KeyRound,
  Bookmark as BookmarkIcon,
  QrCode,
  Star,
  Building2,
  Settings,
  Eye,
  Copy,
  Sparkles,
  Command,
  CornerDownLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ShortcutItem {
  id: string;
  category: "Navigation" | "Vault Actions" | "Item & List";
  description: string;
  macKeys: string[];
  winKeys: string[];
  icon: React.ElementType;
}

export const SHORTCUTS_REGISTRY: ShortcutItem[] = [
  // Navigation
  {
    id: "nav-search",
    category: "Navigation",
    description: "Open Global Search & Command Palette",
    macKeys: ["⌘", "K"],
    winKeys: ["Ctrl", "K"],
    icon: Search,
  },
  {
    id: "nav-passwords",
    category: "Navigation",
    description: "Go to Password Vault",
    macKeys: ["G", "P"],
    winKeys: ["G", "P"],
    icon: KeyRound,
  },
  {
    id: "nav-bookmarks",
    category: "Navigation",
    description: "Go to Bookmarks",
    macKeys: ["G", "B"],
    winKeys: ["G", "B"],
    icon: BookmarkIcon,
  },
  {
    id: "nav-totp",
    category: "Navigation",
    description: "Go to 2FA Authenticator (TOTP)",
    macKeys: ["G", "T"],
    winKeys: ["G", "T"],
    icon: QrCode,
  },
  {
    id: "nav-favorites",
    category: "Navigation",
    description: "Go to Favorites",
    macKeys: ["G", "F"],
    winKeys: ["G", "F"],
    icon: Star,
  },
  {
    id: "nav-workspaces",
    category: "Navigation",
    description: "Go to Team Workspaces",
    macKeys: ["G", "W"],
    winKeys: ["G", "W"],
    icon: Building2,
  },
  {
    id: "nav-settings",
    category: "Navigation",
    description: "Go to Settings",
    macKeys: ["G", "S"],
    winKeys: ["G", "S"],
    icon: Settings,
  },

  // Vault Actions
  {
    id: "action-add",
    category: "Vault Actions",
    description: "Add New Item / Credential",
    macKeys: ["N"],
    winKeys: ["N"],
    icon: Plus,
  },
  {
    id: "action-lock",
    category: "Vault Actions",
    description: "Lock / Unlock Vault Immediately",
    macKeys: ["⌘", "L"],
    winKeys: ["Ctrl", "L"],
    icon: Lock,
  },
  {
    id: "action-shortcuts",
    category: "Vault Actions",
    description: "Open Keyboard Shortcuts Cheatsheet",
    macKeys: ["?"],
    winKeys: ["?"],
    icon: Keyboard,
  },
  {
    id: "action-escape",
    category: "Vault Actions",
    description: "Close Open Modal / Clear Focus",
    macKeys: ["Esc"],
    winKeys: ["Esc"],
    icon: CornerDownLeft,
  },

  // Item & List
  {
    id: "item-copy",
    category: "Item & List",
    description: "Copy Selected Password / Credential",
    macKeys: ["C"],
    winKeys: ["C"],
    icon: Copy,
  },
  {
    id: "item-reveal",
    category: "Item & List",
    description: "Toggle Password Visibility (Reveal)",
    macKeys: ["Space"],
    winKeys: ["Space"],
    icon: Eye,
  },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [filter, setFilter] = React.useState("");
  const [isMac, setIsMac] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const platform = window.navigator.platform || window.navigator.userAgent || "";
      setIsMac(/mac|iphone|ipad|ipod/i.test(platform));
    }
  }, []);

  // Filter shortcuts
  const filteredShortcuts = React.useMemo(() => {
    if (!filter.trim()) return SHORTCUTS_REGISTRY;
    const q = filter.toLowerCase().trim();
    return SHORTCUTS_REGISTRY.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.macKeys.join("").toLowerCase().includes(q) ||
        s.winKeys.join("").toLowerCase().includes(q)
    );
  }, [filter]);

  // Group by category
  const categories = ["Navigation", "Vault Actions", "Item & List"] as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-card border-border-subtle p-6 space-y-4 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Keyboard className="size-4 text-primary" />
              <span>Keyboard Shortcuts</span>
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
              {isMac ? "macOS Layout" : "Windows/Linux Layout"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative shrink-0">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Filter shortcuts (e.g. search, lock, passwords)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border-subtle"
            autoFocus
          />
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto lokker-scrollbar space-y-4 pr-1">
          {categories.map((category) => {
            const items = filteredShortcuts.filter((s) => s.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {category}
                </h3>
                <div className="rounded-xl border border-border-subtle bg-surface divide-y divide-border-subtle/50">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const keys = isMac ? item.macKeys : item.winKeys;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <Icon className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-muted/80 text-foreground border border-border shadow-2xs min-w-6 text-center"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No shortcuts found matching &ldquo;{filter}&rdquo;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="shrink-0 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">?</kbd> anywhere to open
          </span>
          <span className="text-[10px]">Lokker Power User Suite</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

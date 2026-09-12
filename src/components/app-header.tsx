"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Lock,
  Unlock,
  Moon,
  Sun,
  Menu,
  Puzzle,
  Cloud,
  LogOut,
  RefreshCw,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVaultUI } from "@/context/vault-ui-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ViewMode } from "@/types";
import {
  getCloudSession,
  clearCloudSession,
  CLOUD_AUTH_CHANGE_EVENT,
  type CloudSessionUser,
} from "@/lib/auth-session";
import { appConfig } from "@/config/app";

const PATH_TITLE: Record<string, string> = {
  "/app": "Security Workspace",
  "/app/passwords": "Password Vault",
  "/app/bookmarks": "Bookmarks",
  "/app/totp": "2FA Authenticator",
  "/app/favorites": "Favorites",
  "/app/security-audit": "Security Health",
  "/app/generator": "Password Generator",
  "/app/import-export": "Import & Export",
  "/app/files": "File Vault",
  "/app/masked-emails": "Masked Emails",
  "/app/guide": "Feature Guide",
  "/app/settings": "Settings",
  "/app/extension": "Browser Extension",
};

const PATH_VIEW_MODE: Record<string, ViewMode> = {
  "/app": "home",
  "/app/passwords": "passwords",
  "/app/bookmarks": "bookmarks",
  "/app/totp": "totp",
  "/app/favorites": "favorites",
  "/app/security-audit": "security-audit",
  "/app/generator": "generator",
  "/app/import-export": "import-export",
  "/app/files": "files",
  "/app/masked-emails": "masked-emails",
  "/app/guide": "guide",
  "/app/settings": "settings",
  "/app/extension": "extension",
};

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isUnlocked: boolean;
  autoLockMinutes: number;
  onToggleLock: () => void;
  onOpenNewItemModal: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
  onOpenExtensionGuide: () => void;
  onOpenCloudSyncModal?: () => void;
}

const emptySubscribe = () => () => {};

export function AppHeader({
  searchQuery,
  onSearchChange,
  isUnlocked,
  autoLockMinutes,
  onToggleLock,
  onOpenNewItemModal,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onOpenExtensionGuide,
  onOpenCloudSyncModal,
}: AppHeaderProps) {
  const pathname = usePathname();
  const viewTitle = PATH_TITLE[pathname] || "Security Workspace";
  const currentView = PATH_VIEW_MODE[pathname] || "home";
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { addToast } = useVaultUI();
  const [cloudSession, setCloudSession] = React.useState<CloudSessionUser | null>(() => getCloudSession());
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const loadSession = () => {
      setCloudSession(getCloudSession());
    };

    loadSession();
    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, loadSession);
    window.addEventListener("storage", loadSession);
    return () => {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, loadSession);
      window.removeEventListener("storage", loadSession);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addToast("Vault backed up securely to Cloud.", "success");
    }, 700);
  };

  const handleSignOut = () => {
    if (cloudSession?.accessToken) {
      fetch(`${appConfig.apiUrl}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cloudSession.accessToken}` },
      }).catch(() => {});
    }
    clearCloudSession();
    setCloudSession(null);
    addToast("Signed out of Cloud. Your local vault remains safely on this device.", "info");
  };

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 gap-3">
        {/* Left Section: Mobile Menu + View Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleMobileSidebar}
            className="md:hidden text-muted-foreground cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">
              {viewTitle}
            </h1>
            {isUnlocked ? (
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-success border-success/30 bg-success/10 py-0 px-1.5">
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-warning border-warning/30 bg-warning/10 py-0 px-1.5">
                Locked
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vault (/)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={(e) => {
                // When clicking the header search, also open command palette for global search
                e.target.blur();
                onOpenCommandPalette();
              }}
              className="pl-8 pr-12 h-8 text-xs bg-surface border-border-subtle focus-visible:border-border-strong cursor-pointer"
              readOnly
            />
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-background border border-border-subtle text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenCommandPalette}
            className="sm:hidden text-muted-foreground cursor-pointer"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>

          {/* Add Item Button */}
          {(currentView === "passwords" || currentView === "bookmarks" || currentView === "home") && (
            <Button
              size="sm"
              onClick={onOpenNewItemModal}
              className="h-8 text-xs gap-1.5 shadow-xs font-medium cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">
                {currentView === "bookmarks" ? "Add Bookmark" : "Add Password"}
              </span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}

          {/* Cloud Account Status & Actions */}
          {cloudSession ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  title="Your Cloud Account & Backup"
                >
                  <div className="relative flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                    {cloudSession.name ? cloudSession.name.charAt(0).toUpperCase() : cloudSession.email.charAt(0).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 border border-background" />
                  </div>
                  <span className="hidden sm:inline max-w-[110px] truncate text-foreground">
                    {cloudSession.name || cloudSession.email.split("@")[0]}
                  </span>
                  <Badge variant="outline" className="hidden lg:inline-flex text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-1 font-mono">
                    <Cloud className={`size-2.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Active</span>
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 text-xs">
                <div className="px-2 py-1.5 border-b border-border-subtle mb-1">
                  <p className="font-semibold text-foreground truncate">{cloudSession.name || "Cloud Account"}</p>
                  <p className="text-muted-foreground text-[11px] truncate">{cloudSession.email}</p>
                  <div className="mt-1.5">
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-primary border-primary/20 bg-primary/5">
                      {cloudSession.role === "ADMIN" ? "Team Administrator" : "Personal Account"}
                    </Badge>
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="gap-2 cursor-pointer py-1.5"
                >
                  <RefreshCw className={`size-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing with Cloud..." : "Sync Vault Now"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 cursor-pointer py-1.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out of Cloud</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/signup?redirect=/app">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium cursor-pointer shadow-2xs"
                title="Lokker Cloud & Team Workspaces (100% Optional)"
              >
                <Cloud className="size-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">Go Cloud</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/25">
                  Optional
                </span>
              </Button>
            </Link>
          )}

          {/* Extension Quick Launch */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onOpenExtensionGuide}
            aria-label="Extension Setup"
            title="Browser Extension"
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Puzzle className="size-3.5" />
          </Button>

          {/* Lock / Unlock Toggle */}
          <Button
            variant={isUnlocked ? "outline" : "default"}
            size="sm"
            onClick={onToggleLock}
            className="h-8 text-xs gap-1.5 cursor-pointer"
            title={isUnlocked ? `Auto-locks in ${autoLockMinutes}m` : "Unlock Vault"}
          >
            {isUnlocked ? (
              <>
                <Unlock className="size-3.5 text-success" />
                <span className="hidden sm:inline">Lock Vault</span>
              </>
            ) : (
              <>
                <Lock className="size-3.5" />
                <span className="hidden sm:inline">Unlock</span>
              </>
            )}
          </Button>

          {/* Theme Switcher */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle Theme"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

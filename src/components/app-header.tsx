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
  Coffee,
  MoreVertical,
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
import { DonateModal } from "./modals/donate-modal";

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
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);

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
      <div className="relative flex h-14 items-center justify-between px-2.5 sm:px-6 gap-1.5 sm:gap-3">
        {/* Left Section: Mobile Menu + View Title */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 z-10 max-w-[28%] sm:max-w-[35%]">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleMobileSidebar}
            className="md:hidden text-muted-foreground cursor-pointer shrink-0 size-7 sm:size-8"
            aria-label="Toggle Sidebar"
          >
            <Menu className="size-3.5 sm:size-4" />
          </Button>

          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate">
              {viewTitle}
            </h1>
            {isUnlocked ? (
              <Badge variant="outline" className="hidden lg:inline-flex text-[10px] text-success border-success/30 bg-success/10 py-0 px-1.5">
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="hidden lg:inline-flex text-[10px] text-warning border-warning/30 bg-warning/10 py-0 px-1.5">
                Locked
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Donate Button (strictly visible on top of screen in center on ALL device widths) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">
          <button
            type="button"
            id="btn-donate-header"
            onClick={() => setIsDonateOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/35 hover:border-amber-500/55 text-amber-500 dark:text-amber-400 font-medium text-xs shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0 select-none group"
            title="Support Lokker — Buy Me a Coffee"
          >
            <Coffee className="size-3.5 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-semibold tracking-tight text-[11px] sm:text-xs">Donate</span>
            <span className="hidden md:inline text-[10px] text-amber-500/80 font-normal">☕ Buy Me a Coffee</span>
          </button>
        </div>

        {/* Desktop Search Bar (XL screens only so it never crowds the centered Donate button) */}
        <div className="hidden xl:block flex-1 max-w-xs mr-auto ml-20">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vault (/)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={(e) => {
                e.target.blur();
                onOpenCommandPalette();
              }}
              className="pl-8 pr-10 h-8 text-xs bg-surface border-border-subtle focus-visible:border-border-strong cursor-pointer"
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
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-10">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenCommandPalette}
            className="xl:hidden text-muted-foreground cursor-pointer size-7 sm:size-8"
            aria-label="Search"
          >
            <Search className="size-3.5 sm:size-4" />
          </Button>

          {/* Add Item Button */}
          {(currentView === "passwords" || currentView === "bookmarks" || currentView === "home") && (
            <Button
              size="sm"
              onClick={onOpenNewItemModal}
              className="h-7 sm:h-8 text-xs gap-1 sm:gap-1.5 shadow-xs font-medium cursor-pointer px-2 sm:px-3"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">
                {currentView === "bookmarks" ? "Add Bookmark" : "Add Password"}
              </span>
              <span className="sm:hidden text-[11px]">Add</span>
            </Button>
          )}

          {/* Lock / Unlock Toggle */}
          <Button
            variant={isUnlocked ? "outline" : "default"}
            size="sm"
            onClick={onToggleLock}
            className="h-7 sm:h-8 text-xs gap-1 cursor-pointer px-1.5 sm:px-2.5"
            title={isUnlocked ? `Auto-locks in ${autoLockMinutes}m` : "Unlock Vault"}
          >
            {isUnlocked ? (
              <>
                <Unlock className="size-3.5 text-success" />
                <span className="hidden md:inline">Lock Vault</span>
              </>
            ) : (
              <>
                <Lock className="size-3.5" />
                <span className="hidden md:inline">Unlock</span>
              </>
            )}
          </Button>

          {/* Desktop Actions (shown on md+ screens) */}
          <div className="hidden md:flex items-center gap-2">
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
                    <span className="hidden lg:inline max-w-[100px] truncate text-foreground">
                      {cloudSession.name || cloudSession.email.split("@")[0]}
                    </span>
                    <Badge variant="outline" className="hidden xl:inline-flex text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-1 font-mono">
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
                  <span className="hidden lg:inline">Go Cloud</span>
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

          {/* Mobile More Options Dropdown (prevents top bar buttons from overflowing on small widths) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="More Options"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 text-xs">
                {cloudSession ? (
                  <>
                    <div className="px-2 py-1.5 border-b border-border-subtle mb-1">
                      <p className="font-semibold text-foreground truncate">{cloudSession.name || "Cloud Account"}</p>
                      <p className="text-muted-foreground text-[10px] truncate">{cloudSession.email}</p>
                    </div>
                    <DropdownMenuItem onClick={handleManualSync} disabled={isSyncing} className="gap-2 cursor-pointer">
                      <RefreshCw className={`size-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Sync Vault Now</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="size-3.5" />
                      <span>Sign Out of Cloud</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/signup?redirect=/app" className="flex items-center gap-2">
                      <Cloud className="size-3.5 text-primary" />
                      <span>Go Cloud (Optional)</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onOpenExtensionGuide} className="gap-2 cursor-pointer">
                  <Puzzle className="size-3.5 text-muted-foreground" />
                  <span>Browser Extension</span>
                </DropdownMenuItem>

                {mounted && (
                  <DropdownMenuItem
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="gap-2 cursor-pointer"
                  >
                    {resolvedTheme === "dark" ? (
                      <>
                        <Sun className="size-3.5 text-amber-500" />
                        <span>Switch to Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="size-3.5 text-indigo-400" />
                        <span>Switch to Dark Mode</span>
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </header>
  );
}

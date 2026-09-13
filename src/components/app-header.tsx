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
  HelpCircle,
  Keyboard,
  WifiOff,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVaultUI } from "@/context/vault-ui-context";
import { useVaultData } from "@/context/vault-data-context";
import { usePWA } from "@/hooks/use-pwa";
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
import { CloudUploadChoiceModal } from "@/components/modals/cloud-upload-choice-modal";

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
  onOpenShortcuts?: () => void;
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
  onOpenShortcuts,
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
  const { syncStatus, lastSyncedAt, cloudItemCount, triggerCloudSync, migrateAllToCloudAndSync } = useVaultData();
  const { isOnline, isInstallable, isStandalone, installApp, hasUpdate, reloadForUpdate } = usePWA();
  const [cloudSession, setCloudSession] = React.useState<CloudSessionUser | null>(() => getCloudSession());
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = React.useState(false);

  const handleInstallApp = async () => {
    const installed = await installApp();
    if (installed) {
      addToast("Lokker installed as standalone app!", "success");
    }
  };

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
    setIsChoiceModalOpen(true);
  };

  const handleSignOut = () => {
    if (cloudSession?.accessToken) {
      fetch(`${appConfig.apiUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cloudSession.accessToken}`,
        },
        body: "{}",
      }).catch(() => {});
    }
    clearCloudSession();
    setCloudSession(null);
    addToast("Signed out of Cloud. Your local vault remains safely on this device.", "info");
  };

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-2.5 sm:px-5 gap-1.5 sm:gap-3">
        {/* Left Section: Mobile Menu + View Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 max-w-[200px] sm:max-w-[260px]">
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
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-success border-success/30 bg-success/10 py-0 px-1.5">
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-warning border-warning/30 bg-warning/10 py-0 px-1.5">
                Locked
              </Badge>
            )}
            {!isOnline && (
              <Badge
                id="badge-offline-status"
                variant="outline"
                className="inline-flex items-center gap-1 text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 py-0 px-1.5 shrink-0"
                title="Offline Mode — All credentials and vault operations operate locally with zero-knowledge encryption."
              >
                <WifiOff className="size-2.5" />
                <span className="hidden md:inline">Offline (Local Vault Active)</span>
                <span className="md:hidden">Offline</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Donate Button (in normal flex flow with flex-1 and justify-center - ZERO COLLISION GUARANTEED) */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          <button
            type="button"
            id="btn-donate-header"
            onClick={() => setIsDonateOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/35 hover:border-amber-500/55 text-amber-500 dark:text-amber-400 font-medium text-xs shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0 select-none group"
            title="Support Lokker — Buy Me a Coffee"
          >
            <Coffee className="size-3.5 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-semibold tracking-tight text-[11px] sm:text-xs">Donate</span>
            <span className="hidden 2xl:inline text-[10px] text-amber-500/80 font-normal">☕ Buy Me a Coffee</span>
          </button>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          {/* Search Trigger: Full input bar on wide desktop (xl+), icon button on smaller screens */}
          <button
            type="button"
            id="btn-header-search-bar"
            onClick={onOpenCommandPalette}
            className="hidden xl:flex items-center justify-between gap-2.5 h-8 px-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover hover:border-border text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-44 2xl:w-56 shadow-2xs group shrink-0 select-none"
            title="Search vault (⌘K or Ctrl+K)"
            aria-label="Search vault"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Search className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
              <span className="truncate text-xs font-normal">Search vault...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-muted/60 text-muted-foreground border border-border-subtle shrink-0">
              <span className="text-[11px] leading-none">⌘</span>K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenCommandPalette}
            className="xl:hidden text-muted-foreground hover:text-foreground cursor-pointer size-7 sm:size-8 shrink-0"
            aria-label="Search"
            title="Search vault (⌘K)"
          >
            <Search className="size-3.5 sm:size-4" />
          </Button>

          {/* Keyboard Shortcuts Cheatsheet Trigger */}
          {onOpenShortcuts && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onOpenShortcuts}
              className="text-muted-foreground hover:text-foreground cursor-pointer size-7 sm:size-8 shrink-0"
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts (Press ?)"
            >
              <Keyboard className="size-3.5 sm:size-4" />
            </Button>
          )}

          {/* PWA Install Button */}
          {isInstallable && !isStandalone && (
            <Button
              id="btn-header-install-pwa"
              variant="outline"
              size="sm"
              onClick={handleInstallApp}
              className="h-7 sm:h-8 text-xs gap-1 sm:gap-1.5 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium cursor-pointer shadow-2xs px-2 sm:px-2.5"
              title="Install Lokker as standalone Desktop/Mobile App"
            >
              <Download className="size-3.5" />
              <span className="hidden md:inline">Install App</span>
            </Button>
          )}

          {/* PWA Service Worker Update Prompt */}
          {hasUpdate && (
            <Button
              id="btn-header-pwa-update"
              variant="outline"
              size="sm"
              onClick={reloadForUpdate}
              className="h-7 sm:h-8 text-xs gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer px-2 sm:px-2.5"
              title="A new version of Lokker is ready. Click to reload."
            >
              <RefreshCw className="size-3 animate-spin" />
              <span className="hidden md:inline">Update Ready</span>
            </Button>
          )}

          {/* Add Item Button */}
          {(currentView === "passwords" || currentView === "bookmarks" || currentView === "home") && (
            <Button
              size="sm"
              onClick={onOpenNewItemModal}
              className="h-7 sm:h-8 text-xs gap-1 sm:gap-1.5 shadow-xs font-medium cursor-pointer px-2 sm:px-2.5 lg:px-3"
              title={currentView === "bookmarks" ? "Add Bookmark" : "Add Password"}
            >
              <Plus className="size-3.5" />
              <span className="hidden xl:inline">
                {currentView === "bookmarks" ? "Add Bookmark" : "Add Password"}
              </span>
              <span className="hidden sm:inline xl:hidden text-xs">Add</span>
            </Button>
          )}

          {/* Lock / Unlock Toggle */}
          <Button
            variant={isUnlocked ? "outline" : "default"}
            size="sm"
            onClick={onToggleLock}
            className="h-7 sm:h-8 text-xs gap-1 cursor-pointer px-2 sm:px-2.5"
            title={isUnlocked ? `Auto-locks in ${autoLockMinutes}m` : "Unlock Vault"}
          >
            {isUnlocked ? (
              <>
                <Unlock className="size-3.5 text-success" />
                <span className="hidden xl:inline">Lock Vault</span>
              </>
            ) : (
              <>
                <Lock className="size-3.5" />
                <span className="hidden xl:inline">Unlock</span>
              </>
            )}
          </Button>

          {/* Cloud Account Status & Actions */}
          {cloudSession ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  title={`Cloud Account: ${cloudSession.name || cloudSession.email}`}
                >
                  <div className="relative flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                    {cloudSession.name ? cloudSession.name.charAt(0).toUpperCase() : cloudSession.email.charAt(0).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 border border-background" />
                  </div>
                  <span className="hidden xl:inline max-w-[90px] truncate text-foreground">
                    {cloudSession.name || cloudSession.email.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5 text-xs">
                <div className="px-2 py-1.5 border-b border-border-subtle mb-1">
                  <p className="font-semibold text-foreground truncate">{cloudSession.name || "Cloud Account"}</p>
                  <p className="text-muted-foreground text-[11px] truncate">{cloudSession.email}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-primary border-primary/20 bg-primary/5">
                      {cloudSession.role === "ADMIN" ? "Team Administrator" : "Personal Account"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {cloudItemCount} cloud items
                    </span>
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={handleManualSync}
                  disabled={syncStatus === "syncing"}
                  className="gap-2 cursor-pointer py-1.5"
                >
                  <RefreshCw className={`size-3.5 text-primary ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                  <span>{syncStatus === "syncing" ? "Syncing with Cloud..." : "Sync to Cloud"}</span>
                </DropdownMenuItem>

                {onOpenCloudSyncModal && (
                  <DropdownMenuItem
                    onClick={onOpenCloudSyncModal}
                    className="gap-2 cursor-pointer py-1.5"
                  >
                    <Cloud className="size-3.5 text-muted-foreground" />
                    <span>Cloud Settings & Backup</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="gap-2 cursor-pointer py-1.5">
                  <Link href="/app/why-to-pay" className="flex items-center gap-2">
                    <HelpCircle className="size-3.5 text-muted-foreground" />
                    <span>Why to Pay?</span>
                  </Link>
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
            <Link href="/signup?redirect=/app" className="hidden lg:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-7 sm:h-8 text-xs gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium cursor-pointer shadow-2xs"
                title="Lokker Cloud & Team Workspaces (100% Optional)"
              >
                <Cloud className="size-3.5 text-primary shrink-0" />
                <span className="hidden xl:inline">Go Cloud</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/25">
                  Optional
                </span>
              </Button>
            </Link>
          )}

          {/* Desktop-only secondary actions (shown on lg+ screens) */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5">
            {/* Why to Pay Link Button on top bar (shown on xl+ screens where there is plenty of room) */}
            <Link href="/app/why-to-pay" className="hidden xl:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                title="Why Pay? Learn why Lokker is free and why cloud costs exist"
              >
                <HelpCircle className="size-3.5 text-primary" />
                <span>Why Pay?</span>
              </Button>
            </Link>

            {/* Extension Quick Launch */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onOpenExtensionGuide}
              aria-label="Extension Setup"
              title="Browser Extension"
              className="text-muted-foreground hover:text-foreground cursor-pointer size-7 sm:size-8"
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
                title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="text-muted-foreground hover:text-foreground cursor-pointer size-7 sm:size-8"
              >
                {resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </Button>
            )}
          </div>

          {/* Mobile & Tablet More Options Dropdown (shown on < lg screens to guarantee zero overflow) */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground cursor-pointer size-7 sm:size-8"
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
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {cloudItemCount} cloud items
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 text-primary">
                          {syncStatus}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuItem
                      onClick={handleManualSync}
                      disabled={syncStatus === "syncing"}
                      className="gap-2 cursor-pointer"
                    >
                      <RefreshCw
                        className={`size-3.5 text-primary ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                      />
                      <span>{syncStatus === "syncing" ? "Syncing..." : "Sync to Cloud"}</span>
                    </DropdownMenuItem>

                    {onOpenCloudSyncModal && (
                      <DropdownMenuItem
                        onClick={onOpenCloudSyncModal}
                        className="gap-2 cursor-pointer"
                      >
                        <Cloud className="size-3.5 text-muted-foreground" />
                        <span>Cloud Settings</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/app/why-to-pay" className="flex items-center gap-2">
                        <HelpCircle className="size-3.5 text-primary" />
                        <span>Why to Pay?</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out of Cloud</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/signup?redirect=/app" className="flex items-center gap-2">
                        <Cloud className="size-3.5 text-primary" />
                        <span>Go Cloud (Optional)</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/app/why-to-pay" className="flex items-center gap-2">
                        <HelpCircle className="size-3.5 text-primary" />
                        <span>Why to Pay?</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
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

                {isInstallable && !isStandalone && (
                  <DropdownMenuItem
                    id="btn-mobile-install-pwa"
                    onClick={handleInstallApp}
                    className="gap-2 cursor-pointer text-primary focus:text-primary"
                  >
                    <Download className="size-3.5" />
                    <span>Install Lokker App</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Cloud Upload Choice Modal (1-Click Migration vs Selective) */}
      <CloudUploadChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onUploadAll={async () => {
          await migrateAllToCloudAndSync();
        }}
        onUploadSelected={() => {
          setIsChoiceModalOpen(false);
          addToast("Edit any specific credential and click 'Update in Cloud' to save it in cloud.", "info");
        }}
        totalLocalItems={cloudItemCount}
      />

      {/* Donate Modal */}
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </header>
  );
}

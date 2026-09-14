"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Plus, Building2, ShieldCheck, User, Cloud, Sun, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";

interface WorkspaceHeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenAddModal: () => void;
}

export function WorkspaceHeader({
  onToggleMobileSidebar,
  onOpenAddModal,
}: WorkspaceHeaderProps) {
  const {
    activeWorkspace,
    planQuota,
    userRole,
    isCloudActive,
    isSyncingWorkspace,
    lastWorkspaceSyncedAt,
    syncActiveWorkspace,
  } = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [justSynced, setJustSynced] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSyncClick = async () => {
    await syncActiveWorkspace(false);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  return (
    <header className="h-14 border-b border-border-subtle bg-background px-4 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleMobileSidebar}
          className="md:hidden text-muted-foreground cursor-pointer"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2 truncate">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm text-foreground truncate">
                {activeWorkspace ? activeWorkspace.name : "Workspace"}
              </h1>
              {userRole && (
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 font-medium ${
                    userRole === "ADMIN"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-muted/40 text-muted-foreground"
                  }`}
                >
                  {userRole === "ADMIN" ? "Admin" : "Member"}
                </Badge>
              )}
            </div>
            {activeWorkspace?.description && (
              <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
                {activeWorkspace.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-surface border border-border-subtle px-2 py-0.5 rounded-md">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloud Encrypted</span>
        </div>

        {/* Sync Workspace Button */}
        {isCloudActive && activeWorkspace && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncClick}
            disabled={isSyncingWorkspace}
            title={
              lastWorkspaceSyncedAt
                ? `Last synced: ${lastWorkspaceSyncedAt.toLocaleTimeString()}`
                : "Sync workspace with team"
            }
            className="h-8 text-xs gap-1.5 border-border-subtle hover:border-primary/40 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
          >
            <RefreshCw
              className={`size-3.5 ${
                isSyncingWorkspace
                  ? "animate-spin text-primary"
                  : justSynced
                  ? "text-emerald-500"
                  : ""
              }`}
            />
            <span className="hidden xs:inline font-medium">
              {isSyncingWorkspace ? "Syncing..." : justSynced ? "Synced!" : "Sync"}
            </span>
          </Button>
        )}

        {/* Theme Switcher Button */}
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

        {!isCloudActive ? (
          <Link href="/login?redirect=/app/workspaces">
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
            >
              <span>Sign In</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddModal}
            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer font-medium"
          >
            <Plus className="size-3.5" />
            <span>Add Workspace</span>
            <span className="text-[10px] opacity-70 font-mono hidden sm:inline">
              ({planQuota.ownedCount}/{planQuota.maxAllowed})
            </span>
          </Button>
        )}
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  KeyRound,
  Bookmark as BookmarkIcon,
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  ArrowLeft,
  Plus,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useWorkspace } from "@/context/workspace-context";

interface WorkspaceSidebarProps {
  onOpenAddModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function WorkspaceSidebar({
  onOpenAddModal,
  isMobileOpen,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeWorkspace, workspacePasswords, workspaceBookmarks, workspaceCategories, userRole } = useWorkspace();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const basePath = activeWorkspace
    ? `/app/${activeWorkspace.adminUserId || "me"}/workspace/${activeWorkspace.id}`
    : "/app";

  const navItems = [
    {
      label: "Overview",
      href: `${basePath}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Passwords",
      href: `${basePath}/passwords`,
      icon: KeyRound,
      count: workspacePasswords.length,
    },
    {
      label: "Bookmarks",
      href: `${basePath}/bookmarks`,
      icon: BookmarkIcon,
      count: workspaceBookmarks.length,
    },
  ];

  const managementItems = [
    {
      label: "Members & Invites",
      href: `${basePath}/members`,
      icon: Users,
    },
    {
      label: "Workspace Settings",
      href: `${basePath}/settings`,
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[var(--z-drawer)] bg-black/80 backdrop-blur-xs md:hidden cursor-pointer"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[var(--z-drawer)] md:static flex flex-col ${
          isCollapsed ? "md:w-16" : "md:w-64"
        } w-64 border-r border-border-subtle bg-sidebar text-sidebar-foreground transition-all duration-200 ease-standard ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand & Exit Bar */}
        <div className="p-3 border-b border-border-subtle flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <LokkerBrandIcon size="sm" />
              {!isCollapsed && (
                <span className="font-heading font-bold text-sm tracking-tight text-foreground">
                  Lokker
                </span>
              )}
            </Link>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex text-muted-foreground hover:text-foreground cursor-pointer"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onCloseMobile}
                className="md:hidden text-muted-foreground cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Return to Personal Vault Button */}
          {!isCollapsed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onCloseMobile();
                router.push("/app");
              }}
              className="w-full h-8 text-xs gap-2 border-border-subtle hover:bg-surface-subtle text-muted-foreground hover:text-foreground justify-start cursor-pointer font-medium mt-0.5"
            >
              <ArrowLeft className="size-3.5 text-primary" />
              <span>Exit to Personal Vault</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => router.push("/app")}
              className="w-full h-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Exit to Personal Vault"
            >
              <ArrowLeft className="size-3.5 text-primary" />
            </Button>
          )}
        </div>

        {/* Workspace Switcher in Sidebar */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <WorkspaceSwitcher onOpenAddModal={onOpenAddModal} />
          </div>
        )}

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto lokker-scrollbar px-2 py-3 space-y-4 text-xs">
          {/* Workspace Items Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Workspace Items
              </p>
            )}
            <div className="max-h-[220px] overflow-y-auto lokker-scrollbar space-y-0.5 pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`w-full flex items-center ${
                      isCollapsed ? "justify-center px-0 py-2" : "justify-between px-2.5 py-1.5"
                    } rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && typeof item.count === "number" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background border border-border-subtle text-muted-foreground shrink-0 ml-1">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Workspace Categories Section */}
          {!isCollapsed && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Workspace Categories
                </span>
              </div>
              <div className="max-h-[220px] overflow-y-auto lokker-scrollbar space-y-0.5 pr-1">
                {workspaceCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Management & Settings Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Workspace Admin
              </p>
            )}
            <div className="max-h-[160px] overflow-y-auto lokker-scrollbar space-y-0.5 pr-1">
              {managementItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`w-full flex items-center ${
                      isCollapsed ? "justify-center px-0 py-2" : "justify-between px-2.5 py-1.5"
                    } rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-border-subtle text-[11px] flex items-center ${isCollapsed ? "justify-center" : "justify-between"} text-muted-foreground`}>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            {!isCollapsed && (
              <span className="font-medium text-foreground">
                {userRole === "ADMIN" ? "Workspace Admin" : "Team Member"}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary">
              {activeWorkspace?.plan || "FREE"}
            </Badge>
          )}
        </div>
      </aside>
    </>
  );
}

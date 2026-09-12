"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Bookmark as BookmarkIcon,
  QrCode,
  Star,
  Activity,
  Sparkles,
  Database,
  FolderLock,
  Mail,
  Puzzle,
  BookOpen,
  Settings as SettingsIcon,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ExternalLink,
  CornerDownRight,
  MoreVertical,
  Pencil,
  Trash2,
  FolderPlus,
  Cloud,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Category, ViewMode } from "@/types";
import { appConfig } from "@/config/app";
import { getCloudSession, CLOUD_AUTH_CHANGE_EVENT, type CloudSessionUser } from "@/lib/auth-session";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";
import { buildCategoryTree, formatCategoryPath, getCategoryAncestors } from "@/lib/category-tree";

const VIEW_TO_PATH: Record<ViewMode, string> = {
  home: "/app",
  passwords: "/app/passwords",
  bookmarks: "/app/bookmarks",
  totp: "/app/totp",
  favorites: "/app/favorites",
  "security-audit": "/app/security-audit",
  generator: "/app/generator",
  "import-export": "/app/import-export",
  files: "/app/files",
  "masked-emails": "/app/masked-emails",
  passkeys: "/app/passkeys",
  extension: "/app/extension",
  guide: "/app/guide",
  settings: "/app/settings",
};

interface AppSidebarProps {
  onSelectView: (view: ViewMode) => void;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  isUnlocked: boolean;
  onOpenCategoryManager: (defaultParentId?: string) => void;
  onRenameCategory?: (id: string, newName: string) => void;
  onDeleteCategory?: (id: string) => void;
  bookmarkCount: number;
  passwordCount: number;
  maskedEmailCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  onSelectView,
  categories,
  selectedCategory,
  onSelectCategory,
  isUnlocked,
  onOpenCategoryManager,
  onRenameCategory,
  onDeleteCategory,
  bookmarkCount,
  passwordCount,
  isMobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editingCatName, setEditingCatName] = React.useState("");
  const [collapsedCatIds, setCollapsedCatIds] = React.useState<Set<string>>(new Set());

  const toggleCategoryCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-expand ancestors when a category is selected or when new subcategories are added
  const prevCategoryIdsRef = React.useRef<Set<string>>(new Set(categories.map((c) => c.id)));
  React.useEffect(() => {
    const prevIds = prevCategoryIdsRef.current;
    const newCats = categories.filter((c) => !prevIds.has(c.id));
    if (newCats.length > 0) {
      const ancestorIdsToExpand = new Set<string>();
      newCats.forEach((cat) => {
        const ancestors = getCategoryAncestors(cat.id, categories);
        ancestors.forEach((a) => ancestorIdsToExpand.add(a.id));
      });
      if (ancestorIdsToExpand.size > 0) {
        setCollapsedCatIds((prev) => {
          let changed = false;
          const next = new Set(prev);
          ancestorIdsToExpand.forEach((id) => {
            if (next.has(id)) {
              next.delete(id);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
    prevCategoryIdsRef.current = new Set(categories.map((c) => c.id));

    if (selectedCategory) {
      const activeCat = categories.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase());
      if (activeCat) {
        const ancestors = getCategoryAncestors(activeCat.id, categories);
        if (ancestors.length > 0) {
          setCollapsedCatIds((prev) => {
            let changed = false;
            const next = new Set(prev);
            ancestors.forEach((a) => {
              if (next.has(a.id)) {
                next.delete(a.id);
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        }
      }
    }
  }, [categories, selectedCategory]);

  const [cloudSession, setCloudSession] = React.useState<CloudSessionUser | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
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

  const mainNavItems = [
    { id: "home" as ViewMode, label: "Dashboard", icon: ShieldCheck },
    { id: "passwords" as ViewMode, label: "Password Vault", icon: KeyRound, count: passwordCount },
    { id: "passkeys" as ViewMode, label: "Passkeys (FIDO2)", icon: Fingerprint },
    { id: "bookmarks" as ViewMode, label: "Bookmarks", icon: BookmarkIcon, count: bookmarkCount },
    { id: "totp" as ViewMode, label: "2FA Authenticator", icon: QrCode },
    { id: "favorites" as ViewMode, label: "Favorites", icon: Star },
  ];

  const utilityNavItems = [
    { id: "security-audit" as ViewMode, label: "Security Health", icon: Activity },
    { id: "generator" as ViewMode, label: "Password Generator", icon: Sparkles },
    { id: "import-export" as ViewMode, label: "Import & Export", icon: Database },
    { id: "files" as ViewMode, label: "File Vault", icon: FolderLock },
    { id: "masked-emails" as ViewMode, label: "Masked Emails", icon: Mail },
  ];

  const systemNavItems = [
    { id: "extension" as ViewMode, label: "Browser Extension", icon: Puzzle },
    { id: "guide" as ViewMode, label: "Feature Guide", icon: BookOpen },
    { id: "settings" as ViewMode, label: "Settings", icon: SettingsIcon },
  ];

  // Organize categories into arbitrary-depth hierarchical tree
  const categoryTree = React.useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  const renderNavItem = (item: { id: ViewMode; label: string; icon: React.ElementType; count?: number }) => {
    const Icon = item.icon;
    const href = VIEW_TO_PATH[item.id];
    const isActive = pathname === href && (item.id !== "passwords" || selectedCategory === null);

    const linkElement = (
      <Link
        key={item.id}
        href={href}
        onClick={() => {
          if (item.id === "passwords" || item.id === "bookmarks") {
            onSelectCategory(null);
          }
          onCloseMobile();
        }}
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

    if (isCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
            {typeof item.count === "number" ? ` (${item.count})` : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <TooltipProvider delayDuration={150}>
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
        {/* Brand Header */}
        <div className={`h-16 border-b border-border-subtle ${isCollapsed ? "px-2 justify-center" : "px-3.5 justify-between"} flex items-center`}>
          {!isCollapsed ? (
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <LokkerBrandIcon size="md" />
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-sm tracking-tight text-foreground leading-tight">
                  Lokker
                </span>
                <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                  Local Vault & Links
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/"
              title="Lokker - Local Vault & Links"
              className="flex items-center justify-center p-1"
            >
              <LokkerBrandIcon size="sm" />
            </Link>
          )}

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex text-muted-foreground hover:text-foreground cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>

            {!isCollapsed && (
              <Link
                href="/"
                title="Return to Public Site"
                className="text-muted-foreground hover:text-foreground text-xs p-1 rounded hidden sm:inline-flex cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            )}

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

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto lokker-scrollbar px-2 py-4 space-y-6 text-xs">
          {/* Main Vault Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Vault & Items
              </p>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Categories Section with Nested Hierarchy */}
          {!isCollapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Categories
                </span>
                <button
                  onClick={() => onOpenCategoryManager()}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Manage Categories"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              {categoryTree.map((item) => {
                const { category: cat, depth, hasChildren, childCount, ancestors } = item;
                // If any ancestor is collapsed, hide this item
                const isHiddenByAncestor = ancestors.some((a) => collapsedCatIds.has(a.id));
                if (isHiddenByAncestor) return null;

                const isCollapsedFolder = collapsedCatIds.has(cat.id);
                const isCatActive = selectedCategory === cat.name;
                const isEditing = editingCatId === cat.id;

                const handleRenameSubmit = () => {
                  if (isEditing && editingCatName.trim() && onRenameCategory) {
                    onRenameCategory(cat.id, editingCatName.trim());
                  }
                  setEditingCatId(null);
                  setEditingCatName("");
                };

                const paddingLeft = depth * 14 + 10;

                return (
                  <div
                    key={cat.id}
                    className={`group relative flex items-center justify-between py-1 pr-1.5 rounded-md text-xs font-medium transition-colors ${
                      isCatActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    }`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    title={item.path}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* Collapse / Expand Toggle Button for folders */}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => toggleCategoryCollapse(cat.id, e)}
                          className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          title={isCollapsedFolder ? "Expand folder" : "Collapse folder"}
                        >
                          {isCollapsedFolder ? (
                            <ChevronRight className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}

                      {/* Category Color Dot */}
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />

                      {/* Name Click Target or Inline Rename Input */}
                      {isEditing ? (
                        <Input
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onBlur={handleRenameSubmit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSubmit();
                            if (e.key === "Escape") {
                              setEditingCatId(null);
                              setEditingCatName("");
                            }
                          }}
                          autoFocus
                          className="h-6 text-xs px-1.5 py-0 bg-background flex-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <button
                          type="button"
                          data-category-name={cat.name}
                          onClick={() => {
                            onSelectCategory(cat.name);
                            if (pathname !== "/app/passwords" && pathname !== "/app/bookmarks") {
                              onSelectView("passwords");
                            }
                            onCloseMobile();
                          }}
                          className="truncate flex-1 text-left cursor-pointer focus:outline-none"
                        >
                          {cat.name}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Child subcategory count badge if folder */}
                      {hasChildren && !isEditing && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mr-0.5">
                          {childCount}
                        </span>
                      )}

                      {!isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              title="Category options"
                            >
                              <MoreVertical className="size-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 z-[400]">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="size-3 mr-1.5" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCategoryManager(cat.id);
                              }}
                              className="cursor-pointer"
                            >
                              <FolderPlus className="size-3 mr-1.5" />
                              <span>Add Subcategory</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory?.(cat.id);
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="size-3 mr-1.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1 pt-1 border-t border-border-subtle">
              {categoryTree.map((item) => (
                <Tooltip key={item.category.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onSelectCategory(item.category.name);
                        if (pathname !== "/app/passwords" && pathname !== "/app/bookmarks") {
                          onSelectView("passwords");
                        }
                      }}
                      className={`w-full flex justify-center py-2 rounded-md transition-colors cursor-pointer ${
                        selectedCategory === item.category.name
                          ? "bg-sidebar-accent"
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.path}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Utilities & Tools */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Security & Utilities
              </p>
            )}
            {utilityNavItems.map(renderNavItem)}
          </div>

          {/* System & Settings */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                System
              </p>
            )}
            {systemNavItems.map(renderNavItem)}
          </div>

          {/* Cloud Sync Callout */}
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-surface/70 border border-border-subtle space-y-2">
              {mounted && cloudSession ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Cloud className="size-3.5 text-emerald-500" />
                      <span>Cloud Active</span>
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">
                    {cloudSession.email}
                  </p>
                  <div className="text-[9px] font-mono text-emerald-500 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto Backup Active</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Cloud className="size-3.5 text-primary" />
                      <span>Cloud Sync</span>
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                      Optional
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Encrypted multi-device sync & team workspaces.
                  </p>
                  <Link href="/signup?redirect=/app" className="block w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <span>Go Cloud</span>
                      <ArrowRight className="size-2.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center my-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  {cloudSession ? (
                    <div
                      className="p-2 rounded-lg text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center cursor-default"
                      title={`Cloud Sync Active (${cloudSession.email})`}
                    >
                      <Cloud className="size-3.5" />
                    </div>
                  ) : (
                    <Link
                      href="/signup?redirect=/app"
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 border border-primary/20 cursor-pointer flex items-center justify-center"
                      title="Go Cloud (Optional)"
                    >
                      <Cloud className="size-3.5" />
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {cloudSession ? `Cloud Sync: ${cloudSession.email}` : "Go Cloud (Optional)"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-border-subtle text-[11px] flex items-center ${isCollapsed ? "justify-center" : "justify-between"} text-muted-foreground`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isUnlocked ? "bg-success" : "bg-warning"
              }`}
            />
            {!isCollapsed && <span>{isUnlocked ? "Decrypted" : "Encrypted"}</span>}
          </div>
          {!isCollapsed && <span className="font-mono text-[10px]">v0.1.0</span>}
        </div>
      </aside>
    </TooltipProvider>
  );
}

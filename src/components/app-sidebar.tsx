"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
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
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";

interface AppSidebarProps {
  currentView: ViewMode;
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
  currentView,
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editingCatName, setEditingCatName] = React.useState("");

  const mainNavItems = [
    { id: "home" as ViewMode, label: "Dashboard", icon: ShieldCheck },
    { id: "passwords" as ViewMode, label: "Password Vault", icon: KeyRound, count: passwordCount },
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

  // Organize categories into hierarchical tree
  const categoryTree = React.useMemo(() => {
    const rootCats: Category[] = [];
    const childMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
      if (cat.parentId) {
        const existing = childMap.get(cat.parentId) || [];
        existing.push(cat);
        childMap.set(cat.parentId, existing);
      } else {
        rootCats.push(cat);
      }
    });

    const ordered: { category: Category; isChild: boolean }[] = [];
    rootCats.forEach((root) => {
      ordered.push({ category: root, isChild: false });
      const children = childMap.get(root.id) || [];
      children.forEach((child) => {
        ordered.push({ category: child, isChild: true });
      });
    });

    // Also include any orphan children whose parents don't exist
    categories.forEach((cat) => {
      if (cat.parentId && !categories.some((c) => c.id === cat.parentId)) {
        if (!ordered.some((o) => o.category.id === cat.id)) {
          ordered.push({ category: cat, isChild: false });
        }
      }
    });

    return ordered;
  }, [categories]);

  const renderNavItem = (item: { id: ViewMode; label: string; icon: React.ElementType; count?: number }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id && (item.id !== "passwords" || selectedCategory === null);

    const buttonElement = (
      <button
        key={item.id}
        onClick={() => {
          if (item.id === "passwords" || item.id === "bookmarks") {
            onSelectCategory(null);
          }
          onSelectView(item.id);
          onCloseMobile();
        }}
        className={`w-full flex items-center ${
          isCollapsed ? "justify-center px-0 py-2" : "justify-between px-2.5 py-1.5"
        } rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
            {typeof item.count === "number" ? ` (${item.count})` : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonElement;
  };

  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] bg-black/80 backdrop-blur-xs md:hidden cursor-pointer"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[var(--z-modal)] md:static flex flex-col ${
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

              {categoryTree.map(({ category: cat, isChild }) => {
                const isCatActive = selectedCategory === cat.name;
                const isEditing = editingCatId === cat.id;

                const handleRenameSubmit = () => {
                  if (isEditing && editingCatName.trim() && onRenameCategory) {
                    onRenameCategory(cat.id, editingCatName.trim());
                  }
                  setEditingCatId(null);
                  setEditingCatName("");
                };

                return (
                  <div key={cat.id} className="group relative">
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          onSelectCategory(cat.name);
                          if (currentView !== "passwords" && currentView !== "bookmarks") {
                            onSelectView("passwords");
                          }
                          onCloseMobile();
                        }
                      }}
                      className={`w-full flex items-center justify-between py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        isChild ? "pl-5 pr-2" : "pl-2.5 pr-7"
                      } ${
                        isCatActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isChild ? (
                          <CornerDownRight className="size-3 text-muted-foreground shrink-0" />
                        ) : (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
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
                            className="h-6 text-xs px-1.5 py-0 bg-background"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{cat.name}</span>
                        )}
                      </div>
                    </button>

                    {!isEditing && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
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
                              <span>Add Nested</span>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-1 border-t border-border-subtle" />
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

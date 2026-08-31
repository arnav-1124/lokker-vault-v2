"use client";

import * as React from "react";
import {
  KeyRound,
  Bookmark as BookmarkIcon,
  QrCode,
  Activity,
  Sparkles,
  Database,
  ArrowRight,
  Unlock,
  Puzzle,
  Star,
  Plus,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, PasswordEntry, ViewMode } from "@/types";

interface DashboardHeroViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenExtensionGuide: () => void;
  isUnlocked: boolean;
  onUnlockClick: () => void;
  lastBackupTime?: number;
  onBackupExportClick: () => void;
  passwordCount: number;
  bookmarkCount: number;
  categoryCount: number;
  passwords?: PasswordEntry[];
  bookmarks?: Bookmark[];
  onOpenAddPassword?: () => void;
  onOpenAddBookmark?: () => void;
  onEditPassword?: (p: PasswordEntry) => void;
  onCopyText?: (text: string, label: string) => void;
}

export function DashboardHeroView({
  onNavigate,
  onOpenExtensionGuide,
  isUnlocked,
  onUnlockClick,
  passwordCount,
  bookmarkCount,
  categoryCount,
  passwords = [],
  bookmarks = [],
  onOpenAddPassword,
  onOpenAddBookmark,
  onEditPassword,
  onCopyText,
}: DashboardHeroViewProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Favorite items
  const favoritePasswords = React.useMemo(() => {
    return passwords.filter((p) => !!p.isFavorite);
  }, [passwords]);

  const favoriteBookmarks = React.useMemo(() => {
    return bookmarks.filter((b) => !!b.isFavorite);
  }, [bookmarks]);

  // Recently updated credentials
  const recentPasswords = React.useMemo(() => {
    return [...passwords]
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 5);
  }, [passwords]);

  // TOTP Count
  const totpCount = React.useMemo(() => {
    return passwords.filter((p) => !!p.totpSecret).length;
  }, [passwords]);

  const handleCopy = (id: string, text: string, label: string) => {
    if (!onCopyText) return;
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickModules = [
    {
      title: "Password Vault",
      desc: `${passwordCount} credentials stored securely`,
      icon: KeyRound,
      view: "passwords" as ViewMode,
    },
    {
      title: "Bookmarks",
      desc: `${bookmarkCount} sites organized`,
      icon: BookmarkIcon,
      view: "bookmarks" as ViewMode,
    },
    {
      title: "2FA Authenticator",
      desc: `${totpCount} active TOTP accounts`,
      icon: QrCode,
      view: "totp" as ViewMode,
    },
    {
      title: "Security Health",
      desc: "Entropy & breach analysis",
      icon: Activity,
      view: "security-audit" as ViewMode,
    },
    {
      title: "Password Generator",
      desc: "Random character & passphrase generator",
      icon: Sparkles,
      view: "generator" as ViewMode,
    },
    {
      title: "Import & Export",
      desc: "Browser migration & full encrypted backups",
      icon: Database,
      view: "import-export" as ViewMode,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border-subtle bg-background text-[11px] font-mono text-muted-foreground">
            <span className={`size-2 rounded-full ${isUnlocked ? "bg-success" : "bg-warning"}`} />
            <span>{isUnlocked ? "Vault Decrypted in Ephemeral Memory" : "Vault Encrypted at Rest"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Local-First Personal Security Workspace
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
            Lokker keeps your credentials, bookmarks, 2FA codes, and sensitive files strictly on your device using AES-GCM 256-bit envelope encryption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isUnlocked ? (
            <Button onClick={onUnlockClick} size="sm" className="h-9 px-5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer">
              <Unlock className="size-3.5" />
              <span>Unlock Vault</span>
            </Button>
          ) : (
            <>
              {onOpenAddPassword && (
                <Button
                  onClick={onOpenAddPassword}
                  size="sm"
                  className="h-9 px-4 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add Password</span>
                </Button>
              )}
              {onOpenAddBookmark && (
                <Button
                  onClick={onOpenAddBookmark}
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                >
                  <BookmarkIcon className="size-3.5" />
                  <span>Add Bookmark</span>
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenExtensionGuide}
            className="h-9 px-3 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Puzzle className="size-3.5" />
            <span>Extension</span>
          </Button>
        </div>
      </div>

      {/* First-Run Empty Vault Onboarding */}
      {!isUnlocked && passwordCount === 0 && bookmarkCount === 0 && (
        <div className="rounded-2xl border border-border-subtle bg-surface p-8 sm:p-10 text-center space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Your private workspace is ready.</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Start by adding your first credential, importing an existing vault,
                or generating a strong password.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenAddPassword && (
              <Button onClick={onOpenAddPassword} size="sm" className="h-9 px-5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer">
                <Plus className="size-3.5" />
                <span>Add Password</span>
              </Button>
            )}
            <Button
              onClick={() => onNavigate("import-export")}
              variant="outline"
              size="sm"
              className="h-9 px-5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
            >
              <Database className="size-3.5" />
              <span>Import Vault</span>
            </Button>
            <Button
              onClick={() => onNavigate("generator")}
              variant="outline"
              size="sm"
              className="h-9 px-5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>Generate Password</span>
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => onNavigate("passwords")}
          className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-strong transition-colors cursor-pointer space-y-1 shadow-xs"
        >
          <p className="text-xs text-muted-foreground font-medium">Stored Passwords</p>
          <p className="text-2xl font-bold font-mono text-foreground">{passwordCount}</p>
          <p className="text-[11px] text-muted-foreground">Logins, cards & secure notes</p>
        </div>

        <div
          onClick={() => onNavigate("bookmarks")}
          className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-strong transition-colors cursor-pointer space-y-1 shadow-xs"
        >
          <p className="text-xs text-muted-foreground font-medium">Saved Bookmarks</p>
          <p className="text-2xl font-bold font-mono text-foreground">{bookmarkCount}</p>
          <p className="text-[11px] text-muted-foreground">Across {categoryCount} categories</p>
        </div>

        <div
          onClick={() => onNavigate("totp")}
          className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-strong transition-colors cursor-pointer space-y-1 shadow-xs"
        >
          <p className="text-xs text-muted-foreground font-medium">2FA Authenticator</p>
          <p className="text-2xl font-bold font-mono text-primary">{totpCount}</p>
          <p className="text-[11px] text-muted-foreground">Active RFC 6238 TOTP codes</p>
        </div>

        <div
          onClick={() => onNavigate("security-audit")}
          className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-strong transition-colors cursor-pointer space-y-1 shadow-xs"
        >
          <p className="text-xs text-muted-foreground font-medium">Security Health</p>
          <p className="text-2xl font-bold font-mono text-success">Active</p>
          <p className="text-[11px] text-muted-foreground">k-Anonymity breach check</p>
        </div>
      </div>

      {/* Pinned Favorites Section */}
      {isUnlocked && (favoritePasswords.length > 0 || favoriteBookmarks.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Star className="size-3.5 text-amber-400 fill-amber-400" />
              <span>Pinned Favorites ({favoritePasswords.length + favoriteBookmarks.length})</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("favorites")}
              className="text-xs text-primary hover:text-primary h-7 gap-1 cursor-pointer"
            >
              <span>View All Favorites</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoritePasswords.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface flex items-center justify-between gap-2 shadow-xs hover:border-border-strong transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                    {item.websiteName[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{item.websiteName}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{item.username || "Login"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.password && onCopyText && (
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => handleCopy(item.id, item.password, "Password")}
                      title="Copy Password"
                      className="cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    </Button>
                  )}
                  {onEditPassword && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditPassword(item)}
                      className="h-7 text-xs px-2 cursor-pointer"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Updated Section */}
      {isUnlocked && recentPasswords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>Recently Updated Credentials</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("passwords")}
              className="text-xs text-primary hover:text-primary h-7 gap-1 cursor-pointer"
            >
              <span>All Passwords</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface divide-y divide-border-subtle shadow-xs overflow-hidden">
            {recentPasswords.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-elevated/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                    {item.websiteName[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">{item.websiteName}</span>
                      {item.category && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 bg-background">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {item.username || "Secure Entry"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  {item.password && onCopyText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.id, item.password, "Password")}
                      className="h-7 text-xs gap-1 px-2 cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Feature Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace Modules
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-strong transition-colors cursor-pointer flex items-center justify-between gap-3 group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

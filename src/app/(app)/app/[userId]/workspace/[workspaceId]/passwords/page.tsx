"use client";

import * as React from "react";
import {
  KeyRound,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PasswordEntry } from "@/types";
import { useWorkspace } from "@/context/workspace-context";

export default function WorkspacePasswordsPage() {
  const {
    activeWorkspace,
    workspacePasswords,
    workspaceCategories,
    saveWorkspacePassword,
    deleteWorkspacePassword,
  } = useWorkspace();

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [revealedIds, setRevealedIds] = React.useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Simple Add Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newCategory, setNewCategory] = React.useState(workspaceCategories[0]?.name || "General");

  const filteredPasswords = React.useMemo(() => {
    return workspacePasswords.filter((p) => {
      const matchesSearch =
        p.websiteName.toLowerCase().includes(search.toLowerCase()) ||
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        p.websiteUrl.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [workspacePasswords, search, selectedCategory]);

  const handleCopyPassword = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPassword) return;

    const entry: PasswordEntry = {
      id: "ws-pwd-" + Date.now().toString(16),
      websiteName: newName.trim(),
      websiteUrl: newUrl.trim() || "https://",
      username: newUsername.trim(),
      password: newPassword,
      category: newCategory,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspaceId: activeWorkspace?.id,
      workspaceName: activeWorkspace?.name,
    };

    await saveWorkspacePassword(entry);
    setNewName("");
    setNewUrl("");
    setNewUsername("");
    setNewPassword("");
    setIsAddOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <span>Workspace Passwords</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Credentials shared across members of {activeWorkspace?.name || "this workspace"}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Add Password</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace passwords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border-subtle"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto lokker-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7 text-xs px-2.5 cursor-pointer rounded-full"
          >
            All ({workspacePasswords.length})
          </Button>
          {workspaceCategories.map((cat) => {
            const count = workspacePasswords.filter((p) => p.category === cat.name).length;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className="h-7 text-xs px-2.5 cursor-pointer rounded-full gap-1.5"
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
                <span className="opacity-60 font-mono text-[10px]">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Passwords List */}
      <div className="space-y-2">
        {filteredPasswords.length === 0 ? (
          <div className="p-12 text-center border border-border-subtle rounded-xl bg-surface/30 space-y-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <KeyRound className="size-5" />
            </div>
            <p className="text-xs font-medium text-foreground">No workspace passwords found</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Add shared passwords to this workspace so your team can securely use them.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add First Password</span>
            </Button>
          </div>
        ) : (
          filteredPasswords.map((item) => {
            const isRevealed = revealedIds.has(item.id);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 hover:bg-surface transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {item.websiteName}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border-subtle">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>{item.username}</span>
                    <span>•</span>
                    <span>{isRevealed ? item.password : "••••••••••••"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => toggleReveal(item.id)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title={isRevealed ? "Hide Password" : "Show Password"}
                  >
                    {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleCopyPassword(item.id, item.password)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy Password"
                  >
                    {isCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteWorkspacePassword(item.id)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Delete Password"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inline Add Modal / Form */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Add Workspace Password</h2>
            <form onSubmit={handleCreatePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Service Name</label>
                <Input
                  required
                  placeholder="e.g. AWS Console, GitHub Team"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Website URL</label>
                <Input
                  placeholder="https://console.aws.amazon.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Username / Email</label>
                <Input
                  required
                  placeholder="team@example.com"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Password</label>
                <Input
                  type="password"
                  required
                  placeholder="Enter strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-8 text-xs bg-background border border-border-subtle rounded-md px-2 text-foreground"
                >
                  {workspaceCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs cursor-pointer">
                  Save to Workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

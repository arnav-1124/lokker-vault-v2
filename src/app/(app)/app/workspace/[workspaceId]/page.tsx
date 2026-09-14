"use client";

import * as React from "react";
import Link from "next/link";
import {
  KeyRound,
  Bookmark as BookmarkIcon,
  Users,
  ShieldCheck,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Lock,
  Cloud,
  Crown,
  Shield,
  Eye,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/context/workspace-context";

export default function WorkspaceOverviewPage() {
  const pathname = usePathname();
  const {
    activeWorkspace,
    workspacePasswords,
    workspaceBookmarks,
    members,
    userRole,
    isOwner,
    isAdmin,
    isAuditor,
    canManageMembers,
    createInvite,
  } = useWorkspace();

  const [copiedInvite, setCopiedInvite] = React.useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = React.useState(false);

  const pathMatch = pathname?.match(/^(\/app\/workspace\/[^/]+)/);
  const basePath = pathMatch
    ? pathMatch[1]
    : activeWorkspace
    ? `/app/workspace/${activeWorkspace.id}`
    : "";

  const handleQuickInvite = async () => {
    if (!activeWorkspace) return;
    setIsGeneratingInvite(true);
    try {
      const invite = await createInvite(activeWorkspace.id);
      const url = `${window.location.origin}/invite/${invite.inviteToken}`;
      await navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 3000);
    } catch (err: any) {
      alert(err.message || "Could not generate invite link");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Workspace Banner */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {activeWorkspace ? activeWorkspace.name : "Team Workspace"}
            </h1>
            {isOwner ? (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono gap-1 inline-flex items-center"
              >
                <Crown className="size-3 text-amber-500" />
                <span>Owner</span>
              </Badge>
            ) : isAdmin ? (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono gap-1 inline-flex items-center"
              >
                <Shield className="size-3 text-emerald-500" />
                <span>Admin</span>
              </Badge>
            ) : isAuditor ? (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono gap-1 inline-flex items-center"
              >
                <Eye className="size-3 text-purple-500" />
                <span>Auditor (Read-Only)</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-sky-500/30 bg-sky-500/10 text-sky-500 font-mono gap-1 inline-flex items-center"
              >
                <User className="size-3 text-sky-500" />
                <span>Member</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {activeWorkspace?.description ||
              "Secure zero-knowledge workspace for sharing passwords, bookmarks, and team credentials."}
          </p>
        </div>

        {canManageMembers && (
          <Button
            size="sm"
            onClick={handleQuickInvite}
            disabled={isGeneratingInvite}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer shrink-0"
          >
            <Users className="size-3.5" />
            <span>{copiedInvite ? "Invite Link Copied!" : "Invite Member (Single-Use Link)"}</span>
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href={`${basePath}/passwords`}
          className="p-4 rounded-xl border border-border-subtle bg-background hover:border-primary/30 transition-all space-y-2 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Shared Passwords</span>
            <KeyRound className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{workspacePasswords.length}</p>
          <span className="text-[10px] text-primary flex items-center gap-1">
            <span>Manage passwords</span>
            <ArrowRight className="size-2.5" />
          </span>
        </Link>

        <Link
          href={`${basePath}/bookmarks`}
          className="p-4 rounded-xl border border-border-subtle bg-background hover:border-primary/30 transition-all space-y-2 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Shared Bookmarks</span>
            <BookmarkIcon className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{workspaceBookmarks.length}</p>
          <span className="text-[10px] text-primary flex items-center gap-1">
            <span>Manage bookmarks</span>
            <ArrowRight className="size-2.5" />
          </span>
        </Link>

        <Link
          href={`${basePath}/members`}
          className="p-4 rounded-xl border border-border-subtle bg-background hover:border-primary/30 transition-all space-y-2 block"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Team Members</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{members.length || 1}</p>
          <span className="text-[10px] text-primary flex items-center gap-1">
            <span>View team members</span>
            <ArrowRight className="size-2.5" />
          </span>
        </Link>
      </div>

      {/* Security & Access Info */}
      <div className="p-4 rounded-xl border border-border-subtle bg-surface/50 flex items-start gap-3">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">Zero-Knowledge Team Isolation</p>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            Items stored in this workspace are accessible exclusively by authorized members of{" "}
            <strong className="text-foreground">{activeWorkspace?.name}</strong>. Workspace credentials do not
            appear in members&apos; personal vaults, ensuring strict separation of personal and professional data.
          </p>
        </div>
      </div>
    </div>
  );
}

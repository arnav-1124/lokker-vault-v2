"use client";

import * as React from "react";
import {
  Users,
  ShieldCheck,
  User,
  Plus,
  Copy,
  Check,
  Link as LinkIcon,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/context/workspace-context";

export default function WorkspaceMembersPage() {
  const { activeWorkspace, members, userRole, createInvite } = useWorkspace();
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateInvite = async () => {
    if (!activeWorkspace) return;
    setIsGenerating(true);
    setError(null);
    try {
      const invite = await createInvite(activeWorkspace.id);
      const url = `${window.location.origin}/invite/${invite.inviteToken}`;
      setGeneratedLink(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyExisting = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>Team Members & Invitations</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage who has access to {activeWorkspace?.name || "this workspace"}.
          </p>
        </div>

        {userRole === "ADMIN" && (
          <Button
            size="sm"
            onClick={handleGenerateInvite}
            disabled={isGenerating}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>{isGenerating ? "Generating..." : "Generate Single-Use Invite"}</span>
          </Button>
        )}
      </div>

      {/* Generated Invite Box */}
      {generatedLink && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <LinkIcon className="size-3.5 text-primary" />
              <span>Active Invite Link (Single-Use Only)</span>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
              <Clock className="size-3 text-muted-foreground" />
              <span>Valid for 7 days</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedLink}
              className="h-8 text-xs font-mono bg-background border-border-subtle flex-1"
            />
            <Button
              size="sm"
              onClick={handleCopyExisting}
              className="h-8 text-xs gap-1.5 cursor-pointer shrink-0 font-medium"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Send this link to your team member. Each invite link is unique and can be used only once. If the user doesn&apos;t have an account, they can register when accepting.
          </p>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Members Table / List */}
      <div className="rounded-xl border border-border-subtle bg-surface/50 divide-y divide-border-subtle overflow-hidden">
        <div className="p-3 bg-muted/20 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Member</span>
          <span>Role & Access</span>
        </div>

        {members.length === 0 ? (
          <div className="p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <p className="font-semibold text-foreground">Workspace Creator</p>
                <p className="text-[10px] text-muted-foreground font-mono">Admin account</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 text-primary">
              Admin
            </Badge>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {member.name || member.email.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 font-medium ${
                    member.role === "ADMIN"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-muted/40 text-muted-foreground"
                  }`}
                >
                  {member.role === "ADMIN" ? "Admin" : "Member"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role explanation */}
      <div className="p-4 rounded-xl border border-border-subtle bg-surface/30 space-y-2 text-xs">
        <h3 className="font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" /> Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-muted-foreground">
          <div className="space-y-0.5 p-2 rounded-lg bg-background border border-border-subtle">
            <span className="font-semibold text-foreground">Workspace Admin</span>
            <p>Full control over workspace credentials, invite links, categories, and workspace deletion.</p>
          </div>
          <div className="space-y-0.5 p-2 rounded-lg bg-background border border-border-subtle">
            <span className="font-semibold text-foreground">Team Member</span>
            <p>Can view and utilize workspace credentials and categories. Workspace items stay inside this workspace.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

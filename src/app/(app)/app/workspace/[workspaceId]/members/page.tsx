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
  MoreVertical,
  Crown,
  Shield,
  UserMinus,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/context/workspace-context";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { getCloudSession } from "@/lib/auth-session";

export default function WorkspaceMembersPage() {
  const {
    activeWorkspace,
    members,
    userRole,
    isAdmin,
    isOwner,
    createInvite,
    updateMemberRole,
    removeMember,
    syncActiveWorkspace,
  } = useWorkspace();

  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Sync latest members from cloud on mount
  React.useEffect(() => {
    syncActiveWorkspace(true);
  }, [syncActiveWorkspace]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const session = getCloudSession();
  const currentUserId = session?.id;

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
      // Immediately refresh workspace state to guarantee DOM synchronization
      await syncActiveWorkspace(true);
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

  const handlePromoteToAdmin = (member: { userId: string; name?: string | null; email: string }) => {
    const displayName = member.name || member.email;
    setConfirmModal({
      isOpen: true,
      title: "Promote to Workspace Admin",
      message: `Are you sure you want to promote ${displayName} to Admin? They will have full permission to manage credentials, invite new members, and administer the workspace.`,
      confirmText: "Promote to Admin",
      isDestructive: false,
      onConfirm: async () => {
        try {
          await updateMemberRole(member.userId, "ADMIN");
          setActionSuccess(`Promoted ${displayName} to Workspace Admin`);
          setTimeout(() => setActionSuccess(null), 4000);
        } catch (err: any) {
          setError(err.message || "Failed to update role");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDemoteToMember = (member: { userId: string; name?: string | null; email: string }) => {
    const displayName = member.name || member.email;
    setConfirmModal({
      isOpen: true,
      title: "Demote to Team Member",
      message: `Demote ${displayName} to standard Team Member? They will retain access to view credentials but will lose administrative and invite privileges.`,
      confirmText: "Demote to Member",
      isDestructive: false,
      onConfirm: async () => {
        try {
          await updateMemberRole(member.userId, "MEMBER");
          setActionSuccess(`Demoted ${displayName} to Team Member`);
          setTimeout(() => setActionSuccess(null), 4000);
        } catch (err: any) {
          setError(err.message || "Failed to update role");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAssignAuditor = (member: { userId: string; name?: string | null; email: string }) => {
    const displayName = member.name || member.email;
    setConfirmModal({
      isOpen: true,
      title: "Assign Auditor Role (Read-Only)",
      message: `Set ${displayName}'s role to Auditor? They will have read-only access to view credentials, passwords, and security watchtower audits, and will be able to view activity logs and export compliance reports. They cannot add, edit, or delete any credentials.`,
      confirmText: "Assign Auditor Role",
      isDestructive: false,
      onConfirm: async () => {
        try {
          await updateMemberRole(member.userId, "AUDITOR");
          setActionSuccess(`Updated ${displayName}'s role to Auditor`);
          setTimeout(() => setActionSuccess(null), 4000);
        } catch (err: any) {
          setError(err.message || "Failed to update role");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRemoveMember = (member: { userId: string; name?: string | null; email: string }) => {
    const displayName = member.name || member.email;
    setConfirmModal({
      isOpen: true,
      title: "Remove Member from Workspace",
      message: `Are you sure you want to remove ${displayName} from ${activeWorkspace?.name || "this workspace"}? Their access to all shared passwords and bookmarks will be revoked immediately.`,
      confirmText: "Remove Member",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await removeMember(member.userId);
          setActionSuccess(`Removed ${displayName} from the workspace`);
          setTimeout(() => setActionSuccess(null), 4000);
        } catch (err: any) {
          setError(err.message || "Failed to remove member");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>Team Members & Permissions</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage roles, administrative privileges, and member access for{" "}
            <span className="text-foreground font-medium">
              {activeWorkspace?.name || "this workspace"}
            </span>
            .
          </p>
        </div>

        {isAdmin && (
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

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

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
          <span>Member ({members.length})</span>
          <span>Role & Actions</span>
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
            <Badge variant="outline" className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1 inline-flex items-center">
              <Crown className="size-3 text-amber-400" />
              <span>Owner</span>
            </Badge>
          </div>
        ) : (
          members.map((member) => {
            const isMemberOwner = member.userId === activeWorkspace?.adminUserId;
            const isSelf = member.userId === currentUserId;
            const canManageThisMember = isAdmin && !isMemberOwner && !isSelf;

            return (
              <div key={member.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {member.name || member.email.split("@")[0]}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Role Badge */}
                  {isMemberOwner ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 font-medium border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1 inline-flex items-center"
                    >
                      <Crown className="size-3 text-amber-400" />
                      <span>Owner</span>
                    </Badge>
                  ) : member.role === "ADMIN" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 inline-flex items-center"
                    >
                      <ShieldCheck className="size-3 text-emerald-400" />
                      <span>Admin</span>
                    </Badge>
                  ) : member.role === "AUDITOR" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 font-medium border-purple-500/40 bg-purple-500/10 text-purple-400 gap-1 inline-flex items-center"
                    >
                      <Eye className="size-3 text-purple-400" />
                      <span>Auditor (Read-Only)</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 font-medium border-sky-500/40 bg-sky-500/10 text-sky-400 gap-1 inline-flex items-center"
                    >
                      <User className="size-3 text-sky-400" />
                      <span>Member</span>
                    </Badge>
                  )}

                  {/* Actions Dropdown for Admins managing other members */}
                  {canManageThisMember && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 text-xs">
                        {member.role !== "ADMIN" && (
                          <DropdownMenuItem
                            onClick={() => handlePromoteToAdmin(member)}
                            className="cursor-pointer gap-2"
                          >
                            <Shield className="size-3.5 text-emerald-400" />
                            <span>Make Admin</span>
                          </DropdownMenuItem>
                        )}
                        {member.role !== "MEMBER" && (
                          <DropdownMenuItem
                            onClick={() => handleDemoteToMember(member)}
                            className="cursor-pointer gap-2"
                          >
                            <User className="size-3.5 text-sky-400" />
                            <span>Make Member</span>
                          </DropdownMenuItem>
                        )}
                        {member.role !== "AUDITOR" && (
                          <DropdownMenuItem
                            onClick={() => handleAssignAuditor(member)}
                            className="cursor-pointer gap-2"
                          >
                            <Eye className="size-3.5 text-purple-400" />
                            <span>Make Auditor (Read-Only)</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member)}
                          className="text-destructive focus:text-destructive cursor-pointer gap-2"
                        >
                          <UserMinus className="size-3.5" />
                          <span>Remove from Workspace</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role explanation */}
      <div className="p-4 rounded-xl border border-border-subtle bg-surface/30 space-y-2.5 text-xs">
        <h3 className="font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" /> 3-Tier Governance Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
          <div className="space-y-1 p-2.5 rounded-lg bg-background border border-amber-500/20">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Crown className="size-3" /> Workspace Owner
            </span>
            <p>Creator of the workspace. Cannot be demoted or removed. Sole authority to delete or transfer the workspace.</p>
          </div>
          <div className="space-y-1 p-2.5 rounded-lg bg-background border border-primary/20">
            <span className="font-semibold text-primary flex items-center gap-1">
              <ShieldCheck className="size-3" /> Workspace Admin
            </span>
            <p>Can manage credentials, create invite links, organize categories, view activity audit logs, and promote members.</p>
          </div>
          <div className="space-y-1 p-2.5 rounded-lg bg-background border border-border-subtle">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <User className="size-3" /> Team Member
            </span>
            <p>Can view and utilize workspace credentials and bookmarks with isolated per-user favorites.</p>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


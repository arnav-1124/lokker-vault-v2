"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Sparkles, Cloud, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";
import { useVaultUI } from "@/context/vault-ui-context";
import { AddWorkspaceModal } from "@/components/modals/add-workspace-modal";
import { getCloudSession } from "@/lib/auth-session";

export default function WorkspacesEntryPointPage() {
  const router = useRouter();
  const { workspaces, isLoading, isCloudActive, planQuota } = useWorkspace();
  const { setIsCloudSyncModalOpen } = useVaultUI();
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // If user has workspaces, auto-redirect to the first active workspace
  React.useEffect(() => {
    if (!isLoading && workspaces.length > 0) {
      const session = getCloudSession();
      const userId = session?.id || "me";
      router.replace(`/app/${userId}/workspace/${workspaces[0].id}`);
    }
  }, [isLoading, workspaces, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <span>Team Workspaces</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Collaborative, zero-knowledge credential sharing for teams and families.
          </p>
        </div>
      </div>

      {!isCloudActive ? (
        <div className="p-8 rounded-2xl border border-border-subtle bg-surface/50 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Cloud className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Lokker Cloud Account Required</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Team Workspaces are end-to-end encrypted and synchronize across all team members in real-time. Please sign in or connect a cloud account to get started.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCloudSyncModalOpen(true)}
            className="h-9 text-xs font-medium gap-1.5 cursor-pointer"
          >
            <Cloud className="size-3.5" />
            <span>Sign In to Lokker Cloud</span>
          </Button>
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading your workspaces...
        </div>
      ) : workspaces.length === 0 ? (
        <div className="p-8 rounded-2xl border border-border-subtle bg-surface/50 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Building2 className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Welcome to Team Workspaces</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You don&apos;t have any team workspaces yet. Create your first workspace to start securely sharing credentials with your team.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="h-9 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Create Your First Workspace</span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Feature Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
        <div className="p-4 rounded-xl border border-border-subtle bg-surface/30 space-y-1.5">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Zero-Knowledge Sharing</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Shared credentials never leak to personal vaults, keeping personal and team passwords strictly separate.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border-subtle bg-surface/30 space-y-1.5">
          <Building2 className="size-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Single-Use Invite Links</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Invite team members with unique, secure links that can only be claimed once by the intended recipient.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border-subtle bg-surface/30 space-y-1.5">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Dedicated Categories</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Organize team resources with independent categories tailored specifically to each project workspace.
          </p>
        </div>
      </div>

      <AddWorkspaceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

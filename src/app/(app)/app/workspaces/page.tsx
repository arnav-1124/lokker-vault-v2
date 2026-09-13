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

  // If user has workspaces AND is authenticated, auto-redirect to the first active workspace
  React.useEffect(() => {
    if (!isLoading && isCloudActive && workspaces.length > 0) {
      const session = getCloudSession();
      if (session?.accessToken) {
        const userId = session.id || "me";
        router.replace(`/app/${userId}/workspace/${workspaces[0].id}`);
      }
    }
  }, [isLoading, isCloudActive, workspaces, router]);

  // If user is signed out / not authenticated, show centered sign-in card
  if (!isCloudActive) {
    return (
      <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="p-8 md:p-10 rounded-2xl border border-border-subtle bg-surface/60 backdrop-blur-xs text-center space-y-5 max-w-md w-full shadow-lg">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
            <Cloud className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Sign In to Use Team Workspaces
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Team Workspaces provide zero-knowledge credential sharing and real-time synchronization. You must first sign in to your Lokker Cloud account to use this feature.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              size="lg"
              onClick={() => setIsCloudSyncModalOpen(true)}
              className="w-full h-10 text-xs font-semibold gap-2 shadow-xs cursor-pointer"
            >
              <Cloud className="size-4" />
              <span>First sign-in to use this feature</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/app")}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Return to Personal Vault
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      {isLoading ? (
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

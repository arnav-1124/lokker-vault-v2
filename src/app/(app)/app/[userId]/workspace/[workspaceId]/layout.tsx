"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/workspace-context";
import { useVaultUI } from "@/context/vault-ui-context";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";

export default function WorkspaceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isCloudActive, isLoading } = useWorkspace();
  const { setIsCloudSyncModalOpen } = useVaultUI();

  React.useEffect(() => {
    if (!isLoading && !isCloudActive) {
      router.replace("/app/workspaces");
    }
  }, [isLoading, isCloudActive, router]);

  if (!isLoading && !isCloudActive) {
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

  return <>{children}</>;
}

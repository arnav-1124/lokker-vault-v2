"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/workspace-context";
import { useVaultUI } from "@/context/vault-ui-context";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2 } from "lucide-react";
import { getCloudSession } from "@/lib/auth-session";

export default function WorkspaceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isCloudActive, isLoading } = useWorkspace();
  const { setIsCloudSyncModalOpen } = useVaultUI();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasSession = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!getCloudSession()?.accessToken;
  }, []);

  const isAuthenticated = isCloudActive || hasSession;

  React.useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace("/app/workspaces");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || (isLoading && !hasSession)) {
    return (
      <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading workspace environment...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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

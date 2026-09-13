"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspace } from "@/context/workspace-context";
import { Loader2 } from "lucide-react";
import { getCloudSession } from "@/lib/auth-session";

export default function WorkspaceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isCloudActive, isLoading } = useWorkspace();
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
      const redirect = pathname
        ? `/signup?redirect=${encodeURIComponent(pathname)}`
        : "/signup?redirect=/app/workspaces";
      router.replace(redirect);
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  if (!mounted || (isLoading && !hasSession) || !isAuthenticated) {
    return (
      <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>
            {isAuthenticated
              ? "Loading workspace environment..."
              : "Redirecting to authentication..."}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

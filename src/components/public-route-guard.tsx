"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "lokker_cloud_session";

interface PublicRouteGuardProps {
  children: React.ReactNode;
}

export function PublicRouteGuard({ children }: PublicRouteGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    try {
      const session = localStorage.getItem(STORAGE_KEY);
      if (session) {
        // Ensure cookie is in sync with localStorage
        document.cookie = "lokker_cloud_session=1; path=/; max-age=604800; SameSite=Lax";
        setIsAuthenticated(true);
        router.replace("/app");
      }
    } catch {
      // Ignore during SSR
    }
  }, [router]);

  if (isAuthenticated) {
    // Hide public content to prevent flash while redirecting to workspace
    return null;
  }

  return <>{children}</>;
}

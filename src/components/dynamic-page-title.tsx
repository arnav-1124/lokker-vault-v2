"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export const ROUTE_TITLES: Record<string, string> = {
  "/": "Local-First Zero-Knowledge Password Vault",
  "/app": "Dashboard",
  "/app/passwords": "Password Vault",
  "/app/bookmarks": "Bookmarks",
  "/app/favorites": "Favorites",
  "/app/totp": "2FA Authenticator",
  "/app/generator": "Password Generator",
  "/app/security-audit": "Security Audit",
  "/app/passkeys": "Passkeys",
  "/app/files": "File Vault",
  "/app/masked-emails": "Masked Emails",
  "/app/import-export": "Import & Export",
  "/app/extension": "Browser Extension",
  "/app/guide": "User Guide",
  "/app/settings": "Settings",
  "/app/workspaces": "Workspaces",
  "/app/why-to-pay": "Why Pay",
  "/login": "Sign In",
  "/signup": "Create Account",
  "/pricing": "Pricing",
  "/features": "Features",
  "/security": "Security Architecture",
  "/docs": "Documentation",
  "/download": "Download Extension",
  "/privacy": "Privacy Policy",
  "/why-to-pay": "Why Pay",
  "/design": "Design System",
};

/**
 * Returns a human-readable title for any given route path.
 */
export function getPageTitle(pathname: string): string {
  if (!pathname) return "Dashboard";

  // Normalize trailing slash (e.g. /app/ -> /app)
  const normalized =
    pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (ROUTE_TITLES[normalized]) {
    return ROUTE_TITLES[normalized];
  }

  // Workspace subroutes: /app/workspace/[id]/...
  if (normalized.includes("/workspace/")) {
    if (normalized.endsWith("/passwords") || normalized.endsWith("/password")) return "Workspace Passwords";
    if (normalized.endsWith("/bookmarks") || normalized.endsWith("/bookmark")) return "Workspace Bookmarks";
    if (normalized.endsWith("/members")) return "Workspace Members";
    if (normalized.endsWith("/activity")) return "Workspace Activity";
    if (normalized.endsWith("/settings")) return "Workspace Settings";
    return "Team Workspace";
  }

  // Invites: /invite/[token]
  if (normalized.startsWith("/invite/")) {
    return "Workspace Invite";
  }

  // Secret shares: /share/[id]
  if (normalized.startsWith("/share/")) {
    return "Encrypted Secret Share";
  }

  // Fallback: derive from trailing segment
  const segments = normalized.replace(/^\//, "").split("/");
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "Dashboard";
}

/**
 * Client component that dynamically synchronizes document.title
 * to `Lokker - <Page Name>` as the user navigates across pages.
 */
export function DynamicPageTitle() {
  const pathname = usePathname();

  React.useEffect(() => {
    const pageTitle = getPageTitle(pathname);
    document.title = `Lokker - ${pageTitle}`;
  }, [pathname]);

  return null;
}

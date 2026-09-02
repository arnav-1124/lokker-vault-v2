"use client";

/**
 * Navigation domain of the vault context: the URL is the single source of
 * truth for the active view. No mirror state — navigateTo pushes the route
 * and currentView re-derives from the pathname.
 */

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ViewMode } from "@/types";
import type { VaultNavigationContextType } from "./vault-types";

const VIEW_TO_PATH: Record<ViewMode, string> = {
  home: "/app",
  passwords: "/app/passwords",
  bookmarks: "/app/bookmarks",
  totp: "/app/totp",
  favorites: "/app/favorites",
  "security-audit": "/app/security-audit",
  generator: "/app/generator",
  "import-export": "/app/import-export",
  files: "/app/files",
  "masked-emails": "/app/masked-emails",
  extension: "/app/extension",
  guide: "/app/guide",
  settings: "/app/settings",
};

const PATH_TO_VIEW: Record<string, ViewMode> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([k, v]) => [v, k as ViewMode])
);

function viewFromPath(pathname: string): ViewMode {
  return PATH_TO_VIEW[pathname] || "home";
}

const VaultNavigationContext = React.createContext<VaultNavigationContextType | null>(null);

export function useVaultNavigation(): VaultNavigationContextType {
  const ctx = React.useContext(VaultNavigationContext);
  if (!ctx) throw new Error("useVaultNavigation must be used within VaultNavigationProvider");
  return ctx;
}

export function VaultNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentView = viewFromPath(pathname);

  const navigateTo = React.useCallback(
    (view: ViewMode) => {
      router.push(VIEW_TO_PATH[view]);
    },
    [router]
  );

  const value: VaultNavigationContextType = { currentView, navigateTo };

  return <VaultNavigationContext.Provider value={value}>{children}</VaultNavigationContext.Provider>;
}

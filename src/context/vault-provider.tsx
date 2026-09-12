"use client";

/**
 * Composition root of the vault context.
 *
 * The former 1200-line VaultProvider is split into focused domain
 * providers. Composition order follows the dependency direction:
 *
 *   UI (toasts, dialogs, modal state)
 *     -> Navigation (URL-derived view)
 *       -> Security (keys, lock state, settings, crypto flows)
 *         -> Data (bookmarks, categories, entry CRUD + sync semantics)
 *           -> Backup (export/import/restore/reset)
 *
 * `useVault()` returns the merged shape (VaultContextType) for backward
 * compatibility. New code can consume a narrow domain hook instead to
 * re-render only on changes it cares about.
 */

import * as React from "react";
import { VaultUIProvider, useVaultUI } from "./vault-ui-context";
import { VaultNavigationProvider, useVaultNavigation } from "./vault-navigation-context";
import { VaultSecurityProvider, useVaultSecurity } from "./vault-security-context";
import { VaultDataProvider, useVaultData } from "./vault-data-context";
import { VaultBackupProvider, useVaultBackup } from "./vault-backup-context";
import { getCloudSession, CLOUD_AUTH_CHANGE_EVENT } from "@/lib/auth-session";
import type { VaultContextType } from "./vault-types";

const VaultContext = React.createContext<VaultContextType | null>(null);

export function useVault(): VaultContextType {
  const ctx = React.useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}

function VaultContextBridge({ children }: { children: React.ReactNode }) {
  const ui = useVaultUI();
  const navigation = useVaultNavigation();
  const security = useVaultSecurity();
  const data = useVaultData();
  const backup = useVaultBackup();

  const [hasCloudSession, setHasCloudSession] = React.useState<boolean>(() => !!getCloudSession());

  React.useEffect(() => {
    const checkSession = () => {
      setHasCloudSession(!!getCloudSession());
    };
    checkSession();
    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, checkSession);
    window.addEventListener("storage", checkSession);
    return () => {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, checkSession);
      window.removeEventListener("storage", checkSession);
    };
  }, []);

  // When logged out of cloud, items marked as 'cloud' are hidden from the offline view
  // to preserve isolation between cloud account entries and local-only device entries.
  const visiblePasswords = React.useMemo(() => {
    if (hasCloudSession) return security.decryptedPasswords;
    return security.decryptedPasswords.filter((p) => p.storageScope !== "cloud");
  }, [hasCloudSession, security.decryptedPasswords]);

  const visibleBookmarks = React.useMemo(() => {
    if (hasCloudSession) return data.bookmarks;
    return data.bookmarks.filter((b) => b.storageScope !== "cloud");
  }, [hasCloudSession, data.bookmarks]);

  const value: VaultContextType = {
    ...navigation,
    ...ui,
    ...security,
    ...data,
    ...backup,
    decryptedPasswords: visiblePasswords,
    bookmarks: visibleBookmarks,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  return (
    <VaultUIProvider>
      <VaultNavigationProvider>
        <VaultSecurityProvider>
          <VaultDataProvider>
            <VaultBackupProvider>
              <VaultContextBridge>{children}</VaultContextBridge>
            </VaultBackupProvider>
          </VaultDataProvider>
        </VaultSecurityProvider>
      </VaultNavigationProvider>
    </VaultUIProvider>
  );
}

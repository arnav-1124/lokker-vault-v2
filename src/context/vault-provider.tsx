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

  const value: VaultContextType = { ...navigation, ...ui, ...security, ...data, ...backup };

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

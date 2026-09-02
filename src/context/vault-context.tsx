"use client";

/**
 * Backward-compatible façade for the split vault context.
 *
 * The former single-file VaultProvider now lives in focused domain files:
 * - vault-types.ts               — domain interfaces + merged VaultContextType
 * - vault-ui-context.tsx         — toasts, dialogs, modal visibility, shortcuts
 * - vault-navigation-context.tsx — URL-derived view state
 * - vault-security-context.tsx   — keys, lock state, settings, crypto flows
 * - vault-data-context.tsx       — bookmarks, categories, entry CRUD + sync
 * - vault-backup-context.tsx     — export/import/restore/reset
 * - vault-provider.tsx           — composition + merged useVault()
 *
 * Existing consumers keep importing `useVault` / `VaultProvider` from here.
 * New code may import a narrow domain hook (e.g. `useVaultUI`) directly.
 */

export { VaultProvider, useVault } from "./vault-provider";
export type { VaultContextType } from "./vault-types";
export {
  useVaultUI,
  useVaultNavigation,
  useVaultSecurity,
  useVaultData,
  useVaultBackup,
} from "./domain-hooks";

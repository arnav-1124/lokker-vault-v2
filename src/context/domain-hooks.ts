"use client";

/**
 * Convenience re-exports of the narrow domain hooks, so consumers can
 * subscribe to a single vault domain without reaching into each file.
 */

export { useVaultUI } from "./vault-ui-context";
export { useVaultNavigation } from "./vault-navigation-context";
export { useVaultSecurity } from "./vault-security-context";
export { useVaultData } from "./vault-data-context";
export { useVaultBackup } from "./vault-backup-context";

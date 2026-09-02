"use client";

/**
 * Security domain of the vault context: vault metadata, lock state, the
 * derived key, decrypted passwords, security policy settings, and every
 * crypto flow (unlock via password / recovery key / passkey, passkey
 * registration, master password rotation, recovery key rotation).
 *
 * NOTE: the master password is intentionally never kept in React state —
 * it exists only inside the unlock/setup handler scope. Backup export
 * re-asks for it through BackupPasswordModal and verifies it on submit.
 */

import * as React from "react";
import type { PasswordEntry, VaultMetadata, VaultSettings } from "@/types";
import {
  getVaultMeta,
  saveVaultMeta,
  getSettings,
  saveSettings,
} from "@/lib/db";
import {
  initializeEnvelopeVault,
  unwrapVekWithPassword,
  unwrapVekWithRecoveryKey,
  encryptPayloadWithVek,
  verifyMasterPassword,
  rotateMasterPassword,
  rotateRecoveryKey,
} from "@/lib/crypto";
import {
  registerWebAuthnCredential,
  authenticateWithWebAuthn,
  clearWebAuthnSlot,
} from "@/lib/webauthn";
import { INITIAL_DEMO_VAULT_ITEMS } from "@/lib/sampleData";
import { useVaultUI } from "./vault-ui-context";
import type { VaultSecurityContextType } from "./vault-types";

const VaultSecurityContext = React.createContext<VaultSecurityContextType | null>(null);

export function useVaultSecurity(): VaultSecurityContextType {
  const ctx = React.useContext(VaultSecurityContext);
  if (!ctx) throw new Error("useVaultSecurity must be used within VaultSecurityProvider");
  return ctx;
}

export function VaultSecurityProvider({ children }: { children: React.ReactNode }) {
  const { addToast, setIsMasterPasswordModalOpen } = useVaultUI();

  const [vaultMeta, setVaultMeta] = React.useState<VaultMetadata | null>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [derivedKey, setDerivedKey] = React.useState<CryptoKey | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = React.useState<PasswordEntry[]>([]);

  // Vault security policy settings
  const [settings, setSettingsState] = React.useState<VaultSettings>({
    autoLockMinutes: 15,
    requireConfirmationForAutofill: true,
    trustedDomains: ["github.com", "google.com", "notion.so", "vercel.com"],
  });

  // Initialize vault metadata + settings
  React.useEffect(() => {
    async function loadData() {
      try {
        const [meta, st] = await Promise.all([getVaultMeta(), getSettings()]);
        setVaultMeta(meta);
        setSettingsState(st);
        if (!meta || !meta.isInitialized) {
          setIsMasterPasswordModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to load vault metadata:", err);
      }
    }
    loadData();
  }, [setIsMasterPasswordModalOpen]);

  // Extension sync bridge
  React.useEffect(() => {
    if (vaultMeta && typeof window !== "undefined") {
      window.postMessage(
        { type: "LOKKER_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
        window.location.origin
      );
      window.postMessage(
        { type: "XEROX_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
        window.location.origin
      );
    }
  }, [vaultMeta]);

  // Extension ping listener
  React.useEffect(() => {
    const handleExtensionPing = (event: MessageEvent) => {
      if (
        event.data?.type === "LOKKER_EXTENSION_READY" ||
        event.data?.type === "XEROX_EXTENSION_READY" ||
        event.data?.type === "LOKKER_REQUEST_VAULT_SYNC"
      ) {
        if (vaultMeta) {
          window.postMessage(
            { type: "LOKKER_SYNC_VAULT", vaultMeta, encryptedVault: vaultMeta.encryptedVault },
            window.location.origin
          );
        }
      }
    };
    window.addEventListener("message", handleExtensionPing);
    return () => window.removeEventListener("message", handleExtensionPing);
  }, [vaultMeta]);

  const lockVault = React.useCallback(() => {
    setIsUnlocked(false);
    setDerivedKey(null);
    setDecryptedPasswords([]);
    if (typeof window !== "undefined") {
      window.postMessage({ type: "LOKKER_VAULT_LOCKED" }, window.location.origin);
      window.postMessage({ type: "XEROX_VAULT_LOCKED" }, window.location.origin);
    }
    addToast("Password Vault locked.", "info");
  }, [addToast]);

  // Auto-lock timer
  React.useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes === 0) return;
    const timer = setTimeout(() => lockVault(), settings.autoLockMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isUnlocked, settings.autoLockMinutes, lockVault]);

  const handleMasterPasswordSubmit = async (
    password: string,
    isSetup: boolean,
    recoveryKey?: string
  ): Promise<boolean> => {
    if (isSetup) {
      if (!recoveryKey) return false;
      try {
        const { meta, vek } = await initializeEnvelopeVault(password, recoveryKey, INITIAL_DEMO_VAULT_ITEMS);
        await saveVaultMeta(meta);
        setVaultMeta(meta);
        setDerivedKey(vek);
        setDecryptedPasswords(INITIAL_DEMO_VAULT_ITEMS);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);
        addToast("Local vault initialized with 3-tier AES-GCM envelope encryption!", "success");
        return true;
      } catch (err) {
        console.error("Setup error:", err);
        return false;
      }
    } else {
      if (!vaultMeta || !vaultMeta.encryptedVault) return false;
      try {
        const { vek, migratedMeta, passwords } = await unwrapVekWithPassword(password, vaultMeta);
        if (migratedMeta) {
          await saveVaultMeta(migratedMeta);
          setVaultMeta(migratedMeta);
        }
        setDerivedKey(vek);
        setDecryptedPasswords(passwords);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);
        addToast("Password Vault unlocked.", "success");
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleUnlockWithRecoveryKey = async (recoveryKey: string): Promise<boolean> => {
    if (!vaultMeta) return false;
    try {
      const { vek, passwords } = await unwrapVekWithRecoveryKey(recoveryKey, vaultMeta);
      setDerivedKey(vek);
      setDecryptedPasswords(passwords);
      setIsUnlocked(true);
      setIsMasterPasswordModalOpen(false);
      addToast("Vault unlocked with Emergency Recovery Key!", "success");
      return true;
    } catch {
      return false;
    }
  };

  const handleUnlockWithWebAuthn = async (): Promise<boolean> => {
    if (!vaultMeta) return false;
    try {
      const { vek, passwords } = await authenticateWithWebAuthn(vaultMeta);
      setDerivedKey(vek);
      setDecryptedPasswords(passwords);
      setIsUnlocked(true);
      setIsMasterPasswordModalOpen(false);
      addToast("Vault unlocked with Passkey!", "success");
      return true;
    } catch (err) {
      // Surface the specific failure reason (e.g. missing PRF support) to the
      // unlock modal instead of a generic "authentication failed".
      throw err instanceof Error ? err : new Error("Passkey unlock failed.");
    }
  };

  const handleRegisterWebAuthn = async () => {
    if (!derivedKey || !vaultMeta) throw new Error("Vault must be unlocked to register a passkey.");
    const result = await registerWebAuthnCredential(derivedKey);
    const updatedMeta: VaultMetadata = {
      ...vaultMeta,
      webauthnCredentialId: result.credentialIdBase64,
      webauthnUserHandle: result.userHandleBase64,
      webauthnSalt: result.saltBase64,
      wrappedVekByWebAuthn: result.wrappedSlot,
      webauthnVerifier: result.verifier,
    };
    await saveVaultMeta(updatedMeta);
    setVaultMeta(updatedMeta);
    addToast("Passkey registered successfully. You can now unlock with biometrics.", "success");
  };

  const handleUnregisterWebAuthn = async () => {
    if (!vaultMeta) throw new Error("No vault metadata found.");
    const cleanedMeta = clearWebAuthnSlot(vaultMeta);
    await saveVaultMeta(cleanedMeta);
    setVaultMeta(cleanedMeta);
    addToast("Passkey removed. Biometric unlock is no longer available.", "info");
  };

  // ==========================================
  // Account Recovery (master password rotation / recovery key)
  // ==========================================

  const handleVerifyMasterPassword = async (password: string): Promise<boolean> => {
    if (!vaultMeta?.salt || !vaultMeta.verifier) return false;
    return verifyMasterPassword(password, vaultMeta.salt, vaultMeta.verifier);
  };

  const handleChangeMasterPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!vaultMeta?.salt || !vaultMeta.verifier || !isUnlocked || !derivedKey) return false;
    const isValid = await verifyMasterPassword(currentPassword, vaultMeta.salt, vaultMeta.verifier);
    if (!isValid) return false;
    try {
      const { updatedMeta, vek } = await rotateMasterPassword(currentPassword, newPassword, vaultMeta);
      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
      setDerivedKey(vek);
      addToast("Master password changed. Use the new password to unlock from now on.", "success");
      return true;
    } catch {
      addToast("Failed to change the master password.", "error");
      return false;
    }
  };

  const handleRegenerateRecoveryKey = async (newRecoveryKey: string): Promise<boolean> => {
    if (!vaultMeta || !isUnlocked || !derivedKey) return false;
    try {
      const updatedMeta = await rotateRecoveryKey(newRecoveryKey, derivedKey, vaultMeta);
      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
      addToast("Emergency Recovery Key regenerated. The previous key no longer works.", "success");
      return true;
    } catch {
      addToast("Failed to regenerate the recovery key.", "error");
      return false;
    }
  };

  // ==========================================
  // Re-encrypt helper (shared with the data layer)
  // ==========================================

  const saveAndEncryptPasswords = async (newPasswords: PasswordEntry[]) => {
    setDecryptedPasswords(newPasswords);
    if (!derivedKey || !vaultMeta || !vaultMeta.encryptedVault) return;
    try {
      const { cipherText, iv } = await encryptPayloadWithVek(newPasswords, derivedKey);
      const updatedMeta: VaultMetadata = {
        ...vaultMeta,
        encryptedVault: {
          ...vaultMeta.encryptedVault,
          cipherText,
          iv,
          version: 2,
          updatedAt: Date.now(),
        },
      };
      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
    } catch {
      addToast("Failed to re-encrypt vault data.", "error");
    }
  };

  const updateSettings = async (s: VaultSettings) => {
    setSettingsState(s);
    await saveSettings(s);
  };

  const value: VaultSecurityContextType = {
    vaultMeta, isUnlocked, derivedKey, decryptedPasswords,
    settings, updateSettings, setSettingsState,
    setVaultMeta, setIsUnlocked, setDerivedKey, setDecryptedPasswords,
    lockVault,
    handleMasterPasswordSubmit, handleUnlockWithRecoveryKey, handleUnlockWithWebAuthn,
    handleRegisterWebAuthn, handleUnregisterWebAuthn,
    handleVerifyMasterPassword, handleChangeMasterPassword, handleRegenerateRecoveryKey,
    saveAndEncryptPasswords,
  };

  return <VaultSecurityContext.Provider value={value}>{children}</VaultSecurityContext.Provider>;
}

import { describe, it, expect } from "vitest";
import {
  generateRecoveryKey,
  initializeEnvelopeVault,
  verifyMasterPassword,
  rotateMasterPassword,
  resetMasterPasswordWithRecoveryKey,
  unwrapVekWithPassword,
  unwrapVekWithRecoveryKey,
} from "../lib/crypto";
import { INITIAL_DEMO_VAULT_ITEMS } from "../lib/sampleData";

describe("Unified Master Password Strategy — All Scenarios & Invariants", () => {
  // Scenario 1: Local Vault Exists -> User Attempts Signup with Different Password
  it("Scenario 1A: Strictly rejects signup if password does not match existing local Master Password", async () => {
    const localMasterPassword = "MyLocalVaultPass123!";
    const recoveryKey = generateRecoveryKey();

    // 1. User set up a local vault first
    const { meta: localMeta } = await initializeEnvelopeVault(
      localMasterPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // 2. User goes to /signup and tries to enter a different password
    const attemptedDifferentPass = "DifferentCloudPass456!";
    const isMatching = await verifyMasterPassword(
      attemptedDifferentPass,
      localMeta.salt,
      localMeta.verifier!
    );

    // MUST be rejected! Cannot register cloud with different credentials
    expect(isMatching).toBe(false);
  });

  it("Scenario 1B: Accepts signup when password matches existing local Master Password exactly", async () => {
    const localMasterPassword = "MyLocalVaultPass123!";
    const recoveryKey = generateRecoveryKey();

    const { meta: localMeta } = await initializeEnvelopeVault(
      localMasterPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // User enters identical master password
    const isMatching = await verifyMasterPassword(
      localMasterPassword,
      localMeta.salt,
      localMeta.verifier!
    );

    expect(isMatching).toBe(true);

    // Both local vault and cloud account now share this identical password
    const { passwords } = await unwrapVekWithPassword(localMasterPassword, localMeta);
    expect(passwords.length).toBeGreaterThan(0);
  });

  it("Scenario 1C: Allows resetting local Master Password via Recovery Key if forgotten during signup", async () => {
    const forgottenOldPassword = "OldForgottenPass123!";
    const recoveryKey = generateRecoveryKey();
    const newChosenPassword = "NewChosenUnifiedPass789!";

    // 1. Initial vault with old forgotten password
    const { meta: initialMeta } = await initializeEnvelopeVault(
      forgottenOldPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // 2. User resets vault using Recovery Key
    const { updatedMeta } = await resetMasterPasswordWithRecoveryKey(
      recoveryKey,
      newChosenPassword,
      initialMeta
    );

    // 3. Old password is dead
    const oldMatches = await verifyMasterPassword(
      forgottenOldPassword,
      updatedMeta.salt,
      updatedMeta.verifier!
    );
    expect(oldMatches).toBe(false);

    // 4. New password is verified and un-locks vault
    const newMatches = await verifyMasterPassword(
      newChosenPassword,
      updatedMeta.salt,
      updatedMeta.verifier!
    );
    expect(newMatches).toBe(true);

    const { passwords } = await unwrapVekWithPassword(newChosenPassword, updatedMeta);
    expect(passwords).toHaveLength(INITIAL_DEMO_VAULT_ITEMS.length);
  });

  // Scenario 2: Cloud-First Start
  it("Scenario 2: Cloud-first registration silently sets up local vault with identical master password & recovery key", async () => {
    const cloudSignupPassword = "CloudFirstPass2026!";
    const recoveryKey = generateRecoveryKey();

    // Client initializes local vault with the signup password
    const { meta } = await initializeEnvelopeVault(
      cloudSignupPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // Verifies that auto-lock inactivity timer unlock works with the signup password
    const canUnlock = await verifyMasterPassword(cloudSignupPassword, meta.salt, meta.verifier!);
    expect(canUnlock).toBe(true);

    const { passwords } = await unwrapVekWithPassword(cloudSignupPassword, meta);
    expect(passwords).toHaveLength(INITIAL_DEMO_VAULT_ITEMS.length);

    // Recovery key can also unlock
    const { passwords: recUnlocked } = await unwrapVekWithRecoveryKey(recoveryKey, meta);
    expect(recUnlocked).toHaveLength(INITIAL_DEMO_VAULT_ITEMS.length);
  });

  // Scenario 3: Master Password Rotation in Settings with Old Password
  it("Scenario 3: Changing Master Password re-keys local vault under new password", async () => {
    const originalPassword = "OriginalUnifiedPass!1";
    const newPassword = "RotatedUnifiedPass!2";
    const recoveryKey = generateRecoveryKey();

    const { meta: initialMeta } = await initializeEnvelopeVault(
      originalPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // Rotate master password
    const { updatedMeta } = await rotateMasterPassword(originalPassword, newPassword, initialMeta);

    // Old password fails
    expect(await verifyMasterPassword(originalPassword, updatedMeta.salt, updatedMeta.verifier!)).toBe(false);

    // New password succeeds
    expect(await verifyMasterPassword(newPassword, updatedMeta.salt, updatedMeta.verifier!)).toBe(true);

    const { passwords } = await unwrapVekWithPassword(newPassword, updatedMeta);
    expect(passwords).toHaveLength(INITIAL_DEMO_VAULT_ITEMS.length);
  });

  // Scenario 4: Master Password Reset in Settings with Recovery Key
  it("Scenario 4: Resetting Master Password with Recovery Key keeps vault items and recovery key valid", async () => {
    const originalPassword = "InitialPasswordToForget!1";
    const newPassword = "ResetWithKeyPassword!2";
    const recoveryKey = generateRecoveryKey();

    const { meta: initialMeta } = await initializeEnvelopeVault(
      originalPassword,
      recoveryKey,
      INITIAL_DEMO_VAULT_ITEMS
    );

    // Reset with recovery key
    const { updatedMeta } = await resetMasterPasswordWithRecoveryKey(recoveryKey, newPassword, initialMeta);

    // Verify old password is invalid
    expect(await verifyMasterPassword(originalPassword, updatedMeta.salt, updatedMeta.verifier!)).toBe(false);

    // Verify new password is valid
    expect(await verifyMasterPassword(newPassword, updatedMeta.salt, updatedMeta.verifier!)).toBe(true);

    // Verify recovery key is still valid
    const { passwords } = await unwrapVekWithRecoveryKey(recoveryKey, updatedMeta);
    expect(passwords).toHaveLength(INITIAL_DEMO_VAULT_ITEMS.length);
  });
});

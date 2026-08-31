import { describe, it, expect } from "vitest";
import {
  deriveKeyFromPassword,
  encryptPayload,
  decryptPayload,
  calculatePasswordStrength,
  generateSecurePassword,
  generateMemorablePassphrase,
  generateRecoveryKey,
  formatRecoveryKey,
  parseRecoveryKey,
  initializeEnvelopeVault,
  unwrapVekWithPassword,
  unwrapVekWithRecoveryKey,
  rotateMasterPassword,
  encryptFileWithVek,
  decryptFileWithVek,
  encryptPayloadWithVek,
  decryptPayloadWithVek,
} from "../lib/crypto";
import { PasswordEntry, VaultMetadata } from "../types";

describe("Web Crypto API Primitives & Foundations", () => {
  it("generates a valid formatted 32-character recovery key", () => {
    const key = generateRecoveryKey();
    expect(key).toMatch(
      /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/
    );
    const parsed = parseRecoveryKey(key);
    expect(parsed.length).toBe(32);
  });

  it("formats arbitrary raw hex recovery input with hyphens", () => {
    const raw = "A1B2C3D4E5F67890123456789ABCDEF0";
    const formatted = formatRecoveryKey(raw);
    expect(formatted).toBe("A1B2-C3D4-E5F6-7890-1234-5678-9ABC-DEF0");
  });

  it("evaluates password strength scoring accurately", () => {
    const weak = calculatePasswordStrength("12345");
    expect(weak.label).toBe("Weak");
    expect(weak.score).toBeLessThanOrEqual(40);

    const strong = calculatePasswordStrength("K#9x$mP!2@vLq&Z7");
    expect(strong.label).toBe("Very Strong");
    expect(strong.score).toBeGreaterThanOrEqual(80);
  });

  it("generates secure random passwords satisfying constraints", () => {
    const pwd = generateSecurePassword({
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    expect(pwd.length).toBe(24);
  });

  it("generates memorable passphrases with custom word counts", () => {
    const phrase = generateMemorablePassphrase(5);
    const parts = phrase.split("-");
    expect(parts.length).toBe(6); // 5 words + 1 numeric suffix
  });
});

describe("P0 Cryptographic Architecture & Regression Suite", () => {
  const sampleItems: PasswordEntry[] = [
    {
      id: "pwd-1",
      websiteName: "GitHub",
      websiteUrl: "https://github.com",
      username: "alex",
      password: "SuperSecretGitHubPassword!1",
      category: "Development",
      isFavorite: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    },
    {
      id: "pwd-2",
      websiteName: "ProtonMail",
      websiteUrl: "https://proton.me",
      username: "alex.sec@proton.me",
      password: "EncryptedEmailPass!2026",
      category: "Personal",
      isFavorite: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    },
  ];

  // 1. Recovery Key unlocks an existing vault.
  it("1. Recovery Key unlocks an existing vault", async () => {
    const masterPass = "OriginalPassword#2026";
    const recoveryKey = generateRecoveryKey();

    const { meta } = await initializeEnvelopeVault(masterPass, recoveryKey, sampleItems);

    // Attempt unlock using only the recovery key
    const { vek, passwords } = await unwrapVekWithRecoveryKey(recoveryKey, meta);
    expect(vek).toBeDefined();
    expect(passwords).toHaveLength(2);
    expect(passwords[0].websiteName).toBe("GitHub");
    expect(passwords[0].password).toBe("SuperSecretGitHubPassword!1");
    expect(passwords[1].websiteName).toBe("ProtonMail");
  });

  // 2. Password and Recovery Key unwrap the same VEK.
  it("2. Password and Recovery Key unwrap the same VEK", async () => {
    const masterPass = "MultiAccessPass!99";
    const recoveryKey = generateRecoveryKey();

    const { meta } = await initializeEnvelopeVault(masterPass, recoveryKey, sampleItems);

    const { vek: vekFromPassword } = await unwrapVekWithPassword(masterPass, meta);
    const { vek: vekFromRecovery } = await unwrapVekWithRecoveryKey(recoveryKey, meta);

    // Export raw key bytes and compare
    const rawPassKey = await crypto.subtle.exportKey("raw", vekFromPassword);
    const rawRecKey = await crypto.subtle.exportKey("raw", vekFromRecovery);

    expect(new Uint8Array(rawPassKey)).toEqual(new Uint8Array(rawRecKey));

    // Decrypting data encrypted by vekFromPassword with vekFromRecovery must succeed
    const testSecret = { msg: "Cross-key unwrap verified" };
    const { cipherText, iv } = await encryptPayloadWithVek(testSecret, vekFromPassword);
    const decrypted = await decryptPayloadWithVek<typeof testSecret>(cipherText, iv, vekFromRecovery);
    expect(decrypted.msg).toBe("Cross-key unwrap verified");
  });

  // 3. Password rotation doesn't re-encrypt the vault payload.
  it("3. Password rotation doesn't re-encrypt the vault payload", async () => {
    const oldPassword = "OldPassword#2026";
    const newPassword = "NewStrongerPassword!2027";
    const recoveryKey = generateRecoveryKey();

    const { meta: initialMeta } = await initializeEnvelopeVault(
      oldPassword,
      recoveryKey,
      sampleItems
    );

    const initialCipherText = initialMeta.encryptedVault?.cipherText;
    const initialIv = initialMeta.encryptedVault?.iv;

    // Rotate master password
    const { updatedMeta, vek: rotatedVek } = await rotateMasterPassword(
      oldPassword,
      newPassword,
      initialMeta
    );

    // Payload ciphertext and IV must remain strictly identical
    expect(updatedMeta.encryptedVault?.cipherText).toBe(initialCipherText);
    expect(updatedMeta.encryptedVault?.iv).toBe(initialIv);

    // Old password fails
    await expect(unwrapVekWithPassword(oldPassword, updatedMeta)).rejects.toThrow();

    // New password succeeds and unwraps the same payload
    const { passwords: newPassItems } = await unwrapVekWithPassword(newPassword, updatedMeta);
    expect(newPassItems).toEqual(sampleItems);

    // Recovery Key still unwraps the same payload without modification
    const { passwords: recItems } = await unwrapVekWithRecoveryKey(recoveryKey, updatedMeta);
    expect(recItems).toEqual(sampleItems);
  });

  // 4. File contents are encrypted at rest.
  it("4. File contents are encrypted at rest with VEK", async () => {
    const masterPass = "FileVaultMaster!2026";
    const recoveryKey = generateRecoveryKey();

    const { vek } = await initializeEnvelopeVault(masterPass, recoveryKey, sampleItems);

    const plaintextDoc = "data:application/pdf;base64,JVBERi0xLjQKJVRPUF9TRUNSRVRfRE9DVU1FTlRfMjAyNg==";
    const { cipherText, iv } = await encryptFileWithVek(plaintextDoc, vek);

    // Ciphertext must not contain any plaintext string or header
    expect(cipherText).toBeTruthy();
    expect(cipherText).not.toContain("TOP_SECRET");
    expect(cipherText).not.toBe(plaintextDoc);

    // Decrypting with VEK restores exact document
    const decryptedDoc = await decryptFileWithVek(cipherText, iv, vek);
    expect(decryptedDoc).toBe(plaintextDoc);
  });

  // 5. Tampering with encrypted file data fails authentication.
  it("5. Tampering with encrypted file data fails authentication", async () => {
    const masterPass = "IntegrityPass!2026";
    const recoveryKey = generateRecoveryKey();

    const { vek } = await initializeEnvelopeVault(masterPass, recoveryKey, sampleItems);

    const plaintextDoc = "data:text/plain;base64,U2VjcmV0IFBheWxvYWQ=";
    const { cipherText, iv } = await encryptFileWithVek(plaintextDoc, vek);

    // Tamper with 1 byte of the ciphertext
    const rawBuffer = atob(cipherText);
    const tamperedBytes = new Uint8Array(rawBuffer.length);
    for (let i = 0; i < rawBuffer.length; i++) {
      tamperedBytes[i] = rawBuffer.charCodeAt(i);
    }
    tamperedBytes[0] = tamperedBytes[0] ^ 0xff; // flip byte

    let binary = "";
    for (let i = 0; i < tamperedBytes.length; i++) {
      binary += String.fromCharCode(tamperedBytes[i]);
    }
    const tamperedCipherText = btoa(binary);

    // AES-GCM authentication tag mismatch must throw an error
    await expect(decryptFileWithVek(tamperedCipherText, iv, vek)).rejects.toThrow();
  });

  // 6. Existing vault data survives migration.
  it("6. Existing vault data survives migration from V1 (direct KEK) to V2 (3-tier envelope)", async () => {
    const password = "LegacyVaultPassword!2025";
    const salt = "dGVzdC1sZWdhY3ktc2FsdA==";

    // Create legacy V1 vault (direct KEK encryption)
    const legacyKey = await deriveKeyFromPassword(password, salt);
    const { cipherText, iv } = await encryptPayload(sampleItems, legacyKey, salt);

    const legacyMeta: VaultMetadata = {
      isInitialized: true,
      version: 1, // Legacy V1
      salt,
      encryptedVault: {
        cipherText,
        iv,
        salt,
        version: 1,
        updatedAt: 1700000000000,
      },
    };

    // Unwrapping V1 vault triggers automatic transparent migration to V2
    const { vek, migratedMeta, passwords } = await unwrapVekWithPassword(password, legacyMeta);

    expect(passwords).toHaveLength(2);
    expect(passwords[0].websiteName).toBe("GitHub");
    expect(migratedMeta).toBeDefined();
    expect(migratedMeta?.version).toBe(2);
    expect(migratedMeta?.wrappedVekByPassword).toBeDefined();
    expect(migratedMeta?.wrappedVekByRecoveryKey).toBeDefined();

    // Now unlocked with migrated V2 metadata
    const secondUnlock = await unwrapVekWithPassword(password, migratedMeta!);
    expect(secondUnlock.passwords).toHaveLength(2);
  });

  // 7. Normal password unlock still works.
  it("7. Normal password unlock still works", async () => {
    const password = "StandardUserPass!2026";
    const recoveryKey = generateRecoveryKey();

    const { meta } = await initializeEnvelopeVault(password, recoveryKey, sampleItems);

    // Correct password unlocks
    const { vek, passwords } = await unwrapVekWithPassword(password, meta);
    expect(vek).toBeDefined();
    expect(passwords).toHaveLength(2);

    // Incorrect password throws error
    await expect(unwrapVekWithPassword("WrongPassword!2026", meta)).rejects.toThrow();
  });
});

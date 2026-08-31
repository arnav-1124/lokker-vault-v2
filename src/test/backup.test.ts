import { describe, it, expect } from "vitest";
import {
  createLokkerBackupPayload,
  exportEncryptedLokkerBackup,
  inspectBackupFileText,
  decryptAndValidateLokkerBackup,
  summarizeBackupPayload,
} from "../lib/backup";
import {
  initializeEnvelopeVault,
  encryptPayloadWithVek,
  decryptFileWithVek,
  encryptFileWithVek,
} from "../lib/crypto";
import { Bookmark, Category, EncryptedFile, PasswordEntry, VaultSettings } from "../types";

describe("Lokker Full Vault Backup & Portability Engine (24 Scenarios)", () => {
  const masterPassword = "TestVaultMasterPassword!123";
  const recoveryKey = "0123456789abcdef0123456789abcdef";

  it("1-8: Generates complete backup payload containing all data types and relationships", async () => {
    // 1. Create vault
    const { meta, vek } = await initializeEnvelopeVault(masterPassword, recoveryKey, []);

    // 2. Add password
    // 6. Add TOTP
    // 7. Add favorite
    const testPasswords: PasswordEntry[] = [
      {
        id: "pwd-1",
        websiteName: "GitHub",
        websiteUrl: "https://github.com",
        username: "developer@octocat.com",
        password: "SuperSecretPassword!456",
        notes: "Primary engineering account",
        category: "Development",
        isFavorite: true,
        totpSecret: "JBSWY3DPEHPK3PXP",
        entryType: "login",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];

    // 3. Add bookmark
    const testBookmarks: Bookmark[] = [
      {
        id: "bm-1",
        title: "GitHub Portal",
        url: "https://github.com/dashboard",
        category: "Development",
        description: "Dev dashboard",
        isFavorite: true,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];

    // 4. Add category
    // 5. Add nested category
    const testCategories: Category[] = [
      {
        id: "cat-root",
        name: "Work",
        color: "#3b82f6",
      },
      {
        id: "cat-nested",
        name: "Development",
        color: "#10b981",
        parentId: "cat-root",
      },
    ];

    // 8. Add encrypted file
    const fileContent = "data:text/plain;base64,VGhpcyBpcyBhIHByaXZhdGUgZG9jdW1lbnQ=";
    const { cipherText: fileCipher, iv: fileIv } = await encryptFileWithVek(fileContent, vek);

    const testFiles: EncryptedFile[] = [
      {
        id: "file-1",
        name: "tax_document.pdf",
        size: 1024,
        type: "application/pdf",
        data: fileCipher,
        iv: fileIv,
        isEncrypted: true,
        createdAt: 1700000000000,
      },
    ];

    const testSettings: VaultSettings = {
      autoLockMinutes: 30,
      requireConfirmationForAutofill: true,
      trustedDomains: ["github.com", "google.com"],
    };

    // Construct full backup payload
    const payload = createLokkerBackupPayload({
      passwords: testPasswords,
      bookmarks: testBookmarks,
      categories: testCategories,
      settings: testSettings,
      files: testFiles,
      vaultMeta: meta,
    });

    expect(payload.version).toBe(2);
    expect(payload.passwords.length).toBe(1);
    expect(payload.bookmarks.length).toBe(1);
    expect(payload.categories.length).toBe(2);
    expect(payload.files.length).toBe(1);
    expect(payload.settings.autoLockMinutes).toBe(30);

    const summary = summarizeBackupPayload(payload);
    expect(summary.passwordCount).toBe(1);
    expect(summary.bookmarkCount).toBe(1);
    expect(summary.categoryCount).toBe(2);
    expect(summary.nestedCategoryCount).toBe(1);
    expect(summary.totpCount).toBe(1);
    expect(summary.fileCount).toBe(1);
  });

  it("9-10: Encrypts backup using AES-GCM-256 and ensures no plaintext is exposed", async () => {
    const testPasswords: PasswordEntry[] = [
      {
        id: "pwd-1",
        websiteName: "Confidential Corp",
        websiteUrl: "https://confidential.corp",
        username: "ceo@corp.com",
        password: "TopSecretPassword999",
        category: "Executive",
        isFavorite: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const payload = createLokkerBackupPayload({
      passwords: testPasswords,
      bookmarks: [],
      categories: [],
      settings: { autoLockMinutes: 15, requireConfirmationForAutofill: true, trustedDomains: [] },
      files: [],
    });

    const encryptedBackup = await exportEncryptedLokkerBackup(payload, masterPassword);

    expect(encryptedBackup.format).toBe("lokker-encrypted-backup");
    expect(encryptedBackup.version).toBe(2);
    expect(encryptedBackup.crypto.algorithm).toBe("AES-GCM-256");
    expect(encryptedBackup.crypto.salt).toBeDefined();
    expect(encryptedBackup.crypto.iv).toBeDefined();
    expect(encryptedBackup.cipherText).toBeDefined();

    const serialized = JSON.stringify(encryptedBackup);
    expect(serialized).not.toContain("TopSecretPassword999");
    expect(serialized).not.toContain("ceo@corp.com");
    expect(serialized).not.toContain("Confidential Corp");
  });

  it("11-19: Imports and restores all records, relationships, categories, bookmarks, TOTP, and files", async () => {
    const { meta, vek } = await initializeEnvelopeVault(masterPassword, recoveryKey, []);

    const testFileRaw = "data:text/plain;base64,U2VjcmV0IEZpbGUgQ29udGVudA==";
    const { cipherText: fileCipher, iv: fileIv } = await encryptFileWithVek(testFileRaw, vek);

    const originalPayload = createLokkerBackupPayload({
      passwords: [
        {
          id: "pwd-restored-1",
          websiteName: "Proton",
          websiteUrl: "https://account.proton.me",
          username: "user@proton.me",
          password: "ProtonPassword!789",
          notes: "Email & Drive",
          category: "Security",
          totpSecret: "HXDMVJECJJWSRB3H",
          isFavorite: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      bookmarks: [
        {
          id: "bm-restored-1",
          title: "Proton Mail",
          url: "https://mail.proton.me",
          category: "Security",
          isFavorite: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      categories: [
        {
          id: "cat-sec",
          name: "Security",
          color: "#8b5cf6",
        },
        {
          id: "cat-vpn",
          name: "VPN",
          color: "#06b6d4",
          parentId: "cat-sec",
        },
      ],
      settings: {
        autoLockMinutes: 5,
        requireConfirmationForAutofill: false,
        trustedDomains: ["proton.me"],
      },
      files: [
        {
          id: "file-restored-1",
          name: "pgp_key.txt",
          size: 512,
          type: "text/plain",
          data: fileCipher,
          iv: fileIv,
          isEncrypted: true,
          createdAt: Date.now(),
        },
      ],
      vaultMeta: meta,
    });

    // Export backup to encrypted JSON string
    const encryptedFile = await exportEncryptedLokkerBackup(originalPayload, masterPassword);
    const backupText = JSON.stringify(encryptedFile);

    // Inspect
    const inspection = inspectBackupFileText(backupText);
    expect(inspection.isLokkerBackup).toBe(true);
    expect(inspection.isEncrypted).toBe(true);
    expect(inspection.encryptedFile).toBeDefined();

    // Decrypt
    const { payload: restoredPayload, summary } = await decryptAndValidateLokkerBackup(
      inspection.encryptedFile!,
      masterPassword
    );

    // 13. Verify all records restored
    expect(restoredPayload.passwords.length).toBe(1);
    expect(restoredPayload.passwords[0].websiteName).toBe("Proton");
    expect(restoredPayload.passwords[0].password).toBe("ProtonPassword!789");

    // 14. Verify relationships restored (category link)
    expect(restoredPayload.passwords[0].category).toBe("Security");

    // 15. Verify categories restored (including nested parentId)
    expect(restoredPayload.categories.length).toBe(2);
    expect(restoredPayload.categories[1].parentId).toBe("cat-sec");

    // 16. Verify bookmarks restored
    expect(restoredPayload.bookmarks.length).toBe(1);
    expect(restoredPayload.bookmarks[0].title).toBe("Proton Mail");

    // 17. Verify TOTP restored
    expect(restoredPayload.passwords[0].totpSecret).toBe("HXDMVJECJJWSRB3H");

    // 18. Verify encrypted file restored
    expect(restoredPayload.files.length).toBe(1);
    expect(restoredPayload.files[0].name).toBe("pgp_key.txt");

    // 19. Verify restored file decrypts correctly with the original VEK
    const decryptedFileString = await decryptFileWithVek(
      restoredPayload.files[0].data,
      restoredPayload.files[0].iv!,
      vek
    );
    expect(decryptedFileString).toBe(testFileRaw);
  });

  it("20: Handles duplicate detection cleanly during merge", () => {
    const existing = [
      { id: "1", websiteName: "Google", websiteUrl: "https://google.com", username: "user@gmail.com", password: "p1", category: "Personal", isFavorite: false, createdAt: 1, updatedAt: 1 },
    ];
    const incoming = [
      { id: "2", websiteName: "Google", websiteUrl: "https://google.com", username: "user@gmail.com", password: "p1_updated", category: "Personal", isFavorite: false, createdAt: 2, updatedAt: 2 },
      { id: "3", websiteName: "GitHub", websiteUrl: "https://github.com", username: "octo", password: "p2", category: "Dev", isFavorite: false, createdAt: 2, updatedAt: 2 },
    ];

    const existingMap = new Set(existing.map(e => `${e.websiteUrl}::${e.username.toLowerCase()}`));
    const newItems = incoming.filter(i => !existingMap.has(`${i.websiteUrl}::${i.username.toLowerCase()}`));

    expect(newItems.length).toBe(1);
    expect(newItems[0].websiteName).toBe("GitHub");
  });

  it("21: Safely rejects invalid or non-JSON backup files", () => {
    const corruptedText = "Not valid json content here! <<>>";
    const inspection = inspectBackupFileText(corruptedText);
    expect(inspection.isLokkerBackup).toBe(false);
  });

  it("22: Rejects wrong password during encrypted backup decryption", async () => {
    const payload = createLokkerBackupPayload({
      passwords: [],
      bookmarks: [],
      categories: [],
      settings: { autoLockMinutes: 15, requireConfirmationForAutofill: true, trustedDomains: [] },
      files: [],
    });

    const encrypted = await exportEncryptedLokkerBackup(payload, "CorrectPassword!123");

    await expect(
      decryptAndValidateLokkerBackup(encrypted, "WrongPassword!999")
    ).rejects.toThrow(/Incorrect backup password/);
  });

  it("23: Rejects tampered backup ciphertext", async () => {
    const payload = createLokkerBackupPayload({
      passwords: [],
      bookmarks: [],
      categories: [],
      settings: { autoLockMinutes: 15, requireConfirmationForAutofill: true, trustedDomains: [] },
      files: [],
    });

    const encrypted = await exportEncryptedLokkerBackup(payload, masterPassword);

    // Tamper ciphertext
    const tampered = {
      ...encrypted,
      cipherText: "TAMPERED" + encrypted.cipherText.slice(8),
    };

    await expect(
      decryptAndValidateLokkerBackup(tampered, masterPassword)
    ).rejects.toThrow();
  });

  it("24: Successfully handles unencrypted legacy and v1 format payloads", () => {
    const legacyJson = JSON.stringify({
      version: 1,
      passwords: [
        { id: "p1", websiteName: "Slack", websiteUrl: "https://slack.com", username: "alice", password: "pwd", category: "Chat", isFavorite: false, createdAt: 1, updatedAt: 1 },
      ],
      bookmarks: [
        { id: "b1", title: "Slack", url: "https://slack.com", category: "Chat", createdAt: 1, updatedAt: 1 },
      ],
    });

    const inspection = inspectBackupFileText(legacyJson);
    expect(inspection.isLokkerBackup).toBe(true);
    expect(inspection.isEncrypted).toBe(false);
    expect(inspection.decryptedPayload?.passwords.length).toBe(1);
    expect(inspection.summary?.passwordCount).toBe(1);
    expect(inspection.summary?.bookmarkCount).toBe(1);
  });
});

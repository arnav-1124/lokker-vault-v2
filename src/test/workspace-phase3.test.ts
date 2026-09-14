import { describe, it, expect } from "vitest";
import { PasswordEntry } from "@/types";
import { analyzeWatchtowerSecurity } from "@/lib/watchtower";
import {
  generateSecurePassword,
  generateMemorablePassphrase,
  calculatePasswordStrength,
  deriveKeyFromPassword,
  encryptPayload,
  bufferToBase64,
  generateRandomSalt,
} from "@/lib/crypto";
import { parseCSVToEntries, parseJSONBackupText, decryptEncryptedBackupData } from "@/lib/importers";

describe("Workspace Phase 3: Security Watchtower, Generator & Portability", () => {
  const sampleTeamCredentials: PasswordEntry[] = [
    {
      id: "ws-pwd-1",
      websiteName: "GitHub Enterprise",
      websiteUrl: "https://github.company.com",
      username: "alice@company.com",
      password: "SuperSecretPassword123!@#",
      notes: "Dev team GitHub admin",
      category: "Engineering",
      totpSecret: "JBSWY3DPEHPK3PXP",
      isFavorite: true,
      entryType: "login",
      storageScope: "cloud",
      workspaceId: "ws-test-1",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "ws-pwd-2",
      websiteName: "AWS Production Console",
      websiteUrl: "https://console.aws.amazon.com",
      username: "alice@company.com",
      password: "123", // Weak password
      notes: "Root credentials",
      category: "Infrastructure",
      isFavorite: false,
      entryType: "login",
      storageScope: "cloud",
      workspaceId: "ws-test-1",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "ws-pwd-3",
      websiteName: "Datadog Monitoring",
      websiteUrl: "https://app.datadoghq.com",
      username: "devops@company.com",
      password: "SuperSecretPassword123!@#", // Reused with ws-pwd-1
      notes: "APM alerts",
      category: "Infrastructure",
      isFavorite: false,
      entryType: "login",
      storageScope: "cloud",
      workspaceId: "ws-test-1",
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  describe("Workspace Watchtower Security Audit", () => {
    it("should accurately audit workspace passwords for weak and reused credentials", () => {
      const report = analyzeWatchtowerSecurity(sampleTeamCredentials);

      // Weak check
      expect(report.weakItems.length).toBeGreaterThanOrEqual(1);
      expect(report.weakItems.some((w) => w.entry.id === "ws-pwd-2")).toBe(true);

      // Reuse check: ws-pwd-1 and ws-pwd-3 share the same password
      expect(report.reusedItems.length).toBe(2);
      expect(report.reusedItems.some((r) => r.entry.id === "ws-pwd-1")).toBe(true);
      expect(report.reusedItems.some((r) => r.entry.id === "ws-pwd-3")).toBe(true);

      // Score deduction check
      expect(report.overallScore).toBeLessThan(100);
    });

    it("should score high for robust, unique credentials with 2FA", () => {
      const perfectCredentials: PasswordEntry[] = [
        {
          id: "ws-pwd-clean-1",
          websiteName: "Google Cloud",
          websiteUrl: "https://console.cloud.google.com",
          username: "admin@corp.io",
          password: "k9#Xm$8P!qL2@vR9^tY5&wZ1",
          totpSecret: "JBSWY3DPEHPK3PXP",
          category: "General",
          isFavorite: false,
          entryType: "login",
          storageScope: "cloud",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const report = analyzeWatchtowerSecurity(perfectCredentials);
      expect(report.weakItems.length).toBe(0);
      expect(report.reusedItems.length).toBe(0);
      expect(report.overallScore).toBe(100);
    });
  });

  describe("Workspace Password Generator & Presets", () => {
    it("should generate enterprise-compliant 24-character passwords with high entropy", () => {
      const enterprisePwd = generateSecurePassword({
        length: 24,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
      });

      expect(enterprisePwd.length).toBe(24);
      expect(/[A-Z]/.test(enterprisePwd)).toBe(true);
      expect(/[a-z]/.test(enterprisePwd)).toBe(true);
      expect(/[0-9]/.test(enterprisePwd)).toBe(true);
      // Exclude similar characters (1, l, I, 0, O)
      expect(/[1lI0O]/.test(enterprisePwd)).toBe(false);

      const strength = calculatePasswordStrength(enterprisePwd);
      expect(strength.score).toBe(100);
      expect(strength.label).toBe("Very Strong");
    });

    it("should generate 5-word memorable passphrases with numeric suffix", () => {
      const passphrase = generateMemorablePassphrase(5);
      const parts = passphrase.split("-");
      // 5 words + 1 numeric chunk at end
      expect(parts.length).toBe(6);
      for (let i = 0; i < 5; i++) {
        expect(parts[i].length).toBeGreaterThan(1);
      }
      expect(/^\d+$/.test(parts[5])).toBe(true);
    });

    it("should generate 32-character API key tokens", () => {
      const apiKey = generateSecurePassword({
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: true,
      });
      expect(apiKey.length).toBe(32);
      expect(/^[A-Za-z0-9]+$/.test(apiKey)).toBe(true);
    });
  });

  describe("Workspace Encrypted Portability & Deduplication", () => {
    it("should produce valid .lokker-ws encrypted container and decrypt cleanly", async () => {
      const passphrase = "EnterpriseSuperSecretPassphrase2026!";
      const salt = generateRandomSalt(16);
      const saltBase64 = bufferToBase64(salt);
      const key = await deriveKeyFromPassword(passphrase, salt);

      const payload = {
        version: 1,
        type: "lokker-workspace-backup",
        workspaceId: "ws-12345",
        workspaceName: "DevOps Team",
        exportedAt: new Date().toISOString(),
        passwords: sampleTeamCredentials,
        bookmarks: [],
        categories: [{ id: "cat-1", name: "Infrastructure" }],
      };

      const { cipherText, iv } = await encryptPayload(payload, key, saltBase64);

      const container = {
        app: "Lokker Workspace",
        format: "lokker-ws",
        version: 1,
        exportedAt: payload.exportedAt,
        workspaceId: "ws-12345",
        crypto: {
          kdf: { algorithm: "PBKDF2", hash: "SHA-256", iterations: 100000, salt: saltBase64 },
          cipher: { algorithm: "AES-GCM", keyLength: 256, iv },
        },
        payload: cipherText,
      };

      const containerJson = JSON.stringify(container);

      // Verify parseJSONBackupText detects .lokker-ws
      const parsed = parseJSONBackupText(containerJson);
      expect(parsed.isEncrypted).toBe(true);
      expect(parsed.encryptedBackup).toBeDefined();
      expect(parsed.encryptedBackup?.cipherText).toBe(cipherText);

      // Verify decryptEncryptedBackupData restores passwords
      const decrypted = await decryptEncryptedBackupData(
        parsed.encryptedBackup!,
        passphrase
      );
      expect(decrypted.passwords.length).toBe(3);
      expect(decrypted.passwords[0].websiteName).toBe("GitHub Enterprise");
      expect(decrypted.passwords[0].password).toBe("SuperSecretPassword123!@#");
    });

    it("should parse CSV imports and support deduplication key matching", () => {
      const csvData = [
        "Title,Website URL,Username,Password,Notes,Category,2FA TOTP Secret,Entry Type",
        '"AWS Production Console","https://console.aws.amazon.com","alice@company.com","NewPassword123!","Duplicate item","Infrastructure","","login"',
        '"Stripe Billing","https://dashboard.stripe.com","finance@company.com","StripePass999!","New item","Finance","","login"',
      ].join("\r\n");

      const imported = parseCSVToEntries(csvData);
      expect(imported.length).toBe(2);

      // Simulate workspace deduplication key logic
      const existingKeys = new Set(
        sampleTeamCredentials.map(
          (p) => `${(p.websiteUrl || p.websiteName).trim().toLowerCase()}::${p.username.trim().toLowerCase()}`
        )
      );

      const newItems: PasswordEntry[] = [];
      let duplicateCount = 0;

      for (const entry of imported) {
        const key = `${(entry.websiteUrl || entry.websiteName).trim().toLowerCase()}::${entry.username.trim().toLowerCase()}`;
        if (existingKeys.has(key)) {
          duplicateCount++;
        } else {
          newItems.push({
            ...entry,
            id: `ws-pwd-${Date.now()}`,
            storageScope: "cloud",
          });
          existingKeys.add(key);
        }
      }

      // AWS should be skipped as duplicate; Stripe should be imported
      expect(duplicateCount).toBe(1);
      expect(newItems.length).toBe(1);
      expect(newItems[0].websiteName).toBe("Stripe Billing");
      expect(newItems[0].storageScope).toBe("cloud");
    });
  });
});

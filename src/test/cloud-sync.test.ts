import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  prepareCloudSyncPayload,
  mergeCloudVaultWithLocal,
  encryptAndUploadCloudVault,
  downloadAndDecryptCloudVault,
  deleteCloudVault,
  type CloudVaultPayload,
} from "../lib/cloud-sync";
import { generateVek } from "../lib/crypto";
import type { Bookmark, Category, PasswordEntry } from "../types";

describe("Zero-Knowledge Encrypted Cloud Sync", () => {
  const sampleCategories: Category[] = [
    { id: "cat-dev", name: "Development", color: "#3b82f6" },
    { id: "cat-sub", name: "Frontend", color: "#10b981", parentId: "cat-dev" },
    { id: "cat-fin", name: "Finance", color: "#f59e0b" },
  ];

  const samplePasswords: PasswordEntry[] = [
    {
      id: "pwd-cloud-1",
      websiteName: "GitHub",
      websiteUrl: "https://github.com",
      username: "alex",
      password: "secretPassword1",
      category: "Frontend",
      isFavorite: true,
      storageScope: "cloud",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "pwd-local-1",
      websiteName: "Local NAS",
      websiteUrl: "http://192.168.1.100",
      username: "admin",
      password: "nasPassword2",
      category: "Finance",
      isFavorite: false,
      storageScope: "local",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "pwd-legacy-1",
      websiteName: "Legacy Service",
      websiteUrl: "https://legacy.example.com",
      username: "user",
      password: "pass",
      category: "General",
      isFavorite: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const sampleBookmarks: Bookmark[] = [
    {
      id: "bm-cloud-1",
      title: "GitHub Portal",
      url: "https://github.com",
      category: "Frontend",
      storageScope: "cloud",
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "bm-local-1",
      title: "Router",
      url: "http://192.168.1.1",
      category: "General",
      storageScope: "local",
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  describe("prepareCloudSyncPayload", () => {
    it("strictly isolates local and legacy items and only bundles cloud-scoped items", () => {
      const payload = prepareCloudSyncPayload({
        passwords: samplePasswords,
        bookmarks: sampleBookmarks,
        categories: sampleCategories,
      });

      // Passwords
      expect(payload.passwords.length).toBe(1);
      expect(payload.passwords[0].id).toBe("pwd-cloud-1");
      expect(payload.passwords[0].storageScope).toBe("cloud");
      expect(payload.passwords.some((p) => p.storageScope === "local")).toBe(false);
      expect(payload.passwords.some((p) => !p.storageScope)).toBe(false);

      // Bookmarks
      expect(payload.bookmarks.length).toBe(1);
      expect(payload.bookmarks[0].id).toBe("bm-cloud-1");
      expect(payload.bookmarks[0].storageScope).toBe("cloud");
      expect(payload.bookmarks.some((b) => b.storageScope === "local")).toBe(false);

      // Hierarchical categories: 'Frontend' is child of 'Development', so both should be included
      const catNames = payload.categories.map((c) => c.name);
      expect(catNames).toContain("Frontend");
      expect(catNames).toContain("Development");
      expect(catNames).not.toContain("Finance");
    });
  });

  describe("mergeCloudVaultWithLocal", () => {
    it("merges remote cloud items without affecting local-only items", () => {
      const localState = {
        passwords: [...samplePasswords],
        bookmarks: [...sampleBookmarks],
        categories: [...sampleCategories],
      };

      const remoteCloudPayload: CloudVaultPayload = {
        passwords: [
          // Updated version of pwd-cloud-1 with newer timestamp
          {
            id: "pwd-cloud-1",
            websiteName: "GitHub Enterprise",
            websiteUrl: "https://github.com",
            username: "alex",
            password: "newSecretPassword123",
            category: "Frontend",
            isFavorite: true,
            storageScope: "cloud",
            createdAt: 1000,
            updatedAt: 2000,
          },
          // Fresh cloud item added from mobile device
          {
            id: "pwd-cloud-new",
            websiteName: "Cloudflare",
            websiteUrl: "https://cloudflare.com",
            username: "alex@cf.com",
            password: "cfPassword456",
            category: "Infrastructure",
            isFavorite: false,
            storageScope: "cloud",
            createdAt: 1500,
            updatedAt: 1500,
          },
        ],
        bookmarks: [
          {
            id: "bm-cloud-new",
            title: "Cloudflare Dashboard",
            url: "https://dash.cloudflare.com",
            category: "Infrastructure",
            storageScope: "cloud",
            createdAt: 1500,
            updatedAt: 1500,
          },
        ],
        categories: [
          { id: "cat-infra", name: "Infrastructure", color: "#8b5cf6" },
        ],
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const result = mergeCloudVaultWithLocal(localState, remoteCloudPayload);

      expect(result.hasChanges).toBe(true);

      // 1. Local-only items must remain untouched
      const localPwd = result.mergedPasswords.find((p) => p.id === "pwd-local-1");
      expect(localPwd).toBeDefined();
      expect(localPwd?.password).toBe("nasPassword2");
      expect(localPwd?.storageScope).toBe("local");

      // 2. Updated cloud item should reflect the newer remote version
      const updatedPwd = result.mergedPasswords.find((p) => p.id === "pwd-cloud-1");
      expect(updatedPwd?.password).toBe("newSecretPassword123");
      expect(updatedPwd?.websiteName).toBe("GitHub Enterprise");

      // 3. New mobile item should be present with storageScope: 'cloud'
      const newPwd = result.mergedPasswords.find((p) => p.id === "pwd-cloud-new");
      expect(newPwd).toBeDefined();
      expect(newPwd?.storageScope).toBe("cloud");

      // 4. New categories merged and reconciled
      expect(result.mergedCategories.some((c) => c.name === "Infrastructure")).toBe(true);
    });
  });

  describe("End-to-End Encryption & Decryption Roundtrip", () => {
    it("encrypts with VEK, formats payload correctly for server, and decrypts back to identical data", async () => {
      const vek = await generateVek();
      const payload: CloudVaultPayload = {
        passwords: [samplePasswords[0]],
        bookmarks: [sampleBookmarks[0]],
        categories: [sampleCategories[0]],
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      let capturedBody: any = null;

      // Mock fetch for upload
      global.fetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
        if (url.endsWith("/api/vault/sync") && options?.method === "PUT") {
          capturedBody = JSON.parse(options.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              updatedAt: new Date().toISOString(),
              version: 1,
              itemCount: capturedBody.itemCount,
            }),
          };
        }
        if (url.endsWith("/api/vault/sync") && (!options || options.method === "GET" || !options.method)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              exists: true,
              vault: {
                encryptedBlob: capturedBody.encryptedBlob,
                iv: capturedBody.iv,
                version: capturedBody.version,
                itemCount: capturedBody.itemCount,
                updatedAt: new Date().toISOString(),
              },
            }),
          };
        }
        if (url.endsWith("/api/vault/sync") && options?.method === "DELETE") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, message: "Cloud vault successfully deleted" }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      // 1. Encrypt and Upload
      const uploadResult = await encryptAndUploadCloudVault(
        vek,
        payload,
        "mock-jwt-token",
        "http://localhost:4000"
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.itemCount).toBe(2);

      // Verify what was sent: MUST be encrypted ciphertext and IV, NOT plaintext
      expect(capturedBody).toBeDefined();
      expect(capturedBody.encryptedBlob).toBeTypeOf("string");
      expect(capturedBody.iv).toBeTypeOf("string");
      expect(capturedBody.encryptedBlob).not.toContain("secretPassword1");
      expect(capturedBody.encryptedBlob).not.toContain("GitHub");

      // 2. Download and Decrypt
      const downloadResult = await downloadAndDecryptCloudVault(
        vek,
        "mock-jwt-token",
        "http://localhost:4000"
      );

      expect(downloadResult.exists).toBe(true);
      expect(downloadResult.payload).toBeDefined();
      expect(downloadResult.payload?.passwords[0].password).toBe("secretPassword1");
      expect(downloadResult.payload?.passwords[0].websiteName).toBe("GitHub");
      expect(downloadResult.payload?.bookmarks[0].title).toBe("GitHub Portal");

      // 3. Delete cloud backup
      const deleteResult = await deleteCloudVault("mock-jwt-token", "http://localhost:4000");
      expect(deleteResult).toBe(true);
    });

    it("throws a user-friendly error when attempting decryption with the wrong key", async () => {
      const correctVek = await generateVek();
      const wrongVek = await generateVek();

      const payload: CloudVaultPayload = {
        passwords: [samplePasswords[0]],
        bookmarks: [],
        categories: [],
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      let capturedBody: any = null;
      global.fetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
        if (options?.method === "PUT") {
          capturedBody = JSON.parse(options.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, updatedAt: new Date().toISOString() }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            exists: true,
            vault: {
              encryptedBlob: capturedBody.encryptedBlob,
              iv: capturedBody.iv,
              version: 1,
              itemCount: 1,
              updatedAt: new Date().toISOString(),
            },
          }),
        };
      });

      await encryptAndUploadCloudVault(correctVek, payload, "token", "http://localhost:4000");

      // Attempting to download with wrong VEK must fail with clear message
      await expect(
        downloadAndDecryptCloudVault(wrongVek, "token", "http://localhost:4000")
      ).rejects.toThrow(/master password/i);
    });
  });
});

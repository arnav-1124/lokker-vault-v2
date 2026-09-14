import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  prepareCloudSyncPayload,
  mergeCloudVaultWithLocal,
  encryptAndUploadCloudVault,
  downloadAndDecryptCloudVault,
  deleteCloudVault,
  type CloudVaultPayload,
} from "../lib/cloud-sync";
import {
  generateVek,
  generateRandomSalt,
  bufferToBase64,
  deriveKeyFromPassword,
  wrapVek,
} from "../lib/crypto";
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

    it("restores cloud vault on Device B using wrappedVek and Master Password", async () => {
      const deviceAVek = await generateVek();
      const masterPassword = "TestMasterPassword123!";
      const salt = bufferToBase64(generateRandomSalt());
      const kek = await deriveKeyFromPassword(masterPassword, salt);
      const wrappedVek = await wrapVek(deviceAVek, kek);

      const payload: CloudVaultPayload = {
        passwords: [samplePasswords[0]],
        bookmarks: [sampleBookmarks[0]],
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
              wrappedVek: capturedBody.wrappedVek,
              salt: capturedBody.salt,
              version: 1,
              itemCount: 2,
              updatedAt: new Date().toISOString(),
            },
          }),
        };
      });

      // 1. Device A uploads with wrappedVek and salt
      await encryptAndUploadCloudVault(
        deviceAVek,
        payload,
        "token-a",
        "http://localhost:4000",
        {
          wrappedVek: JSON.stringify(wrappedVek),
          salt,
        }
      );

      // Verify that wrappedVek and salt were sent in the payload
      expect(capturedBody.wrappedVek).toBeDefined();
      expect(capturedBody.salt).toBe(salt);

      // 2. Device B has a DIFFERENT random VEK (or null)
      const deviceBVek = await generateVek();

      // Device B attempts download with masterPassword
      const restoreResult = await downloadAndDecryptCloudVault(
        deviceBVek,
        "token-b",
        "http://localhost:4000",
        masterPassword
      );

      expect(restoreResult.exists).toBe(true);
      expect(restoreResult.payload).toBeDefined();
      expect(restoreResult.payload?.passwords[0].password).toBe("secretPassword1");
      expect(restoreResult.unwrappedVek).toBeDefined();

      // 3. If Device B supplies the wrong master password, it fails
      await expect(
        downloadAndDecryptCloudVault(
          deviceBVek,
          "token-b",
          "http://localhost:4000",
          "WrongMasterPassword999!"
        )
      ).rejects.toThrow(/master password/i);
    });
  });

  describe("Deletion Tombstones & Zombie Resurrection Prevention", () => {
    function createTestPassword(overrides: Partial<PasswordEntry> & { id: string; websiteName: string }): PasswordEntry {
      return {
        websiteUrl: "https://example.com",
        username: "user@example.com",
        password: "Password123!",
        category: "General",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
        ...overrides,
      };
    }

    it("includes deletedItemIds in prepareCloudSyncPayload", () => {
      const tombstones = { "pwd-deleted-1": 1700000000000, "bm-deleted-2": 1700000001000 };
      const payload = prepareCloudSyncPayload({
        passwords: samplePasswords,
        bookmarks: sampleBookmarks,
        categories: sampleCategories,
        deletedItemIds: tombstones,
      });

      expect(payload.deletedItemIds).toEqual(tombstones);
    });

    it("prevents deleted local cloud items from resurrecting when remote snapshot contains them", () => {
      const deletedAt = 2000;
      const localTombstones = { "pwd-cloud-1": deletedAt };

      // Local vault has deleted 'pwd-cloud-1', so local passwords only has local items
      const localVault = {
        passwords: samplePasswords.filter((p) => p.id !== "pwd-cloud-1"),
        bookmarks: sampleBookmarks,
        categories: sampleCategories,
        deletedItemIds: localTombstones,
      };

      // Remote cloud snapshot still has 'pwd-cloud-1' updated at 1000 (<= deletedAt)
      const remotePayload: CloudVaultPayload = {
        passwords: [
          createTestPassword({
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
          }),
        ],
        bookmarks: [],
        categories: [],
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const result = mergeCloudVaultWithLocal(localVault, remotePayload);

      // The deleted item must NOT be resurrected!
      expect(result.mergedPasswords.find((p) => p.id === "pwd-cloud-1")).toBeUndefined();
      expect(result.mergedTombstones["pwd-cloud-1"]).toBe(deletedAt);
    });

    it("purges local item when remote cloud payload contains a tombstone for it", () => {
      const localVault = {
        passwords: [
          createTestPassword({
            id: "pwd-remote-deleted",
            websiteName: "Stale Service",
            storageScope: "cloud",
            createdAt: 1000,
            updatedAt: 1000,
          }),
        ],
        bookmarks: [],
        categories: [],
      };

      // Remote payload deleted it at 2000
      const remotePayload: CloudVaultPayload = {
        passwords: [],
        bookmarks: [],
        categories: [],
        deletedItemIds: { "pwd-remote-deleted": 2000 },
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const result = mergeCloudVaultWithLocal(localVault, remotePayload);

      // Local item must be purged by remote tombstone
      expect(result.mergedPasswords.find((p) => p.id === "pwd-remote-deleted")).toBeUndefined();
      expect(result.hasChanges).toBe(true);
      expect(result.mergedTombstones["pwd-remote-deleted"]).toBe(2000);
    });

    it("preserves local copy when user chooses Remove from Cloud Only", () => {
      const localVault = {
        passwords: [
          createTestPassword({
            id: "pwd-keep-local",
            websiteName: "Personal Bank",
            storageScope: "local",
            createdAt: 1000,
            updatedAt: 2000,
          }),
        ],
        bookmarks: [],
        categories: [],
        deletedItemIds: { "pwd-keep-local": 2000 }, // Tombstone for cloud
      };

      // Remote payload still has the old cloud copy
      const remotePayload: CloudVaultPayload = {
        passwords: [
          createTestPassword({
            id: "pwd-keep-local",
            websiteName: "Personal Bank",
            storageScope: "cloud",
            createdAt: 1000,
            updatedAt: 1000,
          }),
        ],
        bookmarks: [],
        categories: [],
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const result = mergeCloudVaultWithLocal(localVault, remotePayload);

      // Local copy is preserved as storageScope: 'local'
      const item = result.mergedPasswords.find((p) => p.id === "pwd-keep-local");
      expect(item).toBeDefined();
      expect(item?.storageScope).toBe("local");

      // When preparing upload payload, this item is NOT included in cloud payload
      const uploadPayload = prepareCloudSyncPayload({
        passwords: result.mergedPasswords,
        bookmarks: result.mergedBookmarks,
        categories: result.mergedCategories,
        deletedItemIds: result.mergedTombstones,
      });

      expect(uploadPayload.passwords.find((p) => p.id === "pwd-keep-local")).toBeUndefined();
      expect(uploadPayload.deletedItemIds?.["pwd-keep-local"]).toBe(2000);
    });

    it("allows re-creation of an item if newer than the tombstone", () => {
      const localVault = {
        passwords: [
          createTestPassword({
            id: "pwd-recreated",
            websiteName: "Re-created Account",
            storageScope: "cloud",
            createdAt: 3000,
            updatedAt: 3000, // Newer than tombstone (2000)
          }),
        ],
        bookmarks: [],
        categories: [],
        deletedItemIds: { "pwd-recreated": 2000 },
      };

      const remotePayload: CloudVaultPayload = {
        passwords: [],
        bookmarks: [],
        categories: [],
        deletedItemIds: { "pwd-recreated": 2000 },
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const result = mergeCloudVaultWithLocal(localVault, remotePayload);
      expect(result.mergedPasswords.find((p) => p.id === "pwd-recreated")).toBeDefined();
    });
  });
});

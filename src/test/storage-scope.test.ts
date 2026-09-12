import { describe, expect, it } from "vitest";
import type { PasswordEntry, Bookmark, StorageScope } from "@/types";
import { generateId } from "@/lib/id";

describe("Storage Scope Models", () => {
  it("allows setting storageScope to cloud on password entries", () => {
    const entry: PasswordEntry = {
      id: generateId("pwd"),
      websiteName: "GitHub",
      websiteUrl: "https://github.com",
      username: "alex@example.com",
      password: "SuperSecretPassword123!",
      category: "Development",
      isFavorite: false,
      storageScope: "cloud",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(entry.storageScope).toBe("cloud");
  });

  it("allows setting storageScope to local on password entries", () => {
    const entry: PasswordEntry = {
      id: generateId("pwd"),
      websiteName: "Local NAS",
      websiteUrl: "http://192.168.1.50",
      username: "admin",
      password: "LocalNASPassword123!",
      category: "General",
      isFavorite: true,
      storageScope: "local",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(entry.storageScope).toBe("local");
  });

  it("supports storageScope on bookmarks", () => {
    const cloudBookmark: Bookmark = {
      id: generateId("bm"),
      title: "Google Cloud Console",
      url: "https://console.cloud.google.com",
      category: "Work",
      storageScope: "cloud",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const localBookmark: Bookmark = {
      id: generateId("bm"),
      title: "Router Admin",
      url: "http://192.168.1.1",
      category: "Personal",
      storageScope: "local",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(cloudBookmark.storageScope).toBe("cloud");
    expect(localBookmark.storageScope).toBe("local");
  });

  it("ensures plain English is used in warning modal texts without crypto/internal jargon", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const warningModalSource = fs.readFileSync(
      path.resolve(__dirname, "../components/modals/save-scope-warning-modal.tsx"),
      "utf-8"
    );

    // Verify forbidden technical jargon is absent
    const forbiddenJargon = [
      "IndexedDB",
      "AES-GCM",
      "PBKDF2",
      "Argon2",
      "KDF",
      "ciphertext",
      "salt",
      "SHA-256",
      "WebCrypto",
    ];

    for (const word of forbiddenJargon) {
      expect(warningModalSource).not.toContain(word);
    }

    // Verify key user-facing actions exist in plain English
    expect(warningModalSource).toContain("Save to Local Device Only?");
    expect(warningModalSource).toContain("Add to Cloud Instead");
    expect(warningModalSource).toContain("Save Locally");
  });

  it("filters out cloud-scoped items when user is logged out of cloud", () => {
    const allItems: PasswordEntry[] = [
      {
        id: "pwd-1",
        websiteName: "Local Credential 1",
        websiteUrl: "https://local.test",
        username: "user1",
        password: "p1",
        category: "General",
        isFavorite: false,
        storageScope: "local",
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: "pwd-2",
        websiteName: "Cloud Credential 2",
        websiteUrl: "https://cloud.test",
        username: "user2",
        password: "p2",
        category: "General",
        isFavorite: false,
        storageScope: "cloud",
        createdAt: 2,
        updatedAt: 2,
      },
      {
        id: "pwd-3",
        websiteName: "Default Legacy Credential",
        websiteUrl: "https://legacy.test",
        username: "user3",
        password: "p3",
        category: "General",
        isFavorite: false,
        createdAt: 3,
        updatedAt: 3,
      },
    ];

    // When logged out of cloud:
    const hasCloudSession = false;
    const visibleWhenLoggedOut = hasCloudSession
      ? allItems
      : allItems.filter((p) => p.storageScope !== "cloud");

    expect(visibleWhenLoggedOut.length).toBe(2);
    expect(visibleWhenLoggedOut.some((p) => p.storageScope === "cloud")).toBe(false);
    expect(visibleWhenLoggedOut.map((p) => p.id)).toEqual(["pwd-1", "pwd-3"]);

    // When logged into cloud:
    const loggedInSession = true;
    const visibleWhenLoggedIn = loggedInSession
      ? allItems
      : allItems.filter((p) => p.storageScope !== "cloud");

    expect(visibleWhenLoggedIn.length).toBe(3);
    expect(visibleWhenLoggedIn.some((p) => p.storageScope === "cloud")).toBe(true);
  });

  it("broadcasts CLOUD_AUTH_CHANGE_EVENT on setCloudSession and clearCloudSession", async () => {
    const {
      getCloudSession,
      setCloudSession,
      clearCloudSession,
      CLOUD_AUTH_CHANGE_EVENT,
      CLOUD_SESSION_STORAGE_KEY,
    } = await import("@/lib/auth-session");

    let eventFired = 0;
    let lastDetail: any = null;

    const listener = (e: Event) => {
      eventFired++;
      lastDetail = (e as CustomEvent).detail;
    };

    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, listener);

    try {
      // 1. Set cloud session
      setCloudSession({
        id: "user-123",
        email: "alice@example.com",
        role: "USER",
        name: "Alice",
        accessToken: "jwt-token-abc",
      });

      expect(eventFired).toBe(1);
      expect(lastDetail).toEqual({
        id: "user-123",
        email: "alice@example.com",
        role: "USER",
        name: "Alice",
        accessToken: "jwt-token-abc",
      });

      const current = getCloudSession();
      expect(current?.email).toBe("alice@example.com");
      expect(localStorage.getItem(CLOUD_SESSION_STORAGE_KEY)).not.toBeNull();

      // 2. Clear cloud session (logout)
      clearCloudSession();

      expect(eventFired).toBe(2);
      expect(lastDetail).toBeNull();
      expect(getCloudSession()).toBeNull();
      expect(localStorage.getItem(CLOUD_SESSION_STORAGE_KEY)).toBeNull();
    } finally {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, listener);
    }
  });
});

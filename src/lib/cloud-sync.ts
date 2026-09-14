/**
 * Zero-Knowledge Encrypted Cloud Synchronization Client Library
 *
 * Invariants:
 * 1. Zero-Knowledge: Master passwords, plaintext credentials, and VEK (Vault Encryption Key)
 *    NEVER leave the browser unencrypted.
 * 2. Local-Only Protection: Items marked with storageScope === 'local' (or legacy undefined)
 *    are strictly filtered out of cloud payloads and stay only on the device.
 * 3. Plain English UI: No developer jargon exposed to the user.
 */

import type { Bookmark, Category, PasswordEntry } from "@/types";
import { appConfig } from "@/config/app";
import {
  encryptPayloadWithVek,
  decryptPayloadWithVek,
  deriveKeyFromPassword,
  unwrapVek,
} from "./crypto";
import { reconcileMissingCategories } from "./category-tree";
import { refreshCloudSession, clearCloudSession } from "./auth-session";

export interface CloudKeyMeta {
  wrappedVek?: string;
  salt?: string;
}

export interface CloudVaultPayload {
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
  deletedItemIds?: Record<string, number>;
  exportedAt: string;
  version: number;
}

export interface CloudSyncResult {
  success: boolean;
  updatedAt: string;
  version: number;
  itemCount: number;
}

export interface CloudDownloadResult {
  exists: boolean;
  payload: CloudVaultPayload | null;
  updatedAt?: string;
  version?: number;
  itemCount?: number;
  unwrappedVek?: CryptoKey;
  remoteKeyMeta?: CloudKeyMeta;
}

/**
 * Prepares the cloud vault payload by strictly filtering for items marked with storageScope === 'cloud'.
 * Local-only items and unconfigured scopes are never included.
 */
export function prepareCloudSyncPayload(items: {
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
  deletedItemIds?: Record<string, number>;
}): CloudVaultPayload {
  const cloudPasswords = items.passwords.filter((p) => p.storageScope === "cloud");
  const cloudBookmarks = items.bookmarks.filter((b) => b.storageScope === "cloud");

  // Determine which categories are required by the cloud items
  const referencedCategoryNames = new Set<string>();
  cloudPasswords.forEach((p) => {
    if (p.category) referencedCategoryNames.add(p.category.toLowerCase());
  });
  cloudBookmarks.forEach((b) => {
    if (b.category) referencedCategoryNames.add(b.category.toLowerCase());
  });

  // Collect matching categories and their parent categories
  const relevantCategories: Category[] = [];
  const addedCatIds = new Set<string>();

  function includeCategory(cat: Category) {
    if (addedCatIds.has(cat.id)) return;
    addedCatIds.add(cat.id);
    relevantCategories.push(cat);
    if (cat.parentId) {
      const parent = items.categories.find((c) => c.id === cat.parentId);
      if (parent) includeCategory(parent);
    }
  }

  items.categories.forEach((cat) => {
    if (referencedCategoryNames.has(cat.name.toLowerCase())) {
      includeCategory(cat);
    }
  });

  return {
    passwords: cloudPasswords,
    bookmarks: cloudBookmarks,
    categories: relevantCategories,
    deletedItemIds: items.deletedItemIds || {},
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Encrypts cloud items with the active VEK and uploads the ciphertext to Lokker Server.
 */
async function fetchWithAuthRetry(
  url: string,
  options: RequestInit,
  currentAccessToken: string
): Promise<{ res: Response; data: any }> {
  let token = currentAccessToken;
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const refreshed = await refreshCloudSession();
    if (refreshed?.accessToken) {
      token = refreshed.accessToken;
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      clearCloudSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lokker:open-cloud-sync-modal"));
      }
      throw new Error("Your cloud session has expired. To restore cloud sync and team workspaces, please sign back in to your Lokker Cloud account.");
    }
  }

  if (res.status === 404) {
    return { res, data: { exists: false } };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || `Request failed with status ${res.status}`;
    const isAuthError =
      res.status === 401 ||
      msg.toLowerCase().includes("token has expired") ||
      msg.toLowerCase().includes("jwt expired") ||
      msg.toLowerCase().includes("unauthorized");

    if (isAuthError) {
      clearCloudSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lokker:open-cloud-sync-modal"));
      }
      throw new Error("Your cloud session has expired. To restore cloud sync and team workspaces, please sign back in to your Lokker Cloud account.");
    }
    throw new Error(msg);
  }

  return { res, data };
}

export async function encryptAndUploadCloudVault(
  vek: CryptoKey,
  payload: CloudVaultPayload,
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl,
  keyMeta?: CloudKeyMeta
): Promise<CloudSyncResult> {
  // 1. Encrypt with VEK (AES-GCM 256-bit with random 12-byte IV)
  const { cipherText, iv } = await encryptPayloadWithVek(payload, vek);
  const itemCount = payload.passwords.length + payload.bookmarks.length;

  // 2. Transmit ciphertext to server
  const { data } = await fetchWithAuthRetry(
    `${apiBaseUrl}/api/vault/sync`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        encryptedBlob: cipherText,
        iv,
        wrappedVek: keyMeta?.wrappedVek,
        salt: keyMeta?.salt,
        version: payload.version,
        itemCount,
        clientUpdatedAt: payload.exportedAt,
      }),
    },
    accessToken
  );

  return {
    success: true,
    updatedAt: data.updatedAt || new Date().toISOString(),
    version: data.version || payload.version,
    itemCount: data.itemCount ?? itemCount,
  };
}

/**
 * Downloads the encrypted vault from Lokker Server and decrypts it using the active VEK.
 * Supports cross-device restore by unwrapping remote VEK using Master Password when available.
 */
export async function downloadAndDecryptCloudVault(
  vek: CryptoKey | null,
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl,
  masterPassword?: string
): Promise<CloudDownloadResult> {
  const { res, data } = await fetchWithAuthRetry(
    `${apiBaseUrl}/api/vault/sync`,
    {},
    accessToken
  );

  if (res.status === 404 || !data.exists || !data.vault) {
    return { exists: false, payload: null };
  }

  const { encryptedBlob, iv, wrappedVek, salt, updatedAt, version, itemCount } = data.vault;

  // 1. Try decrypting directly with provided VEK if available
  if (vek) {
    try {
      const payload = await decryptPayloadWithVek<CloudVaultPayload>(encryptedBlob, iv, vek);
      return {
        exists: true,
        payload,
        updatedAt,
        version,
        itemCount,
        remoteKeyMeta: { wrappedVek, salt },
      };
    } catch {
      // If direct VEK decryption fails, fall through to attempt unwrapping with master password below
    }
  }

  // 2. If direct decryption failed or vek was not provided, attempt to unwrap remote VEK using Master Password
  if (wrappedVek && salt && masterPassword) {
    try {
      const parsedSlot = typeof wrappedVek === "string" ? JSON.parse(wrappedVek) : wrappedVek;
      const kek = await deriveKeyFromPassword(masterPassword, salt);
      const recoveredVek = await unwrapVek(parsedSlot, kek);
      const payload = await decryptPayloadWithVek<CloudVaultPayload>(encryptedBlob, iv, recoveredVek);
      return {
        exists: true,
        payload,
        updatedAt,
        version,
        itemCount,
        unwrappedVek: recoveredVek,
        remoteKeyMeta: { wrappedVek, salt },
      };
    } catch (unwrapErr) {
      console.error("Failed to unwrap remote VEK with master password:", unwrapErr);
    }
  }

  throw new Error(
    "Unable to decrypt cloud vault with your current master password. If your password was changed on another device, please sign in with your latest master password."
  );
}

/**
 * Clears the user's encrypted backup from the cloud server.
 */
export async function deleteCloudVault(
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl
): Promise<boolean> {
  await fetchWithAuthRetry(
    `${apiBaseUrl}/api/vault/sync`,
    {
      method: "DELETE",
    },
    accessToken
  );

  return true;
}

/**
 * Merges downloaded cloud items with local vault state:
 * - Local-only items are 100% preserved.
 * - Cloud items with matching IDs merge by newer timestamp.
 * - Missing categories are reconstructed and healed.
 */
export function mergeCloudVaultWithLocal(
  local: {
    passwords: PasswordEntry[];
    bookmarks: Bookmark[];
    categories: Category[];
    deletedItemIds?: Record<string, number>;
  },
  cloud: CloudVaultPayload
): {
  mergedPasswords: PasswordEntry[];
  mergedBookmarks: Bookmark[];
  mergedCategories: Category[];
  mergedTombstones: Record<string, number>;
  hasChanges: boolean;
} {
  let hasChanges = false;
  const allTombstones: Record<string, number> = {
    ...(cloud.deletedItemIds || {}),
    ...(local.deletedItemIds || {}),
  };

  // 1. Reconcile Categories
  const existingCatMap = new Map<string, Category>();
  local.categories.forEach((c) => existingCatMap.set(c.id, c));

  const updatedCategories = [...local.categories];
  for (const cloudCat of cloud.categories) {
    if (allTombstones[cloudCat.id] !== undefined) {
      continue;
    }
    if (!existingCatMap.has(cloudCat.id)) {
      existingCatMap.set(cloudCat.id, cloudCat);
      updatedCategories.push(cloudCat);
      hasChanges = true;
    }
  }

  // 2. Reconcile Passwords
  const passwordMap = new Map<string, PasswordEntry>();
  local.passwords.forEach((p) => {
    const deletedAt = allTombstones[p.id];
    if (deletedAt !== undefined && (p.updatedAt || 0) <= deletedAt && p.storageScope === "cloud") {
      hasChanges = true;
      return;
    }
    passwordMap.set(p.id, p);
  });

  for (const cloudPwd of cloud.passwords) {
    const deletedAt = allTombstones[cloudPwd.id];
    if (deletedAt !== undefined && (cloudPwd.updatedAt || 0) <= deletedAt) {
      const existing = passwordMap.get(cloudPwd.id);
      if (existing && existing.storageScope === "cloud") {
        passwordMap.delete(cloudPwd.id);
        hasChanges = true;
      }
      continue;
    }

    const localItem = passwordMap.get(cloudPwd.id);
    if (!localItem) {
      // New item from another device
      passwordMap.set(cloudPwd.id, { ...cloudPwd, storageScope: "cloud" });
      hasChanges = true;
    } else if (localItem.storageScope === "cloud") {
      // Both are cloud items: keep whichever was updated more recently
      if ((cloudPwd.updatedAt || 0) > (localItem.updatedAt || 0)) {
        passwordMap.set(cloudPwd.id, { ...cloudPwd, storageScope: "cloud" });
        hasChanges = true;
      }
    }
    // If localItem.storageScope !== 'cloud', local copy is untouched
  }

  // 3. Reconcile Bookmarks
  const bookmarkMap = new Map<string, Bookmark>();
  local.bookmarks.forEach((b) => {
    const deletedAt = allTombstones[b.id];
    if (deletedAt !== undefined && (b.updatedAt || 0) <= deletedAt && b.storageScope === "cloud") {
      hasChanges = true;
      return;
    }
    bookmarkMap.set(b.id, b);
  });

  for (const cloudBm of cloud.bookmarks) {
    const deletedAt = allTombstones[cloudBm.id];
    if (deletedAt !== undefined && (cloudBm.updatedAt || 0) <= deletedAt) {
      const existing = bookmarkMap.get(cloudBm.id);
      if (existing && existing.storageScope === "cloud") {
        bookmarkMap.delete(cloudBm.id);
        hasChanges = true;
      }
      continue;
    }

    const localItem = bookmarkMap.get(cloudBm.id);
    if (!localItem) {
      bookmarkMap.set(cloudBm.id, { ...cloudBm, storageScope: "cloud" });
      hasChanges = true;
    } else if (localItem.storageScope === "cloud") {
      if ((cloudBm.updatedAt || 0) > (localItem.updatedAt || 0)) {
        bookmarkMap.set(cloudBm.id, { ...cloudBm, storageScope: "cloud" });
        hasChanges = true;
      }
    }
  }

  const mergedPasswords = Array.from(passwordMap.values());
  const mergedBookmarks = Array.from(bookmarkMap.values());

  // Auto-heal any category tree hierarchy
  const entriesToCheck = [
    ...mergedPasswords.map((p) => ({ category: p.category })),
    ...mergedBookmarks.map((b) => ({ category: b.category })),
  ];
  const { updatedCategories: finalCategories, addedCount } = reconcileMissingCategories(
    entriesToCheck,
    updatedCategories
  );

  if (addedCount > 0) {
    hasChanges = true;
  }

  return {
    mergedPasswords,
    mergedBookmarks,
    mergedCategories: finalCategories,
    mergedTombstones: allTombstones,
    hasChanges,
  };
}

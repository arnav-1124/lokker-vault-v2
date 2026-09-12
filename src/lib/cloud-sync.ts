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
import { encryptPayloadWithVek, decryptPayloadWithVek } from "./crypto";
import { reconcileMissingCategories } from "./category-tree";

export interface CloudVaultPayload {
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
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
}

/**
 * Prepares the cloud vault payload by strictly filtering for items marked with storageScope === 'cloud'.
 * Local-only items and unconfigured scopes are never included.
 */
export function prepareCloudSyncPayload(items: {
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
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
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Encrypts cloud items with the active VEK and uploads the ciphertext to Lokker Server.
 */
export async function encryptAndUploadCloudVault(
  vek: CryptoKey,
  payload: CloudVaultPayload,
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl
): Promise<CloudSyncResult> {
  // 1. Encrypt with VEK (AES-GCM 256-bit with random 12-byte IV)
  const { cipherText, iv } = await encryptPayloadWithVek(payload, vek);
  const itemCount = payload.passwords.length + payload.bookmarks.length;

  // 2. Transmit ciphertext to server
  const res = await fetch(`${apiBaseUrl}/api/vault/sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      encryptedBlob: cipherText,
      iv,
      version: payload.version,
      itemCount,
      clientUpdatedAt: payload.exportedAt,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Unable to synchronize with cloud (status ${res.status})`);
  }

  return {
    success: true,
    updatedAt: data.updatedAt || new Date().toISOString(),
    version: data.version || payload.version,
    itemCount: data.itemCount ?? itemCount,
  };
}

/**
 * Downloads the encrypted vault from Lokker Server and decrypts it using the active VEK.
 */
export async function downloadAndDecryptCloudVault(
  vek: CryptoKey,
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl
): Promise<CloudDownloadResult> {
  const res = await fetch(`${apiBaseUrl}/api/vault/sync`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 404) {
    return { exists: false, payload: null };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Failed to retrieve cloud vault (status ${res.status})`);
  }

  if (!data.exists || !data.vault) {
    return { exists: false, payload: null };
  }

  const { encryptedBlob, iv, updatedAt, version, itemCount } = data.vault;

  try {
    const payload = await decryptPayloadWithVek<CloudVaultPayload>(encryptedBlob, iv, vek);
    return {
      exists: true,
      payload,
      updatedAt,
      version,
      itemCount,
    };
  } catch (err) {
    throw new Error(
      "Unable to decrypt cloud vault with your current master password. If your password was changed on another device, please sign in with your latest master password."
    );
  }
}

/**
 * Clears the user's encrypted backup from the cloud server.
 */
export async function deleteCloudVault(
  accessToken: string,
  apiBaseUrl = appConfig.apiUrl
): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl}/api/vault/sync`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to remove cloud backup");
  }

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
  },
  cloud: CloudVaultPayload
): {
  mergedPasswords: PasswordEntry[];
  mergedBookmarks: Bookmark[];
  mergedCategories: Category[];
  hasChanges: boolean;
} {
  let hasChanges = false;

  // 1. Reconcile Categories
  const existingCatMap = new Map<string, Category>();
  local.categories.forEach((c) => existingCatMap.set(c.id, c));

  const updatedCategories = [...local.categories];
  for (const cloudCat of cloud.categories) {
    if (!existingCatMap.has(cloudCat.id)) {
      existingCatMap.set(cloudCat.id, cloudCat);
      updatedCategories.push(cloudCat);
      hasChanges = true;
    }
  }

  // 2. Reconcile Passwords
  const passwordMap = new Map<string, PasswordEntry>();
  local.passwords.forEach((p) => passwordMap.set(p.id, p));

  for (const cloudPwd of cloud.passwords) {
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
  local.bookmarks.forEach((b) => bookmarkMap.set(b.id, b));

  for (const cloudBm of cloud.bookmarks) {
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
    hasChanges,
  };
}

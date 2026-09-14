/**
 * Storage Scope Helper Utilities
 * Manages preferences for storage scope prompts (e.g. "Save to Local Device Only?")
 */

export const DISMISS_LOCAL_SAVE_WARNING_KEY = "lokker_skip_local_save_warning";

/**
 * Checks whether the user has opted out of the "Save to Local Device Only?" confirmation prompt.
 */
export function shouldSkipLocalSaveWarning(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISS_LOCAL_SAVE_WARNING_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Updates the user's preference to skip or show the "Save to Local Device Only?" confirmation prompt.
 */
export function setSkipLocalSaveWarning(skip: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (skip) {
      localStorage.setItem(DISMISS_LOCAL_SAVE_WARNING_KEY, "true");
    } else {
      localStorage.removeItem(DISMISS_LOCAL_SAVE_WARNING_KEY);
    }
  } catch {
    // Ignore localStorage errors in private browsing/sandboxed environments
  }
}

export const CLOUD_TOMBSTONES_KEY = "lokker_cloud_tombstones";

/**
 * Retrieves the local registry of deleted cloud item IDs with timestamps.
 */
export function getCloudTombstones(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CLOUD_TOMBSTONES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Persists the cloud deletion tombstones dictionary.
 * Prunes tombstones older than 30 days to avoid unbounded storage growth.
 */
export function saveCloudTombstones(tombstones: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const pruned: Record<string, number> = {};

    for (const [id, time] of Object.entries(tombstones)) {
      if (typeof time === "number" && now - time < maxAge) {
        pruned[id] = time;
      }
    }

    localStorage.setItem(CLOUD_TOMBSTONES_KEY, JSON.stringify(pruned));
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Records a deletion tombstone for a specific cloud item ID.
 */
export function recordCloudTombstone(id: string, timestamp: number = Date.now()): void {
  const current = getCloudTombstones();
  current[id] = timestamp;
  saveCloudTombstones(current);
}

/**
 * Removes a tombstone if an item is explicitly re-created with the same ID.
 */
export function clearCloudTombstone(id: string): void {
  const current = getCloudTombstones();
  if (current[id]) {
    delete current[id];
    saveCloudTombstones(current);
  }
}

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
